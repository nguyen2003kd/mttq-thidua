# Phase 0 — Nền hạ tầng

**Thời lượng:** ~0.5 ngày. **Phụ thuộc:** không. **Bắt buộc trước mọi phase khác.**

Mục tiêu: có sẵn lệnh kiểm tra chất lượng + CI chặn regression, để các phase sau đo được.

---

## 0.1 — Scripts `package.json`

Thêm vào `"scripts"`:
```jsonc
{
  "typecheck": "tsc --noEmit -p tsconfig.json",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:cov": "vitest run --coverage",
  "test:e2e": "playwright test",
  "validate": "pnpm lint && pnpm typecheck && pnpm test:cov && pnpm build"
}
```
> `test` hiện là `vitest` (watch). Đổi thành `vitest run` để CI không treo. Watch chuyển sang `test:watch`.

---

## 0.2 — Vitest config + coverage

`vitest.config.ts` — bổ sung coverage + threshold theo thư mục:
```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    globals: true,
    css: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.d.ts',
        'src/main.tsx',
        'src/**/*.test.{ts,tsx}',
        'src/mocks/**',        // handler test riêng, không tính coverage khắt khe
        'src/data/**',         // dữ liệu tĩnh
        'src/components/ui/**', // wrapper shadcn, test qua component test
      ],
      thresholds: {
        'src/lib/**': { statements: 90, branches: 85, functions: 90, lines: 90 },
        'src/store/**': { statements: 90, branches: 80, functions: 90, lines: 90 },
        'src/services/**': { statements: 90, branches: 80, functions: 90, lines: 90 },
        global: { statements: 75, branches: 70, functions: 75, lines: 75 },
      },
    },
  },
});
```
Cài `@vitest/coverage-v8` (devDep) nếu chưa có: `pnpm add -D @vitest/coverage-v8`.

---

## 0.3 — `src/test-setup.ts`

Đảm bảo có (file đã tồn tại — kiểm tra nội dung, bổ sung nếu thiếu):
```ts
import '@testing-library/jest-dom/vitest';
import { afterEach, afterAll, beforeAll } from 'vitest';
import { cleanup } from '@testing-library/react';

// MSW server sẽ được nối ở Phase 2:
// import { server } from './mocks/server';
// beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
// afterEach(() => server.resetHandlers());
// afterAll(() => server.close());

afterEach(() => cleanup());

// jsdom thiếu:
if (!('randomUUID' in crypto)) {
  // @ts-expect-error polyfill test
  crypto.randomUUID = () => '00000000-0000-4000-8000-000000000000';
}
if (typeof window.matchMedia !== 'function') {
  window.matchMedia = (q: string) =>
    ({ matches: false, media: q, onchange: null, addListener() {}, removeListener() {},
       addEventListener() {}, removeEventListener() {}, dispatchEvent() { return false; } }) as MediaQueryList;
}
if (typeof IntersectionObserver === 'undefined') {
  class IO { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } }
  // @ts-expect-error polyfill test
  window.IntersectionObserver = IO;
}
```
> `IntersectionObserver` polyfill cần cho `DataTable` (sticky sentinel). `matchMedia` cho `next-themes`/responsive.

---

## 0.4 — Loại file scratch khỏi build/test

- `.tmp/` — thêm vào `.gitignore` nếu chưa (đang có `.tmp/verify/internal.spec.ts`). Xác nhận `.tmp` không nằm trong `tsconfig.json` `include` (hiện `include: ["src"]` — OK) và không bị Vitest quét (`test.include` mặc định `src/**` sau khi ta set — set rõ):
  ```ts
  test: { include: ['src/**/*.{test,spec}.{ts,tsx}'], ... }
  ```
- Xoá `.tmp/verify/internal.spec.ts` khỏi repo nếu là rác.

---

## 0.5 — CI (GitHub Actions)

Tạo `.github/workflows/ci.yml`:
```yaml
name: CI
on:
  push: { branches: [master] }
  pull_request:
jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test:cov
      - run: pnpm build
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec playwright install --with-deps chromium
      - run: pnpm test:e2e
```
> Job `e2e` sẽ đỏ cho tới khi Phase 5 xong — chấp nhận, hoặc thêm `continue-on-error: true` tạm thời và gỡ ở Phase 5.

---

## 0.6 — ESLint siết thêm (tùy chọn nhưng khuyến nghị)

`.eslintrc.cjs` — nâng vài rule từ `warn` lên `error`, thêm chặn `any`:
```js
rules: {
  'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
  '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  '@typescript-eslint/no-explicit-any': 'error',
  '@typescript-eslint/consistent-type-imports': 'error',
  'no-console': ['warn', { allow: ['warn', 'error'] }],
}
```
Sửa hết vi phạm phát sinh (dự kiến ít — repo đang khá sạch).

---

## Nghiệm thu Phase 0

- [ ] `pnpm typecheck` chạy, exit 0.
- [ ] `pnpm test:cov` chạy (kể cả 0 test) và in bảng coverage.
- [ ] `pnpm validate` chạy tuần tự 4 bước.
- [ ] CI workflow xanh cho job `quality` trên PR rỗng.
- [ ] `src/test-setup.ts` có polyfill IO + matchMedia + randomUUID.
- [ ] `.tmp/` trong `.gitignore`, file scratch đã xoá.
