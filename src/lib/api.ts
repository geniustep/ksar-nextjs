import type {
  UnifiedLoginRequest,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  UserProfileResponse,
  UpdateProfileRequest,
  ChangePasswordRequest,
  CitizenRequestCreate,
  CitizenRequestUpdate,
  CitizenRequestResponse,
  CitizenRequestCreatedResponse,
  CitizenStats,
  RequestResponse,
  RequestDetailResponse,
  PaginatedRequests,
  RequestAdminUpdate,
  RequestTrackResponse,
  AssignmentCreate,
  AssignmentUpdate,
  AssignmentResponse,
  AssignmentWithRequest,
  PaginatedAssignments,
  OrgStats,
  OverviewStats,
  DailyStats,
  RegionalStats,
  AdminOrgStats,
  AdminOrgList,
  RequestStatus,
  RequestCategory,
  AssignmentStatus,
  OtpSendRequest,
  OtpSendResponse,
  OtpVerifyRequest,
  OtpVerifyResponse,
  PhoneRequestsResponse,
  PhoneRegisterRequest,
  PhoneRegisterResponse,
  InspectorLoginRequest,
  InspectorLoginResponse,
  InspectorRequestResponse,
  InspectorAssignRequest,
  InspectorRejectRequest,
  InspectorRequestUpdate,
  InspectorRequestDataUpdate,
  InspectorStats,
  InspectorCreateRequest,
  InspectorCreatedResponse,
  InspectorListResponse,
  OrganizationBrief,
  OrganizationWithAssignments,
  RequestPledgesResponse,
  OrganizationCreateRequest,
  OrganizationCreatedResponse,
  OrganizationUpdateRequest,
  OrganizationUpdateResponse,
  OrganizationLoginRequest,
  OrganizationLoginResponse,
  OrgAccessRequest,
  OrgAccessResponse,
  OrgProfileResponse,
  OrgProfileUpdateRequest,
  OrgProfileUpdateResponse,
  CitizenListItem,
  AdminListResponse,
  AdminCreatedResponse,
  AdminCreateRequest,
  OrgPledgesResponse,
  OrgPledgesStatsResponse,
} from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://ksar.geniura.com';

class ApiError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.status = status;
    this.detail = detail;
  }
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: 'خطأ في الخادم' }));
    let detail = body.detail || 'خطأ غير متوقع';
    // FastAPI validation errors return detail as an array of objects
    if (Array.isArray(detail)) {
      detail = detail.map((e: { msg?: string }) => e.msg || JSON.stringify(e)).join(', ');
    } else if (typeof detail === 'object') {
      detail = JSON.stringify(detail);
    }
    throw new ApiError(res.status, detail);
  }

  if (res.status === 204) return {} as T;
  return res.json();
}

// === Auth API ===

export const authApi = {
  login(data: LoginRequest): Promise<LoginResponse> {
    return request('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  unifiedLogin(data: UnifiedLoginRequest): Promise<LoginResponse> {
    return request('/api/v1/auth/unified-login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  register(data: RegisterRequest): Promise<RegisterResponse> {
    return request('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getMe(): Promise<UserProfileResponse> {
    return request('/api/v1/auth/me');
  },

  updateProfile(data: UpdateProfileRequest): Promise<UserProfileResponse> {
    return request('/api/v1/auth/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  changePassword(data: ChangePasswordRequest): Promise<{ message: string }> {
    return request('/api/v1/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  refreshToken(): Promise<{ access_token: string; token_type: string }> {
    return request('/api/v1/auth/refresh', {
      method: 'POST',
    });
  },
};

// === OTP Auth API (Citizens) ===

export const otpApi = {
  sendOtp(data: OtpSendRequest): Promise<OtpSendResponse> {
    return request('/api/v1/auth/otp/send', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  verifyOtp(data: OtpVerifyRequest): Promise<OtpVerifyResponse> {
    return request('/api/v1/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getRequestsByPhone(phone: string): Promise<PhoneRequestsResponse> {
    return request(`/api/v1/citizen/requests/by-phone?phone=${encodeURIComponent(phone)}`);
  },

  // Temporary phone registration without OTP
  phoneRegister(data: PhoneRegisterRequest): Promise<PhoneRegisterResponse> {
    return request('/api/v1/auth/phone-register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// === Public API ===

export const publicApi = {
  trackRequest(trackingCode: string, phone: string): Promise<RequestTrackResponse> {
    return request(
      `/api/v1/public/requests/track/${trackingCode}?phone=${encodeURIComponent(phone)}`
    );
  },

  getCategories(): Promise<Record<string, string>> {
    return request('/api/v1/public/categories');
  },

  registerOrganization(data: {
    name: string;
    phone: string;
    email?: string;
    description?: string;
    city?: string;
    region?: string;
    responsible_name?: string;
    preferred_code?: string;
    org_type: 'association' | 'individual';
    national_id?: string;
  }): Promise<{ message: string; organization_name: string }> {
    return request('/api/v1/public/org-register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// === Citizen API ===

export const citizenApi = {
  createRequest(data: CitizenRequestCreate): Promise<CitizenRequestCreatedResponse> {
    return request('/api/v1/citizen/requests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getMyRequests(status?: RequestStatus): Promise<CitizenRequestResponse[]> {
    const params = status ? `?status=${status}` : '';
    return request(`/api/v1/citizen/requests${params}`);
  },

  getRequest(requestId: string): Promise<CitizenRequestResponse> {
    return request(`/api/v1/citizen/requests/${requestId}`);
  },

  updateRequest(requestId: string, data: CitizenRequestUpdate): Promise<CitizenRequestResponse> {
    return request(`/api/v1/citizen/requests/${requestId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  cancelRequest(requestId: string): Promise<{ message: string }> {
    return request(`/api/v1/citizen/requests/${requestId}`, {
      method: 'DELETE',
    });
  },

  getStats(): Promise<CitizenStats> {
    return request('/api/v1/citizen/stats');
  },
};

// === Organization API ===

export const orgApi = {
  getAvailableRequests(params?: {
    category?: RequestCategory;
    region?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedRequests> {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.set('category', params.category);
    if (params?.region) searchParams.set('region', params.region);
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    const qs = searchParams.toString();
    return request(`/api/v1/org/requests/available${qs ? '?' + qs : ''}`);
  },

  getRequest(requestId: string): Promise<RequestResponse> {
    return request(`/api/v1/org/requests/${requestId}`);
  },

  createAssignment(data: AssignmentCreate): Promise<AssignmentResponse> {
    return request('/api/v1/org/assignments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getMyAssignments(params?: {
    status?: AssignmentStatus;
    page?: number;
    limit?: number;
  }): Promise<PaginatedAssignments> {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    const qs = searchParams.toString();
    return request(`/api/v1/org/assignments${qs ? '?' + qs : ''}`);
  },

  getAssignment(assignmentId: string): Promise<AssignmentWithRequest> {
    return request(`/api/v1/org/assignments/${assignmentId}`);
  },

  updateAssignment(assignmentId: string, data: AssignmentUpdate): Promise<AssignmentResponse> {
    return request(`/api/v1/org/assignments/${assignmentId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  getStats(): Promise<OrgStats> {
    return request('/api/v1/org/stats');
  },

  getProfile(): Promise<OrgProfileResponse> {
    return request('/api/v1/org/profile');
  },

  updateProfile(data: OrgProfileUpdateRequest): Promise<OrgProfileUpdateResponse> {
    return request('/api/v1/org/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};

// === Admin API ===

export const adminApi = {
  getRequests(params?: {
    status?: RequestStatus;
    category?: RequestCategory;
    region?: string;
    is_urgent?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedRequests> {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.category) searchParams.set('category', params.category);
    if (params?.region) searchParams.set('region', params.region);
    if (params?.is_urgent !== undefined) searchParams.set('is_urgent', String(params.is_urgent));
    if (params?.search) searchParams.set('search', params.search);
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    const qs = searchParams.toString();
    return request(`/api/v1/admin/requests${qs ? '?' + qs : ''}`);
  },

  getRequest(requestId: string): Promise<RequestDetailResponse> {
    return request(`/api/v1/admin/requests/${requestId}`);
  },

  updateRequest(
    requestId: string,
    data: RequestAdminUpdate
  ): Promise<{ message: string; data: RequestResponse }> {
    return request(`/api/v1/admin/requests/${requestId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  deleteRequest(requestId: string): Promise<{ message: string }> {
    return request(`/api/v1/admin/requests/${requestId}`, {
      method: 'DELETE',
    });
  },

  getOverviewStats(): Promise<OverviewStats> {
    return request('/api/v1/admin/stats/overview');
  },

  getDailyStats(days?: number): Promise<DailyStats> {
    const qs = days ? `?days=${days}` : '';
    return request(`/api/v1/admin/stats/daily${qs}`);
  },

  getRegionalStats(): Promise<RegionalStats> {
    return request('/api/v1/admin/stats/by-region');
  },

  getOrgStats(): Promise<AdminOrgStats> {
    return request('/api/v1/admin/stats/organizations');
  },

  getOrgPledges(orgId: string, params?: { page?: number; limit?: number }): Promise<OrgPledgesResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    const qs = searchParams.toString();
    return request(`/api/v1/admin/organizations/${orgId}/pledges${qs ? '?' + qs : ''}`);
  },

  getOrganizations(params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<AdminOrgList> {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    const qs = searchParams.toString();
    return request(`/api/v1/admin/organizations${qs ? '?' + qs : ''}`);
  },

  updateOrgStatus(orgId: string, status: string): Promise<{ message: string }> {
    return request(`/api/v1/admin/organizations/${orgId}/status?status=${status}`, {
      method: 'PATCH',
    });
  },

  updateOrganization(orgId: string, data: OrganizationUpdateRequest): Promise<OrganizationUpdateResponse> {
    return request(`/api/v1/admin/organizations/${orgId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // === Inspector Management ===

  createInspector(data: InspectorCreateRequest): Promise<InspectorCreatedResponse> {
    return request('/api/v1/admin/inspectors', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getInspectors(params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<InspectorListResponse> {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    const qs = searchParams.toString();
    return request(`/api/v1/admin/inspectors${qs ? '?' + qs : ''}`);
  },

  updateInspectorStatus(inspectorId: string, status: string): Promise<{ message: string }> {
    return request(`/api/v1/admin/inspectors/${inspectorId}/status?status=${status}`, {
      method: 'PATCH',
    });
  },

  regenerateInspectorCode(inspectorId: string, customCode?: string): Promise<{ message: string; access_code: string }> {
    return request(`/api/v1/admin/inspectors/${inspectorId}/regenerate-code`, {
      method: 'POST',
      body: JSON.stringify(customCode ? { custom_code: customCode } : {}),
    });
  },

  deleteInspector(inspectorId: string): Promise<{ message: string }> {
    return request(`/api/v1/admin/inspectors/${inspectorId}`, {
      method: 'DELETE',
    });
  },

  // === Organization Management ===

  createOrganization(data: OrganizationCreateRequest): Promise<OrganizationCreatedResponse> {
    return request('/api/v1/admin/organizations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  regenerateOrgCode(orgId: string, customCode?: string): Promise<{ message: string; access_code: string }> {
    return request(`/api/v1/admin/organizations/${orgId}/regenerate-code`, {
      method: 'POST',
      body: JSON.stringify(customCode ? { custom_code: customCode } : {}),
    });
  },

  deleteOrganization(orgId: string): Promise<{ message: string }> {
    return request(`/api/v1/admin/organizations/${orgId}`, {
      method: 'DELETE',
    });
  },

  // === Organization phone access control ===

  updateOrgPhoneAccess(data: OrgAccessRequest): Promise<OrgAccessResponse> {
    return request('/api/v1/admin/org-access', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // === Citizens Management ===

  getCitizens(params?: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ items: CitizenListItem[]; total: number }> {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.search) searchParams.set('search', params.search);
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    const qs = searchParams.toString();
    return request(`/api/v1/admin/citizens${qs ? '?' + qs : ''}`);
  },

  updateCitizenStatus(citizenId: string, status: string): Promise<{ message: string }> {
    return request(`/api/v1/admin/citizens/${citizenId}/status?status=${status}`, {
      method: 'PATCH',
    });
  },

  deleteCitizen(citizenId: string): Promise<{ message: string }> {
    return request(`/api/v1/admin/citizens/${citizenId}`, {
      method: 'DELETE',
    });
  },

  // === Admin Management (Superadmin only) ===

  getAdmins(params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<AdminListResponse> {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    const qs = searchParams.toString();
    return request(`/api/v1/admin/admins${qs ? '?' + qs : ''}`);
  },

  createAdmin(data: AdminCreateRequest): Promise<AdminCreatedResponse> {
    const params = new URLSearchParams();
    params.set('full_name', data.full_name);
    params.set('email', data.email);
    params.set('password', data.password);
    if (data.phone) params.set('phone', data.phone);
    return request(`/api/v1/admin/admins?${params.toString()}`, {
      method: 'POST',
    });
  },

  updateAdminStatus(adminId: string, status: string): Promise<{ message: string }> {
    return request(`/api/v1/admin/admins/${adminId}/status?status=${status}`, {
      method: 'PATCH',
    });
  },

  deleteAdmin(adminId: string): Promise<{ message: string }> {
    return request(`/api/v1/admin/admins/${adminId}`, {
      method: 'DELETE',
    });
  },
};

// === Organization Auth API ===

export const orgAuthApi = {
  login(data: OrganizationLoginRequest): Promise<OrganizationLoginResponse> {
    return request('/api/v1/auth/org-login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// === Inspector API ===

export const inspectorApi = {
  login(data: InspectorLoginRequest): Promise<InspectorLoginResponse> {
    return request('/api/v1/auth/inspector-login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getRequests(params?: {
    status?: RequestStatus;
    category?: RequestCategory;
    region?: string;
    is_urgent?: boolean;
    search?: string;
    mine_only?: boolean;
    page?: number;
    limit?: number;
  }): Promise<PaginatedRequests> {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.category) searchParams.set('category', params.category);
    if (params?.region) searchParams.set('region', params.region);
    if (params?.is_urgent !== undefined) searchParams.set('is_urgent', String(params.is_urgent));
    if (params?.search) searchParams.set('search', params.search);
    if (params?.mine_only) searchParams.set('mine_only', 'true');
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    const qs = searchParams.toString();
    return request(`/api/v1/inspector/requests${qs ? '?' + qs : ''}`);
  },

  getRequest(requestId: string): Promise<InspectorRequestResponse> {
    return request(`/api/v1/inspector/requests/${requestId}`);
  },

  activateRequest(requestId: string, data?: { is_urgent?: boolean; priority_score?: number; inspector_notes?: string }): Promise<{ message: string; data: RequestResponse }> {
    return request(`/api/v1/inspector/requests/${requestId}/activate`, {
      method: 'PATCH',
      body: JSON.stringify(data || {}),
    });
  },

  rejectRequest(requestId: string, reason?: string): Promise<{ message: string; data: RequestResponse }> {
    return request(`/api/v1/inspector/requests/${requestId}/reject`, {
      method: 'PATCH',
      body: JSON.stringify(reason ? { reason } : {}),
    });
  },

  assignRequest(requestId: string, data: InspectorAssignRequest): Promise<{ message: string }> {
    return request(`/api/v1/inspector/requests/${requestId}/assign`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  updateRequestNotes(requestId: string, data: InspectorRequestUpdate): Promise<{ message: string }> {
    return request(`/api/v1/inspector/requests/${requestId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  editRequestData(requestId: string, data: InspectorRequestDataUpdate): Promise<{ message: string; data: RequestResponse }> {
    return request(`/api/v1/inspector/requests/${requestId}/edit`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  claimRequest(requestId: string): Promise<{ message: string; data: RequestResponse }> {
    return request(`/api/v1/inspector/requests/${requestId}/claim`, {
      method: 'PATCH',
    });
  },

  unclaimRequest(requestId: string): Promise<{ message: string; data: RequestResponse }> {
    return request(`/api/v1/inspector/requests/${requestId}/unclaim`, {
      method: 'PATCH',
    });
  },

  flagRequest(requestId: string, reason: string): Promise<{ message: string; data: RequestResponse }> {
    return request(`/api/v1/inspector/requests/${requestId}/flag`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    });
  },

  unflagRequest(requestId: string): Promise<{ message: string; data: RequestResponse }> {
    return request(`/api/v1/inspector/requests/${requestId}/unflag`, {
      method: 'PATCH',
    });
  },

  getFlaggedRequests(params?: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedRequests> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    const qs = searchParams.toString();
    return request(`/api/v1/inspector/flagged-requests${qs ? '?' + qs : ''}`);
  },

  getOrganizationsPledgesStats(): Promise<OrgPledgesStatsResponse> {
    return request('/api/v1/inspector/organizations-pledges');
  },

  getOrgPledges(orgId: string, params?: { page?: number; limit?: number }): Promise<OrgPledgesResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    const qs = searchParams.toString();
    return request(`/api/v1/inspector/organizations/${orgId}/pledges${qs ? '?' + qs : ''}`);
  },

  updateRequestStatus(requestId: string, data: { status?: RequestStatus; is_urgent?: number }): Promise<{ message: string; data: RequestResponse }> {
    return request(`/api/v1/inspector/requests/${requestId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  deleteRequest(requestId: string): Promise<{ message: string }> {
    return request(`/api/v1/inspector/requests/${requestId}`, {
      method: 'DELETE',
    });
  },

  getStats(): Promise<InspectorStats> {
    return request('/api/v1/inspector/stats');
  },

  getOrganizations(): Promise<{ items: OrganizationBrief[] }> {
    return request('/api/v1/inspector/organizations');
  },

  getOrganizationsWithAssignments(): Promise<{ items: OrganizationWithAssignments[] }> {
    return request('/api/v1/inspector/organizations/details');
  },

  getRequestPledges(requestId: string): Promise<RequestPledgesResponse> {
    return request(`/api/v1/inspector/requests/${requestId}/pledges`);
  },

  approveOrgForRequest(
    requestId: string,
    data: {
      assignment_id: string;
      show_citizen_phone: boolean;
      contact_name?: string;
      contact_phone?: string;
    }
  ): Promise<{ message: string; assignment_id: string }> {
    const params = new URLSearchParams();
    params.set('assignment_id', data.assignment_id);
    params.set('show_citizen_phone', String(data.show_citizen_phone));
    if (data.contact_name) params.set('contact_name', data.contact_name);
    if (data.contact_phone) params.set('contact_phone', data.contact_phone);
    return request(`/api/v1/inspector/requests/${requestId}/approve-org?${params.toString()}`, {
      method: 'POST',
    });
  },

  getPhoneRequestCount(phone: string): Promise<{ phone: string; count: number }> {
    return request(`/api/v1/inspector/phone-count?phone=${encodeURIComponent(phone)}`);
  },
};

export { ApiError };
