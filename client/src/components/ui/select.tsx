// DEPRECATED: This file exists for backward compatibility only.
// All new code should use StandardDropdown from @/components/ui

export { StandardDropdown as Select } from './UnifiedDropdown';
export { StandardDropdown as SelectTrigger } from './UnifiedDropdown';
export const SelectContent = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
export const SelectItem = ({ children, value }: { children: React.ReactNode; value?: string }) => <div data-value={value}>{children}</div>;
export const SelectValue = ({ placeholder }: { placeholder?: string }) => <div>{placeholder}</div>;