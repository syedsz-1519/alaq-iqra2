# Alaq - Architecture Document

## Project Overview

**Alaq** is a free, offline-capable Qur'anic learning application built with modern web technologies. It serves as an educational tool providing authentic Qur'anic content, hadith collections, and interactive learning features.

### Core Mission
- Provide free access to authentic Qur'anic texts and recitations
- Deliver comprehensive hadith collections with translations
- Enable offline learning through smart caching
- Support multiple languages and reciters
- Facilitate Tajweed learning with interactive lessons

---

## Technology Stack

### Frontend
- **Framework**: React 19.2.0 with TypeScript
- **Routing**: TanStack React Router 1.170.41
- **State Management**: TanStack React Query 5.101.1
- **Styling**: Tailwind CSS 4.2.1
- **UI Components**: Radix UI (primitives-based design system)
- **Build Tool**: Vite 8.1.5
- **PWA**: vite-plugin-pwa for offline support

### Backend
- **Server Runtime**: TanStack React Start 1.168.60 (full-stack React framework)
- **Database**: PostgreSQL via Supabase
- **ORM**: Drizzle ORM 0.x
- **API Gateway**: Lovable AI Gateway (for AI features)
- **Authentication**: Supabase Auth + Google OAuth
- **Forms**: React Hook Form with Zod validation

### Key Dependencies
- `@supabase/supabase-js`: Backend database & auth
- `sonner`: Toast notifications
- `recharts`: Data visualization
- `date-fns`: Date utilities
- `vaul`: Drawer component
- `embla-carousel-react`: Carousels

---

## Architecture Layers

### 1. **Presentation Layer** (`src/components/`)
```
components/
├── alaq/              # App-specific components
│   ├── app-shell.tsx          # Main layout wrapper
│   ├── audio-player.tsx       # Global audio playback
│   ├── quran-sections.tsx     # Qur'anic content display
│   ├── daily-hadith.tsx       # Hadith display
│   ├── zaid-provider.tsx      # AI tutor context (Zaid/Zara)
│   ├── teacher-ui.tsx         # Teacher mode features
│   └── ...                    # Other features
└── ui/                # Radix UI component library
```

**Key Principles:**
- Server & client component separation via `.server.ts` and `.ts` file extensions
- Unidirectional data flow with React Query
- Component composition for reusability

### 2. **State Management**
- **Local State**: React hooks (`useState`, `useReducer`)
- **Server State**: React Query (TanStack Query) for API data
- **Client Persistence**: `localStorage` via `useStored` hook for user preferences
- **Audio State**: Global `AudioPlayerProvider` for continuous playback

### 3. **Data Layer** (`src/integrations/`)
```
integrations/
├── supabase/
│   ├── client.ts              # Supabase JS client (auto-generated)
│   ├── auth-attacher.ts       # Bearer token middleware
│   ├── client.server.ts       # Server-side Supabase client
│   ├── types.ts               # Database type definitions
│   └── previewAuthStorage.ts  # Auth state persistence
└── lovable/
    └── index.ts               # Lovable Cloud OAuth integration
```

**Supabase Integration:**
- Managed authentication (email/password, Google OAuth)
- PostgreSQL database for:
  - User profiles
  - Hadith translations cache
  - Learning progress tracking
- Real-time subscriptions via `supabase.from().on()`

### 4. **Routing** (`src/router.tsx`, `src/routes/`)
- TanStack Router for nested routing
- Server functions for API endpoints
- Automatic code splitting
- Route-based data fetching with QueryClient

### 5. **Utilities & Libraries** (`src/lib/`)
- `offline-cache.ts`: Smart caching strategy (online/offline support)
- `device-voice.ts`: Web Speech API wrapper for offline Tajweed lessons
- `pwa-register.ts`: Service worker registration (guarded in dev/preview)
- `error-capture.ts`: Global error boundary
- `live-relay.server.ts`: Live development feature support

---

## Key Features & Implementation

### Feature 1: Offline-First Architecture
**Goal:** App works without internet connection

**Implementation:**
```
User Cache Strategy:
  ├── Online: Stream from network → Cache locally
  ├── Offline: Serve from cache
  └── Service Worker: Caches static assets + PWA manifest
```

**Core Functions:**
- `cachedJson()`: Fetches remote text with caching
- `playableUrl()`: Returns cacheable audio URLs
- Saved content tracked in localStorage

### Feature 2: Audio Player
**Global State Management:**
- Single `AudioPlayerProvider` at root prevents playback interruption
- Supports multiple reciters and Qur'anic sections
- Base64 audio encoding for offline playback

**Reciter Support:**
- Built dynamically via `buildAyahs()` function
- Tracks playback position
- Integrates with app navigation

### Feature 3: Tajweed Learning
**Offline Lessons:**
- Device Web Speech API for narration (no network required)
- Rules sourced from `tajweed-notes.ts` (bundled data)
- Teacher mode for guided learning

### Feature 4: AI Features (Zaid/Zara Assistant)
**Integration:**
- Uses Lovable AI Gateway
- Handles: Recitation checking, TTS, Hadith translation
- Requires `LOVABLE_API_KEY` (server-side only)

### Feature 5: Hadith & Duas
**Data Model:**
- Multiple collections (Sahih Bukhari, Muslim, etc.)
- Language support: Arabic, Urdu, English, Romanized, Telugu, Marathi
- AI translations cached in database for performance

---

## Data Flow Diagrams

### Authentication Flow
```
User Login
  ↓
Supabase Auth (OAuth or Email)
  ↓
Session Token (Bearer)
  ↓
attachSupabaseAuth Middleware
  ↓
Server Function RPC (with Authorization header)
```

### Content Delivery Flow
```
Qur'anic/Hadith Request
  ├─ Check localStorage (cached)
  ├─ If not cached → Fetch from API
  ├─ Cache result + Store in localStorage
  └─ Display to user

Offline Mode:
  └─ Serve from localStorage cache only
```

### User State Persistence
```
User Settings (settings, bookmarks, last read position)
  ↓
localStorage (via useStored hook)
  ↓
Persists across sessions WITHOUT login
  ↓
Optional: Sync to database for logged-in users
```

---

## Database Schema

### Core Tables (Drizzle ORM)
**Profiles:**
- `id` (UUID, PK)
- `display_name` (string)
- `teacher_choice` (enum: student/teacher)
- `created_at`, `updated_at`

**Hadith Translations:**
- `id` (UUID, PK)
- `collection` (string: "bukhari", "muslim", etc.)
- `number` (int)
- `language` (enum: arabic, english, urdu, roman, te, mr)
- `translation_text` (string) - AI generated/cached

**Migrations:**
- `0000_profiles.sql`: Initial schema
- `0001_hadith_translations.sql`: Hadith cache table
- `0002_profiles_teacher_choice.sql`: Teacher mode support

---

## Security Considerations

### Authentication
✅ Supabase handles auth securely (JWT tokens)
✅ Bearer tokens attached via middleware
✅ CSRF protection via TanStack Start middleware

### Data Protection
✅ Server functions validate authentication
✅ Database queries filtered by user context
✅ API keys (LOVABLE_API_KEY) kept server-side only

### Environment Variables
```
Client-side (exposed):
  - VITE_SUPABASE_URL
  - VITE_SUPABASE_PUBLISHABLE_KEY

Server-side (secret):
  - SUPABASE_URL (optional, for backend override)
  - SUPABASE_PUBLISHABLE_KEY (for server auth)
  - LOVABLE_API_KEY (for AI features)
```

---

## Performance Optimizations

1. **Code Splitting**: Route-based lazy loading via TanStack Router
2. **Caching**: Multi-level (localStorage, service worker, HTTP cache headers)
3. **Image Optimization**: Static assets in `public/` with optimized formats
4. **Bundle Size**: Tree-shaking unused Radix UI components
5. **Query Deduplication**: React Query prevents duplicate API calls

---

## Development Workflow

### Local Development
```bash
npm install
npm run dev              # Vite dev server with HMR
npm run build           # Production build
npm run lint            # ESLint checks
npm run format          # Prettier formatting
npm run test:watch     # Vitest with watch mode
```

### Deployment
- Build: `npm run build` → Optimized bundle in `dist/`
- Hosting: Deploy to edge (Vercel, Netlify) or traditional server
- Database: Supabase Cloud (serverless PostgreSQL)

---

## Future Considerations

1. **Scalability**: Partition hadith tables by language for faster queries
2. **Internationalization**: i18n framework for UI text
3. **Accessibility**: ARIA labels, keyboard navigation, screen reader testing
4. **Mobile**: Native app via React Native or Tauri
5. **Analytics**: Track user engagement without compromising privacy

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `src/start.ts` | Server middleware & CSRF setup |
| `src/router.tsx` | Route configuration |
| `src/server.ts` | Edge/server entry point |
| `src/integrations/supabase/client.ts` | Supabase client factory |
| `drizzle/schema.ts` | Database type definitions (auto-generated) |
| `vite.config.ts` | Build configuration |
| `package.json` | Dependencies & scripts |

