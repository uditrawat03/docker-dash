package main

import (
	"context"
	"fmt"
	"sort"
	"strings"
	"time"

	"github.com/moby/moby/api/types/container"
	"github.com/moby/moby/api/types/mount"
	"github.com/moby/moby/api/types/volume"
	"github.com/moby/moby/client"
)

func volumeLabels(labels map[string]string) []string {
	if len(labels) == 0 {
		return []string{}
	}

	items := make([]string, 0, len(labels))
	for key, value := range labels {
		items = append(items, fmt.Sprintf("%s=%s", key, value))
	}
	sort.Strings(items)
	return items
}

func volumeInfoFromDocker(item volume.Volume, usage []VolumeUsage) VolumeInfo {
	return VolumeInfo{
		Name:       item.Name,
		Driver:     item.Driver,
		Mountpoint: item.Mountpoint,
		CreatedAt:  item.CreatedAt,
		Scope:      item.Scope,
		Labels:     volumeLabels(item.Labels),
		InUse:      len(usage) > 0,
		UsedBy:     usage,
	}
}

func volumeUsageByName(containers []container.Summary, inspect func(context.Context, string, client.ContainerInspectOptions) (client.ContainerInspectResult, error), ctx context.Context) map[string][]VolumeUsage {
	usage := map[string][]VolumeUsage{}
	for _, summary := range containers {
		result, err := inspect(ctx, summary.ID, client.ContainerInspectOptions{})
		if err != nil {
			continue
		}

		name := trimContainerName(summary.Names)
		state := string(summary.State)
		if result.Container.State != nil {
			state = string(result.Container.State.Status)
		}

		for _, item := range result.Container.Mounts {
			if item.Type != mount.TypeVolume || item.Name == "" {
				continue
			}

			usage[item.Name] = append(usage[item.Name], VolumeUsage{
				ContainerID:   trimContainerID(summary.ID),
				ContainerName: name,
				State:         state,
				Destination:   item.Destination,
			})
		}
	}

	return usage
}

func (s *DockerService) ListVolumes(parent context.Context) ([]VolumeInfo, error) {
	if err := s.Connect(parent); err != nil {
		return nil, err
	}

	ctx, cancel := context.WithTimeout(dockerContext(parent), 15*time.Second)
	defer cancel()

	volumes, err := s.client.VolumeList(ctx, client.VolumeListOptions{})
	if err != nil {
		return nil, fmt.Errorf("list Docker volumes: %w", err)
	}

	containers, err := s.client.ContainerList(ctx, client.ContainerListOptions{All: true})
	if err != nil {
		return nil, fmt.Errorf("list containers for volume usage: %w", err)
	}

	usage := volumeUsageByName(containers.Items, s.client.ContainerInspect, ctx)
	result := make([]VolumeInfo, 0, len(volumes.Items))
	for _, item := range volumes.Items {
		result = append(result, volumeInfoFromDocker(item, usage[item.Name]))
	}

	sort.Slice(result, func(i, j int) bool {
		return result[i].Name < result[j].Name
	})

	return result, nil
}

func (s *DockerService) CreateVolume(parent context.Context, name string) (VolumeInfo, error) {
	name = strings.TrimSpace(name)
	if name == "" {
		return VolumeInfo{}, fmt.Errorf("volume name is required")
	}

	if err := s.Connect(parent); err != nil {
		return VolumeInfo{}, err
	}

	ctx, cancel := context.WithTimeout(dockerContext(parent), dockerConnectionTimeout)
	defer cancel()

	result, err := s.client.VolumeCreate(ctx, client.VolumeCreateOptions{Name: name, Driver: "local"})
	if err != nil {
		return VolumeInfo{}, fmt.Errorf("create Docker volume: %w", err)
	}

	return volumeInfoFromDocker(result.Volume, nil), nil
}

func (s *DockerService) RemoveVolume(parent context.Context, name string, force bool) error {
	name = strings.TrimSpace(name)
	if name == "" {
		return fmt.Errorf("volume name is required")
	}

	if err := s.Connect(parent); err != nil {
		return err
	}

	ctx, cancel := context.WithTimeout(dockerContext(parent), dockerConnectionTimeout)
	defer cancel()

	_, err := s.client.VolumeRemove(ctx, name, client.VolumeRemoveOptions{Force: force})
	if err != nil {
		return fmt.Errorf("remove Docker volume: %w", err)
	}

	return nil
}

func (a *App) ListVolumes() ([]VolumeInfo, error) {
	return a.docker.ListVolumes(a.ctx)
}

func (a *App) CreateVolume(name string) (VolumeInfo, error) {
	return a.docker.CreateVolume(a.ctx, name)
}

func (a *App) RemoveVolume(name string, force bool) error {
	return a.docker.RemoveVolume(a.ctx, name, force)
}
