# Alaq - Technical Requirements Document (TRD)

## Overview

The Alaq application is a full-stack TypeScript/React web application with offline-first capabilities, designed for Islamic learning on low-bandwidth networks.

---

## 1. System Architecture

### 1.1 High-Level Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    Browser / PWA Client                     │
├─────────────────────────────────────────────────────────────┤
│  React Components (TSX) + Vite Build                       │
│  ├─ Quran Reader, Hadith, Tajweed, AI Tutor              │
│  ├─ Service Worker (offline assets)                        │
│  └─ localStorage (bookmarks, preferences)                  │
├─────────────────────────────────────────────────────────────┤
│  Network Layer                                              │
│  ├─ TanStack React Query (API state)                       │
│  ├─ Supabase JS Client (@supabase/supabase-js)           │
│  └─ Axios/Fetch (HTTP client)                             │
├─────────────────────────────────────────────────────────────┤
│                    Edge / Backend                           │
│  ├─ TanStack React Start (SSR + API routes)               │
│  ├─ Server Functions (RPC-like API)                        │
│  └─ Middleware (Auth, CSRF, Error Handling)               │
├─────────────────────────────────────────────────────────────┤
│                  External Services                          │
│  ├─ Supabase (PostgreSQL, Auth, Realtime)                │
│  ├─ Lovable AI Gateway (Recitation, Q&A, TTS)            │
│  ├─ CDN (Audio file delivery)                             │
│  └─ Google OAuth Provider                                  │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Component Architecture
```
src/
├── routes/                    # Page routes
├── components/
│   ├── alaq/                 # App-specific
│   │   ├── app-shell.tsx     # Layout
│   │   ├── audio-player.tsx  # Global audio state
│   │   ├── quran-sections.tsx
│   │   ├── daily-hadith.tsx
│   │   ├── zaid-provider.tsx # AI context
│   │   └── ...
│   └── ui/                   # Radix UI components
├── server.ts                 # Cloudflare/Edge handler
├── start.ts                  # Middleware config
├── router.tsx                # Route configuration
├── integrations/
│   ├── supabase/
│   │   ├── client.ts         # Supabase JS instance
│   │   ├── client.server.ts  # SSR Supabase client
│   │   ├── auth-attacher.ts  # Bearer token middleware
│   │   └── types.ts          # Database types
│   └── lovable/
│       └── index.ts          # OAuth integration
└── lib/
    ├── offline-cache.ts      # Caching logic
    ├── device-voice.ts       # Web Speech API
    ├── pwa-register.ts       # Service Worker
    └── error-capture.ts      # Error boundary
```

---

## 2. Frontend Requirements

### 2.1 Browser Support
- **Minimum**: Chrome 60+, Firefox 55+, Safari 11+
- **Mobile**: iOS Safari 11+, Chrome Android 60+
- **Fallback**: Graceful degradation for older browsers

### 2.2 Dependencies

#### Core Framework
```json
{
  "react": "^19.2.0",
  "react-dom": "^19.2.0",
  "@tanstack/react-start": "1.168.60",
  "@tanstack/react-router": "1.170.41",
  "@tanstack/react-query": "^5.101.1"
}
```

#### UI & Styling
```json
{
  "@radix-ui/*": "^1.2.x",           // Core UI primitives
  "tailwindcss": "^4.2.1",           // Styling
  "lucide-react": "^0.575.0",        // Icons
  "sonner": "^2.0.7"                 // Toast notifications
}
```

#### Forms & Validation
```json
{
  "react-hook-form": "^7.71.2",
  "@hookform/resolvers": "^5.2.2",
  "zod": "^3.25.76"
}
```

#### Utilities
```json
{
  "@supabase/supabase-js": "^2.119.0",
  "date-fns": "^4.1.0",
  "clsx": "^2.1.1",
  "tailwind-merge": "^3.5.0"
}
```

### 2.3 UI/UX Specifications

#### Design System
- **Color Palette**: Islamic green (#16a34a), cream (#faf9f3), slate (#0f172a)
- **Typography**: Inter/Segoe UI (accessible sans-serif)
- **Spacing**: 4px grid (tailwind scale)
- **Elevation**: Shadow system for depth

#### Responsive Breakpoints
- **Mobile**: 320px - 640px
- **Tablet**: 641px - 1024px
- **Desktop**: 1025px+

#### Key Screens
1. **Qur'an Reader**: Full-page immersive reading
2. **Hadith Browser**: Paginated collection view
3. **Tajweed Dashboard**: Rule cards + audio examples
4. **AI Tutor Interface**: Chat-like conversation UI
5. **User Profile**: Settings, progress, bookmarks

### 2.4 Performance Targets

| Metric | Target | Tool |
|--------|--------|------|
| LCP | <2.5s | Lighthouse, Web Vitals |
| FID | <100ms | Web Vitals |
| CLS | <0.1 | Web Vitals |
| Bundle Size | <200KB gzip | webpack-bundle-analyzer |
| First Paint | <1s | Lighthouse |

---

## 3. Backend Requirements

### 3.1 Server Runtime
- **Runtime**: TanStack React Start (Cloudflare Workers/Node.js)
- **SSR**: Server-side rendering enabled for SEO & fast FCP
- **API**: Server functions (RPC-like pattern)

### 3.2 Database Schema

#### Table: `profiles`
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  display_name VARCHAR(255),
  teacher_choice ENUM('student', 'teacher'),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(id)
);
```

#### Table: `hadith_translations`
```sql
CREATE TABLE hadith_translations (
  id UUID PRIMARY KEY,
  collection VARCHAR(50),        -- 'bukhari', 'muslim', etc.
  hadith_number INT,
  language VARCHAR(10),          -- 'ar', 'en', 'ur', 'roman', 'te', 'mr'
  translation_text TEXT,
  translator VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(collection, hadith_number, language)
);

CREATE INDEX idx_hadith_collection ON hadith_translations(collection);
CREATE INDEX idx_hadith_language ON hadith_translations(language);
```

#### Table: `user_bookmarks` (future)
```sql
CREATE TABLE user_bookmarks (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  surah INT,
  ayah INT,
  note TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 3.3 Authentication

#### Supabase Auth Config
- **Methods**: Email/password, Google OAuth
- **Session Duration**: 30 days (refresh token)
- **Multi-factor**: Optional 2FA via TOTP

#### Bearer Token Flow
```
1. User signs in via Supabase
2. Supabase returns access_token (JWT)
3. attachSupabaseAuth middleware attaches: Authorization: Bearer {token}
4. Server functions verify JWT signature
5. Extract user_id from JWT claims
```

#### Server Function Protection
```typescript
// All server functions decorated with @requireSupabaseAuth
// are protected by attachSupabaseAuth middleware

server$.requireSupabaseAuth = async (fn) => {
  return async (...args) => {
    const auth = await getSupabaseAuth(); // from middleware
    if (!auth) throw new UnauthorizedError();
    return fn(auth, ...args);
  };
};
```

### 3.4 API Endpoints (Server Functions)

#### Example Endpoints
```typescript
// GET /api/quran/surah/:id
server$.getQuranSurah = async (id: number) => {
  // Return Surah with all ayahs
  // Cached in React Query
}

// POST /api/hadith/search
server$.searchHadith = async (query: string, language: string) => {
  // FTS search across hadith_translations
  // Paginated results
}

// GET /api/user/bookmarks
server$.getUserBookmarks = async () => {
  // Returns user's saved bookmarks
  // Requires authentication
}

// POST /api/ai/check-recitation
server$.checkRecitation = async (audioBase64: string) => {
  // Call Lovable AI Gateway
  // Returns feedback
}
```

### 3.5 Environment Variables

#### `.env.local` (Development)
```
SUPABASE_URL=https://...
SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_PROJECT_ID=...
LOVABLE_API_KEY=... (for AI features)
```

#### Vite Environment (Frontend)
```
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

### 3.6 Security Requirements

#### Input Validation
```typescript
// All server functions must validate input
const schema = z.object({
  query: z.string().min(1).max(200),
  language: z.enum(['ar', 'en', 'ur'])
});

server$.searchHadith = async (input: unknown) => {
  const { query, language } = schema.parse(input);
  // ... proceed
};
```

#### Rate Limiting
- API calls: 100 requests/minute per IP
- Audio streaming: 500MB/month per user (free tier)
- AI features: 10 requests/minute per user

#### CORS Policy
```
Allowed Origins: *.alaq.app, localhost:3000 (dev)
Allowed Methods: GET, POST, PUT, DELETE
Allowed Headers: Content-Type, Authorization
Credentials: Include (for session cookies)
```

---

## 4. Offline Capabilities

### 4.1 Service Worker Strategy
```
Service Worker Caching:
├─ Cache Strategy: Stale-While-Revalidate
├─ Cached Assets: JS, CSS, fonts, icons
├─ Cache TTL: 30 days (versioned by build hash)
└─ Max Cache: 50MB (browser quota limit)
```

### 4.2 IndexedDB / localStorage
```typescript
// localStorage: User preferences (5-10MB typical)
localStorage.setItem('preferences', JSON.stringify({
  language: 'en',
  reciter: 'al-minshawi',
  theme: 'dark'
}));

// localStorage: Bookmarks (array of {surah, ayah, timestamp})
localStorage.setItem('bookmarks', JSON.stringify(bookmarks));

// IndexedDB: Downloaded audio files (100MB+)
const db = new IDBDatabase('alaq-v1');
await db.store('downloads').put({
  key: 'surah-1-audio',
  blob: audioBlob,
  metadata: { surah: 1, reciter: 'minshawi' }
});
```

### 4.3 Offline Content Manifest
```json
{
  "version": "2026-11-15",
  "critical": [
    "/assets/app-shell.js",
    "/assets/styles.css",
    "/data/tajweed-rules.json"
  ],
  "optional": [
    "/audio/surah-1-minshawi.mp3",
    "/data/sahih-bukhari-en.json"
  ]
}
```

### 4.4 Sync Strategy (When Online)
```
1. Check localStorage for unsaved changes (bookmarks, preferences)
2. Upload to Supabase (upsert)
3. Merge conflicts: Last-write-wins + user notification
4. Clear local sync queue
```

---

## 5. Data Flow & Caching

### 5.1 Content Loading Flow
```
User Request for Surah
  ↓
Check React Query cache (memory)
  ├─ HIT: Return cached data
  └─ MISS:
      ↓
    Check localStorage (browser storage)
      ├─ HIT: Return + revalidate in background
      └─ MISS:
          ↓
        Check Service Worker cache
          ├─ HIT: Return
          └─ MISS:
              ↓
            Fetch from CDN/API
              ↓
            Cache in SW + localStorage
              ↓
            Return to user
```

### 5.2 Query Configuration
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 60,    // 1 hour
      cacheTime: 1000 * 60 * 60 * 24, // 24 hours
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true        // When online
    }
  }
});
```

---

## 6. Build & Deployment

### 6.1 Build Process
```bash
# Development
npm run dev
  → Vite dev server on http://localhost:5173
  → HMR enabled
  → Source maps for debugging

# Production
npm run build
  → Vite build: src/ → dist/
  → Code splitting by route
  → Asset optimization (minify, compress)
  → PWA manifest generation
  → Output: dist/ ready for deployment
```

### 6.2 Output Structure
```
dist/
├── assets/
│   ├── main-{hash}.js
│   ├── index-{hash}.css
│   └── chunk-{id}-{hash}.js
├── index.html
├── manifest.webmanifest
├── robots.txt
└── offline.html
```

### 6.3 Deployment Targets
- **Edge**: Cloudflare Workers, Vercel Edge Functions
- **Traditional**: Node.js on VPS, Docker container
- **Serverless**: AWS Lambda, Google Cloud Functions

### 6.4 CI/CD Pipeline
```
On Push to Main:
  1. Run ESLint
  2. Run TypeScript compiler
  3. Run unit tests (vitest)
  4. Build production bundle
  5. Run Lighthouse audit
  6. Deploy to staging
  7. Run E2E tests
  8. Deploy to production
```

---

## 7. Testing Requirements

### 7.1 Test Coverage Targets
- **Unit Tests**: 80% coverage on utils, hooks
- **Integration Tests**: API endpoints, Supabase queries
- **E2E Tests**: Critical user journeys (signup, read Qur'an, offline)

### 7.2 Test Tools
- **Unit/Integration**: Vitest + React Testing Library
- **E2E**: Playwright or Cypress
- **Performance**: Lighthouse CI
- **Accessibility**: axe-core

### 7.3 Example Tests
```typescript
// Unit test: Custom hook
test('useAudioPlayer initializes with default reciter', () => {
  const { result } = renderHook(() => useAudioPlayer());
  expect(result.current.reciter).toBe('al-minshawi');
});

// Integration test: API call
test('searchHadith returns results', async () => {
  const results = await searchHadith('ummah', 'en');
  expect(results).toHaveLength(>0);
  expect(results[0]).toHaveProperty('text');
});

// E2E test: User journey
test('User can read Surah Al-Fatiha offline', async () => {
  await page.goto('/quran/1');
  await page.click('[data-testid="download-offline"]');
  await page.waitForNavigation(); // download completes
  await goOnline(false);
  await page.reload();
  expect(await page.textContent('[data-testid="surah-name"]')).toBe('Al-Fatiha');
});
```

---

## 8. Monitoring & Observability

### 8.1 Error Tracking
- **Tool**: Sentry or similar
- **Captured**: JavaScript errors, server errors, API timeouts
- **Sampling**: 10% of errors in production

### 8.2 Performance Monitoring
- **Web Vitals**: Google Analytics 4
- **Custom Metrics**:
  - Audio buffer time
  - Offline cache hit rate
  - API response time by endpoint

### 8.3 Logging
```typescript
// Server-side logging
console.log(`[${new Date().toISOString()}] Surah ${id} requested by ${userId}`);

// Client-side: Sentry
Sentry.captureException(error, { 
  tags: { feature: 'audio-player' } 
});
```

---

## 9. API Rate Limiting & Quotas

### 9.1 Free Tier (Unauthenticated)
- API calls: 100/minute per IP
- Audio streaming: 100MB/month
- Search: 50 searches/hour
- Concurrent connections: 2

### 9.2 Authenticated Users
- API calls: 500/minute per user
- Audio streaming: 500MB/month
- Search: Unlimited
- Concurrent connections: 5

### 9.3 AI Features (Premium/Limited)
- Recitation checks: 5/day (free), unlimited (premium)
- Q&A: 10/day (free), unlimited (premium)
- TTS generation: 5/day (free)

---

## 10. Compliance & Standards

### 10.1 Security Standards
- [ ] SSL/TLS (HTTPS only)
- [ ] OWASP Top 10 compliance
- [ ] CSP headers configured
- [ ] No sensitive data in logs

### 10.2 Data Privacy
- [ ] GDPR compliance (EU users)
- [ ] Data deletion on account removal
- [ ] Privacy policy accessible
- [ ] Clear consent for analytics

### 10.3 Accessibility
- [ ] WCAG 2.1 Level AA
- [ ] Screen reader tested
- [ ] Keyboard navigation
- [ ] Color contrast ratio ≥4.5:1

### 10.4 SEO
- [ ] Structured data (JSON-LD)
- [ ] Meta tags per route
- [ ] Sitemap.xml
- [ ] Open Graph tags

---

## 11. Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Service Worker tested
- [ ] CORS headers set
- [ ] SSL certificate valid
- [ ] CDN cache headers configured
- [ ] Error tracking initialized
- [ ] Monitoring dashboards active
- [ ] Backup strategy tested
- [ ] Team access controls set

