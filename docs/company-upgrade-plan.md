# Company Upgrade Plan

## Goal

Transform the local MVP into a team-ready internal operations system with:

- user and department ownership
- approval-ready workflow states
- activity logs and collaboration comments
- notification structure
- Prisma-based database migration path

## Recommended Architecture

- `app`: Next.js App Router pages and layout
- `components`: reusable UI and cross-feature presentation components
- `features`: domain-oriented feature modules such as dashboard, projects, tasks, admin
- `lib`: cross-cutting helpers such as permissions, export, progress rollup
- `hooks`: client hooks
- `store`: local MVP store and future API-cache adapter point
- `types`: shared domain types
- `utils`: filtering, date, and list utilities
- `prisma`: DB schema and future migrations

## Migration Strategy

1. Keep Zustand + localStorage as fallback for fast validation.
2. Introduce Prisma schema and repository layer.
3. Add API routes or server actions for CRUD.
4. Replace direct store mutations with service calls.
5. Add authentication and role-aware permission checks.
6. Move notifications and activity logs to DB-backed services.

## Role Expansion

- `admin`: full control
- `manager`: department-scoped management
- `member`: work execution and collaboration

## Key Models

- `Department`
- `User`
- `Project`
- `Task`
- `ChecklistItem`
- `ApprovalStep`
- `Comment`
- `ActivityLog`
- `Attachment`
- `Notification`
