---
name: OnDemand Monitor Customer Portal
description: A calm, compact workspace for customers following monitoring requests and order progress.
colors:
  primary: "#1565E8"
  canvas: "#F4F7FC"
  surface: "#FFFFFF"
  surface-muted: "#F6F8FD"
  border: "#E6ECF5"
  ink: "#0F1B3D"
  muted: "#64748B"
  dark-primary: "#5AA0FF"
  dark-canvas: "#0B1226"
  dark-surface: "#111B36"
  dark-surface-muted: "#16213F"
  dark-border: "#1F2C4D"
  dark-ink: "#E6ECFA"
  dark-muted: "#93A1C0"
typography:
  headline:
    fontFamily: "Be Vietnam Pro, Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "24px"
    fontWeight: 800
    lineHeight: 1.25
  title:
    fontFamily: "Be Vietnam Pro, Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "16px"
    fontWeight: 700
  body:
    fontFamily: "Be Vietnam Pro, Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Be Vietnam Pro, Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "12.5px"
    fontWeight: 600
    lineHeight: 1.4
rounded:
  sm: "8px"
  md: "10px"
  lg: "12px"
  xl: "16px"
  dashboard: "14px"
  pill: "999px"
spacing:
  1: "4px"
  2: "8px"
  3: "12px"
  4: "16px"
  5: "20px"
  6: "24px"
  8: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    padding: "4px 15px"
    height: "38px"
    typography: "{typography.body}"
  button-default:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "4px 15px"
    height: "38px"
    typography: "{typography.body}"
  portal-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "16px 20px"
  overview-panel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.dashboard}"
    padding: "12px 18px"
  search-input:
    backgroundColor: "{colors.surface-muted}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "4px 11px"
    height: "38px"
  nav-item-selected:
    backgroundColor: "rgba(21, 101, 232, 0.09)"
    textColor: "{colors.primary}"
    rounded: "{rounded.md}"
    padding: "0 14px"
    height: "42px"
  status-chip:
    backgroundColor: "#e6f4ff"
    textColor: "#1677ff"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "2px 10px"
---

# Design System: OnDemand Monitor Customer Portal

## Overview

**Creative North Star: “The Clear Flightline”**

This document describes the customer-facing portal and its shared shell. The visual direction is compact, light, and progress-clear: customers should be able to scan records, read the next step, and move into an order without competing decoration. “The Clear Flightline” names that calm operational clarity, using the supplied product direction and the portal’s drone-monitoring context.

Be Vietnam Pro is the primary face because it is loaded with Vietnamese character support. Navy text, pale blue-gray surroundings, and white work surfaces keep the interface quiet. Blue marks actions and selected navigation; semantic colors stay on status labels and other small signals. Thin borders do most of the separating, with elevation kept light and selective.

**Key Characteristics:**
- Compact, scannable information hierarchy with clear progress cues.
- Blue is reserved for primary actions, links, and selected navigation.
- Pale blue-gray canvas, white surfaces, and fine cool borders.
- Vietnamese and English labels remain readable and allowed to wrap.
- Status colors are muted and attached to labeled statuses.

**The Clear Flightline Rule.** Give customers a quiet route from the current state to the next useful action.

## Colors

The customer portal pairs one clear blue action color with cool, low-contrast neutrals; the darker palette is the source-defined dark theme.

### Primary
- **Action Blue**: The customer portal’s primary action, active navigation, and important links.

### Neutral
- **Pale Blue Canvas**: The light page background surrounding the work surfaces.
- **White Surface**: Cards, sidebar, and other content surfaces.
- **Quiet Surface**: Table headings, search fields, and secondary navigation fills.
- **Cool Border**: Card edges, dividers, and table separators.
- **Navy Ink**: Main headings, body text, and customer record values.
- **Muted Slate**: Supporting copy, timestamps, and secondary labels.
- **Dark Canvas / Surface / Border / Ink**: The dark theme colors used by the customer shell.

**The Action Blue Rule.** Keep the primary blue for actions, links, and selection; use semantic color only to clarify status.

### Semantic status colors
- Success, warning, and danger tones come from the shared UI palette; the Ant Design theme also supplies semantic status tones. The source keeps warning at two related values: the portal theme uses `#F59E0B`, while shared text treatments use `#D97706` with a pale amber background and dark amber text. Preserve that distinction when working with those respective components.

## Typography

**Display Font:** Be Vietnam Pro (with Inter and system sans-serif fallbacks)
**Body Font:** Be Vietnam Pro (with Inter and system sans-serif fallbacks)

**Character:** Calm and direct, with open letterforms that keep Vietnamese and English interface text legible at compact sizes. Use weight and spacing to establish hierarchy instead of decorative type treatments.

### Hierarchy
- **Headline** (800, 24px, 1.25): Page titles in the customer shell.
- **Title** (700, 16px): Card headings and section titles.
- **Body** (400, 14px, 1.5): Explanations, navigation, and standard interface copy.
- **Label** (600, 12.5px, 1.4): Supporting labels and compact data headings.
- **Data** (700–800, 25–32px, 1.1): Counts and key figures; use tabular numerals where values are compared.

**The Wrap-Safe Rule.** Use weight and spacing for hierarchy, and let longer Vietnamese or English text wrap without clipping.

## Layout

The customer shell pairs a persistent sidebar with a scrollable content area. Shared views are centered up to 1600px wide; the content area uses 24px top, 28px horizontal, and 36px bottom padding on desktop. A 16px base view gap and the shared 4px spacing scale keep sections regular without making the pages feel loose.

At 1100px and below, customer content columns collapse to one column. At 767px, secondary table fields can drop away; at 640px, controls can become full width and four-part summaries move to two columns. At 360px, those summaries can become a single column. Keep long bilingual labels wrap-safe.

**The Narrow-to-Wide Rule.** Preserve the reading order as columns collapse, and move essential dates into the order details when the table date column disappears.

## Elevation & Depth

Depth is restrained. Shared portal cards use a low ambient shadow, while the customer overview removes card shadows and relies on the border and spacing for separation. More visible shadows belong to temporary overlays such as an open mobile sidebar or dialog.

### Shadow Vocabulary
- **Panel Resting Shadow** (`0 1px 2px rgb(15 27 61 / 4%), 0 8px 24px -8px rgb(15 27 61 / 10%)`): Low separation on shared cards outside the flat overview variant.
- **Panel Hover Shadow** (`0 2px 4px rgb(15 27 61 / 6%), 0 18px 36px -12px rgb(21 101 232 / 28%)`): Interactive lift for components that opt into hover elevation.
- **Mobile Sidebar Shadow** (`0 0 40px rgb(15 23 42 / 25%)`): Separates the temporary overlay sidebar from the page.

**The Quiet Boundary Rule.** Let the overview use spacing and a fine border to separate panels; reserve stronger shadows for overlays.

## Shapes

The portal uses gently rounded controls and cards: 8px for compact legacy controls, 10px for standard Ant Design controls and navigation items, 12px for search and icon controls, and 16px for shared cards. The customer overview uses a local 14px card radius. Status labels are pill-shaped. Fine borders define the edges; avoid adding ornamental outlines or nested containers without a content reason.

**The Border-First Rule.** Use soft corners and a light border to define a surface; add another container only when it clarifies a distinct content group.

## Components

### Buttons
- **Character:** Compact, familiar, and action-led.
- **Primary:** Blue fill with white text; Ant Design uses a 38px control height and semibold weight.
- **Default:** White surface with dark text and a light border; use it for secondary actions.
- **Hover / Focus:** Keep state changes small and preserve the theme’s visible focus treatment. Legacy customer buttons move to a blue border/text on hover.
- **Sizing:** Small controls use the theme’s 30px height; the standard control is 38px.

### Chips
- **Style:** Status tags are rounded pills with a small leading dot, semibold text, and no visible outline.
- **State:** Use the source-defined success, warning, danger, processing-blue, and neutral tones. Keep their background and text treatments subdued; retain the readable status label so color is never the only cue.

### Cards / Containers
- **Corner Style:** Shared cards use 16px corners; the customer overview variant uses 14px.
- **Background:** White in light mode and the source-defined dark surface in dark mode.
- **Shadow Strategy:** Shared cards use low ambient depth. The overview panels are flat with no shadow.
- **Border:** Use the cool portal border at rest; table rows use the same quiet divider.
- **Internal Padding:** Shared card body is 16px 20px. The overview uses 12px 18px body padding and a compact 54px heading row.

### Inputs / Fields
- **Style:** The customer shell search field uses a pale secondary surface, a thin portal border, and a 12px radius.
- **Focus:** Preserve Ant Design’s visible primary-color focus treatment.
- **Placeholder:** Supporting slate; keep the accessible name available when placeholder text disappears.

### Navigation
- **Style:** White sidebar with a fine dividing border and compact 42px menu items.
- **Default / Hover:** Dark ink at rest; a quiet surface tint on hover.
- **Active:** Blue text, a pale blue fill, and a narrow blue edge marker.
- **Mobile:** The sidebar can become a temporary overlay and receives the shell’s stronger shadow.

**The Labeled State Rule.** Keep status text visible beside its color, and keep actions recognizable through concise labels and familiar button shapes.

## Do's and Don'ts

### Do:
- **Do** use the existing blue primary and pale blue-gray portal neutrals.
- **Do** keep order counts, status labels, and action controls compact and easy to scan.
- **Do** use semantic colors with a visible text label and preserve the source-defined light and dark theme values.
- **Do** allow English and Vietnamese interface copy to wrap without clipping.
- **Do** retain thin borders as the main separator on the customer overview.

### Don't:
- **Don't** add a new accent palette or decorative gradients to ordinary customer work surfaces.
- **Don't** rely on color alone to explain an order or mission status.
- **Don't** add strong stacked shadows to the customer overview cards.
- **Don't** use tight fixed-width labels that clip Vietnamese diacritics or longer English copy.

**The Content Before Chrome Rule.** A count, status, or next step should remain easier to scan than the visual treatment around it.
