# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev          # Start Vite dev server (localhost:5173)
npm run build        # Type-check (vue-tsc) then build for production
npm run preview      # Preview production build

# Testing
npm run test:unit    # Run Vitest unit tests
npm run test:e2e     # Run Cypress E2E tests (requires dev server running)

# Linting
npm run lint         # ESLint

# Firebase Cloud Functions (from /functions directory)
npm run serve        # Start Firebase emulators (functions only)
npm run deploy       # Deploy functions to Firebase
```

To run a single Vitest test file:
```bash
npx vitest run tests/unit/path/to/file.spec.ts
```

To run Cypress against a specific spec:
```bash
npx cypress run --spec "tests/e2e/specs/filename.cy.ts"
```

## Architecture

MercaBit is a mobile-first auction/marketplace app built with **Vue 3 + Ionic Vue + Capacitor** for frontend, and **Firebase** (Auth, Firestore, Storage, Cloud Functions, FCM) as the entire backend.

### Frontend Structure

```
src/
  views/       # Full-page route components (one per route)
  components/  # Reusable UI (cards, header, footer, menu)
  services/    # All Firebase interaction — business logic lives here
  router/      # Route definitions with auth guard
  firebase/    # Firebase initialization (FirebaseConfig.js)
  layouts/     # DefaultLayout.vue wraps all protected routes
  theme/       # Ionic CSS variable overrides
```

**Data flow**: Views call services → services talk directly to Firestore/Firebase Auth → Vue reactivity updates the UI. There is no Vuex/Pinia store; state is local to each view or passed via router params.

**Route guard** in `src/router/index.ts` checks `onAuthStateChanged` before each protected route. Routes with `meta: { requiresAuth: true }` redirect unauthenticated users to `/login`. Admin routes additionally check `meta: { requiresAdmin: true }` using `localStorage.getItem('userRol')`.

Routes with `meta: { hideLayout: true }` suppress DefaultLayout's header and footer — those views (e.g. `/home`, `/producto/:id`) own their own toolbar and navigation.

### Services Layer (`src/services/`)

| File | Responsibility |
|---|---|
| `authService.js` | Register, login, logout, email verification, password reset. New users start with 10,000,000 balance. |
| `productoService.js` | Product CRUD, image upload to Storage, category filtering |
| `CompraService.js` | Create purchase records when an auction finalizes |
| `CalificationService.js` | Read/write ratings as subcollection `usuarios/{vendedorId}/calificaciones` |
| `categoriaService.js` | Fetch all categories or single category by ID |
| `notification.service.ts` | FCM token management, native (Capacitor) + web push initialization |

### Firebase / Backend (`functions/index.js`)

All backend logic runs as Cloud Functions triggered by Firestore events or cron schedules:

- **`actualizarEstadoProductos`** (cron, runs every minute): Closes auctions when `fechaCierre` has passed or 1 min elapsed after last bid (dynamic anti-sniping timer). Sets status to `"Finalizada"`, notifies winner and seller.
- **`ofertaCreada`** (Firestore trigger on `ofertas`): Recalculates highest bid, validates bidder ≠ seller, implements **buy-now** logic (bid ≥ `precioVentaInmediata` closes auction immediately), notifies outbid users.
- **`ofertaActualizada`** (Firestore trigger on `ofertas`): Recalculates highest bid ranking.
- **`finalizarProductoYActualizarSaldo`** (Firestore trigger on `products` status change): Transfers `saldo` from buyer to seller, validates buyer has sufficient balance, creates `compras/{id}` record.
- **`nuevaSubastaV2` / `actualizacionSubastaV2`** (Firestore triggers): Sends FCM topic push notifications to subscribers.

### Firestore Data Model

- `users/{uid}` — profile: name, email, phone, `saldo` (balance), `rol` (admin | usuario)
- `products/{id}` — listing: name, description, `precioBase`, `precioVentaInmediata`, category, `fechaCierre`, `status` (Disponible | Finalizada), `vendedorId`, `ultimaOfertaAt`
- `ofertas/{id}` — bids: amount, `userId`, `productoId`, `esMayorOferta`, `es_mas_alta`
- `compras/{id}` — purchase record created on auction finalization
- `calificaciones` — subcollection under `users/{uid}`
- `notificaciones/{id}` — in-app notification records (unread status, message, userId)

### Mobile / Capacitor

The app targets iOS and Android via Capacitor 7. The `dist/` folder is the web asset served by Capacitor. Push notifications use `@capacitor/push-notifications` + Firebase Messaging. When making changes that affect native behavior, rebuild with `npm run build` then sync with `npx cap sync`.

### Environment Variables

Firebase config is read from `.env` using `import.meta.env.VITE_*` variables, initialized in `src/firebase/FirebaseConfig.js`. A `.env` file must be present locally with valid Firebase project credentials.

### Path Alias

`@/` maps to `src/` (configured in both `vite.config.ts` and `tsconfig.json`).

### TypeScript Usage

Most code is plain JavaScript. TypeScript is used only in `src/router/index.ts` and `src/services/notification.service.ts`. Vue components use `<script setup>` (Composition API) throughout.

## Considerations
- Always reply in spanish (code in english) even input english.
- Not use large (simplify) explanatory comments unless requested.