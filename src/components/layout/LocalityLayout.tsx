import type { ReactNode } from 'react';
import { AppLayout } from './AppLayout';

/** Địa phương dùng chung sidebar/header với Chuyên viên; menu do AppLayout chọn theo role LOCAL. */
export function LocalityLayout({ children }: { children: ReactNode }) {
  return <AppLayout>{children}</AppLayout>;
}
