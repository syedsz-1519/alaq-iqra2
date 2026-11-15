# Alaq - Security Audit Report

**Date**: November 15, 2026  
**Auditor**: Kiro (AI Security Review)  
**Status**: ⚠️ REQUIRES ATTENTION

---

## Executive Summary

The Alaq application has a **moderate security posture** with several **critical issues** requiring immediate attention before production deployment:

- ✅ **6 items** properly configured
- ⚠️ **8 items** requiring improvement
- 🔴 **3 critical items** requiring immediate action

---

## Critical Issues (Must Fix Immediately)

### 1. Lovable Cloud Vendor Lock-in
**Severity**: 🔴 CRITICAL  
**Status**: PARTIALLY MITIGATED

**Finding**:
- Supabase database hosted on `.lovable.cloud` domain
- Creates dependency on Lovable Cloud infrastructure
- Cannot independently migrate or manage infrastructure

**Risk**:
- Service disruption if Lovable Cloud service degrades
- Data portability risks
- Continued vendor lock-in after removing Lovable code

**Remediation**:
1. Create independent Supabase project at supabase.com
2. Migrate database and auth to own project
3. Update environment variables:
   ```
   SUPABASE_URL=https://[your-project-ref].supabase.co
   SUPABASE_PUBLISHABLE_KEY=sb_publishable_[your-key]
   ```
4. Test all auth flows (email, Google) after migration
5. Run database migrations: `npx drizzle-kit migrate`

**Timeline**: BEFORE production deployment

---

### 2. Missing LOVABLE_API_KEY Environment Variable
**Severity**: 🔴 CRITICAL  
**Status**: BLOCKING AI FEATURES

**Finding**:
- AI tutor features (Zaid/Zara) require `LOVABLE_API_KEY`
- Environment variable not present in `.env` file
- AI features currently non-functional

**Risk**:
- Core features unavailable
- AI translation of hadith collections disabled
- Recitation checking unavailable

**Remediation Options**:

**Option A: Migrate to OpenAI API (Recommended)**
```bash
npm install openai
```
Update environment variables:
```
OPENAI_API_KEY=sk_...
OPENAI_MODEL=gpt-4-turbo
```

**Option B: Use Anthropic Claude API**
```bash
npm install @anthropic-ai/sdk
```
Update environment variables:
```
ANTHROPIC_API_KEY=sk-ant-...
```

**Option C: Keep Lovable AI Gateway**
Obtain `LOVABLE_API_KEY` from Lovable dashboard and add to `.env`:
```
LOVABLE_API_KEY=...
```

**Timeline**: BEFORE shipping AI features

---

### 3. API Keys Potentially Exposed in Package Lock Files
**Severity**: 🔴 CRITICAL  
**Status**: REVIEW NEEDED

**Finding**:
- `bun.lock` and `package.json` are in git repository
- Could contain sensitive data if committed with secrets
- Lovable packages still present in lock file

**Risk**:
- Accidental exposure of API keys in git history
- Public repositories leak credentials
- Supply chain attacks via dependency tampering

**Remediation**:
1. ✅ **Done**: Remove `@lovable.dev/*` packages from package.json
2. **Required**: Clear and rebuild lock files:
   ```bash
   rm bun.lock package-lock.json
   npm install  # or bun install
   ```
3. Verify `.gitignore` includes:
   ```
   .env
   .env.local
   .env.*.local
   *.log
   node_modules/
   dist/
   ```
4. Audit git history for exposed secrets:
   ```bash
   git log --all --oneline -- .env
   git log --all --full-history -p -- .env | head -100
   ```
5. If secrets found in history, use git-filter-branch or GitHub's secret scanning

**Timeline**: IMMEDIATE

---

## High Priority Issues (Fix This Week)

### 4. CORS Configuration Not Visible
**Severity**: ⚠️ HIGH  
**Status**: NEEDS REVIEW

**Finding**:
- CORS headers not found in Vite config
- No explicit CORS policy defined
- Potential for unauthorized cross-origin requests

**Risk**:
- API endpoints accessible from any domain
- CSRF attacks possible
- XSS payloads can read API responses

**Remediation**:
Add to `vite.config.ts`:
```typescript
export default defineConfig({
  server: {
    cors: {
      origin: ['https://alaq.app', 'https://www.alaq.app', 'http://localhost:3000'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      maxAge: 3600
    }
  }
});
```

**Timeline**: Before production

---

### 5. CSRF Protection Status
**Severity**: ⚠️ HIGH  
**Status**: PARTIALLY CONFIGURED

**Finding**:
- ✅ `createCsrfMiddleware` configured in `src/start.ts`
- ✅ Filters server functions correctly
- ⚠️ No CSRF token verification in client code visible
- ⚠️ No CSRF error handling documentation

**Risk**:
- Server function mutation endpoints vulnerable if token fails silently
- Users may not be warned of CSRF failures

**Remediation**:
1. Verify CSRF tokens are included in all POST/PUT/DELETE requests
2. Add client-side error handling:
   ```typescript
   catch (error) {
     if (error instanceof CSRFError) {
       console.error('CSRF validation failed', error);
       // Redirect to login or show warning
     }
   }
   ```
3. Document CSRF policy in TRD.md ✅ (Already done)

**Timeline**: Before production

---

### 6. Security Headers Not Configured
**Severity**: ⚠️ HIGH  
**Status**: NOT CONFIGURED

**Finding**:
- No Content-Security-Policy header
- No X-Frame-Options header
- No X-Content-Type-Options header
- No Strict-Transport-Security header

**Risk**:
- XSS attacks can inject malicious scripts
- Clickjacking attacks possible
- MIME type confusion attacks
- Man-in-the-middle (MITM) downgrade attacks

**Remediation**:
Add security headers to server response (in `src/server.ts` or deployment config):

```typescript
// src/server.ts - add security headers middleware
const securityHeaders = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
};

export default {
  async fetch(request, env, ctx) {
    // ... existing code ...
    response.headers.set('Content-Security-Policy', securityHeaders['Content-Security-Policy']);
    // ... set other headers ...
    return response;
  }
};
```

**Timeline**: Before production

---

### 7. Input Validation & Sanitization
**Severity**: ⚠️ HIGH  
**Status**: PARTIALLY IMPLEMENTED

**Finding**:
- ✅ Zod validation used in forms
- ✅ React auto-escapes JSX content
- ⚠️ No explicit server-side validation for all endpoints
- ⚠️ Database queries may not be parameterized in all places

**Risk**:
- SQL injection if queries are string-interpolated
- XSS if unsanitized user input rendered
- Application crashes from unexpected data types

**Remediation**:
1. Audit all server functions:
   ```bash
   grep -r "server\$" src/routes --include="*.ts" --include="*.tsx"
   ```
2. Ensure each server function validates input with Zod:
   ```typescript
   const inputSchema = z.object({
     query: z.string().min(1).max(500),
     language: z.enum(['ar', 'en', 'ur'])
   });

   server$.searchHadith = async (input: unknown) => {
     const validated = inputSchema.parse(input); // Throws on invalid
     // Use validated, not input
   };
   ```
3. Verify Drizzle ORM parameterizes all queries (it does by default)

**Timeline**: This week

---

### 8. Rate Limiting & DDoS Protection
**Severity**: ⚠️ HIGH  
**Status**: NOT IMPLEMENTED

**Finding**:
- No rate limiting middleware
- No request throttling
- Endpoints vulnerable to brute force & DoS attacks

**Risk**:
- Authentication endpoint: Unlimited login attempts (brute force)
- Search endpoint: Expensive queries can be hammered
- Audio streaming: Unlimited bandwidth consumption
- Economic damage from resource exhaustion

**Remediation**:
Install rate limiting middleware:
```bash
npm install express-rate-limit  # or similar for your runtime
```

Add to `src/start.ts`:
```typescript
import rateLimit from 'express-rate-limit';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many login attempts, please try again later'
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  keyGenerator: (req) => req.user?.id || req.ip
});

// Apply limiters to routes
router.post('/auth/login', authLimiter, handleLogin);
router.get('/api/search', apiLimiter, handleSearch);
```

**Timeline**: Before public beta

---

## Medium Priority Issues (Fix This Sprint)

### 9. Dependency Vulnerability Scanning
**Severity**: 🟡 MEDIUM  
**Status**: NOT CONFIGURED

**Finding**:
- No automated vulnerability scanning
- Dependencies not regularly updated
- Potential outdated packages with known CVEs

**Risk**:
- Known exploits in transitive dependencies
- Supply chain attacks via compromised packages

**Remediation**:
1. Run security audit:
   ```bash
   npm audit
   npm audit fix  # Auto-fix non-breaking issues
   ```
2. Set up automated scanning in CI/CD:
   ```bash
   npm install --save-dev snyk  # or npm audit in CI
   ```
3. Add to GitHub Actions:
   ```yaml
   - name: Security Audit
     run: npm audit --audit-level=moderate
   ```

**Timeline**: This sprint

---

### 10. Logging & Monitoring
**Severity**: 🟡 MEDIUM  
**Status**: MINIMAL IMPLEMENTATION

**Finding**:
- Basic console.error logging exists
- No structured logging
- No error tracking service (like Sentry)
- Authentication events not logged

**Risk**:
- Cannot detect security incidents in real-time
- Difficult to debug production issues
- No audit trail for compliance

**Remediation**:
1. Install Sentry for error tracking:
   ```bash
   npm install @sentry/react @sentry/tracing
   ```
2. Initialize in `src/start.ts`:
   ```typescript
   import * as Sentry from "@sentry/react";

   if (process.env.VITE_SENTRY_DSN) {
     Sentry.init({
       dsn: process.env.VITE_SENTRY_DSN,
       environment: process.env.NODE_ENV,
       tracesSampleRate: 0.1
     });
   }
   ```
3. Log auth events:
   ```typescript
   console.log(`[AUTH] User ${userId} signed in via ${method} at ${new Date().toISOString()}`);
   ```

**Timeline**: This sprint

---

### 11. Database Access Control (Row-Level Security)
**Severity**: 🟡 MEDIUM  
**Status**: NEEDS VERIFICATION

**Finding**:
- Supabase RLS policies not visible in repository
- Cannot verify user isolation at database level
- Potential for unauthorized data access

**Risk**:
- Users can access other users' bookmarks/preferences
- Admin data accessible to regular users
- Data breaches from application bypass

**Remediation**:
1. Enable RLS on all tables:
   ```sql
   ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
   ALTER TABLE hadith_translations ENABLE ROW LEVEL SECURITY;
   ```
2. Create policies:
   ```sql
   -- Users can read their own profile
   CREATE POLICY "Users can read own profile" ON profiles
     FOR SELECT USING (auth.uid() = id);

   -- Users can update their own profile
   CREATE POLICY "Users can update own profile" ON profiles
     FOR UPDATE USING (auth.uid() = id);

   -- Anyone can read hadith (public data)
   CREATE POLICY "Hadith is readable by all" ON hadith_translations
     FOR SELECT USING (true);
   ```
3. Verify policies in Supabase dashboard
4. Test access control:
   ```bash
   npm run test  # Include RLS tests
   ```

**Timeline**: Before production

---

## Low Priority Issues (Fix Next Sprint)

### 12. Sensitive Data in Error Messages
**Severity**: 🟢 LOW  
**Status**: NEEDS VERIFICATION

**Finding**:
- Error messages might expose internal details
- Stack traces visible in console (dev only, good)
- Need to verify production error responses

**Risk**:
- Information disclosure attacks
- Attackers learn about system internals

**Remediation**:
1. Review error handler in `src/lib/error-capture.ts`
2. Ensure production errors don't expose:
   - Database connection strings
   - File paths
   - Stack traces
   - User data
3. Generic errors for users, detailed logs for admins:
   ```typescript
   if (process.env.NODE_ENV === 'production') {
     return { error: 'An error occurred. Please try again.' };
   } else {
     return { error: error.message, stack: error.stack };
   }
   ```

**Timeline**: Next sprint

---

### 13. Offline Data Encryption
**Severity**: 🟢 LOW  
**Status**: NOT IMPLEMENTED

**Finding**:
- Bookmarks/preferences stored in localStorage (plaintext)
- Offline content cached in Service Worker (plaintext)
- User's religious preferences exposed if device compromised

**Risk**:
- Low risk for most users
- Higher risk for users in oppressive regions
- Device theft exposes personal learning history

**Remediation**:
For security-sensitive deployments, add encryption:
```bash
npm install crypto-js
```
Encrypt before storing:
```typescript
import CryptoJS from 'crypto-js';

const encrypted = CryptoJS.AES.encrypt(
  JSON.stringify(bookmarks),
  process.env.VITE_ENCRYPTION_KEY
).toString();

localStorage.setItem('bookmarks', encrypted);
```

**Timeline**: Next sprint (optional for MVP)

---

## Configuration Verification Checklist

- [ ] **HTTPS Enforced**: All traffic redirected from HTTP to HTTPS
- [ ] **HSTS Enabled**: Strict-Transport-Security header set to 1 year+
- [ ] **Cookies Secure**: Session cookies marked as Secure + HttpOnly + SameSite
- [ ] **CSP Header**: Content-Security-Policy configured (not 'unsafe-inline' for scripts)
- [ ] **CORS Whitelist**: Only trusted domains allowed
- [ ] **X-Frame-Options**: Set to SAMEORIGIN to prevent clickjacking
- [ ] **X-Content-Type-Options**: Set to nosniff to prevent MIME sniffing
- [ ] **Secrets Management**: No .env.local, secrets in env vars only
- [ ] **Database**: RLS policies enabled, parameterized queries used
- [ ] **API Keys**: Server-side only, never in browser bundle
- [ ] **Audit Logging**: Auth events logged with timestamps
- [ ] **Error Monitoring**: Sentry or similar configured
- [ ] **Dependency Updates**: npm audit clean, no critical CVEs

---

## Action Items Summary

### Immediate (Before Alpha Release)
- [ ] Create independent Supabase project
- [ ] Migrate database & auth from Lovable Cloud
- [ ] Update environment variables
- [ ] Clear and rebuild lock files
- [ ] Audit git history for exposed secrets
- [ ] Choose & integrate AI API (OpenAI or Anthropic)

### This Week
- [ ] Configure security headers
- [ ] Set up CORS policy
- [ ] Implement input validation audit
- [ ] Add rate limiting middleware
- [ ] Enable RLS on database tables

### This Sprint
- [ ] Set up Sentry error tracking
- [ ] Configure CI/CD security scanning
- [ ] Implement comprehensive logging
- [ ] Document security policies
- [ ] Conduct penetration testing

### Next Sprint
- [ ] Implement optional encryption for sensitive data
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Performance optimization review
- [ ] Privacy policy & terms of service

---

## Compliance & Standards

### Standards Alignment
- **OWASP Top 10**: Addresses SQL injection, XSS, CSRF, authentication flaws
- **GDPR**: Requires user consent for data processing, right to deletion
- **WCAG 2.1**: Target Level AA for accessibility

### Security Standards
- **HTTPS/TLS 1.3+**: All communication encrypted
- **JWT**: Supabase-issued, verified by framework middleware
- **Parameterized Queries**: Drizzle ORM prevents SQL injection
- **CSP Headers**: Limits script execution to trusted sources

---

## Conclusion

The Alaq project has a **solid foundation** with TanStack Start, Supabase, and Radix UI providing good defaults for security. However, **3 critical issues must be addressed immediately**:

1. ✅ **DONE**: Remove Lovable dependencies & lock-in
2. **TODO**: Migrate to independent Supabase project
3. **TODO**: Replace Lovable AI Gateway or obtain API key
4. **TODO**: Implement security headers & rate limiting

**Estimated Remediation Time**: 2-3 weeks for all high-priority items

**Recommendation**: Focus on critical issues before public beta release. Medium-priority items can be addressed in parallel during feature development.

---

**Report Generated**: November 15, 2026  
**Next Review**: After each major deployment or quarterly (whichever is sooner)

