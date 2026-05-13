// GET /api/customer/introspect
//
// TIJDELIJKE route voor Fase 4 voorbereiding.
// Haalt de exacte veldnamen op uit de Customer Account API zodat we
// niet opnieuw tegen "field doesn't exist" lopen (zie Fase 2 § 5.4 —
// countryCodeV2 incident).
//
// Te verwijderen zodra Fase 4 ingebouwd is.
//
// Geeft een compacte JSON terug met:
//  - input types die we nodig hebben voor profiel/adres mutations
//  - object types (Customer, CustomerAddress) — welke velden bestaan
//  - alle mutation-namen + signatures die met "customer" beginnen
//
// Vereist een ingelogde sessie (gebruikt hetzelfde shcat_ token als
// /api/customer/me).

import {
  CUSTOMER_AUTH,
  COOKIES,
  parseCookies,
  callTokenEndpoint,
  buildAuthCookies,
  clearCookie,
  type VercelReq,
  type VercelRes,
} from '../_auth-helpers.js';

const QUERY = `
  query Introspect {
    customerUpdateInput: __type(name: "CustomerUpdateInput") {
      name
      kind
      inputFields {
        name
        type { ...TypeRef }
      }
    }
    customerAddressInput: __type(name: "CustomerAddressInput") {
      name
      kind
      inputFields {
        name
        type { ...TypeRef }
      }
    }
    customerType: __type(name: "Customer") {
      name
      kind
      fields {
        name
        args { name type { ...TypeRef } defaultValue }
        type { ...TypeRef }
      }
    }
    customerAddressType: __type(name: "CustomerAddress") {
      name
      kind
      fields {
        name
        type { ...TypeRef }
      }
    }
    mailingAddressType: __type(name: "MailingAddress") {
      name
      kind
      fields {
        name
        type { ...TypeRef }
      }
    }
    mutationType: __schema {
      mutationType {
        name
        fields {
          name
          args { name type { ...TypeRef } }
          type { ...TypeRef }
        }
      }
    }
  }

  fragment TypeRef on __Type {
    name
    kind
    ofType {
      name
      kind
      ofType {
        name
        kind
        ofType { name kind }
      }
    }
  }
`;

export default async function handler(req: VercelReq, res: VercelRes) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const cookies = parseCookies(req.headers.cookie as string | undefined);
  let accessToken = cookies[COOKIES.access];
  const refreshToken = cookies[COOKIES.refresh];

  if (!accessToken && !refreshToken) {
    res.status(401).json({ error: 'Not logged in. Log in first on /account, then visit this URL again.' });
    return;
  }

  let response = accessToken ? await callGraphql(accessToken, QUERY) : null;
  let setCookies: string[] = [];

  if ((!response || response.status === 401) && refreshToken) {
    try {
      const fresh = await callTokenEndpoint(
        new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: CUSTOMER_AUTH.clientId,
          refresh_token: refreshToken,
        }),
        CUSTOMER_AUTH.tokenUrl,
      );
      accessToken = fresh.access_token;
      setCookies = buildAuthCookies(fresh);
      response = await callGraphql(accessToken, QUERY);
    } catch {
      res.setHeader('Set-Cookie', [
        clearCookie(COOKIES.access),
        clearCookie(COOKIES.refresh),
        clearCookie(COOKIES.session),
      ]);
      res.status(401).json({ error: 'Session expired' });
      return;
    }
  }

  if (!response || !response.ok) {
    const detail = response ? await response.text() : 'no response';
    res.status(response?.status ?? 502).json({
      error: 'Introspection request failed',
      detail,
    });
    return;
  }

  const data = (await response.json()) as { data?: unknown; errors?: unknown };
  if (data.errors) {
    res.status(502).json({ error: 'GraphQL error', detail: data.errors });
    return;
  }

  if (setCookies.length > 0) res.setHeader('Set-Cookie', setCookies);

  const dataAny = data.data as Record<string, unknown> | undefined;
  const mutationsRaw = (dataAny?.mutationType as { mutationType?: { fields?: Array<{ name: string }> } } | undefined)
    ?.mutationType?.fields;
  const customerMutations = Array.isArray(mutationsRaw)
    ? mutationsRaw.filter((f) => /^customer/i.test(f.name))
    : [];

  res.status(200).json({
    note: 'Customer Account API schema introspection — Fase 4 voorbereiding',
    customerUpdateInput: dataAny?.customerUpdateInput ?? null,
    customerAddressInput: dataAny?.customerAddressInput ?? null,
    customerType: dataAny?.customerType ?? null,
    customerAddressType: dataAny?.customerAddressType ?? null,
    mailingAddressType: dataAny?.mailingAddressType ?? null,
    customerMutations,
  });
}

function callGraphql(accessToken: string, query: string): Promise<Response> {
  return fetch(CUSTOMER_AUTH.graphqlUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: accessToken,
    },
    body: JSON.stringify({ query }),
  });
}
