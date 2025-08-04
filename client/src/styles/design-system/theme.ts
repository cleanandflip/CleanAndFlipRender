// Global Design System - Clean & Flip
export const globalDesignSystem = {
  // Core Color Palette (matching current website)
  colors: {
    // Primary Background Colors
    bg: {
      primary: '#1A1F2E',        // Main dark navy background
      secondary: '#232937',      // Slightly lighter for cards/sections
      tertiary: '#2D3548',       // Hover states and elevated surfaces
      overlay: 'rgba(0, 0, 0, 0.6)',
      gradient: 'linear-gradient(135deg, #1A1F2E 0%, #232937 100%)'
    },
    
    // Text Hierarchy
    text: {
      primary: '#FFFFFF',        // Main headings, important text
      secondary: '#E2E8F0',      // Body text, descriptions
      muted: '#94A3B8',          // Subtle text, labels
      disabled: '#64748B',       // Disabled states
      inverse: '#1A1F2E'         // Text on light backgrounds
    },
    
    // Brand Colors
    brand: {
      blue: '#3B82F6',          // Primary blue (CTA buttons)
      blueHover: '#2563EB',
      blueLight: 'rgba(59, 130, 246, 0.1)',
      green: '#10B981',         // Success green (cash offer button)
      greenHover: '#059669',
      greenLight: 'rgba(16, 185, 129, 0.1)',
      purple: '#8B5CF6',        // Purple accent
      purpleHover: '#7C3AED',
      purpleLight: 'rgba(139, 92, 246, 0.1)'
    },
    
    // Functional Colors
    status: {
      info: '#3B82F6',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      neutral: '#6B7280'
    },
    
    // Border & Divider Colors
    border: {
      default: 'rgba(255, 255, 255, 0.08)',
      hover: 'rgba(255, 255, 255, 0.12)',
      focus: 'rgba(59, 130, 246, 0.5)',
      divider: 'rgba(255, 255, 255, 0.06)'
    }
  },
  
  // Typography System
  typography: {
    fonts: {
      sans: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif',
      mono: '"SF Mono", "Monaco", "Inconsolata", monospace'
    },
    
    // Font Sizes with line heights
    sizes: {
      xs: { size: '0.75rem', lineHeight: '1rem' },
      sm: { size: '0.875rem', lineHeight: '1.25rem' },
      base: { size: '1rem', lineHeight: '1.5rem' },
      lg: { size: '1.125rem', lineHeight: '1.75rem' },
      xl: { size: '1.25rem', lineHeight: '1.75rem' },
      '2xl': { size: '1.5rem', lineHeight: '2rem' },
      '3xl': { size: '1.875rem', lineHeight: '2.25rem' },
      '4xl': { size: '2.25rem', lineHeight: '2.5rem' }
    },
    
    // Font Weights
    weights: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    }
  },
  
  // Spacing Scale
  spacing: {
    0: '0',
    1: '0.25rem',
    2: '0.5rem',
    3: '0.75rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    8: '2rem',
    10: '2.5rem',
    12: '3rem',
    16: '4rem',
    20: '5rem'
  },
  
  // Border Radius
  radius: {
    none: '0',
    sm: '0.25rem',
    base: '0.5rem',
    md: '0.75rem',
    lg: '1rem',
    xl: '1.5rem',
    full: '9999px'
  },
  
  // Shadows & Glows
  effects: {
    shadows: {
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
      base: '0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      xl: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
    },
    
    glows: {
      blue: '0 0 0 3px rgba(59, 130, 246, 0.1)',
      green: '0 0 0 3px rgba(16, 185, 129, 0.1)',
      subtle: '0 0 20px rgba(59, 130, 246, 0.15)'
    }
  },
  
  // Animation Presets
  animations: {
    duration: {
      instant: '100ms',
      fast: '200ms',
      normal: '300ms',
      slow: '500ms'
    },
    
    easing: {
      default: 'cubic-bezier(0.4, 0, 0.2, 1)',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
    }
  }
};