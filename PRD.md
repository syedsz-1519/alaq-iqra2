# Alaq - Product Requirements Document (PRD)

## Executive Summary

**Alaq** is a free, offline-capable Qur'anic learning application designed to serve Muslims worldwide with:
- Authentic Qur'anic recitations from renowned reciters
- Comprehensive hadith collections with translations
- Interactive Tajweed (Qur'anic recitation rules) learning
- AI-powered tutoring system (Zaid/Zara assistant)
- Offline-first design for unreliable internet regions

---

## Product Goals

### Primary Objectives
1. **Democratize Qur'anic Learning**: Free access to authentic Islamic content globally
2. **Enable Offline Learning**: Full functionality without internet connectivity
3. **Support Multiple Languages**: Serve Arabic speakers, Urdu, English, and regional languages
4. **Scalable Architecture**: Foundation for feature expansion (AI tutoring, community features)

### Success Metrics
- User retention: % of users returning after 7/30 days
- Offline usage: % of features accessed without internet
- Content coverage: Number of hadith collections & reciters available
- Performance: Page load <2s, offline load <0.5s

---

## Target Audience

### Primary Users
- **Islamic Learners**: Ages 7-70+ seeking authentic religious content
- **Students**: Preparing for Islamic exams or certifications
- **Teachers**: Using app for classroom instruction (Teacher Mode)
- **Arabic Learners**: Non-native speakers learning Qur'anic Arabic

### Regions
- Middle East & North Africa
- South Asia (Pakistan, Bangladesh)
- Southeast Asia (Indonesia, Malaysia)
- Global diaspora communities

---

## Core Features

### Feature 1: Qur'an Reader
**User Story:** As a user, I want to read the Qur'an with reciter audio so I can learn while listening.

**Requirements:**
- [ ] Display all 114 Surahs with proper formatting
- [ ] Support 10+ renowned reciters (Qari Al-Minshawi, Abdul Basit, etc.)
- [ ] Synchronized audio + text playback
- [ ] Bookmark verses for quick access
- [ ] Search by Surah name or verse number
- [ ] "Continue Reading" resume last position
- [ ] Tafsir (interpretation) on demand
- [ ] Offline access to downloaded Surahs

**Technical Acceptance Criteria:**
- Audio playback persists across page navigation
- Bookmarks persist in localStorage and sync to cloud when logged in
- Search returns results in <500ms
- Audio quality: 128kbps minimum, 320kbps maximum

### Feature 2: Hadith Collections
**User Story:** As a learner, I want to access authentic hadith collections in multiple languages to deepen my Islamic knowledge.

**Requirements:**
- [ ] Integrate 5+ major hadith collections (Sahih Bukhari, Muslim, Tirmidhi, Abu Dawood, Nasai)
- [ ] Display hadith chain (Isnad) with translators' notes
- [ ] Multi-language support: Arabic (original), Urdu, English, Romanized
- [ ] AI translation for unsupported languages (Telugu, Marathi)
- [ ] Full-text search across collections
- [ ] Hadith rating/authentication level display
- [ ] Related Qur'anic verses linked
- [ ] Share hadith via link or social media

**Technical Acceptance Criteria:**
- Search across 10,000+ hadith <1s
- AI translations cached in database (no real-time generation)
- Share links include metadata for rich preview

### Feature 3: Tajweed Learning (Offline)
**User Story:** As a student, I want interactive lessons on Qur'anic recitation rules so I can recite correctly.

**Requirements:**
- [ ] 40+ Tajweed rules with audio examples
- [ ] Web Speech API for offline narration (no internet needed)
- [ ] Visual highlighting of rules in Qur'anic text
- [ ] Practice exercises with audio feedback
- [ ] Student/Teacher mode toggle
- [ ] Progress tracking (rules learned)
- [ ] Mobile-optimized rule explanations

**Technical Acceptance Criteria:**
- Device voice narration works offline
- Tajweed rules bundled in app (~2MB uncompressed)
- Teacher mode allows marking students' progress

### Feature 4: AI Tutor (Zaid/Zara)
**User Story:** As a learner, I want an AI assistant to check my recitation and answer Islamic questions.

**Requirements:**
- [ ] Audio recording input (mic access)
- [ ] Recitation checking against reference audio
- [ ] Real-time feedback on pronunciation
- [ ] Q&A about Qur'an, hadith, Islamic jurisprudence
- [ ] Contextual suggestions based on learning level
- [ ] Conversation history saved
- [ ] Offline fallback: Canned responses when disconnected

**Technical Acceptance Criteria:**
- API calls through Lovable AI Gateway
- Response time <3s for Q&A
- Recitation checking accuracy >85%

### Feature 5: User Authentication & Profiles
**User Story:** As a user, I want to sign in to sync my progress and bookmarks across devices.

**Requirements:**
- [ ] Email/password signup
- [ ] Google OAuth sign-in
- [ ] Profile display name & learning preferences
- [ ] Progress tracking (surahs completed, hadith read, rules learned)
- [ ] Bookmarks & notes cloud sync
- [ ] Optional: Sign-in required for Teacher Mode

**Technical Acceptance Criteria:**
- Sign-in <2s
- Session persists for 30 days
- Sync to cloud within 5 seconds

### Feature 6: Offline Capabilities
**User Story:** As a user in a region with poor internet, I want the app to work fully offline.

**Requirements:**
- [ ] Service Worker for static asset caching
- [ ] Downloaded Surahs play without network
- [ ] Tajweed lessons fully offline
- [ ] Synced bookmarks available offline
- [ ] Automatic cache management (>500MB quota)
- [ ] Sync when reconnected

**Technical Acceptance Criteria:**
- App shell loads in <0.5s offline
- No blank screens when offline
- Cache eviction respects user's manual downloads

---

## Non-Functional Requirements

### Performance
- **Core Web Vitals**:
  - LCP (Largest Contentful Paint): <2.5s
  - FID (First Input Delay): <100ms
  - CLS (Cumulative Layout Shift): <0.1

- **Load Times**:
  - Initial page: <3s (3G network)
  - Offline pages: <0.5s
  - API responses: <1s (p95)

### Scalability
- Support 1M+ concurrent users
- Database: Horizontal scaling via Supabase
- Static assets: CDN distribution

### Security
- [ ] HTTPS-only connections
- [ ] CSRF token validation on state-changing requests
- [ ] SQL injection prevention via parameterized queries
- [ ] XSS protection via React's built-in sanitization
- [ ] Rate limiting on API endpoints
- [ ] No API keys exposed in browser bundle

### Accessibility
- [ ] WCAG 2.1 Level AA compliance
- [ ] Screen reader support (aria labels)
- [ ] Keyboard navigation
- [ ] High contrast mode support
- [ ] Font size adjustment options

### Privacy
- [ ] Clear privacy policy on data collection
- [ ] User can delete account & all data
- [ ] No analytics tracking without consent
- [ ] Compliant with GDPR (for EU users)
- [ ] No third-party sharing of user data

---

## User Journeys

### Journey 1: First-Time User (Offline Region)
```
1. Install app (PWA or native)
2. App loads offline shell instantly
3. Prompted to download Surah (e.g., Al-Fatiha)
4. Download completes (3MB audio + text)
5. User reads & listens offline
6. Sign-in optional (encouraged later)
7. Bookmarks persist locally
8. When online: Prompts to backup to cloud
```

### Journey 2: Student Using Tajweed Lessons
```
1. Open "Learning" section
2. Browse Tajweed rules
3. Select "Meem Nut" (muted meem rule)
4. View visual examples in Qur'an
5. Listen to Web Speech narration (offline)
6. Practice recitation
7. Submit to AI Tutor for feedback
8. Continue to next rule
```

### Journey 3: Teacher Classroom Usage
```
1. Sign in (Teacher Mode enabled)
2. Add students to class
3. Assign specific Surahs to read
4. Monitor student progress dashboard
5. Provide feedback on recitation recordings
6. Track completion rates
```

---

## Content Roadmap

### Phase 1 (MVP)
- ✅ 5 Qur'an reciters
- ✅ Sahih Bukhari & Muslim (English/Urdu translations)
- ✅ 20 Tajweed rules
- ✅ Basic AI Q&A

### Phase 2 (Q2 2025)
- Tirmidhi, Abu Dawood, Nasai collections
- 15+ additional reciters
- Tafsir integration (Ibn Kathir, Al-Tabari)
- Community forums

### Phase 3 (Q4 2025)
- Dua collections
- Sunnah Practices guide
- Iman & Aqeedah courses
- Mobile native apps (React Native)

---

## Monetization Strategy

**Primary Model: Freemium**
- Core features free forever
- Optional "Plus" subscription (no ads, exclusive content)
- Donations accepted (transparent budget)

**Secondary Models:**
- Institutional licensing (schools, mosques)
- API for third-party developers
- Optional premium reciters

---

## Success Criteria

### Business Metrics
- 100K downloads in Year 1
- 30-day retention: >40%
- Average session: >15 minutes
- 10K+ daily active users by Month 6

### Product Metrics
- Feature adoption: >70% use Hadith feature
- Offline usage: >30% of sessions offline
- Content coverage: 3M+ hadith available
- User satisfaction: NPS >50

### Technical Metrics
- Uptime: 99.9%
- API latency p95: <500ms
- Error rate: <0.1%
- Crash rate: <0.01%

---

## Constraints & Assumptions

### Constraints
- App must run on devices from 2015+ (older phones)
- Network: Designed for 2G/3G regions
- Mobile-first design (60% users on mobile)
- Islamic content must be vetted for accuracy

### Assumptions
- Users want free, offline-first alternative to existing apps
- Teacher Mode demand exists in Islamic schools
- Community trust is more valuable than ads/tracking
- PWA distribution sufficient (no native app initially)

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Content accuracy | High | Islamic scholar review board |
| User adoption | High | Influencer partnerships, demo videos |
| Offline sync conflicts | Medium | Last-write-wins strategy, conflict UI |
| Performance degradation | Medium | CDN, database indexing, caching layer |
| Supabase service outage | Low | Graceful degradation to offline mode |

---

## Dependencies & Integration

### External Services
- **Supabase**: Database, authentication, real-time
- **Lovable AI Gateway**: Recitation checking, Q&A, translations
- **CDN**: Audio file delivery (Cloudflare or similar)
- **Google OAuth**: Third-party authentication

### Data Sources
- Qur'an text: Tanzil.net (open source)
- Hadith collections: Various Islamic databases
- Reciters: Public domain recordings + partnerships
- Tafsir: Open source Islamic scholarship

---

## Release Timeline

| Phase | Timeline | Deliverables |
|-------|----------|--------------|
| Alpha | Nov 2026 | MVP with 2 reciters, Sahih Bukhari |
| Beta | Dec 2026 | 5 reciters, Tajweed lessons, Teacher Mode |
| Public Launch | Jan 2027 | Marketing push, content partnerships |
| Growth | Q1-Q4 2027 | Feature expansion, community building |

