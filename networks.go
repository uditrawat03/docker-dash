package main

import (
	"context"
	"fmt"
	"sort"
	"strings"
	"time"

	"github.com/moby/moby/api/types/network"
	"github.com/moby/moby/client"
)

func isDefaultNetwork(name string) bool {
	switch name {
	case "bridge", "host", "none":
		return true
	default:
		return false
	}
}

func networkSubnets(ipam network.IPAM) []NetworkSubnet {
	items := make([]NetworkSubnet, 0, len(ipam.Config))
	for _, config := range ipam.Config {
		items = append(items, NetworkSubnet{
			Subnet:  config.Subnet.String(),
			Gateway: config.Gateway.String(),
		})
	}
	return items
}

func networkContainers(containers map[string]network.EndpointResource) []NetworkContainer {
	items := make([]NetworkContainer, 0, len(containers))
	for id, endpoint := range containers {
		items = append(items, NetworkContainer{
			ID:          trimContainerID(id),
			Name:        endpoint.Name,
			EndpointID:  trimContainerID(endpoint.EndpointID),
			IPv4Address: endpoint.IPv4Address.String(),
			IPv6Address: endpoint.IPv6Address.String(),
			MacAddress:  fmt.Sprint(endpoint.MacAddress),
		})
	}

	sort.Slice(items, func(i, j int) bool {
		return items[i].Name < items[j].Name
	})

	return items
}

func networkInfoFromInspect(inspect network.Inspect) NetworkInfo {
	return NetworkInfo{
		ID:         trimContainerID(inspect.ID),
		Name:       inspect.Name,
		Driver:     inspect.Driver,
		Scope:      inspect.Scope,
		Created:    fmt.Sprint(inspect.Created),
		Internal:   inspect.Internal,
		Attachable: inspect.Attachable,
		Ingress:    inspect.Ingress,
		Default:    isDefaultNetwork(inspect.Name),
		Subnets:    networkSubnets(inspect.IPAM),
		Containers: networkContainers(inspect.Containers),
	}
}

func (s *DockerService) ListNetworks(parent context.Context) ([]NetworkInfo, error) {
	if err := s.Connect(parent); err != nil {
		return nil, err
	}

	ctx, cancel := context.WithTimeout(dockerContext(parent), 15*time.Second)
	defer cancel()

	result, err := s.client.NetworkList(ctx, client.NetworkListOptions{})
	if err != nil {
		return nil, fmt.Errorf("list Docker networks: %w", err)
	}

	networks := make([]NetworkInfo, 0, len(result.Items))
	for _, item := range result.Items {
		inspect, err := s.client.NetworkInspect(ctx, item.ID, client.NetworkInspectOptions{})
		if err != nil {
			networks = append(networks, NetworkInfo{
				ID:      trimContainerID(item.ID),
				Name:    item.Name,
				Driver:  item.Driver,
				Scope:   item.Scope,
				Default: isDefaultNetwork(item.Name),
			})
			continue
		}

		networks = append(networks, networkInfoFromInspect(inspect.Network))
	}

	sort.Slice(networks, func(i, j int) bool {
		if networks[i].Default != networks[j].Default {
			return networks[i].Default
		}
		return networks[i].Name < networks[j].Name
	})

	return networks, nil
}

func (s *DockerService) CreateNetwork(parent context.Context, name string) (NetworkInfo, error) {
	name = strings.TrimSpace(name)
	if name == "" {
		return NetworkInfo{}, fmt.Errorf("network name is required")
	}

	if err := s.Connect(parent); err != nil {
		return NetworkInfo{}, err
	}

	ctx, cancel := context.WithTimeout(dockerContext(parent), dockerConnectionTimeout)
	defer cancel()

	created, err := s.client.NetworkCreate(ctx, name, client.NetworkCreateOptions{Driver: "bridge", Attachable: true})
	if err != nil {
		return NetworkInfo{}, fmt.Errorf("create Docker network: %w", err)
	}

	inspect, err := s.client.NetworkInspect(ctx, created.ID, client.NetworkInspectOptions{})
	if err != nil {
		return NetworkInfo{ID: trimContainerID(created.ID), Name: name, Driver: "bridge"}, nil
	}

	return networkInfoFromInspect(inspect.Network), nil
}

func (s *DockerService) RemoveNetwork(parent context.Context, id string) error {
	id = strings.TrimSpace(id)
	if id == "" {
		return fmt.Errorf("network id is required")
	}

	if err := s.Connect(parent); err != nil {
		return err
	}

	ctx, cancel := context.WithTimeout(dockerContext(parent), dockerConnectionTimeout)
	defer cancel()

	_, err := s.client.NetworkRemove(ctx, id, client.NetworkRemoveOptions{})
	if err != nil {
		return fmt.Errorf("remove Docker network: %w", err)
	}

	return nil
}

func (a *App) ListNetworks() ([]NetworkInfo, error) {
	return a.docker.ListNetworks(a.ctx)
}

func (a *App) CreateNetwork(name string) (NetworkInfo, error) {
	return a.docker.CreateNetwork(a.ctx, name)
}

func (a *App) RemoveNetwork(id string) error {
	return a.docker.RemoveNetwork(a.ctx, id)
}
