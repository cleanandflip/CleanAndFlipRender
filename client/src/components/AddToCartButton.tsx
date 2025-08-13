import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Check, Loader2 } from 'lucide-react';

interface AddToCartButtonProps {
  productId: string;
  inCart?: boolean;
  quantity?: number;
  variant?: 'default' | 'compact';
  className?: string;
}

export default function AddToCartButton({ 
  productId, 
  inCart: propInCart,
  quantity = 1,
  variant = 'default',
  className = ''
}: AddToCartButtonProps) {
  const queryClient = useQueryClient();
  const [hover, setHover] = useState(false);
  const [localInCart, setLocalInCart] = useState(propInCart ?? false);

  // Check if item is in cart from query data
  useEffect(() => {
    if (propInCart === undefined) {
      const cartData = queryClient.getQueryData(['cart']) as any;
      const items = cartData?.items ?? [];
      setLocalInCart(items.some((item: any) => item.productId === productId));
    } else {
      setLocalInCart(propInCart);
    }
  }, [productId, propInCart, queryClient]);

  const addMutation = useMutation({
    mutationKey: ['cart:add', productId],
    mutationFn: () => apiRequest('/api/cart', {
      method: 'POST',
      body: { productId, quantity }
    }),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['cart'] });
      const prev = queryClient.getQueryData<any>(['cart']);
      
      // Optimistic update
      queryClient.setQueryData(['cart'], (old: any) => {
        const items = old?.items ?? [];
        const existing = items.find((item: any) => item.productId === productId);
        
        if (existing) {
          return {
            ...old,
            items: items.map((item: any) => 
              item.productId === productId 
                ? { ...item, quantity: item.quantity + quantity }
                : item
            )
          };
        } else {
          return {
            ...old,
            items: [...items, { 
              id: `temp-${Date.now()}`, 
              productId, 
              quantity,
              price: 0,
              name: 'Adding...'
            }]
          };
        }
      });
      
      setLocalInCart(true);
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['cart'], ctx.prev);
      setLocalInCart(false);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['cart'] })
  });

  const removeMutation = useMutation({
    mutationKey: ['cart:remove', productId],
    mutationFn: () => apiRequest(`/api/cart/remove/${productId}`, { method: 'DELETE' }),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['cart'] });
      const prev = queryClient.getQueryData<any>(['cart']);
      
      queryClient.setQueryData(['cart'], (old: any) => ({
        ...old,
        items: (old?.items ?? []).filter((item: any) => item.productId !== productId)
      }));
      
      setLocalInCart(false);
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['cart'], ctx.prev);
      setLocalInCart(true);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['cart'] })
  });

  const busy = addMutation.isPending || removeMutation.isPending;
  const active = localInCart || addMutation.isSuccess;

  const handleClick = () => {
    if (active && hover) {
      removeMutation.mutate();
    } else if (!active) {
      addMutation.mutate();
    }
  };

  const buttonText = active ? (hover ? '✖ Remove' : 'In Cart') : 'Add to Cart';
  const buttonClass = active 
    ? (hover ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700')
    : 'bg-blue-600 hover:bg-blue-700';

  if (variant === 'compact') {
    return (
      <Button
        size="sm"
        disabled={busy}
        onClick={handleClick}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        className={`${buttonClass} text-white ${className}`}
        title={buttonText}
      >
        {busy ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : active ? (
          hover ? '✖' : <Check className="w-4 h-4" />
        ) : (
          <ShoppingCart className="w-4 h-4" />
        )}
      </Button>
    );
  }

  return (
    <Button
      disabled={busy}
      onClick={handleClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={`${buttonClass} text-white ${className}`}
      title={buttonText}
    >
      {busy ? (
        <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Adding...</>
      ) : active ? (
        hover ? (
          <><span className="mr-2">✖</span> Remove</>
        ) : (
          <><Check className="w-4 h-4 mr-2" /> In Cart</>
        )
      ) : (
        <><ShoppingCart className="w-4 h-4 mr-2" /> Add to Cart</>
      )}
    </Button>
  );
}