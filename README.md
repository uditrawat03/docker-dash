# DockerDash

DockerDash is a desktop Docker management app built with Wails, Go, React, Tailwind CSS, and shadcn-style UI components. It gives developers a clean GUI for inspecting and operating Docker resources without leaving the desktop.

## What DockerDash Does

- Shows Docker environment metrics and daemon status.
- Lists and manages containers, images, volumes, networks, registries, CI workflows, Swarm state, and secrets.
- Streams container logs and runtime events.
- Provides reusable filters, status badges, notifications, keyboard shortcuts, and settings.
- Keeps Docker operations behind Go services so the React UI stays focused on presentation and workflows.

## Tech Stack

- **Desktop shell:** Wails v2
- **Backend:** Go
- **Frontend:** React and Vite
- **Styling:** Tailwind CSS
- **UI patterns:** shadcn-style reusable components
- **Icons:** lucide-react

## Requirements

- Go installed and available on your `PATH`
- Node.js and npm
- Wails CLI
- Docker Desktop or a compatible Docker Engine

## Local Development

From the `DockerDash` directory:

```powershell
wails dev
```

Wails starts the Go backend and the Vite frontend with live reload.

Frontend-only development is available from `DockerDash/frontend`:

```powershell
npm install
npm run dev
```

Use the Wails flow when you need backend bindings, Docker service calls, desktop APIs, or generated `wailsjs` integration.

## Project Structure

```text
DockerDash/
  app.go                    Wails app lifecycle and backend entry points
  docker_service.go          Docker client/service helpers
  containers/images/etc.     Resource-specific Go services
  frontend/
    src/
      components/            Feature and shared UI components
      config/                Navigation, commands, review, and app config
      hooks/                 Reusable frontend hooks
      providers/             App-level React providers
      services/              Wails-facing frontend service wrappers
      App.jsx                Route and workspace composition
```

Generated files under `frontend/wailsjs` are produced by Wails and should not be edited manually.

## Development Notes

- Keep the sidebar and header reusable and layout-focused.
- Keep Docker-specific behavior in Go services or frontend service wrappers.
- Prefer small feature panels under `frontend/src/components/<feature>/`.
- Use shared UI components from `frontend/src/components/ui/` before creating one-off controls.
- Keep the dashboard focused on Docker metrics and operational state.

## Verification

Useful checks before opening a pull request:

```powershell
go test ./...
```

```powershell
cd frontend
npm run build
```

Do not commit generated build artifacts unless the change explicitly requires them.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution workflow, coding standards, and pull request expectations.
