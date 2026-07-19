# Life OS Hub - Personal Dashboard

A comprehensive, unified, and highly secure personal dashboard built with Next.js, Firebase, and Google Workspace APIs.

## Features

### Command Center
- Daily morning affirmation with mood tracker
- Quick important notes (Sticky Notes widget)
- Habit tracker overview

### Task Tracker (ClickUp-inspired)
- List view and Kanban board toggle
- Priority tags (low, medium, high)
- Automatic archiving to Firestore and Google Sheets

### Finance Tracker
- CSV import for banking transactions (PapaParse)
- Net Worth tracking with charts
- Income/Expense summaries

### Habit Tracker
- Daily habit tracking with streaks
- GitHub-style habit grid
- Custom recurrence intervals

### Agenda Tracker
- Google Calendar integration (two-way sync)
- Event creation and deletion

## Tech Stack

- **Frontend**: Next.js 16 (App Router), Tailwind CSS, Shadcn/ui (Base UI)
- **Backend**: Firebase (Auth, Firestore, Cloud Functions)
- **Google APIs**: Calendar API, Sheets API
- **Charts**: Recharts

## Setup

### 1. Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Required variables:
- Firebase configuration (API key, project ID, etc.)
- `NEXT_PUBLIC_OWNER_EMAIL` - Your whitelisted Google account
- Google OAuth credentials (for Calendar API)
- `SHEET_ID` - Google Sheets ID for archiving

### 2. Firebase Setup

1. Create a Firebase project
2. Enable Google Authentication
3. Set Firestore rules using `firestore.rules`
4. Deploy Cloud Functions for Google Sheets archiving

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

## Security

- Only whitelisted Google account can access
- Firebase Firestore rules restrict access
- Environment variables protect sensitive data

## Deployment

Deploy to Vercel or Netlify with the Firebase environment variables configured.

## License

Private - For owner use only.