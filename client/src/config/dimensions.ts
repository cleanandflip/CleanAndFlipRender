/**
 * UNIFIED DIMENSIONS SYSTEM - PHASE 2: MEASUREMENT STANDARDIZATION
 * Single source of truth for ALL measurements in the application
 * August 10, 2025 - Professional UI Modernization
 */

// Base unit: 4px (0.25rem) - Foundation for all spacing
export const BASE_UNIT = 4;

// Core spacing scale - Used throughout the application
export const spacing = {
  1: '0.25rem',   // 4px - Tiny gaps
  2: '0.5rem',    // 8px - Icon gaps, small margins
  3: '0.75rem',   // 12px - Form field gaps
  4: '1rem',      // 16px - Standard gap, card padding mobile
  5: '1.25rem',   // 20px - Section gaps mobile
  6: '1.5rem',    // 24px - Card padding desktop
  8: '2rem',      // 32px - Large gaps
  10: '2.5rem',   // 40px - Section spacing mobile
  12: '3rem',     // 48px - Major section gaps
  16: '4rem',     // 64px - Section spacing desktop
  20: '5rem',     // 80px - Page sections
  24: '6rem'      // 96px - Major page sections
} as const;

// Component heights - Standardized interactive element heights
export const heights = {
  // Interactive element heights
  xs: '1.75rem',  // 28px - Tags, chips only
  sm: '2rem',     // 32px - Secondary actions
  md: '2.5rem',   // 40px - DEFAULT for all inputs/buttons
  lg: '3rem',     // 48px - Primary CTAs
  xl: '3.5rem',   // 56px - Hero buttons only
  
  // Navigation heights
  nav: '4rem',        // 64px - Navigation bar
  navMobile: '3.5rem', // 56px - Mobile nav
  tab: '3rem',        // 48px - Tab bars
  
  // Component specific
  tableRow: '3.25rem', // 52px - Table rows
  sidebarItem: '2.75rem', // 44px - Sidebar items
  modalHeader: '3.5rem'   // 56px - Modal header
} as const;

// Typography scale - Consistent text hierarchy
export const typography = {
  sizes: {
    xs: '0.75rem',    // 12px - Timestamps only
    sm: '0.875rem',   // 14px - Labels, captions, metadata
    base: '1rem',     // 16px - Body text, form inputs
    lg: '1.125rem',   // 18px - Large body text
    xl: '1.25rem',    // 20px - Card titles (H3)
    '2xl': '1.5rem',  // 24px - Section titles mobile (H2)
    '3xl': '1.875rem', // 30px - Section titles desktop (H2)
    '4xl': '2.25rem'  // 36px - Page titles desktop (H1)
  },
  weights: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700'
  },
  lineHeights: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2'
  }
} as const;

// Icon sizes - Standardized for consistency
export const iconSizes = {
  xs: '1rem',     // 16px - In small buttons, text
  sm: '1.25rem',  // 20px - In medium buttons
  md: '1.5rem',   // 24px - In large buttons, navigation
  lg: '2rem',     // 32px - Standalone, headers
  xl: '2.5rem'    // 40px - Hero sections
} as const;

// Border radius - Consistent curvature
export const borderRadius = {
  sm: '0.25rem',   // 4px - Small elements
  md: '0.5rem',    // 8px - Default for inputs/buttons
  lg: '0.75rem',   // 12px - Cards
  xl: '1rem',      // 16px - Large cards/modals
  '2xl': '1.5rem'  // 24px - Hero sections
} as const;

// Shadows - Elevation system
export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
} as const;

// Layout containers
export const containers = {
  maxWidth: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px'
  },
  padding: {
    mobile: spacing[4],   // 16px
    desktop: spacing[6]   // 24px
  }
} as const;

// Grid gaps
export const gaps = {
  mobile: spacing[4],   // 16px
  desktop: spacing[6]   // 24px
} as const;

// Form specifications
export const forms = {
  fieldSpacing: spacing[4],     // 16px between fields
  sectionSpacing: spacing[6],   // 24px between sections
  labelSpacing: spacing[2],     // 8px label to input
  errorSpacing: spacing[1],     // 4px error to field
  submitSpacing: spacing[6]     // 24px before submit
} as const;

// Interactive specifications
export const interactions = {
  minTouchTarget: '2.75rem', // 44px minimum touch target
  hoverDuration: '200ms',
  focusRingWidth: '2px',
  focusRingOffset: '2px'
} as const;

// Table specifications
export const tables = {
  headerHeight: heights.lg,  // 48px
  rowHeight: heights.tableRow, // 52px
  cellPadding: spacing[4]    // 16px
} as const;

// Modal specifications
export const modals = {
  maxWidth: '32rem',        // 512px default
  padding: spacing[6],      // 24px
  headerHeight: heights.modalHeader, // 56px
  borderRadius: borderRadius.xl // 16px
} as const;

export type SpacingKey = keyof typeof spacing;
export type HeightKey = keyof typeof heights;
export type TypographySize = keyof typeof typography.sizes;
export type IconSize = keyof typeof iconSizes;