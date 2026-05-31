# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server (Next.js 16 + Turbopack) on :3002
npm run build    # Production build
npm run lint     # ESLint check
```

> After changing font registration or module-level `Font.register()` calls in the PDF template, delete `.next/` and restart the dev server — Turbopack caches module-level side effects.

---

## Architecture

**Stack:** Next.js 16 App Router · React 19 · Supabase (auth + DB + storage) · Tailwind CSS v4 · shadcn/ui · @react-pdf/renderer v4.5.1

### Route groups

```
src/app/
  (auth)/           # login, şifre-değiştir — no sidebar
  (dashboard)/      # all authenticated pages — sidebar + topbar layout
  api/              # Route Handlers (server-only)
  sifre-degistir/   # outside (dashboard) group — no layout guard
```

### Auth & routing

- **`src/proxy.ts`** — this is the middleware file (Next.js 16 renamed it; do NOT create `middleware.ts`)
- Session is detected by checking for Supabase auth cookies (`auth-token`) — a fast local check, no network call
- `SifreDegistirGuard` in the dashboard layout redirects users with `sifre_degistir_gerekli: true` to `/sifre-degistir` using `window.location.href` (not `router.push`) to force a full reload and clear stale `useAuth` cache

### Three Supabase clients — use the right one

| Client | File | When to use |
|--------|------|-------------|
| Browser | `lib/supabase/client.ts` | Client components, hooks |
| Server | `lib/supabase/server.ts` | Server components, route handlers (respects RLS) |
| Admin | `lib/supabase/admin.ts` | API routes that need to bypass RLS |

**The RLS bypass pattern** (used throughout API routes):
```ts
const supabase = await createClient()             // auth check — user client
const { data: { user } } = await supabase.auth.getUser()
if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
const admin = createAdminClient()                 // data ops — admin client
await admin.from('...').update(...)
```

RLS policies that require the admin client:
- `profiles` update (only `yonetici` via RLS) → `sifre-guncelle`, `kullanici/yeni`
- `is_emirleri` update → `is-emri/[id]/durum`
- `profiles` select in embedded joins (saha_muhendisi sees only own row) → PDF route fetches all engineers via admin

### Roles

Two roles: `yonetici` | `saha_muhendisi`. Role checked via:
- `profile.rol === 'yonetici'` in components
- `auth_rol()` SQL helper function in RLS policies
- `is_emri_atanan(emri_id)` SQL helper for engineer assignment checks

### PDF generation

`src/components/pdf/ServisRaporuTemplate.tsx` + `src/app/api/pdf/[isEmriId]/route.ts`

- Font: Arial TTF from `public/fonts/arial-400.ttf` / `arial-700.ttf` (copied from macOS). **woff2 causes `RangeError: Offset is outside bounds of DataView`** in fontkit — only TTF works.
- Logo: `public/logo-bem.png` (555×160px, aspect ratio ≈ 3.47:1) loaded via `path.join(process.cwd(), 'public/logo-bem.png')`
- `serverExternalPackages: ['@react-pdf/renderer']` is set in `next.config.ts` — required for server-side rendering
- All data fetched with admin client so engineer list is complete (user RLS would filter it)
- Images passed as base64 data URIs via `createSignedUrl` + `arrayBuffer` → `Buffer.from().toString('base64')`
- Null dates fallback: `sf.fiili_baslangic ?? ie.planlanan_baslangic ?? new Date().toISOString()`

### Datetime handling

`datetime-local` inputs store values as plain strings (e.g. `"2026-05-22T10:30"`) — Supabase stores these as UTC without timezone conversion. To avoid 3-hour display drift on Istanbul-timezone machines:

- **`formatTarihSaat`** uses `Intl.DateTimeFormat` with `timeZone: 'UTC'` — not `date-fns` `format()` which uses the server's local timezone
- **`formatSure`** converts decimal calendar-days to work-hours using **1 work day = 8.5 hours** (510 minutes)

### Storage buckets

| Bucket | Usage |
|--------|-------|
| `servis-fotograflari` | Field photos — compressed to max 1.5MB / 1920px JPEG |
| `imzalar` | Engineer + customer signature PNGs |

Signed URLs expire after 1 hour (client) / 5 minutes (PDF generation). Use `getSignedUrl()` / `getImzaSignedUrl()` from `src/lib/fotograf.ts`.

### Servis form state machine

```
atandi → devam_ediyor (taslak kaydet)
       → tamamlandi / tamamlanmadi (imzala ve tamamla)
```

- `canEdit = isAtanan && !formTamamlandi` — controls field editing
- `canSign = isAtanan && !benImzaladimMi && !!servisFormuId` — allows late signing after form is locked
- Status transitions go through `/api/is-emri/[id]/durum` (admin client) to bypass RLS
- Form is considered locked (`formTamamlandi = true`) when `musteri_imza_url` is non-null

### New user flow

`POST /api/kullanici/yeni` → creates `auth.users` entry + `profiles` row with `sifre_degistir_gerekli: true`. On first login, `SifreDegistirGuard` intercepts and forces password change via `/sifre-degistir`. After change, `POST /api/profil/sifre-guncelle` resets the flag using admin client.

### Database migrations

Located in `supabase/migrations/`. Apply manually via Supabase SQL Editor — there is no automated migration runner configured.

### Report duration formatting

`formatSure(gunCinsinden: number)` in `src/lib/tarih.ts`:
- Input: decimal calendar days (raw value from `saha_gunu` DB column)
- Converts: `days × 24 × 60` total minutes → divides by 510 (8.5h work day)
- Output: `"X gün Y sa"` — minutes are intentionally omitted
