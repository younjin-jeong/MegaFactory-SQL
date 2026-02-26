// CodeMirror 6 bridge for MegaFactory-SQL WASM interop.
// Loaded as ES module; imports resolved via importmap in HTML shell.
import { EditorView, basicSetup } from "codemirror";
import { EditorState } from "@codemirror/state";
import { sql, PostgreSQL } from "@codemirror/lang-sql";
import { oneDark } from "@codemirror/theme-one-dark";
import { keymap } from "@codemirror/view";

const editors = new Map();

/**
 * Create a CodeMirror 6 editor in the given container.
 * @param {string} containerId - DOM element ID
 * @param {string} initialContent - Initial SQL text
 * @param {Function} onExecute - Called with SQL string on Ctrl+Enter
 * @param {Function} onChange - Called with SQL string on every change
 */
function createEditor(containerId, initialContent, onExecute, onChange) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Remove existing editor if any
    destroyEditor(containerId);

    const executeKeymap = keymap.of([
        {
            key: "Ctrl-Enter",
            mac: "Cmd-Enter",
            run: (view) => {
                onExecute(view.state.doc.toString());
                return true;
            },
        },
    ]);

    const state = EditorState.create({
        doc: initialContent || "",
        extensions: [
            basicSetup,
            sql({ dialect: PostgreSQL }),
            oneDark,
            executeKeymap,
            EditorView.updateListener.of((update) => {
                if (update.docChanged) {
                    onChange(update.state.doc.toString());
                }
            }),
            EditorView.theme({
                "&": {
                    height: "100%",
                    fontSize: "14px",
                },
                ".cm-scroller": {
                    overflow: "auto",
                },
                ".cm-content": {
                    fontFamily:
                        "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
                },
            }),
        ],
    });

    const view = new EditorView({ state, parent: container });
    editors.set(containerId, view);
}

function getContent(containerId) {
    const view = editors.get(containerId);
    return view ? view.state.doc.toString() : "";
}

function setContent(containerId, content) {
    const view = editors.get(containerId);
    if (view) {
        view.dispatch({
            changes: {
                from: 0,
                to: view.state.doc.length,
                insert: content,
            },
        });
    }
}

function destroyEditor(containerId) {
    const view = editors.get(containerId);
    if (view) {
        view.destroy();
        editors.delete(containerId);
    }
}

// Expose on window for WASM access via js_sys
window.__cm = { createEditor, getContent, setContent, destroyEditor };
