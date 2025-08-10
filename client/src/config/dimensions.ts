/**
 * Professional UI Unification - Core Spacing Scale
 * Single source of truth for ALL measurements
 * Base unit: 4px (0.25rem)
 */

export const SPACING = {
  // Core spacing scale (4px base unit)
  xs: '4px',    // space-1 - Tiny gaps
  sm: '8px',    // space-2 - Icon gaps, small margins
  md: '12px',   // space-3 - Form field gaps
  lg: '16px',   // space-4 - Standard gap, card padding mobile
  xl: '20px',   // space-5 - Section gaps mobile
  '2xl': '24px', // space-6 - Card padding desktop
  '3xl': '32px', // space-8 - Large gaps
  '4xl': '40px', // space-10 - Section spacing mobile
  '5xl': '48px', // space-12 - Major section gaps
  '6xl': '64px', // space-16 - Section spacing desktop
  '7xl': '80px', // space-20 - Page sections
  '8xl': '96px', // space-24 - Large page sections
} as const;

export const HEIGHTS = {
  // Interactive element heights
  xs: 'h-7',    // 28px - Tags, chips only
  sm: 'h-8',    // 32px - Secondary actions
  md: 'h-10',   // 40px - DEFAULT for all inputs/buttons
  lg: 'h-12',   // 48px - Primary CTAs
  xl: 'h-14',   // 56px - Hero buttons only

  // Text input specific
  input: 'h-10',           // ALL text inputs: 40px
  textarea: 'min-h-[80px]', // ALL textareas: minimum 80px
  select: 'h-10',          // ALL selects: 40px

  // Fixed component heights
  nav: 'h-16',        // Navigation bar: 64px
  navMobile: 'h-14',  // Mobile nav: 56px
  tabs: 'h-12',       // Tab bars: 48px
  tableRow: 'h-13',   // Table rows: 52px
  sidebarItem: 'h-11', // Sidebar items: 44px
} as const;

export const TYPOGRAPHY = {
  // Heading hierarchy
  h1: {
    desktop: 'text-4xl font-bold mb-6',  // 36px
    mobile: 'text-3xl font-bold mb-6',   // 30px
  },
  h2: {
    desktop: 'text-3xl font-semibold mb-4', // 30px
    mobile: 'text-2xl font-semibold mb-4',  // 24px
  },
  h3: {
    desktop: 'text-xl font-semibold mb-3',  // 20px
    mobile: 'text-lg font-semibold mb-3',   // 18px
  },
  h4: {
    desktop: 'text-lg font-medium mb-2',    // 18px
    mobile: 'text-base font-medium mb-2',   // 16px
  },

  // Body text
  body: 'text-base leading-relaxed mb-4',  // 16px
  small: 'text-sm',                        // 14px - labels, captions
  tiny: 'text-xs',                         // 12px - timestamps only
} as const;

export const BUTTONS = {
  // Primary buttons (main actions)
  primary: {
    desktop: 'h-10 px-4 text-base rounded-lg min-w-[120px]',
    mobile: 'h-12 px-6 text-base rounded-lg min-w-[120px]',
  },
  
  // Secondary buttons
  secondary: 'h-10 px-3 text-sm rounded-lg',
  
  // Icon-only buttons
  icon: 'w-10 h-10 rounded-lg', // 40px square
  iconSize: 'w-5 h-5',          // 20px icon
  
  // Text buttons
  text: 'h-10 px-2',
} as const;

export const CARDS = {
  // Card container
  padding: {
    desktop: 'p-6',  // 24px
    mobile: 'p-4',   // 16px
  },
  borderRadius: 'rounded-xl', // 12px
  shadow: {
    default: 'shadow-md',
    hover: 'shadow-lg',
  },
  
  // Card content spacing
  titleMargin: 'mt-4',     // 16px
  paragraphMargin: 'mt-2', // 8px
  buttonMargin: 'mt-4',    // 16px
  
  // Card grid gaps
  gridGap: {
    desktop: 'gap-6', // 24px
    mobile: 'gap-4',  // 16px
  },
} as const;

export const FORMS = {
  // Form structure
  fieldSpacing: 'space-y-4',   // 16px
  sectionSpacing: 'space-y-6', // 24px
  labelMargin: 'mb-2',         // 8px
  errorMargin: 'mt-1',         // 4px
  
  // Submit section
  submitMargin: 'mt-6',        // 24px
  buttonGap: 'gap-3',          // 12px
  
  // Grid layout
  twoColumn: 'grid grid-cols-1 md:grid-cols-2 gap-4',
  fullWidth: 'col-span-full',
} as const;

export const ICONS = {
  // Icon sizes by button height
  small: 'w-4 h-4',    // 16px - for h-8 buttons
  medium: 'w-5 h-5',   // 20px - for h-10 buttons
  large: 'w-6 h-6',    // 24px - for h-12 buttons
  nav: 'w-6 h-6',      // 24px - navigation icons
  
  // Icon spacing
  buttonGap: 'gap-2',  // 8px - icon to text in buttons
  listGap: 'gap-3',    // 12px - icon to text in lists
} as const;

export const CONTAINERS = {
  // Page container
  page: 'max-w-7xl mx-auto px-6 lg:px-6 sm:px-4',
  
  // Content sections
  section: {
    desktop: 'py-16',
    mobile: 'py-12',
  },
  
  // Grid layouts
  products: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  cards: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  defaultGap: 'gap-4',
} as const;

export const TABLES = {
  // Table structure
  container: 'overflow-x-auto rounded-lg',
  header: 'h-12 text-sm font-semibold text-left px-4',
  row: 'h-13 border-b hover:bg-gray-50 px-4',
  cell: 'py-3 px-4 text-sm align-middle',
  actionButton: 'h-8 w-8',
  actionIcon: 'w-4 h-4',
} as const;

export const MODALS = {
  // Modal container
  container: 'max-w-lg p-6 rounded-2xl m-4',
  header: 'h-14 text-xl font-semibold',
  closeButton: 'w-8 h-8',
  closeIcon: 'w-4 h-4',
  
  // Modal content
  contentPadding: 'pt-4 pb-6',
  contentSpacing: 'space-y-4',
  
  // Modal footer
  footerPadding: 'pt-4 border-t',
  buttonGap: 'gap-3',
  buttonHeight: 'h-10',
} as const;

// Tailwind class combinations for common patterns
export const CLASSES = {
  // Button variants
  primaryButton: `${BUTTONS.primary.desktop} bg-blue-600 hover:bg-blue-700 text-white transition-colors`,
  secondaryButton: `${BUTTONS.secondary} border border-gray-300 hover:bg-gray-50 transition-colors`,
  
  // Input styling
  textInput: `${HEIGHTS.input} px-3 text-base border rounded-lg focus:ring-2 focus:ring-blue-500`,
  
  // Card styling
  card: `${CARDS.borderRadius} ${CARDS.shadow.default} hover:${CARDS.shadow.hover} transition-shadow`,
  
  // Typography responsive
  pageTitle: `${TYPOGRAPHY.h1.mobile} lg:${TYPOGRAPHY.h1.desktop}`,
  sectionTitle: `${TYPOGRAPHY.h2.mobile} lg:${TYPOGRAPHY.h2.desktop}`,
} as const;