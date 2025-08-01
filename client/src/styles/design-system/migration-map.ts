// client/src/styles/design-system/migration-map.ts

export const colorMigrationMap = {
  // Map old colors to new theme colors
  '#1a1f2e': 'var(--color-bg-primary)',
  '#232937': 'var(--color-bg-secondary)',
  '#2d3548': 'var(--color-bg-tertiary)',
  '#ffffff': 'var(--color-text-primary)',
  '#e2e8f0': 'var(--color-text-secondary)',
  '#94a3b8': 'var(--color-text-muted)',
  '#3b82f6': 'var(--color-brand-blue)',
  '#10b981': 'var(--color-brand-green)',
  
  // Map old Tailwind classes to new design system classes
  'bg-gray-900': 'bg-[var(--color-bg-primary)]',
  'bg-gray-800': 'bg-[var(--color-bg-secondary)]',
  'bg-gray-700': 'bg-[var(--color-bg-tertiary)]',
  'text-white': 'text-[var(--color-text-primary)]',
  'text-gray-300': 'text-[var(--color-text-secondary)]',
  'text-gray-400': 'text-[var(--color-text-muted)]',
  'border-gray-700': 'border-[var(--color-border-default)]',
  'border-gray-600': 'border-[var(--color-border-hover)]',
  
  // Button color mappings
  'bg-blue-600': 'bg-[var(--color-brand-blue)]',
  'hover:bg-blue-700': 'hover:bg-[var(--color-brand-blue-hover)]',
  'bg-green-600': 'bg-[var(--color-brand-green)]',
  'hover:bg-green-700': 'hover:bg-[var(--color-brand-green-hover)]'
};

export const componentMigrationMap = {
  // Old component patterns to new design system
  'glass': 'bg-[rgba(35,41,55,0.7)] backdrop-blur-md border border-[rgba(255,255,255,0.08)]',
  'glass-border': 'border-[rgba(255,255,255,0.08)]',
  'text-muted': 'text-[var(--color-text-muted)]',
  'accent-blue': 'var(--color-brand-blue)',
  'hover:bg-blue-600': 'hover:bg-[var(--color-brand-blue-hover)]'
};

// Safe migration patterns for find & replace
export const safeMigrationPatterns = [
  // Step 1: Background colors (safest)
  {
    find: /bg-gray-900/g,
    replace: 'bg-[var(--color-bg-primary)]',
    description: 'Replace main background color'
  },
  {
    find: /bg-gray-800/g,
    replace: 'bg-[var(--color-bg-secondary)]',
    description: 'Replace secondary background color'
  },
  
  // Step 2: Text colors
  {
    find: /text-white(?!\-)/g,
    replace: 'text-[var(--color-text-primary)]',
    description: 'Replace primary text color'
  },
  {
    find: /text-gray-300/g,
    replace: 'text-[var(--color-text-secondary)]',
    description: 'Replace secondary text color'
  },
  
  // Step 3: Border colors
  {
    find: /border-gray-700/g,
    replace: 'border-[var(--color-border-default)]',
    description: 'Replace default border color'
  },
  
  // Step 4: Brand colors
  {
    find: /bg-blue-600/g,
    replace: 'bg-[var(--color-brand-blue)]',
    description: 'Replace brand blue background'
  },
  {
    find: /bg-green-600/g,
    replace: 'bg-[var(--color-brand-green)]',
    description: 'Replace brand green background'
  }
];

// Files to migrate (in order of safety)
export const migrationOrder = [
  // Start with least risky components
  'client/src/components/ui/badge.tsx',
  'client/src/components/ui/card.tsx',
  
  // Then buttons and forms
  'client/src/components/ui/button.tsx',
  'client/src/components/ui/input.tsx',
  
  // Admin components
  'client/src/components/admin/DashboardLayout.tsx',
  'client/src/components/admin/ProductModal.tsx',
  'client/src/components/admin/CategoryModal.tsx',
  
  // Pages (most risky)
  'client/src/pages/admin/ProductsManager.tsx',
  'client/src/pages/admin/CategoryManager.tsx'
];