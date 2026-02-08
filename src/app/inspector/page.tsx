'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import { inspectorApi } from '@/lib/api';
import { REQUEST_STATUS_LABELS, REQUEST_STATUS_COLORS, CATEGORY_LABELS, ASSIGNMENT_STATUS_LABELS, ASSIGNMENT_STATUS_COLORS } from '@/lib/constants';
import type { InspectorStats, RequestResponse, RequestCategory, OrganizationWithAssignments, AssignmentStatus } from '@/lib/types';

export default function InspectorDashboard() {
  const [stats, setStats] = useState<InspectorStats | null>(null);
  const [pendingRequests, setPendingRequests] = useState<RequestResponse[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationWithAssignments[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, requestsRes, orgsRes] = await Promise.all([
        inspectorApi.getStats(),
        inspectorApi.getRequests({ status: 'pending', limit: 10 }),
        inspectorApi.getOrganizationsWithAssignments(),
      ]);
      setStats(statsRes);
      setPendingRequests(requestsRes.items);
      setOrganizations(orgsRes.items);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const activeOrgs = organizations.filter(o => o.active_assignments.length > 0);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-12"><Spinner /></div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-4 sm:mb-6">
        <h1 className="text-lg sm:text-2xl font-bold text-neutral-dark">لوحة تحكم المراقب</h1>
        <p className="text-gray-500 text-xs sm:text-base mt-0.5 sm:mt-1">مراجعة الطلبات وتفعيلها أو ربطها بالجمعيات</p>
      </div>

      {/* Stats - compact on mobile */}
      {stats && (
        <div className="grid grid-cols-2 gap-2.5 sm:gap-4 mb-4 sm:mb-8">
          <div className="bg-gradient-to-bl from-purple-500 to-purple-600 rounded-xl sm:rounded-2xl p-3 sm:p-5 text-white">
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <span className="text-white/80 text-[10px] sm:text-sm">معلقة</span>
              <span className="text-base sm:text-xl">⏳</span>
            </div>
            <p className="text-xl sm:text-3xl font-black">{stats.pending_count}</p>
          </div>
          <div className="bg-gradient-to-bl from-green-500 to-green-600 rounded-xl sm:rounded-2xl p-3 sm:p-5 text-white">
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <span className="text-white/80 text-[10px] sm:text-sm">مفعّلة</span>
              <span className="text-base sm:text-xl">✅</span>
            </div>
            <p className="text-xl sm:text-3xl font-black">{stats.activated_count}</p>
          </div>
          <div className="bg-gradient-to-bl from-red-500 to-red-600 rounded-xl sm:rounded-2xl p-3 sm:p-5 text-white">
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <span className="text-white/80 text-[10px] sm:text-sm">مرفوضة</span>
              <span className="text-base sm:text-xl">❌</span>
            </div>
            <p className="text-xl sm:text-3xl font-black">{stats.rejected_count}</p>
          </div>
          <div className="bg-gradient-to-bl from-blue-500 to-blue-600 rounded-xl sm:rounded-2xl p-3 sm:p-5 text-white">
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <span className="text-white/80 text-[10px] sm:text-sm">مربوطة</span>
              <span className="text-base sm:text-xl">🏢</span>
            </div>
            <p className="text-xl sm:text-3xl font-black">{stats.assigned_count}</p>
          </div>
        </div>
      )}

      {/* Pending Requests */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 p-3 sm:p-6 mb-4 sm:mb-6">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="font-bold text-gray-900 text-sm sm:text-lg">آخر الطلبات المعلقة</h2>
          <Link href="/inspector/requests?status=pending" className="text-[10px] sm:text-sm text-primary-600 font-medium">
            عرض الكل
          </Link>
        </div>

        {pendingRequests.length === 0 ? (
          <div className="text-center py-6 sm:py-8 text-gray-400">
            <p className="text-3xl sm:text-4xl mb-2">✨</p>
            <p className="text-sm">لا توجد طلبات معلقة</p>
          </div>
        ) : (
          <>
            {/* Mobile: Cards */}
            <div className="sm:hidden space-y-2.5">
              {pendingRequests.map((req) => (
                <Link key={req.id} href={`/inspector/requests/${req.id}`} className="block">
                  <div className="bg-gray-50 rounded-xl p-3 active:bg-gray-100 transition-colors">
                    <div className="flex items-start justify-between mb-1.5">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">{req.requester_name}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5" dir="ltr">{req.requester_phone}</p>
                      </div>
                      <div className="flex items-center gap-1 mr-2">
                        <Badge className={`${REQUEST_STATUS_COLORS[req.status]} text-[10px]`}>
                          {REQUEST_STATUS_LABELS[req.status]}
                        </Badge>
                        {req.is_urgent === 1 && <Badge className="bg-red-100 text-red-800 text-[10px]">مستعجل</Badge>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-gray-500">
                      <span>{CATEGORY_LABELS[req.category as RequestCategory] || req.category}</span>
                      <span className="text-gray-300">|</span>
                      <span>{req.region || '-'}</span>
                      <span className="text-gray-300">|</span>
                      <span>{new Date(req.created_at).toLocaleDateString('ar-MA')}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Desktop: Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-right py-3 px-2 text-gray-500 font-medium">الاسم</th>
                    <th className="text-right py-3 px-2 text-gray-500 font-medium">الهاتف</th>
                    <th className="text-right py-3 px-2 text-gray-500 font-medium">التصنيف</th>
                    <th className="text-right py-3 px-2 text-gray-500 font-medium">المنطقة</th>
                    <th className="text-right py-3 px-2 text-gray-500 font-medium">الحالة</th>
                    <th className="text-right py-3 px-2 text-gray-500 font-medium">التاريخ</th>
                    <th className="text-right py-3 px-2 text-gray-500 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {pendingRequests.map((req) => (
                    <tr key={req.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="py-3 px-2 font-medium">{req.requester_name}</td>
                      <td className="py-3 px-2 text-gray-600" dir="ltr">{req.requester_phone}</td>
                      <td className="py-3 px-2">{CATEGORY_LABELS[req.category as RequestCategory] || req.category}</td>
                      <td className="py-3 px-2 text-gray-600">{req.region || '-'}</td>
                      <td className="py-3 px-2">
                        <Badge className={REQUEST_STATUS_COLORS[req.status]}>{REQUEST_STATUS_LABELS[req.status]}</Badge>
                        {req.is_urgent === 1 && <Badge className="bg-red-100 text-red-800 mr-1">مستعجل</Badge>}
                      </td>
                      <td className="py-3 px-2 text-gray-500 text-xs">{new Date(req.created_at).toLocaleDateString('ar-MA')}</td>
                      <td className="py-3 px-2">
                        <Link href={`/inspector/requests/${req.id}`} className="text-primary-600 hover:text-primary-700 text-sm font-medium">مراجعة</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Organizations with Active Assignments */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 p-3 sm:p-6">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="font-bold text-gray-900 text-sm sm:text-lg">ما تتكفل به الجمعيات</h2>
          <Link href="/inspector/organizations" className="text-[10px] sm:text-sm text-primary-600 font-medium">
            عرض الكل
          </Link>
        </div>

        {activeOrgs.length === 0 ? (
          <div className="text-center py-6 sm:py-8 text-gray-400">
            <p className="text-3xl sm:text-4xl mb-2">🏢</p>
            <p className="text-sm">لا توجد تكفلات نشطة حالياً</p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {activeOrgs.slice(0, 5).map((org) => (
              <div key={org.id} className="border border-gray-100 rounded-xl p-3 sm:p-4">
                {/* Org header */}
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
                    <span className="text-sm sm:text-lg">🏢</span>
                    <span className="font-bold text-gray-900 text-xs sm:text-base truncate">{org.name}</span>
                    <Badge className="bg-blue-100 text-blue-800 text-[10px] sm:text-xs">{org.active_assignments.length}</Badge>
                  </div>
                  <Badge className="bg-green-50 text-green-700 text-[10px] sm:text-xs flex-shrink-0">
                    {org.total_completed} مكتمل
                  </Badge>
                </div>
                {/* Assignments */}
                <div className="space-y-1.5 sm:space-y-2">
                  {org.active_assignments.slice(0, 3).map((a) => (
                    <div key={a.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-2.5 sm:px-3 py-2 gap-2">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0 overflow-hidden">
                        <Badge className={`${ASSIGNMENT_STATUS_COLORS[a.status as AssignmentStatus]} text-[9px] sm:text-xs flex-shrink-0`}>
                          {ASSIGNMENT_STATUS_LABELS[a.status as AssignmentStatus]}
                        </Badge>
                        <span className="text-gray-700 text-xs sm:text-sm truncate">{a.request.requester_name}</span>
                        {a.request.is_urgent === 1 && <span className="text-red-500 text-[10px] flex-shrink-0">🔴</span>}
                      </div>
                      <Link href={`/inspector/requests/${a.request.id}`} className="text-[10px] sm:text-xs text-primary-600 font-medium flex-shrink-0">
                        عرض
                      </Link>
                    </div>
                  ))}
                  {org.active_assignments.length > 3 && (
                    <Link href="/inspector/organizations" className="text-[10px] sm:text-xs text-gray-400 hover:text-primary-600 block text-center pt-1">
                      +{org.active_assignments.length - 3} تكفل آخر...
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
