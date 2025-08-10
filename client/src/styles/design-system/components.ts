// Reusable Component Classes
export const componentClasses = {
  // Button Styles
  button: {
    base: `
      inline-flex items-center justify-center
      font-medium rounded-lg
      transition-all duration-200
      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#1A1F2E]
      disabled:opacity-50 disabled:cursor-not-allowed
    `,
    
    variants: {
      primary: `
        bg-[#3B82F6] text-white
        hover:bg-[#2563EB] hover:shadow-lg hover:shadow-blue-500/25
        focus:ring-blue-500
      `,
      secondary: `
        bg-[#232937] text-white border border-[rgba(255,255,255,0.08)]
        hover:bg-[#2D3548] hover:border-[rgba(255,255,255,0.12)]
        focus:ring-gray-500
      `,
      success: `
        bg-[#10B981] text-white
        hover:bg-[#059669] hover:shadow-lg hover:shadow-green-500/25
        focus:ring-green-500
      `,
      ghost: `
        bg-transparent text-[#E2E8F0]
        hover:bg-[rgba(255,255,255,0.08)] hover:text-white
        focus:ring-gray-500
      `
    },
    
    sizes: {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg'
    }
  },
  
  // Card Styles
  card: {
    base: `
      bg-[#232937] backdrop-blur-sm
      border border-[rgba(255,255,255,0.08)]
      rounded-lg
      transition-all duration-300
    `,
    interactive: `
      hover:bg-[#2D3548]
      hover:border-[rgba(255,255,255,0.12)]
      hover:shadow-xl hover:shadow-black/20
      cursor-pointer
    `,
    glow: `
      hover:shadow-[0_0_30px_rgba(59,130,246,0.15)]
    `
  },
  
  // Input Styles
  input: {
    base: `
      w-full px-4 py-2
      bg-[#1A1F2E] text-white
      border border-[rgba(255,255,255,0.08)]
      rounded-lg
      transition-all duration-200
      placeholder:text-[#64748B]
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
    `,
    
    variants: {
      default: `
        hover:border-[rgba(255,255,255,0.12)]
      `,
      error: `
        border-red-500 focus:ring-red-500 focus:border-red-500
      `,
      success: `
        border-green-500 focus:ring-green-500 focus:border-green-500
      `
    }
  },
  
  // Modal Styles
  modal: {
    overlay: `
      fixed inset-0 z-50
      bg-black bg-opacity-75
      backdrop-blur-sm
      flex items-center justify-center
      animate-fade-in
    `,
    content: `
      bg-[#232937]
      border border-[rgba(255,255,255,0.08)]
      rounded-xl
      shadow-2xl
      max-w-md w-full mx-4
      animate-slide-up
    `
  },
  
  // Navigation Styles
  nav: {
    base: `
      bg-[#1A1F2E] backdrop-blur-lg
      border-b border-[rgba(255,255,255,0.08)]
      sticky top-0 z-40
    `,
    link: `
      text-[#E2E8F0] hover:text-white
      transition-colors duration-200
      font-medium
    `,
    linkActive: `
      text-[#3B82F6]
    `
  }
};