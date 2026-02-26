export type AccelerableOp =
  | "HashAggregate"
  | "Filter"
  | "Sort"
  | "HashJoin"
  | "GraphTraversal"
  | "VectorDistance"
  | "CostAnalytics"
  | "Decompression"
  | "RuleEngine";

export const AccelerableOpLabel: Record<AccelerableOp, string> = {
  HashAggregate: "Hash Aggregate",
  Filter: "Filter",
  Sort: "Sort",
  HashJoin: "Hash Join",
  GraphTraversal: "Graph Traversal",
  VectorDistance: "Vector Distance",
  CostAnalytics: "Cost Analytics",
  Decompression: "Decompression",
  RuleEngine: "Rule Engine",
};

export type AcceleratorBackend = "Cpu" | "Gpu" | "Fpga" | "Npu";

export const AcceleratorBackendLabel: Record<AcceleratorBackend, string> = {
  Cpu: "CPU/SIMD",
  Gpu: "GPU (CUDA)",
  Fpga: "FPGA (OpenCL)",
  Npu: "NPU (ONNX)",
};

export const AcceleratorBackendBadge: Record<AcceleratorBackend, string> = {
  Cpu: "CPU",
  Gpu: "GPU",
  Fpga: "FPGA",
  Npu: "NPU",
};

export type SimdLevel = "Scalar" | "Sse42" | "Avx2" | "Avx512" | "Neon";

export const SimdLevelLabel: Record<SimdLevel, string> = {
  Scalar: "Scalar",
  Sse42: "SSE 4.2",
  Avx2: "AVX2",
  Avx512: "AVX-512",
  Neon: "NEON",
};

export interface HardwareProfile {
  gpu_count: number;
  gpu_total_vram_bytes: number;
  gpu_device_name?: string;
  gpu_compute_capability?: [number, number];
  fpga_available: boolean;
  fpga_device_name?: string;
  npu_available: boolean;
  simd_level: SimdLevel;
  cpu_batch_size: number;
  gpu_batch_size: number;
  gpu_offload_threshold_rows: number;
}

export function defaultHardwareProfile(): HardwareProfile {
  return {
    gpu_count: 0,
    gpu_total_vram_bytes: 0,
    fpga_available: false,
    npu_available: false,
    simd_level: "Scalar",
    cpu_batch_size: 8192,
    gpu_batch_size: 65536,
    gpu_offload_threshold_rows: 100_000,
  };
}

export interface OperatorAnalysis {
  operator_name: string;
  op_type?: AccelerableOp;
  estimated_rows: number;
  recommended_backend: AcceleratorBackend;
  backend_options: BackendOption[];
  rationale: string;
}

export interface BackendOption {
  backend: AcceleratorBackend;
  estimated_speedup: number;
  estimated_time_ms: number;
  estimated_cost_usd: number;
  available: boolean;
}

export interface StrategyComparison {
  name: string;
  description: string;
  total_estimated_time_ms: number;
  total_estimated_cost_usd: number;
  overall_speedup: number;
  operator_backends: [string, AcceleratorBackend][];
  break_even_queries_per_hour?: number;
}

export interface WorkbenchResult {
  sql: string;
  explain_text?: string;
  hardware_profile: HardwareProfile;
  operator_analyses: OperatorAnalysis[];
  strategies: StrategyComparison[];
  recommended_strategy_index: number;
  recommendations: Recommendation[];
}

export interface Recommendation {
  category: RecommendationCategory;
  title: string;
  description: string;
  actionable_sql?: string;
}

export type RecommendationCategory =
  | "HardwareAcceleration"
  | "StorageTier"
  | "PartitionStrategy"
  | "IndexSuggestion"
  | "QueryRewrite"
  | "ScalingHint";

export const RecommendationCategoryLabel: Record<RecommendationCategory, string> = {
  HardwareAcceleration: "Hardware Acceleration",
  StorageTier: "Storage Tier",
  PartitionStrategy: "Partition Strategy",
  IndexSuggestion: "Index Suggestion",
  QueryRewrite: "Query Rewrite",
  ScalingHint: "Scaling Hint",
};
