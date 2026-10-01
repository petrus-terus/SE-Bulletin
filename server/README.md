# 🏢 Sabah Electricity Bulletin — Server Architecture (Phase 2)

This directory is designated for the **Phase 2 Enterprise On-Premises Architecture** of the Sabah Electricity Internal Bulletin platform.

---

## 🗺️ Roadmap & Phase Distinction

| Feature | Phase 1 Pilot (Current Active) | Phase 2 Enterprise (Target) |
| :--- | :--- | :--- |
| **Hosting** | Cloudflare Pages (Global CDN, SSL/HTTPS) | On-Premise IIS / Linux Reverse Proxy (Wisma SESB) |
| **Backend API** | Supabase PostgREST + Realtime Engine | **ASP.NET Core 8 Web API (C#)** |
| **Realtime** | Supabase WebSocket Channels | **ASP.NET Core SignalR Hub (`/hubs/bulletin`)** |
| **Database** | Supabase Managed PostgreSQL | On-Premise Microsoft SQL Server / PostgreSQL |
| **File Storage** | Supabase Storage Bucket (`bulletin-media`) | Internal On-Premises NAS Mount (`/app_data/media`) |
| **Authentication** | Corporate Session Persistence + Supabase Auth | Corporate Active Directory (LDAP / Kerberos / SESB SMTP OTP) |

---

## 🛠️ Planned Project Structure (Phase 2)

When Phase 2 implementation begins, this directory will house the standard clean-architecture .NET solution:

```
server/
├── BulletinApi.sln
├── src/
│   ├── Bulletin.Domain/          # Core entities, Enums, Value Objects
│   ├── Bulletin.Application/     # CQRS Handlers, MediatR commands, DTOs, interfaces
│   ├── Bulletin.Infrastructure/  # EF Core DbContext, Migrations, SignalR Hubs, Blob storage
│   └── Bulletin.WebApi/          # ASP.NET Core 8 Web API Controllers & Program.cs
└── tests/
    ├── Bulletin.UnitTests/
    └── Bulletin.IntegrationTests/
```

---

## 📖 Specifications Reference

For the complete Phase 2 backend API specifications, database schema diagrams, SignalR event models, and role-based permissions matrix, please refer to:
- [`PROJECT_SPEC.md`](../PROJECT_SPEC.md) (Section 4 & Section 5)
- [`docs/PILOT_DEPLOYMENT_GUIDE.md`](../docs/PILOT_DEPLOYMENT_GUIDE.md) (Section 8: On-Premises Enterprise Migration Path)
