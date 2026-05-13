// /api/customer/address
//
// Method routing:
//  POST   /api/customer/address               → create
//  PUT    /api/customer/address?id=<gid>      → update (incl. set-default via defaultAddress flag)
//  DELETE /api/customer/address?id=<gid>      → delete
//
// Body for create/update:
// {
//   firstName?, lastName?, company?,
//   address1?, address2?, city?, zip?,
//   territoryCode? (ISO-2),
//   zoneCode? (province code),
//   phoneNumber?,
//   defaultAddress?: boolean   // create: also mark as default
//                              // update: switch default to this address
// }
//
// Responses:
//   200 { customerAddress: {...} } | 200 { deletedAddressId: "..." }
//   422 { userErrors: [...] }
//   400 { error: "..." }

import { runCustomerGraphql, type UserError } from '../_customer-graphql.js';
import { type VercelReq, type VercelRes } from '../_auth-helpers.js';

const ADDRESS_FRAGMENT = `
  fragment AddressFields on CustomerAddress {
    id
    firstName
    lastName
    company
    address1
    address2
    city
    zip
    province
    zoneCode
    country
    territoryCode
    phoneNumber
    formatted
  }
`;

const CREATE_MUTATION = `
  mutation CreateAddress($address: CustomerAddressInput!, $defaultAddress: Boolean) {
    customerAddressCreate(address: $address, defaultAddress: $defaultAddress) {
      customerAddress { ...AddressFields }
      userErrors { field message code }
    }
  }
  ${ADDRESS_FRAGMENT}
`;

const UPDATE_MUTATION = `
  mutation UpdateAddress($addressId: ID!, $address: CustomerAddressInput, $defaultAddress: Boolean) {
    customerAddressUpdate(addressId: $addressId, address: $address, defaultAddress: $defaultAddress) {
      customerAddress { ...AddressFields }
      userErrors { field message code }
    }
  }
  ${ADDRESS_FRAGMENT}
`;

const DELETE_MUTATION = `
  mutation DeleteAddress($addressId: ID!) {
    customerAddressDelete(addressId: $addressId) {
      deletedAddressId
      userErrors { field message code }
    }
  }
`;

interface AddressBody {
  firstName?: unknown;
  lastName?: unknown;
  company?: unknown;
  address1?: unknown;
  address2?: unknown;
  city?: unknown;
  zip?: unknown;
  territoryCode?: unknown;
  zoneCode?: unknown;
  phoneNumber?: unknown;
  defaultAddress?: unknown;
}

interface CreatePayload {
  customerAddressCreate?: {
    customerAddress?: Record<string, unknown> | null;
    userErrors?: UserError[];
  };
}

interface UpdatePayload {
  customerAddressUpdate?: {
    customerAddress?: Record<string, unknown> | null;
    userErrors?: UserError[];
  };
}

interface DeletePayload {
  customerAddressDelete?: {
    deletedAddressId?: string | null;
    userErrors?: UserError[];
  };
}

export default async function handler(req: VercelReq, res: VercelRes) {
  switch (req.method) {
    case 'POST':
      return handleCreate(req, res);
    case 'PUT':
      return handleUpdate(req, res);
    case 'DELETE':
      return handleDelete(req, res);
    default:
      res.status(405).json({ error: 'Method not allowed' });
      return;
  }
}

// ---------- Create ----------

async function handleCreate(req: VercelReq, res: VercelRes) {
  const body = (req.body ?? {}) as AddressBody;
  const address = pickAddressFields(body);
  if (Object.keys(address).length === 0) {
    res.status(400).json({ error: 'Geen adresvelden in body.' });
    return;
  }
  const defaultAddress = typeof body.defaultAddress === 'boolean' ? body.defaultAddress : undefined;

  const result = await runCustomerGraphql<CreatePayload>(req, res, CREATE_MUTATION, {
    address,
    defaultAddress,
  });
  if (result.responded) return;

  const payload = result.data?.customerAddressCreate;
  if (payload?.userErrors && payload.userErrors.length > 0) {
    res.status(422).json({ userErrors: payload.userErrors });
    return;
  }
  res.status(200).json({ customerAddress: payload?.customerAddress ?? null });
}

// ---------- Update ----------

async function handleUpdate(req: VercelReq, res: VercelRes) {
  const addressId = readAddressId(req);
  if (!addressId) {
    res.status(400).json({ error: 'Ontbrekend ?id=<gid> query parameter.' });
    return;
  }
  const body = (req.body ?? {}) as AddressBody;
  const address = pickAddressFields(body);
  const defaultAddress = typeof body.defaultAddress === 'boolean' ? body.defaultAddress : undefined;

  // It's valid to call update with only `defaultAddress: true` and no
  // address fields — that just toggles which address is default.
  if (Object.keys(address).length === 0 && defaultAddress === undefined) {
    res.status(400).json({ error: 'Geen velden om bij te werken (adresvelden of defaultAddress).' });
    return;
  }

  const variables: Record<string, unknown> = { addressId };
  if (Object.keys(address).length > 0) variables.address = address;
  if (defaultAddress !== undefined) variables.defaultAddress = defaultAddress;

  const result = await runCustomerGraphql<UpdatePayload>(req, res, UPDATE_MUTATION, variables);
  if (result.responded) return;

  const payload = result.data?.customerAddressUpdate;
  if (payload?.userErrors && payload.userErrors.length > 0) {
    res.status(422).json({ userErrors: payload.userErrors });
    return;
  }
  res.status(200).json({ customerAddress: payload?.customerAddress ?? null });
}

// ---------- Delete ----------

async function handleDelete(req: VercelReq, res: VercelRes) {
  const addressId = readAddressId(req);
  if (!addressId) {
    res.status(400).json({ error: 'Ontbrekend ?id=<gid> query parameter.' });
    return;
  }
  const result = await runCustomerGraphql<DeletePayload>(req, res, DELETE_MUTATION, { addressId });
  if (result.responded) return;

  const payload = result.data?.customerAddressDelete;
  if (payload?.userErrors && payload.userErrors.length > 0) {
    res.status(422).json({ userErrors: payload.userErrors });
    return;
  }
  res.status(200).json({ deletedAddressId: payload?.deletedAddressId ?? null });
}

// ---------- Utility ----------

function pickAddressFields(body: AddressBody): Record<string, string> {
  const out: Record<string, string> = {};
  const stringFields = [
    'firstName',
    'lastName',
    'company',
    'address1',
    'address2',
    'city',
    'zip',
    'territoryCode',
    'zoneCode',
    'phoneNumber',
  ] as const;
  for (const f of stringFields) {
    const v = body[f];
    if (typeof v === 'string') {
      const trimmed = v.trim();
      // Empty string clears the field, but the Customer Account API
      // sometimes rejects "" for required-ish fields. Pass it through as-is
      // and let userErrors surface what isn't allowed.
      out[f] = trimmed;
    }
  }
  return out;
}

function readAddressId(req: VercelReq): string | null {
  // Vercel parses query into req.query (string | string[]). Fall back to
  // raw URL when running outside that runtime.
  const q = req.query?.id;
  if (typeof q === 'string') return q;
  if (Array.isArray(q) && typeof q[0] === 'string') return q[0];
  if (req.url) {
    try {
      const url = new URL(req.url, 'http://localhost');
      const id = url.searchParams.get('id');
      if (id) return id;
    } catch {
      // ignore
    }
  }
  return null;
}
