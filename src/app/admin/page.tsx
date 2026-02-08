'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import Spinner from '@/components/ui/Spinner';
import { adminApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { CATEGORY_LABELS, CATEGORY_ICONS, REQUEST_STATUS_LABELS } from '@/lib/constants';
import type { RequestCategory, RequestStatus } from '@/lib/types';

interface OverviewData {
  total_requests: number;
  by_status: Record<string, number>;
  by_category: Record<string, number>;
  urgent_count: number;
  avg_completion_hours: number | null;
  active_organizations: number;
}

interface DailyItem {
  date: string;
  count: number;
}

interface RegionalItem {
  region: string;
  total: number;
  new: number;
  completed: number;
}

interface OrgStatItem {
  id: string;
  name: string;
  total_assignments: number;
  completed: number;
}

const STATUS_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
  pending: { bg: 'bg-purple-50', text: 'text-purple-700', bar: 'bg-purple-500' },
  new: { bg: 'bg-blue-50', text: 'text-blue-700', bar: 'bg-blue-500' },
  assigned: { bg: 'bg-yellow-50', text: 'text-yellow-700', bar: 'bg-yellow-500' },
  in_progress: { bg: 'bg-orange-50', text: 'text-orange-700', bar: 'bg-orange-500' },
  completed: { bg: 'bg-green-50', text: 'text-green-700', bar: 'bg-green-500' },
  cancelled: { bg: 'bg-red-50', text: 'text-red-700', bar: 'bg-red-500' },
  rejected: { bg: 'bg-gray-100', text: 'text-gray-600', bar: 'bg-gray-400' },
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [daily, setDaily] = useState<DailyItem[]>([]);
  const [regions, setRegions] = useState<RegionalItem[]>([]);
  const [orgStats, setOrgStats] = useState<OrgStatItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [overviewRes, dailyRes, regionsRes, orgRes] = await Promise.all([
        adminApi.getOverviewStats(),
        adminApi.getDailyStats(14),
        adminApi.getRegionalStats(),
        adminApi.getOrgStats(),
      ]);
      setOverview(overviewRes.data);
      setDaily(dailyRes.data);
      setRegions(regionsRes.data);
      setOrgStats(orgRes.data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-16">
          <Spinner />
        </div>
      </DashboardLayout>
    );
  }

  const todayTotal = daily.length > 0 ? daily[daily.length - 1]?.count || 0 : 0;
  const yesterdayTotal = daily.length > 1 ? daily[daily.length - 2]?.count || 0 : 0;
  const dailyChange = todayTotal - yesterdayTotal;

  return (
    <DashboardLayout>
      {/* Welcome Banner - compact on mobile */}
      <div className="bg-gradient-to-l from-primary-600 via-primary-500 to-accent-500 rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 text-white relative overflow-hidden">
        <div className="absolute -top-8 -left-8 w-28 h-28 rounded-full bg-white/10" />
        <div className="absolute -bottom-6 -right-6 w-40 h-40 rounded-full bg-white/5" />
        <div className="relative">
          <p className="text-white/80 text-xs sm:text-sm">مرحباً،</p>
          <h1 className="text-lg sm:text-2xl font-bold">{user?.full_name || 'المدير'}</h1>
        </div>
      </div>

      {/* Quick Actions - small on mobile */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6">
        {[
          { href: '/admin/requests', icon: '📋', label: 'الطلبات' },
          { href: '/admin/organizations', icon: '🏢', label: 'المؤسسات' },
          { href: '/admin/inspectors', icon: '👁️', label: 'المراقبون' },
          { href: '/admin/citizens', icon: '👥', label: 'المواطنون' },
        ].map((item) => (
          <Link key={item.href} href={item.href}>
            <div className="bg-white border border-gray-100 rounded-xl p-2.5 sm:p-4 text-center hover:shadow-sm transition-all">
              <div className="text-xl sm:text-2xl mb-0.5 sm:mb-1.5">{item.icon}</div>
              <span className="text-[10px] sm:text-sm text-gray-600">{item.label}</span>
            </div>
          </Link>
        ))}
      </div>

      {overview && (
        <>
          {/* Stats Cards - compact 2x2 */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-4 mb-4 sm:mb-6">
            <div className="bg-gradient-to-bl from-blue-500 to-blue-600 rounded-xl sm:rounded-2xl p-3 sm:p-5 text-white">
              <div className="flex items-center justify-between mb-1 sm:mb-3">
                <span className="text-white/80 text-[10px] sm:text-sm">إجمالي الطلبات</span>
                <span className="text-base sm:text-2xl">📊</span>
              </div>
              <p className="text-xl sm:text-4xl font-black">{overview.total_requests}</p>
              {dailyChange !== 0 && (
                <p className="text-[10px] sm:text-xs text-white/70 mt-0.5">{dailyChange > 0 ? `+${dailyChange}` : dailyChange} اليوم</p>
              )}
            </div>

            <div className="bg-gradient-to-bl from-red-500 to-rose-600 rounded-xl sm:rounded-2xl p-3 sm:p-5 text-white">
              <div className="flex items-center justify-between mb-1 sm:mb-3">
                <span className="text-white/80 text-[10px] sm:text-sm">مستعجلة</span>
                <span className="text-base sm:text-2xl">🚨</span>
              </div>
              <p className="text-xl sm:text-4xl font-black">{overview.urgent_count}</p>
            </div>

            <div className="bg-gradient-to-bl from-emerald-500 to-green-600 rounded-xl sm:rounded-2xl p-3 sm:p-5 text-white">
              <div className="flex items-center justify-between mb-1 sm:mb-3">
                <span className="text-white/80 text-[10px] sm:text-sm">المؤسسات</span>
                <span className="text-base sm:text-2xl">🏢</span>
              </div>
              <p className="text-xl sm:text-4xl font-black">{overview.active_organizations}</p>
            </div>

            <div className="bg-gradient-to-bl from-amber-500 to-orange-600 rounded-xl sm:rounded-2xl p-3 sm:p-5 text-white">
              <div className="flex items-center justify-between mb-1 sm:mb-3">
                <span className="text-white/80 text-[10px] sm:text-sm">متوسط الإنجاز</span>
                <span className="text-base sm:text-2xl">⏱️</span>
              </div>
              <p className="text-xl sm:text-4xl font-black">{overview.avg_completion_hours || '-'}</p>
              <p className="text-[10px] sm:text-xs text-white/70 mt-0.5">ساعة</p>
            </div>
          </div>

          {/* Status Breakdown */}
          <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 p-3 sm:p-6 mb-4 sm:mb-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="font-bold text-gray-900 text-sm sm:text-lg">حسب الحالة</h2>
              <Link href="/admin/requests" className="text-[10px] sm:text-xs text-primary-600 font-medium">
                عرض الكل
              </Link>
            </div>

            {/* Scrollable pills on mobile */}
            <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0 mb-3 sm:mb-5">
              <div className="flex gap-1.5 sm:gap-3 sm:flex-wrap min-w-max sm:min-w-0">
                {Object.entries(overview.by_status).map(([status, count]) => {
                  const colors = STATUS_COLORS[status] || { bg: 'bg-gray-100', text: 'text-gray-600', bar: 'bg-gray-400' };
                  return (
                    <div key={status} className={`${colors.bg} rounded-lg sm:rounded-xl px-2.5 sm:px-4 py-1.5 sm:py-2.5 flex items-center gap-1.5 sm:gap-2 whitespace-nowrap`}>
                      <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${colors.bar}`} />
                      <span className={`text-[10px] sm:text-sm ${colors.text} font-medium`}>
                        {REQUEST_STATUS_LABELS[status as RequestStatus] || status}
                      </span>
                      <span className={`text-xs sm:text-base ${colors.text} font-bold`}>{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Visual bar */}
            <div className="h-2 sm:h-3 rounded-full bg-gray-100 overflow-hidden flex">
              {Object.entries(overview.by_status).map(([status, count]) => {
                const pct = overview.total_requests > 0 ? (count / overview.total_requests) * 100 : 0;
                const colors = STATUS_COLORS[status] || { bar: 'bg-gray-400' };
                return (
                  <div key={status} className={`${colors.bar} first:rounded-r-full last:rounded-l-full`} style={{ width: `${Math.max(pct, 0.5)}%` }} />
                );
              })}
            </div>
          </div>

          {/* Category + Daily Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6 mb-4 sm:mb-6">
            {/* By Category */}
            <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 p-3 sm:p-6">
              <h2 className="font-bold text-gray-900 text-sm sm:text-lg mb-3 sm:mb-4">حسب التصنيف</h2>
              <div className="space-y-2.5 sm:space-y-3">
                {Object.entries(overview.by_category)
                  .sort((a, b) => b[1] - a[1])
                  .map(([category, count]) => {
                    const pct = overview.total_requests > 0 ? Math.round((count / overview.total_requests) * 100) : 0;
                    return (
                      <div key={category} className="flex items-center gap-2 sm:gap-3">
                        <span className="text-sm sm:text-lg w-5 sm:w-7 text-center flex-shrink-0">
                          {CATEGORY_ICONS[category as RequestCategory] || '📦'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5 sm:mb-1">
                            <span className="text-xs sm:text-sm text-gray-700 truncate">{CATEGORY_LABELS[category as RequestCategory] || category}</span>
                            <span className="text-xs sm:text-sm font-bold text-gray-900 tabular-nums mr-1">{count}</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-1.5 sm:h-2">
                            <div className="bg-gradient-to-l from-primary-400 to-accent-400 h-full rounded-full" style={{ width: `${Math.max(pct, 2)}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Daily chart */}
            {daily.length > 0 && (
              <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 p-3 sm:p-6">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h2 className="font-bold text-gray-900 text-sm sm:text-lg">آخر 14 يوم</h2>
                  <div className="text-left">
                    <span className="text-base sm:text-xl font-bold text-primary-600">{todayTotal}</span>
                    <span className="text-[10px] sm:text-xs text-gray-400 block">اليوم</span>
                  </div>
                </div>
                <div className="overflow-x-auto -mx-1">
                  <div className="flex items-end gap-[2px] sm:gap-1.5 h-24 sm:h-40 min-w-[280px] px-1">
                    {daily.map((d, i) => {
                      const maxCount = Math.max(...daily.map((x) => x.count), 1);
                      const height = (d.count / maxCount) * 100;
                      const isToday = i === daily.length - 1;
                      return (
                        <div key={d.date} className="flex-1 flex flex-col items-center group" title={`${d.date}: ${d.count}`}>
                          <span className="text-[8px] sm:text-xs text-gray-400 mb-0.5 opacity-0 group-hover:opacity-100 tabular-nums">{d.count}</span>
                          <div
                            className={`w-full rounded-t min-h-[2px] ${isToday ? 'bg-primary-500' : 'bg-primary-200 group-hover:bg-primary-400'}`}
                            style={{ height: `${Math.max(height, 2)}%` }}
                          />
                          <span className={`text-[6px] sm:text-[9px] mt-1 ${isToday ? 'text-primary-600 font-bold' : 'text-gray-300'}`}>
                            {d.date.slice(8)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Regional + Org stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6">
        {/* Regional */}
        {regions.length > 0 && (
          <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 p-3 sm:p-6">
            <h2 className="font-bold text-gray-900 text-sm sm:text-lg mb-3 sm:mb-4">حسب المنطقة</h2>
            <div className="space-y-2">
              {regions.map((r) => (
                <div key={r.region} className="bg-gray-50 rounded-lg sm:rounded-xl p-2.5 sm:p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg bg-primary-50 flex items-center justify-center text-[10px] sm:text-xs font-bold text-primary-600 flex-shrink-0">
                        {r.total}
                      </span>
                      <span className="font-medium text-gray-800 text-xs sm:text-sm truncate">{r.region}</span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
                      <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded bg-blue-50 text-blue-600 font-medium">{r.new}</span>
                      <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded bg-green-50 text-green-600 font-medium">{r.completed}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Organization performance */}
        {orgStats.length > 0 && (
          <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 p-3 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="font-bold text-gray-900 text-sm sm:text-lg">أداء المؤسسات</h2>
              <Link href="/admin/organizations" className="text-[10px] sm:text-xs text-primary-600 font-medium">
                عرض الكل
              </Link>
            </div>
            <div className="space-y-2.5 sm:space-y-3">
              {orgStats.map((o) => {
                const rate = o.total_assignments > 0 ? Math.round((o.completed / o.total_assignments) * 100) : 0;
                return (
                  <div key={o.id}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs sm:text-sm font-medium text-gray-800 truncate flex-1 ml-2">{o.name}</span>
                      <span className={`text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded ${
                        rate >= 70 ? 'bg-green-100 text-green-700' :
                        rate >= 40 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {rate}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 sm:h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          rate >= 70 ? 'bg-gradient-to-l from-green-400 to-emerald-500' :
                          rate >= 40 ? 'bg-gradient-to-l from-yellow-400 to-amber-500' :
                          'bg-gradient-to-l from-red-400 to-rose-500'
                        }`}
                        style={{ width: `${Math.max(rate, 2)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
