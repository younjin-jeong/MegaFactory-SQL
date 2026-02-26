"use client";

import { useMemo, useRef } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useState } from "react";
import type { QueryResult } from "@/types/query";
import { resultToCSV, resultToJSON, downloadFile } from "@/lib/duckdb/arrow-utils";

interface ResultTableProps {
  result: QueryResult | null;
}

export function ResultTable({ result }: ResultTableProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = useMemo<ColumnDef<unknown[], unknown>[]>(() => {
    if (!result || result.columns.length === 0) return [];
    return result.columns.map((col, index) => ({
      id: col.name,
      header: () => (
        <div>
          <div className="font-bold">{col.name}</div>
          <div className="text-[10px] opacity-50">{col.data_type}</div>
        </div>
      ),
      accessorFn: (row: unknown[]) => row[index],
      cell: (info) => {
        const val = info.getValue();
        if (val === null || val === undefined) {
          return <span style={{ color: "var(--color-text-muted)" }}>NULL</span>;
        }
        return String(val);
      },
    }));
  }, [result]);

  const data = useMemo(() => result?.rows ?? [], [result]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const { rows } = table.getRowModel();

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 32,
    overscan: 20,
  });

  if (!result) {
    return (
      <div className="flex items-center justify-center h-full text-sm"
        style={{ color: "var(--color-text-muted)" }}>
        Run a query to see results
      </div>
    );
  }

  if (result.error) {
    return (
      <div className="p-4">
        <div className="text-sm font-bold mb-2" style={{ color: "var(--color-error)" }}>
          Error
        </div>
        <pre className="text-xs p-3 rounded overflow-auto" style={{
          backgroundColor: "var(--color-bg-tertiary)",
          color: "var(--color-error)",
        }}>
          {result.error}
        </pre>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header bar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b text-xs"
        style={{
          borderColor: "var(--color-border)",
          color: "var(--color-text-muted)",
        }}>
        <span>
          {result.row_count.toLocaleString()} rows in {result.execution_time_ms}ms
        </span>
        <div className="flex gap-2">
          <button
            className="px-2 py-0.5 rounded hover:opacity-80"
            style={{
              backgroundColor: "var(--color-bg-tertiary)",
              color: "var(--color-text-secondary)",
            }}
            onClick={() => {
              downloadFile(resultToCSV(result), "result.csv", "text/csv");
            }}
          >
            CSV
          </button>
          <button
            className="px-2 py-0.5 rounded hover:opacity-80"
            style={{
              backgroundColor: "var(--color-bg-tertiary)",
              color: "var(--color-text-secondary)",
            }}
            onClick={() => {
              downloadFile(resultToJSON(result), "result.json", "application/json");
            }}
          >
            JSON
          </button>
        </div>
      </div>

      {/* Virtualized table */}
      <div ref={parentRef} className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-xs" style={{ fontFamily: "var(--font-mono)" }}>
          <thead className="sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-3 py-2 text-left cursor-pointer select-none border-b"
                    style={{
                      backgroundColor: "var(--color-bg-tertiary)",
                      borderColor: "var(--color-border)",
                      color: "var(--color-text-primary)",
                    }}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getIsSorted() === "asc" && " ^"}
                    {header.column.getIsSorted() === "desc" && " v"}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {rowVirtualizer.getVirtualItems().length > 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  style={{ height: `${rowVirtualizer.getVirtualItems()[0]?.start ?? 0}px`, padding: 0 }}
                />
              </tr>
            )}
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const row = rows[virtualRow.index];
              return (
                <tr
                  key={row.id}
                  className="border-b"
                  style={{
                    height: `${virtualRow.size}px`,
                    borderColor: "var(--color-border)",
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-3 py-1 truncate max-w-xs"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              );
            })}
            {rowVirtualizer.getVirtualItems().length > 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  style={{
                    height: `${
                      rowVirtualizer.getTotalSize() -
                      (rowVirtualizer.getVirtualItems().at(-1)?.end ?? 0)
                    }px`,
                    padding: 0,
                  }}
                />
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
