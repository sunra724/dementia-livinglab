'use client';

import { SWRConfig } from 'swr';

export default function SwrProvider({ children }: { children: React.ReactNode }) {
  return <SWRConfig value={{ refreshInterval: 30000 }}>{children}</SWRConfig>;
}
