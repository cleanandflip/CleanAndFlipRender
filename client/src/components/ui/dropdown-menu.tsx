// DEPRECATED: This file exists for backward compatibility only.
// All new code should use UnifiedDropdown from @/components/ui

export { UnifiedDropdown as DropdownMenu } from './UnifiedDropdown';
export { UnifiedDropdown as DropdownMenuTrigger } from './UnifiedDropdown';
export const DropdownMenuContent = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
export const DropdownMenuItem = ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => <div onClick={onClick}>{children}</div>;
export const DropdownMenuSeparator = () => <div className="border-t my-1" />;