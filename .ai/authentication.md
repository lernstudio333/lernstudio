# Authentication — Patterns & Conventions

---

## 1. Session Handling Priority

1. **Existing Supabase session** – restore on mount via `supabase.auth.getSession()`. No login form shown.
2. **Browser password manager autofill** – show login form with proper `autocomplete` attributes.
3. **Manual login** – user types credentials.

Session state is always sourced from the Supabase Auth API. Never read or write `localStorage` directly for auth state. (Exception: `lastLoginEmail` is stored in `localStorage` as a UX convenience only — never the password.)

---

## 2. AuthContext — Two-Effect Pattern

Do not conflate session restore with profile fetching. Use two separate effects:

- **Effect 1 (session):** Calls `getSession()` → `setUser()`. Subscribes to `onAuthStateChange` (skip `INITIAL_SESSION` event) → `setUser()`. If no session found: sets `isInitializing = false` immediately.
- **Effect 2 (profile):** Watches `user` state. When user is set: fetches profile from `profiles` table, then sets `isLoggedIn = true`, all profile fields, and `isInitializing = false`.

**CRITICAL: Never call Supabase API methods inside `onAuthStateChange`.** It deadlocks the Supabase JS client. The callback must only call React `setState` functions.

- `login(email, password)` → `supabase.auth.signInWithPassword()` only; state flows reactively through `onAuthStateChange` → `setUser` → Effect 2 → profile fetch.
- `signOut()` → `supabase.auth.signOut()` only; state cleared reactively via `onAuthStateChange` → `setUser(null)` → Effect 2 clears profile state.
- `isInitializing` stays `true` until profile fetch completes (session found) or `getSession()` returns no session.

---

## 3. Login Modal — No-Flicker Pattern

- Single `<Modal animation={false}>` always mounted — switching content between skeleton and real form avoids Bootstrap mount/unmount flash.
- `show={isInitializing || !isLoggedIn}` — modal visible during init and when logged out.
- `animation={false}` — prevents Bootstrap fade transition from briefly exposing form content during session restore.
- While `isInitializing`: show Bootstrap `placeholder-glow` skeleton matching the form layout (non-interactive).
- While `!isLoggedIn && !isInitializing`: show real email/password form.

---

## 4. Login Form Requirements

For browser password manager autofill compatibility:

- Email input: `type="email"` + `name="email"` + `autoComplete="username"`
- Password input: `type="password"` + `name="password"` + `autoComplete="current-password"`

---

## 5. Avatar Menu Behavior

- Always rendered in `Hdr` — never conditionally hidden in the parent component.
- While `isInitializing`: dimmed non-clickable icon (`opacity-50`).
- While `!isLoggedIn`: plain icon (login modal handles login flow).
- While `isLoggedIn`: full dropdown with name, email, score, role-based links (Admin Dashboard for `admin`/`course_editor`), and Sign Out.
