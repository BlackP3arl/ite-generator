# 🚀 Quick Start Guide - Azure AD Authentication

## ⚡ Immediate Next Steps

### **Step 1: Configure Azure AD Redirect URI**

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** → **App registrations**
3. Click your app (ITE Generator)
4. Go to **Authentication**
5. Click **Add a platform** → **Web**
6. Add this Redirect URI:
   ```
   http://localhost:3001/api/auth/callback/azure-ad
   ```
7. Click **Save**

### **Step 2: Test the Application**

1. Your server is already running at: **http://localhost:3001**
2. Open your browser and visit: **http://localhost:3001**
3. You'll be redirected to Microsoft sign-in
4. Sign in with your organizational account
5. After successful sign-in, you'll be back at the app

### **Step 3: Verify Everything Works**

✅ Check that you see:
- Your name/email in the top-right header
- "Sign Out" button
- Dashboard showing "Total ITEs: 0" (if new user)
- "✨ New ITE" button

✅ Try creating a new ITE:
- Upload an ITS PDF
- Go through the workflow
- Save it to database
- Verify it shows in your dashboard

---

## 🔑 Current Configuration

**Application URL:** http://localhost:3001

**Azure AD Redirect URI (Required):**
```
http://localhost:3001/api/auth/callback/azure-ad
```

**Environment Variables (.env):**
```
✅ AZURE_AD_CLIENT_ID      = Set
✅ AZURE_AD_CLIENT_SECRET  = Set
✅ AZURE_AD_TENANT_ID      = Set
✅ NEXTAUTH_URL            = http://localhost:3001
✅ NEXTAUTH_SECRET         = Auto-generated
✅ DATABASE_URL            = Set
✅ ANTHROPIC_API_KEY       = Set
```

---

## 🎭 User Roles

**New Users (Default Role: "user"):**
- ✅ Can create ITEs
- ✅ Can view their own ITEs
- ✅ Can edit their own ITEs
- ✅ Can delete their own ITEs
- ❌ Cannot see other users' ITEs

**Admin Users (Role: "admin"):**
- ✅ Can view ALL ITEs from ALL users
- ✅ Can edit any ITE
- ✅ Can delete any ITE
- ✅ Full system access

---

## 🛠️ How to Make Someone an Admin

### **Option 1: Using Prisma Studio (GUI)**
```bash
npx prisma studio
```
1. Open **User** table
2. Find the user by email
3. Change `role` from "user" to "admin"
4. Save

### **Option 2: Using SQL**
```bash
psql -d ite_db -c "UPDATE \"User\" SET role = 'admin' WHERE email = 'admin@example.com';"
```

### **Option 3: Using Prisma (from Node.js console)**
```javascript
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

await prisma.user.update({
  where: { email: 'admin@example.com' },
  data: { role: 'admin' }
});
```

---

## 🐛 Common Issues & Fixes

### **Issue: "Redirect URI mismatch error"**

**Symptoms:** After clicking sign-in, you get an error from Microsoft

**Fix:**
1. Go to Azure Portal → Your App → Authentication
2. Ensure redirect URI is **exactly**:
   ```
   http://localhost:3001/api/auth/callback/azure-ad
   ```
3. No trailing slash, correct port (3001 not 3000)

---

### **Issue: "Session error" or "Invalid credentials"**

**Symptoms:** Can't sign in, or get kicked out immediately

**Fix:**
1. Clear browser cookies for localhost
2. Restart dev server:
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```
3. Try signing in again

---

### **Issue: Can't see any ITEs after signing in**

**Symptoms:** Dashboard shows 0 ITEs, but you know some exist

**Reason:** Old ITEs were created before authentication was added, so they have no `userId`

**Fix:** Choose one:

**Option A:** Delete old ITEs and create new ones
```sql
DELETE FROM "ITE" WHERE "userId" IS NULL;
```

**Option B:** Assign old ITEs to yourself
```sql
UPDATE "ITE" SET "userId" = '<your-user-id>' WHERE "userId" IS NULL;
```

To find your user ID:
```sql
SELECT id FROM "User" WHERE email = 'your-email@example.com';
```

---

### **Issue: "NEXTAUTH_SECRET" error**

**Symptoms:** Error about missing or invalid NEXTAUTH_SECRET

**Fix:**
1. Check `.env` file has `NEXTAUTH_SECRET`
2. If missing, run:
   ```bash
   openssl rand -base64 32
   ```
3. Add to `.env`:
   ```
   NEXTAUTH_SECRET=<generated-value>
   ```
4. Restart server

---

## 📝 Quick Commands

### **Start Development Server:**
```bash
npm run dev
```

### **View Database (Prisma Studio):**
```bash
npx prisma studio
```

### **Run Database Migrations:**
```bash
npx prisma migrate dev
```

### **Generate Prisma Client (after schema changes):**
```bash
npx prisma generate
```

### **View All Users:**
```bash
psql -d ite_db -c "SELECT id, email, name, role FROM \"User\";"
```

### **View All ITEs:**
```bash
psql -d ite_db -c "SELECT \"iteNumber\", \"createdAt\", \"userId\" FROM \"ITE\";"
```

---

## 🎯 What Happens Next?

### **On First Sign-In:**
1. Your Microsoft account info is retrieved
2. A new User record is created in the database:
   - Email from your Microsoft account
   - Name from your Microsoft account
   - Azure ID (unique identifier)
   - Role: "user" (default)
3. Session is created
4. You're redirected to the dashboard

### **On Subsequent Sign-Ins:**
1. Existing user is found by email
2. User info is updated (if name changed)
3. Session is created
4. You're redirected to the dashboard

---

## ✅ Testing Checklist

- [ ] Can sign in with Microsoft account
- [ ] See your name in header after sign-in
- [ ] Can sign out using "Sign Out" button
- [ ] Dashboard loads without errors
- [ ] Can create a new ITE
- [ ] Created ITE appears in dashboard
- [ ] Can view created ITE
- [ ] Can edit created ITE
- [ ] Can delete created ITE
- [ ] After sign out + sign in, still see your ITEs

---

## 🚀 Ready for Production?

When you're ready to deploy, update these:

1. **Azure AD:**
   - Add production redirect URI: `https://yourdomain.com/api/auth/callback/azure-ad`

2. **.env (Production):**
   ```env
   NEXTAUTH_URL=https://yourdomain.com
   ```

3. **Deploy app and run migration:**
   ```bash
   npx prisma migrate deploy
   ```

---

## 📚 Additional Resources

- **NextAuth Documentation:** https://next-auth.js.org/
- **Azure AD Provider:** https://next-auth.js.org/providers/azure-ad
- **Prisma Documentation:** https://www.prisma.io/docs
- **Enhancement Plan:** See `ENHANCEMENT_PLAN.md`
- **Full Setup Guide:** See `AUTHENTICATION_SETUP.md`

---

**🎉 You're all set! Visit http://localhost:3001 and sign in to get started!**
