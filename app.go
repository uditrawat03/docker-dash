package main

import (
	"context"
	"sync"
)

// App struct
type App struct {
	ctx          context.Context
	docker       *DockerService
	logStreams   map[string]context.CancelFunc
	logStreamsMu sync.Mutex
}

// NewApp creates a new App application struct.
func NewApp() *App {
	return &App{docker: NewDockerService(), logStreams: make(map[string]context.CancelFunc)}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods.
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	_ = a.docker.Connect(ctx)
}

func (a *App) shutdown(ctx context.Context) {
	a.stopAllContainerLogStreams()
	_ = a.docker.Close()
}

// GetDockerStatus returns live Docker daemon status when Docker is reachable.
func (a *App) GetDockerStatus() DockerStatus {
	return a.docker.Status(a.ctx)
}

// ListContainers returns live containers from the active Docker context.
func (a *App) ListContainers() ([]ContainerInfo, error) {
	return a.docker.ListContainers(a.ctx)
}

// ListDemoContainers is kept as a frontend binding compatibility wrapper until Wails bindings are regenerated.
func (a *App) ListDemoContainers() []ContainerInfo {
	containers, err := a.ListContainers()
	if err != nil {
		return []ContainerInfo{}
	}

	return containers
}
func (a *App) StartContainer(id string) error {
	return a.docker.StartContainer(a.ctx, id)
}

func (a *App) StopContainer(id string) error {
	return a.docker.StopContainer(a.ctx, id)
}

func (a *App) RestartContainer(id string) error {
	return a.docker.RestartContainer(a.ctx, id)
}

func (a *App) RemoveContainer(id string, force bool) error {
	return a.docker.RemoveContainer(a.ctx, id, force)
}
func (a *App) GetContainerHealth(id string) (string, error) {
	return a.docker.ContainerHealth(a.ctx, id)
}

func (a *App) GetContainerStats(id string) (ContainerStats, error) {
	return a.docker.ContainerStats(a.ctx, id)
}

func (a *App) GetSwarmOverview() (SwarmOverview, error) {
	return a.docker.SwarmOverview(a.ctx)
}

func (a *App) ListSwarmServices() ([]SwarmServiceInfo, error) {
	return a.docker.SwarmServices(a.ctx)
}

func (a *App) ListSecrets() ([]SecretInfo, error) {
	return a.docker.ListSecrets(a.ctx)
}

func (a *App) CreateSecret(name string, value string) (SecretInfo, error) {
	return a.docker.CreateSecret(a.ctx, name, value)
}

func (a *App) RemoveSecret(id string) error {
	return a.docker.RemoveSecret(a.ctx, id)
}
