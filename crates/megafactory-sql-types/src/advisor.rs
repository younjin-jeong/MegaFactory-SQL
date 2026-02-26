//! Types for the Algorithm Workbench and Intelligent Query Advisor.
//!
//! These types mirror MegaDB's hardware acceleration abstractions:
//! - `megadb-compute/src/accel.rs` — AccelerableOp, AcceleratorBackend, choose_backend()
//! - `megadb-core/src/config.rs` — HardwareCapabilities, GpuConfig, FpgaConfig, NpuConfig
//! - `docs/hardware-acceleration.md` — workload classification, cost framework

use serde::{Deserialize, Serialize};

/// Query operators that can be accelerated by hardware.
///
/// Mirrors MegaDB `AccelerableOp` (megadb-compute/src/accel.rs).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum AccelerableOp {
    HashAggregate,
    Filter,
    Sort,
    HashJoin,
    GraphTraversal,
    VectorDistance,
    CostAnalytics,
    Decompression,
    RuleEngine,
}

impl AccelerableOp {
    pub fn label(&self) -> &'static str {
        match self {
            Self::HashAggregate => "Hash Aggregate",
            Self::Filter => "Filter",
            Self::Sort => "Sort",
            Self::HashJoin => "Hash Join",
            Self::GraphTraversal => "Graph Traversal",
            Self::VectorDistance => "Vector Distance",
            Self::CostAnalytics => "Cost Analytics",
            Self::Decompression => "Decompression",
            Self::RuleEngine => "Rule Engine",
        }
    }
}

/// Execution backend for an operator.
///
/// Mirrors MegaDB `AcceleratorBackend` (megadb-compute/src/accel.rs).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum AcceleratorBackend {
    Cpu,
    Gpu,
    Fpga,
    Npu,
}

impl AcceleratorBackend {
    pub fn label(&self) -> &'static str {
        match self {
            Self::Cpu => "CPU/SIMD",
            Self::Gpu => "GPU (CUDA)",
            Self::Fpga => "FPGA (OpenCL)",
            Self::Npu => "NPU (ONNX)",
        }
    }

    pub fn badge(&self) -> &'static str {
        match self {
            Self::Cpu => "CPU",
            Self::Gpu => "GPU",
            Self::Fpga => "FPGA",
            Self::Npu => "NPU",
        }
    }
}

/// SIMD capability level detected at runtime.
///
/// Mirrors MegaDB `SimdLevel` (megadb-core/src/config.rs).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum SimdLevel {
    Scalar,
    Sse42,
    Avx2,
    Avx512,
    Neon,
}

impl SimdLevel {
    pub fn label(&self) -> &'static str {
        match self {
            Self::Scalar => "Scalar",
            Self::Sse42 => "SSE 4.2",
            Self::Avx2 => "AVX2",
            Self::Avx512 => "AVX-512",
            Self::Neon => "NEON",
        }
    }
}

/// Hardware capabilities of the MegaDB cluster.
///
/// Mirrors MegaDB `HardwareCapabilities` (megadb-core/src/config.rs lines 399-427).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HardwareProfile {
    pub gpu_count: u32,
    pub gpu_total_vram_bytes: u64,
    pub gpu_device_name: Option<String>,
    pub gpu_compute_capability: Option<(u32, u32)>,
    pub fpga_available: bool,
    pub fpga_device_name: Option<String>,
    pub npu_available: bool,
    pub simd_level: SimdLevel,
    pub cpu_batch_size: u64,
    pub gpu_batch_size: u64,
    pub gpu_offload_threshold_rows: u64,
}

impl Default for HardwareProfile {
    fn default() -> Self {
        Self {
            gpu_count: 0,
            gpu_total_vram_bytes: 0,
            gpu_device_name: None,
            gpu_compute_capability: None,
            fpga_available: false,
            fpga_device_name: None,
            npu_available: false,
            simd_level: SimdLevel::Scalar,
            cpu_batch_size: 8192,
            gpu_batch_size: 65536,
            gpu_offload_threshold_rows: 100_000,
        }
    }
}

/// Analysis of a single operator in the EXPLAIN plan.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OperatorAnalysis {
    /// Operator name from the EXPLAIN plan (e.g., "HashAggregateExec").
    pub operator_name: String,
    /// Classified accelerable operation type.
    pub op_type: Option<AccelerableOp>,
    /// Estimated row count from EXPLAIN.
    pub estimated_rows: u64,
    /// Recommended backend from `choose_backend()` logic.
    pub recommended_backend: AcceleratorBackend,
    /// All viable backends with estimated speedup.
    pub backend_options: Vec<BackendOption>,
    /// Why this backend was recommended.
    pub rationale: String,
}

/// A candidate backend for an operator with performance/cost estimates.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BackendOption {
    pub backend: AcceleratorBackend,
    pub estimated_speedup: f64,
    pub estimated_time_ms: f64,
    pub estimated_cost_usd: f64,
    pub available: bool,
}

/// Execution strategy combining backends across all operators in a query.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StrategyComparison {
    pub name: String,
    pub description: String,
    pub total_estimated_time_ms: f64,
    pub total_estimated_cost_usd: f64,
    pub overall_speedup: f64,
    /// Per-operator backend assignments.
    pub operator_backends: Vec<(String, AcceleratorBackend)>,
    /// Break-even: queries per hour needed for this strategy to be cost-effective.
    pub break_even_queries_per_hour: Option<f64>,
}

/// Full workbench analysis result for a query.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkbenchResult {
    pub sql: String,
    pub explain_text: Option<String>,
    pub hardware_profile: HardwareProfile,
    pub operator_analyses: Vec<OperatorAnalysis>,
    pub strategies: Vec<StrategyComparison>,
    pub recommended_strategy_index: usize,
    pub recommendations: Vec<Recommendation>,
}

/// Actionable recommendation from the workbench.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Recommendation {
    pub category: RecommendationCategory,
    pub title: String,
    pub description: String,
    /// Optional DDL or config change the user can copy-paste.
    pub actionable_sql: Option<String>,
}

/// Categories of recommendations.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum RecommendationCategory {
    HardwareAcceleration,
    StorageTier,
    PartitionStrategy,
    IndexSuggestion,
    QueryRewrite,
    ScalingHint,
}

impl RecommendationCategory {
    pub fn label(&self) -> &'static str {
        match self {
            Self::HardwareAcceleration => "Hardware Acceleration",
            Self::StorageTier => "Storage Tier",
            Self::PartitionStrategy => "Partition Strategy",
            Self::IndexSuggestion => "Index Suggestion",
            Self::QueryRewrite => "Query Rewrite",
            Self::ScalingHint => "Scaling Hint",
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn accelerable_op_labels() {
        assert_eq!(AccelerableOp::HashAggregate.label(), "Hash Aggregate");
        assert_eq!(AccelerableOp::Decompression.label(), "Decompression");
    }

    #[test]
    fn backend_labels() {
        assert_eq!(AcceleratorBackend::Gpu.label(), "GPU (CUDA)");
        assert_eq!(AcceleratorBackend::Cpu.badge(), "CPU");
    }

    #[test]
    fn default_hardware_profile() {
        let profile = HardwareProfile::default();
        assert_eq!(profile.gpu_count, 0);
        assert_eq!(profile.cpu_batch_size, 8192);
        assert_eq!(profile.gpu_batch_size, 65536);
        assert_eq!(profile.gpu_offload_threshold_rows, 100_000);
    }

    #[test]
    fn recommendation_category_labels() {
        assert_eq!(
            RecommendationCategory::HardwareAcceleration.label(),
            "Hardware Acceleration"
        );
        assert_eq!(RecommendationCategory::StorageTier.label(), "Storage Tier");
    }

    #[test]
    fn serde_roundtrip() {
        let analysis = OperatorAnalysis {
            operator_name: "HashAggregateExec".into(),
            op_type: Some(AccelerableOp::HashAggregate),
            estimated_rows: 1_200_000_000,
            recommended_backend: AcceleratorBackend::Gpu,
            backend_options: vec![
                BackendOption {
                    backend: AcceleratorBackend::Cpu,
                    estimated_speedup: 1.0,
                    estimated_time_ms: 23400.0,
                    estimated_cost_usd: 0.021,
                    available: true,
                },
                BackendOption {
                    backend: AcceleratorBackend::Gpu,
                    estimated_speedup: 9.3,
                    estimated_time_ms: 2516.0,
                    estimated_cost_usd: 0.083,
                    available: true,
                },
            ],
            rationale: "1.2B rows exceeds GPU offload threshold (100K)".into(),
        };
        let json = serde_json::to_string(&analysis).unwrap();
        let decoded: OperatorAnalysis = serde_json::from_str(&json).unwrap();
        assert_eq!(decoded.operator_name, "HashAggregateExec");
        assert_eq!(decoded.recommended_backend, AcceleratorBackend::Gpu);
    }
}
