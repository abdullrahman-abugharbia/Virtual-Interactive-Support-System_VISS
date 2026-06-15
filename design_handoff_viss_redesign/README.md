# Handoff: VISS Frontend Redesign — "Tech Premium" (Dark + Indigo)

## Overview
This package redesigns the **entire visual layer** of the VISS (Virtual Interactive
Support System) e-commerce app — every page plus the **Aria** AI support widget — into
a modern dark SaaS / AI-product aesthetic (Vercel / Linear / Perplexity territory).

The single file `VISS Redesign.dc.html` is a **clickable prototype** of all 12 screens.
Open it and use the toolbar strip at the very top to jump between screens. The Aria
widget opens from the indigo ✦ button at the bottom-right.

---

## ⚠️ READ FIRST — What you are being asked to do

This is a **redesign of an existing, working app**, not a new build. Your job:

1. **Recreate this HTML design inside the real codebase** (React 18 + Tailwind CSS 3 +
   Redux Toolkit + React Router v6). The HTML file is a **visual reference only** —
   do **not** ship it or copy its markup verbatim. Reproduce the look pixel-for-pixel
   using the app's existing components, Redux state, and routing.

2. **Render real data, not the prototype's mock data.** The prototype hardcodes 9 demo
   products, orders, etc. In the real app, **products come from the database** through
   the existing Redux thunks / `*API.js` calls. Wire the redesigned product grid, detail
   page, cart, orders, and admin tables to the **existing selectors and thunks** — only
   the markup and Tailwind classes change.

3. **DO NOT change the existing filters.** The current `ProductList.js` already has a
   working category/brand/price filter + sort + pagination system backed by Redux and the
   products API. **Keep that logic, state, query params, and API calls exactly as they
   are.** You are only restyling the filter *sidebar UI* to match the new design — the
   inputs must still drive the same existing handlers. Do not rename, rewire, or
   "improve" the filtering behavior.

### Hard constraints — DO NOT touch (from the project brief)
- Redux slices, thunks, store setup
- API call functions (all `*API.js` files)
- React Router routes in `App.js`
- Backend code of any kind
- The Three.js / TalkingHead avatar logic in `useTalkingHead.js` and `avatar-frame.html`

**Only change:** JSX structure, Tailwind class names, CSS, and component-library imports.
The visual layer only.

### Aria avatar — important
The redesign **only restyles the chrome around the avatar** (the panel, header, status
chip, chat bubbles, input bar, mic button, FAB). The 3D avatar itself — the
`<iframe>` rendering `avatar-frame.html` and all `useTalkingHead.js` logic — is
**untouched**. In the prototype the avatar is shown as a hatched placeholder labeled
"avatar-frame.html"; in the real app that placeholder **is** your existing avatar iframe,
dropped into the same slot. Do not modify avatar code.

---

## Fidelity
**High-fidelity (hifi).** Final colors, typography, spacing, radii, and interactions are
all specified below and visible in the prototype. Recreate the UI precisely using
Tailwind utilities and the existing component patterns.

---

## Output order (recommended, matches the brief)
1. `tailwind.config.js` — register the palette + font as **named tokens** (see Design
   Tokens). Never hardcode arbitrary values like `bg-[#0F172A]`.
2. `index.html` — add the Geist font import.
3. Shared primitives — buttons, inputs, cards, the navbar, badges, loading/skeleton states.
4. Pages: Home → Product Detail → Cart → Checkout → Login / Register / Forgot Password →
   My Orders → Profile → Order Success → Admin Products → Admin Orders.
5. Aria widget — `SupportWidget` (FAB) → `SupportModal` (panel shell) → `ChatPanel` →
   `MicButton` → `AvatarCanvas`.

---

## Design Tokens

### Color palette — register these as named Tailwind tokens
| Token name        | Hex       | Role |
|-------------------|-----------|------|
| `background`      | `#0F172A` | Page background |
| `surface`         | `#1E293B` | Cards, panels, inputs-on-surface |
| `surface-raised`  | `#243049` | Hover fills, secondary buttons, steppers |
| `primary`         | `#6366F1` | Primary accent (buttons, active, links) |
| `primary-hover`   | `#818CF8` | Accent hover |
| `primary-soft`    | `rgba(99,102,241,.15)` | Tinted accent backgrounds / active chips |
| `text`            | `#F1F5F9` | Primary text |
| `text-muted`      | `#94A3B8` | Secondary text |
| `text-dim`        | `#64748B` | Tertiary / meta / placeholder |
| `border`          | `#334155` | Default borders |
| `border-subtle`   | `#1E293B` / `#283548` | Hairline dividers between rows |
| `success`         | `#10B981` (text `#34D399`) | In-stock, free shipping, success |
| `warning`         | `#FCD34D` | Low stock, dispatched status |
| `error`           | `#F43F5E` (text `#FDA4AF`) | Out of stock, remove, errors |

Accent-on-text variants used: `#A5B4FC` (light indigo text), `#C7D2FE` (lighter indigo
text/badges).

### Typography
- **Font family:** **Geist** (sans) + **Geist Mono** (monospace, used for prices in tables,
  order IDs, SKUs, counts). Add via Google Fonts in `index.html`:
  `https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500;600&display=swap`
- **Type scale (px / weight / tracking):**
  - Page title (h1): 30 / 700 / -0.02em
  - Detail product title: 32 / 700 / -0.02em
  - Section heading: 16–18 / 700
  - Card title: 15 / 600
  - Body: 14–14.5 / 400 / line-height 1.6–1.7
  - Label / form label: 13 / 500
  - Meta / muted: 12.5–13 / 400–500
  - Eyebrow (brand, uppercase): 10.5–11 / 600 / 0.09–0.1em, color `#818CF8`
  - Table header: 11 / 600 / 0.08em / uppercase / `#64748B`

### Spacing, radius, shadow
- **Radius:** cards/panels `16px`; large hero/auth cards `18px`; buttons `10–12px`;
  pills/badges/chips `999px`; small thumbnails `8–12px`; mic/FAB `999px`.
- **Shadows:** card hover `0 14px 36px rgba(0,0,0,.4)`; auth/modal `0 24px 60px rgba(0,0,0,.4)`;
  Aria panel `0 24px 80px rgba(0,0,0,.6)`; FAB `0 10px 34px rgba(99,102,241,.45)`.
- **Page container:** max-width `1440px` (store/admin), `1240px` (cart/checkout/admin
  tables), `980px` (orders), `760px` (profile), `560px` (order success); horizontal
  padding `40px`.
- **Grid gaps:** product grid `22px`; sidebar↔grid `44px`; form fields `16px`.
- **Image placeholders:** product images use a 45° hatched fill
  `repeating-linear-gradient(45deg,#1A2540 0,#1A2540 14px,#1D2945 14px,#1D2945 28px)`
  with a mono caption chip. In the real app these are the actual `product.image` / thumbnails.

### Inputs (shared)
- Background `#0F172A`, border `1px #334155`, radius `10px`, padding `11–12px 14px`,
  text `#F1F5F9`, placeholder `#64748B`.
- **Focus:** border `#6366F1` + ring `0 0 0 3px rgba(99,102,241,.15)`.

### Buttons (shared)
- **Primary:** bg `#6366F1`, text `#fff`, radius `11–12px`, padding `13–15px 24px`,
  weight 600; **hover** bg `#818CF8`.
- **Secondary:** bg `#1E293B` (or `#243049`), border `1px #334155`, text `#CBD5E1`;
  **hover** border `#475569`, text `#F1F5F9`.
- **Ghost/link:** text `#818CF8`; **hover** `#A5B4FC`.
- **Icon button (e.g. add-to-cart `+`):** 36×36, radius `10px`, bg `#243049`, border
  `#334155`, text `#C7D2FE`; **hover** bg `#6366F1`, border `#6366F1`, text `#fff`.
- All interactive elements use `transition` ~0.15s on color/background/border/transform.

---

## Screens / Views
Each screen below maps to a real component file. Restyle that component; keep its data
wiring.

### 1. Navbar — `src/features/navbar/Navbar.js`
- Sticky, `height 66px`, bg `rgba(15,23,42,.85)` + `backdrop-filter: blur(14px)`, bottom
  border `1px #1E293B`. Inner max-width 1440, padding `0 40px`.
- **Left:** logo = 30×30 rounded-8 gradient square (`linear-gradient(135deg,#6366F1,#818CF8)`)
  with white "V", next to "VISS" wordmark (16/700).
- **Nav links** (Products / My Orders / Admin): 13.5/500, radius 8, active link gets
  `primary-soft` bg + `#F1F5F9` text; inactive `#94A3B8` → hover `#F1F5F9`.
- **Right:** cart button (38×38, surface, border, indigo count badge top-right) + avatar
  circle (34×34 gradient, initials). Keep your existing Headless UI menu/disclosure logic;
  just restyle.

### 2. Home / Product Listing — `src/features/product/components/ProductList.js`
- Header row: h1 "All Products" + result count (muted) on the left; **sort `<select>`**
  on the right (surface bg, border, radius 10) — keep the existing sort options/handler.
- **Two-column layout:** `grid-template-columns: 250px 1fr; gap: 44px`.
  - **Filter sidebar (sticky, top 96px):** "CATEGORY" and "BRAND" groups (uppercase
    11/600 `#64748B` headers with a hairline underline), each a list of checkbox rows:
    17×17 box → checked = filled `#6366F1` with white ✓, unchecked = `1.5px #475569`
    border; label 14 `#CBD5E1`; right-aligned mono count `#64748B`. A "Clear all filters"
    link (`#818CF8`) shows when any filter is active.
    **➜ Keep your existing filter state, options source, and handlers. Only the row markup
    is restyled. Do not change which filters exist or how they query.**
  - **Product grid:** `repeat(3, 1fr); gap 22px`. **Card** = surface bg, `1px #334155`
    border, radius 16, overflow hidden, cursor pointer. **Hover:** border
    `rgba(99,102,241,.65)`, `translateY(-3px)`, shadow `0 14px 36px rgba(0,0,0,.4)`.
    - Image area: 4/3 aspect, hatched placeholder → real `product.image`. Top-left badge:
      out-of-stock pill (error tint) **or** deal pill `−NN%` (indigo tint) computed from
      `price` vs `discountPrice`.
    - Body (padding 16/18): eyebrow brand (indigo uppercase) · title (15/600) · rating
      row (`★ 4.8` indigo star + muted number) · price row: discounted price (18/700) +
      struck-through original (`#64748B`) on the left, **add-to-cart `+` icon button** on
      the right (stops propagation; dispatches your existing addToCart). Card click → detail.
  - **Pagination** footer: "Showing X–Y of Z" + prev / page / next buttons. Wire to your
    existing `ITEMS_PER_PAGE` pagination.

### 3. Product Detail — `src/features/product/components/ProductDetail.js`
- Breadcrumb (Products / category / title).
- **Two columns** `1.15fr 1fr; gap 56px`: left = hero image (4/3, radius 18, hatched →
  real image) + 3 thumbnails; right = brand eyebrow, title (32/700), rating + stock label
  (color by level: in-stock `#34D399`, low `#FCD34D`, out `#FDA4AF`), price block
  (34/700 + struck original + "Save NN%" pill), **color swatches** (34px circles with a
  selected ring), Add-to-cart full-width primary (or disabled "Out of stock"), Description,
  and a Highlights checklist (green ✓). Keep your existing add-to-cart dispatch & stock logic.

### 4. Cart — `src/features/cart/Cart.js`
- h1 "Cart" + item count. **Two columns** `1fr 380px; gap 40px`.
  - Left: surface card; each line = thumbnail, title + "brand · $X each", **quantity
    stepper** (`− qty +` inside a bordered rounded group), line total, remove ✕ (hover
    error tint). Wire stepper/remove to existing cart slice actions.
  - Right (sticky): "Order summary" card — subtotal, free shipping (green), total,
    **Checkout** primary, "Continue shopping →" ghost.
- Empty state: dashed-border panel, "Your cart is empty." + "Browse products" primary.

### 5. Checkout — *(new page in prototype; brief approved adding it)*
- h1 "Checkout". **Two columns** `1fr 400px`. Left = Contact, Shipping address (2-col form
  grid), Payment method (two selectable cards: Card / Cash on delivery — selected = indigo
  border + tint). Right (sticky) = "Your order" summary + **Place order** primary.
- Map to however your routes handle checkout/order creation; keep existing order thunk.

### 6. Order Success — `src/features/order/...` success view
- Centered: 76px success ring (green ✓), "Order placed", confirmation line with mono order
  id, "View my orders" primary + "Continue shopping" secondary.

### 7. Login — `src/features/auth/components/Login.js`
- Centered 420px card on a faint radial indigo glow background
  (`radial-gradient(640px 420px at 50% -5%, rgba(99,102,241,.14), transparent)`).
  Logo tile, "Welcome back", email + password fields, "Forgot password?" link, **Log in**
  primary, footer "Create an account" link. Keep existing auth dispatch/validation/error
  selectors — render errors in `error`-colored text under the relevant field.

### 8. Register — `src/features/auth/components/Register.js`
- Same card shell: email, password, confirm password, **Create account** primary, "Log in"
  footer link.

### 9. Forgot Password — `src/features/auth/components/ForgotPassword.js`
- Same shell: explanatory copy, email field, **Send reset link** primary, "← Back to login".

### 10. My Orders — `src/features/user/components/UserOrders.js`
- h1 "My Orders". Stacked order cards: header row (mono `#id`, placed date, **status badge**,
  total) + item lines (thumb, title/brand, ×qty, line price) + "Ships to:" footer. Badge
  colors by status (see below). Render from your orders thunk.

### 11. Profile — `src/features/user/components/UserProfile.js`
- h1 "My Profile". Identity card (64px gradient avatar, name, email, "Edit profile"
  secondary). "Saved addresses" section with address cards (Edit / Remove links). Wire to
  your user/profile state.

### 12. Admin — Products — `src/features/admin/components/AdminProductList.js`
- h1 "Admin" + segmented tabs (Products / Orders) + "+ Add product" primary (→ your
  `ProductForm`). **Table** in a surface card: columns Product (thumb+title+brand) /
  Category / Price (mono) / Stock (colored) / Rating / Actions (Edit · Delete). Row hover
  `#223049`. Wire to existing admin product thunks (CRUD unchanged).

### 13. Admin — Orders — `src/features/admin/components/AdminOrders.js`
- Same shell, Orders tab. Table: Order (mono #id) / Customer + date / Items / Total (mono) /
  **Status `<select>` pill** (colored by value) / Payment. The status dropdown must call
  your existing update-status thunk. Keep existing data + pagination.

### Status badge colors (orders, both user & admin)
| Status | Text | Background | Border |
|--------|------|-----------|--------|
| pending | `#A5B4FC` | `rgba(99,102,241,.14)` | `rgba(99,102,241,.38)` |
| dispatched | `#FCD34D` | `rgba(251,191,36,.10)` | `rgba(251,191,36,.32)` |
| delivered | `#34D399` | `rgba(16,185,129,.10)` | `rgba(16,185,129,.32)` |
| cancelled | `#FDA4AF` | `rgba(244,63,94,.10)` | `rgba(244,63,94,.32)` |

### 14. Aria Support Widget
Files: `SupportWidget.jsx` (FAB), `SupportModal.jsx` (panel shell), `ChatPanel.jsx`,
`MicButton.jsx`, `AvatarCanvas.jsx`. **Restyle chrome only — keep all Redux/support state,
Groq calls, and the avatar iframe logic.**
- **FAB:** 58×58 circle, gradient `135deg #6366F1→#818CF8`, white ✦ icon, shadow
  `0 10px 34px rgba(99,102,241,.45)`, a slow pulsing ring; toggles to ✕ when open. Hover
  `scale(1.06)`. Fixed bottom-right (28px).
- **Panel:** 400px wide, height `min(640px, 100vh − 140px)`, bg `#0F172A`, border
  `1px #2A3854`, radius 20, shadow `0 24px 80px rgba(0,0,0,.6)`. Opens above the FAB.
  - **Avatar stage (≈218px tall):** ambient indigo radial glow + gradient bg; the
    **existing avatar iframe (`AvatarCanvas`) sits here unchanged**. Overlaid header:
    "Aria" title + **status chip** (Online/Listening…/Thinking…/Speaking… — pulsing dot,
    colored per state: online green, thinking/speaking indigo) and a close ✕.
  - **Chat (`ChatPanel`):** scrollable. Assistant messages = 26px gradient "A" avatar +
    surface bubble (`#1E293B`, border `#2A3854`, radius 14 with squared top-left).
    User messages = right-aligned indigo bubble (squared top-right). Typing indicator =
    three bouncing indigo dots in a surface bubble.
  - **Input bar:** **MicButton** (40px circle, hold-to-talk; **active = error-tinted with a
    pulsing ring** while recording — wire to existing `transcribeAudio`), pill text input
    ("Message Aria…"), 38px indigo **send** ↑ button. Keep existing send / STT / TTS wiring.

---

## Interactions & Behavior
- **Hover:** cards lift + indigo border; buttons shift to `#818CF8`; icon-add fills indigo;
  rows tint `#223049`; links → `#A5B4FC`. All ~0.15–0.2s transitions.
- **Add to cart:** dispatch existing action; show a success toast (top-right, surface card,
  green ✓, auto-dismiss ~2.4s). Out-of-stock → "Sorry — out of stock" toast.
- **Filters/sort/pagination:** **unchanged behavior** — restyled controls call the existing
  handlers.
- **Aria states:** idle → listening (hold mic) → thinking (after send) → speaking (reply),
  reflected in the status chip + mic styling. Keep the real Groq/STT/TTS flow; the prototype
  only mocks replies.
- **Entrance animations:** panel/toast use a subtle translateY slide-in (transform only — do
  not animate opacity from 0, so nothing can get stuck invisible if throttled).

## State Management
Use the **existing** Redux slices/selectors/thunks for: products + filters + sort +
pagination, cart, orders (user + admin), auth, profile, and support/Aria. **No new global
state** is required for the redesign beyond purely-local UI state (e.g. selected color
swatch, payment-method toggle, toast visibility). Do **not** introduce new data fetching —
reuse the current `*API.js` calls.

## Assets
- No raster assets in the prototype — all product/order imagery is a hatched placeholder
  standing in for your real `product.image` URLs from the DB. Use the existing image fields.
- Icons are inline SVG / simple glyphs (✦ ★ ✓ ✕ + − ↑ and a mic SVG). Reuse your existing
  icon library (the app already uses Heroicons) where equivalent.
- Fonts: Geist + Geist Mono from Google Fonts (add to `index.html`).

## Files in this bundle
- `VISS Redesign.dc.html` — the full interactive prototype (all 12 screens + Aria widget).
  Open it in a browser; use the top toolbar to switch screens. **Reference only.**
- `support.js` — runtime that lets the prototype file render; not part of the app, do not copy.
- `README.md` — this document (self-sufficient; implement from it alone).
