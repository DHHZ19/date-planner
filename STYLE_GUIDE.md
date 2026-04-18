# Style Guide

This document describes the visual design system used across the Date Planner app. Reference it when building new components or modifying existing UI to keep the look consistent.

## Typography

- **Primary font:** `Manrope` (sans-serif), set via `--font-sans` in `src/styles.css`.
- **Display font:** `Fraunces` (serif), applied via the `.display-title` class.
- Headings use `font-semibold tracking-tight` with `text-[var(--ui-text)]`.
- Body/muted text uses `text-[var(--ui-text-muted)]`.
- Small labels: `text-sm/6 font-semibold text-[var(--ui-text)]` (see `fieldLabelClassName` in `src/components/questions/fields/field-classes.ts`).
- Helper/hint text: `text-xs/5 text-[var(--ui-text-muted)]`.

## Color tokens (CSS custom properties)

All tokens are defined in `:root` and overridden in `[data-theme='dark']` and `prefers-color-scheme: dark` in `src/styles.css`. The palette is warm and rose-toned throughout -- there are no green accent colors.

### Semantic UI tokens (preferred)

Use these in component code. They auto-adapt to light/dark mode.

| Token               | Light value | Purpose                    |
| ------------------- | ----------- | -------------------------- |
| `--ui-bg`           | `#fff7f5`   | Page background            |
| `--ui-surface`      | `#ffffff`   | Card / panel background    |
| `--ui-surface-soft` | `#fef2ef`   | Softer panel variant       |
| `--ui-border`       | `#d7beb8`   | Default border color       |
| `--ui-text`         | `#2e2226`   | Primary text               |
| `--ui-text-muted`   | `#7a6068`   | Secondary / helper text    |
| `--ui-focus`        | `#a33a4a`   | Focus ring / outline color |
| `--ui-danger`       | `#a33a4a`   | Error text                 |

### Brand palette (`--love-*`)

| Token        | Value     | Usage                                        |
| ------------ | --------- | -------------------------------------------- |
| `--love-900` | `#7e1f3d` | Deepest accent (selected state bg end)       |
| `--love-700` | `#a33a4a` | Primary accent (selected state bg start)     |
| `--love-600` | `#b24a3a` | Mid accent                                   |
| `--love-300` | `#c86a6a` | Lighter accent / focus rings / hover borders |
| `--love-050` | `#f6e3e1` | Faintest accent wash                         |

### Hard-coded equivalents

Some components use hex values directly instead of CSS vars because Tailwind arbitrary-value classes don't resolve CSS vars at build time inside certain expressions (gradients, shadows). Keep these in sync with the tokens above:

| Hex       | Equivalent token |
| --------- | ---------------- |
| `#7e1f3d` | `--love-900`     |
| `#a33a4a` | `--love-700`     |
| `#6c1834` | (darker love)    |

## Component patterns

### Cards / panels

Cards use a consistent frosted-glass look:

```
rounded-3xl
border border-[var(--ui-border)]
bg-gradient-to-br from-[var(--ui-surface)]/94 via-[var(--love-050)]/74 to-[var(--ui-surface-soft)]/92
p-6 sm:p-8
shadow-[0_24px_60px_-32px_rgba(126,31,61,0.22)]
backdrop-blur-sm
```

Cards often include pointer-events-none pseudo-layers for radial highlight effects (see `QuestionForm.tsx` and `index.tsx`).

### Selectable chip / toggle (dateTime, priceLevel, distance presets)

Unselected state:

```
border-[var(--ui-border)] bg-[var(--ui-surface)] text-[var(--ui-text)]
hover:-translate-y-0.5 hover:border-[var(--love-300)] hover:bg-[var(--ui-surface-soft)]
```

Selected state:

```
border-[#6c1834] bg-gradient-to-b from-[#a33a4a] to-[#7e1f3d] text-white
shadow-[0_12px_28px_-16px_rgba(126,31,61,0.62)]
```

Focus ring (applied via `focus-within:` on the label):

```
focus-within:ring-2 focus-within:ring-[var(--love-300)]
focus-within:ring-offset-2 focus-within:ring-offset-[var(--ui-surface)]/70
```

All chips use `rounded-md`, `px-3 py-2.5`, and `transition duration-200`.

### Text inputs

Defined in `src/components/questions/fields/field-classes.ts` as `baseFieldClassName`:

```
block w-full rounded-md
border border-[var(--ui-border)]
bg-[var(--ui-surface)]/92
px-3.5 py-2 text-base text-[var(--ui-text)]
shadow-[0_8px_18px_-14px_rgba(126,31,61,0.2)]
outline-none backdrop-blur-sm
placeholder:text-[var(--ui-text-muted)]
transition
focus:border-[var(--love-300)]
focus:ring-4 focus:ring-[var(--love-050)]/70
```

### Buttons

**Primary** (submit, next):

```
rounded-md border border-[#6c1834]
bg-gradient-to-r from-[#a33a4a] to-[#7e1f3d]
text-white font-semibold text-sm tracking-wide
shadow-[0_18px_30px_-18px_rgba(126,31,61,0.62)]
hover:-translate-y-0.5 hover:from-[#8e2f43] hover:to-[#6c1834]
active:translate-y-0
focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#6c1834]
```

**Secondary** (back):

```
rounded-md border border-[var(--ui-border)]
bg-[var(--ui-surface)] text-[var(--ui-text)] font-semibold text-sm tracking-wide
shadow-[0_14px_24px_-22px_rgba(126,31,61,0.18)]
hover:-translate-y-0.5 hover:border-[var(--love-300)] hover:bg-[var(--ui-surface-soft)]
active:translate-y-0
focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--love-300)]
```

### Error alerts

```
rounded-md
border border-[var(--love-300)]
bg-[var(--love-050)]/96
px-4 py-3 text-sm text-[var(--ui-danger)]
role="alert"
```

### Results list items

```
font-semibold text-[var(--love-700)]
transition hover:text-[var(--love-900)]
```

## Layout

- Max content width: `min(1080px, calc(100% - 2rem))` via the `.page-wrap` utility class.
- Main page padding: `px-4 pb-10 pt-14 sm:pb-14`.
- Form grid: `grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2`. Fields with `layout: 'full'` span both columns via `sm:col-span-2`.

## Animation

- **rise-in:** Entry animation used on the main card. `700ms cubic-bezier(0.16, 1, 0.3, 1)`, translates from `translateY(12px)` + `opacity: 0`.
- **Hover lift:** Interactive elements use `hover:-translate-y-0.5` with `transition duration-200`.
- **Global transition:** Buttons, `.island-shell`, and links share a `180ms ease` transition on `background-color`, `color`, `border-color`, and `transform`.

## Dark mode

- Theme is toggled via `data-theme="light|dark"` on `<html>`, with `auto` falling back to `prefers-color-scheme`.
- All `--ui-*` tokens have dark overrides. Components using these tokens adapt automatically.
- The selected-state chip gradient (`from-[#a33a4a] to-[#7e1f3d]`) and primary button gradient are hard-coded hex. These still look correct in dark mode but don't lighten; future work could add dark-mode overrides if needed.
