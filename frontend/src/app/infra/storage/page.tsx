"use client";

import { useMemo } from "react";
import { useMegaDBTables } from "@/lib/api/megadb";
import { useStorageStore } from "@/stores/storage-store";
import type { StorageTier } from "@/types/storage-tier";
import TierCard from "@/components/storage/TierCard";
import TablespaceList from "@/components/storage/TablespaceList";
import TableEngineTable from "@/components/storage/TableEngineTable";

const ALL_TIERS: StorageTier[] = ["MEMORY", "OLTP", "OLAP"];

export default function StoragePage() {
  const { data: tables, isLoading, isError } = useMegaDBTables();
  const { tablespaces, selectedTier, setSelectedTier } = useStorageStore();

  // Compute tier summaries from the table list
  const tierSummaries = useMemo(() => {
    const tableList = tables ?? [];
    return ALL_TIERS.map((tier) => {
      const tierTables = tableList.filter(
        (t) => t.engine.toUpperCase() === tier
      );
      const totalSize = tierTables.reduce(
        (sum, t) => sum + (t.size_bytes ?? 0),
        0
      );
      return {
        tier,
        tableCount: tierTables.length,
        totalSizeBytes: totalSize,
      };
    });
  }, [tables]);

  const handleTierClick = (tier: StorageTier) => {
    setSelectedTier(selectedTier === tier ? null : tier);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div>
        <h1
          className="text-xl font-bold"
          style={{ color: "var(--color-text-primary)" }}
        >
          Storage &amp; Tablespace Management
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
          View storage tiers, tablespaces, and table engine assignments across
          MEMORY, OLTP, and OLAP backends.
        </p>
      </div>

      {/* Tier cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tierSummaries.map((s) => (
          <TierCard
            key={s.tier}
            tier={s.tier}
            tableCount={s.tableCount}
            totalSizeBytes={s.totalSizeBytes}
            isSelected={selectedTier === s.tier}
            onClick={() => handleTierClick(s.tier)}
          />
        ))}
      </div>

      {/* Filter indicator */}
      {selectedTier && (
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            Filtering by:
          </span>
          <span
            className="text-xs px-2 py-0.5 rounded font-medium"
            style={{
              backgroundColor:
                selectedTier === "MEMORY"
                  ? "var(--color-accent)"
                  : selectedTier === "OLTP"
                    ? "var(--color-success)"
                    : "var(--color-warning)",
              color: "var(--color-bg-primary)",
            }}
          >
            {selectedTier}
          </span>
          <button
            className="text-xs underline cursor-pointer"
            style={{ color: "var(--color-text-muted)" }}
            onClick={() => setSelectedTier(null)}
          >
            Clear filter
          </button>
        </div>
      )}

      {/* Tablespace section */}
      <div>
        <h2
          className="text-sm font-bold mb-3"
          style={{ color: "var(--color-text-primary)" }}
        >
          Tablespaces
        </h2>
        {tablespaces.length > 0 ? (
          <TablespaceList tablespaces={tablespaces} />
        ) : (
          <div
            className="rounded border p-4"
            style={{
              borderColor: "var(--color-border)",
              backgroundColor: "var(--color-bg-secondary)",
            }}
          >
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              Storage tier information will be available when connected to MegaDB.
            </p>
          </div>
        )}
      </div>

      {/* Table list */}
      <div>
        <h2
          className="text-sm font-bold mb-3"
          style={{ color: "var(--color-text-primary)" }}
        >
          Tables
          {tables && tables.length > 0 && (
            <span
              className="ml-2 text-xs font-normal"
              style={{ color: "var(--color-text-muted)" }}
            >
              ({tables.length} total)
            </span>
          )}
        </h2>

        {isLoading && (
          <div
            className="rounded border p-6 text-center"
            style={{
              borderColor: "var(--color-border)",
              backgroundColor: "var(--color-bg-secondary)",
            }}
          >
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              Loading tables...
            </p>
          </div>
        )}

        {isError && (
          <div
            className="rounded border p-6"
            style={{
              borderColor: "var(--color-border)",
              backgroundColor: "var(--color-bg-secondary)",
            }}
          >
            <p
              className="text-sm font-medium mb-1"
              style={{ color: "var(--color-error)" }}
            >
              Unable to connect to MegaDB
            </p>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              Make sure MegaDB is running and the proxy is configured. Check
              Settings &gt; Connection to verify the MegaDB endpoint.
            </p>
          </div>
        )}

        {!isLoading && !isError && (
          <TableEngineTable
            tables={tables ?? []}
            filterTier={selectedTier}
          />
        )}
      </div>
    </div>
  );
}
