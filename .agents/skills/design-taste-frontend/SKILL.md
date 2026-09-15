---
name: design-taste-frontend
description: Anti-slop frontend skill for landing pages, web apps, and redesigns. The agent reads the brief, infers the right design direction, and ships interfaces that do not look templated. Real design systems when applicable, audit-first on redesigns, strict pre-flight check.
---

# tasteskill: Anti-Slop Frontend Skill

> Every rule below is **contextual**. First read the brief, then pull only what fits.

## 0. BRIEF INFERENCE (Read the Room Before Anything Else)
Before touching code or tweaking dials, **infer what the user actually wants**.
- **Page kind**: Web application / Personal Finance & Credit Card Matcher PWA.
- **Vibe**: High-craft, sleek dark/light mode, crisp typography, tactile micro-interactions, responsive, 0ms lag.
- **Audience**: Everyday smart consumers & power cardholders seeking clarity, speed, and precision.

## 1. THE THREE DIALS
- `DESIGN_VARIANCE: 7` (Refined, balanced structure with organic focal points)
- `MOTION_INTENSITY: 5` (Snappy, purposeful, zero-lag micro-interactions)
- `VISUAL_DENSITY: 5` (Information-rich credit card cards and transactions without clutter)

## 2. DESIGN DIRECTIVES
1. **Typography**: High-legibility sans font (`Plus Jakarta Sans` / `Outfit` / `Geist` / `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto`), tight tracking on headlines (`letter-spacing: -0.02em`), comfortable body line-height.
2. **Color Palette**: Neutral dark slate (`#0B0F19`, `#111827`, `#1F2937`) with tailored high-contrast electric brand accents (`#3B82F6`, `#10B981`, `#F59E0B`), no generic AI-purple glow slop.
3. **Depth & Tactility**: 1px subtle glass borders (`rgba(255, 255, 255, 0.08)` in dark mode, `rgba(0, 0, 0, 0.06)` in light mode), refined box-shadows, smooth hover transforms.
4. **Instant Theme Switching**: Zero transition lag on root `[data-theme]` flips.
5. **Component Craftsmanship**:
   - Modals: Centered, clean backdrop, clear primary/secondary button hierarchy.
   - Quick Log Chips: Tactile pill buttons with real merchant emojis, clear amounts, and active feedback.
