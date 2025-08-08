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
export { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
export { Separator } from './separator';
export { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './dialog';
export { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from './drawer';

// UNIFIED DROPDOWN SYSTEM - Complete replacement of all legacy dropdowns
export { UnifiedDropdown, StandardDropdown, NavDropdown, GhostDropdown } from './UnifiedDropdown';
export { UnifiedSearch } from './UnifiedSearch';
export type { DropdownOption } from './UnifiedDropdown';

// Backward compatibility exports
export { StandardDropdown as Dropdown } from './UnifiedDropdown';