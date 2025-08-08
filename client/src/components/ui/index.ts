// Unified UI Components - Single source of truth

export { AddToCartButton } from '../AddToCartButton';
export { ProductPrice } from './ProductPrice';
export { StockIndicator } from './StockIndicator';
export { LoadingSpinner } from './LoadingSpinner';
export { QuantitySelector } from './QuantitySelector';

// Re-export existing shadcn components for convenience
export { Button } from './button';
export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card';
export { Badge } from './badge';
export { Input } from './input';
export { Label } from './label';
export { Textarea } from './textarea';
// Legacy Select removed - use StandardDropdown instead
export { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
export { Separator } from './separator';
export { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './dialog';
export { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from './drawer';

// Central export for all dropdown components
export { StandardDropdown } from './UnifiedDropdown';
export { SearchNavDropdown } from './SearchNavDropdown';
export { GlobalDropdown, DropdownItem, DropdownLabel, DropdownSeparator } from './GlobalDropdown';
export type { DropdownOption } from './UnifiedDropdown';

// Backward compatibility exports
export { StandardDropdown as Dropdown } from './UnifiedDropdown';
export { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from './select';
export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from './dropdown-menu';