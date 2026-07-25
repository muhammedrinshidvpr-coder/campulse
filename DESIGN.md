# Design Document

This document outlines the UI/UX design for the AURA Campus Response and Action System.

## 1. Design Principles

The design of AURA will be guided by the following principles from the PRD:

- **Trust before features:** The design should feel secure, private, and reliable.
- **Visible action over hidden processing:** Users should always be aware of the status of their issues.
- **Simple input, strong accountability:** The process of submitting an issue should be effortless, but the tracking should be robust.
- **Anonymous by default when needed:** Anonymity should be a clear and easy choice.
- **Make participation feel meaningful:** The design should encourage and reward user engagement.
- **Calm and non-intimidating interface:** The UI should be clean, with a gentle color palette and clear typography.

## 2. Brand Concept & Tagline

* **Concept:** Bringing the invisible into the light. Aura visualizes the unseen pulse of the campus, transforming quiet feedback into clear, visible action.
* **Tagline:** "See the change. Shape the campus."

## 3. Color Palette (Modern, Trustworthy, High-Contrast)

| Role | Color Name | Hex Code | Tailwind Class | UI Application |
| --- | --- | --- | --- | --- |
| **Primary Base** | Deep Midnight | `#0F172A` | `bg-slate-900` | Main navigation, footer, primary text. Provides a strong, serious foundation. |
| **Trust Accent** | Vivid Cyan | `#06B6D4` | `bg-cyan-500` | Primary buttons, active tabs, progress bars. Represents clarity and transparency. |
| **Action Accent** | Coral Energy | `#F43F5E` | `bg-rose-500` | "Urgent" tags, SOS functions, critical alerts. Demands attention without panic. |
| **Surface** | Ghost White | `#F8FAFC` | `bg-slate-50` | The main application background. Keeps the UI feeling light and breathable. |
| **Cards** | Pure White | `#FFFFFF` | `bg-white` | Issue cards, submission forms, and dashboard widgets. |

## 4. Typography

* **Primary Typeface (Headers & Logo):** **Space Grotesk**
* *Why:* It has a slightly technical, structured feel that communicates "system" and "accountability."
* *Usage:* Logo, H1/H2 tags, and the main metrics on the Transparency Board. Use **Bold (700)**.

* **Secondary Typeface (Body & UI text):** **Inter**
* *Why:* The industry standard for highly readable, dense UI design.
* *Usage:* Submission forms, issue descriptions, tags, and buttons. Use **Regular (400)** and **Medium (500)**.

## 5. UI/UX Style Guidelines

* **The "Glass" Effect:** For the Transparency Board, use subtle glassmorphism (translucency + background blur) on top-level metrics to visually reinforce the theme of "transparency."
* **Card Styling:** Keep cards flat with very soft borders (`border-slate-200`) and apply a slight shadow (`shadow-sm`) only on hover states to make the interface feel interactive and alive.
* **Progress Tracking:** Visualize the "Trust Loop" using bold, stepped progress bars on every issue card (e.g., *Submitted -> Assigned -> Resolved*). Make the current state Vivid Cyan and the pending states muted gray.
* **Microcopy:** Use definitive, action-oriented language. For example, "Report Issue" instead of "Submit Form," and "Campus Pulse" instead of "Dashboard."

## 6. Information Architecture / Navigation

The application will feature the following main "windows" or navigation items, catering to both students and administrators:

### Student Facing:
1.  **Home:** Personalized overview, quick access to common actions.
2.  **Report an Issue:** Interface for submitting new issues (safety, facilities, etc.).
3.  **My Reports:** View and track the status of personally submitted issues.
4.  **Campus Feed:** A feed of campus-wide announcements and resolved issues.
5.  **Polls & Suggestions:** Platform for campus-wide polls and general suggestions.
6.  **Events:** Information on upcoming campus events.
7.  **Rewards & Recognition:** Display of earned badges, ranks, and contributions.
8.  **Transparency Board:** Public-facing dashboard of campus issues and resolutions (shared with Admin).
9.  **Notifications:** In-app alerts for updates on reports, announcements, etc.
10. **Profile:** User settings, personal information, and preferences.
11. **Help & Support:** Resources and FAQs for using the platform.
12. **Settings:** General application settings.

### Administrator Facing (access to specific sections with elevated privileges):
-   **Campus Pulse (Admin View):** The primary dashboard for administrators to triage, assign, and manage issues.
-   **Transparency Board (Admin View):** Same public view, but with admin controls/insights.
-   **User Management:** (Implied) To manage user roles and access.
-   **Content Management:** (Implied) For Campus Feed, Polls, Events, Rewards.

## 7. Wireframes (ASCII Art)

### 7.1. Student: Report an Issue Page

```
+--------------------------------------------------+
| AURA - Report an Issue                           |
+--------------------------------------------------+
|                                                  |
|  [Issue Type Dropdown v]                         |
|  (e.g., Safety, Facilities, Academics)           |
|                                                  |
|  [Location Dropdown v]                           |
|  (e.g., Library, Hostel A, Main Building)        |
|                                                  |
|  [Urgency Selector]                              |
|  ( ) Low   ( ) Medium   (x) High                 |
|                                                  |
|  [Short Description Textarea]                    |
|  |                                             |  |
|  |                                             |  |
|                                                  |
|  [Upload Image Button]                           |
|                                                  |
|  [x] Submit Anonymously                          |
|                                                  |
|  +------------------+                            |
|  |   Report Issue   |                            |
|  +------------------+                            |
|                                                  |
+--------------------------------------------------+
```

### 7.2. Student: My Reports Page

```
+--------------------------------------------------+
| AURA - My Reports                                |
+--------------------------------------------------+
|                                                  |
|  +--------------------------------------------+  |
|  | Broken light in library - #AURA123         |  |
|  | [Submitted -> Assigned -> In Progress]     |  |
|  +--------------------------------------------+  |
|                                                  |
|  +--------------------------------------------+  |
|  | Water leakage in Hostel A - #AURA122       |  |
|  | [Submitted -> Assigned -> Resolved]        |  |
|  +--------------------------------------------+  |
|                                                  |
|  +--------------------------------------------+  |
|  | Suggestion for more books - #AURA121       |  |
|  | [Submitted -> Acknowledged]                |  |
|  +--------------------------------------------+  |
|                                                  |
+--------------------------------------------------+
```

### 7.3. Admin: Campus Pulse

```
+--------------------------------------------------+
| AURA - Campus Pulse (Admin View)                 |
+--------------------------------------------------+
|                                                  |
|  Filters: [Urgency v] [Category v] [Status v]    |
|                                                  |
|  +--------------------------------------------+  |
|  | #AURA123 - High - Broken light in library  |  |
|  | Assign to: [Facilities Dept v] [Assign]    |  |
|  +--------------------------------------------+  |
|                                                  |
|  +--------------------------------------------+  |
|  | #AURA121 - Low - Suggestion for more books |  |
|  | Assign to: [Library Committee v] [Assign]  |  |
|  +--------------------------------------------+  |
|                                                  |
+--------------------------------------------------+
```

### 7.4. Public: Campus Pulse

```
+--------------------------------------------------+
| AURA - Campus Pulse (Public View)                |
+--------------------------------------------------+
|                                                  |
|  +-----------------+ +------------------------+  |
|  | Total Issues    | | Resolution Rate        |  |
|  |      452        | |          85%           |  |
|  +-----------------+ +------------------------+  |
|                                                  |
|  +-----------------+ +------------------------+  |
|  | Avg. Response   | | Top Issue Category     |  |
|  |      2.5 days     | |      Facilities        |  |
|  +-----------------+ +------------------------+  |
|                                                  |
|  Recent Activity:                                |
|  - Water leakage in Hostel A was resolved.       |
|  - New suggestion for library books acknowledged.|
|                                                  |
+--------------------------------------------------+
```

## 8. Component Library

To ensure a consistent and maintainable frontend, we will build a library of reusable React components.

- **`Button`**: Primary, secondary, and tertiary styles.
- **`Input`**: Text, textarea, and file inputs.
- **`Dropdown`**: For selecting options.
- **`Checkbox`**: For binary choices.
- **`RadioGroup`**: For single selection from a list.
- **`Card`**: To display information in a structured way (e.g., issue cards).
- **`Tag`**: To display status, urgency, or category.
- **`Navbar`**: The main navigation bar.
- **`Sidebar`**: For admin panel navigation.
- **`Modal`**: For confirmations and dialogues.
- **`Notification`**: For showing success or error messages.
- **`Spinner`**: To indicate loading states.
- **`DashboardMetric`**: A component to display a single metric on the dashboard.
