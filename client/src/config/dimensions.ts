/**
 * Unified Spacing & Sizing System
 * Single source of truth for ALL measurements
 * Base unit: 4px (0.25rem)
 */

// Core spacing scale - use these everywhere
export const spacing = {
  xs: '4px',   // space-1 - Tiny gaps
  sm: '8px',   // space-2 - Icon gaps, small margins
  md: '12px',  // space-3 - Form field gaps
  lg: '16px',  // space-4 - Standard gap, card padding mobile
  xl: '20px',  // space-5 - Section gaps mobile
  '2xl': '24px', // space-6 - Card padding desktop
  '3xl': '32px', // space-8 - Large gaps
  '4xl': '40px', // space-10 - Section spacing mobile
  '5xl': '48px', // space-12 - Major section gaps
  '6xl': '64px', // space-16 - Section spacing desktop
  '7xl': '80px', // space-20 - Page sections
} as const;

// Interactive element heights - standardized across all components
export const heights = {
  // Interactive heights
  xs: '28px', // h-7 - Tags, chips only
  sm: '32px', // h-8 - Secondary actions
  md: '40px', // h-10 - DEFAULT for all inputs/buttons
  lg: '48px', // h-12 - Primary CTAs
  xl: '56px', // h-14 - Hero buttons only
  
  // Fixed component heights
  nav: '64px',      // h-16 - Navigation bar
  navMobile: '56px', // h-14 - Mobile nav
  tabs: '48px',     // h-12 - Tab bars
  tableRow: '52px', // h-13 - Table rows
  sidebarItem: '44px', // h-11 - Sidebar items
} as const;

// Typography scale - consistent across all components
export const typography = {
  // Headings
  h1: {
    desktop: 'text-4xl', // 36px
    mobile: 'text-3xl',  // 30px
    weight: 'font-bold',
    spacing: 'mb-6'
  },
  h2: {
    desktop: 'text-3xl', // 30px
    mobile: 'text-2xl',  // 24px
    weight: 'font-semibold',
    spacing: 'mb-4'
  },
  h3: {
    desktop: 'text-xl',  // 20px
    mobile: 'text-lg',   // 18px
    weight: 'font-semibold',
    spacing: 'mb-3'
  },
  h4: {
    desktop: 'text-lg',   // 18px
    mobile: 'text-base',  // 16px
    weight: 'font-medium',
    spacing: 'mb-2'
  },
  
  // Body text
  body: {
    size: 'text-base',        // 16px
    lineHeight: 'leading-relaxed', // 1.625
    spacing: 'mb-4'
  },
  small: 'text-sm',  // 14px - labels, captions, metadata
  tiny: 'text-xs',   // 12px - timestamps only
} as const;

// Icon sizing system - consistent across all uses
export const iconSizes = {
  // Context-based sizing
  buttonSm: 'w-4 h-4',    // 16px - in h-8 buttons
  buttonMd: 'w-5 h-5',    // 20px - in h-10 buttons (default)
  buttonLg: 'w-6 h-6',    // 24px - in h-12 buttons
  nav: 'w-6 h-6',         // 24px - navigation icons
  standalone: 'w-6 h-6',  // 24px - default standalone
  inline: 'w-4 h-4',      // 16px - tiny icons in text
} as const;

// Layout dimensions
export const layout = {
  // Containers
  maxWidth: 'max-w-7xl',  // 1280px
  containerPadding: {
    desktop: 'px-6',
    mobile: 'px-4'
  },
  
  // Section spacing
  sectionSpacing: {
    desktop: 'py-16',
    mobile: 'py-12'
  },
  
  // Grid gaps
  gridGap: {
    desktop: 'gap-6',  // 24px
    mobile: 'gap-4'    // 16px
  },
  
  // Card dimensions
  card: {
    padding: {
      desktop: 'p-6',  // 24px
      mobile: 'p-4'    // 16px
    },
    borderRadius: 'rounded-xl', // 12px
    imageBorderRadius: 'rounded-lg' // 8px
  }
} as const;

// Form specifications
export const forms = {
  fieldSpacing: 'space-y-4',    // 16px between fields
  sectionSpacing: 'space-y-6',  // 24px between sections
  labelSpacing: 'mb-2',         // 8px label to input
  errorSpacing: 'mt-1',         // 4px error to field
  
  input: {
    height: 'h-10',             // 40px - ALL text inputs
    padding: 'px-3',            // 12px horizontal
    fontSize: 'text-base',      // 16px - prevents zoom
    borderRadius: 'rounded-lg', // 8px
  },
  
  textarea: {
    minHeight: 'min-h-[80px]',
    padding: 'p-3',
    borderRadius: 'rounded-lg',
  },
  
  label: {
    fontSize: 'text-sm',       // 14px
    fontWeight: 'font-medium',
    spacing: 'mb-2'            // 8px
  }
} as const;

// Interaction states
export const interactions = {
  hover: {
    transition: 'transition-all duration-200',
    buttonBrightness: 'hover:brightness-110',
    cardShadow: 'hover:shadow-lg',
    cardTransform: 'hover:-translate-y-0.5'
  },
  
  focus: {
    ring: 'ring-2 ring-offset-2',
    // No outline-none without alternative
  },
  
  active: {
    buttonScale: 'active:scale-95',
    cardShadow: 'active:shadow-sm'
  },
  
  disabled: {
    opacity: 'opacity-50',
    cursor: 'cursor-not-allowed'
  }
} as const;

// Table specifications
export const tables = {
  container: {
    overflow: 'overflow-x-auto',
    borderRadius: layout.card.borderRadius,
  },
  
  header: {
    height: 'h-12',           // 48px
    fontSize: 'text-sm',      // 14px
    fontWeight: 'font-semibold',
    textAlign: 'text-left',
    padding: 'px-4'
  },
  
  row: {
    height: 'h-13',           // 52px
    border: 'border-b',
    hover: 'hover:bg-gray-50',
    padding: 'px-4'
  },
  
  cell: {
    padding: 'py-3 px-4',
    fontSize: 'text-sm',
    verticalAlign: 'align-middle'
  },
  
  actionButton: {
    size: 'h-8 w-8',          // 32px
    iconSize: iconSizes.inline // w-4 h-4 (16px)
  }
} as const;

// Modal/Dialog specifications  
export const modals = {
  container: {
    maxWidth: 'max-w-lg',     // 512px default
    padding: layout.card.padding.desktop, // p-6 (24px)
    borderRadius: 'rounded-2xl', // 16px
    margin: 'm-4'             // for mobile safety
  },
  
  header: {
    height: 'h-14',           // 56px
    titleSize: 'text-xl',     // 20px
    titleWeight: 'font-semibold',
    closeButton: {
      size: 'w-8 h-8',        // 32px
      iconSize: iconSizes.inline // w-4 h-4 (16px)
    }
  },
  
  content: {
    paddingTop: 'pt-4',       // 16px
    paddingBottom: 'pb-6',    // 24px
    spacing: 'space-y-4'      // 16px between elements
  },
  
  footer: {
    paddingTop: 'pt-4',       // 16px
    borderTop: 'border-t',
    buttonGap: 'gap-3',       // 12px
    buttonHeight: heights.md  // h-10 minimum
  }
} as const;

// Grid system specifications
export const grids = {
  products: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  cards: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  
  flex: {
    defaultGap: 'gap-4',      // 16px
    itemAlignment: 'items-center',
    mobileStack: 'flex-col sm:flex-row'
  }
} as const;

// Responsive breakpoints helper
export const responsive = {
  // Mobile-first approach
  mobile: '', // No prefix - default
  tablet: 'sm:', // 640px+
  desktop: 'lg:', // 1024px+
  wide: 'xl:' // 1280px+
} as const;