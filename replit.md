# Nilakkal Parking Management System

## Overview

A real-time parking management system for the Sabarimala Nilakkal base camp. The application provides parking availability tracking, vehicle entry management, and administrative controls for police officers managing the parking zones. It features a public-facing dashboard for pilgrims to check parking availability and an admin interface for police personnel to manage zones, generate tickets, and handle data backups.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with custom plugins for meta images and Replit integration
- **Routing**: Wouter (lightweight React router)
- **State Management**: React Context API (`ParkingProvider`) for global parking state with TanStack React Query for server state
- **Styling**: Tailwind CSS v4 with CSS variables for theming, shadcn/ui component library (New York style)
- **Charts**: Recharts for data visualization (bar charts, pie charts, area charts)
- **Animations**: Framer Motion for UI transitions

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with tsx for development execution
- **API Design**: RESTful JSON APIs under `/api/*` prefix
- **Build Process**: Custom esbuild script bundles server with selective dependency inlining for faster cold starts

### Data Storage
- **Primary Database**: PostgreSQL via Drizzle ORM
- **Schema Location**: `shared/schema.ts` - defines users, admins, parking zones, and vehicles tables
- **Migrations**: Drizzle Kit with migrations output to `./migrations`
- **Client-side Persistence**: IndexedDB for offline backup/restore functionality (events and snapshots stores)

### Authentication
- **Admin Authentication**: Custom username/password login stored in `admins` table
- **Session**: No session middleware configured (stateless API with client-side admin state)
- **Theme Switching**: Automatic dark mode for admin routes via `ThemeWrapper`

### Key Data Models
- **ParkingZone**: Tracks capacity, limits by vehicle type (heavy/medium/light), and current stats
- **Vehicle**: Records vehicle number, type, entry time, assigned zone and slot
- **Admin**: Police officer accounts with username, password, name, and police ID

### Offline Capabilities
- **PoliceBackup Component**: Manages local IndexedDB snapshots for data backup/restore
- **Persistence Utils**: Event sourcing pattern with append-only event log and periodic snapshots
- **Auto-restore**: Attempts to restore from latest snapshot on app mount

## External Dependencies

### Database
- PostgreSQL (connection via `DATABASE_URL` environment variable)
- Drizzle ORM with `drizzle-kit` for schema management

### UI Libraries
- Radix UI primitives (dialog, dropdown, tabs, tooltips, etc.)
- Lucide React icons
- Embla Carousel for carousel components
- react-day-picker for calendar components

### Build & Development
- Vite with React plugin and Tailwind CSS plugin
- Custom Replit plugins (cartographer, dev-banner, runtime-error-modal)
- esbuild for server bundling

### Utilities
- date-fns for date formatting
- zod + drizzle-zod for schema validation
- class-variance-authority + clsx + tailwind-merge for className utilities