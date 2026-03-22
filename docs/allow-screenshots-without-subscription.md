# Allow Taking Screenshots Without Subscription

## Context
Currently, FREE users are completely blocked by `SubscribePage` in `App.tsx` — they can't access any app functionality. The goal is to let FREE users take screenshots and use the queue locally. The paywall should only appear when they press "Solve" (send for solution) or "Debug". Settings should be stored locally (not to backend) for FREE users.

## Changes

### 1. `src/App.tsx` — Remove full-app subscription gate, keep background polling
- Always render `<SubscribedApp />` regardless of subscription level
- Remove `isSubscribed` state gating and `<SubscribePage />` render
- **Keep the 15-second background polling** for subscription changes — when a FREE user upgrades, all limitations are lifted automatically
- Pass the `user` object (with subscription info) down so child components can check subscription level
- For FREE users, use `LocalStorageProvider` for settings initialization instead of `ApiStorageProvider`

### 2. `src/services/storage/index.ts` — Use LocalStorageProvider for FREE users
- Modify `getStorageProvider()` to accept a subscription level parameter
- When subscription is FREE, return `LocalStorageProvider` (settings stored in browser localStorage, no backend calls)
- When subscription is PRO, return `ApiStorageProvider` (settings synced with backend)
- Add `resetStorageProvider()` to re-create the provider when subscription changes (e.g. after upgrade)

### 3. `src/pages/SubscribedApp.tsx` — Pass subscription context, show plan status
- Accept `user` prop from `AppContent` and make subscription level accessible to child components
- Show a small **plan status indicator** (e.g. "FREE" badge) so users know their current plan
- The indicator should include an "Upgrade" action that opens the subscription portal

### 4. `src/components/Solutions/SolutionCommands.tsx` — Allow screenshots for FREE users
- Remove the subscription check that hides Screenshot buttons for FREE users
- FREE users can take screenshots freely
- Keep hiding the "Debug" button for FREE users (since Debug sends to backend)

### 5. `electron/processing.helper.ts` — Add subscription check before solve/debug API calls
- In `processScreenshotsSolve()` and debug methods, check subscription level before making the API call
- If FREE, send an error event to renderer with upgrade message instead of calling the backend
- The backend 402 handling in processors serves as a fallback safety net

### 6. Show upgrade prompt on Solve attempt (frontend)
- When a FREE user triggers Solve, show a toast with upgrade message (e.g. "You need an active subscription to solve. Please upgrade your plan.")
- Use existing `onSolutionError` handler in `SubscribedApp.tsx`

## Key Behaviors

**FREE user flow:**
1. Signs in → sees Queue page with plan status indicator showing "FREE"
2. Can take screenshots with `Cmd+H` → screenshots stored locally
3. Can manage queue (delete, clear screenshots)
4. Can change settings (language, locale) → stored in localStorage only
5. Presses Solve → gets upgrade prompt toast
6. Clicks upgrade → opens subscription portal
7. Background polling detects upgrade → all limitations lifted automatically, switches to `ApiStorageProvider`

**PRO user flow:** Unchanged — full functionality as before.

## Key Files
- `src/App.tsx` — Main gate (simplify, keep polling)
- `src/services/storage/index.ts` — Storage factory (subscription-aware)
- `src/pages/SubscribedApp.tsx` — Main app (add user/subscription context)
- `src/components/Solutions/SolutionCommands.tsx` — Solution view commands
- `electron/processing.helper.ts` — Processing orchestration (add subscription gate)

## Verification
1. FREE user sees Queue page (not SubscribePage) with plan status visible
2. `Cmd+H` captures screenshots normally for FREE users
3. Settings changes stored locally for FREE users (no API calls)
4. `Cmd+Enter` (Solve) shows upgrade toast for FREE users
5. Background polling detects upgrade → app unlocks automatically
6. PRO users → everything works unchanged
