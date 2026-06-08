# Design System Inspired by Lando Norris

## 1. Visual Theme & Atmosphere

The Lando Norris design system embodies the essence of modern motorsports sophistication combined with a minimalist, high-performance aesthetic. Built around a contemplative palette of deep forest tones and luminous accent colors, the design conveys precision, speed, and elite athleticism. The visual language emphasizes negative space and refined typography, creating an premium digital environment that mirrors the calculated excellence of Formula 1 racing. Organic, flowing curves in the background pattern suggest motion and fluid dynamics, while the interaction with vibrant lime-green CTAs breaks through the neutral substrate to command immediate attention. This is a design system for those who appreciate understated luxury and purposeful restraint.

**Key Characteristics**
- Deep, earthy neutral foundation with high contrast highlights
- Strategic use of a single vibrant accent color (`#D2FF00`) for critical interactions
- Generous whitespace and minimal visual clutter
- Smooth, organic background patterns suggesting motion and elegance
- Premium serif/variable typeface for headings, clean sans for body copy
- Emphasis on immersive full-width experiences with precise typography hierarchy
- Refined border radius scales for subtle depth variation

## 2. Color Palette & Roles

### Primary

- **Deep Charcoal** (`#282C20`): Primary text color, used extensively across headings and body text; establishes visual weight and authority
- **Lime Accent** (`#D2FF00`): Primary call-to-action and interactive highlight; signals urgency and drives user engagement across buttons, badges, and focal points

### Accent Colors

- **Burnt Orange** (`#FF6B00`): Secondary accent for optional interactive states or alternative CTAs; rare but impactful emphasis
- **Light Lime** (`#B2C73A`): Muted accent for subtle hierarchy or secondary emphasis; bridges primary and neutral scales

### Interactive

- **Neon Yellow** (`#D2FF00`): Button backgrounds, link highlights, and focus states; maximum visibility and engagement signal
- **Deep Charcoal** (`#282C20`): Interactive text and icons on light surfaces; maintains legibility and hierarchy

### Neutral Scale

- **Warm Cream** (`#F4F4ED`): Primary background color; subtle warmth over pure white, reduces eye strain
- **Light Beige** (`#EBEEE0`): Secondary background or surface layer; creates soft depth
- **Warm Gray** (`#DDE1D2`): Divider, border, and subtle separation color; maintains cohesion with warm palette
- **Stone Gray** (`#B4B8A5`): Tertiary text, placeholder, or disabled states; reduced emphasis without disappearing
- **Charcoal Gray** (`#B9BBAD`): Fine detail and secondary borders; refined restraint
- **Medium Gray** (`#535450`): Secondary text on light backgrounds; accessible but lower priority
- **Very Dark Gray** (`#343A26`): Subtle dark overlay or ultra-refined borders

### Surface & Borders

- **Off-White** (`#F4F4ED`): Default surface and container backgrounds; warm, inviting baseline
- **Warm Gray** (`#DDE1D2`): Primary border and divider strokes; visible but not intrusive
- **Stone Gray** (`#B4B8A5`): Secondary borders and subtle separation; hierarchical depth

### Semantic / Status

- **Warning** (`#D2FF00`): Alert states, high-priority CTAs, active selection indicators; unmissable and energetic

## 3. Typography Rules

### Font Family

**Primary:** Mona Sans Variable (fallback: `ui-rounded, system-ui, sans-serif`)
A contemporary variable font offering fluid weight transitions and a modern, geometric character set perfect for both display and interface use.

**Secondary:** Mona Sans Variable (fallback: `system-ui, -apple-system, sans-serif`)
Maintains consistency across all typographic scales while allowing precise weight control for emphasis and hierarchy.

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|------|--------|-------------|-----------------|-------|
| Display / H1 | Mona Sans Variable | 38px | 700 | 44px | 0px | Hero headlines and primary page titles |
| Heading / H2 | Mona Sans Variable | 32px | 700 | 36px | 0px | Section headers and subheadings |
| Subheading / H3 | Mona Sans Variable | 12px | 600 | 15px | 0px | Minor section labels and caps |
| Body Text | Mona Sans Variable | 16.67px | 400 | 20.83px | 0px | Primary paragraph and continuous reading |
| Button / Link | Mona Sans Variable | 14px | 400 | 20px | 0px | Interactive text elements |
| Link Label | Mona Sans Variable | 14px | 400 | 20px | 0px | Standalone navigation links |
| Caption / Small | Mona Sans Variable | 12px | 400 | 15px | 0px | Helper text, metadata, timestamps |
| Emphasis / Strong | Mona Sans Variable | 16.67px | 800 | 16.67px | 0px | Bold inline emphasis and highlights |

### Principles

- **Progressive Clarity:** Weight increases with hierarchy importance; 400 for body, 600 for labels, 700–800 for headlines
- **Breathing Room:** Line height maintains 1.2–1.25x multiplier for readability and visual rest
- **Precision Over Pixels:** Use exact px values; avoid relative units (em/rem) for consistency across components
- **Minimal Tracking:** Letter spacing defaults to 0px; add negative spacing only in caps at `12px` for refined effect
- **Variable Advantage:** Leverage Mona Sans's variable nature for micro-interactions and weight transitions without additional font files

## 4. Component Stylings

### Buttons

#### Primary Button (Solid)

- **Background:** `#D2FF00`
- **Text Color:** `#282C20`
- **Font Size:** `14px`
- **Font Weight:** `400`
- **Padding:** `0px 13.33px`
- **Border Radius:** `7.2px`
- **Border:** `1px solid #D2FF00`
- **Height:** `50px`
- **Box Shadow:** `none`
- **Line Height:** `20px`
- **Hover State:** Reduce opacity to `0.85` or darken background to `#B8D700`; add subtle lift via `box-shadow: 0px 4px 12px rgba(210, 255, 0, 0.2)`
- **Active State:** Opacity `0.7` or background `#A0B800`; `box-shadow: inset 0px 2px 4px rgba(0, 0, 0, 0.1)`
- **Disabled State:** Background `#DDE1D2`; text color `#B4B8A5`; `box-shadow: none`

#### Secondary Button (Ghost)

- **Background:** `rgba(0, 0, 0, 0)` (transparent)
- **Text Color:** `#282C20`
- **Font Size:** `14px`
- **Font Weight:** `400`
- **Padding:** `0px`
- **Border Radius:** `0px`
- **Border:** `0px none`
- **Height:** `16px`
- **Box Shadow:** `none`
- **Line Height:** `20px`
- **Hover State:** Text color `#B2C73A`; add bottom border `1px solid #B2C73A` for subtle underline effect
- **Active State:** Text color `#B4B8A5`; border remains visible
- **Disabled State:** Text color `#DDE1D2`; no border

#### Tertiary Button (Icon)

- **Background:** `rgba(0, 0, 0, 0)` (transparent)
- **Text Color:** `#282C20`
- **Font Size:** `14px`
- **Font Weight:** `400`
- **Padding:** `0px`
- **Border Radius:** `0px`
- **Border:** `0px none`
- **Width/Height:** `16px`
- **Box Shadow:** `none`
- **Hover State:** Opacity `0.7`; slight scale transform `scale(1.1)`
- **Active State:** Opacity `0.5`
- **Disabled State:** Opacity `0.3`

### Cards & Containers

#### Large Hero Card

- **Background:** `rgba(0, 0, 0, 0)` (transparent or inherit)
- **Text Color:** `#111112`
- **Font Size:** `14px`
- **Font Weight:** `400`
- **Padding:** `0px`
- **Border Radius:** `0px`
- **Border:** `0px none`
- **Height:** `480px`
- **Width:** Full-width or `1066.66px`
- **Box Shadow:** `none`

#### Rounded Content Card

- **Background:** `rgba(0, 0, 0, 0)` (or `#F4F4ED` for filled variant)
- **Text Color:** `#111112`
- **Font Size:** `14px`
- **Font Weight:** `400`
- **Padding:** `0px` (or `32px` for filled variant)
- **Border Radius:** `44.22px` (highly rounded, pill-like)
- **Border:** `0px none` (or `1px solid #DDE1D2` for outlined variant)
- **Height:** `466.66px`
- **Width:** `266.66px`
- **Box Shadow:** `none` (or `0px 8px 24px rgba(40, 44, 32, 0.08)` for elevated variant)
- **Hover State (Filled):** Background `#EBEEE0`; `box-shadow: 0px 12px 32px rgba(40, 44, 32, 0.12)`
- **Hover State (Outlined):** Border `1px solid #B4B8A5`; background `#EBEEE0`

#### Standard Card (Square)

- **Background:** `rgba(0, 0, 0, 0)` (or `#F4F4ED`)
- **Text Color:** `#111112`
- **Font Size:** `14px`
- **Font Weight:** `400`
- **Padding:** `0px` (or `28px`)
- **Border Radius:** `0px` (sharp corners)
- **Border:** `0px none` (or `1px solid #DDE1D2`)
- **Height:** `466.66px`
- **Width:** `266.66px`
- **Box Shadow:** `none` (or `0px 4px 16px rgba(40, 44, 32, 0.06)`)

### Inputs & Forms

#### Text Input

- **Background:** `#F4F4ED`
- **Text Color:** `#282C20`
- **Border:** `1px solid #DDE1D2`
- **Border Radius:** `7.2px`
- **Padding:** `12px 16px`
- **Font Size:** `14px`
- **Font Family:** `Mona Sans Variable`
- **Font Weight:** `400`
- **Line Height:** `20px`
- **Placeholder Color:** `#B4B8A5`
- **Focus State:** Border `1px solid #D2FF00`; `box-shadow: 0px 0px 0px 3px rgba(210, 255, 0, 0.1)`; background remains `#F4F4ED`
- **Error State:** Border `1px solid #FF6B00`; `box-shadow: 0px 0px 0px 3px rgba(255, 107, 0, 0.1)`

#### Checkbox

- **Size:** `16px × 16px`
- **Background:** `#F4F4ED`
- **Border:** `1px solid #B4B8A5`
- **Border Radius:** `3px`
- **Checked Background:** `#D2FF00`
- **Checked Border:** `1px solid #D2FF00`
- **Checkmark Color:** `#282C20`
- **Focus Ring:** `0px 0px 0px 3px rgba(210, 255, 0, 0.2)`

#### Form Label

- **Font Size:** `14px`
- **Font Weight:** `400`
- **Color:** `#282C20`
- **Line Height:** `20px`
- **Margin Bottom:** `8px`

### Navigation

#### Top Navigation Bar

- **Background:** `#F4F4ED`
- **Height:** `64px`
- **Border Bottom:** `1px solid #DDE1D2`
- **Padding:** `0px 32px`
- **Display:** `flex`, `justify-content: space-between`, `align-items: center`

#### Navigation Link

- **Font Size:** `14px`
- **Font Weight:** `400`
- **Color:** `#282C20`
- **Line Height:** `20px`
- **Padding:** `8px 16px`
- **Border Radius:** `4px`
- **Hover State:** Background `#EBEEE0`; color remains `#282C20`
- **Active State:** Color `#D2FF00`; bottom border `2px solid #D2FF00`
- **Disabled State:** Color `#DDE1D2`

#### Mobile Navigation (Hamburger Menu)

- **Icon Size:** `24px × 24px`
- **Icon Color:** `#282C20`
- **Icon Hover:** Color `#B2C73A`; scale `1.05`
- **Menu Background:** `#F4F4ED`
- **Menu Border:** `1px solid #DDE1D2`

## 5. Layout Principles

### Spacing System

**Base Unit:** `4px`

The spacing system is built on a `4px` base, allowing for precise control and flexible combinations:

- **Micro Gaps:** `4px`, `8px` — between inline elements, icon spacing
- **Small Gaps:** `12px`, `16px` — padding within components, tight grouping
- **Medium Gaps:** `20px`, `24px` — section padding, loose grouping
- **Large Gaps:** `32px`, `52px` — major section spacing, breathing room
- **Extra Large Gaps:** `64px`, `72px`, `76px` — hero sections, page-level separation

**Usage Context:**
- Buttons: `16px` horizontal padding
- Cards: `28px`–`32px` internal padding
- Section margins: `52px`–`76px` vertical
- Input padding: `12px` vertical, `16px` horizontal
- Navigation padding: `32px` horizontal, `0px` vertical

### Grid & Container

- **Max Width:** `1200px` for primary content containers
- **Column Strategy:** 12-column grid at desktop, collapsing to 4 columns at tablet, 2 columns on mobile
- **Gutter:** `24px` between columns at desktop, `16px` at tablet, `12px` on mobile
- **Section Pattern:** Full-width background with centered content container; allows for edge-to-edge color blocks while maintaining readable column width
- **Container Padding:** `32px` left/right at desktop, `24px` at tablet, `16px` on mobile

### Whitespace Philosophy

Whitespace is treated as a first-class design element. The system embraces negative space to reduce cognitive load and emphasize content hierarchy. Generous margins between sections create breathing room and allow focal points to stand out. Text blocks are separated from imagery by at least `32px`–`52px` of space. The aim is to create a calm, meditative user experience where every element has room to exist without competing for attention.

### Border Radius Scale

- **Sharp:** `0px` — primary structure, grids, full-width blocks
- **Subtle:** `3px`–`4px` — form inputs, tight UI elements
- **Refined:** `7.2px` — buttons, small cards, secondary containers
- **Rounded:** `9.87px` — modal dialogs, enhanced components
- **Pill:** `44.22px` — avatar containers, fully rounded cards, highlight components

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat (0) | No shadow, solid background | Base surfaces, primary text layers, grids |
| Raised (1) | `0px 4px 12px rgba(40, 44, 32, 0.08)` | Hover states on cards, subtle interactive feedback |
| Lifted (2) | `0px 8px 24px rgba(40, 44, 32, 0.12)` | Elevated cards, dialog overlays, navigation dropdowns |
| Floating (3) | `0px 12px 32px rgba(40, 44, 32, 0.16)` | Modal dialogs, popovers, critical floating elements |
| Inset (Pressed) | `inset 0px 2px 4px rgba(0, 0, 0, 0.1)` | Active button states, depressed interactions |

**Shadow Philosophy:** Shadows are minimal and refined, using a dark charcoal (`rgba(40, 44, 32, ...)`) at low opacity to suggest depth without overwhelming the interface. Shadows increase in blur and spread as elevation increases, creating a clear spatial hierarchy. The system avoids harsh or oversaturated shadows; subtlety is preferred to maintain the premium, sophisticated aesthetic.

## 7. Do's and Don'ts

### Do

- **Use `#D2FF00` sparingly** — Reserve the lime accent for primary CTAs and high-priority interactive states; overuse dilutes its impact and urgency
- **Maintain the warm neutral baseline** — Prefer `#F4F4ED` over pure white (`#FFFFFF`) to reduce eye strain and maintain the system's warm personality
- **Embrace negative space** — Allow sections to breathe with `52px`–`76px` vertical margins; crowded layouts contradict the design intent
- **Leverage weight variation in Mona Sans** — Use 400 for body, 600 for labels, 700–800 for headlines to create subtle but distinct hierarchy without adding font files
- **Stack cards with `44.22px` radius** — The pill-shaped border radius is a signature element; use it consistently for featured content and highlighted containers
- **Respect the 4px grid** — All spacing, padding, and gaps should be multiples of `4px` to maintain alignment precision across all breakpoints
- **Apply focus rings to interactive elements** — Use `0px 0px 0px 3px rgba(210, 255, 0, 0.1)` on all focusable elements for accessibility compliance

### Don't

- **Don't pair `#D2FF00` with dark backgrounds below `#343A26`** — The contrast ratio drops; use `#B2C73A` instead for lighter, more readable accent text on very dark surfaces
- **Don't use pure black (`#000000`) or pure white (`#FFFFFF`)** — The system palette excludes these; always use dark charcoal (`#282C20` or `#111112`) and warm cream (`#F4F4ED`)
- **Don't add rounded corners to large structural containers** — Keep major layout blocks (hero sections, full-width zones) at `0px` radius; reserve rounding for contained cards and modular components
- **Don't mix font families** — Mona Sans Variable is the exclusive typeface; avoid adding secondary typefaces that disrupt system consistency
- **Don't apply drop shadows to text** — Text should remain flat with no shadow treatment; reserve shadows for container-level depth only
- **Don't exceed `#535450` opacity for secondary text** — Text below this gray level becomes inaccessible; check WCAG AA contrast ratios if venturing darker
- **Don't use orange (`#FF6B00`) as a primary color** — Orange is a rare accent reserved for alerts or non-standard emphasis; it contradicts the cool, forest-tone brand voice

## 8. Responsive Behavior

### Breakpoints

| Breakpoint | Width | Key Changes |
|------------|-------|-------------|
| Mobile | 320px–639px | 2-column grid, `16px` padding, font scale reduced by 10–15%, buttons full-width, hamburger menu activates |
| Tablet | 640px–1023px | 4-column grid, `24px` padding & gutters, headings scale to 28px, stacked layout for hero sections |
| Desktop | 1024px+ | 12-column grid, `32px` padding, full typography scale, side-by-side cards, max-width containers centered |
| Large Desktop | 1440px+ | Optional expanded max-width to `1400px`, increased section margins to `76px`, enhanced spacing flexibility |

### Touch Targets

- **Minimum Interactive Size:** `44px × 44px` for buttons, links, and icon targets on touch devices
- **Comfortable Spacing:** `56px × 56px` preferred for frequently tapped elements (primary CTAs, navigation links)
- **Minimum Spacing Between Targets:** `8px` horizontal and vertical to prevent accidental taps

### Collapsing Strategy

- **Hero Section:** Full-width at all breakpoints; image scales responsively, text size reduces progressively from `38px` (desktop) → `28px` (tablet) → `22px` (mobile)
- **Card Grid:** 3 columns desktop (6-col gutter), 2 columns tablet (8-col gutter), 1 column mobile (full-width, `16px` padding)
- **Navigation:** Horizontal menu bar at desktop/tablet; collapses to hamburger icon at mobile, slides in from left with overlay backdrop
- **Form Inputs:** Full-width on mobile/tablet; max-width `400px` on desktop
- **Button Width:** Grows to full-width on mobile; fixed width on tablet/desktop
- **Typography Scaling:** Use `calc()` or predefined scale; avoid single breakpoint jumps; smooth transitions via CSS media queries at each tier

## 9. Agent Prompt Guide

### Quick Color Reference

- **Primary CTA / Action:** Lime Accent (`#D2FF00`) — high-visibility buttons, active states, critical highlights
- **Primary Text / Headings:** Deep Charcoal (`#282C20`) — dominant text color, main body copy, navigation
- **Background / Surface:** Warm Cream (`#F4F4ED`) — default page background, container fills, neutral zones
- **Secondary Text / Disabled:** Stone Gray (`#B4B8A5`) — placeholder text, hints, disabled states, tertiary information
- **Borders / Dividers:** Warm Gray (`#DDE1D2`) — rule lines, input borders, subtle separation
- **Accent / Emphasis:** Light Lime (`#B2C73A`) — secondary highlight, muted interactive feedback, hover states on secondary elements
- **Warning / Alert:** Burnt Orange (`#FF6B00`) — error states, critical alerts (use sparingly)

### Iteration Guide

1. **Establish hierarchy via weight, not size** — Default to `14px` font size; use Mona Sans weight (400/600/700/800) to signal importance. Only increase size for Display (`38px`) and Heading (`32px`) roles.

2. **Color contrast rule: always meet WCAG AA** — Text on backgrounds must have ≥4.5:1 contrast ratio. Check pairs: `#282C20` text on `#F4F4ED` (safe), `#B4B8A5` text on `#F4F4ED` (monitor), `#D2FF00` text on `#282C20` (safe but high saturation).

3. **Space in multiples of 4px** — All padding, margin, gap values must align to the 4px grid. Use `16px`, `24px`, `32px`, `52px`, `64px`, etc. Never use odd or non-divisible-by-4 values except in typography where exact px are specified.

4. **Apply the pill radius (`44.22px`) to 2–3 hero/feature cards per page** — Don't overuse; reserve for the most important content containers. Standard cards use `0px` or `7.2px`.

5. **Shadow as depth, not decoration** — Shadows have two purposes: (a) subtle hover feedback via `0px 4px 12px rgba(40, 44, 32, 0.08)`, (b) modal separation via `0px 12px 32px rgba(40, 44, 32, 0.16)`. No purely decorative shadows.

6. **Lime accent (`#D2FF00`) = user action required** — Reserve for primary buttons, focused form fields, active navigation states, and warnings. If text on dark background must use lime, check contrast; prefer `#B2C73A` instead.

7. **Mobile-first responsive design** — Start at `320px` width; define base styles for mobile, then enhance via media queries at tablet (`640px`) and desktop (`1024px`) breakpoints. Use `min-width` media queries.

8. **Border radius scale: 0 (structure) → 7.2 (component) → 44.22 (feature)** — Sharp corners for grids/sections, subtle rounding for buttons/inputs, full rounding for showcase cards. No in-between values.

9. **Typography baseline: 16.67px body, 14px UI text** — Never deviate from these core sizes except at display (`38px`), heading (`32px`), or caption (`12px`) roles. Maintain `20px` or `20.83px` line-height for readability.

10. **Warm palette consistency** — All backgrounds, borders, and neutrals should trend warm (cream, beige, stone) rather than cool (pure gray, blue-tint). This maintains the premium, organic aesthetic across all surfaces.