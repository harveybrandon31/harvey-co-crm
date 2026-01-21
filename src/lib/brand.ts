// Harvey & Co Brand Configuration

export const brand = {
  name: "Harvey & Co",
  tagline: "Financial Services",

  colors: {
    // Primary brand color - deep forest green
    primary: "#2D4A43",
    primaryHover: "#3D5A53",
    primaryLight: "#4A6B63",

    // Background colors
    background: "#F5F3EF",
    surface: "#FFFFFF",

    // Text colors
    text: "#1A1A1A",
    textSecondary: "#6B7280",
    textMuted: "#9CA3AF",

    // Accent colors
    accent: "#C9A962",
    accentLight: "#D4BA7A",

    // Status colors
    success: "#10B981",
    successBg: "#D1FAE5",
    error: "#EF4444",
    errorBg: "#FEE2E2",
    warning: "#F59E0B",
    warningBg: "#FEF3C7",
    info: "#3B82F6",
    infoBg: "#DBEAFE",
  },

  typography: {
    // Serif for headings
    fontHeading: "'Playfair Display', 'Georgia', serif",
    // Sans-serif for body
    fontBody: "'Inter', system-ui, sans-serif",
  },
};

// Tailwind-compatible CSS variables for use in globals.css
export const brandCssVariables = `
  --brand-primary: ${brand.colors.primary};
  --brand-primary-hover: ${brand.colors.primaryHover};
  --brand-primary-light: ${brand.colors.primaryLight};
  --brand-background: ${brand.colors.background};
  --brand-surface: ${brand.colors.surface};
  --brand-text: ${brand.colors.text};
  --brand-text-secondary: ${brand.colors.textSecondary};
  --brand-text-muted: ${brand.colors.textMuted};
  --brand-accent: ${brand.colors.accent};
  --brand-accent-light: ${brand.colors.accentLight};
`;
