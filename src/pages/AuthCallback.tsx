import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';

// Handles the OAuth redirect back from Shopify.
// URL shape: /auth/callback?code=...&state=...
//
// Posts the code+state to /api/auth/exchange which validates them
// (CSRF state check + PKCE verifier) and sets the session cookies.
// On success, navigates to the returnTo path that was bundled into state.

export default function AuthCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const code = params.get('code');
  const state = params.get('state');
  const oauthError = params.get('error');

  useEffect(() => {
    if (oauthError) {
      setError(decodeURIComponent(params.get('error_description') ?? oauthError));
      return;
    }
    if (!code || !state) {
      setError('Ongeldige callback — code of state ontbreekt.');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/auth/exchange', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ code, state }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.error ?? `Exchange failed (${res.status})`);
        }
        const data = (await res.json()) as { returnTo?: string };
        const fallback = data.returnTo ?? '/account';

        // Determine the landing page: fresh accounts go through the
        // onboarding screen at /welkom so the first checkout has a name
        // and address ready. Existing customers keep their original
        // returnTo behavior.
        let target = fallback;
        if (fallback === '/account' || fallback === '/' || fallback === '') {
          try {
            const meRes = await fetch('/api/customer/me', { credentials: 'same-origin' });
            if (meRes.ok) {
              const me = (await meRes.json()) as {
                firstName?: string | null;
                lastName?: string | null;
                addresses?: { edges: unknown[] };
              } | null;
              const isFresh =
                !!me &&
                !me.firstName &&
                !me.lastName &&
                (!me.addresses?.edges || me.addresses.edges.length === 0);
              if (isFresh) target = '/welkom';
            }
          } catch {
            // If the /me probe fails just fall through to the default
            // returnTo — onboarding is non-critical.
          }
        }

        if (!cancelled) {
          // Hard reload so CustomerProvider picks up the new session cookie.
          window.location.replace(target);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Inloggen mislukt');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code, state, oauthError, params]);

  if (error) {
    return (
      <div className="mx-auto max-w-[480px] px-4 py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-2xl font-extrabold text-[var(--color-navy)] mb-2" style={{ fontFamily: 'Montserrat' }}>
          Inloggen mislukt
        </h1>
        <p className="text-sm text-[var(--color-muted)] mb-6">{error}</p>
        <button onClick={() => navigate('/account')} className="btn-secondary py-3 px-6">
          Terug naar account
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[480px] px-4 py-12 text-center">
      <Loader2 className="w-8 h-8 text-[var(--color-primary)] animate-spin mx-auto mb-4" />
      <p className="text-sm text-[var(--color-muted)]">Inloggen afronden...</p>
    </div>
  );
}
