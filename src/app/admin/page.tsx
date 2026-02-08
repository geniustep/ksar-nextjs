'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardTitle } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import { adminApi } from '@/lib/api';
import { CATEGORY_LABELS, CATEGORY_ICONS, REQUEST_STATUS_LABELS, REQUEST_STATUS_COLORS } from '@/lib/constants';
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

// Status colors for mini badges in stats
const STATUS_DOT_COLORS: Record<string, string> = {
  pending: 'bg-purple-500',
  new: 'bg-blue-500',
  assigned: 'bg-yellow-500',
  in_progress: 'bg-orange-500',
  completed: 'bg-green-500',
  cancelled: 'bg-red-500',
  rejected: 'bg-gray-500',
};

export default function AdminDashboard() {
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
        <div className="flex justify-center py-12"><Spinner /></div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">لوحة الإحصائيات</h1>
        <p className="text-gray-500 text-sm mt-1">نظرة عامة على نظام المساعدات</p>
      </div>

      {overview && (
        <>
          {/* Quick Stats - 2x2 on mobile, 4 cols on desktop */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            {/* Total Requests */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center text-sm">📊</div>
                <span className="text-xs sm:text-sm text-gray-500">إجمالي الطلبات</span>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-primary-600">{overview.total_requests}</p>
            </div>

            {/* Urgent */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-sm">🔴</div>
                <span className="text-xs sm:text-sm text-gray-500">مستعجلة</span>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-red-600">{overview.urgent_count}</p>
            </div>

            {/* Active Orgs */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-sm">🏢</div>
                <span className="text-xs sm:text-sm text-gray-500">المؤسسات</span>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-green-600">{overview.active_organizations}</p>
            </div>

            {/* Avg completion */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-sm">⏱️</div>
                <span className="text-xs sm:text-sm text-gray-500">متوسط الإنجاز</span>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-orange-600">
                {overview.avg_completion_hours ? `${overview.avg_completion_hours}h` : '-'}
              </p>
              <p className="text-[10px] text-gray-400">بالساعات</p>
            </div>
          </div>

          {/* Status + Category breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
            {/* By Status */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <CardTitle>حسب الحالة</CardTitle>
                <Link href="/admin/requests" className="text-xs text-primary-600 hover:text-primary-700">
                  عرض الكل
                </Link>
              </div>
              <div className="space-y-3">
                {Object.entries(overview.by_status).map(([status, count]) => {
                  const percentage = overview.total_requests > 0
                    ? Math.round((count / overview.total_requests) * 100)
                    : 0;
                  return (
                    <div key={status}>
                      <div className="flex items-center justify-between text-sm mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${STATUS_DOT_COLORS[status] || 'bg-gray-400'}`} />
                          <span className="text-gray-700">{REQUEST_STATUS_LABELS[status as RequestStatus] || status}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-900 font-semibold tabular-nums">{count}</span>
                          <span className="text-gray-400 text-xs w-8 text-left">{percentage}%</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all ${STATUS_DOT_COLORS[status] || 'bg-gray-400'}`}
                          style={{ width: `${Math.max(percentage, 1)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* By Category */}
            <Card>
              <CardTitle className="mb-4">حسب التصنيف</CardTitle>
              <div className="space-y-3">
                {Object.entries(overview.by_category)
                  .sort((a, b) => b[1] - a[1])
                  .map(([category, count]) => {
                    const percentage = overview.total_requests > 0
                      ? Math.round((count / overview.total_requests) * 100)
                      : 0;
                    return (
                      <div key={category}>
                        <div className="flex items-center justify-between text-sm mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{CATEGORY_ICONS[category as RequestCategory] || '📦'}</span>
                            <span className="text-gray-700">{CATEGORY_LABELS[category as RequestCategory] || category}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-900 font-semibold tabular-nums">{count}</span>
                            <span className="text-gray-400 text-xs w-8 text-left">{percentage}%</span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div
                            className="bg-accent-500 h-1.5 rounded-full transition-all"
                            style={{ width: `${Math.max(percentage, 1)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </Card>
          </div>
        </>
      )}

      {/* Daily chart */}
      {daily.length > 0 && (
        <Card className="mb-6">
          <CardTitle className="mb-4">الطلبات اليومية (آخر 14 يوم)</CardTitle>
          <div className="overflow-x-auto -mx-2">
            <div className="flex items-end gap-1 h-36 sm:h-44 min-w-[400px] px-2">
              {daily.map((d) => {
                const maxCount = Math.max(...daily.map((x) => x.count), 1);
                const height = (d.count / maxCount) * 100;
                return (
                  <div
                    key={d.date}
                    className="flex-1 flex flex-col items-center group"
                    title={`${d.date}: ${d.count} طلب`}
                  >
                    <span className="text-[10px] sm:text-xs text-gray-400 mb-1 opacity-0 group-hover:opacity-100 transition-opacity tabular-nums">
                      {d.count}
                    </span>
                    <div
                      className="w-full bg-primary-400 hover:bg-primary-500 rounded-t transition-colors min-h-[2px]"
                      style={{ height: `${Math.max(height, 2)}%` }}
                    />
                    <span className="text-[8px] sm:text-[10px] text-gray-400 mt-1 -rotate-45 origin-top-right whitespace-nowrap">
                      {d.date.slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      {/* Regional + Organization stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Regional stats */}
        {regions.length > 0 && (
          <Card>
            <CardTitle className="mb-4">حسب المنطقة</CardTitle>

            {/* Mobile: card-based */}
            <div className="sm:hidden space-y-3">
              {regions.map((r) => (
                <div key={r.region} className="bg-gray-50 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900 text-sm">{r.region}</span>
                    <span className="text-sm font-bold text-gray-700">{r.total}</span>
                  </div>
                  <div className="flex gap-3 text-xs">
                    <span className="text-blue-600">جديد: {r.new}</span>
                    <span className="text-green-600">مكتمل: {r.completed}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 border-b">
                    <th className="text-right pb-2">المنطقة</th>
                    <th className="text-center pb-2">الإجمالي</th>
                    <th className="text-center pb-2">جديد</th>
                    <th className="text-center pb-2">مكتمل</th>
                  </tr>
                </thead>
                <tbody>
                  {regions.map((r) => (
                    <tr key={r.region} className="border-b border-gray-50">
                      <td className="py-2.5 font-medium">{r.region}</td>
                      <td className="text-center py-2.5 font-semibold">{r.total}</td>
                      <td className="text-center py-2.5 text-blue-600">{r.new}</td>
                      <td className="text-center py-2.5 text-green-600">{r.completed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Organization stats */}
        {orgStats.length > 0 && (
          <Card>
            <div className="flex items-center justify-between mb-4">
              <CardTitle>أداء المؤسسات</CardTitle>
              <Link href="/admin/organizations" className="text-xs text-primary-600 hover:text-primary-700">
                عرض الكل
              </Link>
            </div>

            {/* Mobile: card-based */}
            <div className="sm:hidden space-y-3">
              {orgStats.map((o) => {
                const rate = o.total_assignments > 0
                  ? Math.round((o.completed / o.total_assignments) * 100)
                  : 0;
                return (
                  <div key={o.id} className="bg-gray-50 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900 text-sm truncate flex-1 ml-2">{o.name}</span>
                      <Badge className="bg-green-100 text-green-800 text-xs">{rate}%</Badge>
                    </div>
                    <div className="flex gap-3 text-xs text-gray-500">
                      <span>التكفلات: {o.total_assignments}</span>
                      <span className="text-green-600">مكتمل: {o.completed}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop: table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 border-b">
                    <th className="text-right pb-2">المؤسسة</th>
                    <th className="text-center pb-2">التكفلات</th>
                    <th className="text-center pb-2">مكتمل</th>
                    <th className="text-center pb-2">النسبة</th>
                  </tr>
                </thead>
                <tbody>
                  {orgStats.map((o) => (
                    <tr key={o.id} className="border-b border-gray-50">
                      <td className="py-2.5 font-medium">{o.name}</td>
                      <td className="text-center py-2.5">{o.total_assignments}</td>
                      <td className="text-center py-2.5 text-green-600">{o.completed}</td>
                      <td className="text-center py-2.5">
                        {o.total_assignments > 0
                          ? `${Math.round((o.completed / o.total_assignments) * 100)}%`
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
