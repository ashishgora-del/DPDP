# Theme Color Guidelines

## Overview
This document standardizes all color usage across the project. All components and pages must adhere to these guidelines to maintain visual consistency and a unified design system.

---

## Color Palette

### Core Colors

#### Primary Color
- **Light Mode**: `#030213` (Deep Purple/Black)
- **Dark Mode**: `oklch(0.985 0 0)` (Off-white)
- **Usage**: Main actions, primary buttons, navigation, headings
- **Foreground**: Auto-inverted for text contrast

#### Secondary Color
- **Light Mode**: `oklch(0.95 0.0058 264.53)` (Very Light Purple)
- **Dark Mode**: `oklch(0.269 0 0)` (Dark Gray)
- **Usage**: Alternative actions, secondary buttons, emphasis elements
- **Foreground**: 
  - Light: `#030213`
  - Dark: `oklch(0.985 0 0)`

#### Accent Color
- **Light Mode**: `#e9ebef` (Light Gray)
- **Dark Mode**: `oklch(0.269 0 0)` (Dark Gray)
- **Usage**: Highlights, hover states, subtle emphasis
- **Foreground**: `#030213` (Light) / `oklch(0.985 0 0)` (Dark)

---

### Neutral Colors

#### Background
- **Light Mode**: `#ffffff` (Pure White)
- **Dark Mode**: `oklch(0.145 0 0)` (Very Dark Gray/Black)
- **Usage**: Page backgrounds, primary surface

#### Foreground (Text)
- **Light Mode**: `oklch(0.145 0 0)` (Very Dark Gray/Black)
- **Dark Mode**: `oklch(0.985 0 0)` (Off-white)
- **Usage**: Body text, primary text color

#### Card
- **Light Mode**: `#ffffff` (Pure White)
- **Dark Mode**: `oklch(0.145 0 0)` (Very Dark Gray/Black)
- **Usage**: Card backgrounds, component surfaces
- **Foreground**: Same as foreground color

#### Muted
- **Light Mode**: `#ececf0` (Light Gray)
- **Dark Mode**: `oklch(0.269 0 0)` (Dark Gray)
- **Usage**: Disabled states, secondary text
- **Foreground**:
  - Light: `#717182` (Medium Gray)
  - Dark: `oklch(0.708 0 0)` (Light Gray)

#### Border
- **Light Mode**: `rgba(0, 0, 0, 0.1)` (Subtle Black)
- **Dark Mode**: `oklch(0.269 0 0)` (Dark Gray)
- **Usage**: Component borders, dividers, separators

---

### Interactive Colors

#### Popover
- **Light Mode**: `oklch(1 0 0)` (Pure White)
- **Dark Mode**: `oklch(0.145 0 0)` (Very Dark Gray/Black)
- **Foreground**:
  - Light: `oklch(0.145 0 0)` (Very Dark Gray/Black)
  - Dark: `oklch(0.985 0 0)` (Off-white)
- **Usage**: Dropdown menus, tooltips, popovers

#### Input
- **Light Mode**: `transparent`
- **Dark Mode**: `oklch(0.269 0 0)` (Dark Gray)
- **Background**: `#f3f3f5` (Light Gray) - Light mode only
- **Usage**: Input fields, form elements

#### Switch Background
- **Light Mode**: `#cbced4` (Medium Gray)
- **Dark Mode**: Auto-inverted
- **Usage**: Toggle switches, checkbox backgrounds

#### Ring (Focus)
- **Light Mode**: `oklch(0.708 0 0)` (Light Gray)
- **Dark Mode**: `oklch(0.439 0 0)` (Medium Gray)
- **Usage**: Focus states, keyboard navigation outlines

---

### Semantic Colors

#### Destructive (Error/Danger)
- **Light Mode**: `#d4183d` (Red)
- **Dark Mode**: `oklch(0.396 0.141 25.723)` (Darker Red)
- **Foreground**:
  - Light: `#ffffff` (White)
  - Dark: `oklch(0.637 0.237 25.331)` (Light Red)
- **Usage**: Delete actions, error messages, critical warnings

---

### Chart Colors
For data visualization and charts:

**Light Mode**:
- Chart 1: `oklch(0.646 0.222 41.116)` (Orange)
- Chart 2: `oklch(0.6 0.118 184.704)` (Blue)
- Chart 3: `oklch(0.398 0.07 227.392)` (Dark Blue)
- Chart 4: `oklch(0.828 0.189 84.429)` (Yellow-Green)
- Chart 5: `oklch(0.769 0.188 70.08)` (Green)

**Dark Mode**:
- Chart 1: `oklch(0.488 0.243 264.376)` (Purple)
- Chart 2: `oklch(0.696 0.17 162.48)` (Cyan)
- Chart 3: `oklch(0.769 0.188 70.08)` (Green)
- Chart 4: `oklch(0.627 0.265 303.9)` (Magenta)
- Chart 5: `oklch(0.645 0.246 16.439)` (Orange-Red)

---

### Sidebar Colors

#### Sidebar Background
- **Light Mode**: `oklch(0.985 0 0)` (Off-white)
- **Dark Mode**: `oklch(0.205 0 0)` (Very Dark)
- **Foreground**: Auto-adjusted text color

#### Sidebar Primary
- **Light Mode**: `#030213` (Deep Purple/Black)
- **Dark Mode**: `oklch(0.488 0.243 264.376)` (Purple)
- **Foreground**: Auto-adjusted text color

#### Sidebar Accent
- **Light Mode**: `oklch(0.97 0 0)` (Very Light Gray)
- **Dark Mode**: `oklch(0.269 0 0)` (Dark Gray)
- **Foreground**:
  - Light: `oklch(0.205 0 0)` (Very Dark)
  - Dark: `oklch(0.985 0 0)` (Off-white)

#### Sidebar Border
- **Light Mode**: `oklch(0.922 0 0)` (Light Gray)
- **Dark Mode**: `oklch(0.269 0 0)` (Dark Gray)

#### Sidebar Ring
- **Light Mode**: `oklch(0.708 0 0)` (Light Gray)
- **Dark Mode**: `oklch(0.439 0 0)` (Medium Gray)

---

## Typography & Spacing

### Font Weights
- **Medium**: `500` (Used for headings, labels, buttons)
- **Normal**: `400` (Used for body text, input fields)

### Border Radius System
The project uses a base radius of `0.625rem` (10px) with variants:
- **Small**: `calc(0.625rem - 4px)` = `6px`
- **Medium**: `calc(0.625rem - 2px)` = `8px`
- **Large**: `0.625rem` = `10px` (default)
- **Extra Large**: `calc(0.625rem + 4px)` = `14px`

**Usage**: Apply via Tailwind utilities: `rounded-sm`, `rounded-md`, `rounded-lg`, `rounded-xl`

### Base Font Size
- **HTML Base**: `16px`
- **All typography** (h1-h4, p, label, button, input) inherits from this base

---

## Styling Approach

### CSS Variables
All colors are implemented as CSS Custom Properties in `src/styles/theme.css` and organized by context:

```css
/* Light mode defaults in :root */
--primary: #030213
--secondary: oklch(0.95 0.0058 264.53)
--accent: #e9ebef
/* ... more variables ... */

/* Dark mode overrides in .dark class */
--primary: oklch(0.985 0 0)
--secondary: oklch(0.269 0 0)
/* ... more variables ... */
```

### Tailwind Integration
Colors are exposed to Tailwind CSS through `@theme` directive:

```css
--color-primary: var(--primary)
--color-secondary: var(--secondary)
--color-accent: var(--accent)
/* ... etc ... */
```

---

## Usage Examples

### Primary Button
```jsx
<button className="bg-primary text-primary-foreground">
  Primary Action
</button>
```

### Destructive Button
```jsx
<button className="bg-destructive text-destructive-foreground">
  Delete
</button>
```

### Text on Card
```jsx
<div className="bg-card text-card-foreground">
  Card content
</div>
```

### Input Field
```jsx
<input className="bg-input-background border-border text-foreground" />
```

---

## Dark Mode Implementation

### Enabling Dark Mode
Add the `dark` class to the root HTML element:

```jsx
document.documentElement.classList.add('dark')
```

### Auto-Switching
Use the `next-themes` provider (already configured in your project) to automatically switch based on system preferences.

---

## Contrast & Accessibility

All color combinations meet WCAG AA standards for contrast:
- **Text on background**: Minimum 7:1 ratio (AAA)
- **UI components**: Minimum 4.5:1 ratio (AA)
- **Large text**: Minimum 3:1 ratio

---

## Color Format Notes

### OKLch Color Space
OKLch is used for several colors to provide perceptually uniform color gradients and better dark mode support:
- More human-friendly than hex or RGB
- Consistent lightness across hues
- Better for theme variants

---

## Guidelines for New Components

1. **Always use CSS variables** — Never hardcode hex colors or RGB values
2. **Respect light/dark modes** — Use colors defined in both `:root` and `.dark` selectors
3. **Use semantic colors** — Prefer `--primary`, `--destructive` over `--chart-1`
4. **Test contrast** — Verify text readability in both light and dark modes
5. **Maintain consistency** — Refer to this guideline when creating or modifying components

---

## Complete Color References

| Component | Light | Dark | Usage |
|-----------|-------|------|-------|
| Background | `#ffffff` | `oklch(0.145 0 0)` | Page/surface backgrounds |
| Foreground | `oklch(0.145 0 0)` | `oklch(0.985 0 0)` | Primary text color |
| Card | `#ffffff` | `oklch(0.145 0 0)` | Card surfaces |
| Popover | `oklch(1 0 0)` | `oklch(0.145 0 0)` | Dropdowns, tooltips |
| Primary | `#030213` | `oklch(0.985 0 0)` | Main actions, buttons |
| Secondary | `oklch(0.95 0.0058 264.53)` | `oklch(0.269 0 0)` | Alternative actions |
| Accent | `#e9ebef` | `oklch(0.269 0 0)` | Highlights, emphasis |
| Destructive | `#d4183d` | `oklch(0.396 0.141 25.723)` | Errors, deletions |
| Border | `rgba(0,0,0,0.1)` | `oklch(0.269 0 0)` | Dividers, outlines |
| Input | `transparent` | `oklch(0.269 0 0)` | Input field borders |
| Input BG | `#f3f3f5` | — | Form field backgrounds |
| Switch BG | `#cbced4` | Auto-inverted | Toggle switches |
| Muted | `#ececf0` | `oklch(0.269 0 0)` | Disabled states |
| Muted Text | `#717182` | `oklch(0.708 0 0)` | Secondary/disabled text |
| Ring | `oklch(0.708 0 0)` | `oklch(0.439 0 0)` | Focus outlines |

---

## Updates
Last updated: February 14, 2026

When making color changes:
1. Update both light and dark modes
2. Update this documentation
3. Test across all pages
4. Verify accessibility compliance
