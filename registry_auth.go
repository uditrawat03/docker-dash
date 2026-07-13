package main

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"strings"
)

type RegistryAuthConfig struct {
	Username      string `json:"username"`
	Password      string `json:"password"`
	ServerAddress string `json:"serveraddress"`
}

func (a *App) EncodeRegistryAuth(auth RegistryAuthConfig) (string, error) {
	auth.Username = strings.TrimSpace(auth.Username)
	auth.ServerAddress = strings.TrimSpace(auth.ServerAddress)

	if auth.Username == "" {
		return "", fmt.Errorf("registry username is required")
	}

	if auth.Password == "" {
		return "", fmt.Errorf("registry password or token is required")
	}

	if auth.ServerAddress == "" {
		return "", fmt.Errorf("registry server address is required")
	}

	authJSON, err := json.Marshal(auth)
	if err != nil {
		return "", err
	}

	return base64.StdEncoding.EncodeToString(authJSON), nil
}
