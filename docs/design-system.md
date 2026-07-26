# UAAMS design system

One source of truth for the look of the product. Before adding a colour, a button, or a status pill to any page, check here first — reuse an existing token or class instead of writing a new one.

## Where things live

| Layer | File | What it holds |
| --- | --- | --- |
| Tokens + global components | `app/globals.css` | Every design token (on `:root`) and the shared component classes (`.button-*`, `.status-*`, `.field-group`, `.text-link`, cards, etc.). Imported app-wide by the root layout, so these classes work on any page. |
| Portal shell | `components/portal/PortalShell.js` + `portal.module.css` | The signed-in sidebar + main layout. Consumes tokens from `:root`. |
| Button with loading | `components/auth/LoadingButton.js` | The one button component. Renders the global `.button` classes and shows a spinner while `loading`. |
| Page layout | each page’s `*.module.css` | ONLY page-specific layout (grids, spacing). No tokens, no re-implemented buttons/pills. |

**Rule:** tokens are declared once, on `:root` in `globals.css`. Never re-declare `--blue-600` (or any token) in a module. Never hard-code a hex that a token already covers.

## Tokens

### Colour

`--navy-900 #0b1f33` · `--navy-950 #071827` · `--blue-600 #2856d6` (brand/primary) · `--blue-700 #1e43ac` (hover) · `--blue-100 #eaf2ff` (tint/focus ring) · `--gold #b8975a`

Surfaces: `--white` · `--warm-50 #f7f7f4` (app background) · `--slate-50 #f4f6f8` · `--border #dde3e8` · `--border-strong #c8d0d8`

Text: `--ink #152231` (body) · `--muted #5c6977` (secondary) · `--quiet #778391` (captions)

Semantic (each has a matching `-bg`): `--success #18794e` / `--success-bg` · `--warning #8a5417` / `--warning-bg` · `--error #b42318` / `--error-bg` · `--info #175cd3` / `--info-bg`

Sidebar-only: `--side-text #c3d4e2` · `--side-quiet #93a8bb`

### Type, shadow, spacing

`--font-ui` (Inter, UI text) · `--font-editorial` (Source Serif 4, headings/marks) · `--shadow-sm` · `--shadow-lg` · `--space-eyebrow-heading`

## Components

### Buttons

Compose `.button` with one variant:

```html
<button class="button button-primary">Save</button>
<a class="button button-secondary">Cancel</a>
```

Variants: `button-primary` (brand blue, main action) · `button-secondary` (white + border) · `button-dark` (navy) · `button-quiet` (transparent) · `button-danger`. Modifiers: `button-full` (100% width), `button-large`. Disabled and a colour-adaptive spinner (`.button-spinner`) are built in.

For any button that performs async work, use the component instead of raw classes:

```jsx
<LoadingButton variant="secondary" full={false} loading={busy} onClick={save}>Save draft</LoadingButton>
```

Props: `variant` (default `primary`), `full` (default `true`), `loading`, `disabled`, `type`, `onClick`.

### Text link

`<a class="text-link">Learn more</a>` — the borderless, blue, inline action (e.g. “Cancel”, “Go to login”).

### Status pills

`<span class="status status-success">Offer</span>`. Tones: `status-success`, `status-warning`, `status-info`, `status-neutral`. Drive the tone from real data — never hard-code a status.

### Form fields

Inputs/selects use `--border-strong` at rest and focus to `--blue-600` border + `--blue-100` ring. On auth screens this is the `.input` / `.select` set in `auth.module.css`; the marketing/app forms use `.field-group` in `globals.css`. Error state: add the error class and show help text in `--error`.

### Cards & surfaces

White surface, `--border`, `--shadow-sm`, ~12–14px radius. Reuse the existing `.card` / record / section patterns rather than inventing new shadows.

## Adding a new page or component

1. Wrap signed-in pages in `PortalShell` so they inherit the sidebar, tokens and fonts.
2. Use `var(--token)` for every colour. If you reach for a hex, find the token instead.
3. Use the global `.button-*`, `.status-*`, `.text-link` classes (or `LoadingButton`). Do not create a new button/pill implementation in a module.
4. Put only page-specific layout in the page’s `*.module.css`.
5. If you genuinely need a new token or component, add it once to `globals.css` and document it here.

## History

This system was consolidated from two parallel implementations (a global stylesheet plus duplicated CSS-module copies). PRs: single token source (#115), unified buttons (#116), auth on tokens (#117).
