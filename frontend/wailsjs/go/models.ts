export namespace main {
	
	export class CIWorkflowRun {
	    id: number;
	    name: string;
	    status: string;
	    conclusion: string;
	    branch: string;
	    event: string;
	    commitSha: string;
	    commitTitle: string;
	    htmlUrl: string;
	    createdAt: string;
	    updatedAt: string;
	
	    static createFrom(source: any = {}) {
	        return new CIWorkflowRun(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.status = source["status"];
	        this.conclusion = source["conclusion"];
	        this.branch = source["branch"];
	        this.event = source["event"];
	        this.commitSha = source["commitSha"];
	        this.commitTitle = source["commitTitle"];
	        this.htmlUrl = source["htmlUrl"];
	        this.createdAt = source["createdAt"];
	        this.updatedAt = source["updatedAt"];
	    }
	}
	export class CIWorkflowRunResult {
	    owner: string;
	    repo: string;
	    runs: CIWorkflowRun[];
	
	    static createFrom(source: any = {}) {
	        return new CIWorkflowRunResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.owner = source["owner"];
	        this.repo = source["repo"];
	        this.runs = this.convertValues(source["runs"], CIWorkflowRun);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ComposeServiceSummary {
	    name: string;
	    image: string;
	    ports: string[];
	
	    static createFrom(source: any = {}) {
	        return new ComposeServiceSummary(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.image = source["image"];
	        this.ports = source["ports"];
	    }
	}
	export class ComposeProjectSummary {
	    path: string;
	    name: string;
	    services: ComposeServiceSummary[];
	
	    static createFrom(source: any = {}) {
	        return new ComposeProjectSummary(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.path = source["path"];
	        this.name = source["name"];
	        this.services = this.convertValues(source["services"], ComposeServiceSummary);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	export class ContainerNetwork {
	    name: string;
	    ipAddress: string;
	    gateway: string;
	    mac: string;
	
	    static createFrom(source: any = {}) {
	        return new ContainerNetwork(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.ipAddress = source["ipAddress"];
	        this.gateway = source["gateway"];
	        this.mac = source["mac"];
	    }
	}
	export class ContainerMount {
	    type: string;
	    source: string;
	    destination: string;
	    mode: string;
	    rw: boolean;
	
	    static createFrom(source: any = {}) {
	        return new ContainerMount(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.type = source["type"];
	        this.source = source["source"];
	        this.destination = source["destination"];
	        this.mode = source["mode"];
	        this.rw = source["rw"];
	    }
	}
	export class ContainerSecurityCheck {
	    key: string;
	    label: string;
	    description: string;
	    passed: boolean;
	
	    static createFrom(source: any = {}) {
	        return new ContainerSecurityCheck(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.key = source["key"];
	        this.label = source["label"];
	        this.description = source["description"];
	        this.passed = source["passed"];
	    }
	}
	export class ContainerSecurityPosture {
	    score: number;
	    checks: ContainerSecurityCheck[];
	
	    static createFrom(source: any = {}) {
	        return new ContainerSecurityPosture(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.score = source["score"];
	        this.checks = this.convertValues(source["checks"], ContainerSecurityCheck);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ContainerDetails {
	    id: string;
	    name: string;
	    image: string;
	    state: string;
	    status: string;
	    health: string;
	    healthFailingStreak: number;
	    security: ContainerSecurityPosture;
	    created: string;
	    command: string;
	    env: string[];
	    mounts: ContainerMount[];
	    networks: ContainerNetwork[];
	    ports: string[];
	    browserUrl: string;
	    rawJson: string;
	
	    static createFrom(source: any = {}) {
	        return new ContainerDetails(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.image = source["image"];
	        this.state = source["state"];
	        this.status = source["status"];
	        this.health = source["health"];
	        this.healthFailingStreak = source["healthFailingStreak"];
	        this.security = this.convertValues(source["security"], ContainerSecurityPosture);
	        this.created = source["created"];
	        this.command = source["command"];
	        this.env = source["env"];
	        this.mounts = this.convertValues(source["mounts"], ContainerMount);
	        this.networks = this.convertValues(source["networks"], ContainerNetwork);
	        this.ports = source["ports"];
	        this.browserUrl = source["browserUrl"];
	        this.rawJson = source["rawJson"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ContainerInfo {
	    id: string;
	    name: string;
	    image: string;
	    state: string;
	    status: string;
	    health: string;
	    healthFailingStreak: number;
	    ports: string;
	    created: string;
	
	    static createFrom(source: any = {}) {
	        return new ContainerInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.image = source["image"];
	        this.state = source["state"];
	        this.status = source["status"];
	        this.health = source["health"];
	        this.healthFailingStreak = source["healthFailingStreak"];
	        this.ports = source["ports"];
	        this.created = source["created"];
	    }
	}
	
	
	
	
	export class ContainerStats {
	    cpuPercent: number;
	    memoryUsage: number;
	    memoryLimit: number;
	    memoryPercent: number;
	    pids: number;
	
	    static createFrom(source: any = {}) {
	        return new ContainerStats(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.cpuPercent = source["cpuPercent"];
	        this.memoryUsage = source["memoryUsage"];
	        this.memoryLimit = source["memoryLimit"];
	        this.memoryPercent = source["memoryPercent"];
	        this.pids = source["pids"];
	    }
	}
	export class DockerStatus {
	    connected: boolean;
	    message: string;
	    version: string;
	    apiVersion: string;
	    os: string;
	    arch: string;
	    totalContainers: number;
	    runningContainers: number;
	    errorMessage?: string;
	
	    static createFrom(source: any = {}) {
	        return new DockerStatus(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.connected = source["connected"];
	        this.message = source["message"];
	        this.version = source["version"];
	        this.apiVersion = source["apiVersion"];
	        this.os = source["os"];
	        this.arch = source["arch"];
	        this.totalContainers = source["totalContainers"];
	        this.runningContainers = source["runningContainers"];
	        this.errorMessage = source["errorMessage"];
	    }
	}
	export class ImageInfo {
	    id: string;
	    tags: string[];
	    size: number;
	    created: string;
	
	    static createFrom(source: any = {}) {
	        return new ImageInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.tags = source["tags"];
	        this.size = source["size"];
	        this.created = source["created"];
	    }
	}
	export class ImageVulnerabilityCounts {
	    critical: number;
	    high: number;
	    medium: number;
	    low: number;
	    unknown: number;
	
	    static createFrom(source: any = {}) {
	        return new ImageVulnerabilityCounts(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.critical = source["critical"];
	        this.high = source["high"];
	        this.medium = source["medium"];
	        this.low = source["low"];
	        this.unknown = source["unknown"];
	    }
	}
	export class ImageScanResult {
	    imageRef: string;
	    scanner: string;
	    summary: ImageVulnerabilityCounts;
	    total: number;
	    recommendations: string[];
	
	    static createFrom(source: any = {}) {
	        return new ImageScanResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.imageRef = source["imageRef"];
	        this.scanner = source["scanner"];
	        this.summary = this.convertValues(source["summary"], ImageVulnerabilityCounts);
	        this.total = source["total"];
	        this.recommendations = source["recommendations"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	export class NetworkContainer {
	    id: string;
	    name: string;
	    endpointId: string;
	    ipv4Address: string;
	    ipv6Address: string;
	    macAddress: string;
	
	    static createFrom(source: any = {}) {
	        return new NetworkContainer(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.endpointId = source["endpointId"];
	        this.ipv4Address = source["ipv4Address"];
	        this.ipv6Address = source["ipv6Address"];
	        this.macAddress = source["macAddress"];
	    }
	}
	export class NetworkSubnet {
	    subnet: string;
	    gateway: string;
	
	    static createFrom(source: any = {}) {
	        return new NetworkSubnet(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.subnet = source["subnet"];
	        this.gateway = source["gateway"];
	    }
	}
	export class NetworkInfo {
	    id: string;
	    name: string;
	    driver: string;
	    scope: string;
	    created: string;
	    internal: boolean;
	    attachable: boolean;
	    ingress: boolean;
	    default: boolean;
	    subnets: NetworkSubnet[];
	    containers: NetworkContainer[];
	
	    static createFrom(source: any = {}) {
	        return new NetworkInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.driver = source["driver"];
	        this.scope = source["scope"];
	        this.created = source["created"];
	        this.internal = source["internal"];
	        this.attachable = source["attachable"];
	        this.ingress = source["ingress"];
	        this.default = source["default"];
	        this.subnets = this.convertValues(source["subnets"], NetworkSubnet);
	        this.containers = this.convertValues(source["containers"], NetworkContainer);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	export class RegistryAuthConfig {
	    username: string;
	    password: string;
	    serveraddress: string;
	
	    static createFrom(source: any = {}) {
	        return new RegistryAuthConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.username = source["username"];
	        this.password = source["password"];
	        this.serveraddress = source["serveraddress"];
	    }
	}
	export class RegistryConfig {
	    name: string;
	    url: string;
	    username: string;
	    password?: string;
	
	    static createFrom(source: any = {}) {
	        return new RegistryConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.url = source["url"];
	        this.username = source["username"];
	        this.password = source["password"];
	    }
	}
	export class RegistryCatalogResult {
	    registry: RegistryConfig;
	    repositories: string[];
	
	    static createFrom(source: any = {}) {
	        return new RegistryCatalogResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.registry = this.convertValues(source["registry"], RegistryConfig);
	        this.repositories = source["repositories"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	export class RegistryTagsResult {
	    repository: string;
	    tags: string[];
	
	    static createFrom(source: any = {}) {
	        return new RegistryTagsResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.repository = source["repository"];
	        this.tags = source["tags"];
	    }
	}
	export class SecretInfo {
	    id: string;
	    name: string;
	    created: string;
	    updated: string;
	    labels: string[];
	    sensitive: boolean;
	
	    static createFrom(source: any = {}) {
	        return new SecretInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.created = source["created"];
	        this.updated = source["updated"];
	        this.labels = source["labels"];
	        this.sensitive = source["sensitive"];
	    }
	}
	export class SwarmOverview {
	    active: boolean;
	    localNodeState: string;
	    controlAvailable: boolean;
	    nodeId: string;
	    nodeAddr: string;
	    clusterId: string;
	    nodes: number;
	    managers: number;
	    error: string;
	
	    static createFrom(source: any = {}) {
	        return new SwarmOverview(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.active = source["active"];
	        this.localNodeState = source["localNodeState"];
	        this.controlAvailable = source["controlAvailable"];
	        this.nodeId = source["nodeId"];
	        this.nodeAddr = source["nodeAddr"];
	        this.clusterId = source["clusterId"];
	        this.nodes = source["nodes"];
	        this.managers = source["managers"];
	        this.error = source["error"];
	    }
	}
	export class SwarmServiceInfo {
	    id: string;
	    name: string;
	    image: string;
	    mode: string;
	    desiredTasks: number;
	    runningTasks: number;
	    updateState: string;
	    updateMessage: string;
	    created: string;
	    updated: string;
	
	    static createFrom(source: any = {}) {
	        return new SwarmServiceInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.image = source["image"];
	        this.mode = source["mode"];
	        this.desiredTasks = source["desiredTasks"];
	        this.runningTasks = source["runningTasks"];
	        this.updateState = source["updateState"];
	        this.updateMessage = source["updateMessage"];
	        this.created = source["created"];
	        this.updated = source["updated"];
	    }
	}
	export class UpdateRelease {
	    tagName: string;
	    name: string;
	    body: string;
	    htmlUrl: string;
	    publishedAt: string;
	
	    static createFrom(source: any = {}) {
	        return new UpdateRelease(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.tagName = source["tagName"];
	        this.name = source["name"];
	        this.body = source["body"];
	        this.htmlUrl = source["htmlUrl"];
	        this.publishedAt = source["publishedAt"];
	    }
	}
	export class UpdateCheckResult {
	    currentVersion: string;
	    latestVersion: string;
	    updateAvailable: boolean;
	    release: UpdateRelease;
	
	    static createFrom(source: any = {}) {
	        return new UpdateCheckResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.currentVersion = source["currentVersion"];
	        this.latestVersion = source["latestVersion"];
	        this.updateAvailable = source["updateAvailable"];
	        this.release = this.convertValues(source["release"], UpdateRelease);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	export class VolumeUsage {
	    containerId: string;
	    containerName: string;
	    state: string;
	    destination: string;
	
	    static createFrom(source: any = {}) {
	        return new VolumeUsage(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.containerId = source["containerId"];
	        this.containerName = source["containerName"];
	        this.state = source["state"];
	        this.destination = source["destination"];
	    }
	}
	export class VolumeInfo {
	    name: string;
	    driver: string;
	    mountpoint: string;
	    createdAt: string;
	    scope: string;
	    labels: string[];
	    inUse: boolean;
	    usedBy: VolumeUsage[];
	
	    static createFrom(source: any = {}) {
	        return new VolumeInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.driver = source["driver"];
	        this.mountpoint = source["mountpoint"];
	        this.createdAt = source["createdAt"];
	        this.scope = source["scope"];
	        this.labels = source["labels"];
	        this.inUse = source["inUse"];
	        this.usedBy = this.convertValues(source["usedBy"], VolumeUsage);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

