# Tailwind Style Reference Document

## Overview

This document contains extracted Tailwind CSS classes from UI components for consistent reference by agents.

## Layout & Container Classes

### Main Container Patterns

| Pattern                          | Classes                                       |
| -------------------------------- | --------------------------------------------- |
| Page wrapper (white bg)          | `bg-white py-24 sm:py-32`                     |
| Centered container (large)       | `mx-auto max-w-7xl px-6 lg:px-8`              |
| Centered container (medium)      | `mx-auto max-w-4xl px-6 lg:max-w-7xl lg:px-8` |
| Centered container (small)       | `mx-auto max-w-2xl px-6 lg:max-w-7xl lg:px-8` |
| Centered container (extra small) | `mx-auto max-w-xl lg:max-w-4xl`               |

### Grid Layouts

| Pattern                       | Classes                                                                                                            |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| 2-column responsive grid      | `grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2`                                                                  |
| 2-column layout (items start) | `mx-auto grid max-w-2xl grid-cols-1 items-start gap-x-8 gap-y-16 sm:gap-y-24 lg:mx-0 lg:max-w-none lg:grid-cols-2` |
| 3-column pricing grid         | `grid grid-cols-1 gap-10 lg:grid-cols-3`                                                                           |
| 4-column stats grid           | `grid grid-cols-2 gap-8 sm:grid-cols-4`                                                                            |
| 2-column stats comparison     | `grid grid-cols-2 border-b border-gray-100 py-4 last:border-none`                                                  |

### Flexbox Layouts

| Pattern                 | Classes                                                                                                                                   |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Vertical flex container | `flex flex-col gap-16 sm:gap-y-20 lg:flex-row`                                                                                            |
| Flex row with gap       | `flex gap-x-6`                                                                                                                            |
| Right-aligned flex      | `mt-10 flex`                                                                                                                              |
| Logo row                | `flex justify-between py-16 max-sm:mx-auto max-sm:max-w-md max-sm:flex-wrap max-sm:justify-evenly max-sm:gap-x-4 max-sm:gap-y-4 sm:py-24` |
| Flex tabs               | `flex`                                                                                                                                    |

---

## Typography Classes

### Headings

| Element             | Classes                                                                                       |
| ------------------- | --------------------------------------------------------------------------------------------- |
| Main heading (hero) | `text-4xl font-semibold tracking-tight text-pretty text-gray-900 sm:text-5xl`                 |
| Main heading (xl)   | `text-5xl font-semibold tracking-tight text-balance text-gray-950 sm:text-6xl lg:text-pretty` |
| Section heading     | `mt-2 text-4xl font-semibold tracking-tight text-pretty text-gray-900 sm:text-5xl`            |
| Accent label        | `text-base/7 font-semibold text-indigo-600` or `text-sm/6 font-semibold text-indigo-600`      |

### Body Text

| Element        | Classes                                                                                    |
| -------------- | ------------------------------------------------------------------------------------------ |
| Lead paragraph | `mt-2 text-lg/8 text-gray-600`                                                             |
| Paragraph      | `mt-6 max-w-2xl text-lg font-medium text-pretty text-gray-600 max-lg:mx-auto sm:text-xl/8` |
| Body text      | `text-base/7 text-gray-700 lg:max-w-lg`                                                    |
| Small text     | `text-sm/6 text-gray-600`                                                                  |
| Fine print     | `mt-4 text-sm/6 text-gray-500`                                                             |
| Bold body      | `text-lg/8 font-semibold text-gray-900`                                                    |

### Stats & Data

| Element    | Classes                                                   |
| ---------- | --------------------------------------------------------- |
| Stat value | `mt-2 text-3xl/10 font-bold tracking-tight text-gray-900` |
| Stat label | `text-sm/6 font-semibold text-gray-600`                   |

---

## Form Components

### Input Fields

| Element        | Classes                                                                                                                                                                                                                         |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Standard input | `block w-full rounded-md bg-white px-3.5 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 backdrop-blur-sm placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600` |

### Labels

| Element    | Classes                                       |
| ---------- | --------------------------------------------- |
| Form label | `block text-sm/6 font-semibold text-gray-900` |

### Buttons

| Element                 | Classes                                                                                                                                                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Primary button (large)  | `block w-full rounded-md bg-indigo-600 px-3.5 py-2.5 text-center text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600` |
| Primary button (medium) | `inline-block rounded-md bg-indigo-600 px-3.5 py-2 text-center text-sm/6 font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600` |
| Secondary button        | `inline-block rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-xs inset-ring-1 inset-ring-gray-300 hover:bg-gray-50`                                                                         |
| Mobile secondary button | `mt-8 block rounded-md bg-white px-3.5 py-2.5 text-center text-sm font-semibold text-gray-900 shadow-xs inset-ring ring-gray-300 hover:bg-gray-50`                                                                       |

---

## Card Components

### Glassmorphism Cards (Pricing)

| Element            | Classes                                                                                                                                                |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Card outer wrapper | `-m-2 grid grid-cols-1 rounded-4xl bg-white/2.5 shadow-[inset_0_0_2px_1px_#ffffff4d] ring-1 ring-black/5 max-lg:mx-auto max-lg:w-full max-lg:max-w-md` |
| Card inner wrapper | `grid grid-cols-1 rounded-4xl p-2 shadow-md shadow-black/5`                                                                                            |
| Card content       | `rounded-3xl bg-white p-10 pb-9 shadow-2xl ring-1 ring-black/5`                                                                                        |

### Featured Card with Background Image

| Element              | Classes                                                                                                                              |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Card container       | `relative overflow-hidden rounded-3xl bg-gray-900 px-6 pt-64 pb-9 shadow-2xl sm:px-12 lg:max-w-lg lg:px-8 lg:pb-8 xl:px-10 xl:pb-10` |
| Background image     | `absolute inset-0 size-full rounded-3xl object-cover brightness-125 saturate-0`                                                      |
| Overlay              | `absolute inset-0 bg-gray-900 mix-blend-multiply`                                                                                    |
| Gradient blur effect | `absolute top-1/2 left-1/2 -ml-16 -translate-x-1/2 -translate-y-1/2 transform-gpu blur-3xl`                                          |

---

## Decorative Elements

### Background Patterns

| Element                      | Classes                                                                                                                                                                                   |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SVG pattern background       | `absolute inset-0 -z-10 size-full mask-[radial-gradient(100%_100%_at_top_right,white,transparent)] stroke-gray-200`                                                                       |
| SVG sub-pattern              | `overflow-visible fill-gray-50`                                                                                                                                                           |
| Gradient background (radial) | `absolute inset-x-0 top-48 bottom-0 bg-[radial-gradient(circle_at_center_center,#7775D6,#592E71,#030712_70%)] lg:bg-[radial-gradient(circle_at_center_150%,#7775D6,#592E71,#030712_70%)]` |

### Quote Icon

| Element   | Classes                                              |
| --------- | ---------------------------------------------------- |
| Quote SVG | `absolute -top-4 -left-2 -z-10 h-32 stroke-white/20` |

### Divider/Border

| Element             | Classes                                                                         |
| ------------------- | ------------------------------------------------------------------------------- |
| Section divider     | `mt-10 grid grid-cols-2 gap-8 border-t border-gray-900/10 pt-10 sm:grid-cols-4` |
| Table row border    | `border-b border-gray-100 last:border-none`                                     |
| Tab border          | `border-b border-gray-100`                                                      |
| Selected tab border | `border-b border-gray-100 data-selected:border-indigo-600`                      |

---

## Table Components

### Pricing Table

| Element                | Classes                                                                       |
| ---------------------- | ----------------------------------------------------------------------------- |
| Table                  | `w-full text-left max-sm:hidden`                                              |
| Caption                | `sr-only`                                                                     |
| Column group 1         | `w-2/5`                                                                       |
| Column group 2-4       | `w-1/5`                                                                       |
| Table header cell      | `p-0`                                                                         |
| Table header row       | `text-sm font-semibold text-indigo-600`                                       |
| Table action cell      | `px-0 pt-3 pb-0`                                                              |
| Table section header   | `px-0 pt-10 pb-0 group-first-of-type:pt-5`                                    |
| Section header content | `-mx-4 rounded-lg bg-gray-50 px-4 py-3 text-sm/6 font-semibold text-gray-950` |
| Table row              | `border-b border-gray-100 last:border-none`                                   |
| Table feature name     | `px-0 py-4 text-sm/6 font-normal text-gray-600`                               |
| Table data cell        | `p-4 max-sm:text-center`                                                      |
| Included checkmark     | `inline-block size-4 fill-green-600`                                          |
| Excluded icon          | `inline-block size-4 fill-gray-400`                                           |

---

## Tab Components

### Tab Navigation

| Element   | Classes                                                                                                                                            |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tab list  | `flex`                                                                                                                                             |
| Tab item  | `w-1/3 border-b border-gray-100 py-4 text-base/8 font-medium text-indigo-600 not-focus-visible:focus:outline-none data-selected:border-indigo-600` |
| Tab panel | `focus:outline-none`                                                                                                                               |

---

## Lists

### Feature Lists

| Element           | Classes                                                                            |
| ----------------- | ---------------------------------------------------------------------------------- |
| List container    | `mt-3 space-y-3`                                                                   |
| List item         | `group flex items-start gap-4 text-sm/6 text-gray-600 data-disabled:text-gray-400` |
| List icon wrapper | `inline-flex h-6 items-center`                                                     |
| List icon         | `size-4 fill-gray-400 group-data-disabled:fill-gray-300`                           |

---

## Images & Avatars

### Logos

| Element            | Classes                             |
| ------------------ | ----------------------------------- |
| Logo (standard)    | `h-12 w-auto`                       |
| Logo (partner row) | `h-9 max-sm:mx-auto sm:h-8 lg:h-12` |
| Logo with opacity  | `opacity-60`                        |

### Avatars

| Element | Classes                                     |
| ------- | ------------------------------------------- |
| Avatar  | `size-12 flex-none rounded-full bg-gray-50` |

---

## Links

### Link Styles

| Element              | Classes                                                           |
| -------------------- | ----------------------------------------------------------------- |
| Text link (accent)   | `font-semibold whitespace-nowrap text-indigo-600`                 |
| Text link with arrow | `text-base/7 font-semibold text-indigo-600 hover:text-indigo-500` |

---

## Z-Index & Positioning

### Common Patterns

| Pattern                  | Classes                                                              |
| ------------------------ | -------------------------------------------------------------------- |
| Relative isolated        | `relative isolate`                                                   |
| Absolute background      | `absolute inset-0 -z-10`                                             |
| Absolute center          | `absolute top-1/2 left-1/2 -ml-16 -translate-x-1/2 -translate-y-1/2` |
| Sticky/Fixed positioning | Use appropriate `sticky` or `fixed` classes                          |

---

## Color Tokens Used

### Text Colors

- `text-gray-900` - Primary text
- `text-gray-950` - Darker primary text
- `text-gray-600` - Secondary/muted text
- `text-gray-500` - Tertiary/fine print text
- `text-gray-400` - Disabled/placeholder text
- `text-gray-300` - Very light text
- `text-indigo-600` - Accent/brand color
- `text-green-600` - Success/positive
- `text-white` - On dark backgrounds

### Background Colors

- `bg-white` - Default background
- `bg-gray-50` - Subtle background
- `bg-gray-900` - Dark backgrounds
- `bg-indigo-600` - Primary button/brand
- `bg-white/2.5` - Glassmorphism (2.5% opacity)
- `bg-[radial-gradient(...)]` - Gradient backgrounds

### Border/Outline Colors

- `border-gray-100` - Light borders
- `border-gray-900/10` - Subtle dark borders (10% opacity)
- `outline-gray-300` - Input outlines
- `outline-indigo-600` - Focus states
- `stroke-gray-200` - SVG strokes
- `stroke-white/20` - Subtle white strokes (20% opacity)
- `ring-black/5` - Ring effects (5% opacity)

---

## Spacing Reference

### Margin

| Size              | Value    | Common Uses                |
| ----------------- | -------- | -------------------------- |
| `mt-2`            | 0.5rem   | Tight spacing after labels |
| `mt-2.5`          | 0.625rem | Form field spacing         |
| `mt-4`            | 1rem     | Small content gaps         |
| `mt-6`            | 1.5rem   | Medium content gaps        |
| `mt-8`            | 2rem     | Section gaps               |
| `mt-10`           | 2.5rem   | Large section gaps         |
| `mt-16`           | 4rem     | Major section breaks       |
| `mt-24`           | 6rem     | Page-level spacing         |
| `pt-16` / `py-16` | 4rem     | Section padding            |
| `pt-24` / `py-24` | 6rem     | Section padding            |
| `pt-32` / `py-32` | 8rem     | Large section padding      |
| `pt-64`           | 16rem    | Hero/feature card padding  |

### Gap

| Size                   | Value         | Common Uses          |
| ---------------------- | ------------- | -------------------- |
| `gap-4`                | 1rem          | Small grid gaps      |
| `gap-8`                | 2rem          | Medium grid gaps     |
| `gap-10`               | 2.5rem        | Card grid gaps       |
| `gap-16`               | 4rem          | Large flex gaps      |
| `gap-x-6` / `gap-x-8`  | 1.5rem / 2rem | Horizontal grid gaps |
| `gap-y-6` / `gap-y-16` | 1.5rem / 4rem | Vertical grid gaps   |

---

## Border Radius Reference

| Class          | Value    | Common Uses             |
| -------------- | -------- | ----------------------- |
| `rounded-md`   | 0.375rem | Buttons, small inputs   |
| `rounded-lg`   | 0.5rem   | Section headers, badges |
| `rounded-3xl`  | 1.5rem   | Large cards             |
| `rounded-4xl`  | 2rem     | Pricing card containers |
| `rounded-full` | 9999px   | Avatars, pills          |

---

## Shadow Reference

| Class        | Value                               | Common Uses      |
| ------------ | ----------------------------------- | ---------------- |
| `shadow-xs`  | 0 1px 2px 0 rgb(0 0 0 / 0.05)       | Subtle elevation |
| `shadow-md`  | 0 4px 6px -1px rgb(0 0 0 / 0.1)     | Card depth       |
| `shadow-2xl` | 0 25px 50px -12px rgb(0 0 0 / 0.25) | Feature cards    |

---

## Utility Classes

### Sizing

| Class       | Value                     |
| ----------- | ------------------------- |
| `size-full` | width: 100%; height: 100% |
| `size-4`    | 1rem × 1rem               |
| `size-12`   | 3rem × 3rem               |
| `h-9`       | 2.25rem height            |
| `h-32`      | 8rem height               |
| `w-80`      | 20rem width               |
| `w-auto`    | auto width                |
| `w-1/3`     | 33.333% width             |
| `w-1/5`     | 20% width                 |
| `w-2/5`     | 40% width                 |
| `w-full`    | 100% width                |
| `w-274.25`  | 68.5625rem (custom)       |

### Aspect Ratio

| Class             | Value                  |
| ----------------- | ---------------------- |
| `aspect-1097/845` | aspect-ratio: 1097/845 |

### Transform & Effects

| Class                | Value                      |
| -------------------- | -------------------------- |
| `transform-gpu`      | GPU-accelerated transforms |
| `blur-3xl`           | blur(64px)                 |
| `backdrop-blur-sm`   | backdrop-filter: blur(4px) |
| `mix-blend-multiply` | mix-blend-mode: multiply   |
| `brightness-125`     | filter: brightness(1.25)   |
| `saturate-0`         | filter: saturate(0)        |

---

## Custom/Arbitrary Values

The code uses several arbitrary Tailwind values:

| Value                 | Usage                                        |
| --------------------- | -------------------------------------------- |
| `text-lg/8`           | Line height of 2rem (8/4)                    |
| `text-base/7`         | Line height of 1.75rem (7/4)                 |
| `text-sm/6`           | Line height of 1.5rem (6/4)                  |
| `text-xl/8`           | Line height of 2rem (8/4)                    |
| `text-3xl/10`         | Line height of 2.5rem (10/4)                 |
| `text-5xl/9`          | Line height of 2.25rem (9/4)                 |
| `text-6xl/11`         | Line height of 2.75rem (11/4)                |
| `mt-2.5`              | Margin top of 0.625rem                       |
| `p-2.5`               | Padding of 0.625rem                          |
| `px-2.5`              | Horizontal padding of 0.625rem               |
| `bg-white/2.5`        | Background opacity of 2.5%                   |
| `bg-gray-900/10`      | Border color with 10% opacity                |
| `stroke-white/20`     | Stroke color with 20% opacity                |
| `ring-black/5`        | Ring color with 5% opacity                   |
| `inset-ring-1`        | Inner ring width of 1px                      |
| `inset-ring-gray-300` | Inner ring color                             |
| `-outline-offset-1`   | Negative outline offset                      |
| `rounded-4xl`         | Border radius of 2rem (likely custom config) |
| `mask-[...]`          | CSS mask with arbitrary value                |
| `aspect-1097/845`     | Custom aspect ratio                          |
| `w-274.25`            | Custom width                                 |

---

## Special/Complex Patterns

### Glassmorphism Card

```
-m-2 grid grid-cols-1 rounded-4xl bg-white/2.5 shadow-[inset_0_0_2px_1px_#ffffff4d] ring-1 ring-black/5 max-lg:mx-auto max-lg:w-full max-lg:max-w-md
```

### Gradient Background

```
bg-[radial-gradient(circle_at_center_center,#7775D6,#592E71,#030712_70%)] lg:bg-[radial-gradient(circle_at_center_150%,#7775D6,#592E71,#030712_70%)]
```

### Form Input with Focus States

```
block w-full rounded-md bg-white px-3.5 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 backdrop-blur-sm placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600
```

### SVG Pattern Background

```
absolute inset-0 -z-10 size-full mask-[radial-gradient(100%_100%_at_top_right,white,transparent)] stroke-gray-200
```

---

## Responsive Breakpoints Used

| Breakpoint | Target  | Common Usage                         |
| ---------- | ------- | ------------------------------------ |
| `sm:`      | ≥640px  | Typography scaling, grid columns     |
| `lg:`      | ≥1024px | Layout shifts (flex-row), max-widths |
| `max-sm:`  | <640px  | Mobile-only styles, hiding tables    |
| `max-lg:`  | <1024px | Tablet/mobile styles, centering text |

---

## Component Assembly Examples

### Complete Form Field

```tsx
<div>
  <label
    htmlFor="field"
    className="block text-sm/6 font-semibold text-gray-900"
  >
    Label Text
  </label>
  <div className="mt-2.5">
    <input
      id="field"
      name="field"
      type="text"
      className="block w-full rounded-md bg-white px-3.5 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 backdrop-blur-sm placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
    />
  </div>
</div>
```

### Complete Card with Testimonial

```tsx
<figure className="relative isolate">
  <svg className="absolute -top-4 -left-2 -z-10 h-32 stroke-white/20">
    {/* Quote icon paths */}
  </svg>
  <blockquote className="mt-6 text-xl/8 font-semibold text-white">
    <p>"Quote text"</p>
  </blockquote>
  <figcaption className="mt-6 text-sm/6 text-gray-300">
    <strong className="font-semibold text-white">Name,</strong> Title
  </figcaption>
</figure>
```

### Pricing Tier Card

```tsx
<div className="-m-2 grid grid-cols-1 rounded-4xl bg-white/2.5 shadow-[inset_0_0_2px_1px_#ffffff4d] ring-1 ring-black/5 max-lg:mx-auto max-lg:w-full max-lg:max-w-md">
  <div className="grid grid-cols-1 rounded-4xl p-2 shadow-md shadow-black/5">
    <div className="rounded-3xl bg-white p-10 pb-9 shadow-2xl ring-1 ring-black/5">
      {/* Card content */}
    </div>
  </div>
</div>
```

---

## Notes for Agents

1. **Color System**: The components use a gray scale (50, 100, 200, 300, 400, 500, 600, 900, 950) with indigo as the primary accent color.

2. **Typography**: Heavily uses line-height modifiers (e.g., `text-sm/6`, `text-lg/8`) for consistent vertical rhythm.

3. **Spacing**: Consistent use of 8px-based spacing scale with arbitrary values like `mt-2.5` for fine-tuning.

4. **Effects**:
   - `backdrop-blur-sm` on inputs
   - `shadow-xs` on buttons
   - `shadow-2xl` on featured cards
   - `ring-1` + `ring-black/5` for subtle borders

5. **Responsive Strategy**:
   - Mobile-first approach
   - `max-lg:` for tablet/mobile overrides
   - Grid layouts switch at `sm:` and `lg:` breakpoints
   - Typography scales up at `sm:` breakpoints

6. **Accessibility**:
   - `sr-only` for screen reader only text
   - `aria-label` on action buttons
   - `focus-visible:` states on interactive elements
   - Proper heading hierarchy

7. **Custom Configurations**: Some classes like `rounded-4xl` and `aspect-1097/845` suggest custom Tailwind configuration may be present.
