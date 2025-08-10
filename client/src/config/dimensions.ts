/**
 * UNIFIED DESIGN SYSTEM - PHASE 2: MEASUREMENT STANDARDIZATION
 * Single source of truth for ALL measurements across the application
 * August 10, 2025 - Professional UI Unification Implementation
 */

// CORE SPACING SCALE - Base unit: 4px (0.25rem)
export const SPACING = {
  // Micro spacing
  xs: '0.25rem',    // 4px  - space-1 - Tiny gaps
  sm: '0.5rem',     // 8px  - space-2 - Icon gaps, small margins
  md: '0.75rem',    // 12px - space-3 - Form field gaps
  lg: '1rem',       // 16px - space-4 - Standard gap, card padding mobile
  xl: '1.25rem',    // 20px - space-5 - Section gaps mobile
  '2xl': '1.5rem',  // 24px - space-6 - Card padding desktop
  '3xl': '2rem',    // 32px - space-8 - Large gaps
  '4xl': '2.5rem',  // 40px - space-10 - Section spacing mobile
  '5xl': '3rem',    // 48px - space-12 - Major section gaps
  '6xl': '4rem',    // 64px - space-16 - Section spacing desktop
  '7xl': '5rem',    // 80px - space-20 - Page sections
} as const;

// INTERACTIVE ELEMENT HEIGHTS - Exact specifications
export const HEIGHTS = {
  // Interactive Elements
  xs: '1.75rem',   // 28px - h-7 - Tags, chips only
  sm: '2rem',      // 32px - h-8 - Secondary actions
  md: '2.5rem',    // 40px - h-10 - DEFAULT for all inputs/buttons
  lg: '3rem',      // 48px - h-12 - Primary CTAs
  xl: '3.5rem',    // 56px - h-14 - Hero buttons only

  // Text Input Specific
  input: '2.5rem',     // 40px - h-10 - ALL text inputs
  textarea: '5rem',    // 80px - min-h-[80px] - ALL textareas
  select: '2.5rem',    // 40px - h-10 - ALL selects

  // Fixed Layout Heights
  nav: '4rem',         // 64px - h-16 - Navigation bar
  navMobile: '3.5rem', // 56px - h-14 - Mobile nav
  tabs: '3rem',        // 48px - h-12 - Tab bars
  tableRow: '3.25rem', // 52px - h-13 - Table rows
  sidebar: '2.75rem',  // 44px - h-11 - Sidebar items
} as const;

// BUTTON SPECIFICATIONS
export const BUTTONS = {
  primary: {
    desktop: {
      height: HEIGHTS.md,      // h-10 (40px)
      padding: '0 1rem',       // px-4
      fontSize: '1rem',        // text-base (16px)
      borderRadius: '0.5rem',  // rounded-lg (8px)
      minWidth: '7.5rem',      // min-w-[120px]
    },
    mobile: {
      height: HEIGHTS.lg,      // h-12 (48px)
      padding: '0 1.5rem',     // px-6
      fontSize: '1rem',        // text-base (16px)
      borderRadius: '0.5rem',  // rounded-lg (8px)
      minWidth: '7.5rem',      // min-w-[120px]
    }
  },
  secondary: {
    height: HEIGHTS.md,        // h-10 (40px) always
    padding: '0 0.75rem',      // px-3
    fontSize: '0.875rem',      // text-sm (14px)
    borderRadius: '0.5rem',    // rounded-lg (8px)
  },
  icon: {
    size: HEIGHTS.md,          // w-10 h-10 (40px square)
    iconSize: '1.25rem',       // w-5 h-5 (20px)
    borderRadius: '0.5rem',    // rounded-lg (8px)
  },
  text: {
    height: HEIGHTS.md,        // h-10
    padding: '0 0.5rem',       // px-2
  }
} as const;

// INPUT FIELD SPECIFICATIONS
export const INPUTS = {
  text: {
    height: HEIGHTS.input,     // h-10 (40px) EXACTLY
    padding: '0 0.75rem',      // px-3 (12px horizontal)
    fontSize: '1rem',          // text-base (16px) - prevents zoom
    borderWidth: '1px',        // border (1px)
    borderRadius: '0.5rem',    // rounded-lg (8px)
  },
  textarea: {
    minHeight: HEIGHTS.textarea, // min-h-[80px]
    padding: '0.75rem',          // p-3
    fontSize: '1rem',            // text-base (16px)
    borderWidth: '1px',          // border (1px)
    borderRadius: '0.5rem',      // rounded-lg (8px)
  },
  label: {
    fontSize: '0.875rem',       // text-sm (14px)
    marginBottom: SPACING.sm,   // mb-2 (8px)
    fontWeight: '500',          // font-medium
  },
  error: {
    fontSize: '0.875rem',       // text-sm (14px)
    marginTop: SPACING.xs,      // mt-1 (4px)
  }
} as const;

// CARD SPECIFICATIONS
export const CARDS = {
  container: {
    desktop: {
      padding: SPACING['2xl'],    // p-6 (24px)
      borderRadius: '0.75rem',    // rounded-xl (12px)
    },
    mobile: {
      padding: SPACING.lg,        // p-4 (16px)
      borderRadius: '0.75rem',    // rounded-xl (12px)
    }
  },
  image: {
    borderRadius: '0.5rem',       // rounded-lg (8px)
  },
  content: {
    titleMargin: SPACING.lg,      // mt-4 (16px)
    paragraphMargin: SPACING.sm,  // mt-2 (8px)
    buttonMargin: SPACING.lg,     // mt-4 (16px)
  },
  grid: {
    desktop: SPACING['2xl'],      // gap-6 (24px)
    mobile: SPACING.lg,           // gap-4 (16px)
  }
} as const;

// NAVIGATION SPECIFICATIONS
export const NAVIGATION = {
  main: {
    desktop: {
      height: HEIGHTS.nav,        // h-16 (64px)
      padding: '0 1.5rem',        // px-6
    },
    mobile: {
      height: HEIGHTS.navMobile,  // h-14 (56px)
      padding: '0 1rem',          // px-4
    }
  },
  logo: {
    height: '2rem',               // h-8 (32px)
  },
  links: {
    padding: '0 1rem',            // px-4
    fontSize: '1rem',             // text-base (16px)
    activeIndicator: '2px',       // border-b-2
  },
  sidebar: {
    width: '16rem',               // w-64 (256px)
    padding: SPACING.lg,          // p-4
    itemHeight: HEIGHTS.sidebar,  // h-11 (44px)
    itemPadding: '0 0.75rem',     // px-3
    iconSize: '1.25rem',          // w-5 h-5 (20px)
    iconGap: SPACING.md,          // gap-3 (12px)
  }
} as const;

// TYPOGRAPHY HIERARCHY
export const TYPOGRAPHY = {
  h1: {
    desktop: {
      fontSize: '2.25rem',        // text-4xl (36px)
      fontWeight: '700',          // font-bold
      marginBottom: SPACING['2xl'], // mb-6 (24px)
    },
    mobile: {
      fontSize: '1.875rem',       // text-3xl (30px)
      fontWeight: '700',          // font-bold
      marginBottom: SPACING['2xl'], // mb-6 (24px)
    }
  },
  h2: {
    desktop: {
      fontSize: '1.875rem',       // text-3xl (30px)
      fontWeight: '600',          // font-semibold
      marginBottom: SPACING.lg,   // mb-4 (16px)
    },
    mobile: {
      fontSize: '1.5rem',         // text-2xl (24px)
      fontWeight: '600',          // font-semibold
      marginBottom: SPACING.lg,   // mb-4 (16px)
    }
  },
  h3: {
    desktop: {
      fontSize: '1.25rem',        // text-xl (20px)
      fontWeight: '600',          // font-semibold
      marginBottom: SPACING.md,   // mb-3 (12px)
    },
    mobile: {
      fontSize: '1.125rem',       // text-lg (18px)
      fontWeight: '600',          // font-semibold
      marginBottom: SPACING.md,   // mb-3 (12px)
    }
  },
  h4: {
    desktop: {
      fontSize: '1.125rem',       // text-lg (18px)
      fontWeight: '500',          // font-medium
      marginBottom: SPACING.sm,   // mb-2 (8px)
    },
    mobile: {
      fontSize: '1rem',           // text-base (16px)
      fontWeight: '500',          // font-medium
      marginBottom: SPACING.sm,   // mb-2 (8px)
    }
  },
  body: {
    default: {
      fontSize: '1rem',           // text-base (16px)
      lineHeight: '1.625',        // leading-relaxed
      marginBottom: SPACING.lg,   // mb-4 (16px)
    },
    small: {
      fontSize: '0.875rem',       // text-sm (14px)
    },
    tiny: {
      fontSize: '0.75rem',        // text-xs (12px)
    }
  }
} as const;

// TABLE SPECIFICATIONS
export const TABLES = {
  container: {
    borderRadius: '0.5rem',       // rounded-lg
  },
  header: {
    height: HEIGHTS.lg,           // h-12 (48px)
    fontSize: '0.875rem',         // text-sm
    fontWeight: '600',            // font-semibold
    padding: '0 1rem',            // px-4
  },
  row: {
    height: HEIGHTS.tableRow,     // h-13 (52px)
    padding: '0.75rem 1rem',      // py-3 px-4
  },
  cell: {
    fontSize: '0.875rem',         // text-sm
    padding: '0.75rem 1rem',      // py-3 px-4
  },
  actionButton: {
    size: HEIGHTS.sm,             // h-8 w-8 (32px)
    iconSize: '1rem',             // w-4 h-4 (16px)
  }
} as const;

// MODAL SPECIFICATIONS
export const MODALS = {
  container: {
    maxWidth: '32rem',            // max-w-lg (512px)
    padding: SPACING['2xl'],      // p-6 (24px)
    borderRadius: '1rem',         // rounded-2xl (16px)
    margin: SPACING.lg,           // m-4 (mobile safety)
  },
  header: {
    height: HEIGHTS.xl,           // h-14 (56px)
    titleSize: '1.25rem',         // text-xl
    titleWeight: '600',           // font-semibold
    closeButton: {
      size: HEIGHTS.sm,           // w-8 h-8
      iconSize: '1rem',           // w-4 h-4
    }
  },
  content: {
    paddingTop: SPACING.lg,       // pt-4 (16px)
    paddingBottom: SPACING['2xl'], // pb-6 (24px)
    spacing: SPACING.lg,          // space-y-4
  },
  footer: {
    paddingTop: SPACING.lg,       // pt-4 (16px)
    buttonGap: SPACING.md,        // gap-3 (12px)
    buttonHeight: HEIGHTS.md,     // minimum h-10
  }
} as const;

// ICON SPECIFICATIONS
export const ICONS = {
  button: {
    h8: '1rem',                   // w-4 h-4 (16px)
    h10: '1.25rem',               // w-5 h-5 (20px)
    h12: '1.5rem',                // w-6 h-6 (24px)
  },
  navigation: '1.5rem',           // w-6 h-6 (24px)
  standalone: '1.5rem',           // w-6 h-6 default
  inline: '1rem',                 // w-4 h-4 (16px) - in text
  spacing: {
    toText: SPACING.sm,           // gap-2 (8px) - icon to text in buttons
    inList: SPACING.md,           // gap-3 (12px) - icon to text in lists
  }
} as const;

// FORM SPECIFICATIONS
export const FORMS = {
  structure: {
    fieldSpacing: SPACING.lg,     // space-y-4 (16px)
    sectionSpacing: SPACING['2xl'], // space-y-6 (24px)
    labelToInput: SPACING.sm,     // mb-2 (8px)
    errorToField: SPACING.xs,     // mt-1 (4px)
  },
  grid: {
    twoColumn: SPACING.lg,        // gap-4
  },
  submit: {
    marginTop: SPACING['2xl'],    // mt-6 (24px)
    buttonGap: SPACING.md,        // gap-3
    primaryHeight: {
      mobile: HEIGHTS.lg,         // h-12
      desktop: HEIGHTS.md,        // h-10
    }
  }
} as const;

// LAYOUT GRID SYSTEM
export const LAYOUT = {
  container: {
    maxWidth: '80rem',            // max-w-7xl (1280px)
    paddingDesktop: '0 1.5rem',   // px-6
    paddingMobile: '0 1rem',      // px-4
  },
  sections: {
    desktop: '4rem 0',            // py-16
    mobile: '3rem 0',             // py-12
  },
  grids: {
    products: {
      gap: {
        desktop: SPACING['2xl'],  // gap-6
        mobile: SPACING.lg,       // gap-4
      }
    },
    cards: {
      gap: {
        desktop: SPACING['2xl'],  // gap-6
        mobile: SPACING.lg,       // gap-4
      }
    }
  },
  flex: {
    defaultGap: SPACING.lg,       // gap-4 (16px)
  }
} as const;

// INTERACTION STATES
export const INTERACTIONS = {
  transitions: {
    default: 'all 200ms ease-in-out',
    slow: 'all 300ms ease-in-out',
  },
  hover: {
    cardTransform: 'translateY(-2px)',
    buttonBrightness: '110%',
  },
  focus: {
    ring: '2px',
    ringOffset: '2px',
  },
  active: {
    scale: '0.95',
  },
  disabled: {
    opacity: '0.5',
  },
  loading: {
    minimumDisplay: '200ms',
  }
} as const;

// BREAKPOINTS (for reference)
export const BREAKPOINTS = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// TOUCH TARGETS
export const TOUCH = {
  minimum: '2.75rem',             // 44px - minimum touch target
  recommended: '3rem',            // 48px - recommended touch target
} as const;

export default {
  SPACING,
  HEIGHTS,
  BUTTONS,
  INPUTS,
  CARDS,
  NAVIGATION,
  TYPOGRAPHY,
  TABLES,
  MODALS,
  ICONS,
  FORMS,
  LAYOUT,
  INTERACTIONS,
  BREAKPOINTS,
  TOUCH,
} as const;