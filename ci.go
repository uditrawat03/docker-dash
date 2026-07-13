package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"
)

const ciRequestTimeout = 20 * time.Second

func cleanGitHubPathSegment(label string, value string) (string, error) {
	value = strings.TrimSpace(value)
	if value == "" {
		return "", fmt.Errorf("%s is required", label)
	}
	if strings.ContainsAny(value, "/\\ \t\r\n") {
		return "", fmt.Errorf("%s must be a single GitHub path segment", label)
	}

	return value, nil
}

type githubWorkflowRunsResponse struct {
	WorkflowRuns []struct {
		ID         int64  `json:"id"`
		Name       string `json:"name"`
		Status     string `json:"status"`
		Conclusion string `json:"conclusion"`
		Branch     string `json:"head_branch"`
		Event      string `json:"event"`
		CommitSHA  string `json:"head_sha"`
		HTMLURL    string `json:"html_url"`
		CreatedAt  string `json:"created_at"`
		UpdatedAt  string `json:"updated_at"`
		HeadCommit struct {
			Message string `json:"message"`
		} `json:"head_commit"`
	} `json:"workflow_runs"`
}

func commitTitle(message string) string {
	message = strings.TrimSpace(message)
	if message == "" {
		return "No commit message returned"
	}

	parts := strings.SplitN(message, "\n", 2)
	return strings.TrimSpace(parts[0])
}

func (a *App) ListCIWorkflowRuns(owner string, repo string, token string) (CIWorkflowRunResult, error) {
	cleanOwner, err := cleanGitHubPathSegment("owner", owner)
	if err != nil {
		return CIWorkflowRunResult{}, err
	}
	cleanRepo, err := cleanGitHubPathSegment("repo", repo)
	if err != nil {
		return CIWorkflowRunResult{}, err
	}

	ctx, cancel := context.WithTimeout(a.ctx, ciRequestTimeout)
	defer cancel()

	endpoint := fmt.Sprintf("https://api.github.com/repos/%s/%s/actions/runs?per_page=10", url.PathEscape(cleanOwner), url.PathEscape(cleanRepo))
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return CIWorkflowRunResult{}, err
	}

	req.Header.Set("Accept", "application/vnd.github+json")
	req.Header.Set("X-GitHub-Api-Version", "2022-11-28")
	req.Header.Set("User-Agent", "DockerDash")
	if strings.TrimSpace(token) != "" {
		req.Header.Set("Authorization", "Bearer "+strings.TrimSpace(token))
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return CIWorkflowRunResult{}, fmt.Errorf("fetch GitHub Actions runs: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return CIWorkflowRunResult{}, fmt.Errorf("GitHub Actions API returned %s", resp.Status)
	}

	var payload githubWorkflowRunsResponse
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		return CIWorkflowRunResult{}, fmt.Errorf("decode GitHub Actions runs: %w", err)
	}

	runs := make([]CIWorkflowRun, 0, len(payload.WorkflowRuns))
	for _, run := range payload.WorkflowRuns {
		runs = append(runs, CIWorkflowRun{
			ID:          run.ID,
			Name:        run.Name,
			Status:      run.Status,
			Conclusion:  run.Conclusion,
			Branch:      run.Branch,
			Event:       run.Event,
			CommitSHA:   run.CommitSHA,
			CommitTitle: commitTitle(run.HeadCommit.Message),
			HTMLURL:     run.HTMLURL,
			CreatedAt:   run.CreatedAt,
			UpdatedAt:   run.UpdatedAt,
		})
	}

	return CIWorkflowRunResult{Owner: cleanOwner, Repo: cleanRepo, Runs: runs}, nil
}
