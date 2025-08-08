// DEPRECATED: This file exists for backward compatibility only.
// All new code should use UnifiedDropdown from @/components/ui

export { UnifiedDropdown as Select } from './UnifiedDropdown';
export { UnifiedDropdown as SelectTrigger } from './UnifiedDropdown';
export const SelectContent = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
export const SelectItem = ({ children, value }: { children: React.ReactNode; value?: string }) => <div data-value={value}>{children}</div>;
export const SelectValue = ({ placeholder }: { placeholder?: string }) => <div>{placeholder}</div>;