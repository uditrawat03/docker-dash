package main

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/wailsapp/wails/v2/pkg/runtime"

	"github.com/moby/moby/api/types/container"
	"github.com/moby/moby/client"
)

func containerHealth(state *container.State) (string, int) {
	if state == nil || state.Health == nil {
		return "none", 0
	}

	return string(state.Health.Status), state.Health.FailingStreak
}
func containerCommand(config *container.Config) string {
	if config == nil {
		return ""
	}

	parts := append([]string{}, config.Entrypoint...)
	parts = append(parts, config.Cmd...)
	return strings.Join(parts, " ")
}

func containerEnv(config *container.Config) []string {
	if config == nil {
		return []string{}
	}

	return config.Env
}
func containerPorts(inspect container.InspectResponse) []string {
	if inspect.NetworkSettings == nil || len(inspect.NetworkSettings.Ports) == 0 {
		return []string{}
	}

	ports := make([]string, 0, len(inspect.NetworkSettings.Ports))
	for port, bindings := range inspect.NetworkSettings.Ports {
		if len(bindings) == 0 {
			ports = append(ports, port.String())
			continue
		}

		for _, binding := range bindings {
			host := binding.HostPort
			if binding.HostIP.IsValid() {
				host = binding.HostIP.String() + ":" + binding.HostPort
			}
			ports = append(ports, fmt.Sprintf("%s -> %s", host, port.String()))
		}
	}

	return ports
}

func containerBrowserURL(inspect container.InspectResponse) string {
	if inspect.NetworkSettings == nil || len(inspect.NetworkSettings.Ports) == 0 {
		return ""
	}

	for port, bindings := range inspect.NetworkSettings.Ports {
		if port.Proto() != "tcp" || len(bindings) == 0 {
			continue
		}

		for _, binding := range bindings {
			if binding.HostPort == "" {
				continue
			}

			host := "localhost"
			if binding.HostIP.IsValid() && !binding.HostIP.IsUnspecified() {
				host = binding.HostIP.String()
			}

			return fmt.Sprintf("http://%s:%s", host, binding.HostPort)
		}
	}

	return ""
}
func containerMounts(inspect container.InspectResponse) []ContainerMount {
	mounts := make([]ContainerMount, 0, len(inspect.Mounts))
	for _, mount := range inspect.Mounts {
		mounts = append(mounts, ContainerMount{
			Type:        string(mount.Type),
			Source:      mount.Source,
			Destination: mount.Destination,
			Mode:        mount.Mode,
			RW:          mount.RW,
		})
	}

	return mounts
}

func containerNetworks(inspect container.InspectResponse) []ContainerNetwork {
	if inspect.NetworkSettings == nil || len(inspect.NetworkSettings.Networks) == 0 {
		return []ContainerNetwork{}
	}

	networks := make([]ContainerNetwork, 0, len(inspect.NetworkSettings.Networks))
	for name, network := range inspect.NetworkSettings.Networks {
		networks = append(networks, ContainerNetwork{
			Name:      name,
			IPAddress: network.IPAddress.String(),
			Gateway:   network.Gateway.String(),
			Mac:       fmt.Sprint(network.MacAddress),
		})
	}

	return networks
}

func capabilityDropped(capabilities []string, wanted string) bool {
	for _, capability := range capabilities {
		if strings.EqualFold(capability, wanted) {
			return true
		}
	}

	return false
}

func containerRunsAsNonRoot(config *container.Config) bool {
	if config == nil {
		return false
	}

	user := strings.ToLower(strings.TrimSpace(config.User))
	if user == "" || user == "0" || user == "root" || strings.HasPrefix(user, "0:") || strings.HasPrefix(user, "root:") {
		return false
	}

	return true
}

func containerSecurityPosture(inspect container.InspectResponse) ContainerSecurityPosture {
	checks := []ContainerSecurityCheck{
		{
			Key:         "non-root-user",
			Label:       "Runs as non-root",
			Description: "Container defines a non-root user.",
			Passed:      containerRunsAsNonRoot(inspect.Config),
		},
		{
			Key:         "read-only-rootfs",
			Label:       "Read-only root filesystem",
			Description: "Root filesystem is mounted read-only.",
			Passed:      inspect.HostConfig != nil && inspect.HostConfig.ReadonlyRootfs,
		},
		{
			Key:         "cap-drop-all",
			Label:       "Drops default capabilities",
			Description: "Container drops all Linux capabilities by default.",
			Passed:      inspect.HostConfig != nil && capabilityDropped(inspect.HostConfig.CapDrop, "ALL"),
		},
		{
			Key:         "memory-limit",
			Label:       "Memory limit set",
			Description: "Container has an explicit memory limit.",
			Passed:      inspect.HostConfig != nil && inspect.HostConfig.Memory > 0,
		},
		{
			Key:         "cpu-limit",
			Label:       "CPU limit set",
			Description: "Container has an explicit CPU quota.",
			Passed:      inspect.HostConfig != nil && inspect.HostConfig.NanoCPUs > 0,
		},
	}

	passed := 0
	for _, check := range checks {
		if check.Passed {
			passed++
		}
	}

	score := 0
	if len(checks) > 0 {
		score = (passed * 100) / len(checks)
	}

	return ContainerSecurityPosture{Score: score, Checks: checks}
}
func (s *DockerService) InspectContainer(parent context.Context, id string) (ContainerDetails, error) {
	id = strings.TrimSpace(id)
	if id == "" {
		return ContainerDetails{}, fmt.Errorf("container id is required")
	}

	if err := s.Connect(parent); err != nil {
		return ContainerDetails{}, err
	}

	ctx, cancel := context.WithTimeout(dockerContext(parent), dockerConnectionTimeout)
	defer cancel()

	result, err := s.client.ContainerInspect(ctx, id, client.ContainerInspectOptions{Size: true})
	if err != nil {
		return ContainerDetails{}, fmt.Errorf("inspect container: %w", err)
	}

	inspect := result.Container
	raw, err := json.MarshalIndent(inspect, "", "  ")
	if err != nil {
		return ContainerDetails{}, fmt.Errorf("encode inspect payload: %w", err)
	}

	name := strings.TrimPrefix(inspect.Name, "/")
	if name == "" {
		name = trimContainerID(inspect.ID)
	}

	state := "unknown"
	status := "unknown"
	health := "none"
	healthFailingStreak := 0
	if inspect.State != nil {
		state = string(inspect.State.Status)
		status = string(inspect.State.Status)
		if inspect.State.Error != "" {
			status = inspect.State.Error
		}
		health, healthFailingStreak = containerHealth(inspect.State)
	}

	return ContainerDetails{
		ID:                  trimContainerID(inspect.ID),
		Name:                name,
		Image:               inspect.Image,
		State:               state,
		Status:              status,
		Health:              health,
		HealthFailingStreak: healthFailingStreak,
		Security:            containerSecurityPosture(inspect),
		Created:             inspect.Created,
		Command:             containerCommand(inspect.Config),
		Env:                 containerEnv(inspect.Config),
		Mounts:              containerMounts(inspect),
		Networks:            containerNetworks(inspect),
		Ports:               containerPorts(inspect),
		BrowserURL:          containerBrowserURL(inspect),
		RawJSON:             string(raw),
	}, nil
}

func (s *DockerService) ContainerHealth(parent context.Context, id string) (string, error) {
	id = strings.TrimSpace(id)
	if id == "" {
		return "", fmt.Errorf("container id is required")
	}

	if err := s.Connect(parent); err != nil {
		return "", err
	}

	ctx, cancel := context.WithTimeout(dockerContext(parent), dockerConnectionTimeout)
	defer cancel()

	result, err := s.client.ContainerInspect(ctx, id, client.ContainerInspectOptions{})
	if err != nil {
		return "", fmt.Errorf("inspect container health: %w", err)
	}

	health, _ := containerHealth(result.Container.State)
	return health, nil
}
func (a *App) InspectContainer(id string) (ContainerDetails, error) {
	return a.docker.InspectContainer(a.ctx, id)
}
func (a *App) OpenContainerInBrowser(id string) error {
	details, err := a.docker.InspectContainer(a.ctx, id)
	if err != nil {
		return err
	}

	if details.BrowserURL == "" {
		return fmt.Errorf("no published TCP ports found")
	}

	runtime.BrowserOpenURL(a.ctx, details.BrowserURL)
	return nil
}
