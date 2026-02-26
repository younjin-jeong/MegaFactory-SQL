use serde::{Deserialize, Serialize};

/// A node in an EXPLAIN query plan tree.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlanNode {
    pub operator: String,
    pub relation: Option<String>,
    pub cost_startup: f64,
    pub cost_total: f64,
    pub estimated_rows: u64,
    pub actual_rows: Option<u64>,
    pub actual_time_ms: Option<f64>,
    pub width: u32,
    pub children: Vec<PlanNode>,
    pub extra: Vec<(String, String)>,
}

impl PlanNode {
    /// Parse EXPLAIN text format into a plan tree.
    ///
    /// Recognizes PostgreSQL/DataFusion EXPLAIN output like:
    /// ```text
    ///   Seq Scan on cur_data  (cost=0.00..1234.00 rows=50000 width=120)
    ///     -> Filter: (region = 'us-east-1')
    /// ```
    pub fn parse_text(explain_text: &str) -> Option<Self> {
        let lines: Vec<&str> = explain_text.lines().collect();
        if lines.is_empty() {
            return None;
        }
        Self::parse_lines(&lines, 0).map(|(node, _)| node)
    }

    fn parse_lines(lines: &[&str], start: usize) -> Option<(Self, usize)> {
        if start >= lines.len() {
            return None;
        }
        let line = lines[start];
        let indent = line.len() - line.trim_start().len();
        let trimmed = line.trim().trim_start_matches("-> ");

        // Parse operator name and optional cost/rows/width
        let (operator, relation, cost_startup, cost_total, rows, width) =
            Self::parse_operator_line(trimmed);

        let mut children = Vec::new();
        let mut idx = start + 1;
        while idx < lines.len() {
            let next_indent = lines[idx].len() - lines[idx].trim_start().len();
            if next_indent <= indent {
                break;
            }
            if let Some((child, consumed)) = Self::parse_lines(lines, idx) {
                children.push(child);
                idx = consumed;
            } else {
                idx += 1;
            }
        }

        Some((
            PlanNode {
                operator,
                relation,
                cost_startup,
                cost_total,
                estimated_rows: rows,
                actual_rows: None,
                actual_time_ms: None,
                width,
                children,
                extra: Vec::new(),
            },
            idx,
        ))
    }

    fn parse_operator_line(line: &str) -> (String, Option<String>, f64, f64, u64, u32) {
        // Try to match: "Operator Name on table_name (cost=X..Y rows=N width=W)"
        let mut operator = line.to_string();
        let mut relation = None;
        let mut cost_startup = 0.0;
        let mut cost_total = 0.0;
        let mut rows = 0u64;
        let mut width = 0u32;

        if let Some(paren_start) = line.find("(cost=") {
            let before_paren = line[..paren_start].trim();
            if let Some(on_idx) = before_paren.find(" on ") {
                operator = before_paren[..on_idx].to_string();
                relation = Some(before_paren[on_idx + 4..].trim().to_string());
            } else {
                operator = before_paren.to_string();
            }

            let cost_part = &line[paren_start..];
            // Parse cost=X..Y
            if let Some(cost_str) = cost_part.strip_prefix("(cost=") {
                let parts: Vec<&str> = cost_str.split_whitespace().collect();
                if let Some(cost_range) = parts.first() {
                    let cost_range = cost_range.trim_end_matches(')');
                    let nums: Vec<&str> = cost_range.split("..").collect();
                    if nums.len() == 2 {
                        cost_startup = nums[0].parse().unwrap_or(0.0);
                        cost_total = nums[1].parse().unwrap_or(0.0);
                    }
                }
                // Parse rows=N
                for part in &parts {
                    if let Some(r) = part.strip_prefix("rows=") {
                        rows = r.trim_end_matches(')').parse().unwrap_or(0);
                    }
                    if let Some(w) = part.strip_prefix("width=") {
                        width = w.trim_end_matches(')').parse().unwrap_or(0);
                    }
                }
            }
        }

        (operator, relation, cost_startup, cost_total, rows, width)
    }

    /// Parse EXPLAIN (FORMAT JSON) output.
    pub fn parse_json(json: &serde_json::Value) -> Option<Self> {
        let plan = json.as_array()?.first()?.get("Plan")?;
        Self::from_json_plan(plan)
    }

    fn from_json_plan(plan: &serde_json::Value) -> Option<Self> {
        let operator = plan.get("Node Type")?.as_str()?.to_string();
        let relation = plan
            .get("Relation Name")
            .and_then(|v| v.as_str())
            .map(String::from);
        let cost_startup = plan
            .get("Startup Cost")
            .and_then(|v| v.as_f64())
            .unwrap_or(0.0);
        let cost_total = plan
            .get("Total Cost")
            .and_then(|v| v.as_f64())
            .unwrap_or(0.0);
        let rows = plan.get("Plan Rows").and_then(|v| v.as_u64()).unwrap_or(0);
        let actual_rows = plan.get("Actual Rows").and_then(|v| v.as_u64());
        let actual_time = plan.get("Actual Total Time").and_then(|v| v.as_f64());
        let width = plan.get("Plan Width").and_then(|v| v.as_u64()).unwrap_or(0) as u32;

        let children = plan
            .get("Plans")
            .and_then(|v| v.as_array())
            .map(|arr| arr.iter().filter_map(Self::from_json_plan).collect())
            .unwrap_or_default();

        Some(PlanNode {
            operator,
            relation,
            cost_startup,
            cost_total,
            estimated_rows: rows,
            actual_rows,
            actual_time_ms: actual_time,
            width,
            children,
            extra: Vec::new(),
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parse_simple_explain_text() {
        let text = "Seq Scan on cur_data  (cost=0.00..1234.56 rows=50000 width=120)";
        let node = PlanNode::parse_text(text).unwrap();
        assert_eq!(node.operator, "Seq Scan");
        assert_eq!(node.relation.as_deref(), Some("cur_data"));
        assert!((node.cost_total - 1234.56).abs() < 0.01);
        assert_eq!(node.estimated_rows, 50000);
        assert_eq!(node.width, 120);
    }
}
