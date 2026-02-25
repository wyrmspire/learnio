# Migration to Production Backend

This document outlines the steps required to transition this "build sandbox" into a production-ready application backed by real services.

## 1. Swap the Data Client Mode
The application currently uses `MockDataClient` by default. To switch to the API client:
- Set the environment variable `NEXT_PUBLIC_DATA_MODE=api` in your `.env` file.
- This will cause `lib/data/index.ts` to export the `ApiDataClient`, which makes real `fetch` calls to the Next.js route handlers (`/app/api/...`).

## 2. Implement the Real Backend
Currently, the route handlers in `/app/api/` simply call the `MockDataClient` to simulate a backend. You need to replace this:
- **Move Command Execution Server-Side**: The logic in `lib/commands/index.ts` (e.g., `submitAttemptCommand`) should be moved to your actual backend service (e.g., a Node/Go/Python service).
- **Replace Local Event Store**: The `EventStore` in `lib/events/store.ts` uses `localStorage`. In production, events should be appended to a real database (e.g., PostgreSQL, EventStoreDB, or Kafka).
- **Update API Base URL**: Update the `ApiDataClient` (`lib/data/api.ts`) to point to your external backend URL instead of the local Next.js route handlers, or update the Next.js route handlers to proxy requests to your backend.

## 3. Introduce Auth and Multi-Tenancy
The current contracts have placeholders for `userId` (defaulting to `"user-1"`).
- Inject a real auth token (e.g., JWT) into the `ApiDataClient` headers.
- Update the backend commands to validate the `userId` and `orgId` from the token.
- Ensure all events appended to the store include the correct tenant context.

## 4. Distributed Tracing
- Add a `traceId` to the `ApiDataClient` requests.
- Ensure the backend logs and events include this `traceId` for observability.

## 5. Read Model Projections
- The `deriveDashboardReadModel` and `deriveProgressFeedReadModel` functions currently run synchronously in the browser.
- In production, these should be asynchronous projections running on the backend, updating a read-optimized database table (e.g., a materialized view in Postgres or a document in MongoDB) whenever new events are appended.
- The UI will simply fetch these pre-computed read models.
