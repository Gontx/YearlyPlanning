# YearlyPlanning - Architectural Review

## Overview
This document contains an architectural review of the **YearlyPlanning** project, focusing on code structure, state management, ease of maintenance, and best practices.

**Reviewer:** Antigravity Data Agent
**Date:** January 18, 2026

## 1. Architecture Highlights (Strengths)

*   **Repository Pattern**: The use of `IYearPlannerRepository` (implemented by `FirestoreRepository` and `LocalStorageRepository`) is an excellent choice. It decouples the business logic from the persistence layer, making it easy to swap backends (e.g., from LocalStorage to Firebase) or mock data for testing.
*   **Tech Stack Selection**: The combination of **Next.js 15 (App Router)**, **Tailwind CSS**, **Zustand**, and **Firebase** is modern, performant, and well-suited for this type of application.
*   **Type Safety**: Consistently strong usage of **TypeScript** and **Zod** for schema validation ensures data integrity across the app.
*   **UI Components**: Leveraging **Shadcn/UI** provides a solid, accessible, and customizable foundation for the UI component library.

## 2. Areas for Improvement & Recommendations

### A. State Management & potentially monolithic Store
**Observation**: `usePlannerStore.ts` is currently doing too much. It handles:
1.  **UI State**: `isDrawerOpen`, `selectedDate`.
2.  **Data State**: `dayData`, `holidays`.
3.  **Business Logic**: Complex date calculations (vacation logic, multi-day iteration).
4.  **Persistence Side-effects**: Direct calls to `getRepository().save...`.

**Recommendation**:
*   **Split the Store**: Consider separating UI state (ephemeral) from Data state (persistent).
    *   `useUIStore`: `isDrawerOpen`, `searchQuery`.
    *   `useDataStore`: `dayData`, `plans`.
*   **Extract Business Logic**: Move complex logic (like "calculate if a range consumes holiday allowance") into pure utility functions or domain services.
    *   *Example*: `calculateHolidayImpact(startDate, endDate, holidays) -> { affectedDays, allowanceCost }`.
    *   This makes logic testable without mocking the store.

### B. Optimistic Updates & Error Handling
**Observation**: The store updates local state immediately and then waits for the repository save. If the save fails (`await getRepository().save...`), the user is not notified, and the local state remains "incorrect" relative to the server.
**Recommendation**:
*   Implement a **rollback mechanism** or visual indicator (toast notification) if a save operation fails.
*   Use `try/catch` blocks within the store actions to handle persistence errors gracefully.

### C. Component Decomposition
**Observation**: `DayDetailsDrawer.tsx` is becoming large (~390 lines). It mixes layout, form handling (React Hook Form), and plan listing logic.
**Recommendation**:
*   Extract the **Plan Form** into a separate component (`<PlanForm />`).
*   Extract the **Plan List** into a separate component (`<PlanList />`).
*   This improves readability and allows reusing the form (e.g., if you later want a modal to add a plan from the year grid directly).

### D. Hardcoded Data
**Observation**: `SPANISH_HOLIDAYS` is imported directly into the store.
**Recommendation**:
*   Move holiday definitions to the database or a configuration file that can be loaded dynamically. This allows the app to support multiple regions without code changes.

### E. Testing Strategy
**Observation**: No automated tests were found.
**Recommendation**:
*   **Unit Tests**: Priorities for testing are the complex date logic functions (multi-day plan splitting, holiday allowance calculation). Use `Vitest` or `Jest`.
*   **E2E Tests**: Use Playwright to verify critical flows (Creating a plan -> Verifying it appears on the grid).

## 3. Security Considerations
*   Ensure **Firebase Security Rules** are configured to restrict access to `users/{userId}` collections so users can only read/write their own data.

## 4. Performance Optimizations
*   The `YearGrid` likely renders hundreds of `DayCell` components. Ensure `DayCell` is memoized (`React.memo`) if performance issues arise during drag operations or rapid updates.
