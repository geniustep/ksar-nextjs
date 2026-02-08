'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardTitle } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import { inspectorApi } from '@/lib/api';
import { CATEGORY_LABELS, ASSIGNMENT_STATUS_LABELS, ASSIGNMENT_STATUS_COLORS } from '@/lib/constants';
import type { OrganizationWithAssignments, RequestCategory, AssignmentStatus } from '@/lib/types';

export default function InspectorOrganizationsPage() {
  const [organizations, setOrganizations] = useState<OrganizationWithAssignments[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrgs, setExpandedOrgs] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    try {
      const res = await inspectorApi.getOrganizationsWithAssignments();
      setOrganizations(res.items);
    } catch (err) {
      console.error('Failed to load organizations:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (orgId: string) => {
    setExpandedOrgs(prev => {
      const next = new Set(prev);
      if (next.has(orgId)) {
        next.delete(orgId);
      } else {
        next.add(orgId);
      }
      return next;
    });
  };

  const filteredOrgs = organizations.filter(org =>
    !search || org.name.includes(search) || (org.contact_phone && org.contact_phone.includes(search))
  );

  // إحصائيات عامة
  const totalOrgs = organizations.length;
  const totalActiveAssignments = organizations.reduce((sum, o) => sum + o.active_assignments.length, 0);
  const totalCompleted = organizations.reduce((sum, o) => sum + o.total_completed, 0);
  const orgsWithAssignments = organizations.filter(o => o.active_assignments.length > 0).length;

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
        <h1 className="text-2xl font-bold text-neutral-dark">الجمعيات والمؤسسات</h1>
        <p className="text-gray-500 mt-1">متابعة الجمعيات النشطة وما تتكفل به من طلبات</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <div className="text-3xl font-bold text-primary-600">{totalOrgs}</div>
          <div className="text-sm text-gray-500 mt-1">جمعية نشطة</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <div className="text-3xl font-bold text-blue-600">{orgsWithAssignments}</div>
          <div className="text-sm text-gray-500 mt-1">تتكفل حالياً</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <div className="text-3xl font-bold text-orange-600">{totalActiveAssignments}</div>
          <div className="text-sm text-gray-500 mt-1">تكفل نشط</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <div className="text-3xl font-bold text-green-600">{totalCompleted}</div>
          <div className="text-sm text-gray-500 mt-1">تكفل مكتمل</div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="بحث باسم الجمعية أو رقم الهاتف..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
        />
      </div>

      {/* Organizations List */}
      {filteredOrgs.length === 0 ? (
        <Card>
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-2">🏢</p>
            <p>لا توجد جمعيات نشطة</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredOrgs.map((org) => (
            <div key={org.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Organization Header */}
              <button
                onClick={() => toggleExpand(org.id)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center text-xl">
                    🏢
                  </div>
                  <div className="text-right">
                    <h3 className="font-bold text-gray-900 text-base">{org.name}</h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      {org.contact_phone && (
                        <span dir="ltr">{org.contact_phone}</span>
                      )}
                      {org.contact_email && (
                        <span>{org.contact_email}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Badges */}
                  <div className="flex items-center gap-2">
                    {org.active_assignments.length > 0 ? (
                      <Badge className="bg-blue-100 text-blue-800">
                        {org.active_assignments.length} تكفل نشط
                      </Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-500">
                        بدون تكفل
                      </Badge>
                    )}
                    <Badge className="bg-green-50 text-green-700">
                      {org.total_completed} مكتمل
                    </Badge>
                    {org.total_failed > 0 && (
                      <Badge className="bg-red-50 text-red-600">
                        {org.total_failed} فشل
                      </Badge>
                    )}
                  </div>

                  {/* Expand icon */}
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${expandedOrgs.has(org.id) ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {/* Expanded: Organization details + assignments */}
              {expandedOrgs.has(org.id) && (
                <div className="border-t border-gray-100">
                  {/* Org Details */}
                  {org.description && (
                    <div className="px-6 py-3 bg-gray-50/50 text-sm text-gray-600">
                      {org.description}
                    </div>
                  )}

                  {/* Service types & Coverage */}
                  {((org.service_types && org.service_types.length > 0) || (org.coverage_areas && org.coverage_areas.length > 0)) && (
                    <div className="px-6 py-3 bg-gray-50/30 flex flex-wrap gap-4 text-xs">
                      {org.service_types && org.service_types.length > 0 && (
                        <div>
                          <span className="text-gray-500 font-medium">الخدمات: </span>
                          {org.service_types.map((s, i) => (
                            <Badge key={i} className="bg-primary-50 text-primary-700 mr-1">{s}</Badge>
                          ))}
                        </div>
                      )}
                      {org.coverage_areas && org.coverage_areas.length > 0 && (
                        <div>
                          <span className="text-gray-500 font-medium">مناطق التغطية: </span>
                          {org.coverage_areas.map((a, i) => (
                            <Badge key={i} className="bg-orange-50 text-orange-700 mr-1">{a}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Active Assignments */}
                  {org.active_assignments.length === 0 ? (
                    <div className="px-6 py-8 text-center text-gray-400 text-sm">
                      <p>لا يوجد تكفل نشط حالياً لهذه الجمعية</p>
                    </div>
                  ) : (
                    <div className="px-6 py-4">
                      <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                        <span>📋</span>
                        التكفلات النشطة ({org.active_assignments.length})
                      </h4>
                      <div className="space-y-3">
                        {org.active_assignments.map((assignment) => (
                          <div
                            key={assignment.id}
                            className="bg-gray-50 rounded-xl p-4 border border-gray-100"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge className={ASSIGNMENT_STATUS_COLORS[assignment.status as AssignmentStatus]}>
                                    {ASSIGNMENT_STATUS_LABELS[assignment.status as AssignmentStatus]}
                                  </Badge>
                                  <Badge className="bg-purple-50 text-purple-700">
                                    {CATEGORY_LABELS[assignment.request.category as RequestCategory] || assignment.request.category}
                                  </Badge>
                                  {assignment.request.is_urgent === 1 && (
                                    <Badge className="bg-red-100 text-red-800">🔴 مستعجل</Badge>
                                  )}
                                </div>

                                <div className="text-sm text-gray-800 font-medium mb-1">
                                  {assignment.request.requester_name}
                                </div>

                                {assignment.request.description && (
                                  <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                                    {assignment.request.description}
                                  </p>
                                )}

                                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                                  {assignment.request.region && (
                                    <span>📍 {assignment.request.region}</span>
                                  )}
                                  {assignment.request.city && (
                                    <span>🏙️ {assignment.request.city}</span>
                                  )}
                                  <span>👨‍👩‍👧‍👦 {assignment.request.family_members} أفراد</span>
                                  <span>📦 الكمية: {assignment.request.quantity}</span>
                                  <span>⚡ الأولوية: {assignment.request.priority_score}</span>
                                </div>

                                {assignment.notes && (
                                  <div className="mt-2 text-xs text-gray-500 bg-white rounded-lg p-2 border border-gray-100">
                                    <span className="font-medium text-gray-600">ملاحظات الجمعية: </span>
                                    {assignment.notes}
                                  </div>
                                )}
                              </div>

                              <div className="text-left mr-4">
                                <Link
                                  href={`/inspector/requests/${assignment.request.id}`}
                                  className="text-xs bg-primary-50 text-primary-700 hover:bg-primary-100 px-3 py-1.5 rounded-lg font-medium transition-colors inline-block"
                                >
                                  عرض الطلب
                                </Link>
                                {assignment.created_at && (
                                  <div className="text-[10px] text-gray-400 mt-2 text-center">
                                    {new Date(assignment.created_at).toLocaleDateString('ar-MA', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric',
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
