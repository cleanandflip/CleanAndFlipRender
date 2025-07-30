// Unified UI Components - Single source of truth
export { WishlistButton } from './WishlistButton';
export { AddToCartButton } from '../AddToCartButton';
export { ProductPrice } from './ProductPrice';
export { StockIndicator } from './StockIndicator';
export { LoadingSpinner } from './LoadingSpinner';
export { QuantitySelector } from './QuantitySelector';
export { default as CardSkeleton } from './CardSkeleton';
export { AnimatedButton } from './AnimatedButton';

// Re-export existing shadcn components for convenience
export { Button } from './button';
export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card';
export { Badge } from './badge';
export { Input } from './input';
export { Label } from './label';
export { Textarea } from './textarea';
export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
export { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
export { Separator } from './separator';
export { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './dialog';
export { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from './drawer';