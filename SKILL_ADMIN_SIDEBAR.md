# Admin Sidebar Navigation Skill

## Overview

This skill documents the reusable admin sidebar navigation pattern used in GigitekAI. It provides a persistent, searchable, collapsible sidebar for admin dashboards with drag-and-drop menu customization.

## Components

### 1. AdminLayoutWithSidebar

**Location:** `client/src/components/AdminLayoutWithSidebar.tsx`

**Purpose:** Main layout wrapper that provides persistent sidebar navigation across all admin pages.

**Features:**
- Persistent left sidebar with all admin sections
- Search functionality to filter menu items
- Collapsible sections (OPERATIONS, ANALYTICS)
- Icon support for visual recognition
- Responsive design
- Real-time notification badge

**Usage:**
```tsx
import { AdminLayoutWithSidebar } from "@/components/AdminLayoutWithSidebar";

export function AdminPage() {
  return (
    <AdminLayoutWithSidebar>
      {/* Your admin page content here */}
    </AdminLayoutWithSidebar>
  );
}
```

### 2. AdminMenuCustomizer

**Location:** `client/src/components/AdminMenuCustomizer.tsx`

**Purpose:** Component for admins to customize menu order via drag-and-drop.

**Features:**
- Drag-and-drop menu reordering
- Section grouping (Overview, Operations, Content, Analytics)
- Save/Reset functionality
- Real-time preview

**Usage:**
```tsx
import { AdminMenuCustomizer } from "@/components/AdminMenuCustomizer";

export function SettingsPage() {
  return <AdminMenuCustomizer />;
}
```

## Backend Routers

### 1. Admin Roles & Permissions Router

**Location:** `server/routers/admin-roles-permissions.ts`

**Procedures:**
- `createRole` - Create custom role with permissions
- `listRoles` - Get all custom roles
- `updateRole` - Modify role permissions
- `deleteRole` - Remove custom role
- `assignRoleToUser` - Assign role to user
- `removeRoleFromUser` - Remove role from user
- `checkPermission` - Check if user has permission

**Example:**
```ts
const role = await trpc.adminRoles.createRole.mutate({
  name: "Support Manager",
  permissions: ["view_tickets", "assign_tickets", "view_analytics"],
});
```

### 2. Admin Menu Customization Router

**Location:** `server/routers/admin-menu-customization.ts`

**Procedures:**
- `saveMenuCustomization` - Save menu order and collapsed sections
- `getMenuCustomization` - Retrieve user's menu customization
- `resetMenuCustomization` - Reset to default menu
- `toggleSectionCollapse` - Toggle section collapse state

**Example:**
```ts
await trpc.adminMenuCustomization.saveMenuCustomization.mutate({
  menuOrder: ["dashboard", "metrics", "helpdesk", ...],
  collapsedSections: ["OPERATIONS"],
});
```

## Database Schema

### adminMenuCustomization Table

```sql
CREATE TABLE adminMenuCustomization (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  menuOrder JSON NOT NULL,  -- Array of menu item IDs
  collapsedSections JSON NOT NULL,  -- Array of collapsed section names
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### customRoles Table

```sql
CREATE TABLE customRoles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  permissions JSON NOT NULL,  -- Array of permission strings
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### userRoleAssignments Table

```sql
CREATE TABLE userRoleAssignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  roleId INT NOT NULL REFERENCES customRoles(id) ON DELETE CASCADE,
  assignedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_role (userId, roleId)
);
```

## Menu Structure

Default menu items organized by section:

**OVERVIEW**
- Dashboard
- Metrics

**OPERATIONS**
- Helpdesk
- Closed Tickets
- Agent Dashboard
- Canned Responses
- Live Chat
- AI Agents
- Notifications

**CONTENT**
- Blog
- Newsletter
- Knowledge Base

**ANALYTICS**
- Surveys
- Workload
- KB Analytics

## Implementation Steps

### 1. Add to Existing Admin Page

```tsx
import { AdminLayoutWithSidebar } from "@/components/AdminLayoutWithSidebar";

export function MyAdminPage() {
  return (
    <AdminLayoutWithSidebar>
      <div className="p-6">
        <h1>My Admin Page</h1>
        {/* Your content */}
      </div>
    </AdminLayoutWithSidebar>
  );
}
```

### 2. Add Menu Customizer to Settings

```tsx
import { AdminMenuCustomizer } from "@/components/AdminMenuCustomizer";

export function AdminSettings() {
  return (
    <AdminLayoutWithSidebar>
      <AdminMenuCustomizer />
    </AdminLayoutWithSidebar>
  );
}
```

### 3. Create Custom Role

```tsx
const { mutate: createRole } = trpc.adminRoles.createRole.useMutation();

const handleCreateRole = () => {
  createRole({
    name: "Support Lead",
    permissions: ["view_tickets", "assign_tickets", "close_tickets"],
  });
};
```

## Styling & Customization

### Colors
- Background: `bg-background`
- Border: `border-border`
- Text: `text-foreground`
- Muted: `text-muted-foreground`

### Icons
The sidebar uses Lucide React icons. Supported icons:
- LayoutDashboard, BarChart3, Headphones, CheckCircle, Users, MessageSquare, MessageCircle, Zap, Bell, BookOpen, Mail, HelpCircle, BarChart2, TrendingUp, LineChart

### Responsive Design
- Desktop: Full sidebar visible
- Tablet: Sidebar collapses to icons
- Mobile: Sidebar becomes drawer

## Performance Considerations

1. **Menu Customization Caching**
   - Load customization on app init
   - Cache in React state
   - Update on save

2. **Search Optimization**
   - Debounce search input
   - Filter in-memory array
   - No database queries

3. **Role Checking**
   - Cache user roles in context
   - Check permissions before rendering
   - Use adminProcedure for protected routes

## Security

1. **Role-Based Access Control**
   - All admin routes use `adminProcedure`
   - Custom roles stored in database
   - Permissions checked on every request

2. **Menu Customization**
   - Per-user customization (userId-specific)
   - Cannot modify other users' menus
   - Validation on save

3. **Permission Checking**
   - Server-side validation
   - Frontend-side UI hiding (for UX)
   - Never trust client-side permission checks

## Troubleshooting

### Sidebar Not Showing
- Ensure component is wrapped with AdminLayoutWithSidebar
- Check if user has admin role
- Verify router registration

### Menu Customization Not Saving
- Check database connection
- Verify userId is set correctly
- Check browser console for errors

### Search Not Working
- Verify menu items have correct id/label
- Check search input onChange handler
- Ensure state is updating

## Future Enhancements

1. **Permission Management UI**
   - Visual permission editor
   - Role templates
   - Bulk role assignment

2. **Advanced Menu Customization**
   - Hide/show menu items
   - Custom menu item names
   - Menu item grouping

3. **Audit Logging**
   - Track role changes
   - Log menu customizations
   - Admin activity history

## Related Skills

- Contact Form Email Setup
- Teams Bot Helpdesk
- Microsoft 365 Calendar Booking

## Support

For issues or questions about this skill:
1. Check the troubleshooting section
2. Review component source code
3. Check database schema
4. Review router implementations
