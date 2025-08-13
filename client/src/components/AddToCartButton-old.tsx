import { useAddToCart } from '@/hooks/use-cart';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export function AddToCartButton({ productId, variantId }: { productId: string; variantId?: string | null }) {
  const { toast } = useToast();
  const { mutate, isPending } = useAddToCart();

  return (
    <Button
      disabled={isPending}
      onClick={() =>
        mutate(
          { productId, variantId: variantId ?? null, quantity: 1 },
          { onError: (e: any) => toast({ title: 'Add to cart failed', description: e?.message ?? 'Please try again.', variant: 'destructive' }) }
        )
      }
    >
      {isPending ? 'Adding…' : 'Add to cart'}
    </Button>
  );
}