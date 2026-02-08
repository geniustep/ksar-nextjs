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
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Spinner />
            <p className="text-sm text-gray-400 mt-3">جاري تحميل الإحصائيات...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const todayTotal = daily.length > 0 ? daily[daily.length - 1]?.count || 0 : 0;
  const yesterdayTotal = daily.length > 1 ? daily[daily.length - 2]?.count || 0 : 0;
  const dailyChange = todayTotal - yesterdayTotal;

  return (
    <DashboardLayout>
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-l from-primary-600 via-primary-500 to-accent-500 rounded-2xl sm:rounded-3xl p-5 sm:p-8 mb-6 text-white">
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-white/20" />
          <div className="absolute -bottom-10 -right-10 w-60 h-60 rounded-full bg-white/10" />
          <div className="absolute top-1/2 left-1/3 w-20 h-20 rounded-full bg-white/15" />
        </div>
        <div className="relative z-10">
          <p className="text-white/80 text-sm sm:text-base mb-1">مرحباً بك،</p>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-3">
            {user?.full_name || 'المدير'}
          </h1>
          <p className="text-white/70 text-sm sm:text-base max-w-lg">
            هذه نظرة عامة على حالة النظام اليوم. يمكنك إدارة الطلبات والمؤسسات والمراقبين من هنا.
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Link href="/admin/requests" className="group">
          <div className="bg-white border border-gray-100 rounded-xl p-3 sm:p-4 text-center hover:border-primary-200 hover:shadow-sm transition-all">
            <div className="text-2xl mb-1.5">📋</div>
            <span className="text-xs sm:text-sm text-gray-600 group-hover:text-primary-600 transition-colors">الطلبات</span>
          </div>
        </Link>
        <Link href="/admin/organizations" className="group">
          <div className="bg-white border border-gray-100 rounded-xl p-3 sm:p-4 text-center hover:border-green-200 hover:shadow-sm transition-all">
            <div className="text-2xl mb-1.5">🏢</div>
            <span className="text-xs sm:text-sm text-gray-600 group-hover:text-green-600 transition-colors">المؤسسات</span>
          </div>
        </Link>
        <Link href="/admin/inspectors" className="group">
          <div className="bg-white border border-gray-100 rounded-xl p-3 sm:p-4 text-center hover:border-purple-200 hover:shadow-sm transition-all">
            <div className="text-2xl mb-1.5">👁️</div>
            <span className="text-xs sm:text-sm text-gray-600 group-hover:text-purple-600 transition-colors">المراقبون</span>
          </div>
        </Link>
        <Link href="/admin/citizens" className="group">
          <div className="bg-white border border-gray-100 rounded-xl p-3 sm:p-4 text-center hover:border-blue-200 hover:shadow-sm transition-all">
            <div className="text-2xl mb-1.5">👥</div>
            <span className="text-xs sm:text-sm text-gray-600 group-hover:text-blue-600 transition-colors">المواطنون</span>
          </div>
        </Link>
      </div>

      {overview && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            {/* Total */}
            <div className="bg-gradient-to-bl from-blue-500 to-blue-600 rounded-2xl p-4 sm:p-5 text-white shadow-lg shadow-blue-500/20">
              <div className="flex items-center justify-between mb-3">
                <span className="text-white/80 text-xs sm:text-sm">إجمالي الطلبات</span>
                <span className="text-2xl">📊</span>
              </div>
              <p className="text-2xl sm:text-4xl font-black">{overview.total_requests}</p>
              {dailyChange !== 0 && (
                <p className="text-xs text-white/70 mt-1">
                  {dailyChange > 0 ? `+${dailyChange}` : dailyChange} اليوم
                </p>
              )}
            </div>

            {/* Urgent */}
            <div className="bg-gradient-to-bl from-red-500 to-rose-600 rounded-2xl p-4 sm:p-5 text-white shadow-lg shadow-red-500/20">
              <div className="flex items-center justify-between mb-3">
                <span className="text-white/80 text-xs sm:text-sm">مستعجلة</span>
                <span className="text-2xl">🚨</span>
              </div>
              <p className="text-2xl sm:text-4xl font-black">{overview.urgent_count}</p>
              {overview.urgent_count > 0 && (
                <p className="text-xs text-white/70 mt-1">تحتاج تدخل فوري</p>
              )}
            </div>

            {/* Organizations */}
            <div className="bg-gradient-to-bl from-emerald-500 to-green-600 rounded-2xl p-4 sm:p-5 text-white shadow-lg shadow-green-500/20">
              <div className="flex items-center justify-between mb-3">
                <span className="text-white/80 text-xs sm:text-sm">المؤسسات</span>
                <span className="text-2xl">🏢</span>
              </div>
              <p className="text-2xl sm:text-4xl font-black">{overview.active_organizations}</p>
              <p className="text-xs text-white/70 mt-1">مؤسسة نشطة</p>
            </div>

            {/* Avg Time */}
            <div className="bg-gradient-to-bl from-amber-500 to-orange-600 rounded-2xl p-4 sm:p-5 text-white shadow-lg shadow-orange-500/20">
              <div className="flex items-center justify-between mb-3">
                <span className="text-white/80 text-xs sm:text-sm">متوسط الإنجاز</span>
                <span className="text-2xl">⏱️</span>
              </div>
              <p className="text-2xl sm:text-4xl font-black">
                {overview.avg_completion_hours ? `${overview.avg_completion_hours}` : '-'}
              </p>
              <p className="text-xs text-white/70 mt-1">ساعة</p>
            </div>
          </div>

          {/* Status Breakdown - Horizontal pills */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900 text-base sm:text-lg">توزيع الطلبات حسب الحالة</h2>
              <Link href="/admin/requests" className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                عرض الكل &larr;
              </Link>
            </div>

            {/* Status pills - scrollable on mobile */}
            <div className="flex flex-wrap gap-2 sm:gap-3 mb-5">
              {Object.entries(overview.by_status).map(([status, count]) => {
                const colors = STATUS_COLORS[status] || { bg: 'bg-gray-100', text: 'text-gray-600', bar: 'bg-gray-400' };
                return (
                  <div key={status} className={`${colors.bg} rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 flex items-center gap-2`}>
                    <span className={`w-2 h-2 rounded-full ${colors.bar}`} />
                    <span className={`text-xs sm:text-sm ${colors.text} font-medium`}>
                      {REQUEST_STATUS_LABELS[status as RequestStatus] || status}
                    </span>
                    <span className={`text-sm sm:text-base ${colors.text} font-bold`}>{count}</span>
                  </div>
                );
              })}
            </div>

            {/* Visual bar */}
            <div className="h-3 rounded-full bg-gray-100 overflow-hidden flex">
              {Object.entries(overview.by_status).map(([status, count]) => {
                const percentage = overview.total_requests > 0
                  ? (count / overview.total_requests) * 100
                  : 0;
                const colors = STATUS_COLORS[status] || { bar: 'bg-gray-400' };
                return (
                  <div
                    key={status}
                    className={`${colors.bar} transition-all first:rounded-r-full last:rounded-l-full`}
                    style={{ width: `${Math.max(percentage, 0.5)}%` }}
                    title={`${REQUEST_STATUS_LABELS[status as RequestStatus]}: ${count}`}
                  />
                );
              })}
            </div>
          </div>

          {/* Category + Daily Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
            {/* By Category */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6">
              <h2 className="font-bold text-gray-900 text-base sm:text-lg mb-4">حسب التصنيف</h2>
              <div className="space-y-3">
                {Object.entries(overview.by_category)
                  .sort((a, b) => b[1] - a[1])
                  .map(([category, count]) => {
                    const percentage = overview.total_requests > 0
                      ? Math.round((count / overview.total_requests) * 100)
                      : 0;
                    return (
                      <div key={category} className="flex items-center gap-3">
                        <span className="text-lg w-7 text-center flex-shrink-0">
                          {CATEGORY_ICONS[category as RequestCategory] || '📦'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-gray-700 truncate">
                              {CATEGORY_LABELS[category as RequestCategory] || category}
                            </span>
                            <span className="text-sm font-bold text-gray-900 tabular-nums mr-1">{count}</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div
                              className="bg-gradient-to-l from-primary-400 to-accent-400 h-2 rounded-full transition-all"
                              style={{ width: `${Math.max(percentage, 2)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Daily chart */}
            {daily.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-gray-900 text-base sm:text-lg">آخر 14 يوم</h2>
                  <div className="text-left">
                    <span className="text-lg sm:text-xl font-bold text-primary-600">{todayTotal}</span>
                    <span className="text-xs text-gray-400 block">اليوم</span>
                  </div>
                </div>
                <div className="overflow-x-auto -mx-1">
                  <div className="flex items-end gap-[3px] sm:gap-1.5 h-32 sm:h-40 min-w-[320px] px-1">
                    {daily.map((d, i) => {
                      const maxCount = Math.max(...daily.map((x) => x.count), 1);
                      const height = (d.count / maxCount) * 100;
                      const isToday = i === daily.length - 1;
                      return (
                        <div
                          key={d.date}
                          className="flex-1 flex flex-col items-center group cursor-default"
                          title={`${d.date}: ${d.count} طلب`}
                        >
                          <span className="text-[9px] sm:text-xs text-gray-400 mb-1 opacity-0 group-hover:opacity-100 transition-opacity tabular-nums font-medium">
                            {d.count}
                          </span>
                          <div
                            className={`w-full rounded-t-md transition-all min-h-[3px] ${
                              isToday
                                ? 'bg-primary-500 shadow-sm shadow-primary-500/30'
                                : 'bg-primary-200 group-hover:bg-primary-400'
                            }`}
                            style={{ height: `${Math.max(height, 2)}%` }}
                          />
                          <span className={`text-[7px] sm:text-[9px] mt-1.5 whitespace-nowrap ${isToday ? 'text-primary-600 font-bold' : 'text-gray-300'}`}>
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Regional */}
        {regions.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6">
            <h2 className="font-bold text-gray-900 text-base sm:text-lg mb-4">حسب المنطقة</h2>
            <div className="space-y-2">
              {regions.map((r, i) => (
                <div
                  key={r.region}
                  className={`flex items-center justify-between p-3 rounded-xl transition-colors ${
                    i % 2 === 0 ? 'bg-gray-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center text-xs font-bold text-primary-600 flex-shrink-0">
                      {r.total}
                    </div>
                    <span className="font-medium text-gray-800 text-sm truncate">{r.region}</span>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs px-2 py-1 rounded-lg bg-blue-50 text-blue-600 font-medium">{r.new} جديد</span>
                    <span className="text-xs px-2 py-1 rounded-lg bg-green-50 text-green-600 font-medium">{r.completed} مكتمل</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Organization performance */}
        {orgStats.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900 text-base sm:text-lg">أداء المؤسسات</h2>
              <Link href="/admin/organizations" className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                عرض الكل &larr;
              </Link>
            </div>
            <div className="space-y-3">
              {orgStats.map((o) => {
                const rate = o.total_assignments > 0
                  ? Math.round((o.completed / o.total_assignments) * 100)
                  : 0;
                return (
                  <div key={o.id} className="group">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-gray-800 truncate flex-1 ml-3">{o.name}</span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-gray-400">{o.completed}/{o.total_assignments}</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${
                          rate >= 70 ? 'bg-green-100 text-green-700' :
                          rate >= 40 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {rate}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all ${
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
