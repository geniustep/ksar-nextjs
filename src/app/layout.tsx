import type { Metadata } from 'next';
import { AuthProvider } from '@/contexts/AuthContext';
import './globals.css';

export const metadata: Metadata = {
  title: 'كرامة قصر | لأن الظرف لا يُسقط الكرامة',
  description: 'منصة إنسانية تحفظ الكرامة قبل المساعدة - جسر بين المحتاجين والجهات الخيرية المعتمدة',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className="bg-neutral-light text-neutral-dark antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
