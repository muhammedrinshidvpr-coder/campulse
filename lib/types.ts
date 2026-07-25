export type IssueCategory =
  | 'facilities'
  | 'safety'
  | 'harassment'
  | 'academics'
  | 'event'
  | 'accessibility'
  | 'suggestion';

export type IssueUrgency = 'low' | 'medium' | 'high';

export type IssueStatus =
  | 'submitted'
  | 'acknowledged'
  | 'assigned'
  | 'in_progress'
  | 'resolved'
  | 'verified';

export type UserRole = 'student' | 'faculty' | 'warden' | 'admin' | 'student_affairs';

export interface Profile {
  id: string;
  full_name: string | null;
  role: UserRole;
  department: string | null;
  contribution_score: number;
  created_at: string;
}

export interface Issue {
  id: string;
  tracking_code: string;
  reporter_id: string | null;
  is_anonymous: boolean;
  title: string;
  description: string;
  category: IssueCategory;
  urgency: IssueUrgency;
  location: string | null;
  status: IssueStatus;
  owner_role: UserRole | null;
  owner_id: string | null;
  escalation_level: number;
  resolution_note: string | null;
  verified_by_student: boolean;
  sla_due_at: string | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
}

// Mirrors public.issues_public — the identity-free view the Feed and
// Transparency screens read from, so anonymity holds even in client code.
export interface PublicIssue {
  id: string;
  tracking_code: string;
  title: string;
  category: IssueCategory;
  urgency: IssueUrgency;
  location: string | null;
  status: IssueStatus;
  escalation_level: number;
  resolution_note: string | null;
  verified_by_student: boolean;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
}

export interface Badge {
  id: string;
  code: string;
  label: string;
  description: string | null;
  icon: string | null;
}

export interface Announcement {
  id: string;
  issue_id: string | null;
  title: string;
  body: string;
  published_at: string;
}

export interface PublicStats {
  total_issues: number;
  resolved_issues: number;
  resolution_rate_pct: number | null;
  avg_resolution_hours: number | null;
}

export interface LeaderboardEntry {
  display_name: string;
  contribution_score: number;
}
