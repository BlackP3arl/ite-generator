# User Management & Role Assignment Guide

## Overview
The ITE Generator now includes a comprehensive user management system with role-based access control accessible through the **⚙️ Settings** icon in the main navigation.

---

## System Administrator

**Ahmed Salam** (`ahmed.salam@mtcc.com.mv`) has been designated as the **System Administrator** with full ADMIN privileges.

### Admin Privileges
- Access to User Management & Settings
- Create and manage user accounts
- Assign and modify user roles
- View all ITEs regardless of status
- Reset user passwords
- Full system configuration access

---

## Accessing User Management

1. **Login** to the ITE Generator application
2. Look for the **⚙️ Settings** icon in the top-right header (visible only to Admins)
3. Click the settings icon to access the User Management interface

---

## User Management Features

### 1. Dashboard Statistics
The management page displays real-time statistics:
- **Total Users**: Overall user count
- **Admins**: Number of administrators
- **Creators**: Users who can create ITEs
- **Reviewers**: Users who can review ITEs
- **Approvers**: Users who can approve/reject ITEs
- **Viewers**: Read-only users

### 2. Search & Filter
- **Search Bar**: Search users by name or email
- **Role Filter**: Filter users by specific roles
- **Results Counter**: Shows filtered results count

### 3. User Creation
Click **"+ Create User"** to create new email/password users:
- Enter email address (required)
- Enter name (optional)
- Set password (minimum 8 characters)
- Assign role (defaults to ITE_VIEWER)

### 4. User Management
For each user, you can:
- **View Details**: Email, name, auth method, role, creation date
- **Change Role**: Select from dropdown (color-coded)
- **Reset Password**: Set new password for email/password users

---

## User Roles & Permissions

### 🟡 ADMIN (Administrator)
**Full System Access**
- Create, view, edit, and delete all ITEs
- Access User Management & Settings
- Assign roles to users
- Can perform all workflow actions
- View all audit logs

### 🔵 ITE_CREATOR (Creator)
**Create & Submit ITEs**
- Create new ITEs
- Edit ITEs in DRAFT or REJECTED status
- Submit ITEs for review
- Recall ITEs from review states
- View only their own ITEs

### 🟢 ITE_REVIEWER (Reviewer)
**Review ITEs**
- View ITEs in review states (PENDING_REVIEW, IN_REVIEW)
- Edit ITEs during review
- Mark ITEs as reviewed (moves to approval)
- View ITEs assigned to them

### 🟢 ITE_APPROVER (Approver)
**Approve/Reject ITEs**
- View ITEs in PENDING_APPROVAL status
- Approve ITEs (final approval)
- Reject ITEs with mandatory comment
- View ITEs assigned to them

### ⚪ ITE_VIEWER (Viewer)
**Read-Only Access**
- View all ITEs (cannot modify)
- Search and filter ITEs
- View audit logs
- Cannot create, edit, or delete ITEs
- **Default role for Azure AD users**

---

## Auto-Provisioning

### Azure AD Integration
When users sign in via Azure AD for the first time:
1. User account is **automatically created**
2. Assigned **ITE_VIEWER** role by default
3. Linked to Azure AD profile
4. Admin can later upgrade their role as needed

### Email/Password Users
Created manually by admins:
1. Admin creates account with specific role
2. User receives credentials
3. Can sign in immediately
4. Password can be reset by admin

---

## Workflow Integration

### Role-Based Dashboard
Each user sees customized statistics:
- **Creators**: My ITEs, My Drafts, My In Review, etc.
- **Reviewers**: Assigned to Me, Pending My Review, Available for Review
- **Approvers**: Assigned to Me, Pending My Approval, Available for Approval
- **Viewers**: Read-only statistics

### Role-Based Actions
Action buttons in ITE listings are dynamically shown based on:
- User's role
- ITE's current status
- User's relationship to the ITE (creator, reviewer, approver)

---

## Security Features

### Authentication
- Dual authentication: Azure AD + Email/Password
- Session management with NextAuth.js
- Secure password hashing with bcrypt
- JWT session tokens

### Authorization
- Role-based access control (RBAC)
- API-layer permission validation
- UI-layer action visibility
- Audit logging for compliance

### Password Security
- Minimum 8 characters required
- Hashed storage (bcrypt)
- Admin-only password reset
- No plain-text passwords

---

## Running the Seed Script

To set or reset the admin account:

```bash
npm run seed
```

This will:
- Set `ahmed.salam@mtcc.com.mv` to ADMIN role
- Create the account if it doesn't exist
- Update existing account to ADMIN if it exists

---

## Common Tasks

### Assigning a New Reviewer
1. Go to User Management (⚙️ icon)
2. Find the user in the list
3. Click the role dropdown
4. Select "ITE Reviewer"
5. Change is saved automatically

### Creating a New Creator Account
1. Click **"+ Create User"**
2. Enter email and password
3. Select "ITE Creator" role
4. Click "Create User"
5. User can now sign in and create ITEs

### Upgrading Azure AD User
1. User signs in via Azure AD (auto-created as Viewer)
2. Admin goes to User Management
3. Finds the user (search by email)
4. Changes role from dropdown
5. User now has new permissions

### Resetting User Password
1. Find user in list
2. Click "Reset Password" button
3. Enter new password (min 8 chars)
4. Confirm
5. User can now sign in with new password

---

## Troubleshooting

### User Can't Access Settings
- Verify user has ADMIN role
- Check that ⚙️ icon appears in header
- Try signing out and back in

### Role Change Not Taking Effect
- Have user sign out and back in
- Check browser doesn't have cached session
- Verify role was saved (refresh user list)

### Auto-Provisioning Not Working
- Check Azure AD configuration in `.env`
- Verify `AZURE_AD_CLIENT_ID`, `AZURE_AD_CLIENT_SECRET`, `AZURE_AD_TENANT_ID`
- Check NextAuth configuration

### Seed Script Fails
- Ensure database is running
- Check `DATABASE_URL` in `.env`
- Run `npx prisma generate` first
- Check database connection

---

## Best Practices

1. **Minimal Admin Accounts**: Only assign ADMIN role to trusted personnel
2. **Regular Reviews**: Periodically review user roles and access
3. **Default to Viewer**: Start new users as Viewers, upgrade as needed
4. **Strong Passwords**: Enforce strong passwords for email/password accounts
5. **Audit Logs**: Regularly review audit logs for unusual activity
6. **Role Hierarchy**: Assign roles based on actual job functions
7. **Azure AD First**: Prefer Azure AD authentication over email/password

---

## Support

For issues or questions:
1. Check this guide first
2. Verify user role and permissions
3. Check audit logs for insight
4. Contact system administrator (Ahmed Salam)
