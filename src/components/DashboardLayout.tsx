'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import Spinner from './ui/Spinner';

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

const adminNav: NavItem[] = [
  { label: 'الإحصائيات', href: '/admin', icon: '📊' },
  { label: 'الطلبات', href: '/admin/requests', icon: '📋' },
  { label: 'المؤسسات', href: '/admin/organizations', icon: '🏢' },
  { label: 'المراقبون', href: '/admin/inspectors', icon: '👁️' },
  { label: 'المواطنون', href: '/admin/citizens', icon: '👥' },
];

const superadminNav: NavItem[] = [
  ...adminNav,
  { label: 'المشرفون', href: '/admin/admins', icon: '🛡️' },
];

const orgNav: NavItem[] = [
  { label: 'الطلبات المتاحة', href: '/org/requests', icon: '📋' },
  { label: 'تكفلاتي', href: '/org/assignments', icon: '✅' },
];

const inspectorNav: NavItem[] = [
  { label: 'لوحة التحكم', href: '/inspector', icon: '📊' },
  { label: 'الطلبات', href: '/inspector/requests', icon: '📋' },
  { label: 'الجمعيات', href: '/inspector/organizations', icon: '🏢' },
];

const citizenNav: NavItem[] = [
  { label: 'طلباتي', href: '/citizen', icon: '📋' },
  { label: 'طلب جديد', href: '/citizen/new-request', icon: '➕' },
  { label: 'الملف الشخصي', href: '/citizen/profile', icon: '👤' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-light">
        <Spinner />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    router.push('/login');
    return null;
  }

  let navItems: NavItem[];
  let title: string;

  switch (user.role) {
    case 'superadmin':
      navItems = superadminNav;
      title = 'لوحة المدير العام';
      break;
    case 'admin':
      navItems = adminNav;
      title = 'لوحة الإدارة';
      break;
    case 'inspector':
      navItems = inspectorNav;
      title = 'لوحة المراقب';
      break;
    case 'organization':
      navItems = orgNav;
      title = user.organization_name || 'المؤسسة';
      break;
    case 'citizen':
      navItems = citizenNav;
      title = 'حسابي';
      break;
    default:
      navItems = [];
      title = 'كرامة قصر';
  }

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-neutral-light" dir="rtl">
      {/* Mobile top bar */}
      <div className="lg:hidden bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-gray-600"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg font-bold text-primary-600 font-cairo">كرامة قصر</span>
        </Link>
        <div className="w-6" />
      </div>

      <div className="flex">
        {/* Sidebar overlay on mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={cn(
            'fixed lg:sticky top-0 right-0 z-40 lg:z-auto h-screen w-64 bg-white border-l border-gray-100 flex flex-col transition-transform lg:transform-none',
            sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
          )}
        >
          <div className="p-6 border-b border-gray-50">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="كرامة قصر"
                width={36}
                height={36}
                className="object-contain"
              />
              <div>
                <span className="text-xl font-bold text-primary-600 font-cairo block leading-tight">كرامة قصر</span>
                <span className="text-[9px] text-accent-500 font-inter tracking-widest">KKSAR.MA</span>
              </div>
            </Link>
            <p className="text-sm text-gray-500 mt-2">{title}</p>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors',
                  pathname === item.href
                    ? 'bg-primary-50 text-primary-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                )}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t border-gray-50">
            <div className="text-sm text-gray-600 mb-1">{user.full_name}</div>
            <div className="text-xs text-gray-400 mb-3">{user.email || user.phone}</div>
            <button
              onClick={handleLogout}
              className="w-full text-sm text-danger-500 hover:bg-red-50 px-3 py-2 rounded-xl text-right transition-colors"
            >
              تسجيل الخروج
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-h-screen">
          <div className="p-6 lg:p-8 max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
