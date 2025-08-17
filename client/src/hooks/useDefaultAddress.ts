import { useMemo } from "react";

export function useDefaultAddress(user: any, addresses: any[]) {
  // REMOVED: profile_address_id - using SSOT address system
  const pid = user?.profileAddress?.id ?? null;
  return useMemo(() => {
    const list = Array.isArray(addresses) ? addresses : [];
    return (pid && list.find(a => a.id === pid)) ||
           list.find(a => a.is_default) ||
           user?.profileAddress ||
           null;
  }, [pid, addresses, user?.profileAddress]);
}