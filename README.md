# Job Hunter Dashboard

A modern, real-time dashboard for managing automated job applications built with Next.js 15, TypeScript, and Tailwind CSS.

## Features

### Kanban Board
- **8-column pipeline**: Inbox → Interesting → CV Adapted → Ready → Applied → Blocked → Rejected → Archived
- **Drag & drop**: Move jobs between stages with smooth animations
- **Job cards**: Display title, company, location, match score, and blocker status
- **Click to view**: Navigate to detailed job view

### Job Detail Page
- **Comprehensive info**: Full job description, requirements, salary
- **Skills analysis**: Matched and missing skills breakdown
- **Application materials**: Download adapted CV and cover letter
- **Start application**: Choose between Assisted, Semi-Auto, or Full Auto modes
- **Blocker warnings**: Clear indicators when manual intervention is needed

### Real-time Application Tracking
- **Live WebSocket updates**: See form filling progress in real-time
- **Screenshot preview**: View current application page
- **Fields & questions**: Track what's been filled and answered
- **Control buttons**: Pause, resume, or submit (in Assisted mode)
- **Auto-redirect**: Navigate back to dashboard when complete

### Authentication
- **Multiple login options**: Email/password, Google, LinkedIn, GitHub
- **Secure sessions**: JWT tokens with automatic refresh
- **User menu**: Avatar with dropdown (profile, sign out)
- **Protected routes**: Automatic redirect to login when not authenticated

### User Profile Management
- **Personal information**: Name, email, phone, address
- **Professional links**: LinkedIn, GitHub, portfolio URLs
- **Job preferences**: Desired roles, locations, salary range
- **Form pre-filling**: All data used to auto-fill applications

### Analytics Dashboard
- **Key metrics**: Total jobs, applications, avg match score, blocked jobs
- **Rate limit tracking**: Visual progress bars for daily application limits
- **Status distribution**: Pie chart showing jobs across pipeline stages
- **Match score distribution**: Bar chart of how well jobs match your profile
- **Blocker breakdown**: Identify common obstacles

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Data fetching**: TanStack Query (React Query) v5
- **Drag & Drop**: @dnd-kit
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts
- **Real-time**: WebSocket API

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Job Hunter API running locally or deployed

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create environment file:
   ```bash
   cp .env.local.example .env.local
   ```

3. Update `.env.local` with your API URLs:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   NEXT_PUBLIC_WS_URL=ws://localhost:8000
   ```

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

Create a production build:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

## Project Structure

```
app/
├── layout.tsx              # Root layout with navigation
├── page.tsx                # Kanban board (home)
├── jobs/[id]/page.tsx      # Job detail page
├── applications/
│   └── [sessionId]/page.tsx # Application tracking
├── profile/page.tsx        # User profile management
└── analytics/page.tsx      # Analytics dashboard

components/
├── ui/                     # shadcn/ui components
│   ├── button.tsx
│   ├── card.tsx
│   ├── badge.tsx
│   ├── input.tsx
│   └── label.tsx
├── kanban/                 # Kanban board components
│   ├── Board.tsx           # Main board with DnD
│   ├── Column.tsx          # Status column
│   ├── JobCard.tsx         # Job card UI
│   └── SortableJobCard.tsx # Draggable wrapper
├── jobs/
│   └── ApplicationModeSelector.tsx # Mode selection modal
└── Navigation.tsx          # Top navigation bar

lib/
├── api/                    # API client functions
│   ├── client.ts           # Base fetch wrapper
│   ├── jobs.ts             # Jobs endpoints
│   ├── applications.ts     # Applications endpoints
│   └── users.ts            # Users endpoints
├── hooks/                  # React Query hooks
│   ├── useJobs.ts
│   ├── useApplications.ts
│   ├── useUser.ts
│   └── useWebSocket.ts
├── providers.tsx           # React Query provider
└── utils.ts                # Utility functions

types/
├── job.ts                  # Job types & enums
├── application.ts          # Application types & enums
└── user.ts                 # User types
```

## Key Features

### Drag & Drop

Uses `@dnd-kit` for smooth, accessible drag and drop:

```typescript
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, useSortable } from "@dnd-kit/sortable";

// Board handles drag end to update job status
const handleDragEnd = (event: DragEndEvent) => {
  const jobId = event.active.id;
  const newStatus = event.over?.id as JobStatus;
  updateJobStatus.mutate({ id: jobId, status: newStatus });
};
```

### Real-time Updates

WebSocket hook for live application progress:

```typescript
const { isConnected, lastMessage } = useApplicationWebSocket(sessionId);

// lastMessage contains:
// - status updates
// - fields filled
// - screenshots
// - error messages
```

### API Integration

Type-safe API client with React Query:

```typescript
// Fetch jobs with automatic caching and refetching
const { data, isLoading } = useJobs(userId);

// Mutations with optimistic updates
const updateJob = useUpdateJob();
updateJob.mutate({ id, updates });
```

## Environment Variables

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | Yes | `http://localhost:8000` |
| `NEXT_PUBLIC_WS_URL` | WebSocket URL | Yes | `ws://localhost:8000` |
| `AUTH_SECRET` | NextAuth.js secret key | Yes | Generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Application URL | Yes | `http://localhost:3000` |
| `AUTH_GOOGLE_ID` | Google OAuth Client ID | No* | From Google Cloud Console |
| `AUTH_GOOGLE_SECRET` | Google OAuth Client Secret | No* | From Google Cloud Console |
| `AUTH_LINKEDIN_ID` | LinkedIn OAuth Client ID | No* | From LinkedIn Developer Portal |
| `AUTH_LINKEDIN_SECRET` | LinkedIn OAuth Client Secret | No* | From LinkedIn Developer Portal |
| `AUTH_GITHUB_ID` | GitHub OAuth Client ID | No* | From GitHub Developer Settings |
| `AUTH_GITHUB_SECRET` | GitHub OAuth Client Secret | No* | From GitHub Developer Settings |

*OAuth credentials are optional. Email/password authentication works without them.

## OAuth Setup (Optional)

To enable social login buttons, obtain API credentials from each provider:

### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create/select a project
3. Navigate to "APIs & Services" > "Credentials"
4. Create "OAuth client ID" (Web application)
5. Add redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Client Secret to `.env.local`

### LinkedIn OAuth
1. Go to [LinkedIn Developer Portal](https://www.linkedin.com/developers/)
2. Create a new app
3. Under "Auth", add redirect URL: `http://localhost:3000/api/auth/callback/linkedin`
4. Request "Sign In with LinkedIn" product
5. Copy credentials to `.env.local`

### GitHub OAuth
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Set callback URL: `http://localhost:3000/api/auth/callback/github`
4. Copy credentials to `.env.local`

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import repository in Vercel
3. Set environment variables:
   - `NEXT_PUBLIC_API_URL=https://your-api.onrender.com`
   - `NEXT_PUBLIC_WS_URL=wss://your-api.onrender.com`
4. Deploy

The backend API is already configured to allow CORS from Vercel domains.

## Development Notes

- **Authentication**: Full authentication system implemented using NextAuth.js v5. Supports email/password and OAuth (Google, LinkedIn, GitHub).
- **OAuth Setup**: OAuth providers require API credentials from their respective developer consoles. See "OAuth Setup" section above.
- **User Sessions**: JWT tokens stored via NextAuth.js with automatic refresh.
- **Images**: Screenshot displays use `<img>` tags. Consider using `next/image` for optimization.

## API Endpoints Used

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user profile

### Jobs
- `GET /api/jobs` - List jobs
- `GET /api/jobs/:id` - Get job details
- `PATCH /api/jobs/:id` - Update job
- `POST /api/applications` - Start application
- `GET /api/applications/:sessionId` - Get application status
- `POST /api/applications/:sessionId/pause` - Pause application
- `POST /api/applications/:sessionId/resume` - Resume application
- `POST /api/applications/:sessionId/submit` - Submit application
- `GET /api/applications/rate-limit` - Get rate limit status
- `GET /api/users/:id` - Get user profile
- `PATCH /api/users/:id` - Update user profile
- `WS /api/applications/ws/:sessionId` - WebSocket for real-time updates

## License

MIT
