# Thi đua Khen thưởng — MTTQ

Module chấm điểm thi đua cho 95 xã/phường, đi qua 4 tầng duyệt nội bộ trước khi công bố.

## Tech Stack

- **Framework:** ReactJS SPA, React 18 + TypeScript + Vite
- **State:** React Query (server) + Zustand (UI)
- **Routing:** React Router v6 với RBAC route guards
- **Forms:** React Hook Form + Zod
- **Grid:** TanStack Table v8
- **UI:** TailwindCSS + shadcn/ui pattern
- **Icons:** Lucide React
- **Charts:** Recharts
- **Testing:** Vitest + React Testing Library + Playwright (E2E)

## Cài đặt

```bash
npm install
npm run dev
```

## Scripts

| Command | Mô tả |
|---|---|
| `npm run dev` | Dev server (port 5173) |
| `npm run build` | Build production |
| `npm run preview` | Preview build |
| `npm run lint` | ESLint |
| `npm run test` | Unit test (Vitest) |
| `npm run test:e2e` | E2E test (Playwright) |

## Cấu trúc

Xem chi tiết tại `docs/SAD-FE-ThiDuaKhenThuong.md`

## Environment

Tạo file `.env.local`:

```
VITE_API_BASE_URL=http://localhost:8080/api
```
