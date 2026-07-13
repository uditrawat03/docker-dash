package main

import (
	"context"
	"fmt"
	"time"

	"github.com/moby/moby/api/types/swarm"
	"github.com/moby/moby/client"
)

func swarmMode(service swarm.Service) string {
	switch {
	case service.Spec.Mode.Replicated != nil:
		return "replicated"
	case service.Spec.Mode.Global != nil:
		return "global"
	case service.Spec.Mode.ReplicatedJob != nil:
		return "replicated job"
	case service.Spec.Mode.GlobalJob != nil:
		return "global job"
	default:
		return "unknown"
	}
}

func swarmDesiredReplicas(service swarm.Service) uint64 {
	if service.ServiceStatus != nil {
		return service.ServiceStatus.DesiredTasks
	}
	if service.Spec.Mode.Replicated != nil && service.Spec.Mode.Replicated.Replicas != nil {
		return *service.Spec.Mode.Replicated.Replicas
	}
	if service.Spec.Mode.ReplicatedJob != nil && service.Spec.Mode.ReplicatedJob.TotalCompletions != nil {
		return *service.Spec.Mode.ReplicatedJob.TotalCompletions
	}

	return 0
}

func swarmRunningReplicas(service swarm.Service) uint64 {
	if service.ServiceStatus == nil {
		return 0
	}

	return service.ServiceStatus.RunningTasks
}

func swarmImage(service swarm.Service) string {
	if service.Spec.TaskTemplate.ContainerSpec == nil {
		return ""
	}

	return service.Spec.TaskTemplate.ContainerSpec.Image
}

func swarmUpdateState(service swarm.Service) string {
	if service.UpdateStatus == nil {
		return "not started"
	}
	if service.UpdateStatus.State == "" {
		return "unknown"
	}

	return string(service.UpdateStatus.State)
}

func swarmUpdateMessage(service swarm.Service) string {
	if service.UpdateStatus == nil {
		return ""
	}

	return service.UpdateStatus.Message
}

func (s *DockerService) SwarmOverview(parent context.Context) (SwarmOverview, error) {
	if err := s.Connect(parent); err != nil {
		return SwarmOverview{}, err
	}

	ctx, cancel := context.WithTimeout(dockerContext(parent), dockerConnectionTimeout)
	defer cancel()

	info, err := s.client.Info(ctx, client.InfoOptions{})
	if err != nil {
		return SwarmOverview{}, fmt.Errorf("read Docker swarm info: %w", err)
	}

	overview := SwarmOverview{
		Active:           info.Info.Swarm.LocalNodeState == swarm.LocalNodeStateActive,
		LocalNodeState:   string(info.Info.Swarm.LocalNodeState),
		ControlAvailable: info.Info.Swarm.ControlAvailable,
		NodeID:           info.Info.Swarm.NodeID,
		NodeAddr:         info.Info.Swarm.NodeAddr,
		Nodes:            info.Info.Swarm.Nodes,
		Managers:         info.Info.Swarm.Managers,
		Error:            info.Info.Swarm.Error,
	}
	if info.Info.Swarm.Cluster != nil {
		overview.ClusterID = info.Info.Swarm.Cluster.ID
	}

	return overview, nil
}

func (s *DockerService) SwarmServices(parent context.Context) ([]SwarmServiceInfo, error) {
	overview, err := s.SwarmOverview(parent)
	if err != nil {
		return nil, err
	}
	if !overview.Active || !overview.ControlAvailable {
		return []SwarmServiceInfo{}, nil
	}

	ctx, cancel := context.WithTimeout(dockerContext(parent), dockerConnectionTimeout)
	defer cancel()

	result, err := s.client.ServiceList(ctx, client.ServiceListOptions{Status: true})
	if err != nil {
		return nil, fmt.Errorf("list swarm services: %w", err)
	}

	services := make([]SwarmServiceInfo, 0, len(result.Items))
	for _, service := range result.Items {
		services = append(services, SwarmServiceInfo{
			ID:            trimContainerID(service.ID),
			Name:          service.Spec.Name,
			Image:         swarmImage(service),
			Mode:          swarmMode(service),
			DesiredTasks:  swarmDesiredReplicas(service),
			RunningTasks:  swarmRunningReplicas(service),
			UpdateState:   swarmUpdateState(service),
			UpdateMessage: swarmUpdateMessage(service),
			Created:       service.CreatedAt.Format(time.RFC3339),
			Updated:       service.UpdatedAt.Format(time.RFC3339),
		})
	}

	return services, nil
}
