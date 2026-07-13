package main

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/moby/moby/api/types/container"
	"github.com/moby/moby/client"
)

const dockerConnectionTimeout = 5 * time.Second

// DockerService owns Docker SDK access so Wails bindings stay thin.
type DockerService struct {
	client    *client.Client
	lastError string
}

func NewDockerService() *DockerService {
	return &DockerService{}
}

func dockerContext(parent context.Context) context.Context {
	if parent != nil {
		return parent
	}

	return context.Background()
}

func (s *DockerService) Connect(parent context.Context) error {
	if s.client != nil {
		return nil
	}

	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		s.lastError = fmt.Sprintf("failed to create Docker client: %v", err)
		return fmt.Errorf("create Docker client: %w", err)
	}

	ctx, cancel := context.WithTimeout(dockerContext(parent), dockerConnectionTimeout)
	defer cancel()

	if _, err := cli.Ping(ctx, client.PingOptions{NegotiateAPIVersion: true}); err != nil {
		_ = cli.Close()
		s.lastError = fmt.Sprintf("Docker daemon is not reachable: %v", err)
		return fmt.Errorf("ping Docker daemon: %w", err)
	}

	s.client = cli
	s.lastError = ""
	return nil
}

func (s *DockerService) Close() error {
	if s.client == nil {
		return nil
	}

	err := s.client.Close()
	s.client = nil
	return err
}

func (s *DockerService) Status(parent context.Context) DockerStatus {
	if err := s.Connect(parent); err != nil {
		return DockerStatus{
			Connected:    false,
			Message:      "Docker engine connection failed",
			Version:      "not connected",
			ErrorMessage: s.lastError,
		}
	}

	ctx, cancel := context.WithTimeout(dockerContext(parent), dockerConnectionTimeout)
	defer cancel()

	info, err := s.client.Info(ctx, client.InfoOptions{})
	if err != nil {
		s.lastError = fmt.Sprintf("failed to read Docker daemon info: %v", err)
		return DockerStatus{
			Connected:    false,
			Message:      "Docker engine status unavailable",
			Version:      "not connected",
			ErrorMessage: s.lastError,
		}
	}

	version, err := s.client.ServerVersion(ctx, client.ServerVersionOptions{})
	if err != nil {
		s.lastError = fmt.Sprintf("failed to read Docker daemon version: %v", err)
		return DockerStatus{
			Connected:    false,
			Message:      "Docker engine version unavailable",
			Version:      "not connected",
			ErrorMessage: s.lastError,
		}
	}

	s.lastError = ""
	return DockerStatus{
		Connected:         true,
		Message:           "Docker engine connected",
		Version:           version.Version,
		APIVersion:        version.APIVersion,
		OS:                info.Info.OperatingSystem,
		Arch:              info.Info.Architecture,
		TotalContainers:   info.Info.Containers,
		RunningContainers: info.Info.ContainersRunning,
	}
}
func trimContainerID(id string) string {
	if len(id) <= 12 {
		return id
	}

	return id[:12]
}

func trimContainerName(names []string) string {
	if len(names) == 0 {
		return "unnamed"
	}

	name := names[0]
	if len(name) > 0 && name[0] == '/' {
		return name[1:]
	}

	return name
}

func formatContainerPorts(ports []container.PortSummary) string {
	if len(ports) == 0 {
		return "-"
	}

	formatted := make([]string, 0, len(ports))
	for _, port := range ports {
		privatePort := fmt.Sprintf("%d/%s", port.PrivatePort, port.Type)
		if port.PublicPort > 0 {
			formatted = append(formatted, fmt.Sprintf("%d:%s", port.PublicPort, privatePort))
			continue
		}

		formatted = append(formatted, privatePort)
	}

	return strings.Join(formatted, ", ")
}

func parseHealthFromStatus(status string) string {
	lowerStatus := strings.ToLower(status)
	switch {
	case strings.Contains(lowerStatus, "unhealthy"):
		return "unhealthy"
	case strings.Contains(lowerStatus, "healthy"):
		return "healthy"
	case strings.Contains(lowerStatus, "health: starting") || strings.Contains(lowerStatus, "starting"):
		return "starting"
	default:
		return "none"
	}
}
func (s *DockerService) ListContainers(parent context.Context) ([]ContainerInfo, error) {
	if err := s.Connect(parent); err != nil {
		return nil, err
	}

	ctx, cancel := context.WithTimeout(dockerContext(parent), dockerConnectionTimeout)
	defer cancel()

	result, err := s.client.ContainerList(ctx, client.ContainerListOptions{All: true})
	if err != nil {
		return nil, fmt.Errorf("list Docker containers: %w", err)
	}

	containers := make([]ContainerInfo, 0, len(result.Items))
	for _, item := range result.Items {
		health := parseHealthFromStatus(item.Status)
		healthFailingStreak := 0

		inspectResult, inspectErr := s.client.ContainerInspect(ctx, item.ID, client.ContainerInspectOptions{})
		if inspectErr == nil {
			health, healthFailingStreak = containerHealth(inspectResult.Container.State)
		}

		containers = append(containers, ContainerInfo{
			ID:                  trimContainerID(item.ID),
			Name:                trimContainerName(item.Names),
			Image:               item.Image,
			State:               string(item.State),
			Status:              item.Status,
			Health:              health,
			HealthFailingStreak: healthFailingStreak,
			Ports:               formatContainerPorts(item.Ports),
			Created:             time.Unix(item.Created, 0).Format(time.RFC3339),
		})
	}

	return containers, nil
}
func (s *DockerService) runContainerAction(parent context.Context, timeout time.Duration, action func(context.Context) error) error {
	if err := s.Connect(parent); err != nil {
		return err
	}

	ctx, cancel := context.WithTimeout(dockerContext(parent), timeout)
	defer cancel()

	return action(ctx)
}

func (s *DockerService) StartContainer(parent context.Context, id string) error {
	return s.runContainerAction(parent, 15*time.Second, func(ctx context.Context) error {
		_, err := s.client.ContainerStart(ctx, id, client.ContainerStartOptions{})
		return err
	})
}

func (s *DockerService) StopContainer(parent context.Context, id string) error {
	timeout := 10
	return s.runContainerAction(parent, 20*time.Second, func(ctx context.Context) error {
		_, err := s.client.ContainerStop(ctx, id, client.ContainerStopOptions{Timeout: &timeout})
		return err
	})
}

func (s *DockerService) RestartContainer(parent context.Context, id string) error {
	timeout := 10
	return s.runContainerAction(parent, 30*time.Second, func(ctx context.Context) error {
		_, err := s.client.ContainerRestart(ctx, id, client.ContainerRestartOptions{Timeout: &timeout})
		return err
	})
}

func (s *DockerService) RemoveContainer(parent context.Context, id string, force bool) error {
	return s.runContainerAction(parent, 20*time.Second, func(ctx context.Context) error {
		_, err := s.client.ContainerRemove(ctx, id, client.ContainerRemoveOptions{Force: force, RemoveVolumes: false})
		return err
	})
}
