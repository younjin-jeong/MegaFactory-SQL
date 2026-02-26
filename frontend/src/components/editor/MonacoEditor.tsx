"use client";

import { useRef, useCallback } from "react";
import Editor, { OnMount, OnChange } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { useSettingsStore } from "@/stores/settings-store";

interface MonacoEditorProps {
  value: string;
  onChange: (value: string) => void;
  onExecute: () => void;
}

export function MonacoEditor({ value, onChange, onExecute }: MonacoEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const fontSize = useSettingsStore((s) => s.fontSize);

  const handleMount: OnMount = useCallback(
    (editor, monaco) => {
      editorRef.current = editor;

      // Define Tokyonight theme
      monaco.editor.defineTheme("tokyonight", {
        base: "vs-dark",
        inherit: true,
        rules: [
          { token: "keyword", foreground: "bb9af7" },
          { token: "string", foreground: "9ece6a" },
          { token: "number", foreground: "ff9e64" },
          { token: "comment", foreground: "565f89", fontStyle: "italic" },
          { token: "type", foreground: "2ac3de" },
          { token: "identifier", foreground: "c0caf5" },
          { token: "operator", foreground: "89ddff" },
        ],
        colors: {
          "editor.background": "#1a1b26",
          "editor.foreground": "#c0caf5",
          "editor.lineHighlightBackground": "#24283b",
          "editor.selectionBackground": "#3b3f5c",
          "editorCursor.foreground": "#7aa2f7",
          "editorLineNumber.foreground": "#565f89",
          "editorLineNumber.activeForeground": "#a9b1d6",
          "editor.inactiveSelectionBackground": "#2f3347",
          "editorWidget.background": "#24283b",
          "editorWidget.border": "#3b3f5c",
          "input.background": "#1a1b26",
          "input.border": "#3b3f5c",
          "input.foreground": "#c0caf5",
          "list.activeSelectionBackground": "#3b3f5c",
          "list.hoverBackground": "#2f3347",
        },
      });
      monaco.editor.setTheme("tokyonight");

      // Register Ctrl+Enter / Cmd+Enter to execute query
      editor.addAction({
        id: "execute-query",
        label: "Execute Query",
        keybindings: [
          monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
        ],
        run: () => {
          onExecute();
        },
      });

      // Focus the editor
      editor.focus();
    },
    [onExecute]
  );

  const handleChange: OnChange = useCallback(
    (val) => {
      onChange(val ?? "");
    },
    [onChange]
  );

  return (
    <Editor
      height="100%"
      defaultLanguage="sql"
      value={value}
      onChange={handleChange}
      onMount={handleMount}
      theme="tokyonight"
      options={{
        fontSize,
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
        minimap: { enabled: false },
        lineNumbers: "on",
        tabSize: 2,
        automaticLayout: true,
        scrollBeyondLastLine: false,
        wordWrap: "on",
        padding: { top: 8 },
        renderLineHighlight: "line",
        suggestOnTriggerCharacters: true,
        quickSuggestions: true,
      }}
      loading={
        <div className="flex items-center justify-center h-full"
          style={{ color: "var(--color-text-muted)" }}>
          Loading editor...
        </div>
      }
    />
  );
}
