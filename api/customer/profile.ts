// POST /api/customer/profile
//
// Updates the logged-in customer's profile (firstName, lastName).
// Customer Account API does NOT permit changes to emailAddress or
// phoneNumber via this mutation — those require Shopify-side action.
//
// Request body: { firstName?: string, lastName?: string }
// Response: 200 { customer: {...} } | 422 { userErrors: [...] }

import { runCustomerGraphql, type UserError } from '../_customer-graphql.js';
import { type VercelReq, type VercelRes } from '../_auth-helpers.js';

const MUTATION = `
  mutation UpdateProfile($input: CustomerUpdateInput!) {
    customerUpdate(input: $input) {
      customer {
        id
        firstName
        lastName
        displayName
      }
      userErrors {
        field
        message
        code
      }
    }
  }
`;

interface Body {
  firstName?: unknown;
  lastName?: unknown;
}

interface MutationData {
  customerUpdate?: {
    customer?: {
      id: string;
      firstName: string | null;
      lastName: string | null;
      displayName: string;
    } | null;
    userErrors?: UserError[];
  };
}

export default async function handler(req: VercelReq, res: VercelRes) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const body = (req.body ?? {}) as Body;
  const input: Record<string, string> = {};
  if (typeof body.firstName === 'string') input.firstName = body.firstName.trim();
  if (typeof body.lastName === 'string') input.lastName = body.lastName.trim();

  if (Object.keys(input).length === 0) {
    res.status(400).json({ error: 'Geen wijzigbare velden in body (firstName, lastName).' });
    return;
  }

  const result = await runCustomerGraphql<MutationData>(req, res, MUTATION, { input });
  if (result.responded) return;

  const payload = result.data?.customerUpdate;
  if (payload?.userErrors && payload.userErrors.length > 0) {
    res.status(422).json({ userErrors: payload.userErrors });
    return;
  }

  res.status(200).json({ customer: payload?.customer ?? null });
}
