package main

import (
	"bufio"
	"context"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

const composeOutputEvent = "docker:compose-output"

type ComposeServiceSummary struct {
	Name  string   `json:"name"`
	Image string   `json:"image"`
	Ports []string `json:"ports"`
}

type ComposeProjectSummary struct {
	Path     string                  `json:"path"`
	Name     string                  `json:"name"`
	Services []ComposeServiceSummary `json:"services"`
}

func (a *App) SelectComposeFile() (string, error) {
	return runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Select docker-compose.yml",
		Filters: []runtime.FileFilter{
			{DisplayName: "Compose Files", Pattern: "*.yml;*.yaml"},
		},
	})
}

func (a *App) InspectComposeFile(composePath string) (ComposeProjectSummary, error) {
	composePath = strings.TrimSpace(composePath)
	if composePath == "" {
		return ComposeProjectSummary{}, fmt.Errorf("compose file path is required")
	}

	content, err := os.ReadFile(composePath)
	if err != nil {
		return ComposeProjectSummary{}, fmt.Errorf("read compose file: %w", err)
	}

	return ComposeProjectSummary{
		Path:     composePath,
		Name:     filepath.Base(filepath.Dir(composePath)),
		Services: parseComposeServices(string(content)),
	}, nil
}

func parseComposeServices(content string) []ComposeServiceSummary {
	services := []ComposeServiceSummary{}
	inServices := false
	currentIndex := -1
	currentField := ""

	scanner := bufio.NewScanner(strings.NewReader(content))
	for scanner.Scan() {
		rawLine := strings.TrimRight(scanner.Text(), "\r")
		line := strings.TrimSpace(rawLine)
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}

		indent := len(rawLine) - len(strings.TrimLeft(rawLine, " "))
		if indent == 0 {
			inServices = strings.TrimSuffix(line, ":") == "services"
			currentIndex = -1
			currentField = ""
			continue
		}

		if !inServices {
			continue
		}

		if indent == 2 && strings.HasSuffix(line, ":") {
			name := strings.TrimSuffix(line, ":")
			services = append(services, ComposeServiceSummary{Name: name})
			currentIndex = len(services) - 1
			currentField = ""
			continue
		}

		if currentIndex < 0 {
			continue
		}

		if indent == 4 {
			currentField = ""
			if strings.HasPrefix(line, "image:") {
				services[currentIndex].Image = cleanComposeValue(strings.TrimPrefix(line, "image:"))
				continue
			}

			if strings.HasPrefix(line, "ports:") {
				currentField = "ports"
				inline := cleanComposeValue(strings.TrimPrefix(line, "ports:"))
				services[currentIndex].Ports = append(services[currentIndex].Ports, parseInlineComposeList(inline)...)
			}

			continue
		}

		if indent >= 6 && currentField == "ports" && strings.HasPrefix(line, "-") {
			services[currentIndex].Ports = append(services[currentIndex].Ports, cleanComposeValue(strings.TrimPrefix(line, "-")))
		}
	}

	return services
}

func cleanComposeValue(value string) string {
	value = strings.TrimSpace(value)
	value = strings.Trim(value, "'\"")
	return value
}

func parseInlineComposeList(value string) []string {
	value = strings.TrimSpace(value)
	if !strings.HasPrefix(value, "[") || !strings.HasSuffix(value, "]") {
		return []string{}
	}

	value = strings.TrimSuffix(strings.TrimPrefix(value, "["), "]")
	parts := strings.Split(value, ",")
	items := make([]string, 0, len(parts))
	for _, part := range parts {
		item := cleanComposeValue(part)
		if item != "" {
			items = append(items, item)
		}
	}

	return items
}

func (a *App) ComposeUp(composePath string) error {
	return a.runComposeCommand(composePath, "up", "-d")
}

func (a *App) ComposeDown(composePath string) error {
	return a.runComposeCommand(composePath, "down")
}

func (a *App) runComposeCommand(composePath string, args ...string) error {
	composePath = strings.TrimSpace(composePath)
	if composePath == "" {
		return fmt.Errorf("compose file path is required")
	}

	commandArgs := append([]string{"compose", "-f", composePath}, args...)
	ctx, cancel := context.WithCancel(a.ctx)
	defer cancel()

	cmd := exec.CommandContext(ctx, "docker", commandArgs...)
	cmd.Dir = filepath.Dir(composePath)

	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return fmt.Errorf("capture compose stdout: %w", err)
	}

	stderr, err := cmd.StderrPipe()
	if err != nil {
		return fmt.Errorf("capture compose stderr: %w", err)
	}

	if err := cmd.Start(); err != nil {
		return fmt.Errorf("start docker compose: %w", err)
	}

	done := make(chan struct{}, 2)
	go emitComposeOutput(a.ctx, stdout, "stdout", done)
	go emitComposeOutput(a.ctx, stderr, "stderr", done)

	err = cmd.Wait()
	<-done
	<-done

	if err != nil {
		return fmt.Errorf("docker compose %s: %w", strings.Join(args, " "), err)
	}

	return nil
}

func emitComposeOutput(ctx context.Context, reader io.Reader, stream string, done chan<- struct{}) {
	defer func() { done <- struct{}{} }()

	scanner := bufio.NewScanner(reader)
	for scanner.Scan() {
		runtime.EventsEmit(ctx, composeOutputEvent, map[string]string{
			"stream": stream,
			"line":   scanner.Text(),
		})
	}
}
