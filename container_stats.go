package main

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/moby/moby/api/types/container"
	"github.com/moby/moby/client"
)

func calculateCPUPercent(stats container.StatsResponse) float64 {
	if stats.CPUStats.CPUUsage.TotalUsage <= stats.PreCPUStats.CPUUsage.TotalUsage || stats.CPUStats.SystemUsage <= stats.PreCPUStats.SystemUsage {
		return 0
	}

	cpuDelta := float64(stats.CPUStats.CPUUsage.TotalUsage - stats.PreCPUStats.CPUUsage.TotalUsage)
	systemDelta := float64(stats.CPUStats.SystemUsage - stats.PreCPUStats.SystemUsage)

	onlineCPUs := float64(stats.CPUStats.OnlineCPUs)
	if onlineCPUs == 0 {
		onlineCPUs = float64(len(stats.CPUStats.CPUUsage.PercpuUsage))
	}
	if onlineCPUs == 0 && stats.NumProcs > 0 {
		onlineCPUs = float64(stats.NumProcs)
	}

	if cpuDelta <= 0 || systemDelta <= 0 || onlineCPUs <= 0 {
		return 0
	}

	return (cpuDelta / systemDelta) * onlineCPUs * 100
}

func calculateMemoryUsage(memory container.MemoryStats) uint64 {
	usage := memory.Usage
	if cache, ok := memory.Stats["cache"]; ok && usage > cache {
		usage -= cache
	}
	if usage == 0 && memory.PrivateWorkingSet > 0 {
		usage = memory.PrivateWorkingSet
	}
	if usage == 0 && memory.Commit > 0 {
		usage = memory.Commit
	}

	return usage
}

func calculateMemoryPercent(usage uint64, limit uint64) float64 {
	if usage == 0 || limit == 0 {
		return 0
	}

	return (float64(usage) / float64(limit)) * 100
}

func (s *DockerService) ContainerStats(parent context.Context, id string) (ContainerStats, error) {
	id = strings.TrimSpace(id)
	if id == "" {
		return ContainerStats{}, fmt.Errorf("container id is required")
	}

	if err := s.Connect(parent); err != nil {
		return ContainerStats{}, err
	}

	ctx, cancel := context.WithTimeout(dockerContext(parent), dockerConnectionTimeout+dockerConnectionTimeout)
	defer cancel()

	result, err := s.client.ContainerStats(ctx, id, client.ContainerStatsOptions{IncludePreviousSample: true})
	if err != nil {
		return ContainerStats{}, fmt.Errorf("read container stats: %w", err)
	}
	defer result.Body.Close()

	var raw container.StatsResponse
	if err := json.NewDecoder(result.Body).Decode(&raw); err != nil {
		return ContainerStats{}, fmt.Errorf("decode container stats: %w", err)
	}

	memoryUsage := calculateMemoryUsage(raw.MemoryStats)
	memoryLimit := raw.MemoryStats.Limit

	return ContainerStats{
		CPUPercent:    calculateCPUPercent(raw),
		MemoryUsage:   memoryUsage,
		MemoryLimit:   memoryLimit,
		MemoryPercent: calculateMemoryPercent(memoryUsage, memoryLimit),
		PIDs:          raw.PidsStats.Current,
	}, nil
}
