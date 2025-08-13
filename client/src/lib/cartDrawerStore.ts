/**
 * Cart Drawer Store - Unified cart drawer state management
 * Single source of truth for cart drawer open/close state as per fix plan
 */

import { create } from 'zustand';

interface CartDrawerStore {
  open: boolean;
  openIt: () => void;
  close: () => void;
}

export const useCartDrawer = create<CartDrawerStore>((set) => ({
  open: false,
  openIt: () => set({ open: true }),
  close: () => set({ open: false }),
}));

export default useCartDrawer;