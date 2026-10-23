# Phase 2 Enterprise Backend (.NET 8 & SignalR) Rules

> **Scope**: Triggered whenever touching C# backend code, .NET solution files, EF Core migrations, or SignalR contracts in `server/` or when implementing the Phase 2 on-premises enterprise migration.

---

## 1. Clean Architecture Solution Structure
The backend follows standard .NET Clean Architecture principles:
- **`Bulletin.Domain`**: Core domain entities (`Post`, `Comment`, `Story`, `Profile`, `PollOption`), Enums, Value Objects, Domain Events. No external dependencies.
- **`Bulletin.Application`**: CQRS Handlers (MediatR), DTOs, FluentValidation rules, Interfaces (`IBulletinDbContext`, `IBlobStorageService`, `ISignalRHubContext`).
- **`Bulletin.Infrastructure`**: EF Core `DbContext`, SQL Server configuration, Migrations, SignalR Hub implementations, on-premises NAS file storage adapter (`/app_data/media`).
- **`Bulletin.WebApi`**: ASP.NET Core 8 Web API Controllers, Minimal API endpoints, Middleware (JWT Auth, RBAC, Rate Limiting), `Program.cs`.

---

## 2. Real-Time SignalR Architecture (`/hubs/bulletin`)
- **Hub Endpoint**: `/hubs/bulletin` mapped in `Program.cs`.
- **Event Contracts**:
  - `ReceivePost(PostDto post)`: Broadcasts newly published bulletins to all active clients or department channels.
  - `ReceiveReaction(Guid postId, ReactionCountDto counts)`: Broadcasts real-time like/reaction updates without polling.
  - `ReceiveComment(Guid postId, CommentDto comment)`: Broadcasts new threaded comments directly to viewers on that post.
  - `ReceiveEmergencyAlert(EmergencyAlertDto alert)`: High-priority push broadcast for HSE/grid incidents that overrides the client viewport with full-screen warning modal.
- **Connection Management**: Track client connection IDs mapped to corporate staff IDs (`SESB-XXXX`) for targeted notifications.

---

## 3. Database & Entity Framework Core Standards
- **Relational Integrity**: Use SQL Server on-premise with foreign key constraints, indexed lookup columns (`Department`, `CreatedAt`, `AuthorId`).
- **Audit Columns**: All primary entities must inherit `AuditableEntity` (`CreatedAt`, `CreatedBy`, `LastModifiedAt`, `LastModifiedBy`, `IsDeleted`).
- **Migrations**: Never modify `DbContext` schema directly in production. All schema changes must be versioned via `dotnet ef migrations add`.

---

## 4. Enterprise RBAC & Authentication
- Authenticate via Corporate Active Directory / LDAP / internal SESB SMTP OTP.
- Enforce Role-Based Access Control:
  - `General Staff`: Read bulletins, post casual updates, comment, react.
  - `Department Admin`: Post official department announcements, toggle comments on/off, pin up to 2 announcements per department.
  - `Super Admin / Corporate Comms`: Broadcast emergency alerts, department-level management, global audit logs.
