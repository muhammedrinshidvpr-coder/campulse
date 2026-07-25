import type { IssueCategory, IssueStatus, IssueUrgency } from './types';

export const CATEGORIES: { value: IssueCategory; label: string }[] = [
  { value: 'facilities', label: 'Facilities & Maintenance' },
  { value: 'safety', label: 'Safety & Security' },
  { value: 'academics', label: 'Academics' },
  { value: 'accessibility', label: 'Accessibility' },
  { value: 'harassment', label: 'Harassment & Discomfort' },
  { value: 'event', label: 'Event & Engagement' },
  { value: 'suggestion', label: 'Suggestion' },
];

export const CATEGORY_LABELS = Object.fromEntries(
  CATEGORIES.map((c) => [c.value, c.label])
) as Record<IssueCategory, string>;

export const URGENCY_LEVELS: { value: IssueUrgency; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Med' },
  { value: 'high', label: 'High' },
];

export const STATUS_STEPS: IssueStatus[] = [
  'submitted',
  'acknowledged',
  'assigned',
  'in_progress',
  'resolved',
  'verified',
];

export const STATUS_LABELS: Record<IssueStatus, string> = {
  submitted: 'Submitted',
  acknowledged: 'Acknowledged',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  verified: 'Verified',
};

const XP_PER_LEVEL = 300;

export function levelFromScore(score: number) {
  const level = Math.floor(score / XP_PER_LEVEL) + 1;
  const currentLevelXp = score - (level - 1) * XP_PER_LEVEL;
  return { level, currentLevelXp, xpForNextLevel: XP_PER_LEVEL };
}

export function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
