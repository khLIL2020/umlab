import { useState } from "react";
import {
  Undo2,
  Redo2,
  Download,
  ChevronDown,
  Check,
  Eye,
  PenTool,
  Box,
} from "lucide-react";
interface Props {
  name: string;
  readOnly: boolean;
  setReadOnly: (v: boolean) => void;
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  importFile: () => void;
  exportFile: (format: "json" | "png" | "svg") => void;
  storageError: string;
  newProject: () => void;
  loadSample: () => void;
}
export default function Toolbar(p: Props) {
  const [menu, setMenu] = useState(false);
  return (
    <header className="toolbar">
      <div className="brand">
        <div className="brand-mark">
          <Box size={22} />
        </div>
        <span>
          UM<span className="brand-light">Lab</span>
        </span>
      </div>
      <div className="project-title">
        <strong>{p.name || "Untitled project"}</strong>
        <span title={p.storageError || "Saved in this browser"}>
          {p.storageError ? (
            <span className="text-amber-700">Autosave unavailable</span>
          ) : (
            <>
              <Check size={12} /> Saved
            </>
          )}
        </span>
      </div>
      <div className="mode-switch" aria-label="Editor mode">
        <button
          className={!p.readOnly ? "active" : ""}
          aria-pressed={!p.readOnly}
          onClick={() => p.setReadOnly(false)}
        >
          <PenTool size={14} /> Builder
        </button>
        <button
          className={p.readOnly ? "active" : ""}
          aria-pressed={p.readOnly}
          onClick={() => p.setReadOnly(true)}
        >
          <Eye size={14} /> Reviewer
        </button>
      </div>
      <div className="toolbar-actions">
        {!p.readOnly && (
          <>
            <button
              className="icon-button"
              aria-label="Undo"
              title="Undo (⌘/Ctrl Z)"
              disabled={!p.canUndo}
              onClick={p.undo}
            >
              <Undo2 size={17} />
            </button>
            <button
              className="icon-button"
              aria-label="Redo"
              title="Redo (⌘/Ctrl Shift Z)"
              disabled={!p.canRedo}
              onClick={p.redo}
            >
              <Redo2 size={17} />
            </button>
          </>
        )}
        <div className="export-menu">
          <button
            className="button secondary"
            aria-expanded={menu}
            onClick={() => setMenu(!menu)}
          >
            File <ChevronDown size={13} />
          </button>
          {menu && (
            <>
              <button
                className="menu-backdrop"
                aria-label="Close file menu"
                onClick={() => setMenu(false)}
              />
              <div className="dropdown">
                {!p.readOnly && (
                  <button
                    onClick={() => {
                      p.importFile();
                      setMenu(false);
                    }}
                  >
                    Import JSON
                  </button>
                )}
                {(["json", "png", "svg"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => {
                      p.exportFile(f);
                      setMenu(false);
                    }}
                  >
                    {f === "json" ? (
                      <>
                        <Download size={14} /> Export JSON
                      </>
                    ) : (
                      `Export ${f.toUpperCase()}`
                    )}
                  </button>
                ))}
                {!p.readOnly && (
                  <>
                    <hr />
                    <button
                      onClick={() => {
                        p.newProject();
                        setMenu(false);
                      }}
                    >
                      New empty project
                    </button>
                    <button
                      onClick={() => {
                        p.loadSample();
                        setMenu(false);
                      }}
                    >
                      Load library sample
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
