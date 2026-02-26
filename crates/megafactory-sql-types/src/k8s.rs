use serde::{Deserialize, Serialize};

/// Overall cluster status from MegaDB CRD.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct ClusterStatus {
    pub phase: String,
    pub ready_replicas: i32,
    pub total_replicas: i32,
    pub coordinator_endpoint: String,
    pub message: String,
    pub pods: Vec<PodInfo>,
    pub volumes: Vec<VolumeInfo>,
}

/// Status of a single pod in the cluster.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PodInfo {
    pub name: String,
    /// "coordinator" or "worker"
    pub role: String,
    /// "Running", "Pending", "Failed", "Terminating"
    pub status: String,
    pub cpu_usage_percent: f64,
    pub memory_bytes: u64,
    pub memory_limit_bytes: u64,
    pub disk_usage_percent: f64,
    pub restart_count: i32,
    pub age_seconds: u64,
}

/// Status of a Persistent Volume Claim.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VolumeInfo {
    pub name: String,
    /// "ReadWriteMany" or "ReadWriteOnce"
    pub access_mode: String,
    pub capacity_bytes: u64,
    pub used_bytes: u64,
    pub bound_pod: String,
}

/// Request to scale the cluster.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScaleRequest {
    pub replicas: i32,
}

/// KEDA autoscaling configuration.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KedaConfig {
    pub enabled: bool,
    pub min_replicas: i32,
    pub max_replicas: i32,
}

impl PodInfo {
    pub fn is_ready(&self) -> bool {
        self.status == "Running"
    }

    pub fn age_display(&self) -> String {
        let secs = self.age_seconds;
        if secs < 60 {
            format!("{secs}s")
        } else if secs < 3600 {
            format!("{}m", secs / 60)
        } else if secs < 86400 {
            format!("{}h", secs / 3600)
        } else {
            format!("{}d", secs / 86400)
        }
    }

    pub fn memory_display(&self) -> String {
        let mb = self.memory_bytes / (1024 * 1024);
        if mb < 1024 {
            format!("{mb} MB")
        } else {
            format!("{:.1} GB", mb as f64 / 1024.0)
        }
    }
}
