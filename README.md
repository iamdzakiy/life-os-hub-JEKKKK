# Life OS Hub - Personal Dashboard

A comprehensive, unified, and highly secure personal dashboard built with Next.js, Firebase, and Google Workspace APIs. Features a premium glassmorphism UI with vibrant gradients and smooth micro-interactions.

## Features

### Command Center
- Daily morning affirmation popup (first login of each day)
- Mood tracker with emoji feedback
- Quick important notes (Sticky Notes widget) with animation
- Habit tracker overview with GitHub-style heat map

### Task Tracker (ClickUp-inspired)
- List view and Kanban board toggle
- Priority tags (low, medium, high)
- Status columns: To Do, In Progress, Review, Done
- Automatic archiving to Firestore when moved to Done
- Smooth slide-out animations when tasks are completed

### Finance Tracker
- CSV import for banking transactions (PapaParse)
- Net Worth tracking with charts
- Income/Expense summaries with gradient colors

### Habit Tracker
- Daily habit tracking with streaks
- GitHub-style habit grid (365-day visualization)
- Custom recurrence intervals

### Agenda Tracker
- Google Calendar integration (two-way sync)
- Event creation and deletion

## Tech Stack

- **Frontend**: Next.js 16 (App Router), Tailwind CSS, Shadcn/ui (Base UI), Framer Motion
- **Backend**: Firebase (Firestore), Firebase Functions
- **Google APIs**: Calendar API, Sheets API
- **Charts**: Recharts

## Authentication

The application uses a **hardcoded credential** system for secure private access:

- **Username**: `Jek`
- **Password**: `JekSelaluBahagiadanTajir`

Session is stored in sessionStorage for security.

## Setup

### 1. Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Required variables:
- Firebase configuration (API key, project ID, etc.)
- Google OAuth credentials (for Calendar API)
- `SHEET_ID` - Google Sheets ID for archiving

### 2. Firebase Setup

1. Create a Firebase project
2. Configure Firestore with `firestore.rules`
3. Deploy Cloud Functions for Google Sheets archiving

### 3. Google API Setup

1. Create a Google Cloud project
2. Enable Calendar API and Sheets API
3. Create OAuth credentials
4. Generate a refresh token for server-side access

### 4. Install Dependencies

```bash
npm install
```

### 5. Run Development Server

```bash
npm run dev
```

## UI/UX Design

- **Base Theme**: Dark Mode (Zinc 950 background)
- **Glassmorphism**: Frosted glass cards with `backdrop-blur-md` and border transparency
- **Premium Gradients**:
  - Aurora Gradient: `from-cyan-500 via-blue-600 to-indigo-600` (Primary)
  - Abundance Gradient: `from-emerald-400 to-teal-600` (Success)
  - Execution Gradient: `from-amber-400 to-orange-600` (Warning/Urgency)
- **Ambient Glow**: Animated blurred backgrounds for depth

## Security

- Hardcoded master credential authentication
- Firebase Firestore rules restrict data access
- Environment variables protect sensitive data

## Deployment

Deploy to Vercel with the Firebase and Google API environment variables configured.

## License

Private - For owner use only.