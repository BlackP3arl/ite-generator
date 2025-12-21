# Security Assessment Report: ITE Generator Application

**Assessment Date**: 2025-12-03
**Application Version**: 1.0.0
**Overall Risk Rating**: **HIGH** (due to exposed secrets and file handling vulnerabilities)

---

## Executive Summary

This security assessment identified **12 findings** across multiple severity levels. The application has a Next.js architecture with dual authentication (Azure AD + credentials), PostgreSQL database, and AI-powered document processing. While the application has no critical dependency vulnerabilities, several high and medium severity issues require immediate attention, particularly around secrets management, authentication implementation, and file handling.

---

## Application Overview

- **Technology Stack**: Next.js 14, React 18, NextAuth.js, Prisma ORM, PostgreSQL, Anthropic AI SDK
- **Authentication**: Dual authentication (Azure AD OAuth + Email/Password)
- **Key Features**: Document upload, AI-based extraction, user management, PDF export
- **File Structure**: Next.js App Router architecture

---

## Findings Summary

| Severity | Count | Categories |
|----------|-------|------------|
| **CRITICAL** | 2 | Secrets Management, Authentication |
| **HIGH** | 4 | File Security, Input Validation, Authorization |
| **MEDIUM** | 4 | Session Management, Error Handling, CSRF |
| **LOW** | 2 | Information Disclosure, Best Practices |

---

## CRITICAL Severity Findings

### 🔴 CRITICAL-01: Exposed Production Secrets in .env.example

**Location**: `.env.example:1-12`

**Description**: The `.env.example` file contains actual production credentials instead of placeholder values:
- Real Anthropic API key visible
- Real Azure AD Client ID, Client Secret, and Tenant ID
- Real NextAuth secret
- Production database credentials

**Impact**:
- Attackers can access your Anthropic API account and incur costs
- Azure AD application can be compromised
- Session tokens can be forged with the exposed NEXTAUTH_SECRET
- Database can be accessed directly



**Recommendation**:
1. **IMMEDIATE**: Rotate ALL credentials:
   - Generate new Anthropic API key
   - Regenerate Azure AD client secret
   - Generate new NEXTAUTH_SECRET: `openssl rand -base64 32`
2. Replace `.env.example` with placeholder values only:
   ```plaintext

   ```
3. Check git history for exposed secrets and consider repository rotation if committed
4. Enable secret scanning on your repository

---

### 🔴 CRITICAL-02: Multiple Prisma Client Instances (Connection Pool Exhaustion)

**Location**:
- `app/api/auth/[...nextauth]/route.js:7`
- `app/api/ite/route.js:7`
- `app/api/ite/[id]/route.js:7`
- `lib/auth.js:5`
- Multiple other API routes

**Description**: Each API route and module creates a new `PrismaClient()` instance. In serverless/development environments, this causes connection pool exhaustion.

**Impact**:
- Database connection exhaustion → Application downtime
- Performance degradation
- Resource wastage
- Potential denial of service

**Evidence**:
```javascript
// Found in multiple files:
const prisma = new PrismaClient();
```

**Recommendation**:
Create a singleton Prisma client pattern in `lib/prisma.js`:
```javascript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

Then import from this file: `import { prisma } from '@/lib/prisma';`

---

## HIGH Severity Findings

### 🟠 HIGH-01: Path Traversal Vulnerability in File Upload

**Location**:
- `app/api/ite/route.js:63-78`
- `app/api/ite/[id]/route.js:53-64`

**Description**: File upload paths are constructed using user-controlled `iteNumber` and `file.name` without sanitization. An attacker could craft malicious filenames to write files outside the intended directory.

**Impact**:
- Write arbitrary files anywhere on the filesystem
- Overwrite critical application files
- Potential remote code execution if uploaded files are later executed

**Evidence**:
```javascript
const uploadDir = path.join(process.cwd(), 'public', 'uploads', iteNumber.replace('/', '_'));
const fileName = `ITS_${itsFile.name}`;  // No sanitization of itsFile.name
const filePath = path.join(uploadDir, fileName);
fs.writeFileSync(filePath, buffer);
```

Attack vector: Upload file named `../../../../../../etc/passwd` or `..\..\..\config.js`

**Recommendation**:
1. Sanitize all filenames:
```javascript
import path from 'path';

function sanitizeFilename(filename) {
  // Remove path separators and null bytes
  return filename.replace(/[/\\:*?"<>|\x00]/g, '_').substring(0, 255);
}

const fileName = `ITS_${sanitizeFilename(itsFile.name)}`;
```
2. Validate that the final path is within the upload directory:
```javascript
const resolvedPath = path.resolve(filePath);
if (!resolvedPath.startsWith(path.resolve(uploadDir))) {
  throw new Error('Invalid file path');
}
```

---

### 🟠 HIGH-02: Unrestricted File Upload - No Type/Size Validation

**Location**:
- `app/api/ite/route.js:71-92`
- `app/api/ite/[id]/route.js:57-74`

**Description**: Server-side file upload handlers accept any file type and size without validation. Client-side restrictions (`accept=".pdf"`) can be easily bypassed.

**Impact**:
- Upload of malicious executables (`.exe`, `.sh`, `.php`)
- Disk space exhaustion via large file uploads
- Potential code execution if files are served without proper headers
- Resource exhaustion

**Evidence**:
```javascript
// No server-side validation
const buffer = Buffer.from(await itsFile.arrayBuffer());
fs.writeFileSync(filePath, buffer);
```

**Recommendation**:
1. Implement server-side file validation:
```javascript
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['application/pdf'];

if (!file || !(file instanceof Blob)) {
  return NextResponse.json({ error: 'Invalid file' }, { status: 400 });
}

if (file.size > MAX_FILE_SIZE) {
  return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
}

if (!ALLOWED_TYPES.includes(file.type)) {
  return NextResponse.json({ error: 'Only PDF files allowed' }, { status: 400 });
}
```
2. Verify PDF magic bytes (header): `%PDF-`
3. Set appropriate Content-Security-Policy headers when serving files

---

### 🟠 HIGH-03: SQL Injection Risk via parseInt Without Validation

**Location**:
- `app/api/ite/[id]/route.js:15`
- `app/api/ite/[id]/route.js:36`
- `app/api/ite/[id]/route.js:99`

**Description**: Dynamic route parameters are converted to integers without validation. While Prisma provides parameterization, `parseInt(params.id)` can return `NaN`, leading to unexpected query behavior.

**Impact**:
- Unexpected database queries
- Information disclosure
- Potential for logical vulnerabilities

**Evidence**:
```javascript
const id = parseInt(params.id);  // No validation
const ite = await prisma.iTE.findUnique({ where: { id } });
```

If `params.id = "abc"`, then `id = NaN`, which could cause issues.

**Recommendation**:
```javascript
const id = parseInt(params.id, 10);
if (isNaN(id) || id < 1) {
  return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
}
```

---

### 🟠 HIGH-04: Insecure Direct Object Reference (IDOR) - Insufficient Authorization Check

**Location**: `app/api/ite/[id]/route.js:20-23`

**Description**: Authorization check is performed AFTER fetching the resource from database, potentially exposing timing information and object existence to unauthorized users.

**Impact**:
- Attackers can enumerate valid ITE IDs
- Timing attacks to determine resource existence
- Information disclosure about other users' resources

**Evidence**:
```javascript
const ite = await prisma.iTE.findUnique({ where: { id } });
if (!ite) {
  return NextResponse.json({ error: 'ITE not found' }, { status: 404 });
}
const hasAccess = await canAccessResource(ite.userId);  // Authorization AFTER fetch
if (!hasAccess) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

**Recommendation**:
Fetch resource with authorization filter in the same query:
```javascript
const user = await getCurrentUser();
if (!user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

const ite = await prisma.iTE.findFirst({
  where: {
    id,
    OR: [
      { userId: user.id },
      { user: { role: 'admin' } }
    ]
  }
});

if (!ite) {
  // Same response for not found and forbidden to prevent enumeration
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
```

---

## MEDIUM Severity Findings

### 🟡 MEDIUM-01: Missing CSRF Protection on State-Changing Operations

**Location**:
- `app/api/user/role/route.js:8-54`
- `app/api/user/password/route.js:9-96`

**Description**: NextAuth provides CSRF tokens for authentication flows, but custom API routes don't implement CSRF protection for state-changing operations (role changes, password updates).

**Impact**:
- Cross-Site Request Forgery attacks
- Unauthorized privilege escalation
- Unauthorized password changes

**Attack Scenario**:
Attacker tricks an authenticated admin into visiting:
```html
<form action="https://yourapp.com/api/user/role" method="POST">
  <input name="userId" value="attacker-id">
  <input name="role" value="admin">
</form>
<script>document.forms[0].submit();</script>
```

**Recommendation**:
1. Use Next.js API route headers to check origin:
```javascript
const origin = request.headers.get('origin');
const host = request.headers.get('host');
if (origin && !origin.includes(host)) {
  return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
}
```
2. Implement double-submit cookie pattern or use NextAuth's CSRF token
3. Add `SameSite=Strict` to session cookies (check NextAuth configuration)

---

### 🟡 MEDIUM-02: Excessive Error Information Disclosure

**Location**: Multiple API routes
- `app/api/extract-its/route.js:93-97`
- `app/api/extract-quotes/route.js:135-140`

**Description**: Error messages expose internal implementation details including stack traces and error messages to clients.

**Impact**:
- Information disclosure about application internals
- Easier reconnaissance for attackers
- Potential exposure of file paths, database schema

**Evidence**:
```javascript
return NextResponse.json(
  { error: error.message || 'Failed to extract...' },
  { status: 500 }
);
```

**Recommendation**:
```javascript
console.error('Error extracting ITS:', error);  // Log detailed error server-side
return NextResponse.json(
  { error: 'Failed to process document. Please try again.' },
  { status: 500 }
);
```

---

### 🟡 MEDIUM-03: No Rate Limiting on Authentication and API Endpoints

**Location**: All API routes lack rate limiting

**Description**: No rate limiting is implemented on authentication endpoints or resource-intensive AI API calls.

**Impact**:
- Brute force attacks on credentials provider
- API cost exhaustion (Anthropic API calls)
- Denial of service
- Credential stuffing attacks

**Recommendation**:
1. Implement rate limiting middleware using `@upstash/ratelimit` or similar:
```javascript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
});

export async function POST(request) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }
  // ... rest of handler
}
```
2. Stricter limits on AI endpoints (cost control)
3. Implement account lockout after failed login attempts

---

### 🟡 MEDIUM-04: Session Security - Missing Security Headers

**Location**: `app/api/auth/[...nextauth]/route.js:115-118`

**Description**: NextAuth session configuration lacks explicit secure cookie settings and security headers.

**Impact**:
- Session hijacking via insecure cookies
- XSS-based session theft
- Man-in-the-middle attacks in production

**Recommendation**:
Update authOptions in NextAuth configuration:
```javascript
export const authOptions = {
  // ... existing config
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8 hours
  },
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
```

Add `next.config.js` security headers:
```javascript
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      ],
    },
  ];
},
```

---

## LOW Severity Findings

### 🔵 LOW-01: Sensitive Data in Client-Side State

**Location**: `app/page.js:1-1132`

**Description**: Client component stores full ITE data including potentially sensitive information in browser memory and React state.

**Impact**:
- Information disclosure via browser DevTools
- Data exposure in React DevTools
- Memory dumps could expose sensitive data

**Recommendation**:
1. Minimize data sent to client
2. Use server components where possible for data display
3. Consider client-side encryption for sensitive fields

---

### 🔵 LOW-02: Missing Input Sanitization in Non-Critical Fields

**Location**:
- `app/page.js:174-176` (metadata changes)
- `app/page.js:1084-1088` (comments)

**Description**: User inputs for metadata and comments are not sanitized before storage, though they're not rendered dangerously.

**Impact**:
- Potential XSS if rendering logic changes
- Database pollution

**Recommendation**:
Implement input sanitization library like DOMPurify or validator.js for user inputs before storage.

---

## Additional Observations

### ✅ Positive Security Findings:
1. **No dependency vulnerabilities** detected (npm audit clean)
2. **Password hashing** properly implemented using bcryptjs with salt rounds of 10
3. **No use of dangerous functions** (`eval`, `dangerouslySetInnerHTML`)
4. **Environment files** properly gitignored
5. **Parameterized queries** via Prisma ORM (SQL injection protection)
6. **Role-based access control** implemented with admin/user roles

### Security Best Practices Recommendations:
1. Implement Content Security Policy (CSP)
2. Add security.txt file for responsible disclosure
3. Implement audit logging for sensitive operations
4. Add data retention and deletion policies
5. Regular security dependency updates
6. Implement backup and disaster recovery procedures

---

## Remediation Priority

### Immediate (This Week):
1. **CRITICAL-01**: Rotate all exposed secrets
2. **CRITICAL-02**: Fix Prisma client singleton pattern
3. **HIGH-01**: Implement path traversal protection
4. **HIGH-02**: Add file upload validation

### Short-term (This Month):
5. **HIGH-03**: Add ID validation
6. **HIGH-04**: Fix IDOR vulnerability
7. **MEDIUM-01**: Implement CSRF protection
8. **MEDIUM-03**: Add rate limiting

### Medium-term (Next Quarter):
9. **MEDIUM-02**: Sanitize error messages
10. **MEDIUM-04**: Harden session security
11. **LOW-01, LOW-02**: Data minimization and input sanitization

---

## Compliance Considerations

If handling sensitive data, consider:
- **GDPR**: Implement data deletion, user consent, privacy policy
- **SOC 2**: Audit logging, access controls, encryption
- **OWASP Top 10 2021**: Address A01 (Broken Access Control), A03 (Injection), A04 (Insecure Design), A05 (Security Misconfiguration)

---

## Conclusion

The application has a solid foundation with proper password hashing and ORM usage. However, **immediate action is required** on the two CRITICAL findings to prevent potential compromise. The four HIGH severity findings should be addressed within the next development sprint to prevent exploitation. Implementation of the recommended fixes will significantly improve the application's security posture.

**Overall Risk Rating**: **HIGH** (due to exposed secrets and file handling vulnerabilities)

---

**Report Generated**: 2025-12-03
**Assessed By**: Senior Cybersecurity Analyst
**Next Review**: Recommended within 90 days after remediation
