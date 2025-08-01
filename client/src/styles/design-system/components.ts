// client/src/styles/design-system/components.ts - Reusable component classes

import { globalDesignSystem } from './theme';

export const componentClasses = {
  // Button Variants
  buttons: {
    primary: `
      bg-[#3B82F6] hover:bg-[#2563EB] text-white
      px-4 py-2 rounded-lg font-medium
      transition-all duration-200
      border border-transparent
      shadow-md hover:shadow-lg
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900
      disabled:opacity-50 disabled:cursor-not-allowed
    `,
    
    secondary: `
      bg-[#232937] hover:bg-[#2D3548] text-white
      px-4 py-2 rounded-lg font-medium
      transition-all duration-200
      border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.12)]
      shadow-sm hover:shadow-md
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900
      disabled:opacity-50 disabled:cursor-not-allowed
    `,
    
    success: `
      bg-[#10B981] hover:bg-[#059669] text-white
      px-4 py-2 rounded-lg font-medium
      transition-all duration-200
      border border-transparent
      shadow-md hover:shadow-lg
      focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900
      disabled:opacity-50 disabled:cursor-not-allowed
    `,
    
    ghost: `
      bg-transparent hover:bg-[rgba(255,255,255,0.05)] text-[#E2E8F0]
      px-4 py-2 rounded-lg font-medium
      transition-all duration-200
      border border-transparent hover:border-[rgba(255,255,255,0.08)]
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900
      disabled:opacity-50 disabled:cursor-not-allowed
    `,
    
    danger: `
      bg-[#EF4444] hover:bg-[#DC2626] text-white
      px-4 py-2 rounded-lg font-medium
      transition-all duration-200
      border border-transparent
      shadow-md hover:shadow-lg
      focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900
      disabled:opacity-50 disabled:cursor-not-allowed
    `
  },
  
  // Card Variants
  cards: {
    glass: `
      bg-[rgba(35,41,55,0.7)] backdrop-blur-md
      border border-[rgba(255,255,255,0.08)]
      rounded-xl shadow-lg
      transition-all duration-300
      hover:border-[rgba(255,255,255,0.12)]
      hover:shadow-xl
    `,
    
    solid: `
      bg-[#232937]
      border border-[rgba(255,255,255,0.08)]
      rounded-xl shadow-md
      transition-all duration-300
      hover:border-[rgba(255,255,255,0.12)]
      hover:shadow-lg
    `,
    
    elevated: `
      bg-[#2D3548]
      border border-[rgba(255,255,255,0.12)]
      rounded-xl shadow-lg
      transition-all duration-300
      hover:border-[rgba(255,255,255,0.16)]
      hover:shadow-xl
    `
  },
  
  // Input Variants
  inputs: {
    base: `
      bg-[rgba(35,41,55,0.7)] backdrop-blur-md
      border border-[rgba(255,255,255,0.08)]
      rounded-lg px-3 py-2
      text-white placeholder-[#94A3B8]
      transition-all duration-200
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
      hover:border-[rgba(255,255,255,0.12)]
      disabled:opacity-50 disabled:cursor-not-allowed
    `,
    
    search: `
      bg-[rgba(35,41,55,0.7)] backdrop-blur-md
      border border-[rgba(255,255,255,0.08)]
      rounded-full px-4 py-2 pl-10
      text-white placeholder-[#94A3B8]
      transition-all duration-200
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
      hover:border-[rgba(255,255,255,0.12)]
    `
  },
  
  // Badge Variants
  badges: {
    default: `
      bg-[rgba(59,130,246,0.1)] text-[#3B82F6]
      px-2 py-1 rounded-full text-xs font-medium
      border border-[rgba(59,130,246,0.2)]
    `,
    
    success: `
      bg-[rgba(16,185,129,0.1)] text-[#10B981]
      px-2 py-1 rounded-full text-xs font-medium
      border border-[rgba(16,185,129,0.2)]
    `,
    
    warning: `
      bg-[rgba(245,158,11,0.1)] text-[#F59E0B]
      px-2 py-1 rounded-full text-xs font-medium
      border border-[rgba(245,158,11,0.2)]
    `,
    
    error: `
      bg-[rgba(239,68,68,0.1)] text-[#EF4444]
      px-2 py-1 rounded-full text-xs font-medium
      border border-[rgba(239,68,68,0.2)]
    `,
    
    neutral: `
      bg-[rgba(107,114,128,0.1)] text-[#6B7280]
      px-2 py-1 rounded-full text-xs font-medium
      border border-[rgba(107,114,128,0.2)]
    `
  },
  
  // Text Variants
  text: {
    heading: `text-white font-semibold`,
    subheading: `text-[#E2E8F0] font-medium`,
    body: `text-[#E2E8F0]`,
    muted: `text-[#94A3B8]`,
    small: `text-[#94A3B8] text-sm`
  },
  
  // Layout Helpers
  layout: {
    container: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`,
    section: `py-12 lg:py-16`,
    grid: `grid gap-6`,
    flex: `flex items-center justify-between`,
    flexCol: `flex flex-col space-y-4`
  },
  
  // Animation Classes
  animations: {
    fadeIn: `animate-fade-in`,
    slideUp: `animate-slide-up`,
    scaleIn: `animate-scale-in`,
    bounce: `animate-bounce-in`,
    glow: `animate-glow`
  }
};

// Utility function to combine classes
export const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

// Component class builders
export const buildButtonClass = (variant: keyof typeof componentClasses.buttons = 'primary', size: 'sm' | 'base' | 'lg' = 'base') => {
  const baseClass = componentClasses.buttons[variant];
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    base: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg'
  };
  
  return cn(baseClass, sizeClasses[size]);
};

export const buildCardClass = (variant: keyof typeof componentClasses.cards = 'glass', padding: 'sm' | 'base' | 'lg' = 'base') => {
  const baseClass = componentClasses.cards[variant];
  const paddingClasses = {
    sm: 'p-4',
    base: 'p-6',
    lg: 'p-8'
  };
  
  return cn(baseClass, paddingClasses[padding]);
};