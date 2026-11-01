# Device-Adaptive Responsive Game Screen Sizing

This plan outlines the architecture and styling updates to make the game viewport adapt dynamically to whatever device the player is using—including smartphones in both portrait and landscape orientations, tablets, and desktop displays.

## User Review & Critical Decisions

> [!IMPORTANT]
> The plan incorporates your confirmed preference to automatically adapt layout between portrait and landscape orientations, with edge-to-edge full mobile screen scaling.

- **Mobile Phones (Portrait)**: The game cabinet expands edge-to-edge (`w-full h-full`, borderless, no outer margin or letterbox gap), utilizing 100% of the mobile screen height (`h-[100dvh]`) to prevent accidental browser scrolling during rapid tapping/flapping.
- **Mobile Phones (Landscape)**: When rotated sideways, the canvas dynamically switches to a wide landscape format, header and footer scale down to compact heights, and pipe generation scales horizontally so the bird has full forward flight vision rather than being squeezed into a narrow vertical pillar.
- **Tablets & Desktop Displays**: Expands into an arcade cabinet that automatically scales to fill the available browser window dimensions (`sm:max-w-xl md:max-w-5xl lg:max-w-6xl xl:max-w-7xl sm:rounded-2xl sm:border-4`), maintaining crisp pixel rendering without clipping or page scrollbars.

---

## 1. Overview & Core Concept

- **What It Does**: Replaces fixed aspect ratio constraints (`aspect-[9/16]` and rigid desktop pixel heights) with a fully responsive dynamic layout system driven by container queries, `100dvh` viewport constraints, and dynamic WebGL/Canvas aspect ratio scaling.
- **Target Audience / Persona**: Mobile touch players on iPhones/Android phones (holding vertically or horizontally) and desktop players on laptops, monitors, or ultrawide screens.
- **Key Value**: Guarantees optimal playable screen area on every device format without awkward black bars, squished graphics, or unwanted page bounce.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Smartphone Portrait**: Opening the game on a phone immediately presents an edge-to-edge vertical flapper view. Header and footer telemetry remain compact and accessible, while the canvas occupies the maximum possible vertical touch area.
  2. **Smartphone Landscape Rotation**: Rotating the phone automatically re-computes the canvas aspect ratio via `ResizeObserver` and `orientationchange` listeners. The view expands horizontally, spacing obstacles smoothly ahead of the bird.
  3. **Desktop Window Resizing**: Resizing the desktop browser window smoothly resizes the cabinet canvas without restarting the run or causing visual stutter.
- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Retro arcade cabinet enclosure on larger screens; seamless borderless arcade glass on mobile.
  - *Color Palette*: Deep obsidian (`#121212`), high-contrast arcade white border on desktop (`sm:border-4 border-white`), and rich chiptune gold/cyan telemetry.
  - *Touch Optimization*: `touch-none` and `overscroll-none` applied to the primary viewport to disable pull-to-refresh and elastic bounce during intense flapping.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Dynamic Aspect Ratio vs Fixed 9:16 Letterboxing**
  - *Chosen Approach*: Allow the canvas aspect ratio to dynamically span from portrait `0.45` (tall mobile screens) up to landscape `3.5` (ultrawide monitors), keeping a fixed internal height of `640` units while scaling horizontal pixel resolution.
  - *Why*: Eliminates black side bars on tall phones and prevents landscape mobile from becoming an unplayable narrow strip.
  - *Alternatives Considered*: Enforcing a rigid 9:16 box on all screens, which was rejected because it wastes over 65% of screen area on landscape and desktop devices.
- **Decision 2: Adaptive Header & Footer Scaling**
  - *Chosen Approach*: On mobile and landscape screens, reduce header and footer height (`h-11` to `h-13`) and show compact button variants, reserving >80% of vertical screen height for the actual game canvas.

---

## 4. Technical Architecture & Component Structure

```
┌────────────────────────────────────────────────────────────────────────┐
│                   #arcade-main-viewport (h-[100dvh])                  │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ #arcade-marquee-header (Responsive: h-11 mobile / h-16 desktop)   │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ #arcade-stage-container (flex-1 min-h-0 w-full overflow-hidden)   │  │
│  │                                                                  │  │
│  │   ┌──────────────────────────────────────────────────────────┐   │  │
│  │   │ #game-viewport-cabinet                                   │   │  │
│  │   │  • Mobile: w-full h-full rounded-none border-0           │   │  │
│  │   │  • Desktop/Tablet: responsive max-w container, border-4  │   │  │
│  │   │                                                          │   │  │
│  │   │   <canvas id="flappy-main-canvas" />                     │   │  │
│  │   │   <CRTOverlay />                                         │   │  │
│  │   │   <ArcadeHUD />                                          │   │  │
│  │   └──────────────────────────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ #arcade-control-deck (Responsive footer: h-12 mobile / h-20 desk) │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

- **Canvas & Engine Synchronization**:
  - `ResizeObserver` on `#game-viewport-cabinet` measures live client pixel dimensions.
  - Calls `engine.resizeCanvas(width, height)`, which computes the exact device aspect ratio (`cssW / cssH`).
  - Automatically recalculates `this.birdX` so the bird is always positioned fairly (18% to 22% from the left edge) across both tall portrait and wide landscape displays.
  - Re-checks obstacle spacing loop so new pipes continuously spawn across the active canvas width.
