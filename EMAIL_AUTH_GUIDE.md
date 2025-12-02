# Email/Password Authentication Guide

## Overview

The ITE Generator now supports **two authentication methods**:

1. **Azure AD (Microsoft Entra ID)** - For organizational users
2. **Email/Password** - For admin users and local accounts

Users can authenticate using either method, and admins can manage both types of accounts.

---

## Authentication Methods

### Azure AD Authentication
- Users sign in with their Microsoft organizational account
- Automatically creates user profile on first sign-in
- Default role: `user`
- No password stored in the application

### Email/Password Authentication
- Admin-created accounts with email and password
- Password is securely hashed using bcrypt
- Can be used by admins or regular users
- Managed through the Admin Panel

---

## For Administrators

### Accessing the Admin Panel

1. Sign in with an admin account (Azure AD or Email/Password)
2. Click the **"Admin Panel"** button in the header
3. The Admin Panel is only visible to users with `role = 'admin'`

### Creating Email/Password Users

1. Go to **Admin Panel** (`/admin`)
2. Click **"+ Create Email/Password User"**
3. Fill in the form:
   - **Email** (required): User's email address
   - **Name** (optional): User's display name
   - **Password** (required): Minimum 8 characters
   - **Role**: Select `user` or `admin`
4. Click **"Create User"**

### Managing Users

In the Admin Panel, you can:

- **View all users** with their authentication method
- **Change user roles** (user ↔ admin) using the dropdown
- **Reset passwords** for email/password accounts
- See when users were created

### Authentication Method Labels

- **Azure AD**: User signed in via Microsoft account only
- **Email/Password**: User has a password set
- **Both**: User can sign in with either Azure AD or Email/Password
- **None**: User exists but cannot sign in (legacy data)

---

## Creating Your First Admin Account

### Option 1: Via Prisma Studio (Recommended)

1. Open Prisma Studio:
   ```bash
   npx prisma studio
   ```

2. Go to the **User** table

3. Create a new user or update an existing user:
   - **Email**: `admin@example.com`
   - **Password**: Leave blank for now
   - **Name**: `Admin User`
   - **Role**: `admin`
   - Click **Save**

4. Now use the password API to set the password:
   ```bash
   curl -X POST http://localhost:3001/api/user/password \
     -H "Content-Type: application/json" \
     -d '{
       "email": "admin@example.com",
       "password": "YourSecurePassword123"
     }'
   ```

   **Note**: This will fail if you're not already signed in as an admin. See Option 2 below.

### Option 2: Via Direct Database Update

1. First, make yourself an admin via Azure AD:
   - Sign in with your Azure AD account
   - Check the database for your user ID:
     ```bash
     psql -d ite_db -c "SELECT id, email, role FROM \"User\" WHERE email = 'your-azure-email@example.com';"
     ```
   - Update your role to admin:
     ```bash
     psql -d ite_db -c "UPDATE \"User\" SET role = 'admin' WHERE email = 'your-azure-email@example.com';"
     ```

2. Refresh the app, and you'll see the "Admin Panel" button

3. Now you can create email/password accounts through the Admin Panel

### Option 3: Temporarily Create Admin via Code

If you need to bootstrap the first admin account programmatically:

1. Create a script `create-admin.js`:
   ```javascript
   const { PrismaClient } = require('@prisma/client');
   const bcrypt = require('bcryptjs');

   const prisma = new PrismaClient();

   async function main() {
     const email = 'admin@example.com';
     const password = 'ChangeThisPassword123';
     const hashedPassword = await bcrypt.hash(password, 10);

     const admin = await prisma.user.upsert({
       where: { email },
       update: {
         password: hashedPassword,
         role: 'admin',
       },
       create: {
         email,
         name: 'Admin User',
         password: hashedPassword,
         role: 'admin',
       },
     });

     console.log('Admin user created:', admin.email);
   }

   main()
     .catch(console.error)
     .finally(() => prisma.$disconnect());
   ```

2. Run the script:
   ```bash
   node create-admin.js
   ```

3. Sign in with `admin@example.com` and the password you set

4. **IMPORTANT**: Change the password immediately after first login via the Admin Panel

---

## Signing In

### With Azure AD
1. Go to `http://localhost:3001`
2. You'll be redirected to Microsoft sign-in
3. Enter your organizational credentials
4. You'll be redirected back to the app

### With Email/Password
1. Go to `http://localhost:3001`
2. You'll be redirected to the NextAuth sign-in page
3. Look for the **"Sign in with Email and Password"** option
4. Enter your email and password
5. Click **"Sign in with Email and Password"**
6. You'll be redirected back to the app

---

## Password Security

### Password Requirements
- Minimum 8 characters
- Stored using bcrypt hashing (10 rounds)
- Never stored in plain text
- Never displayed in API responses

### Password Management
- **Admins** can reset any user's password via the Admin Panel
- **Users** can change their own password (future feature - not yet implemented)

### Best Practices
1. Use strong passwords with mixed case, numbers, and symbols
2. Don't reuse passwords from other systems
3. Change default passwords immediately
4. Regularly rotate admin passwords

---

## API Endpoints

### Set/Update Password (Admin Only)
```http
POST /api/user/password
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123",
  "name": "User Name" // optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password updated successfully",
  "user": {
    "id": "...",
    "email": "user@example.com",
    "name": "User Name",
    "role": "user"
  }
}
```

### List All Users (Admin Only)
```http
GET /api/user/list
```

**Response:**
```json
[
  {
    "id": "...",
    "email": "user@example.com",
    "name": "User Name",
    "role": "user",
    "azureId": null,
    "password": true,
    "createdAt": "2025-12-01T00:00:00.000Z",
    "updatedAt": "2025-12-01T00:00:00.000Z"
  }
]
```

### Update User Role (Admin Only)
```http
PUT /api/user/role
Content-Type: application/json

{
  "userId": "clx123...",
  "role": "admin"
}
```

---

## Troubleshooting

### Can't See Admin Panel Button
- Verify your user role is set to `admin` in the database
- Sign out and sign in again to refresh your session
- Check browser console for errors

### Password Login Not Working
1. Verify the user has a password set in the database
2. Check that you're using the correct email
3. Ensure password meets minimum 8 character requirement
4. Try resetting the password via Admin Panel

### "Unauthorized: Admin access required"
- Only users with `role = 'admin'` can access admin features
- Ask an existing admin to promote your account
- Or update your role directly in the database

### Sign-In Page Shows Only Azure AD
- NextAuth will show all configured providers
- Make sure you're looking for "Sign in with Email and Password"
- Check that CredentialsProvider is configured in `route.js`

---

## Security Considerations

### Admin Account Security
1. **Limit admin accounts**: Only promote trusted users to admin
2. **Use strong passwords**: Enforce 12+ character passwords for admins
3. **Regular audits**: Review user list periodically in Admin Panel
4. **Rotate credentials**: Change admin passwords every 90 days

### Production Deployment
1. **Use HTTPS**: Email/password authentication requires secure connections
2. **Enable 2FA**: Consider adding two-factor authentication (future enhancement)
3. **Monitor sign-ins**: Log authentication attempts
4. **Rate limiting**: Implement login attempt throttling (future enhancement)

---

## Database Schema

### User Model
```prisma
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  name          String?
  password      String?  // bcrypt hash for email/password auth
  azureId       String?  @unique  // Azure AD identifier
  role          String   @default("user")  // user, admin
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  ites          ITE[]
}
```

### Password Field
- **Type**: `String?` (nullable)
- **Content**: bcrypt hash (60 characters)
- **Purpose**: Enables email/password authentication
- **Null**: User can only sign in via Azure AD

---

## Future Enhancements

Potential improvements to the authentication system:

1. **Self-Service Password Reset**
   - Email-based password reset flow
   - Temporary reset tokens

2. **User Self-Registration**
   - Allow users to create their own accounts
   - Email verification

3. **Two-Factor Authentication (2FA)**
   - TOTP-based 2FA
   - Required for admin accounts

4. **Password Change Feature**
   - Users can change their own password
   - Require current password verification

5. **Login Attempt Throttling**
   - Prevent brute force attacks
   - Temporary account lockout after failed attempts

6. **Session Management**
   - View active sessions
   - Revoke sessions remotely

7. **Audit Logging**
   - Track all authentication events
   - Admin action logging

---

## Migration from Azure AD Only

If you have existing users who only use Azure AD:

1. They can continue using Azure AD normally
2. Admin can optionally add a password for them
3. They can then choose either sign-in method
4. No disruption to existing workflows

---

## Quick Reference

| Task | Steps |
|------|-------|
| Create admin | Set role='admin' in database → Sign in |
| Create email user | Admin Panel → Create User → Fill form → Submit |
| Reset password | Admin Panel → User row → Reset Password button |
| Change role | Admin Panel → User row → Role dropdown |
| Sign in (Azure) | Visit app → Redirect to Microsoft → Enter creds |
| Sign in (Email) | Visit app → Email/Password form → Submit |

---

**Need Help?**

- Check server logs for detailed error messages
- Verify environment variables are set correctly
- Ensure database migrations are applied
- Review QUICK_START.md for setup instructions
