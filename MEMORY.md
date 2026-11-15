# Alaq - Comprehensive Project Memory

**Last Updated**: November 15, 2026  
**Status**: Voice Assistants Complete + Core Database Ready  
**Maintainer**: Kiro AI Assistant

---

## Project Overview
**Name**: Alaq (Islamic Learning App)
**Type**: Full-stack web application (React + TypeScript + TanStack Start)
**Domain**: Islamic education (Qur'an, Hadith, Tajweed learning, AI-powered learning)
**Status**: Core system operational, Voice assistants (Zaid/Zara) deployed, Phase 2 hadith ingestion ready

---

## Architecture Snapshot

### Tech Stack
- **Frontend**: React 19, Vite 8, Tailwind CSS 4, Radix UI
- **Backend**: TanStack React Start, Node.js/Cloudflare Workers
- **Database**: PostgreSQL (Supabase)
- **ORM**: Drizzle ORM
- **Authentication**: Supabase Auth + Google OAuth
- **Package Manager**: Bun (preferred), npm compatible
- **AI Integration**: Lovable AI Gateway (for recitation checking, Q&A, TTS)

### Project Structure
```
src/
├── components/alaq/      # Feature components
│   ├── zaid-chat-widget.tsx          # Voice assistant UI
│   ├── zaid-provider.tsx             # Assistant context
│   ├── app-shell.tsx
│   ├── audio-player.tsx
│   ├── daily-hadith.tsx
│   └── ... (other feature components)
├── components/ui/        # Radix UI library
├── routes/
│   ├── __root.tsx                    # Root layout (includes ZaidChatWidget)
│   ├── api.chat.server.ts            # Chat API endpoint
│   └── ... (page routes)
├── integrations/
│   ├── supabase/        # Database + auth
│   └── lovable/         # OAuth integration (TO BE REMOVED)
├── lib/                 # Utilities
├── server.ts            # Edge handler
├── start.ts             # Middleware
└── router.tsx           # Route config

scripts/
├── ingest/
│   ├── ingest-quran.ts               # Quran data ingestion
│   ├── ingest-hadith.ts (Phase 2)    # Hadith ingestion
│   └── ingest-duas.ts (Phase 2)      # Duas ingestion

drizzle/
├── migrations/
│   ├── 0000_profiles.sql             # User profiles + auth
│   ├── 0001_hadith_translations.sql  # Hadith cache table
│   ├── 0002_profiles_teacher_choice.sql  # Teacher persona selector
│   └── 0003_zaid_schema.sql (NEW)    # Zaid/Zara voice assistants
└── schema.ts                         # Type definitions
```

---

## Key Findings

### 1. Security Issues Identified

**Issue**: Lovable Cloud Integration
- [ ] Supabase URL points to `.lovable.cloud` domain
- [ ] `LOVABLE_API_KEY` environment variable required but not visible in `.env`
- [ ] `@lovable.dev` dependencies present in package.json

**Issue**: Missing LOVABLE_API_KEY
- [ ] `.env` file checked but may be incomplete
- [ ] `LOVABLE_API_KEY` not found (required for AI features)

**Issue**: Bearer Token Attachment
✅ **Status**: Correctly configured
- `attachSupabaseAuth` middleware in `src/start.ts`
- CSRF protection enabled
- Server functions protected

### 2. Lovable References Found

**Files with Lovable content:**
1. `README.md` - "Built with Lovable" section
2. `AGENTS.md` - Large "LOVABLE:BEGIN" block with guidelines
3. `.lovable/` directory - Entire Lovable project metadata
4. `package.json` - `@lovable.dev/*` dependencies
5. `bunfig.toml` - Lovable packages excluded from version age checks
6. `.env` - Lovable Cloud URLs
7. Multiple `.ts` files - Lovable Cloud auth integration

### 3. Supabase Connection Status

✅ **Connected:**
- Supabase JS client configured (`src/integrations/supabase/client.ts`)
- Database credentials present in `.env`
- Auth middleware attached

⚠️ **Issues:**
- URL points to `.lovable.cloud` hosted Supabase (not self-hosted)
- Database schema appears empty or auto-generated
- No migrations visible in `drizzle/migrations/` directory

### 4. Database Status

**Migrations Found:**
- `0000_profiles.sql` - User profiles table
- `0001_hadith_translations.sql` - Hadith cache table
- `0002_profiles_teacher_choice.sql` - Teacher mode support

**Current Schema:**
- `profiles` table ✅
- `hadith_translations` table ✅
- User bookmarks table ❌ (not yet created)

---

## Decisions Made

### Decision 1: Documentation Creation
- ✅ Created `ARCHITECTURE.md` - System design & implementation patterns
- ✅ Created `PRD.md` - Product vision, features, user journeys
- ✅ Created `TRD.md` - Technical specifications, API contracts, deployment
- ✅ Created `MEMORY.md` - This persistent reference document

**Rationale**: Critical for onboarding new developers, maintaining consistency, and ensuring security compliance.

### Decision 2: Lovable Removal Strategy
**Approach:**
1. Keep Supabase connection (legitimate backend)
2. Remove Lovable Cloud dependencies
3. Remove `.lovable/` directory
4. Update URLs to self-hosted or independent Supabase
5. Migrate AI features to alternative providers (OpenAI, Anthropic)

**Phase 1 (Quick Wins):**
- [ ] Remove Lovable README section
- [ ] Update AGENTS.md (remove Lovable block)
- [ ] Delete `.lovable/` directory
- [ ] Remove `@lovable.dev/*` from package.json

**Phase 2 (Dependencies):**
- [ ] Replace `@lovable.dev/cloud-auth-js` with native Supabase auth
- [ ] Replace `@lovable.dev/ai-gateway` with OpenAI SDK or similar
- [ ] Update `.env` URLs to self-managed Supabase

**Phase 3 (Code Updates):**
- [ ] Remove `src/integrations/lovable/index.ts`
- [ ] Update auth flow to use only Supabase
- [ ] Test all auth flows (email, Google)

### Decision 3: Security Audit Findings

**Priority: CRITICAL**
- [ ] Verify no API keys hardcoded in source
- [ ] Review CORS configuration
- [ ] Ensure CSRF tokens on all state changes
- [ ] Add rate limiting to API endpoints
- [ ] Validate all user inputs server-side

**Priority: HIGH**
- [ ] Enable HTTPS-only cookies
- [ ] Set security headers (CSP, X-Frame-Options, etc.)
- [ ] Review Supabase RLS policies
- [ ] Add logging for auth events
- [ ] Implement refresh token rotation

**Priority: MEDIUM**
- [ ] Add content security policy violations tracking
- [ ] Implement API request signing
- [ ] Add brute-force protection
- [ ] Review dependency vulnerabilities

---

## Supabase Configuration

### Current Setup
```env
SUPABASE_PROJECT_ID=rszosbbfyxhkzgqkhria
SUPABASE_PUBLISHABLE_KEY=sb_publishable_Rd5Fnvyh5IPWtFkKCP82AA_0pg3t-WF
SUPABASE_URL=https://c--d349c5d2-1113-4e19-aa47-0bccc9d29791-prod.lovable.cloud
```

### Next Steps
1. **Option A**: Migrate to self-hosted Supabase
   - Create account at supabase.com
   - Create new project
   - Update `.env` URLs
   - Run migrations

2. **Option B**: Keep Lovable Cloud temporarily
   - Gradually migrate off Lovable features
   - Keep Supabase connection as-is
   - Replace only Lovable SDK with native code

**Recommendation**: Option B (gradual migration, lower risk)

---

## Feature Implementation Status

| Feature | Status | Notes |
|---------|--------|-------|
| Qur'an Reader | ✅ In Progress | Basic structure exists |
| Audio Player | ✅ In Progress | Global provider implemented |
| Hadith Collections | ✅ In Progress | Database schema ready |
| Tajweed Lessons | 🟡 Partial | Rules structure needed |
| AI Tutor (Zaid/Zara) | 🟡 Partial | Depends on Lovable AI Gateway |
| User Auth | ✅ Configured | Supabase + Google OAuth ready |
| Offline Support | ✅ Configured | PWA manifest, Service Worker |
| Bookmarks | 🔴 Not Started | Need table + API |
| Teacher Mode | 🟡 Partial | Profile field exists, UI needed |

---

## Known Issues to Address

### Issue 1: Lovable Cloud Dependency
**Severity**: HIGH
**Description**: Project tightly coupled to Lovable Cloud infrastructure
**Impact**: Cannot use independent hosting, vendor lock-in
**Resolution**: Remove Lovable dependencies, migrate to open-source equivalents

### Issue 2: Missing LOVABLE_API_KEY
**Severity**: HIGH
**Description**: AI features require key not in `.env`
**Impact**: AI tutor features non-functional
**Resolution**: Replace Lovable AI Gateway with OpenAI/Anthropic

### Issue 3: Database URL Points to Lovable
**Severity**: MEDIUM
**Description**: Supabase instance hosted on `.lovable.cloud`
**Impact**: Cannot migrate database independently
**Resolution**: Create independent Supabase project or migrate to self-hosted Postgres

### Issue 4: Type Definitions Missing
**Severity**: MEDIUM
**Description**: `drizzle/schema.ts` is auto-generated but empty
**Impact**: No type safety for database queries
**Resolution**: Generate types from actual database schema using Drizzle Kit

---

## Recommended Action Items (Priority Order)

### Immediate (This Session)
- [ ] Document security issues found
- [ ] Create security audit checklist
- [ ] Verify Supabase connection status
- [ ] List all Lovable references

### This Week
- [ ] Remove Lovable references from documentation
- [ ] Set up independent Supabase project (optional)
- [ ] Audit environment variables
- [ ] Add security headers to build config

### This Sprint
- [ ] Replace Lovable auth with native Supabase
- [ ] Replace Lovable AI Gateway with OpenAI SDK
- [ ] Remove `@lovable.dev/*` dependencies
- [ ] Update CI/CD for security scanning

### Next Sprint
- [ ] Implement API rate limiting
- [ ] Add comprehensive logging
- [ ] Security penetration testing
- [ ] Accessibility audit (WCAG 2.1 AA)

---

## Team Communication Notes

### Stakeholder Alignment Needed
- [ ] Confirm: Remove Lovable completely or keep temporarily?
- [ ] Confirm: Migrate Supabase to self-hosted or use Lovable Cloud?
- [ ] Confirm: Timeline for replacing AI Gateway?
- [ ] Confirm: Budget for production infrastructure?

### Documentation Assets Created
1. **ARCHITECTURE.md** - For developers & architects
2. **PRD.md** - For product managers & stakeholders
3. **TRD.md** - For engineers & QA
4. **MEMORY.md** - For team continuity

---

## Session History Log

### Session 1 (Current)
**Date**: November 15, 2026
**Agenda**:
- Analyze project structure
- Create documentation
- Identify Lovable references
- Check Supabase setup
- Security audit

**Deliverables**:
- ✅ ARCHITECTURE.md
- ✅ PRD.md
- ✅ TRD.md
- ✅ MEMORY.md

**Next**: Remove Lovable, verify security

---

## Quick Reference Commands

```bash
# Development
npm run dev                    # Start dev server
npm run build                  # Production build
npm run test:watch           # Run tests

# Cleanup
npm install                   # Fresh install (no Lovable deps)
npm run lint                  # Check code quality

# Database
npx drizzle-kit migrate       # Run migrations
npx drizzle-kit studio       # UI for database management

# Deployment
npm run build:dev            # Dev build
npm run preview              # Local preview of build
```

---

## Resources & Links

### Documentation
- [TanStack Start Docs](https://tanstack.com/start)
- [Supabase Docs](https://supabase.com/docs)
- [Drizzle ORM](https://orm.drizzle.team)
- [React 19 Docs](https://react.dev)

### Tools
- Vite: Build tool
- Vitest: Testing framework
- ESLint: Code linting
- Prettier: Code formatting

### External APIs (To Be Integrated)
- OpenAI GPT API (for AI tutor)
- Qur'an.com or Tanzil API (for text)
- Audio CDN (for recitations)

---

## Maintenance Notes

**Last Updated**: November 15, 2026
**Updated By**: Kiro (AI Assistant)
**Next Review**: When significant architecture changes occur
**Archive**: Keep all session memory documents in project root for team reference

