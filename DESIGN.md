# DESIGN.md - ProfeMeet Design System

## Visual Language: Light Neumorphism
The application uses a "Soft UI" or Neumorphism aesthetic, characterized by elements that appear to be part of the background, extruded or inset from the surface.

## Core Tokens

### Colors
- **Background**: `#f0f2f5` (Soft Grayish White)
- **Primary Accent**: `#4a90e2` (Calm Azure) - Used for active toggles, critical status, and primary highlights.
- **Text Primary**: `#4a4a4a` (Slate Gray) - Optimized for readability against the soft background.
- **Success/Connected**: `#34d399` (Soft Emerald)
- **Warning/Sharing**: `#fbbf24` (Soft Amber)

### Shadows (The "Core" of Neumorphism)
- **Light Shadow**: `-8px -8px 16px #ffffff` (The highlight side)
- **Dark Shadow**: `8px 8px 16px #d1d9e6` (The shadow side)
- **Shadow Direction**: Top-Left (Light) to Bottom-Right (Dark).

### Typography
- **Primary Font**: `Lexend` or `Inter`
- **Scale**: Large, clear headings with generous letter spacing to maintain a clean look.

## Components

### Buttons & Containers
- **Border Radius**: `20px` to `30px` for a soft, friendly feel.
- **Default State (Extruded)**: Elements project from the background using double shadows.
- **Active/Pressed State (Inset)**: Elements appear "pushed in" by reversing the shadow logic (inset shadows).

### Cards
- Large containers should have subtle borders (`1px solid rgba(255,255,255,0.4)`) to define edges without losing the soft feel.

---
*Created by Antigravity for ProfeMeet.*
