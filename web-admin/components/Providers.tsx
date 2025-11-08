'use client';

import { ReactNode } from 'react';
import { NotificationProvider } from './NotificationProvider';

export function Providers({ children }: { children: ReactNode }) {
  return <NotificationProvider>{children}</NotificationProvider>;
}


