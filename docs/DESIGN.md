---
name: Kinetic Minimalist Workspace
colors:
  surface: '#fdf9f4'
  surface-dim: '#ddd9d5'
  surface-bright: '#fdf9f4'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f7f3ee'
  surface-container: '#f1ede8'
  surface-container-high: '#ebe8e3'
  surface-container-highest: '#e6e2dd'
  on-surface: '#1c1c19'
  on-surface-variant: '#474554'
  inverse-surface: '#31302d'
  inverse-on-surface: '#f4f0eb'
  outline: '#787586'
  outline-variant: '#c8c4d7'
  surface-tint: '#5746d5'
  primary: '#3d27bc'
  on-primary: '#ffffff'
  primary-container: '#5645d4'
  on-primary-container: '#d7d2ff'
  inverse-primary: '#c6bfff'
  secondary: '#605c6e'
  on-secondary: '#ffffff'
  secondary-container: '#e6dff5'
  on-secondary-container: '#666274'
  tertiary: '#005036'
  on-tertiary: '#ffffff'
  tertiary-container: '#006b4a'
  on-tertiary-container: '#79edb9'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e4dfff'
  primary-fixed-dim: '#c6bfff'
  on-primary-fixed: '#150066'
  on-primary-fixed-variant: '#3e28bd'
  secondary-fixed: '#e6dff5'
  secondary-fixed-dim: '#c9c3d8'
  on-secondary-fixed: '#1c1a29'
  on-secondary-fixed-variant: '#484456'
  tertiary-fixed: '#85f8c4'
  tertiary-fixed-dim: '#68dba9'
  on-tertiary-fixed: '#002114'
  on-tertiary-fixed-variant: '#005137'
  background: '#fdf9f4'
  on-background: '#1c1c19'
  surface-variant: '#e6e2dd'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.025em
  display-lg-mobile:
    fontFamily: Inter
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: -0.005em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: -0.005em
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0em
  label-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.03em
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-mobile: 0.75rem
  margin: 1.5rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1.25rem
  space-xl: 2rem
---

## Brand & Style

The design system is crafted for high-velocity internal productivity, structured project management, and information architecture. The aesthetic balances the restraint of an editorial document editor with the precision of an integrated operational console.

Key brand attributes:
- **Calm Authority**: Eliminates optical clutter to optimize for deep focus, long-session stamina, and low cognitive exhaustion.
- **Architectural Structure**: Employs rigorous alignment, hairline dividers, and deliberate whitespace rather than heavy backgrounds or intrusive drop shadows.
- **Functional Density**: Prioritizes keyboard navigation, swift scanning, dense information display, and instant context comprehension over decorative excess.
- **Tactile Modernism**: Combines warm paper-like backdrops (`#fbfbfa`), pure white cards (`#ffffff`), and an electric royal purple accent (`#5645d4`) to communicate focused modern utility.

## Colors

The palette relies on high-legibility neutrals paired with targeted functional accents.

- **Canvas & Surfaces**:
  - Root App Canvas: `#fbfbfa` (Warm Paper Gray)
  - Surface Card / Modal / Popover: `#ffffff` (Pure White)
  - Subdued / Hover State Surface: `#f4f3f0`
  - Subtle Inset Surface: `#eeece8`
- **Border & Hairline Structure**:
  - Structural Hairline: `#e5e3df` (1px solid default)
  - Focused / Active Hairline: `#c8c5be`
  - Selected / Active Highlight: `#5645d4`
- **Typography & Foreground**:
  - Primary Text: `#1a1918` (High-contrast deep charcoal, 4.5+:1 ratio)
  - Secondary / Metadata Text: `#5e5b56`
  - Muted / Placeholder Text: `#8d8a83`
  - Inverse Text: `#ffffff`
- **Accent**:
  - Primary Action / Selection: `#5645d4`
  - Primary Hover: `#4737b8`
  - Primary Subtle Tint (Active tab / Selection highlight): `#f5f3ff`
- **Status Indicator Tokens**:
  - **Success / Completed**: Background `#ecfdf5`, Text `#047857`, Border `#a7f3d0`
  - **Warning / In Progress**: Background `#fffbeb`, Text `#92400e`, Border `#fde68a`
  - **Critical / Blocked**: Background `#fef2f2`, Text `#b91c1c`, Border `#fecaca`
  - **Information / Planning**: Background `#f0f9ff`, Text `#0369a1`, Border `#bae6fd`
  - **Milestone / Priority**: Background `#f5f3ff`, Text `#5645d4`, Border `#ddd6fe`

## Typography

The typographical scale is engineered for high data density, tabular scanning, and seamless document writing. Inter is used across all hierarchies, with JetBrains Mono designated for monospace tasks, identifiers, and formula syntax.

- **Negative Letter Spacing**: Display and headline levels incorporate tight negative tracking (`-0.025em` to `-0.01em`) to maintain sharp, compact visual grouping.
- **Micro-Labels**: `label-sm` utilizes an uppercase-ready 11px scale with positive tracking (`0.03em`) for section overlines, table headers, and hotkey hints.
- **Tabular Numerics**: Tabular figures (`tnum`) and slashed zeros (`zero`) are globally enabled for data grids, financial tallies, and timestamps.

## Layout & Spacing

The layout is divided into a three-pane fluid productivity architecture:
1. **Collapsible Workspace Sidebar** (Fixed 240px–280px width)
2. **Dynamic Work Canvas** (Fluid 12-column grid with `1rem` gutters)
3. **Contextual Slide-Over / Inspector Panel** (Fixed 380px or 480px width)

### Breakpoints & Adaptability
- **Desktop (>= 1280px)**: Full multi-pane view. Canvas margins set to `1.5rem`. Simultaneous table and detail pane display.
- **Tablet (768px – 1279px)**: Sidebar shifts to an off-canvas drawer. Inspector panel stacks into an overlay modal. Canvas padding set to `1.25rem`.
- **Mobile (< 768px)**: Strict single-column view. Bottom-sheet drawer navigation replaces side panels. Gutter scales down to `0.75rem`, margins to `1rem`. Density scales dynamically to preserve touch targets while keeping horizontal overflow minimal.

## Elevation & Depth

Visual hierarchy in this design system is established through structural perimeter hairlines and precise tonal stratification, avoiding heavy or blurred drop shadows.

- **Base Layer (Elevation 0)**: Root document surface (`#fbfbfa`). Flat, boundary-less canvas for top-level navigation and breadcrumbs.
- **Surface Layer (Elevation 1)**: Cards, kanban lanes, tables, and detail containers (`#ffffff`). Encased in a `1px solid #e5e3df` border with an imperceptible ambient trace: `0 1px 2px 0 rgba(26, 25, 24, 0.03)`.
- **Raised Interactive Layer (Elevation 2)**: Hovered cards, drag-and-drop handles, floating toolbars. Border remains `1px solid #e5e3df`, supported by `0 3px 6px -1px rgba(26, 25, 24, 0.05), 0 2px 4px -2px rgba(26, 25, 24, 0.05)`.
- **Overlay / Modal Layer (Elevation 3)**: Command palettes (`Cmd + K`), contextual dropdowns, and date pickers. Background `#ffffff`, border `1px solid #c8c5be`, depth delivered via `0 10px 25px -5px rgba(26, 25, 24, 0.08), 0 8px 10px -6px rgba(26, 25, 24, 0.04)`.

## Shapes

The design system maintains strict geometric intentionality. While containers use soft rounded corners, actionable and status elements deviate purposefully to create instant ergonomic differentiation.

- **Workspace Cards & Panels**: Fixed at `12px` (`rounded-xl` equivalent in this configuration) with `1px solid #e5e3df` borders.
- **Interactive Controls (Buttons, Inputs, Selectors)**: Fixed at `8px` corner radius. Buttons must never be pill-shaped.
- **Status Badges & Chips**: Strict full pills (`rounded-full` / `9999px`) to immediately visually differentiate data metadata from interactive buttons.
- **Inline Code & Shortcuts**: Subtly rounded at `4px`.

## Components

### Buttons
- **Primary**: Background `#5645d4`, text `#ffffff`, border radius `8px`, height `32px` (compact) or `36px` (regular). Hover background `#4737b8`. Active scale `0.99`. Focus-visible ring `2px solid #5645d4` with `2px` offset.
- **Secondary / Ghost**: Background `transparent`, border `1px solid #e5e3df`, text `#1a1918`, radius `8px`. Hover background `#f4f3f0`.
- **Tertiary / Subtle**: Background `transparent`, text `#5e5b56`, no border. Hover background `#eeece8`, hover text `#1a1918`.

### Status Badges (Pills)
- Always rendered as `rounded-full` pills with `padding: 2px 8px`, font size `11px`, font weight `600`, line height `14px`.
- **Completed**: `#ecfdf5` background, `#047857` text, `1px solid #a7f3d0`.
- **In Progress**: `#fffbeb` background, `#92400e` text, `1px solid #fde68a`.
- **Blocked**: `#fef2f2` background, `#b91c1c` text, `1px solid #fecaca`.
- **Review / Queue**: `#f0f9ff` background, `#0369a1` text, `1px solid #bae6fd`.
- **High Priority**: `#f5f3ff` background, `#5645d4` text, `1px solid #ddd6fe`.

### Form Inputs & Select Fields
- Background `#ffffff`, border `1px solid #e5e3df`, radius `8px`, height `34px`, horizontal padding `10px`.
- Typography: `body-md` (`14px`), text `#1a1918`.
- Focus state: Border color `#5645d4`, subtle focus ring `0 0 0 3px rgba(86, 69, 212, 0.12)`.

### Cards & Container Panels
- Background `#ffffff`, border `1px solid #e5e3df`, border radius `12px`, padding `16px` to `20px`.
- Header separator: `1px solid #e5e3df` border running flush to outer edges.

### Lists & Data Tables
- Row height: Dense `36px` or standard `44px`.
- Borders: Horizontal dividers only (`1px solid #e5e3df`).
- Table header: Background `#fbfbfa`, typography `label-sm` (`11px`, uppercase, tracking `0.03em`, text `#8d8a83`).
- Hover state: Row background transitions to `#f4f3f0` in `100ms`.

### Checkboxes & Selection Controls
- Checkbox size: `16px × 16px`, radius `4px`.
- Unchecked: `#ffffff` background, `1px solid #c8c5be` border.
- Checked: `#5645d4` background, `#ffffff` check icon, border `#5645d4`.

### Keyboard Shortcuts (KBD)
- Inline tag: Background `#eeece8`, border `1px solid #e5e3df`, radius `4px`, padding `1px 4px`, font `JetBrains Mono` at `11px`, text `#5e5b56`.