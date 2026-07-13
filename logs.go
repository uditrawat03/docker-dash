package main

import (
	"context"
	"encoding/binary"
	"errors"
	"fmt"
	"io"
	"strings"
	"time"

	"github.com/moby/moby/client"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

const (
	containerLogLineEvent  = "docker:container-log-line"
	containerLogErrorEvent = "docker:container-log-error"
	maxDockerLogFrameSize  = 8 * 1024 * 1024
)

func (s *DockerService) StreamContainerLogs(parent context.Context, id string, emit func(ContainerLogLine)) error {
	if err := s.Connect(parent); err != nil {
		return err
	}

	stream, err := s.client.ContainerLogs(dockerContext(parent), id, client.ContainerLogsOptions{
		ShowStdout: true,
		ShowStderr: true,
		Timestamps: true,
		Follow:     true,
		Tail:       "200",
	})
	if err != nil {
		return fmt.Errorf("stream container logs: %w", err)
	}
	defer stream.Close()

	return readDockerLogFrames(stream, id, emit)
}

func readDockerLogFrames(reader io.Reader, containerID string, emit func(ContainerLogLine)) error {
	header := make([]byte, 8)
	for {
		if _, err := io.ReadFull(reader, header); err != nil {
			if errors.Is(err, io.EOF) || errors.Is(err, io.ErrUnexpectedEOF) {
				return nil
			}

			return err
		}

		stream := dockerLogStreamName(header[0])
		frameSize := binary.BigEndian.Uint32(header[4:8])
		if stream == "unknown" || frameSize == 0 || frameSize > maxDockerLogFrameSize {
			return fmt.Errorf("unsupported Docker log frame")
		}

		payload := make([]byte, frameSize)
		if _, err := io.ReadFull(reader, payload); err != nil {
			return err
		}

		emitDockerLogPayload(containerID, stream, string(payload), emit)
	}
}

func dockerLogStreamName(stream byte) string {
	switch stream {
	case 1:
		return "stdout"
	case 2:
		return "stderr"
	default:
		return "unknown"
	}
}

func emitDockerLogPayload(containerID string, stream string, payload string, emit func(ContainerLogLine)) {
	for _, line := range strings.Split(strings.TrimRight(payload, "\r\n"), "\n") {
		line = strings.TrimRight(line, "\r")
		if line == "" {
			continue
		}

		timestamp, text := splitDockerLogTimestamp(line)
		emit(ContainerLogLine{
			ContainerID: containerID,
			Stream:      stream,
			Text:        text,
			Timestamp:   timestamp,
		})
	}
}

func splitDockerLogTimestamp(line string) (string, string) {
	spaceIndex := strings.IndexByte(line, ' ')
	if spaceIndex > 10 && strings.Contains(line[:spaceIndex], "T") {
		return line[:spaceIndex], strings.TrimSpace(line[spaceIndex+1:])
	}

	return time.Now().Format(time.RFC3339), line
}

func (a *App) startLogStreamRegistry() {
	if a.logStreams == nil {
		a.logStreams = make(map[string]context.CancelFunc)
	}
}

func (a *App) StartContainerLogStream(containerID string) error {
	if strings.TrimSpace(containerID) == "" {
		return fmt.Errorf("container id is required")
	}

	a.StopContainerLogStream(containerID)

	ctx, cancel := context.WithCancel(a.ctx)
	a.logStreamsMu.Lock()
	a.startLogStreamRegistry()
	a.logStreams[containerID] = cancel
	a.logStreamsMu.Unlock()

	go func() {
		defer func() {
			a.logStreamsMu.Lock()
			delete(a.logStreams, containerID)
			a.logStreamsMu.Unlock()
		}()

		err := a.docker.StreamContainerLogs(ctx, containerID, func(line ContainerLogLine) {
			runtime.EventsEmit(a.ctx, containerLogLineEvent, line)
		})
		if err != nil && !errors.Is(ctx.Err(), context.Canceled) {
			runtime.EventsEmit(a.ctx, containerLogErrorEvent, map[string]string{
				"containerId": containerID,
				"message":     err.Error(),
			})
		}
	}()

	return nil
}

func (a *App) StopContainerLogStream(containerID string) {
	a.logStreamsMu.Lock()
	defer a.logStreamsMu.Unlock()

	if cancel, ok := a.logStreams[containerID]; ok {
		cancel()
		delete(a.logStreams, containerID)
	}
}

func (a *App) stopAllContainerLogStreams() {
	a.logStreamsMu.Lock()
	defer a.logStreamsMu.Unlock()

	for containerID, cancel := range a.logStreams {
		cancel()
		delete(a.logStreams, containerID)
	}
}
