import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface PasswordInputProps {
  id: string;
  name: string;
  placeholder: string;
  required?: boolean;
  className?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

export function PasswordInput({
  id,
  name,
  placeholder,
  required = false,
  className,
  value,
  onChange,
  onFocus,
  onBlur,
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="relative">
      <Input
        id={id}
        name={name}
        type={showPassword ? "text" : "password"}
        placeholder={placeholder}
        required={required}
        className={className}
        value={value}
        onChange={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
        onClick={togglePasswordVisibility}
      >
        {showPassword ? (
          <EyeOff className="h-4 w-4 text-text-muted hover:text-text-secondary" />
        ) : (
          <Eye className="h-4 w-4 text-text-muted hover:text-text-secondary" />
        )}
      </Button>
    </div>
  );
}