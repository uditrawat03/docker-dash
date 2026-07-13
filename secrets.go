package main

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/moby/moby/api/types/swarm"
	"github.com/moby/moby/client"
)

const maxDockerSecretSize = 500 * 1024

func (s *DockerService) requireSwarmManager(parent context.Context) error {
	overview, err := s.SwarmOverview(parent)
	if err != nil {
		return err
	}
	if !overview.Active {
		return fmt.Errorf("Docker Swarm is not active")
	}
	if !overview.ControlAvailable {
		return fmt.Errorf("Docker secrets require a Swarm manager node")
	}

	return nil
}

func secretLabels(labels map[string]string) []string {
	if len(labels) == 0 {
		return []string{}
	}

	items := make([]string, 0, len(labels))
	for key, value := range labels {
		if value == "" {
			items = append(items, key)
			continue
		}
		items = append(items, key+"="+value)
	}

	return items
}

func formatTime(value time.Time) string {
	if value.IsZero() {
		return ""
	}

	return value.Format(time.RFC3339)
}

func (s *DockerService) ListSecrets(parent context.Context) ([]SecretInfo, error) {
	if err := s.requireSwarmManager(parent); err != nil {
		return nil, err
	}

	ctx, cancel := context.WithTimeout(dockerContext(parent), dockerConnectionTimeout)
	defer cancel()

	result, err := s.client.SecretList(ctx, client.SecretListOptions{})
	if err != nil {
		return nil, fmt.Errorf("list Docker secrets: %w", err)
	}

	secrets := make([]SecretInfo, 0, len(result.Items))
	for _, secret := range result.Items {
		secrets = append(secrets, SecretInfo{
			ID:        secret.ID,
			Name:      secret.Spec.Name,
			Created:   formatTime(secret.CreatedAt),
			Updated:   formatTime(secret.UpdatedAt),
			Labels:    secretLabels(secret.Spec.Labels),
			Sensitive: true,
		})
	}

	return secrets, nil
}

func (s *DockerService) CreateSecret(parent context.Context, name string, value string) (SecretInfo, error) {
	name = strings.TrimSpace(name)
	if name == "" {
		return SecretInfo{}, fmt.Errorf("secret name is required")
	}
	if value == "" {
		return SecretInfo{}, fmt.Errorf("secret value is required")
	}
	if len([]byte(value)) > maxDockerSecretSize {
		return SecretInfo{}, fmt.Errorf("secret value exceeds Docker's 500KB limit")
	}

	if err := s.requireSwarmManager(parent); err != nil {
		return SecretInfo{}, err
	}

	ctx, cancel := context.WithTimeout(dockerContext(parent), dockerConnectionTimeout)
	defer cancel()

	result, err := s.client.SecretCreate(ctx, client.SecretCreateOptions{Spec: swarm.SecretSpec{
		Annotations: swarm.Annotations{Name: name},
		Data:        []byte(value),
	}})
	if err != nil {
		return SecretInfo{}, fmt.Errorf("create Docker secret: %w", err)
	}

	return SecretInfo{ID: result.ID, Name: name, Sensitive: true}, nil
}

func (s *DockerService) RemoveSecret(parent context.Context, id string) error {
	id = strings.TrimSpace(id)
	if id == "" {
		return fmt.Errorf("secret id is required")
	}

	if err := s.requireSwarmManager(parent); err != nil {
		return err
	}

	ctx, cancel := context.WithTimeout(dockerContext(parent), dockerConnectionTimeout)
	defer cancel()

	if _, err := s.client.SecretRemove(ctx, id, client.SecretRemoveOptions{}); err != nil {
		return fmt.Errorf("remove Docker secret: %w", err)
	}

	return nil
}
