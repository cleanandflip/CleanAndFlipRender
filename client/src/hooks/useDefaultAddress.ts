import { useMemo } from "react";

export function useDefaultAddress(user: any, addresses: any[]) {
  const pid = user?.profile_address_id ?? user?.profileAddress?.id ?? null;
  return useMemo(() => {
    const list = Array.isArray(addresses) ? addresses : [];
    return (pid && list.find(a => a.id === pid)) ||
           list.find(a => a.is_default) ||
           user?.profileAddress ||
           null;
  }, [pid, addresses, user?.profileAddress]);
}