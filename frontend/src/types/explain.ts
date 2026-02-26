export interface PlanNode {
  operator: string;
  relation?: string;
  cost_startup: number;
  cost_total: number;
  estimated_rows: number;
  actual_rows?: number;
  actual_time_ms?: number;
  width: number;
  children: PlanNode[];
  extra: [string, string][];
}

export function parseExplainText(explainText: string): PlanNode | null {
  const lines = explainText.split("\n");
  if (lines.length === 0) return null;
  const result = parseLines(lines, 0);
  return result ? result[0] : null;
}

function parseLines(lines: string[], start: number): [PlanNode, number] | null {
  if (start >= lines.length) return null;
  const line = lines[start];
  const indent = line.length - line.trimStart().length;
  const trimmed = line.trim().replace(/^-> /, "");

  const { operator, relation, costStartup, costTotal, rows, width } =
    parseOperatorLine(trimmed);

  const children: PlanNode[] = [];
  let idx = start + 1;
  while (idx < lines.length) {
    const nextIndent = lines[idx].length - lines[idx].trimStart().length;
    if (nextIndent <= indent) break;
    const child = parseLines(lines, idx);
    if (child) {
      children.push(child[0]);
      idx = child[1];
    } else {
      idx++;
    }
  }

  return [
    {
      operator,
      relation,
      cost_startup: costStartup,
      cost_total: costTotal,
      estimated_rows: rows,
      width,
      children,
      extra: [],
    },
    idx,
  ];
}

function parseOperatorLine(line: string): {
  operator: string;
  relation?: string;
  costStartup: number;
  costTotal: number;
  rows: number;
  width: number;
} {
  let operator = line;
  let relation: string | undefined;
  let costStartup = 0;
  let costTotal = 0;
  let rows = 0;
  let width = 0;

  const parenIdx = line.indexOf("(cost=");
  if (parenIdx !== -1) {
    const beforeParen = line.slice(0, parenIdx).trim();
    const onIdx = beforeParen.indexOf(" on ");
    if (onIdx !== -1) {
      operator = beforeParen.slice(0, onIdx);
      relation = beforeParen.slice(onIdx + 4).trim();
    } else {
      operator = beforeParen;
    }

    const costPart = line.slice(parenIdx);
    const costMatch = costPart.match(/\(cost=([\d.]+)\.\.([\d.]+)/);
    if (costMatch) {
      costStartup = parseFloat(costMatch[1]) || 0;
      costTotal = parseFloat(costMatch[2]) || 0;
    }
    const rowsMatch = costPart.match(/rows=(\d+)/);
    if (rowsMatch) rows = parseInt(rowsMatch[1], 10) || 0;
    const widthMatch = costPart.match(/width=(\d+)/);
    if (widthMatch) width = parseInt(widthMatch[1], 10) || 0;
  }

  return { operator, relation, costStartup, costTotal, rows, width };
}

export function parseExplainJson(json: unknown): PlanNode | null {
  if (!Array.isArray(json) || json.length === 0) return null;
  const plan = json[0]?.Plan;
  if (!plan) return null;
  return fromJsonPlan(plan);
}

function fromJsonPlan(plan: Record<string, unknown>): PlanNode | null {
  const operator = plan["Node Type"] as string | undefined;
  if (!operator) return null;

  const children: PlanNode[] = [];
  const plans = plan["Plans"] as unknown[] | undefined;
  if (Array.isArray(plans)) {
    for (const child of plans) {
      const node = fromJsonPlan(child as Record<string, unknown>);
      if (node) children.push(node);
    }
  }

  return {
    operator,
    relation: plan["Relation Name"] as string | undefined,
    cost_startup: (plan["Startup Cost"] as number) ?? 0,
    cost_total: (plan["Total Cost"] as number) ?? 0,
    estimated_rows: (plan["Plan Rows"] as number) ?? 0,
    actual_rows: plan["Actual Rows"] as number | undefined,
    actual_time_ms: plan["Actual Total Time"] as number | undefined,
    width: ((plan["Plan Width"] as number) ?? 0),
    children,
    extra: [],
  };
}
