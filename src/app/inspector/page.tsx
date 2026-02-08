'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import StatsCard from '@/components/ui/StatsCard';
import { Card, CardTitle } from '@/components/ui/Card';
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

  // الجمعيات التي لديها تكفلات نشطة
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-dark">لوحة تحكم المراقب</h1>
        <p className="text-gray-500 mt-1">مراجعة الطلبات وتفعيلها أو ربطها بالجمعيات</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCard
            title="طلبات معلقة"
            value={stats.pending_count}
            icon={<span>⏳</span>}
            color="text-purple-600"
          />
          <StatsCard
            title="طلبات مفعّلة"
            value={stats.activated_count}
            icon={<span>✅</span>}
            color="text-green-600"
          />
          <StatsCard
            title="طلبات مرفوضة"
            value={stats.rejected_count}
            icon={<span>❌</span>}
            color="text-red-600"
          />
          <StatsCard
            title="مربوطة بجمعيات"
            value={stats.assigned_count}
            icon={<span>🏢</span>}
            color="text-blue-600"
          />
        </div>
      )}

      {/* Pending Requests */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <CardTitle>آخر الطلبات المعلقة</CardTitle>
          <Link
            href="/inspector/requests?status=pending"
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            عرض الكل
          </Link>
        </div>

        {pendingRequests.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p className="text-4xl mb-2">✨</p>
            <p>لا توجد طلبات معلقة</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
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
                    <td className="py-3 px-2">
                      {CATEGORY_LABELS[req.category as RequestCategory] || req.category}
                    </td>
                    <td className="py-3 px-2 text-gray-600">{req.region || '-'}</td>
                    <td className="py-3 px-2">
                      <Badge className={REQUEST_STATUS_COLORS[req.status]}>
                        {REQUEST_STATUS_LABELS[req.status]}
                      </Badge>
                      {req.is_urgent === 1 && (
                        <Badge className="bg-red-100 text-red-800 mr-1">مستعجل</Badge>
                      )}
                    </td>
                    <td className="py-3 px-2 text-gray-500 text-xs">
                      {new Date(req.created_at).toLocaleDateString('ar-MA')}
                    </td>
                    <td className="py-3 px-2">
                      <Link
                        href={`/inspector/requests/${req.id}`}
                        className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                      >
                        مراجعة
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Organizations with Active Assignments */}
      <Card className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <CardTitle>ما تتكفل به الجمعيات</CardTitle>
          <Link
            href="/inspector/organizations"
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            عرض الكل
          </Link>
        </div>

        {activeOrgs.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p className="text-4xl mb-2">🏢</p>
            <p>لا توجد تكفلات نشطة حالياً</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeOrgs.slice(0, 5).map((org) => (
              <div key={org.id} className="border border-gray-100 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🏢</span>
                    <span className="font-bold text-gray-900">{org.name}</span>
                    <Badge className="bg-blue-100 text-blue-800 text-xs">
                      {org.active_assignments.length} تكفل
                    </Badge>
                  </div>
                  <Badge className="bg-green-50 text-green-700 text-xs">
                    {org.total_completed} مكتمل
                  </Badge>
                </div>
                <div className="space-y-2">
                  {org.active_assignments.slice(0, 3).map((a) => (
                    <div key={a.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Badge className={ASSIGNMENT_STATUS_COLORS[a.status as AssignmentStatus] + ' text-xs'}>
                          {ASSIGNMENT_STATUS_LABELS[a.status as AssignmentStatus]}
                        </Badge>
                        <span className="text-gray-700">{a.request.requester_name}</span>
                        <span className="text-gray-400 text-xs">
                          ({CATEGORY_LABELS[a.request.category as RequestCategory] || a.request.category})
                        </span>
                        {a.request.is_urgent === 1 && (
                          <span className="text-red-500 text-xs font-bold">🔴</span>
                        )}
                      </div>
                      <Link
                        href={`/inspector/requests/${a.request.id}`}
                        className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                      >
                        عرض
                      </Link>
                    </div>
                  ))}
                  {org.active_assignments.length > 3 && (
                    <Link
                      href="/inspector/organizations"
                      className="text-xs text-gray-400 hover:text-primary-600 block text-center pt-1"
                    >
                      +{org.active_assignments.length - 3} تكفل آخر...
                    </Link>
                  )}
                </div>
              </div>
            ))}
            {activeOrgs.length > 5 && (
              <Link
                href="/inspector/organizations"
                className="text-sm text-primary-600 hover:text-primary-700 font-medium block text-center py-2"
              >
                عرض جميع الجمعيات ({organizations.length})
              </Link>
            )}
          </div>
        )}
      </Card>
    </DashboardLayout>
  );
}
