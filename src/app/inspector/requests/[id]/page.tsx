'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardTitle } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Spinner from '@/components/ui/Spinner';
import Textarea from '@/components/ui/Textarea';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import { inspectorApi, ApiError } from '@/lib/api';
import {
  REQUEST_STATUS_LABELS,
  REQUEST_STATUS_COLORS,
  CATEGORY_LABELS,
  CATEGORY_ICONS,
  ALL_REQUEST_STATUSES,
  ALL_CATEGORIES,
} from '@/lib/constants';
import type { InspectorRequestResponse, OrganizationBrief, RequestCategory, RequestStatus, RequestPledgesResponse, RequestResponse } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';

export default function InspectorRequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const requestId = params.id as string;

  const [request, setRequest] = useState<InspectorRequestResponse | null>(null);
  const [organizations, setOrganizations] = useState<OrganizationBrief[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [phoneRequestCount, setPhoneRequestCount] = useState<number | null>(null);
  const [phoneRequests, setPhoneRequests] = useState<RequestResponse[]>([]);
  const [showPhoneRequests, setShowPhoneRequests] = useState(false);
  const [phoneRequestsLoading, setPhoneRequestsLoading] = useState(false);

  const [pledgesData, setPledgesData] = useState<RequestPledgesResponse | null>(null);
  const [showApproveForm, setShowApproveForm] = useState<string | null>(null);
  const [approveShowPhone, setApproveShowPhone] = useState(false);
  const [approveContactName, setApproveContactName] = useState('');
  const [approveContactPhone, setApproveContactPhone] = useState('');

  const [inspectorNotes, setInspectorNotes] = useState('');
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [assignNotes, setAssignNotes] = useState('');
  const [allowPhoneAccess, setAllowPhoneAccess] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  const [showFlagForm, setShowFlagForm] = useState(false);
  const [flagReason, setFlagReason] = useState('');

  // Activate modal
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [activateIsUrgent, setActivateIsUrgent] = useState(false);
  const [activatePriority, setActivatePriority] = useState<string>('');

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    requester_name: '',
    requester_phone: '',
    category: '' as RequestCategory | '',
    description: '',
    quantity: 1,
    family_members: 1,
    address: '',
    city: '',
    region: '',
  });
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [requestId]);

  const loadData = async () => {
    try {
      const [reqRes, orgsRes] = await Promise.all([
        inspectorApi.getRequest(requestId),
        inspectorApi.getOrganizations(),
      ]);
      setRequest(reqRes);
      setOrganizations(orgsRes.items);
      setInspectorNotes(reqRes.inspector_notes || '');
      setNewStatus(reqRes.status);

      setEditForm({
        requester_name: reqRes.requester_name || '',
        requester_phone: reqRes.requester_phone || '',
        category: reqRes.category as RequestCategory || '',
        description: reqRes.description || '',
        quantity: reqRes.quantity || 1,
        family_members: reqRes.family_members || 1,
        address: reqRes.address || '',
        city: reqRes.city || '',
        region: reqRes.region || '',
      });

      try {
        const pledges = await inspectorApi.getRequestPledges(requestId);
        setPledgesData(pledges);
      } catch { /* Silently handle */ }

      if (reqRes.requester_phone) {
        try {
          const countRes = await inspectorApi.getPhoneRequestCount(reqRes.requester_phone);
          setPhoneRequestCount(countRes.count);
        } catch { /* Silently handle */ }
      }
    } catch (err) {
      console.error('Failed to load request:', err);
      setError('فشل في تحميل بيانات الطلب');
    } finally {
      setLoading(false);
    }
  };

  const loadPhoneRequests = async () => {
    if (!request?.requester_phone) return;
    setPhoneRequestsLoading(true);
    try {
      const res = await inspectorApi.getRequests({
        search: request.requester_phone,
        limit: 50,
      });
      // Exclude the current request
      setPhoneRequests(res.items.filter((r) => r.id !== requestId));
    } catch {
      // Silently handle
    } finally {
      setPhoneRequestsLoading(false);
    }
  };

  const togglePhoneRequests = () => {
    if (!showPhoneRequests && phoneRequests.length === 0) {
      loadPhoneRequests();
    }
    setShowPhoneRequests(!showPhoneRequests);
  };

  const openActivateModal = () => {
    setActivateIsUrgent(false);
    setActivatePriority(request?.priority_score ? String(request.priority_score) : '');
    setShowActivateModal(true);
  };

  const confirmActivate = async () => {
    if (!activateIsUrgent && !activatePriority) {
      setError('يرجى تحديد الأولوية أو تفعيل الاستعجال');
      return;
    }
    const priorityNum = activateIsUrgent ? undefined : parseInt(activatePriority);
    if (!activateIsUrgent && (isNaN(priorityNum!) || priorityNum! < 0 || priorityNum! > 100)) {
      setError('الأولوية يجب أن تكون بين 0 و 100');
      return;
    }
    setActionLoading(true); setError(''); setSuccess('');
    try {
      await inspectorApi.activateRequest(requestId, {
        is_urgent: activateIsUrgent,
        priority_score: activateIsUrgent ? undefined : priorityNum,
        inspector_notes: inspectorNotes || undefined,
      });
      setShowActivateModal(false);
      setSuccess('تم تفعيل الطلب بنجاح');
      await loadData();
    } catch (err) {
      if (err instanceof ApiError) setError(err.detail); else setError('خطأ غير متوقع');
    } finally { setActionLoading(false); }
  };

  const handleReject = async () => {
    setActionLoading(true); setError(''); setSuccess('');
    try {
      await inspectorApi.rejectRequest(requestId, rejectReason || undefined);
      setSuccess('تم رفض الطلب'); setShowRejectForm(false); await loadData();
    } catch (err) {
      if (err instanceof ApiError) setError(err.detail); else setError('خطأ غير متوقع');
    } finally { setActionLoading(false); }
  };

  const handleAssign = async () => {
    if (!selectedOrgId) { setError('يرجى اختيار جمعية'); return; }
    setActionLoading(true); setError(''); setSuccess('');
    try {
      await inspectorApi.assignRequest(requestId, { organization_id: selectedOrgId, notes: assignNotes || undefined });
      setSuccess('تم ربط الطلب بالجمعية'); setShowAssignForm(false); await loadData();
    } catch (err) {
      if (err instanceof ApiError) setError(err.detail); else setError('خطأ غير متوقع');
    } finally { setActionLoading(false); }
  };

  const handleApproveOrg = async (assignmentId: string) => {
    setActionLoading(true); setError(''); setSuccess('');
    try {
      const result = await inspectorApi.approveOrgForRequest(requestId, {
        assignment_id: assignmentId, show_citizen_phone: approveShowPhone,
        contact_name: approveContactName.trim() || undefined, contact_phone: approveContactPhone.trim() || undefined,
      });
      setSuccess(result.message);
      setShowApproveForm(null); setApproveShowPhone(false); setApproveContactName(''); setApproveContactPhone('');
      await loadData();
    } catch (err) {
      if (err instanceof ApiError) setError(err.detail); else setError('خطأ غير متوقع');
    } finally { setActionLoading(false); }
  };

  const handleStatusChange = async () => {
    if (!newStatus || newStatus === request?.status) return;
    setActionLoading(true); setError(''); setSuccess('');
    try {
      await inspectorApi.updateRequestStatus(requestId, { status: newStatus as RequestStatus });
      setSuccess('تم تغيير حالة الطلب'); await loadData();
    } catch (err) {
      if (err instanceof ApiError) setError(err.detail); else setError('خطأ غير متوقع');
    } finally { setActionLoading(false); }
  };

  const handleUrgencyToggle = async () => {
    setActionLoading(true); setError(''); setSuccess('');
    try {
      const toggledUrgency = request?.is_urgent === 1 ? 0 : 1;
      await inspectorApi.updateRequestStatus(requestId, { is_urgent: toggledUrgency });
      setSuccess(toggledUrgency === 1 ? 'تم تعيين الطلب كمستعجل' : 'تم إزالة الاستعجال');
      await loadData();
    } catch (err) {
      if (err instanceof ApiError) setError(err.detail); else setError('خطأ غير متوقع');
    } finally { setActionLoading(false); }
  };

  const handleSaveNotes = async () => {
    setActionLoading(true); setError('');
    try {
      await inspectorApi.updateRequestNotes(requestId, { inspector_notes: inspectorNotes });
      setSuccess('تم حفظ الملاحظات');
    } catch (err) {
      if (err instanceof ApiError) setError(err.detail);
    } finally { setActionLoading(false); }
  };

  const handleSaveEdit = async () => {
    setEditLoading(true); setError(''); setSuccess('');
    try {
      const updateData: Record<string, unknown> = {};
      if (editForm.requester_name !== request?.requester_name) updateData.requester_name = editForm.requester_name;
      if (editForm.requester_phone !== request?.requester_phone) updateData.requester_phone = editForm.requester_phone;
      if (editForm.category && editForm.category !== request?.category) updateData.category = editForm.category;
      if (editForm.description !== (request?.description || '')) updateData.description = editForm.description;
      if (editForm.quantity !== request?.quantity) updateData.quantity = editForm.quantity;
      if (editForm.family_members !== request?.family_members) updateData.family_members = editForm.family_members;
      if (editForm.address !== (request?.address || '')) updateData.address = editForm.address;
      if (editForm.city !== (request?.city || '')) updateData.city = editForm.city;
      if (editForm.region !== (request?.region || '')) updateData.region = editForm.region;

      if (Object.keys(updateData).length === 0) { setError('لم يتم إجراء أي تغيير'); setEditLoading(false); return; }

      await inspectorApi.editRequestData(requestId, updateData);
      setSuccess('تم تحديث بيانات الطلب'); setIsEditing(false); await loadData();
    } catch (err) {
      if (err instanceof ApiError) setError(err.detail); else setError('خطأ غير متوقع');
    } finally { setEditLoading(false); }
  };

  const handleCancelEdit = () => {
    if (request) {
      setEditForm({
        requester_name: request.requester_name || '', requester_phone: request.requester_phone || '',
        category: request.category as RequestCategory || '', description: request.description || '',
        quantity: request.quantity || 1, family_members: request.family_members || 1,
        address: request.address || '', city: request.city || '', region: request.region || '',
      });
    }
    setIsEditing(false);
  };

  const handleClaim = async () => {
    setActionLoading(true); setError(''); setSuccess('');
    try {
      const res = await inspectorApi.claimRequest(requestId);
      setSuccess(res.message);
      await loadData();
    } catch (err) {
      if (err instanceof ApiError) setError(err.detail); else setError('خطأ غير متوقع');
    } finally { setActionLoading(false); }
  };

  const handleUnclaim = async () => {
    setActionLoading(true); setError(''); setSuccess('');
    try {
      const res = await inspectorApi.unclaimRequest(requestId);
      setSuccess(res.message);
      await loadData();
    } catch (err) {
      if (err instanceof ApiError) setError(err.detail); else setError('خطأ غير متوقع');
    } finally { setActionLoading(false); }
  };

  const handleFlag = async () => {
    if (!flagReason.trim()) { setError('يرجى إدخال سبب التنبيه'); return; }
    setActionLoading(true); setError(''); setSuccess('');
    try {
      const res = await inspectorApi.flagRequest(requestId, flagReason.trim());
      setSuccess(res.message);
      setShowFlagForm(false); setFlagReason('');
      await loadData();
    } catch (err) {
      if (err instanceof ApiError) setError(err.detail); else setError('خطأ غير متوقع');
    } finally { setActionLoading(false); }
  };

  const handleUnflag = async () => {
    setActionLoading(true); setError(''); setSuccess('');
    try {
      const res = await inspectorApi.unflagRequest(requestId);
      setSuccess(res.message);
      await loadData();
    } catch (err) {
      if (err instanceof ApiError) setError(err.detail); else setError('خطأ غير متوقع');
    } finally { setActionLoading(false); }
  };

  const handleDelete = async () => {
    if (!confirm('هل أنت متأكد من حذف هذا الطلب؟')) return;
    setActionLoading(true); setError('');
    try {
      await inspectorApi.deleteRequest(requestId);
      router.push('/inspector/requests');
    } catch (err) {
      if (err instanceof ApiError) setError(err.detail); else setError('خطأ غير متوقع');
      setActionLoading(false);
    }
  };

  const parseImages = (imagesStr: string | null): string[] => {
    if (!imagesStr) return [];
    try { return JSON.parse(imagesStr); } catch { return []; }
  };

  if (loading) {
    return (<DashboardLayout><div className="flex justify-center py-12"><Spinner /></div></DashboardLayout>);
  }

  if (!request) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">الطلب غير موجود</p>
          <Button variant="ghost" onClick={() => router.push('/inspector/requests')} className="mt-4">العودة للقائمة</Button>
        </div>
      </DashboardLayout>
    );
  }

  const images = parseImages(request.images);
  const canActivate = request.status === 'pending';
  const canReject = request.status === 'pending';
  const canAssign = request.status === 'pending' || request.status === 'new';
  const canDelete = request.status === 'pending' || request.status === 'new' || request.status === 'rejected' || request.status === 'cancelled';
  const isSupervisor = request.inspector_id === user?.id;
  const canClaim = !request.inspector_id;
  const canUnclaim = isSupervisor;
  const isFlagged = request.is_flagged === 1;

  return (
    <DashboardLayout>
      {/* Header - responsive */}
      <div className="mb-4 sm:mb-6">
        <button
          onClick={() => router.back()}
          className="text-xs sm:text-sm text-gray-500 hover:text-gray-700 mb-2 flex items-center gap-1"
        >
          <span>&larr;</span> العودة
        </button>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h1 className="text-lg sm:text-2xl font-bold text-neutral-dark">تفاصيل الطلب</h1>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {isFlagged && (
              <Badge className="bg-orange-100 text-orange-800 text-[10px] sm:text-xs animate-pulse">⚠️ تنبيه</Badge>
            )}
            {isSupervisor && (
              <Badge className="bg-indigo-100 text-indigo-800 text-[10px] sm:text-xs">المراقب المسؤول</Badge>
            )}
            <Badge className={`${REQUEST_STATUS_COLORS[request.status]} text-xs sm:text-base px-2.5 sm:px-4 py-0.5 sm:py-1`}>
              {REQUEST_STATUS_LABELS[request.status]}
            </Badge>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-danger-500/5 border border-danger-500/20 text-danger-500 text-xs sm:text-sm p-3 rounded-xl mb-4">{error}</div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-xs sm:text-sm p-3 rounded-xl mb-4">{success}</div>
      )}

      {/* Mobile: Claim section at top */}
      <div className="lg:hidden mb-4">
        {canClaim ? (
          <Button className="w-full text-xs bg-indigo-600 hover:bg-indigo-700" onClick={handleClaim} loading={actionLoading}>
            🔒 تكلف بهذا الطلب
          </Button>
        ) : isSupervisor ? (
          <div className="flex items-center gap-2 p-2.5 bg-indigo-50 border border-indigo-200 rounded-xl">
            <span className="text-indigo-600 font-bold text-sm">✓</span>
            <span className="text-xs text-indigo-800 font-medium flex-1">أنت مكلف بهذا الطلب</span>
            <button
              onClick={handleUnclaim}
              disabled={actionLoading}
              className="text-[10px] text-red-500 hover:text-red-700 disabled:opacity-50"
            >
              إلغاء التكلف
            </button>
          </div>
        ) : request.inspector_id ? (
          <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-xs text-amber-800">
              <span className="font-medium">مكلف به:</span>{' '}
              {`#${request.inspector_id?.slice(0, 8)}`}
            </p>
          </div>
        ) : null}
      </div>

      {/* Previous requests for same phone */}
      {phoneRequestCount !== null && phoneRequestCount > 1 && (
        <div className="mb-4">
          <button
            onClick={togglePhoneRequests}
            className={`w-full flex items-center justify-between p-3 rounded-xl border transition-colors ${
              showPhoneRequests
                ? 'bg-blue-50 border-blue-200 text-blue-800'
                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">📋</span>
              <span className="text-xs sm:text-sm font-medium">طلبات سابقة لنفس الرقم</span>
              <Badge className="bg-blue-100 text-blue-700 text-[10px] sm:text-xs">{phoneRequestCount - 1}</Badge>
            </div>
            <svg className={`w-4 h-4 transition-transform ${showPhoneRequests ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showPhoneRequests && (
            <div className="mt-2 space-y-2">
              {phoneRequestsLoading ? (
                <div className="flex justify-center py-4">
                  <Spinner />
                </div>
              ) : phoneRequests.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-3">لا توجد طلبات أخرى</p>
              ) : (
                phoneRequests.map((r) => (
                  <Link key={r.id} href={`/inspector/requests/${r.id}`} className="block">
                    <div className="bg-white rounded-xl border border-gray-100 p-3 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-gray-800">{CATEGORY_LABELS[r.category as RequestCategory] || r.category}</span>
                            <Badge className={`${REQUEST_STATUS_COLORS[r.status]} text-[10px]`}>{REQUEST_STATUS_LABELS[r.status]}</Badge>
                            {r.is_urgent === 1 && <Badge className="bg-red-100 text-red-800 text-[10px]">مستعجل</Badge>}
                          </div>
                          {r.description && (
                            <p className="text-[10px] sm:text-xs text-gray-500 truncate">{r.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400">
                            <span>{r.city || '-'}{r.region ? ` - ${r.region}` : ''}</span>
                            <span className="text-gray-300">|</span>
                            <span>{new Date(r.created_at).toLocaleDateString('ar-MA')}</span>
                            {r.priority_score > 0 && (
                              <>
                                <span className="text-gray-300">|</span>
                                <span className="text-primary-600">أولوية: {r.priority_score}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <span className="text-gray-300 text-xs mr-2">&larr;</span>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Request Info */}
          <Card>
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <CardTitle>معلومات الطلب</CardTitle>
              {!isEditing ? (
                <button onClick={() => setIsEditing(true)} className="text-xs sm:text-sm text-primary-600 font-medium flex items-center gap-1">
                  <span>✏️</span> تحرير
                </button>
              ) : (
                <div className="flex gap-1.5 sm:gap-2">
                  <Button size="sm" onClick={handleSaveEdit} loading={editLoading}>حفظ</Button>
                  <Button size="sm" variant="ghost" onClick={handleCancelEdit} disabled={editLoading}>إلغاء</Button>
                </div>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-3 sm:space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <Input label="صاحب الطلب" value={editForm.requester_name} onChange={(e) => setEditForm({ ...editForm, requester_name: e.target.value })} required />
                  <Input label="رقم الهاتف" value={editForm.requester_phone} onChange={(e) => setEditForm({ ...editForm, requester_phone: e.target.value })} dir="ltr" required />
                </div>
                <Select label="التصنيف" value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value as RequestCategory })} options={ALL_CATEGORIES.map((c) => ({ value: c, label: CATEGORY_LABELS[c] }))} />
                <Textarea label="الوصف" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={3} />
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <Input label="الكمية" type="number" value={String(editForm.quantity)} onChange={(e) => setEditForm({ ...editForm, quantity: parseInt(e.target.value) || 1 })} min={1} />
                  <Input label="أفراد الأسرة" type="number" value={String(editForm.family_members)} onChange={(e) => setEditForm({ ...editForm, family_members: parseInt(e.target.value) || 1 })} min={1} />
                </div>
                <Input label="العنوان" value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} />
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <Input label="المدينة" value={editForm.city} onChange={(e) => setEditForm({ ...editForm, city: e.target.value })} />
                  <Input label="المنطقة" value={editForm.region} onChange={(e) => setEditForm({ ...editForm, region: e.target.value })} />
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-3 sm:mt-4">
                  <div>
                    <p className="text-[10px] sm:text-xs text-gray-400 mb-0.5">صاحب الطلب</p>
                    <p className="font-medium text-sm sm:text-base">{request.requester_name}</p>
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-xs text-gray-400 mb-0.5">رقم الهاتف</p>
                    <div className="flex items-center gap-1.5">
                      <p className="font-medium text-sm sm:text-base" dir="ltr">{request.requester_phone}</p>
                      {phoneRequestCount !== null && (
                        <Badge className={`${phoneRequestCount > 3 ? 'bg-orange-100 text-orange-800' : phoneRequestCount > 1 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'} text-[10px] sm:text-xs`}>
                          {phoneRequestCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-xs text-gray-400 mb-0.5">التصنيف</p>
                    <p className="font-medium text-sm sm:text-base">
                      {CATEGORY_ICONS[request.category as RequestCategory]} {CATEGORY_LABELS[request.category as RequestCategory] || request.category}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-xs text-gray-400 mb-0.5">أفراد الأسرة</p>
                    <p className="font-medium text-sm sm:text-base">{request.family_members}</p>
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-xs text-gray-400 mb-0.5">الكمية</p>
                    <p className="font-medium text-sm sm:text-base">{request.quantity}</p>
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-xs text-gray-400 mb-0.5">الأولوية</p>
                    <p className="font-medium text-sm sm:text-base">{request.priority_score}/100</p>
                  </div>
                  {request.is_urgent === 1 && (
                    <div className="col-span-2">
                      <Badge className="bg-red-100 text-red-800 text-xs">مستعجل</Badge>
                    </div>
                  )}
                </div>
                {request.inspector_id && (
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
                    <span className="text-[10px] sm:text-xs text-gray-400">المراقب:</span>
                    <Badge className="bg-indigo-50 text-indigo-700 text-[10px] sm:text-xs">
                      {isSupervisor ? 'أنت' : `#${request.inspector_id.slice(0, 8)}`}
                    </Badge>
                  </div>
                )}
              </>
            )}
          </Card>

          {/* Description */}
          {!isEditing && request.description && (
            <Card>
              <CardTitle>الوصف</CardTitle>
              <p className="text-gray-700 text-sm mt-2 whitespace-pre-wrap">{request.description}</p>
            </Card>
          )}

          {/* Location */}
          {!isEditing && (
            <Card>
              <CardTitle>الموقع</CardTitle>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-3 sm:mt-4">
                <div>
                  <p className="text-[10px] sm:text-xs text-gray-400 mb-0.5">العنوان</p>
                  <p className="text-gray-700 text-sm">{request.address || '-'}</p>
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs text-gray-400 mb-0.5">المدينة</p>
                  <p className="text-gray-700 text-sm">{request.city || '-'}</p>
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs text-gray-400 mb-0.5">المنطقة</p>
                  <p className="text-gray-700 text-sm">{request.region || '-'}</p>
                </div>
                {request.latitude && request.longitude && (
                  <div>
                    <p className="text-[10px] sm:text-xs text-gray-400 mb-0.5">الإحداثيات</p>
                    <p className="text-gray-700 text-[10px] sm:text-xs" dir="ltr">{request.latitude.toFixed(5)}, {request.longitude.toFixed(5)}</p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Audio */}
          {request.audio_url && (
            <Card>
              <CardTitle>تسجيل صوتي</CardTitle>
              <audio controls className="w-full mt-2" src={request.audio_url}><track kind="captions" /></audio>
            </Card>
          )}

          {/* Images */}
          {images.length > 0 && (
            <Card>
              <CardTitle>الصور</CardTitle>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 mt-2">
                {images.map((img, i) => (
                  <a key={i} href={img} target="_blank" rel="noopener noreferrer">
                    <img src={img} alt={`صورة ${i + 1}`} className="w-full h-24 sm:h-32 object-cover rounded-lg sm:rounded-xl border border-gray-100" />
                  </a>
                ))}
              </div>
            </Card>
          )}

          {/* Dates */}
          <Card>
            <CardTitle>التواريخ</CardTitle>
            <div className="grid grid-cols-2 gap-3 mt-3 text-xs sm:text-sm">
              <div>
                <p className="text-[10px] sm:text-xs text-gray-400 mb-0.5">الإنشاء</p>
                <p>{new Date(request.created_at).toLocaleString('ar-MA')}</p>
              </div>
              {request.updated_at && (
                <div>
                  <p className="text-[10px] sm:text-xs text-gray-400 mb-0.5">آخر تحديث</p>
                  <p>{new Date(request.updated_at).toLocaleString('ar-MA')}</p>
                </div>
              )}
              {request.completed_at && (
                <div>
                  <p className="text-[10px] sm:text-xs text-gray-400 mb-0.5">الإتمام</p>
                  <p>{new Date(request.completed_at).toLocaleString('ar-MA')}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Pledges */}
          {pledgesData && (pledgesData.pledge_count > 0 || pledgesData.approved) && (
            <Card>
              <CardTitle>
                المؤسسات المتعهدة
                {pledgesData.pledge_count > 0 && (
                  <Badge className="bg-blue-100 text-blue-800 mr-2 text-[10px] sm:text-xs">{pledgesData.pledge_count} تعهد</Badge>
                )}
              </CardTitle>

              {pledgesData.approved && (
                <div className="mt-3 p-2.5 sm:p-3 bg-green-50 border border-green-200 rounded-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-green-600 font-bold">✓</span>
                    <span className="font-medium text-green-800 text-sm">{pledgesData.approved.org_name}</span>
                    <Badge className="bg-green-100 text-green-700 text-[10px] sm:text-xs">{pledgesData.approved.status}</Badge>
                  </div>
                  {pledgesData.approved.org_phone && (
                    <p className="text-xs text-green-600" dir="ltr">{pledgesData.approved.org_phone}</p>
                  )}
                </div>
              )}

              {pledgesData.pledges.length > 0 && (
                <div className="mt-3 sm:mt-4 space-y-2.5 sm:space-y-3">
                  {pledgesData.pledges.map((pledge) => (
                    <div key={pledge.assignment_id} className="border border-gray-200 rounded-xl p-3 sm:p-4">
                      <div className="flex items-center justify-between mb-2 gap-2">
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">{pledge.org_name}</p>
                          <p className="text-[10px] sm:text-xs text-gray-500">
                            {pledge.org_total_completed} مكتمل
                            {pledge.org_phone && <span className="mr-2" dir="ltr">{pledge.org_phone}</span>}
                          </p>
                        </div>
                        <Button size="sm" onClick={() => {
                          setShowApproveForm(showApproveForm === pledge.assignment_id ? null : pledge.assignment_id);
                          setApproveShowPhone(false); setApproveContactName(''); setApproveContactPhone('');
                        }}>الموافقة</Button>
                      </div>
                      {pledge.notes && (
                        <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded-lg">{pledge.notes}</p>
                      )}

                      {showApproveForm === pledge.assignment_id && (
                        <div className="mt-2.5 p-2.5 sm:p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-2.5 sm:space-y-3">
                          <p className="text-xs sm:text-sm font-medium text-blue-800">خيارات التواصل</p>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={approveShowPhone} onChange={(e) => setApproveShowPhone(e.target.checked)} className="rounded border-gray-300 text-primary-600" />
                            <span className="text-xs sm:text-sm text-gray-700">إظهار رقم المواطن</span>
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] sm:text-xs text-gray-600 block mb-0.5">اسم التواصل</label>
                              <input type="text" value={approveContactName} onChange={(e) => setApproveContactName(e.target.value)} className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm focus:ring-2 focus:ring-primary-500" placeholder="اسم..." />
                            </div>
                            <div>
                              <label className="text-[10px] sm:text-xs text-gray-600 block mb-0.5">رقم التواصل</label>
                              <input type="tel" dir="ltr" value={approveContactPhone} onChange={(e) => setApproveContactPhone(e.target.value)} className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm focus:ring-2 focus:ring-primary-500" placeholder="06..." />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button className="flex-1 text-xs sm:text-sm" onClick={() => handleApproveOrg(pledge.assignment_id)} loading={actionLoading}>تأكيد</Button>
                            <Button variant="ghost" size="sm" onClick={() => setShowApproveForm(null)}>إلغاء</Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
        </div>

        {/* Sidebar - Actions */}
        <div className="space-y-4 sm:space-y-6">
          {/* Claim / Inspector Assignment - Desktop only (mobile is above) */}
          <Card className="hidden lg:block">
            <CardTitle>التكلف بالحالة</CardTitle>
            <div className="mt-3 sm:mt-4">
              {canClaim ? (
                <Button className="w-full text-xs sm:text-sm bg-indigo-600 hover:bg-indigo-700" onClick={handleClaim} loading={actionLoading}>
                  🔒 تكلف بهذا الطلب
                </Button>
              ) : isSupervisor ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-2.5 bg-indigo-50 border border-indigo-200 rounded-xl">
                    <span className="text-indigo-600 font-bold text-sm">✓</span>
                    <span className="text-sm text-indigo-800 font-medium">أنت مكلف بهذا الطلب</span>
                  </div>
                  <Button variant="ghost" size="sm" className="w-full text-xs text-gray-500 hover:text-red-600 hover:bg-red-50" onClick={handleUnclaim} loading={actionLoading}>
                    إلغاء التكلف
                  </Button>
                </div>
              ) : (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-xs text-amber-800">
                    <span className="font-medium">مكلف به:</span>{' '}
                    {`#${request.inspector_id?.slice(0, 8)}`}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Flag / Alert */}
          <Card>
            <CardTitle>التنبيه والشك</CardTitle>
            <div className="mt-3 sm:mt-4">
              {isFlagged ? (
                <div className="space-y-2.5">
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-orange-600 text-lg">⚠️</span>
                      <span className="text-sm font-medium text-orange-800">طلب مشبوه</span>
                    </div>
                    <p className="text-xs text-orange-700 leading-relaxed">{request.flag_reason}</p>
                    {request.flagged_by_name && (
                      <p className="text-[10px] text-orange-500 mt-2">
                        أبلغ عنه: <span className="font-medium">{request.flagged_by_name}</span>
                        {request.flagged_at && (
                          <span className="mr-1">- {new Date(request.flagged_at).toLocaleDateString('ar-MA')}</span>
                        )}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs text-green-600 hover:bg-green-50"
                    onClick={handleUnflag}
                    loading={actionLoading}
                  >
                    ✓ إزالة التنبيه (الحالة سليمة)
                  </Button>
                </div>
              ) : (
                <>
                  {!showFlagForm ? (
                    <Button
                      variant="ghost"
                      className="w-full text-xs sm:text-sm text-orange-600 hover:bg-orange-50 border border-orange-200"
                      onClick={() => setShowFlagForm(true)}
                    >
                      ⚠️ تنبيه - شك في الحالة
                    </Button>
                  ) : (
                    <div className="space-y-2.5 p-3 bg-orange-50 border border-orange-200 rounded-xl">
                      <p className="text-xs font-medium text-orange-800">ما سبب الشك في هذه الحالة؟</p>
                      <textarea
                        value={flagReason}
                        onChange={(e) => setFlagReason(e.target.value)}
                        placeholder="مثال: الرقم مكرر، البيانات غير متناسقة، اشتباه في استغلال..."
                        rows={3}
                        className="w-full px-3 py-2 border border-orange-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none bg-white"
                      />
                      <div className="flex gap-2">
                        <Button
                          className="flex-1 text-xs bg-orange-600 hover:bg-orange-700"
                          onClick={handleFlag}
                          loading={actionLoading}
                        >
                          تأكيد التنبيه
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setShowFlagForm(false); setFlagReason(''); }}
                        >
                          إلغاء
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardTitle>الإجراءات</CardTitle>
            <div className="space-y-2 sm:space-y-3 mt-3 sm:mt-4">
              {canActivate && (
                <Button className="w-full text-xs sm:text-sm" onClick={openActivateModal} loading={actionLoading}>تفعيل الطلب</Button>
              )}
              {canAssign && (
                <Button variant="secondary" className="w-full text-xs sm:text-sm" onClick={() => setShowAssignForm(!showAssignForm)}>ربط بجمعية</Button>
              )}
              {canReject && (
                <Button variant="ghost" className="w-full text-xs sm:text-sm text-orange-600 hover:bg-orange-50" onClick={() => setShowRejectForm(!showRejectForm)}>رفض الطلب</Button>
              )}
              {canDelete && (
                <Button variant="danger" className="w-full text-xs sm:text-sm" onClick={handleDelete} loading={actionLoading}>حذف الطلب</Button>
              )}
            </div>
          </Card>

          {/* Status & Urgency */}
          <Card>
            <CardTitle>الحالة والأهمية</CardTitle>
            <div className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
              <div>
                <Select label="حالة الطلب" value={newStatus} onChange={(e) => setNewStatus(e.target.value)} options={ALL_REQUEST_STATUSES.map((s) => ({ value: s, label: REQUEST_STATUS_LABELS[s] }))} />
                {newStatus !== request.status && (
                  <Button size="sm" className="w-full mt-2 text-xs sm:text-sm" onClick={handleStatusChange} loading={actionLoading}>تأكيد التغيير</Button>
                )}
              </div>
              <div className="pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-gray-600">مستعجل</span>
                  <button onClick={handleUrgencyToggle} disabled={actionLoading} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${request.is_urgent === 1 ? 'bg-red-500' : 'bg-gray-300'} disabled:opacity-50`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${request.is_urgent === 1 ? 'translate-x-1' : 'translate-x-6'}`} />
                  </button>
                </div>
              </div>
            </div>
          </Card>

          {/* Assign Form */}
          {showAssignForm && (
            <Card>
              <CardTitle>ربط بجمعية</CardTitle>
              <div className="space-y-3 mt-3">
                <Select label="الجمعية" value={selectedOrgId} onChange={(e) => setSelectedOrgId(e.target.value)} placeholder="-- اختر --" options={organizations.map((org) => ({ value: org.id, label: `${org.name} (${org.total_completed})` }))} />
                <Textarea label="ملاحظات" placeholder="ملاحظات..." value={assignNotes} onChange={(e) => setAssignNotes(e.target.value)} rows={2} />
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={allowPhoneAccess} onChange={(e) => setAllowPhoneAccess(e.target.checked)} className="rounded border-gray-300 text-primary-600" />
                  <span className="text-xs sm:text-sm text-gray-600">السماح برؤية الهاتف</span>
                </label>
                <div className="flex gap-2">
                  <Button className="flex-1 text-xs sm:text-sm" onClick={handleAssign} loading={actionLoading}>تأكيد</Button>
                  <Button variant="ghost" size="sm" onClick={() => setShowAssignForm(false)}>إلغاء</Button>
                </div>
              </div>
            </Card>
          )}

          {/* Reject Form */}
          {showRejectForm && (
            <Card>
              <CardTitle>رفض الطلب</CardTitle>
              <div className="space-y-3 mt-3">
                <Textarea label="السبب" placeholder="سبب الرفض..." value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={2} />
                <div className="flex gap-2">
                  <Button variant="danger" className="flex-1 text-xs sm:text-sm" onClick={handleReject} loading={actionLoading}>تأكيد الرفض</Button>
                  <Button variant="ghost" size="sm" onClick={() => setShowRejectForm(false)}>إلغاء</Button>
                </div>
              </div>
            </Card>
          )}

          {/* Inspector Notes */}
          <Card>
            <CardTitle>ملاحظات المراقب</CardTitle>
            <div className="space-y-2 sm:space-y-3 mt-3">
              <Textarea placeholder="أضف ملاحظاتك..." value={inspectorNotes} onChange={(e) => setInspectorNotes(e.target.value)} rows={3} />
              <Button variant="secondary" size="sm" onClick={handleSaveNotes} loading={actionLoading}>حفظ الملاحظات</Button>
            </div>
          </Card>

          {/* Admin Notes */}
          {request.admin_notes && (
            <Card>
              <CardTitle>ملاحظات الإدارة</CardTitle>
              <p className="text-gray-600 text-xs sm:text-sm mt-2 whitespace-pre-wrap">{request.admin_notes}</p>
            </Card>
          )}
        </div>
      </div>

      {/* Activate Request Modal */}
      <Modal isOpen={showActivateModal} onClose={() => setShowActivateModal(false)} title="تفعيل الطلب">
        <div className="space-y-4">
          {/* Urgent toggle */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
            <div>
              <p className="text-sm font-medium text-gray-700">طلب مستعجل</p>
              <p className="text-xs text-gray-400 mt-0.5">الأولوية ستكون 100 تلقائيا</p>
            </div>
            <button
              onClick={() => setActivateIsUrgent(!activateIsUrgent)}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${activateIsUrgent ? 'bg-red-500' : 'bg-gray-300'}`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm ${activateIsUrgent ? 'translate-x-1' : 'translate-x-6'}`} />
            </button>
          </div>

          {/* Priority field - only when NOT urgent */}
          {!activateIsUrgent && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">درجة الأولوية (0-100)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={activatePriority}
                  onChange={(e) => setActivatePriority(e.target.value)}
                  placeholder="أدخل الأولوية..."
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-center text-lg font-semibold focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none"
                  dir="ltr"
                />
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-2">خيارات سريعة:</p>
                <div className="grid grid-cols-4 gap-2">
                  {[25, 50, 75, 90].map((val) => (
                    <button
                      key={val}
                      onClick={() => setActivatePriority(String(val))}
                      className={`py-2.5 rounded-xl text-sm font-semibold transition-colors border ${
                        activatePriority === String(val)
                          ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-primary-50 hover:border-primary-300 hover:text-primary-700'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Confirm button */}
          <div className="flex gap-3 pt-2">
            <Button
              className="flex-1"
              onClick={confirmActivate}
              loading={actionLoading}
              disabled={!activateIsUrgent && !activatePriority}
            >
              تأكيد التفعيل
            </Button>
            <Button variant="ghost" onClick={() => setShowActivateModal(false)}>
              إلغاء
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
