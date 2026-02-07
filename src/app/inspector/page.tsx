'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import StatsCard from '@/components/ui/StatsCard';
import { Card, CardTitle } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import { inspectorApi } from '@/lib/api';
import { REQUEST_STATUS_LABELS, REQUEST_STATUS_COLORS, CATEGORY_LABELS } from '@/lib/constants';
import type { InspectorStats, RequestResponse, RequestCategory } from '@/lib/types';

export default function InspectorDashboard() {
  const [stats, setStats] = useState<InspectorStats | null>(null);
  const [pendingRequests, setPendingRequests] = useState<RequestResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, requestsRes] = await Promise.all([
        inspectorApi.getStats(),
        inspectorApi.getRequests({ status: 'pending', limit: 10 }),
      ]);
      setStats(statsRes);
      setPendingRequests(requestsRes.items);
    } catch (err) {
      console.error('Failed to load data:', err);
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
    </DashboardLayout>
  );
}
