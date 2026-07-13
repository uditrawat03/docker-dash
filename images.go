package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"os/exec"
	"strings"
	"time"

	"github.com/moby/moby/client"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

const (
	imagePullProgressEvent = "docker:image-pull-progress"
	imagePullTimeout       = 10 * time.Minute
	imageScanTimeout       = 90 * time.Second
)

func trimImageID(id string) string {
	id = strings.TrimPrefix(id, "sha256:")
	if len(id) <= 12 {
		return id
	}

	return id[:12]
}

func imageTags(tags []string) []string {
	if len(tags) == 0 {
		return []string{"<none>:<none>"}
	}

	return tags
}

func (s *DockerService) PullImage(parent context.Context, imageRef string, emit func(ImagePullProgress)) error {
	imageRef = strings.TrimSpace(imageRef)
	if imageRef == "" {
		return fmt.Errorf("image reference is required")
	}

	if err := s.Connect(parent); err != nil {
		return err
	}

	ctx, cancel := context.WithTimeout(dockerContext(parent), imagePullTimeout)
	defer cancel()

	stream, err := s.client.ImagePull(ctx, imageRef, client.ImagePullOptions{})
	if err != nil {
		return fmt.Errorf("pull image %q: %w", imageRef, err)
	}
	defer stream.Close()

	decoder := json.NewDecoder(stream)
	for {
		var progress ImagePullProgress
		if err := decoder.Decode(&progress); err != nil {
			if err == io.EOF {
				break
			}

			return fmt.Errorf("decode image pull progress: %w", err)
		}

		progress.ImageRef = imageRef
		emit(progress)

		if progress.Error != "" {
			return fmt.Errorf("pull image %q: %s", imageRef, progress.Error)
		}
	}

	emit(ImagePullProgress{ImageRef: imageRef, Status: "Pull complete", Done: true})
	return nil
}

func (s *DockerService) ListImages(parent context.Context) ([]ImageInfo, error) {
	if err := s.Connect(parent); err != nil {
		return nil, err
	}

	ctx, cancel := context.WithTimeout(dockerContext(parent), dockerConnectionTimeout)
	defer cancel()

	result, err := s.client.ImageList(ctx, client.ImageListOptions{All: true})
	if err != nil {
		return nil, fmt.Errorf("list Docker images: %w", err)
	}

	images := make([]ImageInfo, 0, len(result.Items))
	for _, item := range result.Items {
		images = append(images, ImageInfo{
			ID:      trimImageID(item.ID),
			Tags:    imageTags(item.RepoTags),
			Size:    item.Size,
			Created: time.Unix(item.Created, 0).Format(time.RFC3339),
		})
	}

	return images, nil
}

func severityFromScore(score float64) string {
	switch {
	case score >= 9:
		return "critical"
	case score >= 7:
		return "high"
	case score >= 4:
		return "medium"
	case score > 0:
		return "low"
	default:
		return "unknown"
	}
}

func addScanSeverity(counts *ImageVulnerabilityCounts, severity string) {
	switch strings.ToLower(severity) {
	case "critical":
		counts.Critical++
	case "high", "error":
		counts.High++
	case "medium", "warning":
		counts.Medium++
	case "low", "note":
		counts.Low++
	default:
		counts.Unknown++
	}
}

func scanResultSeverity(result map[string]any) string {
	if properties, ok := result["properties"].(map[string]any); ok {
		if score, ok := properties["security-severity"].(string); ok {
			var numeric float64
			if _, err := fmt.Sscanf(score, "%f", &numeric); err == nil {
				return severityFromScore(numeric)
			}
		}
		if severity, ok := properties["severity"].(string); ok {
			return severity
		}
	}
	if level, ok := result["level"].(string); ok {
		return level
	}

	return "unknown"
}

func parseScoutSARIF(imageRef string, payload []byte) (ImageScanResult, error) {
	var document map[string]any
	if err := json.Unmarshal(payload, &document); err != nil {
		return ImageScanResult{}, fmt.Errorf("decode Docker Scout SARIF: %w", err)
	}

	counts := ImageVulnerabilityCounts{}
	if runs, ok := document["runs"].([]any); ok {
		for _, run := range runs {
			runMap, ok := run.(map[string]any)
			if !ok {
				continue
			}
			results, ok := runMap["results"].([]any)
			if !ok {
				continue
			}
			for _, item := range results {
				result, ok := item.(map[string]any)
				if !ok {
					continue
				}
				addScanSeverity(&counts, scanResultSeverity(result))
			}
		}
	}

	total := counts.Critical + counts.High + counts.Medium + counts.Low + counts.Unknown
	return ImageScanResult{
		ImageRef: imageRef,
		Scanner:  "Docker Scout",
		Summary:  counts,
		Total:    total,
	}, nil
}

func (s *DockerService) ScanImage(parent context.Context, imageRef string) (ImageScanResult, error) {
	imageRef = strings.TrimSpace(imageRef)
	if imageRef == "" || imageRef == "<none>:<none>" {
		return ImageScanResult{}, fmt.Errorf("image reference is required")
	}

	ctx, cancel := context.WithTimeout(dockerContext(parent), imageScanTimeout)
	defer cancel()

	cmd := exec.CommandContext(ctx, "docker", "scout", "cves", "--format", "sarif", imageRef)
	output, err := cmd.CombinedOutput()
	if ctx.Err() == context.DeadlineExceeded {
		return ImageScanResult{}, fmt.Errorf("Docker Scout scan timed out")
	}
	if err != nil {
		message := strings.TrimSpace(string(output))
		if message == "" {
			message = err.Error()
		}
		return ImageScanResult{}, fmt.Errorf("Docker Scout scan failed: %s", message)
	}

	return parseScoutSARIF(imageRef, output)
}
func (s *DockerService) RemoveImage(parent context.Context, imageID string, force bool) error {
	imageID = strings.TrimSpace(imageID)
	if imageID == "" {
		return fmt.Errorf("image id is required")
	}

	return s.runContainerAction(parent, 30*time.Second, func(ctx context.Context) error {
		_, err := s.client.ImageRemove(ctx, imageID, client.ImageRemoveOptions{Force: force, PruneChildren: true})
		return err
	})
}
func (a *App) PullImage(imageRef string) error {
	return a.docker.PullImage(a.ctx, imageRef, func(progress ImagePullProgress) {
		runtime.EventsEmit(a.ctx, imagePullProgressEvent, progress)
	})
}

func (a *App) ListImages() ([]ImageInfo, error) {
	return a.docker.ListImages(a.ctx)
}
func (a *App) RemoveImage(imageID string, force bool) error {
	return a.docker.RemoveImage(a.ctx, imageID, force)
}

func (a *App) ScanImage(imageRef string) (ImageScanResult, error) {
	return a.docker.ScanImage(a.ctx, imageRef)
}
