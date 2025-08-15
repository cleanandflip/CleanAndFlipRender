// Single source of truth for cart query keys - SSOT compatible
export const cartKeys = {
  all: ['cart'] as const,
  scoped: (ownerId: string, localityVersion: string) =>
    [...cartKeys.all, ownerId, localityVersion] as const,
};

export const CART_QK = ['cart'] as const;
export const ADD_MUTATION_KEY = ['cart:add'] as const;
export const REMOVE_MUTATION_KEY = ['cart:remove'] as const;
export const VALIDATE_MUTATION_KEY = ['cart:validate'] as const;