---
name: Field Ops Precision
colors:
  surface: '#f9f9ff'
  surface-dim: '#cadaff'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f3ff'
  surface-container: '#e8edff'
  surface-container-high: '#e0e8ff'
  surface-container-highest: '#d7e2ff'
  on-surface: '#041b3c'
  on-surface-variant: '#434654'
  inverse-surface: '#1d3052'
  inverse-on-surface: '#edf0ff'
  outline: '#737685'
  outline-variant: '#c3c6d6'
  surface-tint: '#0c56d0'
  primary: '#003d9b'
  on-primary: '#ffffff'
  primary-container: '#0052cc'
  on-primary-container: '#c4d2ff'
  inverse-primary: '#b2c5ff'
  secondary: '#914d00'
  on-secondary: '#ffffff'
  secondary-container: '#fe8a00'
  on-secondary-container: '#613100'
  tertiary: '#004e32'
  on-tertiary: '#ffffff'
  tertiary-container: '#006844'
  on-tertiary-container: '#72e9af'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2ff'
  primary-fixed-dim: '#b2c5ff'
  on-primary-fixed: '#001848'
  on-primary-fixed-variant: '#0040a2'
  secondary-fixed: '#ffdcc3'
  secondary-fixed-dim: '#ffb77e'
  on-secondary-fixed: '#2f1500'
  on-secondary-fixed-variant: '#6e3900'
  tertiary-fixed: '#82f9be'
  tertiary-fixed-dim: '#65dca4'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005235'
  background: '#f9f9ff'
  on-background: '#041b3c'
  surface-variant: '#d7e2ff'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Atkinson Hyperlegible Next
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontFamily: Atkinson Hyperlegible Next
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  touch-target-min: 48px
  margin-page: 16px
  gutter-grid: 12px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 24px
  inset-card: 16px
---

## Brand & Style

The design system is engineered for utility, clarity, and reliability in demanding environments. It targets field technicians, surveyors, and logistics personnel who require immediate data legibility under varying light conditions. 

The aesthetic is **High-Contrast / Modern**, prioritizing functional hierarchy over decorative elements. It utilizes a structured, systematic approach inspired by industrial interface design. The emotional response is one of "Technical Confidence"—the user should feel that the tool is robust, precise, and incapable of data loss. Every interaction is designed to be intentional and high-visibility, ensuring that the interface remains usable even during rapid movement or in high-glare outdoor settings.

## Colors

This design system employs a high-contrast palette optimized for sunlight legibility and status clarity. 

- **Primary Blue (#0052CC):** Used for primary actions, navigation, and active syncing states. It represents professional stability.
- **Secondary Orange (#FF8B00):** A high-visibility status color specifically for "Sync Pending" or "Attention Required" states.
- **Success Green (#36B37E):** Indicates completed surveys and successful data transmission.
- **Neutral Navy (#172B4D):** Used for deep-contrast text and structural elements to ensure readability against light backgrounds.

Backgrounds utilize pure white (#FFFFFF) and light gray (#F4F5F7) to maximize contrast ratios for text and iconography.

## Typography

Typography is the backbone of this design system's accessibility. 

- **Headlines:** Use **Hanken Grotesk** for a sharp, modern, and professional appearance that remains legible at a glance.
- **Body:** Use **Atkinson Hyperlegible Next** to maximize character differentiation, reducing errors during data entry and reading in the field.
- **Technical Labels:** Use **JetBrains Mono** for status codes, coordinate data, and time stamps. The monospaced nature ensures that fluctuating numbers do not cause layout shifts and provides a technical, precise feel.

All body text is set to a minimum of 16px to ensure compliance with mobile accessibility standards for outdoor use.

## Layout & Spacing

The layout follows a **Fluid Grid** model optimized for React Native's Flexbox engine. 

- **Safe Zones:** A 16px horizontal margin is enforced globally to prevent content from hitting device edges.
- **Touch Targets:** Every interactive element adheres to a minimum 48x48px hit area to accommodate gloved hands or movement.
- **Vertical Rhythm:** A strict 8px base unit is used for all padding and margins to maintain structural consistency.
- **Responsive Behavior:** On larger mobile devices or tablets, the layout shifts to a two-column detail view for survey forms while maintaining the same 48px touch-target height.

## Elevation & Depth

This design system uses **Bold Borders** and **Tonal Layers** rather than soft shadows to define hierarchy. This ensures that depth is visible even when screen brightness is turned up to maximum in outdoor environments.

- **Level 0 (Surface):** The base background (#F4F5F7).
- **Level 1 (Card):** White surfaces (#FFFFFF) with a 1px solid border (#DFE1E6). No shadow.
- **Level 2 (Active/Floating):** White surfaces with a 2px primary-colored border or a high-contrast, low-blur shadow (Offset 0, 4; Blur 0; Color: rgba(23, 43, 77, 0.2)) to simulate physical layering.

The "Syncing" bar uses a persistent top-fixed position with a high-contrast background to denote its importance over the standard UI stack.

## Shapes

The shape language is **Soft (0.25rem)**. This provides a balanced aesthetic that feels professional and systematic without being overly clinical or aggressive. 

- **Primary Buttons:** 4px (0.25rem) corner radius for a sturdy, blocky feel.
- **Form Inputs:** 4px corner radius to match the systematic grid.
- **Status Badges:** 2px corner radius or sharp corners to differentiate them from interactive buttons.
- **Cards:** 8px (0.5rem) corner radius to create a clear container distinction for data groups.

## Components

### Buttons
- **Primary:** Solid #0052CC background with White text. Bold 16px Hanken Grotesk.
- **Secondary:** Transparent background with 2px #0052CC border.
- **Critical:** Solid #DE350B (Error) for destructive field actions.

### Sync & Offline Indicators
- **Sync Bar:** A persistent header component. When syncing, it pulses with #0052CC. When offline, it switches to #6B778C with a "Stale Data" warning icon.
- **Status Chips:** Small badges using JetBrains Mono. "Pending" uses Secondary Orange; "Synced" uses Success Green.

### Input Fields
- **Design:** Large 56px height fields for easy tapping. 
- **Active State:** 2px solid #0052CC border with a light blue tinted background to clearly highlight the current field of entry.

### Cards & Lists
- **Survey Cards:** Use a 1px border. The left edge of the card features a 4px vertical "status stripe" color-coded to the survey's current state (e.g., green for completed, orange for draft).

### Selection Controls
- **Checkboxes/Radios:** Oversized (24x24px) with high-contrast checkmarks. Designed for unambiguous selection in high-glare environments.