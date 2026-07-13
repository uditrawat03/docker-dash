package main

// DockerStatus describes the current Docker daemon connection for the frontend.
type DockerStatus struct {
	Connected         bool   `json:"connected"`
	Message           string `json:"message"`
	Version           string `json:"version"`
	APIVersion        string `json:"apiVersion"`
	OS                string `json:"os"`
	Arch              string `json:"arch"`
	TotalContainers   int    `json:"totalContainers"`
	RunningContainers int    `json:"runningContainers"`
	ErrorMessage      string `json:"errorMessage,omitempty"`
}

// ContainerInfo is the frontend-safe shape used by container list screens.
type ContainerInfo struct {
	ID                  string `json:"id"`
	Name                string `json:"name"`
	Image               string `json:"image"`
	State               string `json:"state"`
	Status              string `json:"status"`
	Health              string `json:"health"`
	HealthFailingStreak int    `json:"healthFailingStreak"`
	Ports               string `json:"ports"`
	Created             string `json:"created"`
}

type ContainerStats struct {
	CPUPercent    float64 `json:"cpuPercent"`
	MemoryUsage   uint64  `json:"memoryUsage"`
	MemoryLimit   uint64  `json:"memoryLimit"`
	MemoryPercent float64 `json:"memoryPercent"`
	PIDs          uint64  `json:"pids"`
}

type ContainerSecurityCheck struct {
	Key         string `json:"key"`
	Label       string `json:"label"`
	Description string `json:"description"`
	Passed      bool   `json:"passed"`
}

type ContainerSecurityPosture struct {
	Score  int                      `json:"score"`
	Checks []ContainerSecurityCheck `json:"checks"`
}
type SwarmOverview struct {
	Active           bool   `json:"active"`
	LocalNodeState   string `json:"localNodeState"`
	ControlAvailable bool   `json:"controlAvailable"`
	NodeID           string `json:"nodeId"`
	NodeAddr         string `json:"nodeAddr"`
	ClusterID        string `json:"clusterId"`
	Nodes            int    `json:"nodes"`
	Managers         int    `json:"managers"`
	Error            string `json:"error"`
}

type SwarmServiceInfo struct {
	ID            string `json:"id"`
	Name          string `json:"name"`
	Image         string `json:"image"`
	Mode          string `json:"mode"`
	DesiredTasks  uint64 `json:"desiredTasks"`
	RunningTasks  uint64 `json:"runningTasks"`
	UpdateState   string `json:"updateState"`
	UpdateMessage string `json:"updateMessage"`
	Created       string `json:"created"`
	Updated       string `json:"updated"`
}

type SecretInfo struct {
	ID        string   `json:"id"`
	Name      string   `json:"name"`
	Created   string   `json:"created"`
	Updated   string   `json:"updated"`
	Labels    []string `json:"labels"`
	Sensitive bool     `json:"sensitive"`
}

// ContainerLogLine is emitted from Go to the frontend while a log stream is active.
type ContainerLogLine struct {
	ContainerID string `json:"containerId"`
	Stream      string `json:"stream"`
	Text        string `json:"text"`
	Timestamp   string `json:"timestamp"`
}

// ImageInfo is the frontend-safe shape used by image list screens.
type ImageInfo struct {
	ID      string   `json:"id"`
	Tags    []string `json:"tags"`
	Size    int64    `json:"size"`
	Created string   `json:"created"`
}

type ImageVulnerabilityCounts struct {
	Critical int `json:"critical"`
	High     int `json:"high"`
	Medium   int `json:"medium"`
	Low      int `json:"low"`
	Unknown  int `json:"unknown"`
}

type ImageScanResult struct {
	ImageRef        string                   `json:"imageRef"`
	Scanner         string                   `json:"scanner"`
	Summary         ImageVulnerabilityCounts `json:"summary"`
	Total           int                      `json:"total"`
	Recommendations []string                 `json:"recommendations"`
}

// ImagePullProgress mirrors Docker pull progress events with the image reference included.
type ImagePullProgress struct {
	ImageRef       string             `json:"imageRef"`
	Status         string             `json:"status"`
	ID             string             `json:"id,omitempty"`
	Progress       string             `json:"progress,omitempty"`
	ProgressDetail PullProgressDetail `json:"progressDetail"`
	Error          string             `json:"error,omitempty"`
	Done           bool               `json:"done,omitempty"`
}

type PullProgressDetail struct {
	Current int64 `json:"current"`
	Total   int64 `json:"total"`
}

// ContainerDetails is the curated inspect payload used by the detail panel.
type ContainerDetails struct {
	ID                  string                   `json:"id"`
	Name                string                   `json:"name"`
	Image               string                   `json:"image"`
	State               string                   `json:"state"`
	Status              string                   `json:"status"`
	Health              string                   `json:"health"`
	HealthFailingStreak int                      `json:"healthFailingStreak"`
	Security            ContainerSecurityPosture `json:"security"`
	Created             string                   `json:"created"`
	Command             string                   `json:"command"`
	Env                 []string                 `json:"env"`
	Mounts              []ContainerMount         `json:"mounts"`
	Networks            []ContainerNetwork       `json:"networks"`
	Ports               []string                 `json:"ports"`
	BrowserURL          string                   `json:"browserUrl"`
	RawJSON             string                   `json:"rawJson"`
}

type ContainerMount struct {
	Type        string `json:"type"`
	Source      string `json:"source"`
	Destination string `json:"destination"`
	Mode        string `json:"mode"`
	RW          bool   `json:"rw"`
}

type ContainerNetwork struct {
	Name      string `json:"name"`
	IPAddress string `json:"ipAddress"`
	Gateway   string `json:"gateway"`
	Mac       string `json:"mac"`
}

// VolumeInfo is the frontend-safe shape used by the volume manager.
type VolumeInfo struct {
	Name       string        `json:"name"`
	Driver     string        `json:"driver"`
	Mountpoint string        `json:"mountpoint"`
	CreatedAt  string        `json:"createdAt"`
	Scope      string        `json:"scope"`
	Labels     []string      `json:"labels"`
	InUse      bool          `json:"inUse"`
	UsedBy     []VolumeUsage `json:"usedBy"`
}

type VolumeUsage struct {
	ContainerID   string `json:"containerId"`
	ContainerName string `json:"containerName"`
	State         string `json:"state"`
	Destination   string `json:"destination"`
}

// NetworkInfo is the frontend-safe shape used by the network inspector.
type NetworkInfo struct {
	ID         string             `json:"id"`
	Name       string             `json:"name"`
	Driver     string             `json:"driver"`
	Scope      string             `json:"scope"`
	Created    string             `json:"created"`
	Internal   bool               `json:"internal"`
	Attachable bool               `json:"attachable"`
	Ingress    bool               `json:"ingress"`
	Default    bool               `json:"default"`
	Subnets    []NetworkSubnet    `json:"subnets"`
	Containers []NetworkContainer `json:"containers"`
}

type NetworkSubnet struct {
	Subnet  string `json:"subnet"`
	Gateway string `json:"gateway"`
}

type NetworkContainer struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	EndpointID  string `json:"endpointId"`
	IPv4Address string `json:"ipv4Address"`
	IPv6Address string `json:"ipv6Address"`
	MacAddress  string `json:"macAddress"`
}

type CIWorkflowRun struct {
	ID          int64  `json:"id"`
	Name        string `json:"name"`
	Status      string `json:"status"`
	Conclusion  string `json:"conclusion"`
	Branch      string `json:"branch"`
	Event       string `json:"event"`
	CommitSHA   string `json:"commitSha"`
	CommitTitle string `json:"commitTitle"`
	HTMLURL     string `json:"htmlUrl"`
	CreatedAt   string `json:"createdAt"`
	UpdatedAt   string `json:"updatedAt"`
}

type CIWorkflowRunResult struct {
	Owner string          `json:"owner"`
	Repo  string          `json:"repo"`
	Runs  []CIWorkflowRun `json:"runs"`
}

type UpdateRelease struct {
	TagName     string `json:"tagName"`
	Name        string `json:"name"`
	Body        string `json:"body"`
	HTMLURL     string `json:"htmlUrl"`
	PublishedAt string `json:"publishedAt"`
}

type UpdateCheckResult struct {
	CurrentVersion  string        `json:"currentVersion"`
	LatestVersion   string        `json:"latestVersion"`
	UpdateAvailable bool          `json:"updateAvailable"`
	Release         UpdateRelease `json:"release"`
}
