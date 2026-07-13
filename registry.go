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

type RegistryConfig struct {
	Name     string `json:"name"`
	URL      string `json:"url"`
	Username string `json:"username"`
	Password string `json:"password,omitempty"`
}

type RegistryCatalogResult struct {
	Registry     RegistryConfig `json:"registry"`
	Repositories []string       `json:"repositories"`
}

type RegistryTagsResult struct {
	Repository string   `json:"repository"`
	Tags       []string `json:"tags"`
}

func normalizeRegistryURL(rawURL string) (string, error) {
	trimmedURL := strings.TrimSpace(rawURL)
	if trimmedURL == "" {
		return "", fmt.Errorf("registry URL is required")
	}

	if !strings.HasPrefix(trimmedURL, "http://") && !strings.HasPrefix(trimmedURL, "https://") {
		trimmedURL = "http://" + trimmedURL
	}

	parsedURL, err := url.Parse(trimmedURL)
	if err != nil {
		return "", err
	}

	if parsedURL.Host == "" {
		return "", fmt.Errorf("registry URL must include a host")
	}

	return strings.TrimRight(parsedURL.String(), "/"), nil
}

func (a *App) registryRequest(ctx context.Context, registry RegistryConfig, path string) (*http.Response, error) {
	baseURL, err := normalizeRegistryURL(registry.URL)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, baseURL+path, nil)
	if err != nil {
		return nil, err
	}

	if registry.Username != "" {
		req.SetBasicAuth(registry.Username, registry.Password)
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode < http.StatusOK || resp.StatusCode >= http.StatusMultipleChoices {
		resp.Body.Close()
		return nil, fmt.Errorf("registry returned %s", resp.Status)
	}

	return resp, nil
}

func (a *App) TestRegistryConnection(registry RegistryConfig) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	resp, err := a.registryRequest(ctx, registry, "/v2/")
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	return nil
}

func (a *App) ListRegistryCatalog(registry RegistryConfig) (RegistryCatalogResult, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	resp, err := a.registryRequest(ctx, registry, "/v2/_catalog")
	if err != nil {
		return RegistryCatalogResult{}, err
	}
	defer resp.Body.Close()

	var catalog struct {
		Repositories []string `json:"repositories"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&catalog); err != nil {
		return RegistryCatalogResult{}, err
	}

	if registry.Name == "" {
		registry.Name = registry.URL
	}

	return RegistryCatalogResult{
		Registry:     registry,
		Repositories: catalog.Repositories,
	}, nil
}

func (a *App) ListRegistryTags(registry RegistryConfig, repository string) (RegistryTagsResult, error) {
	repository = strings.TrimSpace(repository)
	if repository == "" {
		return RegistryTagsResult{}, fmt.Errorf("repository is required")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	resp, err := a.registryRequest(ctx, registry, fmt.Sprintf("/v2/%s/tags/list", repository))
	if err != nil {
		return RegistryTagsResult{}, err
	}
	defer resp.Body.Close()

	var result struct {
		Name string   `json:"name"`
		Tags []string `json:"tags"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return RegistryTagsResult{}, err
	}

	return RegistryTagsResult{
		Repository: result.Name,
		Tags:       result.Tags,
	}, nil
}
