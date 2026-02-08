// === Enums ===

export type UserRole = 'admin' | 'superadmin' | 'organization' | 'citizen' | 'inspector';
export type UserStatus = 'active' | 'suspended';

export type RequestCategory =
  | 'food'
  | 'water'
  | 'shelter'
  | 'medicine'
  | 'clothes'
  | 'blankets'
  | 'baby_supplies'
  | 'hygiene'
  | 'other';

export type RequestStatus = 'pending' | 'new' | 'assigned' | 'in_progress' | 'completed' | 'cancelled' | 'rejected';
export type AssignmentStatus = 'pledged' | 'in_progress' | 'completed' | 'failed';
export type OrganizationStatus = 'active' | 'suspended';

// === Auth ===

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UnifiedLoginRequest {
  identifier: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
  phone: string;
  address?: string;
  city?: string;
  region?: string;
}

// === OTP Auth (Citizens) ===

export interface OtpSendRequest {
  phone: string;
}

export interface OtpSendResponse {
  message: string;
  expires_in: number;
}

export interface OtpVerifyRequest {
  phone: string;
  code: string;
}

export interface OtpVerifyResponse {
  access_token: string;
  token_type: string;
  user: UserResponse;
  is_new_user: boolean;
}

export interface PhoneRequestsResponse {
  requests: CitizenRequestResponse[];
  total: number;
}

// Phone Registration (Temporary - without OTP)
export interface PhoneRegisterRequest {
  phone: string;
  full_name?: string;
}

export interface PhoneRegisterResponse {
  message: string;
  user: UserResponse;
  access_token: string;
  token_type: string;
  is_new_user: boolean;
}

export interface UserResponse {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  organization_id: string | null;
  organization_name: string | null;
}

export interface UserProfileResponse extends UserResponse {
  address: string | null;
  city: string | null;
  region: string | null;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: UserResponse;
}

export interface RegisterResponse {
  message: string;
  user: UserResponse;
  access_token: string;
  token_type: string;
}

export interface UpdateProfileRequest {
  full_name?: string;
  phone?: string;
  address?: string;
  city?: string;
  region?: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

// === Requests ===

export interface CitizenRequestCreate {
  category: RequestCategory;
  description?: string;
  quantity: number;
  family_members: number;
  address?: string;
  city?: string;
  region?: string;
  latitude?: number;
  longitude?: number;
  audio_url?: string;
  images?: string[];
  is_urgent: boolean;
}

export interface CitizenRequestUpdate {
  description?: string;
  quantity?: number;
  family_members?: number;
  address?: string;
  city?: string;
  region?: string;
  audio_url?: string;
  images?: string[];
  is_urgent?: boolean;
}

export interface RequestResponse {
  id: string;
  requester_name: string;
  requester_phone: string;
  category: RequestCategory;
  description: string;
  quantity: number;
  family_members: number;
  address: string;
  city: string | null;
  region: string | null;
  latitude: number | null;
  longitude: number | null;
  status: RequestStatus;
  priority_score: number;
  is_urgent: number;
  created_at: string;
  updated_at: string | null;
  completed_at: string | null;
}

export interface CitizenRequestResponse {
  id: string;
  tracking_code: string;
  category: RequestCategory;
  description: string | null;
  quantity: number;
  family_members: number;
  address: string | null;
  city: string | null;
  region: string | null;
  latitude: number | null;
  longitude: number | null;
  audio_url: string | null;
  images: string[] | null;
  status: RequestStatus;
  status_ar: string;
  is_urgent: boolean;
  created_at: string;
  updated_at: string | null;
  completed_at: string | null;
  organization_name: string | null;
}

export interface CitizenRequestCreatedResponse {
  id: string;
  tracking_code: string;
  message: string;
}

export interface RequestDetailResponse extends RequestResponse {
  admin_notes: string | null;
  assignments: AssignmentBriefResponse[];
}

export interface RequestTrackResponse {
  id: string;
  status: RequestStatus;
  status_ar: string;
  category: RequestCategory;
  created_at: string;
  updated_at: string | null;
  organization_name: string | null;
}

export interface PaginatedRequests {
  items: RequestResponse[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

export interface RequestAdminUpdate {
  status?: RequestStatus;
  priority_score?: number;
  is_urgent?: boolean;
  admin_notes?: string;
}

// === Assignments ===

export interface AssignmentCreate {
  request_id: string;
  notes?: string;
}

export interface AssignmentUpdate {
  status: AssignmentStatus;
  completion_notes?: string;
  failure_reason?: string;
}

export interface AssignmentResponse {
  id: string;
  request_id: string;
  org_id: string;
  status: AssignmentStatus;
  notes: string | null;
  completion_notes: string | null;
  failure_reason: string | null;
  created_at: string;
  updated_at: string | null;
  completed_at: string | null;
}

export interface AssignmentBriefResponse {
  id: string;
  org_id: string;
  status: AssignmentStatus;
  created_at: string;
}

export interface AssignmentWithRequest {
  assignment: AssignmentResponse;
  request: {
    id: string;
    requester_name: string;
    requester_phone: string;
    category: string;
    description: string;
    quantity: number;
    family_members: number;
    address: string;
    city: string | null;
    region: string | null;
    latitude: number | null;
    longitude: number | null;
    is_urgent: number;
  };
}

export interface PaginatedAssignments {
  items: AssignmentResponse[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

// === Statistics ===

export interface OverviewStats {
  data: {
    total_requests: number;
    by_status: Record<string, number>;
    by_category: Record<string, number>;
    urgent_count: number;
    avg_completion_hours: number | null;
    active_organizations: number;
  };
}

export interface DailyStats {
  data: Array<{
    date: string;
    count: number;
  }>;
}

export interface RegionalStats {
  data: Array<{
    region: string;
    total: number;
    new: number;
    completed: number;
  }>;
}

export interface OrgStats {
  data: {
    total_assignments: number;
    by_status: Record<string, number>;
    total_completed: number;
  };
}

export interface CitizenStats {
  total_requests: number;
  by_status: Record<string, number>;
}

export interface AdminOrgStats {
  data: Array<{
    id: string;
    name: string;
    total_assignments: number;
    completed: number;
  }>;
}

export interface AdminOrgListItem {
  id: string;
  name: string;
  contact_phone: string;
  contact_email: string;
  status: string;
  total_completed: number;
  created_at: string;
  access_code: string | null;
}

export interface AdminOrgList {
  items: AdminOrgListItem[];
  total: number;
  page: number;
  limit: number;
}

// === Inspector ===

export interface InspectorLoginRequest {
  phone: string;
  code: string;
}

export interface InspectorLoginResponse {
  access_token: string;
  token_type: string;
  user: UserResponse;
}

export interface InspectorRequestResponse {
  id: string;
  requester_name: string;
  requester_phone: string;
  category: RequestCategory;
  description: string | null;
  quantity: number;
  family_members: number;
  address: string | null;
  city: string | null;
  region: string | null;
  latitude: number | null;
  longitude: number | null;
  audio_url: string | null;
  images: string | null;
  status: RequestStatus;
  priority_score: number;
  is_urgent: number;
  inspector_id: string | null;
  inspector_notes: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string | null;
  completed_at: string | null;
}

export interface InspectorAssignRequest {
  organization_id: string;
  notes?: string;
}

export interface InspectorRejectRequest {
  reason?: string;
}

export interface InspectorRequestUpdate {
  inspector_notes?: string;
}

export interface InspectorStats {
  total_reviewed: number;
  pending_count: number;
  activated_count: number;
  rejected_count: number;
  assigned_count: number;
}

export interface InspectorCreateRequest {
  full_name: string;
  phone: string;
}

export interface InspectorResponse {
  id: string;
  full_name: string;
  phone: string | null;
  status: string;
  access_code: string | null;
  created_at: string;
  last_login: string | null;
}

export interface InspectorCreatedResponse {
  message: string;
  inspector: InspectorResponse;
  access_code: string;
}

export interface InspectorListResponse {
  items: InspectorResponse[];
  total: number;
  page: number;
  limit: number;
}

export interface OrganizationBrief {
  id: string;
  name: string;
  contact_phone: string | null;
  contact_email: string | null;
  service_types: string[];
  coverage_areas: string[];
  total_completed: number;
}

// === Organization Management (Admin) ===

export interface OrganizationCreateRequest {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  region?: string;
  description?: string;
}

export interface OrganizationCreatedResponse {
  message: string;
  organization: AdminOrgListItem;
  access_code: string;
}

export interface OrganizationLoginRequest {
  phone: string;
  code: string;
}

export interface OrganizationLoginResponse {
  access_token: string;
  token_type: string;
  user: UserResponse;
}

// === Request with phone count ===

export interface RequestWithPhoneCount extends RequestResponse {
  phone_request_count?: number;
}

// === Inspector request with supervisor info ===

export interface InspectorRequestWithSupervisor extends InspectorRequestResponse {
  supervisor_id?: string | null;
  supervisor_name?: string | null;
  phone_request_count?: number;
}

// === Organization access control ===

export interface OrgAccessRequest {
  request_id: string;
  organization_id: string;
  allow_phone_access: boolean;
}

export interface OrgAccessResponse {
  message: string;
}

// === Admin Management (Superadmin) ===

export interface AdminListItem {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  status: string;
  created_at: string;
  last_login: string | null;
}

export interface AdminListResponse {
  items: AdminListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminCreateRequest {
  full_name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface AdminCreatedResponse {
  message: string;
  admin: AdminListItem;
}

// === Citizens Management ===

export interface CitizenListItem {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  status: string;
  created_at: string;
  last_login: string | null;
  total_requests: number;
  supervisor_id: string | null;
  supervisor_name: string | null;
}
