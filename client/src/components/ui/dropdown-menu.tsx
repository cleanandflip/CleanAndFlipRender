// DEPRECATED: This file exists for backward compatibility only.
// All new code should use StandardDropdown from @/components/ui

export { StandardDropdown as DropdownMenu } from './UnifiedDropdown';
export { StandardDropdown as DropdownMenuTrigger } from './UnifiedDropdown';
export const DropdownMenuContent = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
export const DropdownMenuItem = ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => <div onClick={onClick}>{children}</div>;
export const DropdownMenuSeparator = () => <div className="border-t my-1" />;