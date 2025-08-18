import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

type AuthResponse = {
  authenticated: boolean;
  user: any | null;
  session?: { id?: string; guest?: boolean };
};

const fetchUser = async (): Promise<AuthResponse> => {
  const res = await fetch('/api/user', {
    credentials: 'include',
    headers: { 'Accept': 'application/json', 'Cache-Control': 'no-cache' },
    cache: 'no-store',
  });
  // Your API always returns 200; parse and use the flag:
  return res.json();
};

export function useAuth() {
  return useQuery({
    queryKey: ['auth'],
    queryFn: fetchUser,
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: false,
  });
}

export function useLogout() {
  const qc = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async () => {
      const r = await fetch('/api/logout', { method: 'POST', credentials: 'include' });
      if (!r.ok) throw new Error('Logout failed');
      return r.json();
    },
    onSuccess: () => {
      qc.setQueryData(['auth'], { authenticated: false, user: null });
      qc.invalidateQueries({ queryKey: ['auth'] });
      // clear any UI state that can spoof "logged in"
      localStorage.removeItem('cartOwnerId');
      localStorage.removeItem('cf_address');
      localStorage.removeItem('user');
      sessionStorage.clear();
      
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
      
      // hard reload to ensure a clean slate
      window.location.assign('/');
    },
    onError: (error) => {
      toast({
        title: "Logout error", 
        description: "There was an issue signing out. Please try again.",
        variant: "destructive"
      });
    }
  });
}