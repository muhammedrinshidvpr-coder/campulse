import { supabase } from './supabaseClient';
import type {
  Announcement,
  Badge,
  Issue,
  IssueCategory,
  IssueStatus,
  IssueUrgency,
  LeaderboardEntry,
  Notification,
  Profile,
  PublicIssue,
  PublicStats,
  UserRole,
} from './types';

function client() {
  if (!supabase) {
    throw new Error('Supabase is not configured. Add your URL and anon key to .env.local.');
  }
  return supabase;
}

export async function fetchProfile(userId: string): Promise<Profile> {
  const { data, error } = await client().from('profiles').select('*').eq('id', userId).single();
  if (error) throw error;
  return data as Profile;
}

export async function fetchMyIssues(userId: string): Promise<Issue[]> {
  const { data, error } = await client()
    .from('issues')
    .select('*')
    .eq('reporter_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Issue[];
}

export interface NewIssueInput {
  reporterId: string;
  title: string;
  description: string;
  category: IssueCategory;
  urgency: IssueUrgency;
  location: string;
  isAnonymous: boolean;
}

export async function submitIssue(input: NewIssueInput): Promise<Issue> {
  const { data, error } = await client()
    .from('issues')
    .insert({
      reporter_id: input.reporterId,
      title: input.title,
      description: input.description,
      category: input.category,
      urgency: input.urgency,
      location: input.location || null,
      is_anonymous: input.isAnonymous,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as Issue;
}

export async function uploadIssuePhoto(userId: string, issueId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${userId}/${issueId}-${Date.now()}.${ext}`;
  const { error } = await client().storage.from('issue-attachments').upload(path, file);
  if (error) throw error;
  return path;
}

export async function attachIssuePhoto(issueId: string, storagePath: string): Promise<void> {
  const { error } = await client().from('issue_attachments').insert({ issue_id: issueId, storage_path: storagePath });
  if (error) throw error;
}

export async function verifyIssue(issueId: string): Promise<void> {
  const { error } = await client().rpc('verify_issue', { p_issue_id: issueId });
  if (error) throw error;
}

// Staff-only: relies on the `issues_select_staff` RLS policy, which returns
// every row (not just the caller's own) when profiles.role is a staff role.
export async function fetchAllIssuesForStaff(): Promise<Issue[]> {
  const { data, error } = await client()
    .from('issues')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Issue[];
}

export interface IssueUpdateInput {
  status?: IssueStatus;
  ownerRole?: UserRole;
  resolutionNote?: string;
}

// Staff-only: relies on the `issues_update_staff` RLS policy.
export async function updateIssue(issueId: string, input: IssueUpdateInput): Promise<Issue> {
  const patch: Record<string, unknown> = {};
  if (input.status !== undefined) patch.status = input.status;
  if (input.ownerRole !== undefined) patch.owner_role = input.ownerRole;
  if (input.resolutionNote !== undefined) patch.resolution_note = input.resolutionNote;

  const { data, error } = await client()
    .from('issues')
    .update(patch)
    .eq('id', issueId)
    .select('*')
    .single();
  if (error) throw error;
  return data as Issue;
}

export async function fetchPublicStats(): Promise<PublicStats> {
  const { data, error } = await client().from('public_stats').select('*').single();
  if (error) throw error;
  return data as PublicStats;
}

export async function fetchPublicIssues(limit = 200): Promise<PublicIssue[]> {
  const { data, error } = await client()
    .from('issues_public')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as PublicIssue[];
}

export async function fetchAnnouncements(limit = 20): Promise<Announcement[]> {
  const { data, error } = await client()
    .from('announcements')
    .select('*')
    .order('published_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as Announcement[];
}

export async function fetchAllBadges(): Promise<Badge[]> {
  const { data, error } = await client().from('badges').select('*').order('label');
  if (error) throw error;
  return (data ?? []) as Badge[];
}

interface UserBadgeRow {
  badges: { code: string } | null;
}

export async function fetchMyBadgeCodes(userId: string): Promise<Set<string>> {
  const { data, error } = await client()
    .from('user_badges')
    .select('badges(code)')
    .eq('user_id', userId);
  if (error) throw error;
  const codes = new Set<string>();
  for (const row of (data ?? []) as unknown as UserBadgeRow[]) {
    if (row.badges?.code) codes.add(row.badges.code);
  }
  return codes;
}

export async function fetchLeaderboard(limit = 10): Promise<LeaderboardEntry[]> {
  const { data, error } = await client().from('leaderboard').select('*').limit(limit);
  if (error) throw error;
  return (data ?? []) as LeaderboardEntry[];
}

export async function fetchNotifications(userId: string, limit = 30): Promise<Notification[]> {
  const { data, error } = await client()
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as Notification[];
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  const { error } = await client()
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId);
  if (error) throw error;
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const { error } = await client()
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('read_at', null);
  if (error) throw error;
}
