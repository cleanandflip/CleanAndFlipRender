// Add-to-Cart button (restore green/hover-remove UX) from punch list
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { CART_QK, ADD_MUTATION_KEY, REMOVE_MUTATION_KEY } from '@/lib/cartKeys';
import { X } from 'lucide-react';

interface AddToCartButtonProps {
  productId: string;
  className?: string;
}

export default function AddToCartButton({ productId, className = "" }: AddToCartButtonProps) {
  const qc = useQueryClient();
  const cart = (qc.getQueryData(CART_QK) as any) ?? { items: [] };
  const inCart = !!cart.items?.some((i: any) => i.productId === productId);

  const add = useMutation({
    mutationKey: ADD_MUTATION_KEY,
    mutationFn: async () => {
      const r = await fetch('/api/cart/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, qty: 1 })
      });
      if (!r.ok) throw new Error('Add failed');
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: CART_QK })
  });

  const remove = useMutation({
    mutationKey: REMOVE_MUTATION_KEY,
    mutationFn: async () => {
      const r = await fetch(`/api/cart/items/${productId}`, { method: 'DELETE' });
      if (!r.ok) throw new Error('Remove failed');
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: CART_QK })
  });

  if (inCart) {
    return (
      <div className={`relative group ${className}`}>
        <button 
          className="btn bg-green-600 hover:bg-green-700 w-full text-white"
          data-testid={`button-in-cart-${productId}`}
        >
          In Cart
        </button>
        <button
          title="Remove from cart"
          onClick={() => remove.mutate()}
          className="absolute -right-2 -top-2 hidden group-hover:flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors"
          data-testid={`button-remove-cart-${productId}`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }
  
  return (
    <button 
      className={`btn bg-blue-600 hover:bg-blue-700 w-full text-white ${className}`}
      onClick={() => add.mutate()}
      disabled={add.isPending}
      data-testid={`button-add-cart-${productId}`}
    >
      {add.isPending ? 'Adding...' : 'Add to Cart'}
    </button>
  );
}