import type {Metadata} from 'next';
import './globals.css'; // Global styles
import { AppShell } from '@/components/app-shell';

export const metadata: Metadata = {
  title: 'Capability Dashboard',
  description: 'A calm capability dashboard to run Capability Units (CUs) following PDCA.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
