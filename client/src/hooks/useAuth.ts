import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const fetchUser = async () => {
  const res = await fetch("/api/user", { credentials: "include" });
  if (!res.ok) throw new Error("user fetch failed");
  const data = await res.json();
  // Normalize shape
  return { auth: !!data?.auth, user: data?.user || null };
};

export function useAuth() {
  const q = useQuery({
    queryKey: ["user"],
    queryFn: fetchUser,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: true,
    retry: false, // Don't retry auth failures
  });

  const loggedIn = !!q.data?.auth;
  const user = q.data?.user ?? null;
  return { ...q, loggedIn, user };
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await fetch("/api/logout", { method: "POST", credentials: "include" });
    },
    onSuccess: async () => {
      // Clear all cached user data and navigation state
      qc.removeQueries({ queryKey: ["user"], exact: false });
      localStorage.removeItem("nav_state");
      sessionStorage.clear();
      // Full reload ensures all in-memory state resets and cookie changes are applied
      window.location.assign("/");
    },
  });
}