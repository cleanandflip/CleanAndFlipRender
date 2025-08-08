// CLEANFLIP_THEME: Preserves your EXACT Clean & Flip colors

export const CLEANFLIP_THEME = {
  // Your exact dark navy/gray theme
  colors: {
    // Backgrounds
    pageBg: '#0F172A',           // Dark navy page background
    cardBg: 'rgba(30, 41, 59, 0.5)',  // Card backgrounds
    inputBg: 'rgba(30, 41, 59, 0.8)', // Input/dropdown backgrounds
    
    // Borders
    border: 'rgba(148, 163, 184, 0.2)',  // Subtle borders
    borderHover: 'rgba(148, 163, 184, 0.4)',
    
    // Text
    textPrimary: '#F1F5F9',      // Off-white primary text
    textSecondary: '#94A3B8',    // Muted gray text
    textPlaceholder: '#64748B',  // Placeholder gray
    
    // Your blue accent (from buttons)
    accent: '#3B82F6',           // Primary blue
    accentHover: '#2563EB',      // Darker blue on hover
    accentFocus: 'rgba(59, 130, 246, 0.4)',
    
    // States
    hover: 'rgba(148, 163, 184, 0.1)',
    selected: 'rgba(59, 130, 246, 0.2)',
    disabled: 'rgba(100, 116, 139, 0.5)',
  },
  
  // Effects
  effects: {
    blur: 'blur(12px)',
    shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  }
};