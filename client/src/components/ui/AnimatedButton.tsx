import { useState } from "react";
import { Button } from "@/components/ui/button";

interface AnimatedButtonProps {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export function AnimatedButton({ 
  children, 
  onClick, 
  variant = 'primary', 
  className = '', 
  disabled = false,
  type = 'button',
  ...props 
}: AnimatedButtonProps) {
  const [isClicked, setIsClicked] = useState(false);
  
  const handleClick = (e: React.MouseEvent) => {
    if (disabled) return;
    
    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 600);
    onClick?.(e);
  };
  
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-700 hover:bg-gray-600 text-white',
    ghost: 'bg-transparent hover:bg-gray-800 text-gray-300',
  };
  
  return (
    <button
      type={type}
      onClick={handleClick}
      disabled={disabled}
      className={`
        relative overflow-hidden
        px-4 py-2 rounded-lg font-medium
        transition-all duration-200
        hover:shadow-lg hover:scale-[1.02]
        active:scale-95
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${className}
        ${isClicked ? 'animate-bounce-subtle' : ''}
      `}
      {...props}
    >
      {children}
      {isClicked && !disabled && (
        <span className="absolute inset-0 animate-ripple bg-white/30 rounded-lg pointer-events-none" />
      )}
    </button>
  );
}