# MegaFactory SQL — Project Intelligence

## What is MegaFactory SQL?

MegaFactory SQL is a **Rust + WASM SQL console and algorithm workbench** for [MegaDB](https://github.com/younjin-jeong/MegaDB) — a Kubernetes-native hybrid database engine for cloud cost intelligence. It is MegaDB's primary user interface.

### Key Capabilities

1. **SQL Editor** — CodeMirror 6 with SQL syntax highlighting, multi-tab queries, Ctrl+Enter execution
2. **Schema Browser** — Database/schema/table tree with column details, partition info, storage engine type (MEMORY/OLTP/OLAP)
3. **K8s Dashboard** — Real-time pod status, scaling controls, disk/partition management
4. **Performance Monitoring** — Query throughput, latency percentiles, active queries, resource usage
5. **Algorithm Workbench** (planned) — Auto-EXPLAIN analysis, data profiling, hardware-algorithm recommendations (GPU/NPU/TPU/FPGA/CPU)

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | [Leptos 0.8](https://leptos.dev/) (Rust + WASM) |
| SQL Editor | CodeMirror 6 (CDN importmap) |
| Server | Axum 0.8 (SSR + API proxy) |
| Charts | SVG (inline, pure Rust) |
| Real-time | WebSocket |
| Persistence | localStorage / IndexedDB |
| Styling | Hand-written CSS (dark theme, no framework) |

## Architecture

```
Browser (WASM)  <-->  Leptos Server (SSR + API Proxy)  <-->  MegaDB HTTP :8080
                                                        <-->  K8s API
                                                        <-->  Prometheus :9090
```

The SQL console is **100% independent** of MegaDB core. It communicates only through MegaDB's public HTTP API and can be removed without any impact on MegaDB.

---

## Repository Layout

```
megafactory-sql/
├── CLAUDE.md                          <-- This file
├── README.md
├── Cargo.toml                         <-- Workspace root (3 crates)
├── .claude/agents/
│   ├── product-designer.md            <-- Product Designer agent
│   └── web-developer.md               <-- Web Developer agent
├── crates/
│   ├── megafactory-sql-types/         <-- Shared types (query, schema, k8s, metrics)
│   ├── megafactory-sql-app/           <-- Leptos UI (pages, components, state)
│   └── megafactory-sql-server/        <-- Axum server (SSR, API proxy, WebSocket)
├── js/
│   └── codemirror-bridge.js           <-- CodeMirror 6 JS bridge
├── style/
│   └── main.css                       <-- Global CSS (dark theme)
├── docker/
│   ├── Dockerfile                     <-- Multi-stage build
│   └── docker-compose.yml             <-- Local dev with MegaDB backend
└── .github/workflows/
    └── ci.yml                         <-- cargo check/test/clippy/fmt
```

## Crate Dependency Map

```
megafactory-sql-server
    ├── megafactory-sql-app (features = ["ssr"])
    │       └── megafactory-sql-types
    └── megafactory-sql-types
```

---

## Build Commands

```bash
cd /Users/mzc01-younjin.jeong/Workspace/gpdb-migration/megafactory-sql

# Check all crates compile
cargo check --workspace

# Run tests
cargo test --workspace

# Lint (all warnings as errors)
cargo clippy --workspace -- -D warnings

# Format
cargo fmt --all

# Format check (CI)
cargo fmt --all --check

# Full dev server (requires cargo-leptos)
cargo install cargo-leptos
cargo leptos watch

# Docker build
docker build -f docker/Dockerfile -t megafactory-sql .
```

---

## GitHub Repository

- **URL:** https://github.com/younjin-jeong/MegaFactory-SQL
- **Active account:** `younjin-jeong`
- **Main branch:** `main`
- **Branch naming:** `issue-<N>-<short-slug>`

### GitHub Workflow Rules (NEVER SKIP)

1. Before starting any work: check for existing issues with your agent label
2. If no issue exists for the work, create one before writing code
3. Always create a branch named `issue-<N>-<slug>` before editing files
4. Reference the issue number in every commit message: `Relates to #<N>`
5. Run `cargo check`, `cargo test`, `cargo clippy`, `cargo fmt --check` before opening a PR
6. Open PR into `main`
7. Add agent label to every issue and PR
8. Close issues after PR merges with a comment

### GitHub Labels

**Agent labels:**
- `agent: Product Designer` — UI/UX design work
- `agent: Web Developer` — Frontend/backend web implementation

**Phase labels:**
- `phase: 1-foundation` — Initial project setup and base UI
- `phase: 2-megadb-integration` — Live MegaDB API integration
- `phase: 3-algorithm-workbench` — Intelligent Query Advisor and Algorithm Workbench
- `phase: 4-production` — Production hardening, performance, security

**Type labels:**
- `type: ui`, `type: server`, `type: design`, `type: integration`, `type: performance`

**Crate labels:**
- `crate: megafactory-sql-types`, `crate: megafactory-sql-app`, `crate: megafactory-sql-server`

**Other:**
- `epic` — Large multi-issue feature

---

## Available Claude Agents

### `product-designer`
**When to use:** UI/UX wireframes, user flow design, component layout, accessibility audits, information architecture, design system decisions. Invoke whenever deciding how the UI should look, feel, or flow.

### `web-developer`
**When to use:** Implementing Leptos components, WASM client code, Axum server endpoints, CSS styling, JavaScript interop (CodeMirror, WebSocket), API proxy routes. Invoke for all frontend/backend web development.

---

## Relationship to MegaDB

MegaFactory SQL is **tightly coupled** to MegaDB conceptually but **loosely coupled** technically:

- Communicates only via MegaDB's public HTTP API (`http://megadb:8080`)
- Must understand MegaDB's 3 storage tiers (MEMORY/OLTP/OLAP)
- Must represent MPP distributed execution (EXPLAIN DISTRIBUTED)
- Must support hardware acceleration recommendations (GPU/NPU/TPU/FPGA/CPU)
- Must expose cost analytics SQL functions (`cost_by()`, `amortize_cost()`, etc.)
- Must show K8s-native features (pod scaling, PVC management, KEDA)

MegaDB's repository: https://github.com/younjin-jeong/MegaDB

---

## Development Phases

| Phase | Status | Description |
|-------|--------|-------------|
| 1 Foundation | Done | Project structure, SQL editor, schema browser, K8s dashboard, monitoring, settings |
| 2 MegaDB Integration | Next | Live API proxy to MegaDB, real schema browsing, query execution against MegaDB |
| 3 Algorithm Workbench | Planned | Intelligent Query Advisor (Issue #1), auto-EXPLAIN, hardware recommendations |
| 4 Production | Planned | Auth, RBAC, performance optimization, accessibility audit, deployment |

## Active GitHub Issues

- **#1** — epic: Intelligent Query Advisor (Algorithm Workbench, hardware mapping, cost vs performance analysis)
