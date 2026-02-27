"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useMegaDBQuery } from "@/lib/api/megadb";

interface ConnectionTestButtonProps {
  connectionName: string;
  onResult: (success: boolean, message: string) => void;
}

type TestState = "idle" | "testing" | "success" | "failure";

export function ConnectionTestButton({
  connectionName,
  onResult,
}: ConnectionTestButtonProps) {
  const [state, setState] = useState<TestState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const megadbQuery = useMegaDBQuery();

  const resetToIdle = useCallback(() => {
    setState("idle");
    setErrorMsg("");
  }, []);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (resetTimer.current) {
        clearTimeout(resetTimer.current);
      }
    };
  }, []);

  const handleTest = async () => {
    if (state === "testing") return;

    setState("testing");
    setErrorMsg("");

    // Clear any previous reset timer
    if (resetTimer.current) {
      clearTimeout(resetTimer.current);
    }

    try {
      const result = await megadbQuery.mutateAsync({
        sql: `SELECT megadb_test_connection('${connectionName.replace(/'/g, "''")}')`,
        database: "megadb",
      });

      if (result.error) {
        setState("failure");
        setErrorMsg(result.error);
        onResult(false, result.error);
      } else {
        setState("success");
        onResult(true, "Connection successful");
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Connection test failed";
      setState("failure");
      setErrorMsg(message);
      onResult(false, message);
    }

    // Reset after 3 seconds
    resetTimer.current = setTimeout(resetToIdle, 3000);
  };

  const label = (() => {
    switch (state) {
      case "testing":
        return "Testing...";
      case "success":
        return "Connected";
      case "failure":
        return errorMsg ? `Failed` : "Failed";
      default:
        return "Test Connection";
    }
  })();

  const indicatorColor = (() => {
    switch (state) {
      case "success":
        return "var(--color-success)";
      case "failure":
        return "var(--color-error)";
      default:
        return "var(--color-text-secondary)";
    }
  })();

  return (
    <button
      onClick={handleTest}
      disabled={state === "testing"}
      className="text-xs py-1.5 px-3 rounded border transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
      style={{
        borderColor:
          state === "success"
            ? "var(--color-success)"
            : state === "failure"
              ? "var(--color-error)"
              : "var(--color-border)",
        color: indicatorColor,
        backgroundColor: "var(--color-bg-tertiary)",
      }}
      onMouseEnter={(e) => {
        if (state === "idle") {
          e.currentTarget.style.backgroundColor = "var(--color-bg-hover)";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "var(--color-bg-tertiary)";
      }}
      title={state === "failure" ? errorMsg : undefined}
    >
      {state === "success" && (
        <span style={{ color: "var(--color-success)" }}>&#10003; </span>
      )}
      {state === "failure" && (
        <span style={{ color: "var(--color-error)" }}>&#10007; </span>
      )}
      {label}
    </button>
  );
}
