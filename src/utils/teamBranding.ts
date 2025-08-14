import { Id } from "../../convex/_generated/dataModel";

export interface TeamEventTheme {
  primary: string;        // Team's primary color
  secondary: string;      // Generated complementary color  
  accent: string;         // Lighter shade for highlights
  text: string;          // High contrast text color
  background: string;     // Light background variant
  shadow: string;        // Subtle shadow with brand color
  gradient: string;      // Brand gradient for premium effects
}

export interface Team {
  _id: Id<"teams">;
  name: string;
  slug: string;
  description?: string;
  ownerId: Id<"users">;
  createdAt: number;
  logo?: Id<"_storage">;
  primaryColor?: string;
}

// Default theme for teams without custom colors
const DEFAULT_THEME: TeamEventTheme = {
  primary: '#3b82f6',     // Blue
  secondary: '#1e40af',   // Darker blue
  accent: '#dbeafe',      // Light blue
  text: '#1f2937',        // Dark gray
  background: '#f8fafc',  // Very light gray
  shadow: 'rgba(59, 130, 246, 0.1)',
  gradient: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
};

// Convert hex color to HSL for color manipulation
const hexToHsl = (hex: string): [number, number, number] => {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;
  
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (diff !== 0) {
    s = l > 0.5 ? diff / (2 - max - min) : diff / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / diff + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / diff + 2) / 6;
        break;
      case b:
        h = ((r - g) / diff + 4) / 6;
        break;
    }
  }

  return [h * 360, s * 100, l * 100];
};

// Convert HSL back to hex
const hslToHex = (h: number, s: number, l: number): string => {
  h = h / 360;
  s = s / 100;
  l = l / 100;

  const hue2rgb = (p: number, q: number, t: number): number => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };

  let r, g, b;

  if (s === 0) {
    r = g = b = l; // Achromatic
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  const toHex = (c: number): string => {
    const hex = Math.round(c * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

// Check if a color meets WCAG AA contrast requirements
const getContrastRatio = (color1: string, color2: string): number => {
  const getLuminance = (color: string): number => {
    const rgb = [
      parseInt(color.slice(1, 3), 16),
      parseInt(color.slice(3, 5), 16),
      parseInt(color.slice(5, 7), 16)
    ].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
  };

  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  const lightest = Math.max(l1, l2);
  const darkest = Math.min(l1, l2);
  
  return (lightest + 0.05) / (darkest + 0.05);
};

// Generate a complementary color scheme from primary color
export const generateEventTheme = (team: Team): TeamEventTheme => {
  if (!team.primaryColor) {
    return DEFAULT_THEME;
  }

  const primaryColor = team.primaryColor;
  const [h, s, l] = hexToHsl(primaryColor);

  // Generate secondary color (darker shade)
  const secondary = hslToHex(h, Math.min(s + 10, 100), Math.max(l - 20, 10));

  // Generate accent color (lighter, more saturated)
  const accent = hslToHex(h, Math.max(s - 30, 20), Math.min(l + 35, 90));

  // Generate background (very light version)
  const background = hslToHex(h, Math.max(s - 40, 10), Math.min(l + 45, 95));

  // Ensure text color has good contrast
  const textColor = getContrastRatio(primaryColor, '#ffffff') > 4.5 ? '#ffffff' : '#1f2937';

  // Generate shadow with primary color
  const shadowColor = `rgba(${parseInt(primaryColor.slice(1, 3), 16)}, ${parseInt(primaryColor.slice(3, 5), 16)}, ${parseInt(primaryColor.slice(5, 7), 16)}, 0.15)`;

  // Generate gradient
  const gradient = `linear-gradient(135deg, ${primaryColor} 0%, ${secondary} 100%)`;

  return {
    primary: primaryColor,
    secondary,
    accent,
    text: textColor,
    background,
    shadow: shadowColor,
    gradient,
  };
};

// Apply team theme to CSS custom properties
export const applyTeamTheme = (theme: TeamEventTheme): void => {
  const root = document.documentElement;
  
  root.style.setProperty('--event-primary', theme.primary);
  root.style.setProperty('--event-secondary', theme.secondary);
  root.style.setProperty('--event-accent', theme.accent);
  root.style.setProperty('--event-text', theme.text);
  root.style.setProperty('--event-background', theme.background);
  root.style.setProperty('--event-shadow', theme.shadow);
  root.style.setProperty('--event-gradient', theme.gradient);
};

// Remove team theme CSS variables
export const clearTeamTheme = (): void => {
  const root = document.documentElement;
  
  root.style.removeProperty('--event-primary');
  root.style.removeProperty('--event-secondary');
  root.style.removeProperty('--event-accent');
  root.style.removeProperty('--event-text');
  root.style.removeProperty('--event-background');
  root.style.removeProperty('--event-shadow');
  root.style.removeProperty('--event-gradient');
};

// Get inline styles for team branding (useful for email templates or isolated components)
export const getTeamBrandingStyles = (theme: TeamEventTheme) => {
  return {
    '--event-primary': theme.primary,
    '--event-secondary': theme.secondary,
    '--event-accent': theme.accent,
    '--event-text': theme.text,
    '--event-background': theme.background,
    '--event-shadow': theme.shadow,
    '--event-gradient': theme.gradient,
  } as React.CSSProperties;
};

// Validate if a hex color is valid
export const isValidHexColor = (hex: string): boolean => {
  const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
  return hexColorRegex.test(hex);
};

// Get a readable color name for accessibility
export const getColorName = (hex: string): string => {
  const [h, s, l] = hexToHsl(hex);
  
  if (l < 20) return 'Very Dark';
  if (l < 40) return 'Dark';
  if (l > 80) return 'Light';
  if (l > 60) return 'Bright';
  
  if (s < 20) return 'Gray';
  
  if (h < 30 || h >= 330) return 'Red';
  if (h < 90) return 'Yellow';
  if (h < 150) return 'Green';
  if (h < 210) return 'Cyan';
  if (h < 270) return 'Blue';
  if (h < 330) return 'Purple';
  
  return 'Color';
};