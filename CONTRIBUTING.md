# Contributing to DockerDash

Thanks for helping improve DockerDash. This project should stay approachable for beginners while remaining maintainable enough for advanced Docker workflows.

## Getting Started

1. Install Go, Node.js, npm, Docker, and the Wails CLI.
2. Clone the repository and open the `DockerDash` directory.
3. Install frontend dependencies from `frontend` with `npm install`.
4. Run the app with `wails dev`.

## Development Workflow

- Create a focused branch for each feature or fix.
- Keep commits small and explain the user-facing change.
- Avoid unrelated formatting churn.
- Do not edit generated files in `frontend/wailsjs` by hand.
- Do not commit local build outputs unless the change is specifically about packaging or generated assets.

## Backend Guidelines

- Keep Docker operations in Go service files.
- Return frontend-friendly DTOs instead of exposing raw Docker SDK internals.
- Handle Docker-not-running and permission errors with clear messages.
- Keep long-running operations cancellable where practical.
- Run `gofmt` on changed Go files.

## Frontend Guidelines

- Prefer reusable components under `frontend/src/components/ui/`.
- Keep feature panels under their feature folder, such as `containers`, `images`, `registries`, or `ci`.
- Keep layout components focused on layout, navigation, and shared chrome.
- Use lucide icons for actions where an icon exists.
- Keep dashboard content focused on Docker metrics and operational health.
- Make empty, loading, error, and success states clear.

## Pull Request Checklist

- The change is scoped to one feature, bug fix, or documentation update.
- The UI works at normal desktop widths and does not create horizontal overflow.
- New Docker operations have clear loading and error states.
- Frontend service wrappers stay consistent with existing patterns.
- Documentation is updated when behavior or setup changes.

## Verification

Run backend tests from the project root:

```powershell
go test ./...
```

Run the frontend build from `frontend`:

```powershell
npm run build
```

For UI changes, also run:

```powershell
wails dev
```

Then manually check the affected screen in the desktop app.
