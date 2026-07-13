package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

const CurrentVersion = "0.0.0"
const updateRequestTimeout = 10 * time.Second

type githubReleaseResponse struct {
	TagName     string `json:"tag_name"`
	Name        string `json:"name"`
	Body        string `json:"body"`
	HTMLURL     string `json:"html_url"`
	PublishedAt string `json:"published_at"`
}

func normalizeVersion(value string) string {
	value = strings.TrimSpace(strings.ToLower(value))
	return strings.TrimPrefix(value, "v")
}

func (a *App) CheckForUpdate(owner string, repo string, currentVersion string) (UpdateCheckResult, error) {
	cleanOwner, err := cleanGitHubPathSegment("owner", owner)
	if err != nil {
		return UpdateCheckResult{}, err
	}
	cleanRepo, err := cleanGitHubPathSegment("repo", repo)
	if err != nil {
		return UpdateCheckResult{}, err
	}

	version := strings.TrimSpace(currentVersion)
	if version == "" {
		version = CurrentVersion
	}

	ctx, cancel := context.WithTimeout(a.ctx, updateRequestTimeout)
	defer cancel()

	endpoint := fmt.Sprintf("https://api.github.com/repos/%s/%s/releases/latest", url.PathEscape(cleanOwner), url.PathEscape(cleanRepo))
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return UpdateCheckResult{}, err
	}

	req.Header.Set("Accept", "application/vnd.github+json")
	req.Header.Set("X-GitHub-Api-Version", "2022-11-28")
	req.Header.Set("User-Agent", "DockerDash/"+version)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return UpdateCheckResult{}, fmt.Errorf("check GitHub release: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return UpdateCheckResult{}, fmt.Errorf("GitHub Releases API returned %s", resp.Status)
	}

	var payload githubReleaseResponse
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		return UpdateCheckResult{}, fmt.Errorf("decode GitHub release: %w", err)
	}

	latest := strings.TrimSpace(payload.TagName)
	return UpdateCheckResult{
		CurrentVersion:  version,
		LatestVersion:   latest,
		UpdateAvailable: normalizeVersion(latest) != "" && normalizeVersion(latest) != normalizeVersion(version),
		Release: UpdateRelease{
			TagName:     latest,
			Name:        payload.Name,
			Body:        payload.Body,
			HTMLURL:     payload.HTMLURL,
			PublishedAt: payload.PublishedAt,
		},
	}, nil
}

func (a *App) OpenExternalURL(targetURL string) error {
	targetURL = strings.TrimSpace(targetURL)
	if targetURL == "" {
		return fmt.Errorf("url is required")
	}

	runtime.BrowserOpenURL(a.ctx, targetURL)
	return nil
}
