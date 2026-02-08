'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { Card } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import { inspectorApi } from '@/lib/api';
import type { OrgPledgesStatsItem } from '@/lib/types';

export default function InspectorPledgesPage() {
  const [orgs, setOrgs] = useState<OrgPledgesStatsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await inspectorApi.getOrganizationsPledgesStats();
      setOrgs(res.data);
    } catch (err) {
      console.error('Failed to load org pledges stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalPledges = orgs.reduce((sum, o) => sum + o.total_assignments, 0);
  const totalCompleted = orgs.reduce((sum, o) => sum + o.completed, 0);

  return (
    <DashboardLayout>
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-neutral-dark">تعهدات الجمعيات</h1>
        <p className="text-gray-500 text-sm mt-1">
          إحصائيات التعهدات لكل جمعية وتفاصيل الطلبات المرتبطة
        </p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-primary-600">{orgs.length}</p>
          <p className="text-xs text-gray-500">جمعية</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{totalPledges}</p>
          <p className="text-xs text-gray-500">إجمالي التعهدات</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{totalCompleted}</p>
          <p className="text-xs text-gray-500">مكتمل</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : orgs.length === 0 ? (
        <Card>
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-2">🏢</p>
            <p>لا توجد تعهدات بعد</p>
          </div>
        </Card>
      ) : (
        <>
          {/* Mobile: Cards */}
          <div className="sm:hidden space-y-3">
            {orgs.map((org) => (
              <Link key={org.id} href={`/inspector/pledges/${org.id}`} className="block">
                <div className="bg-white rounded-xl border border-gray-200 p-4 active:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-gray-900">{org.name}</p>
                    <Badge className="bg-blue-100 text-blue-800">{org.total_assignments} تعهد</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
                    <span className="text-blue-600">{org.pledged} معلق</span>
                    <span className="text-orange-600">{org.in_progress} قيد التنفيذ</span>
                    <span className="text-green-600">{org.completed} مكتمل</span>
                    {org.failed > 0 && <span className="text-red-600">{org.failed} فشل</span>}
                  </div>
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-green-500 h-1.5 rounded-full transition-all"
                        style={{ width: org.total_assignments > 0 ? `${(org.completed / org.total_assignments) * 100}%` : '0%' }}
                      />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Desktop: Table */}
          <Card className="hidden sm:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-right py-3 px-4 text-gray-500 font-medium">الجمعية</th>
                    <th className="text-center py-3 px-3 text-gray-500 font-medium">إجمالي</th>
                    <th className="text-center py-3 px-3 text-gray-500 font-medium">تعهد</th>
                    <th className="text-center py-3 px-3 text-gray-500 font-medium">قيد التنفيذ</th>
                    <th className="text-center py-3 px-3 text-gray-500 font-medium">مكتمل</th>
                    <th className="text-center py-3 px-3 text-gray-500 font-medium">فشل</th>
                    <th className="text-center py-3 px-3 text-gray-500 font-medium">نسبة الإنجاز</th>
                    <th className="text-center py-3 px-3 text-gray-500 font-medium">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {orgs.map((org) => (
                    <tr key={org.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="py-3 px-4 font-medium">{org.name}</td>
                      <td className="py-3 px-3 text-center font-medium">{org.total_assignments}</td>
                      <td className="py-3 px-3 text-center"><Badge className="bg-blue-100 text-blue-800">{org.pledged}</Badge></td>
                      <td className="py-3 px-3 text-center"><Badge className="bg-orange-100 text-orange-800">{org.in_progress}</Badge></td>
                      <td className="py-3 px-3 text-center"><Badge className="bg-green-100 text-green-800">{org.completed}</Badge></td>
                      <td className="py-3 px-3 text-center">
                        {org.failed > 0 ? <Badge className="bg-red-100 text-red-800">{org.failed}</Badge> : <span className="text-gray-300">-</span>}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center gap-2 justify-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full transition-all"
                              style={{ width: org.total_assignments > 0 ? `${(org.completed / org.total_assignments) * 100}%` : '0%' }}
                            />
                          </div>
                          <span className="text-xs text-gray-600 font-medium">
                            {org.total_assignments > 0 ? Math.round((org.completed / org.total_assignments) * 100) : 0}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <Link href={`/inspector/pledges/${org.id}`} className="text-xs bg-primary-50 text-primary-700 hover:bg-primary-100 px-3 py-1.5 rounded-lg transition-colors">
                          التفاصيل
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </DashboardLayout>
  );
}
