'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
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
      if (next.has(orgId)) next.delete(orgId);
      else next.add(orgId);
      return next;
    });
  };

  const filteredOrgs = organizations.filter(org =>
    !search || org.name.includes(search) || (org.contact_phone && org.contact_phone.includes(search))
  );

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
      <div className="mb-4 sm:mb-6">
        <h1 className="text-lg sm:text-2xl font-bold text-neutral-dark">الجمعيات والمؤسسات</h1>
        <p className="text-gray-500 text-xs sm:text-base mt-0.5">متابعة الجمعيات النشطة وما تتكفل به</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-4 mb-4 sm:mb-8">
        <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-gray-100">
          <div className="text-xl sm:text-3xl font-bold text-primary-600">{totalOrgs}</div>
          <div className="text-[10px] sm:text-sm text-gray-500 mt-0.5">جمعية نشطة</div>
        </div>
        <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-gray-100">
          <div className="text-xl sm:text-3xl font-bold text-blue-600">{orgsWithAssignments}</div>
          <div className="text-[10px] sm:text-sm text-gray-500 mt-0.5">تتكفل حالياً</div>
        </div>
        <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-gray-100">
          <div className="text-xl sm:text-3xl font-bold text-orange-600">{totalActiveAssignments}</div>
          <div className="text-[10px] sm:text-sm text-gray-500 mt-0.5">تكفل نشط</div>
        </div>
        <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-gray-100">
          <div className="text-xl sm:text-3xl font-bold text-green-600">{totalCompleted}</div>
          <div className="text-[10px] sm:text-sm text-gray-500 mt-0.5">تكفل مكتمل</div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4 sm:mb-6">
        <input
          type="text"
          placeholder="بحث باسم الجمعية أو رقم الهاتف..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:max-w-md rounded-xl border border-gray-200 px-3 sm:px-4 py-2 sm:py-2.5 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
        />
      </div>

      {/* Organizations List */}
      {filteredOrgs.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 text-center py-10 text-gray-400">
          <p className="text-3xl mb-2">🏢</p>
          <p className="text-sm">لا توجد جمعيات نشطة</p>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {filteredOrgs.map((org) => (
            <div key={org.id} className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 overflow-hidden">
              {/* Organization Header */}
              <button
                onClick={() => toggleExpand(org.id)}
                className="w-full px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
              >
                <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                  <div className="w-9 h-9 sm:w-12 sm:h-12 bg-primary-50 rounded-lg sm:rounded-xl flex items-center justify-center text-base sm:text-xl flex-shrink-0">
                    🏢
                  </div>
                  <div className="text-right min-w-0">
                    <h3 className="font-bold text-gray-900 text-xs sm:text-base truncate">{org.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] sm:text-xs text-gray-500">
                      {org.contact_phone && <span dir="ltr">{org.contact_phone}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0 mr-2">
                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-2">
                    {org.active_assignments.length > 0 ? (
                      <Badge className="bg-blue-100 text-blue-800 text-[9px] sm:text-xs">
                        {org.active_assignments.length} نشط
                      </Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-500 text-[9px] sm:text-xs">بدون</Badge>
                    )}
                    <Badge className="bg-green-50 text-green-700 text-[9px] sm:text-xs">
                      {org.total_completed} مكتمل
                    </Badge>
                  </div>
                  <svg
                    className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-400 transition-transform ${expandedOrgs.has(org.id) ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {/* Expanded Details */}
              {expandedOrgs.has(org.id) && (
                <div className="border-t border-gray-100">
                  {org.description && (
                    <div className="px-3 sm:px-6 py-2 sm:py-3 bg-gray-50/50 text-xs sm:text-sm text-gray-600">
                      {org.description}
                    </div>
                  )}

                  {/* Service types & Coverage */}
                  {((org.service_types && org.service_types.length > 0) || (org.coverage_areas && org.coverage_areas.length > 0)) && (
                    <div className="px-3 sm:px-6 py-2 sm:py-3 bg-gray-50/30 space-y-1.5 sm:space-y-0 sm:flex sm:flex-wrap sm:gap-4 text-[10px] sm:text-xs">
                      {org.service_types && org.service_types.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1">
                          <span className="text-gray-500 font-medium">الخدمات:</span>
                          {org.service_types.map((s, i) => (
                            <Badge key={i} className="bg-primary-50 text-primary-700 text-[9px] sm:text-xs">{s}</Badge>
                          ))}
                        </div>
                      )}
                      {org.coverage_areas && org.coverage_areas.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1">
                          <span className="text-gray-500 font-medium">التغطية:</span>
                          {org.coverage_areas.map((a, i) => (
                            <Badge key={i} className="bg-orange-50 text-orange-700 text-[9px] sm:text-xs">{a}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Active Assignments */}
                  {org.active_assignments.length === 0 ? (
                    <div className="px-3 sm:px-6 py-6 text-center text-gray-400 text-xs sm:text-sm">
                      لا يوجد تكفل نشط حالياً
                    </div>
                  ) : (
                    <div className="px-3 sm:px-6 py-3 sm:py-4">
                      <h4 className="text-xs sm:text-sm font-bold text-gray-700 mb-2 sm:mb-3 flex items-center gap-1.5">
                        <span>📋</span>
                        التكفلات ({org.active_assignments.length})
                      </h4>
                      <div className="space-y-2 sm:space-y-3">
                        {org.active_assignments.map((assignment) => (
                          <div key={assignment.id} className="bg-gray-50 rounded-lg sm:rounded-xl p-2.5 sm:p-4 border border-gray-100">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                                  <Badge className={`${ASSIGNMENT_STATUS_COLORS[assignment.status as AssignmentStatus]} text-[9px] sm:text-xs`}>
                                    {ASSIGNMENT_STATUS_LABELS[assignment.status as AssignmentStatus]}
                                  </Badge>
                                  <span className="text-[10px] sm:text-xs text-gray-500">
                                    {CATEGORY_LABELS[assignment.request.category as RequestCategory] || assignment.request.category}
                                  </span>
                                  {assignment.request.is_urgent === 1 && (
                                    <span className="text-red-500 text-[10px]">🔴</span>
                                  )}
                                </div>
                                <p className="text-xs sm:text-sm text-gray-800 font-medium truncate">{assignment.request.requester_name}</p>
                                {assignment.request.description && (
                                  <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 line-clamp-1">{assignment.request.description}</p>
                                )}
                                <div className="flex flex-wrap items-center gap-1.5 sm:gap-3 text-[10px] sm:text-xs text-gray-500 mt-1">
                                  {assignment.request.region && <span>📍 {assignment.request.region}</span>}
                                  <span>👨‍👩‍👧‍👦 {assignment.request.family_members}</span>
                                </div>
                              </div>
                              <Link
                                href={`/inspector/requests/${assignment.request.id}`}
                                className="text-[10px] sm:text-xs bg-primary-50 text-primary-700 hover:bg-primary-100 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg font-medium flex-shrink-0"
                              >
                                عرض
                              </Link>
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
