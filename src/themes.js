/**
 * Theme configuration for Kartik Vraj Yatra website.
 *
 * HOW TO USE:
 *   1. Import a theme: import { sattvicTheme } from "./themes"
 *   2. Pass it to <VrajKartikYatra /> or use setActiveTheme()
 *   3. To create a new theme, copy an existing one and tweak the values.
 *
 * HOW TO ADD A THEME TOGGLE (future):
 *   - Store activeTheme in state/context
 *   - Pass theme.cssVars as inline style on the root container
 *   - All components auto-update via CSS variables
 */

/* ─── Sattvic (warm cream — mode of goodness) ─── */
export const sattvicTheme = {
  name: "sattvic",
  label: "Sattvic (Light)",
  cssVars: {
    "--t-bg":                 "#FDF8F0",
    "--t-bg-alt":             "#F7F0E4",
    "--t-bg-subtle":          "#F5EDE0",
    "--t-text":               "#2D1810",
    "--t-text-secondary":     "#6B5744",
    "--t-text-muted":         "#9C8B78",
    "--t-text-faint":         "#B8A99A",
    "--t-accent-from":        "#d97706",   // amber-600
    "--t-accent-to":          "#ea580c",   // orange-600
    "--t-accent-tag":         "#b45309",   // amber-700
    "--t-accent-hover":       "#b45309",   // amber-700
    "--t-border":             "rgba(45, 24, 16, 0.08)",
    "--t-border-strong":      "rgba(45, 24, 16, 0.12)",
    "--t-card-tint":          "rgba(45, 24, 16, 0.02)",
    "--t-watermark":          "rgba(45, 24, 16, 0.05)",
    "--t-watermark-hover":    "rgba(217, 119, 6, 0.1)",
    "--t-glow1":              "rgba(245, 158, 11, 0.10)",
    "--t-glow2":              "rgba(251, 146, 60, 0.08)",
    "--t-nav-solid":          "rgba(253, 248, 240, 0.90)",
    "--t-nav-shadow":         "rgba(120, 53, 15, 0.05)",
    "--t-hero-gradient-to":   "#FDF8F0",
    "--t-hero-overlay":        "linear-gradient(to bottom, rgba(0,0,0,0.55), rgba(0,0,0,0.35), rgba(0,0,0,0.25), var(--t-hero-gradient-to))",
    "--t-nav-text":            "#ea580c",
    "--t-scrollbar-track":    "#F7F0E4",
    "--t-selection-color":    "#2D1810",
  },
};

/* ─── Dark (original deep dark theme) ─── */
export const darkTheme = {
  name: "dark",
  label: "Dark",
  cssVars: {
    "--t-bg":                 "#0a0a0f",
    "--t-bg-alt":             "#0f0d1a",
    "--t-bg-subtle":          "#100a18",
    "--t-text":               "#ffffff",
    "--t-text-secondary":     "rgba(255, 255, 255, 0.60)",
    "--t-text-muted":         "rgba(255, 255, 255, 0.50)",
    "--t-text-faint":         "rgba(255, 255, 255, 0.30)",
    "--t-accent-from":        "#fbbf24",   // amber-400 (lighter for dark bg)
    "--t-accent-to":          "#fb923c",   // orange-400
    "--t-accent-tag":         "#fbbf24",   // amber-400
    "--t-accent-hover":       "#fcd34d",   // amber-300
    "--t-border":             "rgba(255, 255, 255, 0.06)",
    "--t-border-strong":      "rgba(255, 255, 255, 0.10)",
    "--t-card-tint":          "rgba(255, 255, 255, 0.02)",
    "--t-watermark":          "rgba(255, 255, 255, 0.04)",
    "--t-watermark-hover":    "rgba(251, 191, 36, 0.08)",
    "--t-glow1":              "rgba(245, 158, 11, 0.05)",
    "--t-glow2":              "rgba(168, 85, 247, 0.05)",
    "--t-nav-solid":          "rgba(10, 10, 15, 0.90)",
    "--t-nav-shadow":         "rgba(0, 0, 0, 0.50)",
    "--t-hero-gradient-to":   "#0a0a0f",
    "--t-hero-overlay":        "linear-gradient(to bottom, rgba(0,0,0,0.6), rgba(0,0,0,0.35), var(--t-hero-gradient-to))",
    "--t-nav-text":            "rgba(255, 255, 255, 0.70)",
    "--t-scrollbar-track":    "#0a0a0f",
    "--t-selection-color":    "#ffffff",
  },
};

/* ─── Vrindavan Green (earthy sage) ─── */
export const vrindavanTheme = {
  name: "vrindavan",
  label: "Vrindavan Green",
  cssVars: {
    "--t-bg":                 "#F4F7F0",
    "--t-bg-alt":             "#EBF0E4",
    "--t-bg-subtle":          "#E3EADB",
    "--t-text":               "#1A2E12",
    "--t-text-secondary":     "#4A6340",
    "--t-text-muted":         "#7A9470",
    "--t-text-faint":         "#A3B89A",
    "--t-accent-from":        "#d97706",
    "--t-accent-to":          "#ea580c",
    "--t-accent-tag":         "#b45309",
    "--t-accent-hover":       "#b45309",
    "--t-border":             "rgba(26, 46, 18, 0.08)",
    "--t-border-strong":      "rgba(26, 46, 18, 0.12)",
    "--t-card-tint":          "rgba(26, 46, 18, 0.02)",
    "--t-watermark":          "rgba(26, 46, 18, 0.05)",
    "--t-watermark-hover":    "rgba(217, 119, 6, 0.1)",
    "--t-glow1":              "rgba(245, 158, 11, 0.10)",
    "--t-glow2":              "rgba(74, 99, 64, 0.08)",
    "--t-nav-solid":          "rgba(244, 247, 240, 0.90)",
    "--t-nav-shadow":         "rgba(26, 46, 18, 0.05)",
    "--t-hero-gradient-to":   "#F4F7F0",
    "--t-hero-overlay":        "linear-gradient(to bottom, rgba(0,0,0,0.55), rgba(0,0,0,0.35), rgba(0,0,0,0.25), var(--t-hero-gradient-to))",
    "--t-nav-text":            "#4A6340",
    "--t-scrollbar-track":    "#EBF0E4",
    "--t-selection-color":    "#1A2E12",
  },
};

/** All available themes for a future theme picker */
export const allThemes = [sattvicTheme, darkTheme, vrindavanTheme];

/** Default active theme */
export const defaultTheme = sattvicTheme;
