# Team Ownership Map

This repo keeps shared foundations in place and groups feature-owned code under dedicated paths so each member can work mostly inside one backend folder and one frontend folder.

## Shared Foundations

Keep these as shared/common unless the whole team agrees on a cross-cutting change:

- `backend/src/main/java/com/smartcampus/operationshub/config`
- `backend/src/main/java/com/smartcampus/operationshub/domain`
- `backend/src/main/java/com/smartcampus/operationshub/exception`
- `backend/src/main/java/com/smartcampus/operationshub/mapper`
- `backend/src/main/java/com/smartcampus/operationshub/security`
- `backend/src/main/java/com/smartcampus/operationshub/service/storage`
- `backend/src/main/resources`
- `backend/src/test/java/com/smartcampus/operationshub`
- `frontend/src/context`
- `frontend/src/lib/api.js`
- `frontend/src/lib/routes.js`
- `frontend/src/lib/validation.js`
- `frontend/src/router`
- `frontend/src/ui/layout`
- `frontend/src/ui/navigation`
- `frontend/src/ui/AlertBanner.jsx`
- `frontend/src/ui/LoadingScreen.jsx`
- `frontend/src/ui/ThemeSwitcher.jsx`
- `frontend/src/ui/pages/LandingPage.jsx`
- `frontend/src/ui/pages/CampusHomePage.jsx`
- `frontend/src/ui/pages/DashboardPages.jsx`
- `frontend/src/ui/pages/AdminAnalyticsPage.jsx`

## Member 1

Facilities catalogue and resource management

- Backend: `backend/src/main/java/com/smartcampus/operationshub/features/resources`
- Frontend: `frontend/src/features/resources`

## Member 2

Booking workflow and conflict checking

- Backend: `backend/src/main/java/com/smartcampus/operationshub/features/bookings`
- Frontend: `frontend/src/features/bookings`

## Member 3

Incident tickets, attachments, and technician updates

- Backend: `backend/src/main/java/com/smartcampus/operationshub/features/tickets`
- Frontend: `frontend/src/features/tickets`

## Member 4

Notifications, role management, and OAuth integration improvements

- Backend:
  - `backend/src/main/java/com/smartcampus/operationshub/features/access`
  - `backend/src/main/java/com/smartcampus/operationshub/features/notifications`
- Frontend:
  - `frontend/src/features/access`
  - `frontend/src/features/notifications`

## Notes

- Auth, role handling, Google OAuth, shared shells, and common utilities remain in shared folders.
- Backend tests stay in `backend/src/test/java/com/smartcampus/operationshub` because Maven/JUnit discovery is package-sensitive there.
- The feature source split is already wired into imports and routes, so teammates can work directly from these folders.
