import { useMutation, useQueryClient } from '@tanstack/react-query';

// Helper to normalize pending state across RQ v4/v5
const isPending = (m?: any) => Boolean(m?.isPending ?? m?.isLoading);

function oauthRedirect(provider: 'github' | 'google' | 'discord') {
  return {
    start: () => { window.location.assign(`/api/auth/${provider}`); },
    // OAuth is a redirect; nothing is "pending" in-app
    isPending: false
  };
}

export function useAuthActions() {
  const qc = useQueryClient();

  // Email/password login mutation
  const emailLogin = useMutation({
    mutationFn: async (payload: { email: string; password?: string }) => {
      const r = await fetch('/api/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!r.ok) throw new Error('Login failed');
      return r.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['auth'] }),
  });

  // Email/password registration mutation
  const emailRegister = useMutation({
    mutationFn: async (payload: { email: string; password: string; firstName?: string; lastName?: string }) => {
      const r = await fetch('/api/register', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!r.ok) throw new Error('Registration failed');
      return r.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['auth'] }),
  });

  // Expose a uniform shape the Auth page can consume
  return {
    emailLogin,
    emailRegister,
    github: oauthRedirect('github'),
    google: oauthRedirect('google'),
    discord: oauthRedirect('discord'),
    // for convenience in the page:
    isBusy: () => isPending(emailLogin) || isPending(emailRegister)
  };
}