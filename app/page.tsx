"use client";

import { useEffect, useMemo, useState } from 'react';
import { isAuthApiError, type Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import type {
  Announcement,
  Badge,
  Issue,
  IssueCategory,
  IssueStatus,
  IssueUrgency,
  LeaderboardEntry,
  Profile,
  PublicIssue,
  PublicStats,
} from '@/lib/types';
import {
  CATEGORIES,
  CATEGORY_LABELS,
  STATUS_LABELS,
  STATUS_STEPS,
  URGENCY_LEVELS,
  levelFromScore,
  timeAgo,
} from '@/lib/constants';
import {
  attachIssuePhoto,
  fetchAllBadges,
  fetchAnnouncements,
  fetchLeaderboard,
  fetchMyBadgeCodes,
  fetchMyIssues,
  fetchProfile,
  fetchPublicIssues,
  fetchPublicStats,
  submitIssue,
  uploadIssuePhoto,
  verifyIssue,
} from '@/lib/queries';
import {
  Activity,
  AlertCircle,
  BadgeCheck,
  BarChart3,
  Bell,
  Check,
  CheckCircle2,
  ChevronRight,
  Flame,
  Home as HomeIcon,
  Image as ImageIcon,
  Lock,
  LogOut,
  MapPin,
  Megaphone,
  Menu,
  MessageSquare,
  Plus,
  Search,
  Shield,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Trophy,
  X,
  Zap,
  type LucideIcon,
} from 'lucide-react';

const cn = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(' ');

function AppleButton({ children, className = '', variant = 'primary', size = 'md', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger'; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = { sm: 'px-3 py-1.5 text-xs rounded-full', md: 'px-4 py-2.5 text-sm rounded-full', lg: 'px-6 py-3.5 text-base rounded-2xl' };
  const variants = { primary: 'bg-sky-600 text-white hover:bg-sky-700 shadow-sm', secondary: 'bg-slate-100 text-slate-800 hover:bg-slate-200', ghost: 'bg-transparent text-slate-700 hover:bg-slate-100', danger: 'bg-rose-600 text-white hover:bg-rose-700 shadow-sm' };

  return (
    <button className={cn('relative inline-flex items-center justify-center font-medium transition-all active:scale-[0.97] disabled:opacity-60 disabled:pointer-events-none', sizeClasses[size], variants[variant], className)} {...props}>
      {children}
    </button>
  );
}

function AppleCard({ children, className = '', glow = false }: { children: React.ReactNode; className?: string; glow?: boolean }) {
  return <div className={cn('rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm sm:p-6', glow && 'shadow-[0_8px_30px_rgba(2,132,199,0.12)]', className)}>{children}</div>;
}

function Pill({ children, color = 'blue' }: { children: React.ReactNode; color?: 'blue' | 'red' | 'gray' | 'green' }) {
  const colorClasses = { blue: 'bg-sky-100 text-sky-700', red: 'bg-rose-100 text-rose-700', gray: 'bg-slate-100 text-slate-700', green: 'bg-emerald-100 text-emerald-700' };
  return <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium tracking-wide', colorClasses[color])}>{children}</span>;
}

function XPBar({ current, max, level }: { current: number; max: number; level: number }) {
  const percentage = Math.min(100, Math.max(0, (current / max) * 100));
  return (
    <div className="w-full">
      <div className="mb-2 flex items-end justify-between text-sm font-medium tracking-tight">
        <span className="flex items-center gap-1.5 text-slate-900"><Zap className="h-4 w-4 fill-sky-500 text-sky-500" /> Level {level}</span>
        <span className="text-slate-500">{current} / {max} XP</span>
      </div>
      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-sky-600" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

function QuestStepper({ steps, currentStep }: { steps: string[]; currentStep: number }) {
  return (
    <div className="relative flex flex-col gap-3">
      <div className="absolute left-[11px] top-3 bottom-3 w-[2px] -z-10 bg-slate-200" />
      {steps.map((step, idx) => {
        const isCompleted = idx < currentStep;
        const isCurrent = idx === currentStep;
        return (
          <div key={step} className={cn('flex items-center gap-4', isCompleted || isCurrent ? 'opacity-100' : 'opacity-40')}>
            <div className={cn('z-10 flex h-6 w-6 items-center justify-center rounded-full transition-colors', isCompleted ? 'bg-sky-600 text-white' : isCurrent ? 'border-2 border-sky-600 bg-white shadow-[0_0_0_4px_rgba(2,132,199,0.1)]' : 'bg-slate-100 text-slate-500')}>
              {isCompleted && <Check className="h-3.5 w-3.5" />}
              {isCurrent && <div className="h-2 w-2 rounded-full bg-sky-600" />}
            </div>
            <span className={cn('text-sm tracking-tight', isCurrent ? 'font-semibold text-slate-900' : 'font-medium text-slate-500')}>{step}</span>
          </div>
        );
      })}
    </div>
  );
}

function AuthScreen() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [resending, setResending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setError('Supabase is not configured. Add your project URL and anon key to .env.local.');
      return;
    }
    setLoading(true);
    setError(null);
    setInfo(null);
    setNeedsConfirmation(false);
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        });
        if (error) throw error;
        if (!data.session) {
          setInfo('Account created. Check your email (including spam) for a confirmation link, then sign in.');
          setMode('signin');
        }
      }
    } catch (err) {
      if (isAuthApiError(err) && err.code === 'email_not_confirmed') {
        setError("This email hasn't been confirmed yet. Check your inbox for the confirmation link, or resend it below.");
        setNeedsConfirmation(true);
      } else if (isAuthApiError(err) && (err.code === 'user_already_exists' || err.code === 'email_exists')) {
        setError('An account with this email already exists — try signing in instead.');
        setMode('signin');
      } else if (isAuthApiError(err) && err.code === 'over_email_send_rate_limit') {
        setError('Too many emails sent to this address recently. Wait a bit and try again.');
      } else {
        setError(err instanceof Error ? err.message : 'Something went wrong.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!supabase || !email) return;
    setResending(true);
    setError(null);
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email });
      if (error) throw error;
      setInfo('Confirmation email resent. Check your inbox (and spam).');
      setNeedsConfirmation(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not resend the confirmation email.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 to-transparent" />
      <div className="relative z-10 flex w-full max-w-md flex-col items-center rounded-[28px] border border-slate-200/70 bg-white p-8 shadow-[0_8px_40px_rgba(0,0,0,0.04)] sm:p-10">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-sky-600 shadow-md"><Activity className="h-8 w-8 text-white" /></div>
        <h1 className="mb-2 text-3xl font-semibold tracking-tight text-slate-900">AURA</h1>
        <p className="mb-8 text-center text-sm tracking-tight text-slate-500">See the change. Shape the campus.</p>
        <form className="w-full space-y-4" onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <input type="text" required placeholder="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 transition-all placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-200" />
          )}
          <input type="email" required placeholder="Student Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 transition-all placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-200" />
          <input type="password" required minLength={6} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 transition-all placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-200" />
          {error && <p className="rounded-xl bg-rose-50 px-4 py-2.5 text-xs font-medium text-rose-700">{error}</p>}
          {needsConfirmation && (
            <button type="button" onClick={handleResend} disabled={resending} className="w-full text-center text-xs font-medium text-sky-700 hover:underline disabled:opacity-60">
              {resending ? 'Resending…' : 'Resend confirmation email'}
            </button>
          )}
          {info && <p className="rounded-xl bg-sky-50 px-4 py-2.5 text-xs font-medium text-sky-700">{info}</p>}
          <AppleButton type="submit" className="mt-2 w-full" size="lg" disabled={loading}>
            {loading ? 'Please wait…' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </AppleButton>
        </form>
        <button
          onClick={() => {
            setMode(mode === 'signin' ? 'signup' : 'signin');
            setError(null);
            setInfo(null);
            setNeedsConfirmation(false);
          }}
          className="mt-5 text-xs font-medium text-sky-700 hover:underline"
        >
          {mode === 'signin' ? 'New here? Create an account' : 'Already have an account? Sign in'}
        </button>
        <div className="mt-8 w-full text-center"><p className="flex items-center justify-center gap-1.5 text-xs font-medium text-slate-500"><Shield className="h-3.5 w-3.5" /> Your campus. Your voice. Protected.</p></div>
      </div>
    </div>
  );
}

function HomeScreen({ onNavigate, profile }: { onNavigate: (screen: string) => void; profile: Profile | null }) {
  const [supabaseStatus, setSupabaseStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [supabaseMessage, setSupabaseMessage] = useState('Checking your Supabase connection…');
  const [recentIssues, setRecentIssues] = useState<Issue[]>([]);
  const [stats, setStats] = useState<PublicStats | null>(null);

  useEffect(() => {
    let isActive = true;

    const runCheck = async () => {
      if (!supabase) {
        if (!isActive) return;
        setSupabaseStatus('error');
        setSupabaseMessage('Supabase credentials are missing. Add your URL and anon key to the environment file.');
        return;
      }

      try {
        const { error } = await supabase.from('issues').select('id').limit(1);

        if (!isActive) return;

        if (error) {
          setSupabaseStatus('error');
          setSupabaseMessage(`Connected, but the schema isn't ready: ${error.message}`);
        } else {
          setSupabaseStatus('connected');
          setSupabaseMessage('Connected to Supabase and live with real data.');
        }
      } catch (error) {
        if (!isActive) return;
        setSupabaseStatus('error');
        setSupabaseMessage(error instanceof Error ? error.message : 'Unable to reach Supabase.');
      }
    };

    runCheck();

    return () => {
      isActive = false;
    };
  }, []);

  const profileId = profile?.id;

  useEffect(() => {
    if (!profileId) return;
    fetchMyIssues(profileId).then((rows) => setRecentIssues(rows.slice(0, 2))).catch(() => {});
  }, [profileId]);

  useEffect(() => {
    fetchPublicStats().then(setStats).catch(() => {});
  }, []);

  const { level, currentLevelXp, xpForNextLevel } = levelFromScore(profile?.contribution_score ?? 0);

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <AppleCard className={cn('border-slate-200/70', supabaseStatus === 'connected' ? 'bg-emerald-50/70' : 'bg-slate-50')}>
        <div className="flex items-start gap-3">
          <div className={cn('mt-0.5 flex h-9 w-9 items-center justify-center rounded-full', supabaseStatus === 'connected' ? 'bg-emerald-100 text-emerald-600' : 'bg-sky-100 text-sky-700')}>
            {supabaseStatus === 'connected' ? <CheckCircle2 className="h-5 w-5" /> : <Shield className="h-5 w-5" />}
          </div>
          <div>
            <p className="text-sm font-semibold tracking-tight text-slate-900">{supabaseStatus === 'connected' ? 'Supabase connection is live' : 'Checking Supabase connection'}</p>
            <p className="mt-1 text-sm text-slate-600">{supabaseMessage}</p>
          </div>
        </div>
      </AppleCard>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Hey, {profile?.full_name?.split(' ')[0] ?? 'there'} 👋</h2>
          <p className="mt-1 text-sm tracking-tight text-slate-500">Campus Voice Level {level}</p>
        </div>
      </div>
      <AppleCard><XPBar current={currentLevelXp} max={xpForNextLevel} level={level} /></AppleCard>
      <div className="grid grid-cols-2 gap-4">
        <button onClick={() => onNavigate('report')} className="flex flex-col items-start gap-4 rounded-2xl bg-sky-600 p-5 text-white shadow-sm transition-transform active:scale-95"><div className="rounded-full bg-white/20 p-2.5"><AlertCircle className="h-5 w-5" /></div><span className="font-medium tracking-tight">Report</span></button>
        <button onClick={() => onNavigate('feed')} className="flex flex-col items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-sm transition-transform active:scale-95"><div className="rounded-full bg-sky-100 p-2.5 text-sky-700"><MessageSquare className="h-5 w-5" /></div><span className="font-medium tracking-tight">Feed</span></button>
      </div>
      <AppleCard className="border-none bg-gradient-to-br from-sky-600 to-indigo-600 text-white">
        <div className="mb-6 flex items-start justify-between"><h3 className="flex items-center gap-2 text-sm font-medium text-white/90"><BarChart3 className="h-4 w-4" /> Pulse Widget</h3><span className="rounded-full bg-white/20 px-2 py-1 text-xs font-semibold">Live</span></div>
        <div className="flex items-end gap-6">
          <div><div className="text-4xl font-semibold tracking-tighter">{stats?.resolution_rate_pct != null ? `${stats.resolution_rate_pct}%` : '—'}</div><div className="mt-1 text-xs font-medium text-white/70">Resolution Rate</div></div>
          <div><div className="text-4xl font-semibold tracking-tighter">{stats?.resolved_issues ?? '—'}</div><div className="mt-1 text-xs font-medium text-white/70">Resolved</div></div>
        </div>
      </AppleCard>
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold tracking-tight text-slate-900">Recent Activity</h3>
          <button onClick={() => onNavigate('my-reports')} className="text-xs font-medium text-sky-700 hover:underline">View all</button>
        </div>
        <div className="space-y-3">
          {recentIssues.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">No reports yet. Your first one earns a badge.</div>
          ) : (
            recentIssues.map((issue) => (
              <button key={issue.id} onClick={() => onNavigate('my-reports')} className="flex w-full items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm">
                <div className={cn('flex h-10 w-10 items-center justify-center rounded-full', issue.status === 'resolved' || issue.status === 'verified' ? 'bg-emerald-100 text-emerald-600' : 'bg-sky-100 text-sky-700')}>
                  {issue.status === 'resolved' || issue.status === 'verified' ? <CheckCircle2 className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
                </div>
                <div className="flex-1"><p className="text-sm font-medium tracking-tight">{issue.title}</p><p className="mt-0.5 text-xs text-slate-500">{timeAgo(issue.updated_at)} • {STATUS_LABELS[issue.status]}</p></div>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function ReportScreen({
  onNavigate,
  triggerToast,
  profile,
  onProfileChange,
}: {
  onNavigate: (screen: string) => void;
  triggerToast: (message: string) => void;
  profile: Profile | null;
  onProfileChange: () => void;
}) {
  const [category, setCategory] = useState<IssueCategory>('facilities');
  const [location, setLocation] = useState('');
  const [urgency, setUrgency] = useState<IssueUrgency>('medium');
  const [description, setDescription] = useState('');
  const [isAnon, setIsAnon] = useState(true);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Issue | null>(null);

  const handleSubmit = async () => {
    if (!profile) {
      setError('You need to be signed in to report an issue.');
      return;
    }
    if (!description.trim()) {
      setError("Describe what's going on before submitting.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const trimmed = description.trim();
      const title = trimmed.length > 72 ? `${trimmed.slice(0, 72)}…` : trimmed;
      const issue = await submitIssue({
        reporterId: profile.id,
        title,
        description: trimmed,
        category,
        urgency,
        location,
        isAnonymous: isAnon,
      });
      if (photoFile) {
        try {
          const path = await uploadIssuePhoto(profile.id, issue.id, photoFile);
          await attachIssuePhoto(issue.id, path);
        } catch {
          // photo upload is best-effort — the report itself already succeeded
        }
      }
      setResult(issue);
      onProfileChange();
      setTimeout(() => triggerToast('+15 XP Earned!'), 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit your report.');
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-6 text-center">
        <div className="mb-2 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"><Check className="h-12 w-12" /></div>
        <div><h2 className="mb-2 text-3xl font-semibold tracking-tight text-slate-900">Report Live</h2><p className="text-sm font-medium text-slate-500">Tracking ID: <span className="text-sky-600">#{result.tracking_code}</span></p></div>
        <AppleCard className="w-full p-6 text-left"><h3 className="mb-4 text-sm font-semibold tracking-tight text-slate-900">Quest Progress</h3><QuestStepper steps={STATUS_STEPS.map((s) => STATUS_LABELS[s])} currentStep={STATUS_STEPS.indexOf(result.status)} /></AppleCard>
        <AppleButton onClick={() => onNavigate('my-reports')} size="lg" className="w-full">View My Report</AppleButton>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <div><h2 className="text-2xl font-semibold tracking-tight text-slate-900">Report an Issue</h2><p className="mt-1 text-sm text-slate-500">Takes &lt;60s. Your voice shapes campus.</p></div>
      <div className="space-y-5">
        <div className="space-y-1.5">
          <label className="ml-1 text-sm font-medium tracking-tight text-slate-900">Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value as IssueCategory)} className="w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-200">
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="ml-1 text-sm font-medium tracking-tight text-slate-900">Location</label>
          <div className="relative"><MapPin className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400" /><input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. North Library, Floor 2" className="w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 py-3.5 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-200" /></div>
        </div>
        <div className="space-y-1.5">
          <label className="ml-1 text-sm font-medium tracking-tight text-slate-900">Urgency</label>
          <div className="flex rounded-2xl bg-slate-100 p-1">
            {URGENCY_LEVELS.map((u) => (
              <button key={u.value} type="button" onClick={() => setUrgency(u.value)} className={cn('flex-1 rounded-xl py-2 text-sm font-medium transition-colors', urgency === u.value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500')}>
                {u.label}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="ml-1 text-sm font-medium tracking-tight text-slate-900">Description</label>
          <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What's going on?" className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-200" />
        </div>
        <input id="photo-input" type="file" accept="image/*" className="hidden" onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)} />
        <label htmlFor="photo-input" className="flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sky-700 transition-colors hover:bg-sky-50">
          <div className="rounded-full bg-sky-100 p-2.5"><ImageIcon className="h-5 w-5" /></div>
          <span className="text-sm font-medium">{photoFile ? photoFile.name : 'Add Photo (Optional)'}</span>
        </label>
        <AppleCard className="flex items-center justify-between p-4 sm:p-4"><div className="flex items-center gap-3"><div className={cn('flex h-10 w-10 items-center justify-center rounded-full transition-colors', isAnon ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500')}><Shield className="h-5 w-5" /></div><div><div className="text-sm font-semibold tracking-tight text-slate-900">Submit Anonymously</div><div className="mt-0.5 text-xs text-slate-500">Admin sees generic ID</div></div></div><button onClick={() => setIsAnon(!isAnon)} className={cn('flex h-7 w-12 items-center rounded-full p-0.5 transition-colors duration-300', isAnon ? 'bg-emerald-500' : 'bg-slate-400')}><div className={cn('h-6 w-6 rounded-full bg-white shadow-sm transition-transform duration-300', isAnon ? 'translate-x-5' : 'translate-x-0')} /></button></AppleCard>
        {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
        <AppleButton className="w-full" size="lg" onClick={handleSubmit} disabled={submitting}>{submitting ? 'Submitting…' : 'Submit Report'}</AppleButton>
      </div>
    </div>
  );
}

function statusPillColor(status: IssueStatus): 'blue' | 'red' | 'gray' | 'green' {
  if (status === 'resolved' || status === 'verified') return 'green';
  if (status === 'submitted') return 'gray';
  return 'blue';
}

function MyReportsScreen({ profile }: { profile: Profile | null }) {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const profileId = profile?.id;

  useEffect(() => {
    if (!profileId) return;
    fetchMyIssues(profileId)
      .then(setIssues)
      .finally(() => setLoading(false));
  }, [profileId]);

  const handleVerify = async (issueId: string) => {
    if (!profileId) return;
    setBusyId(issueId);
    try {
      await verifyIssue(issueId);
      setIssues(await fetchMyIssues(profileId));
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-sm text-slate-500">Loading your reports…</div>;
  }

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <div><h2 className="text-2xl font-semibold tracking-tight text-slate-900">My Reports</h2><p className="mt-1 text-sm text-slate-500">Every report you&apos;ve filed, tracked end to end.</p></div>
      {issues.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">You haven&apos;t reported anything yet.</div>
      ) : (
        <div className="space-y-4">
          {issues.map((issue) => (
            <AppleCard key={issue.id}>
              <div className="mb-4 flex items-start justify-between gap-3">
                <div><h3 className="text-base font-semibold tracking-tight text-slate-900">{issue.title}</h3><p className="mt-0.5 text-xs text-slate-500">#{issue.tracking_code} • {CATEGORY_LABELS[issue.category]}</p></div>
                <Pill color={statusPillColor(issue.status)}>{STATUS_LABELS[issue.status]}</Pill>
              </div>
              <QuestStepper steps={STATUS_STEPS.map((s) => STATUS_LABELS[s])} currentStep={STATUS_STEPS.indexOf(issue.status)} />
              {issue.status === 'resolved' && !issue.verified_by_student && (
                <AppleButton className="mt-5 w-full" onClick={() => handleVerify(issue.id)} disabled={busyId === issue.id}>
                  {busyId === issue.id ? 'Confirming…' : "Confirm it's fixed"}
                </AppleButton>
              )}
            </AppleCard>
          ))}
        </div>
      )}
    </div>
  );
}

function FeedScreen() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [resolvedIssues, setResolvedIssues] = useState<PublicIssue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [ann, issues] = await Promise.all([fetchAnnouncements(), fetchPublicIssues()]);
        setAnnouncements(ann);
        setResolvedIssues(issues.filter((i) => i.status === 'resolved' || i.status === 'verified'));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const items: Array<{ id: string; title: string; body: string; date: string; verified: boolean }> =
    announcements.length > 0
      ? announcements.map((a) => ({ id: a.id, title: a.title, body: a.body, date: a.published_at, verified: true }))
      : resolvedIssues.slice(0, 10).map((i) => ({
          id: i.id,
          title: i.title,
          body: `#${i.tracking_code} in ${CATEGORY_LABELS[i.category]}${i.location ? ` • ${i.location}` : ''} has been marked ${STATUS_LABELS[i.status].toLowerCase()}.`,
          date: i.updated_at,
          verified: i.status === 'verified',
        }));

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <div className="flex items-center justify-between"><h2 className="text-2xl font-semibold tracking-tight text-slate-900">Campus Feed</h2><div className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm"><Search className="h-4 w-4 text-slate-500" /></div></div>
      {loading ? (
        <div className="py-20 text-center text-sm text-slate-500">Loading the feed…</div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">No public updates yet. Be the first to report something.</div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <AppleCard key={item.id}>
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100"><CheckCircle2 className="h-5 w-5 text-emerald-600" /></div><div><h4 className="text-sm font-semibold tracking-tight text-slate-900">Resolution</h4><p className="mt-0.5 text-xs text-slate-500">{timeAgo(item.date)}</p></div></div>
                {item.verified && <Pill color="green">Verified</Pill>}
              </div>
              <h3 className="mb-2 text-base font-semibold tracking-tight text-slate-900">{item.title}</h3>
              <p className="text-sm leading-relaxed text-slate-500">{item.body}</p>
            </AppleCard>
          ))}
        </div>
      )}
    </div>
  );
}

function TransparencyScreen() {
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [issues, setIssues] = useState<PublicIssue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [s, i] = await Promise.all([fetchPublicStats(), fetchPublicIssues()]);
        setStats(s);
        setIssues(i);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const topCategory = useMemo(() => {
    const counts = new Map<IssueCategory, number>();
    for (const i of issues) counts.set(i.category, (counts.get(i.category) ?? 0) + 1);
    let best: IssueCategory | null = null;
    let bestCount = 0;
    for (const [cat, count] of counts) {
      if (count > bestCount) {
        best = cat;
        bestCount = count;
      }
    }
    return best ? CATEGORY_LABELS[best] : '—';
  }, [issues]);

  const trendingLocations = useMemo(() => {
    const counts = new Map<string, number>();
    for (const i of issues) {
      if (!i.location) continue;
      counts.set(i.location, (counts.get(i.location) ?? 0) + 1);
    }
    return [...counts.entries()]
      .filter(([, count]) => count > 1)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [issues]);

  const avgResponseDays = stats?.avg_resolution_hours != null ? (stats.avg_resolution_hours / 24).toFixed(1) : '—';

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <div><h2 className="mb-1 text-2xl font-semibold tracking-tight text-slate-900">Campus Pulse</h2><p className="text-sm text-slate-500">The campus, in numbers.</p></div>
      {loading ? (
        <div className="py-20 text-center text-sm text-slate-500">Crunching campus numbers…</div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4">
            <AppleCard className="aspect-square p-5"><div className="mb-2 text-xs font-semibold uppercase tracking-wider text-sky-700">Total Issues</div><div className="text-4xl font-semibold tracking-tighter text-slate-900">{stats?.total_issues ?? 0}</div></AppleCard>
            <AppleCard className="aspect-square p-5"><div className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-600">Resolution Rate</div><div className="text-4xl font-semibold tracking-tighter text-slate-900">{stats?.resolution_rate_pct ?? 0}<span className="ml-0.5 text-xl text-slate-500">%</span></div></AppleCard>
            <AppleCard className="aspect-square p-5"><div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Avg Response</div><div className="text-4xl font-semibold tracking-tighter text-slate-900">{avgResponseDays}<span className="ml-0.5 text-xl text-slate-500">d</span></div></AppleCard>
            <AppleCard className="aspect-square border-none bg-slate-100 p-5"><div className="mb-2 text-xs font-semibold uppercase tracking-wider text-rose-500">Top Category</div><div className="mt-auto text-2xl font-semibold leading-none tracking-tight text-slate-900">{topCategory}</div></AppleCard>
          </div>
          <AppleCard>
            <h3 className="mb-4 flex items-center gap-2 text-base font-semibold tracking-tight text-slate-900"><TrendingUp className="h-4 w-4 text-sky-700" /> Trending Patterns</h3>
            {trendingLocations.length === 0 ? (
              <p className="text-sm text-slate-500">No repeated locations yet — good sign.</p>
            ) : (
              <div className="space-y-4">
                {trendingLocations.map(([location, count], idx) => (
                  <div key={location} className={cn('flex items-center justify-between', idx < trendingLocations.length - 1 && 'border-b border-slate-200 pb-4')}>
                    <div className="text-sm font-medium text-slate-900">{location}</div>
                    <Pill color={count >= 5 ? 'red' : 'blue'}>{count} Reports</Pill>
                  </div>
                ))}
              </div>
            )}
          </AppleCard>
          <div className="py-8 text-center"><Shield className="mx-auto mb-3 h-8 w-8 text-slate-400 opacity-50" /><p className="text-xs font-medium uppercase tracking-wider text-slate-500">Every report is tracked.<br />Every resolution is visible.</p></div>
        </>
      )}
    </div>
  );
}

const BADGE_ICONS: Record<string, LucideIcon> = {
  megaphone: Megaphone,
  'badge-check': BadgeCheck,
  flame: Flame,
  sparkles: Sparkles,
};

function RewardsScreen({ profile }: { profile: Profile | null }) {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [myBadgeCodes, setMyBadgeCodes] = useState<Set<string>>(new Set());
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const profileId = profile?.id;

  useEffect(() => {
    (async () => {
      try {
        const [allBadges, lb] = await Promise.all([fetchAllBadges(), fetchLeaderboard()]);
        setBadges(allBadges);
        setLeaderboard(lb);
        if (profileId) setMyBadgeCodes(await fetchMyBadgeCodes(profileId));
      } finally {
        setLoading(false);
      }
    })();
  }, [profileId]);

  const { level } = levelFromScore(profile?.contribution_score ?? 0);

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="pointer-events-none absolute right-[-10%] top-[-20%] rotate-12 opacity-5"><Trophy className="h-48 w-48" /></div>
        <div className="relative z-10">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-sky-700">Contribution Score</p>
          <h2 className="mb-4 text-6xl font-semibold tracking-tighter text-slate-900">{profile?.contribution_score ?? 0}<span className="ml-1 text-2xl text-slate-500">XP</span></h2>
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2"><ShieldAlert className="h-4 w-4 text-amber-500" /><span className="text-sm font-semibold tracking-tight text-slate-900">Campus Voice Lvl {level}</span></div>
        </div>
      </div>
      <div>
        <h3 className="mb-4 text-lg font-semibold tracking-tight text-slate-900">Badges</h3>
        {loading ? (
          <p className="text-sm text-slate-500">Loading badges…</p>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {badges.map((badge) => {
              const owned = myBadgeCodes.has(badge.code);
              const Icon = (badge.icon && BADGE_ICONS[badge.icon]) || Trophy;
              return (
                <div key={badge.id} className={cn('flex flex-col items-center gap-3', !owned && 'opacity-40 grayscale')}>
                  <div className={cn('flex h-20 w-20 items-center justify-center rounded-2xl border bg-white transition-transform hover:scale-105', owned ? 'border-sky-200 shadow-[0_4px_20px_rgba(2,132,199,0.15)]' : 'border-slate-200 bg-slate-100')}>
                    {owned ? <Icon className="h-8 w-8 text-sky-700" /> : <Lock className="h-6 w-6 text-slate-500" />}
                  </div>
                  <span className={cn('text-center text-[10px] font-semibold uppercase tracking-wide', owned ? 'text-slate-900' : 'text-slate-500')}>{badge.label}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <AppleCard>
        <h3 className="mb-4 text-lg font-semibold tracking-tight text-slate-900">Leaderboard</h3>
        {leaderboard.length === 0 ? (
          <p className="text-sm text-slate-500">No contributors yet — be the first.</p>
        ) : (
          <div className="space-y-5">
            {leaderboard.map((entry, idx) => (
              <div key={`${entry.display_name}-${idx}`} className="flex items-center justify-between">
                <div className="flex items-center gap-4"><span className={cn('w-5 text-base font-semibold', idx === 0 ? 'text-amber-500' : idx === 1 ? 'text-slate-400' : idx === 2 ? 'text-amber-700' : 'text-slate-300')}>{idx + 1}</span><span className="text-sm font-semibold tracking-tight text-slate-900">{entry.display_name}</span></div>
                <span className="text-sm font-medium text-slate-500">{entry.contribution_score} XP</span>
              </div>
            ))}
          </div>
        )}
      </AppleCard>
    </div>
  );
}

export default function HomePage() {
  const [session, setSession] = useState<Session | null>(null);
  const [profileData, setProfileData] = useState<Profile | null>(null);
  const [authLoading, setAuthLoading] = useState(() => Boolean(supabase));
  const [currentTab, setCurrentTab] = useState('home');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Derived, not stored: profile only ever means something while a session exists,
  // so there's no separate "clear profile on sign-out" state to keep in sync.
  const profile = session?.user ? profileData : null;

  const triggerToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthLoading(false);
    });
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => authListener.subscription.unsubscribe();
  }, []);

  const refreshProfile = async () => {
    if (!session?.user) return;
    try {
      setProfileData(await fetchProfile(session.user.id));
    } catch {
      setProfileData(null);
    }
  };

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) return;
    (async () => {
      try {
        setProfileData(await fetchProfile(userId));
      } catch {
        setProfileData(null);
      }
    })();
  }, [session?.user?.id]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Activity className="h-8 w-8 animate-pulse text-sky-600" />
      </div>
    );
  }

  if (!session) {
    return <AuthScreen />;
  }

  const renderContent = () => {
    switch (currentTab) {
      case 'home': return <HomeScreen onNavigate={setCurrentTab} profile={profile} />;
      case 'report': return <ReportScreen onNavigate={setCurrentTab} triggerToast={triggerToast} profile={profile} onProfileChange={refreshProfile} />;
      case 'my-reports': return <MyReportsScreen profile={profile} />;
      case 'feed': return <FeedScreen />;
      case 'transparency': return <TransparencyScreen />;
      case 'rewards': return <RewardsScreen profile={profile} />;
      default: return <HomeScreen onNavigate={setCurrentTab} profile={profile} />;
    }
  };

  const navItems = [
    { id: 'home', icon: HomeIcon, label: 'Home' },
    { id: 'feed', icon: MessageSquare, label: 'Feed' },
    { id: 'report', icon: Plus, label: 'Report', special: true },
    { id: 'transparency', icon: BarChart3, label: 'Pulse' },
    { id: 'rewards', icon: Trophy, label: 'Rewards' },
  ];

  const firstName = profile?.full_name?.split(' ')[0] ?? 'Voice';

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 md:flex-row">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-slate-50/80 p-4 backdrop-blur-xl md:hidden"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-600 shadow-sm"><Activity className="h-4 w-4 text-white" /></div><span className="text-xl font-semibold tracking-tight">AURA</span></div><div className="flex items-center gap-4"><button className="relative p-1"><Bell className="h-6 w-6 text-slate-700" /><span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full border-2 border-slate-50 bg-rose-500" /></button><button className="p-1" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>{isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}</button></div></div></header>
      {isMobileMenuOpen && (
        <div className="fixed inset-x-0 top-[60px] z-30 border-b border-slate-200 bg-white p-4 shadow-sm md:hidden">
          <p className="mb-3 truncate text-xs font-medium text-slate-400">Signed in as {profile?.full_name || firstName}</p>
          <button className="flex items-center gap-2 text-sm font-medium text-slate-600" onClick={() => { setIsMobileMenuOpen(false); supabase?.auth.signOut(); }}><LogOut className="h-4 w-4" /> Sign Out</button>
        </div>
      )}
      <aside className="fixed left-0 top-0 hidden h-screen w-64 flex-col border-r border-slate-200 bg-white text-slate-900 md:flex">
        <div className="p-6">
          <div className="mb-10 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-600 shadow-sm"><Activity className="h-5 w-5 text-white" /></div><span className="text-2xl font-semibold tracking-tight">AURA</span></div>
          <nav className="space-y-1.5">{navItems.map((item) => <button key={item.id} onClick={() => setCurrentTab(item.id)} className={cn('flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all', currentTab === item.id ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900', item.special && currentTab !== item.id && 'bg-sky-50 text-sky-700 hover:bg-sky-100')}><item.icon className="h-5 w-5" />{item.label}</button>)}</nav>
        </div>
        <div className="mt-auto p-6">
          <p className="mb-3 truncate text-xs font-medium text-slate-400">Signed in as {profile?.full_name || firstName}</p>
          <button className="flex w-full items-center gap-3 text-left text-sm font-medium text-slate-500 transition-colors hover:text-slate-900" onClick={() => supabase?.auth.signOut()}><LogOut className="h-5 w-5" /> Sign Out</button>
        </div>
      </aside>
      <main className="mx-auto flex-1 w-full max-w-3xl p-4 md:ml-64 md:p-8">{renderContent()}</main>
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/80 pb-safe backdrop-blur-xl md:hidden"><div className="flex items-center justify-around px-2 py-2">{navItems.map((item) => { const isActive = currentTab === item.id; return <button key={item.id} onClick={() => setCurrentTab(item.id)} className={cn('relative flex h-14 w-16 flex-col items-center justify-center transition-colors', isActive ? 'text-sky-700' : 'text-slate-500')}>{item.special ? <div className={cn('absolute -top-5 flex h-12 w-12 items-center justify-center rounded-full shadow-md transition-transform', isActive ? 'bg-sky-600 text-white -translate-y-1' : 'border border-slate-200 bg-white text-sky-700 hover:bg-slate-100')}><Plus className="h-6 w-6" /></div> : <><item.icon className={cn('mb-1 h-6 w-6', isActive ? 'fill-sky-100 stroke-sky-700' : 'stroke-slate-500')} strokeWidth={isActive ? 2.5 : 2} /><span className="text-[9px] font-semibold uppercase tracking-wide">{item.label}</span></>}</button>; })}</div></nav>
      {toastMessage ? <div className="fixed bottom-24 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full bg-slate-900 px-5 py-3.5 text-white shadow-lg"><Trophy className="h-4 w-4 text-amber-400" /><span className="text-sm font-medium tracking-tight">{toastMessage}</span></div> : null}
    </div>
  );
}
