# Product Requirements Document (PRD)

## Product Name
AURA Campus Response and Action System

## One-line Description
A campus accountability platform that converts student feedback into visible action, trust, and participation.

## Problem Statement
Most campus platforms collect complaints and suggestions, but they do not create trust. Students often feel invisible because their feedback disappears into a black box. The result is low participation, low confidence in administration, fragmented communication, and weak campus well-being.

The deeper problem is not lack of communication. It is the voice-to-action gap: students speak, but they do not see outcomes.

## Product Vision
Create a campus system where every student voice can be safely submitted, tracked, verified, and converted into visible action. The platform should make campus decision-making more transparent, inclusive, and accountable.

## Product Goals
1. Help students report issues without fear.
2. Show clear status and ownership for every issue.
3. Surface patterns across repeated problems.
4. Build trust through visible action and response time.
5. Increase student engagement by rewarding meaningful participation.

## Non-Goals
- Replacing the full college ERP system.
- Managing every administrative workflow in the institution.
- Building a generic chatbot.
- Building a simple complaint form with no tracking or accountability.

## Target Users

### Primary Users
- Students

### Secondary Users
- Faculty
- Department coordinators
- Hostel wardens
- Campus administrators
- Student union representatives

## Core User Problems

### Students
- Do not know whether complaints are read.
- Fear retaliation or embarrassment.
- Feel ignored after giving feedback.
- Miss important campus updates due to fragmented channels.
- Do not see proof that anything changed.

### Faculty / Administrators
- Receive scattered complaints from multiple channels.
- Cannot easily prioritise urgent issues.
- Do not see trends across departments.
- Lack a simple workflow to assign ownership and close the loop.

## Product Principles
1. Trust before features
2. Visible action over hidden processing
3. Simple input, strong accountability
4. Anonymous by default when needed
5. Track everything, but reveal only what should be visible
6. Make participation feel meaningful

## Key Hypothesis
If students can submit issues safely and see verified progress publicly, they will trust the system more and participate more often.

## Solution Overview
AURA is a student engagement and campus well-being platform with four major layers:

1. Signal Capture
   Students submit complaints, suggestions, safety concerns, or ideas through a structured interface.

2. Trust Layer
   The system protects anonymity, shows confirmation, and communicates expected response timelines.

3. Action Layer
   Issues are routed to the right owner with status tracking, deadlines, and escalation.

4. Visibility Layer
   Students can see what was reported, what changed, what is pending, and what patterns are emerging.

## Core Features

### 1) Safe Issue Submission
Students can report:
- safety concerns
- facility problems
- harassment or discomfort
- academic friction
- event or engagement issues
- accessibility barriers
- anonymous suggestions

Submission fields:
- issue type
- location
- urgency
- optional image
- optional anonymous mode
- short description

### 2) Status Tracking
Every issue has a clear lifecycle:
- Submitted
- Acknowledged
- Assigned
- In Progress
- Resolved
- Verified

### 3) Ownership and Escalation
Each issue is assigned to a specific role:
- faculty coordinator
- hostel warden
- admin staff
- student affairs office

If an issue remains unresolved beyond a threshold, it escalates automatically.

### 4) Campus Transparency Dashboard
A public-facing dashboard shows:
- number of issues reported
- resolution rate
- average response time
- top recurring issue categories
- issues resolved this week
- open issues by area

No sensitive identity data is shown publicly.

### 5) Pattern Detection
The system groups repeated reports by:
- location
- category
- time
- department
- severity

This helps identify systemic problems instead of isolated incidents.

### 6) Participation Rewards
Students earn non-monetary recognition for:
- constructive suggestions
- verified reporting
- event participation
- community contributions

Rewards may include:
- badges
- campus contributor rank
- participation streaks
- recognition board
- certificates for active civic contribution

### 7) Transparent Announcements
When issues are resolved, the platform broadcasts:
- what changed
- who acted
- when it was completed
- whether the student community can now use it

This closes the loop and builds trust.

## MVP Scope

### Must Have
- student sign-in
- anonymous issue submission
- issue dashboard
- admin panel for assignment and status updates
- public transparency board
- basic analytics
- notifications on issue updates

### Nice to Have
- AI-assisted issue categorisation
- sentiment analysis
- duplicate detection
- automatic escalation
- QR-based issue reporting by location
- smart campus map linking reports to locations

## Future Scope
- integration with college ERP
- safety heatmaps
- multi-language support
- suggestion voting
- faculty response benchmarking
- community engagement scoring

## User Stories

### Student
- As a student, I want to submit an issue anonymously so that I can report safely.
- As a student, I want to see the status of my issue so that I know it has not disappeared.
- As a student, I want to know when an issue is resolved so that I trust the system.
- As a student, I want to see recurring issues so that I know my campus is improving.

### Administrator
- As an administrator, I want to see all incoming issues in one place so that I can respond efficiently.
- As an administrator, I want to assign issues to the right person so that nothing gets lost.
- As an administrator, I want to see unresolved trends so that I can act on root causes.

### Faculty / Coordinator
- As a faculty member, I want to receive issues relevant to my area so that I can resolve them quickly.
- As a faculty member, I want clear deadlines so that responsibility is obvious.

## Functional Requirements
1. Users can create an issue in under 60 seconds.
2. Anonymous mode must be available.
3. Every issue must receive a unique tracking ID.
4. Admins must be able to update issue status.
5. Students must be able to view issue progress.
6. Dashboard must show aggregate trends.
7. System must send notifications on key state changes.
8. Issues must support attachments such as images.
9. System must prevent duplicate spam.
10. System must retain an audit trail of changes.

## Non-Functional Requirements
1. Fast load times on low-end devices.
2. Mobile-first design.
3. Accessible UI with clear contrast and large touch targets.
4. Secure storage of user data.
5. Role-based access control.
6. Reliable offline-friendly submission fallback if possible.
7. Minimal setup for administrators.

## Success Metrics

### Product Metrics
- Issue submission completion rate
- Percentage of issues acknowledged within SLA
- Percentage of issues resolved
- Average resolution time
- Repeat issue reduction
- Student engagement rate

### Trust Metrics
- Percentage of students who say the system is trustworthy
- Percentage of students who believe feedback leads to action
- Usage frequency by repeat users

### Campus Impact Metrics
- Number of systemic issues identified
- Number of campus improvements visible to students
- Reduction in unresolved recurring complaints

## UX Requirements

### Student Experience
- Simple, calm, and non-intimidating interface
- Clear confirmation after submission
- Visible progress tracker
- No bureaucratic language
- Must feel safe, not punitive

### Admin Experience
- Clean triage queue
- Filters by urgency, category, and department
- One-click assignment
- Status updates with notes
- Resolution closure workflow

## Information Architecture

### Student Side
- Home
- Submit Issue
- My Reports
- Campus Updates
- Rewards / Contribution
- Safety / Help

### Admin Side
- Issue Queue
- Assignment Panel
- Escalations
- Analytics Dashboard
- Resolution Log
- User / Role Management

## Data Model

### Issue
- issue_id
- title
- description
- category
- urgency
- location
- anonymised_flag
- attachments
- submitted_at
- status
- owner_role
- owner_name
- escalation_level
- resolution_note
- verified_by_student
- closed_at

### User
- user_id
- role
- department
- anonymity_preferences
- contribution_score

## Technical Strategy

### Frontend
- Responsive web app or mobile-first PWA

### Backend
- Authentication — Supabase Auth
- Issue storage — Supabase Postgres
- Role-based routing — Postgres Row Level Security (RLS) policies
- Notification engine — Supabase Realtime + Edge Functions
- Status update API — Supabase auto-generated REST (PostgREST) + Edge Functions
- Analytics aggregation — Postgres views

See `ARCHITECTURE.md` for the full technical design.

### AI Layer
- Categorise incoming issues
- Detect duplicates
- Suggest priority
- Summarise issue clusters
- Flag repeated patterns

### Security
- Authentication for admins
- Anonymous submissions for students
- Role-based permissions
- Audit logging
- Data minimisation for sensitive submissions

## Risks
1. Students may still not trust the system.
2. Admins may ignore unresolved cases.
3. Anonymous reporting may be misused.
4. Too many features could reduce clarity.
5. Poor implementation could make the platform look like another complaint form.

## Mitigations
1. Show visible closure for every issue.
2. Enforce deadlines and escalation.
3. Add anti-spam and duplicate controls.
4. Keep the first version focused.
5. Prioritise trust UX over feature count.

## Differentiator
This is not a complaint app.

It is a campus accountability system that makes student voice visible, trackable, and actionable.

That difference is what makes it judge-worthy.

## Demo Story
A student reports an unsafe staircase or a repeated water issue anonymously. The system assigns it to the correct authority, shows live status, and later displays a verified resolution update on the campus transparency board. Students see proof that speaking up changed something. Trust grows. Engagement rises.

## Final Product Outcome
The platform should make students feel:
- heard
- safe
- respected
- included
- able to shape campus life

That is the real win.
