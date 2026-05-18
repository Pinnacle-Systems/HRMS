# Code Review Checklist

## 1. UX Consistency

Review whether new screens follow existing UX patterns.

Checklist:

- Page headers use the same structure for title, subtitle, breadcrumbs, and actions.
- Primary and secondary actions are placed consistently.
- Buttons use existing variants, sizes, loading states, and disabled states.
- Forms use consistent spacing, labels, required markers, validation display, and submit/cancel behavior.
- Tables and lists use consistent columns, filters, pagination, empty states, and loading states.
- Dialogs, drawers, confirmations, and modals use consistent wording and action placement.
- Toasts, alerts, inline errors, and banners follow one consistent pattern.
- Status badges use shared styles and labels.
- Role-specific screens still feel like one product.

## 2. Reusable Components

Review whether repeated UI has been extracted into reusable components.

Checklist:

- Repeated page headers should use a shared `PageHeader` or equivalent.
- Repeated filters should use a shared `FilterBar` or equivalent.
- Repeated tables/lists should use shared table/list components where practical.
- Repeated status indicators should use shared `StatusBadge` components.
- Repeated empty, loading, and error states should use shared components.
- Repeated confirmation flows should use shared dialog components.
- Reuse should be promoted when the same pattern appears 2-3 times.
- Avoid over-generalizing components before a pattern is stable.

## 3. Feature Boundaries

Review whether code is organized by feature and responsibility.

Checklist:

- Feature-specific code stays inside the feature folder.
- Shared code is moved to shared folders only when genuinely reused.
- Pages are not overloaded with API, mapping, permission, and formatting logic.
- Components are focused and not too large.
- Hooks are used for reusable stateful logic.
- Utilities are used for pure reusable logic.
- Constants are centralized where appropriate.

## 4. Role and Permission Handling

Review whether role-based behavior is consistent and centralized.

Checklist:

- Avoid scattered checks like `user.role === "MANAGER"` directly inside JSX.
- Permission logic should be extracted into permission helpers, hooks, or route guards.
- Route-level protection should use existing route guard patterns.
- UI-level permission checks should be consistent across modules.
- Disabled/hidden actions should behave consistently.
- Permission failures should show consistent fallback UI.

## 5. Business Logic Separation

Review whether business rules are separated from presentation.

Checklist:

- Date calculations should not be duplicated across pages.
- Leave balance calculations should be centralized.
- Status transition rules should not be hardcoded in JSX.
- API response transformation should be handled in mappers/adapters.
- Magic strings for statuses, roles, and leave types should be constants/enums.
- Components should receive ready-to-render data where possible.

## 6. API Integration Consistency

Review whether API usage follows one pattern.

Checklist:

- API calls should go through a shared client or feature API layer.
- Auth token handling should be centralized.
- 401/403 handling should be consistent.
- Loading, success, empty, and error states should be consistent.
- Response/request types should be defined and reused.
- Backend quirks should be hidden behind mappers where practical.
- Mock data should be clearly separated from real API integration.

## 7. Forms and Validation

Review whether forms behave consistently.

Checklist:

- Validation timing is consistent.
- Required fields are marked consistently.
- Field-level and form-level errors are displayed consistently.
- Submit buttons show loading states.
- Cancel/reset behavior is clear.
- Server-side validation errors are handled consistently.
- Date pickers and select fields use shared components/patterns.
- Forms are accessible and keyboard usable.

## 8. Naming and File Structure

Review naming consistency.

Checklist:

- Component files use consistent naming.
- Page files use consistent naming.
- Hooks use `use...` naming.
- Types/interfaces are clearly named.
- Constants and enums are clearly named.
- Avoid multiple names for the same concept.
- Folder structure is predictable.

## 9. Styling and Design Tokens

Review whether styling is consistent and maintainable.

Checklist:

- Avoid raw colors when shared tokens or component variants exist.
- Avoid one-off spacing and sizing unless necessary.
- Prefer shared components over repeated className blocks.
- Status colors should be centralized.
- Hover, focus, disabled, and selected states should be clear and consistent.
- UI should not rely on color alone to communicate meaning.

## 10. Accessibility and Usability

Review basic usability and accessibility.

Checklist:

- Form fields have labels.
- Icon-only buttons have accessible labels.
- Focus states are visible.
- Keyboard navigation is not broken.
- Disabled controls communicate why they are disabled where needed.
- Tables/lists remain readable.
- Statuses include text labels, not just colors.

## 11. Testing Readiness

Review whether important behavior is testable.

Checklist:

- Business rules are extracted enough to unit test.
- API mappers can be tested.
- Permission logic can be tested.
- Critical flows have or can support integration tests.
- Avoid deeply nested, untestable JSX logic.
- Important HRMS flows should have acceptance-style coverage.

## 12. HRMS-Specific Review Areas

Checklist:

- Employee, Manager, HR, and Admin flows use consistent layouts.
- Leave module screens use consistent request, balance, approval, and calendar patterns.
- Attendance, onboarding, payroll, and employee profile screens should reuse similar UX patterns.
- Approval flows should use consistent action placement and status transitions.
- Date, holiday, leave balance, and workflow rules should be centralized.

## Review Priority

When reviewing a new or evolving codebase, prioritize findings in this order:

1. UX consistency
2. Shared component reuse
3. Role and permission handling
4. API integration pattern
5. Forms and validation behavior
6. Business logic separation
7. Folder and naming conventions
8. Testing readiness
9. Accessibility and usability
10. Styling/token consistency
