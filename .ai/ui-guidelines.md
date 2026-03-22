# UI Guidelines

Implementation style reference for all UI work in this project.
For app screens and behavior: `.ai/ui-app.md`. For admin feature specs: `.ai/ui-admin.md`.

---

## 1. Icons

Use **Bootstrap Icons** (`bootstrap-icons`) throughout — do not use Unicode characters
(`✕`, `←`, `✎`, etc.) as they render inconsistently across OSes.

Install: `npm install bootstrap-icons`
Usage: `<i className="bi bi-arrow-left" />`

---

## 2. Typography Scale

| Context               | Element / Class                          |
|-----------------------|------------------------------------------|
| Page title            | `h4`                                     |
| Panel / section title | `h5`                                     |
| Sub-section heading   | `h6 fw-semibold`                         |
| Labels                | `Form.Label` + `small fw-semibold` (~0.85rem) |
| Body / inputs         | Bootstrap default (~1rem)                |
| Muted / meta          | `text-muted small` (~0.875rem)           |

Avoid ad-hoc `fw-semibold` divs as headings — use the correct heading level.

---

## 3. Fields & Forms

- **Labels**: top-aligned, left-justified, `small fw-semibold`. Always linked to input via `htmlFor`/`id`.
- **Inputs**: `Form.Control` for text/select/textarea. Never replace labels with placeholders.
- **Checkboxes/Radios**: `form-check-input` + `form-check-label`.
- **Spacing**: `mb-3` on each field container (~1rem vertical rhythm).
- **Helper text**: `Form.Text` / `.form-text` below the input.
- **Validation errors**: Bootstrap `.invalid-feedback`.
- **Multi-column layouts**: `.row` + `.col-md-*`; stack vertically on small screens.
- **Avoid**: inline styles, unnecessary wrappers, centered labels.

---

## 4. Tabs

Use Bootstrap 5 tabs via `react-bootstrap` `<Tabs>`.

Style overrides live in `frontend/src/admin/admin.css` (not inline styles):

```css
.nav-tabs .nav-link {
  font-weight: 500;
  font-size: 0.9rem;
  color: var(--bs-secondary-color);
  border: none;
  border-bottom: 2px solid transparent;
}
.nav-tabs .nav-link.active {
  color: var(--bs-primary);
  border-bottom: 2px solid var(--bs-primary);
  background: transparent;
  font-weight: 600;
}
.nav-tabs .nav-link:hover:not(.active) {
  color: var(--bs-body-color);
  border-bottom: 2px solid var(--bs-border-color);
}
```

- Tabs left-aligned by default.
- `mb-3` between tab bar and content.
- Tab labels: concise, `text-truncate` if needed.
- Accessibility: `react-bootstrap` handles `role="tab"` / `role="tabpanel"` automatically.

---

## 5. Cards (UI cards, not quiz cards)

- **Background**: very light, use the shared `.card-subtle` class (`#fcfcfc`). Never use a hard white or strong color.
- **No border**: always add `border-0` to override Bootstrap's default card outline. Depth comes from shadow, not borders.
- **Shadow**: `shadow-sm` at rest. On hover, increase to a stronger shadow + slight lift (`translateY(-3px)`).
- **Rounded corners**: `rounded` (Bootstrap default ~8px).
- **Padding**: `p-3` or `p-4` inside.
- **Consistent gap** between cards: `g-3`.
- **Image placeholders**: use a slightly darker shade (e.g. `#dee2e6`) so they read as a distinct area within the card. Use a Bootstrap Icon, not an emoji.
- **Hover/focus** (clickable cards): `transition: transform 0.2s ease, box-shadow 0.2s ease` — defined in CSS, not inline styles.
- Truncate long text: `text-truncate`.
- Clickable cards: keyboard-navigable (`tabIndex={0}`, `onKeyDown` for Enter).

---

## 6. Admin Tables

- Base: `<Table striped hover>` (Bootstrap `.table-striped .table-hover`).
- Wrap in `<div className="table-responsive">` for small screens.
- Font size: `0.9–0.95rem` for rows.
- Header row: bold, `table-light` background.
- Numeric columns: right-aligned. Text: left-aligned.
- Long text cells: `text-truncate` + `maxWidth`.
- Row actions: `btn-sm` buttons; keep icons consistent size.
- Selected row: subtle highlight (e.g. `table-primary`).
- Container: `rounded shadow-sm` on the wrapping `div`.
- Empty table: centered muted message (see §8).

---

## 7. Button Style

**This is a global rule enforced in `index.css`.**

- **Solid buttons** (`btn-primary`, `btn-secondary`, etc.): default Bootstrap behavior — colored background, white text.
- **Outline buttons** (`btn-outline-*`): **always white background**, never transparent. Bootstrap's default transparent background makes outline buttons hard to read on non-white surfaces (cards, accordions, colored rows). Override with:
  ```css
  [class*="btn-outline-"]:not(:hover):not(:focus):not(:active):not(.active) {
    background-color: #fff;
  }
  ```
  Scoped to the resting state so Bootstrap's hover/active styles (colored background + white text) still work correctly.
- **Size**: use `btn-sm` inside cards and tables; default size for primary page actions.
- **Disabled state**: use the `disabled` prop — never fake it with opacity.

## 8. Button Placement

- **Primary action**: `btn-primary`, always **bottom-right**.
- **Secondary actions**: `btn-outline-secondary` or `btn-secondary`.
- **Destructive actions**: `btn-danger` or `btn-outline-danger`, separated from primary by a spacer.
- **Toolbar buttons**: `btn-sm`.
- **Icon buttons**: Bootstrap Icons + `title` attribute for accessibility.

---

## 9. Empty States

| Situation                  | Pattern |
|----------------------------|---------|
| Missing value in table cell | `<span className="fst-italic text-muted">—</span>` |
| Empty list / no results    | Centered `<p className="text-muted fst-italic">` with a short message |
| Loading                    | Skeleton rows (`placeholder-glow`) for lists; `<Spinner>` only for inline/button use |

Distinguish "no data yet" from "error" — don't show the same treatment for both.

---

## 10. Feedback & Toasts

- **Unsaved changes**: inline warning text near the Save button (`text-warning small`).
- **Save success / errors**: TODO — add a shared toast/notification component in a future step.
- Do not rely on silent success as the only signal (e.g. button just un-disabling).
- No ad-hoc `alert()` calls.

---

## 11. General

- **No inline styles** except for truly dynamic values (e.g. `width` from JS). Use utility classes.
- **Responsive**: test at mobile width; use Bootstrap breakpoints (`col-md-*`, `d-none d-md-block`).
- **Accessibility**: focus outlines visible, all interactive elements keyboard-reachable.
- **Bootstrap defaults are good** — don't override them without a clear reason (keep default border-radius, default spacing scale, etc.).
