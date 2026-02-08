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
  mobileLabel?: string;
}

const adminNav: NavItem[] = [
  { label: 'الإحصائيات', href: '/admin', icon: '📊', mobileLabel: 'الرئيسية' },
  { label: 'الطلبات', href: '/admin/requests', icon: '📋' },
  { label: 'المؤسسات', href: '/admin/organizations', icon: '🏢' },
  { label: 'المراقبون', href: '/admin/inspectors', icon: '👁️', mobileLabel: 'المراقبون' },
  { label: 'المواطنون', href: '/admin/citizens', icon: '👥' },
];

const superadminNav: NavItem[] = [
  ...adminNav,
  { label: 'المشرفون', href: '/admin/admins', icon: '🛡️' },
];

const orgNav: NavItem[] = [
  { label: 'الطلبات المتاحة', href: '/org/requests', icon: '📋', mobileLabel: 'الطلبات' },
  { label: 'تكفلاتي', href: '/org/assignments', icon: '✅' },
  { label: 'ملف المؤسسة', href: '/org/profile', icon: '🏢', mobileLabel: 'الملف' },
];

const inspectorNav: NavItem[] = [
  { label: 'لوحة التحكم', href: '/inspector', icon: '📊', mobileLabel: 'الرئيسية' },
  { label: 'الطلبات', href: '/inspector/requests', icon: '📋' },
  { label: 'المشبوهة', href: '/inspector/flagged', icon: '⚠️', mobileLabel: 'تنبيهات' },
  { label: 'الجمعيات', href: '/inspector/organizations', icon: '🏢' },
  { label: 'الملف الشخصي', href: '/inspector/profile', icon: '👤', mobileLabel: 'حسابي' },
];

const citizenNav: NavItem[] = [
  { label: 'طلباتي', href: '/citizen', icon: '📋' },
  { label: 'طلب جديد', href: '/citizen/new-request', icon: '➕', mobileLabel: 'طلب' },
  { label: 'الملف الشخصي', href: '/citizen/profile', icon: '👤', mobileLabel: 'حسابي' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

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

  const maxBottomItems = 5;
  const bottomNavItems = navItems.slice(0, maxBottomItems);
  const hasMore = navItems.length > maxBottomItems;
  const moreItems = navItems.slice(maxBottomItems);

  const isActive = (href: string) => {
    if (href === '/admin' || href === '/inspector' || href === '/citizen') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-neutral-light" dir="rtl">
      {/* Mobile top bar */}
      <div className="lg:hidden bg-white border-b border-gray-100 px-4 py-2.5 flex items-center justify-between sticky top-0 z-30">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="كرامة قصر" width={24} height={24} className="object-contain" />
          <span className="text-sm font-bold text-primary-600 font-cairo">كرامة قصر</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-gray-500 hidden sm:block">{user.full_name}</span>
          <button
            onClick={handleLogout}
            className="text-[11px] text-danger-500 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors"
          >
            خروج
          </button>
        </div>
      </div>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex lg:sticky top-0 z-auto h-screen w-64 bg-white border-l border-gray-100 flex-col">
          <div className="p-6 border-b border-gray-50">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logo.png" alt="كرامة قصر" width={36} height={36} className="object-contain" />
              <div>
                <span className="text-xl font-bold text-primary-600 font-cairo block leading-tight">كرامة قصر</span>
                <span className="text-[9px] text-accent-500 font-inter tracking-widest">KKSAR.MA</span>
              </div>
            </Link>
            <p className="text-sm text-gray-500 mt-2">{title}</p>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors',
                  isActive(item.href)
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

        {/* Main content - pb-[72px] to account for bottom nav height */}
        <main className="flex-1 min-h-screen pb-[72px] lg:pb-0">
          <div className="p-3 sm:p-5 lg:p-8 max-w-7xl">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div
        className="lg:hidden"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          backgroundColor: 'white',
          borderTop: '1px solid #e5e7eb',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <div className="flex items-stretch">
          {bottomNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex-1 flex flex-col items-center justify-center py-2 px-0.5 min-h-[54px] transition-colors relative',
                isActive(item.href)
                  ? 'text-primary-600'
                  : 'text-gray-400'
              )}
            >
              {isActive(item.href) && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] bg-primary-600 rounded-full" />
              )}
              <span className="text-[17px] leading-none">{item.icon}</span>
              <span className={cn(
                'text-[9px] mt-0.5 leading-tight truncate max-w-full',
                isActive(item.href) ? 'font-bold' : 'font-normal'
              )}>
                {item.mobileLabel || item.label}
              </span>
            </Link>
          ))}
          {hasMore && (
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className={cn(
                'flex-1 flex flex-col items-center justify-center py-2 px-0.5 min-h-[54px] transition-colors relative',
                showMobileMenu ? 'text-primary-600' : 'text-gray-400'
              )}
            >
              <span className="text-[17px] leading-none">⋯</span>
              <span className="text-[9px] mt-0.5 leading-tight font-normal">المزيد</span>
            </button>
          )}
        </div>

        {/* More menu popup */}
        {showMobileMenu && hasMore && (
          <>
            <div
              className="fixed inset-0"
              style={{ zIndex: 9998 }}
              onClick={() => setShowMobileMenu(false)}
            />
            <div
              className="absolute bottom-full left-0 right-0 bg-white border-t border-gray-200 shadow-2xl rounded-t-2xl p-3 space-y-1"
              style={{ zIndex: 9999 }}
            >
              {moreItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setShowMobileMenu(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors',
                    isActive(item.href)
                      ? 'bg-primary-50 text-primary-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                  )}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
