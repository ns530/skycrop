
# UI/UX DESIGN GUIDE

## SkyCrop: Satellite-Based Paddy Field Monitoring System

---

## DOCUMENT CONTROL

| **Item** | **Details** |
|----------|-------------|
| **Document Title** | UI/UX Design Guide |
| **Project Name** | SkyCrop - Intelligent Paddy Field Monitoring System |
| **Document Code** | SKYCROP-UXD-2025-001 |
| **Version** | 1.0 |
| **Date** | October 29, 2025 |
| **Prepared By** | UX Expert, UI Designer |
| **Reviewed By** | Product Manager, Frontend Developer |
| **Approved By** | Project Sponsor |
| **Status** | Approved |
| **Confidentiality** | Internal - For Development Team |

---

## EXECUTIVE SUMMARY

### Purpose

This UI/UX Design Guide provides comprehensive design specifications, wireframes, and interaction flows for the SkyCrop satellite-based paddy field monitoring system. It ensures consistent, user-friendly interfaces across web and mobile platforms.

### Design Philosophy

**"Simplicity Empowers Farmers"**

SkyCrop's design prioritizes:
1. **Visual Communication:** Icons, colors, and maps over text
2. **Mobile-First:** Optimized for smartphones (70% of users)
3. **Progressive Disclosure:** Show essentials first, hide complexity
4. **Accessibility:** Works on low-end devices, slow networks
5. **Cultural Sensitivity:** Designed for Sri Lankan farmers

### Key Design Principles

1. **Simplicity First:** ≤3 taps to key insights
2. **Visual Clarity:** Color-coded health maps (green/yellow/red)
3. **Immediate Feedback:** Loading states, progress indicators
4. **Error Prevention:** Validation, confirmations for destructive actions
5. **Consistency:** Unified design language across platforms

---

## TABLE OF CONTENTS

1. [Design System](#1-design-system)
2. [User Interface Specifications](#2-user-interface-specifications)
3. [Wireframes - Mobile App](#3-wireframes---mobile-app)
4. [Wireframes - Web Application](#4-wireframes---web-application)
5. [Wireframes - Admin Dashboard](#5-wireframes---admin-dashboard)
6. [Interaction Flows](#6-interaction-flows)
7. [Component Library](#7-component-library)
8. [Responsive Design](#8-responsive-design)
9. [Accessibility Guidelines](#9-accessibility-guidelines)
10. [Usability Testing Plan](#10-usability-testing-plan)
11. [Appendices](#11-appendices)

---

## 1. DESIGN SYSTEM

### 1.1 Color Palette

**Primary Colors:**

```
Health Status Colors:
┌─────────────────────────────────────────────────────────┐
│ Excellent (NDVI 0.8-1.0)                                │
│ ████████████ Dark Green #059669                         │
│                                                          │
│ Good (NDVI 0.7-0.8)                                     │
│ ████████████ Green #10B981                              │
│                                                          │
│ Fair (NDVI 0.5-0.7)                                     │
│ ████████████ Yellow #F59E0B                             │
│                                                          │
│ Poor (NDVI <0.5)                                        │
│ ████████████ Red #EF4444                                │
└─────────────────────────────────────────────────────────┘

Brand Colors:
┌─────────────────────────────────────────────────────────┐
│ Primary (Brand)                                          │
│ ████████████ Blue #3B82F6                               │
│                                                          │
│ Secondary (Accent)                                       │
│ ████████████ Teal #14B8A6                               │
└─────────────────────────────────────────────────────────┘

Neutral Colors:
┌─────────────────────────────────────────────────────────┐
│ Dark Gray (Headers, Primary Text)                       │
│ ████████████ #1F2937                                    │
│                                                          │
│ Gray (Secondary Text, Borders)                          │
│ ████████████ #6B7280                                    │
│                                                          │
│ Light Gray (Backgrounds, Disabled)                      │
│ ████████████ #F3F4F6                                    │
│                                                          │
│ White (Cards, Backgrounds)                              │
│ ████████████ #FFFFFF                                    │
└─────────────────────────────────────────────────────────┘

Semantic Colors:
┌─────────────────────────────────────────────────────────┐
│ Success                                                  │
│ ████████████ Green #10B981                              │
│                                                          │
│ Warning                                                  │
│ ████████████ Yellow #F59E0B                             │
│                                                          │
│ Error/Danger                                             │
│ ████████████ Red #EF4444                                │
│                                                          │
│ Info                                                     │
│ ████████████ Blue #3B82F6                               │
└─────────────────────────────────────────────────────────┘
```

**Color Usage Guidelines:**

| **Color** | **Use For** | **Don't Use For** |
|-----------|-------------|-------------------|
| **Green (#10B981)** | Healthy crops, success messages, primary buttons | Errors, warnings |
| **Yellow (#F59E0B)** | Moderate stress, warnings, caution | Success, errors |
| **Red (#EF4444)** | Severe stress, errors, critical alerts | Success, normal states |
| **Blue (#3B82F6)** | Water-related, information, links | Health status |
| **Gray (#6B7280)** | Text, borders, inactive elements | Primary actions |

### 1.2 Typography

**Font Family:**
- **Primary:** Inter (sans-serif, modern, highly readable)
- **Fallback:** -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif

**Font Scale:**

```
┌─────────────────────────────────────────────────────────┐
│ Heading 1 (Page Titles)                                 │
│ 24px / 1.5rem - Bold (700)                              │
│ Example: "Dashboard" "Field Details"                    │
│                                                          │
│ Heading 2 (Section Titles)                              │
│ 20px / 1.25rem - Semibold (600)                         │
│ Example: "Health Status" "Recommendations"              │
│                                                          │
│ Heading 3 (Card Titles)                                 │
│ 18px / 1.125rem - Semibold (600)                        │
│ Example: "Main Field" "Water Recommendation"            │
│                                                          │
│ Body Text (Main Content)                                │
│ 16px / 1rem - Regular (400)                             │
│ Example: Descriptions, recommendations, content         │
│                                                          │
│ Small Text (Labels, Captions)                           │
│ 14px / 0.875rem - Regular (400)                         │
│ Example: "Last updated: 2 days ago"                     │
│                                                          │
│ Tiny Text (Footnotes, Timestamps)                       │
│ 12px / 0.75rem - Regular (400)                          │
│ Example: "© 2025 SkyCrop"                               │
└─────────────────────────────────────────────────────────┘
```

**Line Height:**
- Headings: 1.2 (tight)
- Body text: 1.5 (comfortable reading)
- Small text: 1.4

**Letter Spacing:**
- Headings: -0.02em (slightly tighter)
- Body text: 0 (normal)
- All caps: 0.05em (slightly wider)

### 1.3 Spacing System

**8-Point Grid System:**

```
Base Unit: 8px

Spacing Scale:
┌─────────────────────────────────────────────────────────┐
│ 0   = 0px    (No space)                                 │
│ 1   = 4px    (Tiny gap)                                 │
│ 2   = 8px    (Small gap)                                │
│ 3   = 12px   (Medium gap)                               │
│ 4   = 16px   (Default gap)                              │
│ 5   = 20px   (Large gap)                                │
│ 6   = 24px   (Extra large gap)                          │
│ 8   = 32px   (Section spacing)                          │
│ 10  = 40px   (Major section spacing)                    │
│ 12  = 48px   (Page spacing)                             │
│ 16  = 64px   (Hero spacing)                             │
└─────────────────────────────────────────────────────────┘

Usage:
• Padding inside cards: 16px (4 units)
• Margin between cards: 16px (4 units)
• Section spacing: 32px (8 units)
• Page margins: 16-24px (4-6 units)
```

### 1.4 Iconography

**Icon Library:** Heroicons (MIT license, designed for Tailwind CSS)

**Icon Sizes:**
- Small: 16×16px (inline with text)
- Medium: 24×24px (buttons, cards)
- Large: 32×32px (feature icons)
- Extra Large: 48×48px (empty states, illustrations)

**Key Icons:**

| **Feature** | **Icon** | **Usage** |
|-------------|----------|-----------|
| **Home** | 🏠 Home | Bottom navigation, dashboard |
| **Field** | 🗺️ Map | Field selection, boundaries |
| **Health** | 💚 Heart | Health status, monitoring |
| **Water** | 💧 Droplet | Water recommendations, irrigation |
| **Fertilizer** | 🌱 Seedling | Fertilizer recommendations |
| **Weather** | ☀️ Sun/Cloud/Rain | Weather forecast, alerts |
| **Yield** | 🌾 Grain | Yield prediction, harvest |
| **Alert** | ⚠️ Warning | Critical alerts, notifications |
| **News** | 📰 Newspaper | News articles, knowledge hub |
| **Profile** | 👤 User | User profile, settings |
| **Add** | ➕ Plus | Add new field, create |
| **Edit** | ✏️ Pencil | Edit field, modify |
| **Delete** | 🗑️ Trash | Delete field, remove |
| **Settings** | ⚙️ Gear | Settings, preferences |
| **Help** | ❓ Question | Help, tutorials |

### 1.5 Component Styling

**Buttons:**

```
┌─────────────────────────────────────────────────────────┐
│ Primary Button (Green)                                  │
│ ┌─────────────────────────────────────────────────┐   │
│ │  [Sign Up]  [Add Field]  [Confirm]              │   │
│ └─────────────────────────────────────────────────┘   │
│ • Background: #10B981 (Green)                           │
│ • Text: #FFFFFF (White)                                 │
│ • Padding: 12px 24px                                    │
│ • Border Radius: 8px                                    │
│ • Font: 16px Semibold                                   │
│ • Hover: #059669 (Darker green)                         │
│ • Active: #047857 (Even darker)                         │
│ • Disabled: #D1D5DB (Gray), opacity 50%                 │
│                                                          │
│ Secondary Button (Gray)                                 │
│ ┌─────────────────────────────────────────────────┐   │
│ │  [Cancel]  [Skip]  [Back]                       │   │
│ └─────────────────────────────────────────────────┘   │
│ • Background: #F3F4F6 (Light Gray)                      │
│ • Text: #1F2937 (Dark Gray)                             │
│ • Padding: 12px 24px                                    │
│ • Border Radius: 8px                                    │
│ • Hover: #E5E7EB (Slightly darker)                      │
│                                                          │
│ Danger Button (Red)                                     │
│ ┌─────────────────────────────────────────────────┐   │
│ │  [Delete Field]  [Remove]                       │   │
│ └─────────────────────────────────────────────────┘   │
│ • Background: #EF4444 (Red)                             │
│ • Text: #FFFFFF (White)                                 │
│ • Padding: 12px 24px                                    │
│ • Border Radius: 8px                                    │
│ • Hover: #DC2626 (Darker red)                           │
│                                                          │
│ Text Button (Link Style)                                │
│ ┌─────────────────────────────────────────────────┐   │
│ │  Log In  |  Forgot Password?  |  Learn More     │   │
│ └─────────────────────────────────────────────────┘   │
│ • Background: Transparent                               │
│ • Text: #3B82F6 (Blue)                                  │
│ • Padding: 8px 16px                                     │
│ • Hover: Underline                                      │
└─────────────────────────────────────────────────────────┘
```

**Cards:**

```
┌─────────────────────────────────────────────────────────┐
│ Standard Card                                            
│ ┌─────────────────────────────────────────────────────┐ │
│ │  Title (18px/600)                                   │ │
│ │  Supporting text (16px/400). Keep to 2-3 lines.     │ │
│ │                                                     │ │
│ │  [Primary Action]    [Secondary]                    │ │
│ └─────────────────────────────────────────────────────┘ │
│ • Background: #FFFFFF                                     │
│ • Border: 1px solid #E5E7EB                               │
│ • Radius: 12px                                            │
│ • Shadow: subtle (0 1px 2px rgb(0 0 0 / 0.05))            │
│ • Padding: 16px-24px                                      │
│ • Spacing: Title→Body 8px; Body→Actions 16px              │
│                                                           │
│ Metric Card (Health)                                      │
│ ┌─────────────────────────────────────────────────────┐ │
│ │  NDVI                                               │ │
│ │  0.78  ● Good                                       │ │
│ │  Inline sparkline trend                             │ │
│ └─────────────────────────────────────────────────────┘ │
│ • Color stripe on left: status color (Green/Yellow/Red)   │
│ • Use monospaced numeric tabular figures                  │
└─────────────────────────────────────────────────────────┘
```

**Inputs & Forms:**

```
┌─────────────────────────────────────────────────────────┐
│ Text Field                                              │
│ [ Label ]  [ placeholder ]                              │
│ • Height: 40px; Radius: 8px                             │
│ • Border: 1px #E5E7EB; Focus: 2px #3B82F6 ring          │
│ • Helper text (12px/#6B7280); Error text (#EF4444)      │
│                                                         │
│ Select / Dropdown                                       │
│ [ Label ]  [ Value  ▼ ]                                 │
│ • Menu max-height: 320px; item height: 40px             │
│                                                         │
│ Checkbox / Radio                                        │
│ • 16px; label left aligned; group gap 12px              │
│ • Hit target ≥ 44×44px                                  │
│                                                         │
│ Date Range Picker                                        │
│ • Presets: 7d, 14d, 30d, Season                         │
└─────────────────────────────────────────────────────────┘
```

**Tables:**

```
┌─────────────────────────────────────────────────────────┐
│ Data Table                                              │
│ • Row height: 48px; Zebra stripes (#FAFAFA)             │
│ • Header: 12px/600; uppercase; sticky on scroll         │
│ • Sorting icons right-aligned                            │
│ • Empty state with icon + guidance                      │
└─────────────────────────────────────────────────────────┘
```

**Toasts & Notifications:**

```
Success  (Green #10B981) – auto-dismiss 4s
Warning  (Yellow #F59E0B) – requires action
Error    (Red #EF4444) – stays until dismissed
Info     (Blue #3B82F6) – contextual tips
Placement: top-right on web, top center on mobile
```

---

## 2. USER INTERFACE SPECIFICATIONS

### 2.1 Navigation
- Primary nav: bottom tab bar (Mobile) with Home, Fields, Health, Weather, Profile.
- Web desktop: left sidebar with same sections; collapse at ≤1024px.
- Breadcrumbs on detail pages: Home / Fields / {Field Name}.

### 2.2 Layout
- Mobile: single column; safe-area insets respected.
- Tablet/Desktop: max content width 1200px; 12-column grid; gutters 24px.
- Map-first pages reserve 60% height for map on mobile, 70% width on desktop.

### 2.3 Map Standards
- Base: satellite tiles; overlay: NDVI choropleth with 4 buckets.
- Field boundary stroke: 2px #3B82F6, fill #3B82F6 at 12%.
- Legend: docked bottom; tappable to highlight bucket.
- Tap behavior: select polygon → show bottom sheet with metrics.

### 2.4 Data Presentation
- NDVI: 2 decimal places; thresholds fixed as defined in palette.
- Trends: mini sparkline; tooltip with exact value and date.
- Units: SI where applicable; rainfall (mm), temperature (°C).

### 2.5 Loading/Empty/Error States
- Loading: shimmer cards for lists, skeleton for map legend.
- Empty: friendly icon + 1-line guidance + primary action.
- Error: clear cause + retry; destructive actions confirm.

---

## 3. WIREFRAMES - MOBILE APP

### 3.1 Dashboard (Home)
- Hero map with current field; health summary chips; alerts carousel.

### 3.2 Field List
- Search + “Add Field” CTA; each item shows name, size, last update, status color.

### 3.3 Field Details
- Map, NDVI card, Water/Fertilizer recs, Weather, Insights timeline.

### 3.4 Alerts
- List grouped by severity; filter tabs: All, Critical, Warning.

---

## 4. WIREFRAMES - WEB APPLICATION

### 4.1 Overview
- Left nav; main content with map + side panel; responsive down to 1024px.

### 4.2 Field Management
- Table with bulk actions; import KML/GeoJSON; pagination at 25 rows.

### 4.3 Insights
- Historical trends; compare fields; export CSV/PDF.

---

## 5. WIREFRAMES - ADMIN DASHBOARD
- User management, roles, audit logs, plan limits, system health.

---

## 6. INTERACTION FLOWS

### 6.1 Add New Field
- Goal: digitize/ import boundary and save.
- Steps: Fields → Add → Choose “Draw” or “Import” → Validate → Name → Save.
- Edge cases: invalid polygon; overlapping fields; missing name.

### 6.2 Review Health and Get Recommendations
- Goal: see NDVI and receive water/fertilizer guidance.
- Steps: Field → Health tab → select date range → review cards → Apply plan.
- Edge cases: missing satellite pass; cloud cover; stale data.

### 6.3 Acknowledge Alerts
- Goal: triage alerts and mark resolved.
- Steps: Alerts → open alert → read recommendation → mark as resolved.

---

## 7. COMPONENT LIBRARY

### 7.1 Core Components
- AppShell (nav, header, content)
- MapView (base, overlays, legend, controls)
- MetricCard (title, value, status, sparkline)
- RecommendationCard (actionable guidance)
- FieldListItem (name, size, status)
- DataTable (sorting, pagination)
- FormControls (TextField, Select, Checkbox, DateRange)
- Toast/Alert components

### 7.2 States
- Default, Hover, Focus, Disabled, Loading, Error, Success.

---

## 8. RESPONSIVE DESIGN

### 8.1 Breakpoints
- Mobile: 0–639px; Tablet: 640–1023px; Desktop: 1024–1439px; Wide: ≥1440px.

### 8.2 Adaptation Patterns
- Navigation: bottom tabs → sidebar; overflow → “More”.
- Layout: single column → two-pane; map expands on desktop.
- Tables: stack columns or horizontal scroll on mobile.

---

## 9. ACCESSIBILITY GUIDELINES
- Target WCAG 2.2 AA.
- Contrast: text/background ≥ 4.5:1; large text ≥ 3:1.
- Keyboard: all interactive elements tabbable in logical order.
- Focus: visible 2px focus ring (#3B82F6) contrasting background.
- Screen readers: landmarks, headings, alt text for maps (summary + data table fallback).
- Touch targets: ≥44×44px; spacing to prevent accidental taps.

---

## 10. USABILITY TESTING PLAN

### 10.1 Objectives
- Validate task success for core flows with farmers using low-end Android devices.

### 10.2 Participants
- 8–12 users: smallholder farmers, agronomists, cooperatives.

### 10.3 Scenarios
- Add a new field from a paper map photo (import boundary).
- Check crop health and interpret NDVI legend.
- Act on a critical irrigation alert.

### 10.4 Metrics
- Task success rate, time-on-task, error rate, SUS score, qualitative feedback.

### 10.5 Protocol
- Remote moderated tests; 30–40 minutes; screen recording; think-aloud.

---

## 11. APPENDICES

### A. Glossary
- NDVI: Normalized Difference Vegetation Index indicating vegetation health.
- Choropleth: Map where areas are colored based on data values.

### B. Color Tokens (Design/Code Mapping)
- --color-success: #10B981
- --color-warning: #F59E0B
- --color-error:   #EF4444
- --color-info:    #3B82F6
- --color-text:    #1F2937
- --color-muted:   #6B7280
- --color-border:  #E5E7EB
- --color-bg:      #FFFFFF

### C. Icon Inventory
- Source: Heroicons. See icon list in Section 1.4.

### D. References
- Project PRD, Architecture, Agronomy guidelines, WCAG 2.2.