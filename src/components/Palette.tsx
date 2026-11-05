import { useState } from "react";
import {
  Box,
  ArrowRight,
  Plus,
  ChevronDown,
  LayoutGrid,
  Link2,
  Layers,
  GitBranch,
} from "lucide-react";
import type { Project, RelationshipKind } from "../validation/types";

const RELATIONSHIPS: { kind: RelationshipKind; label: string; symbol: string }[] =
  [
    { kind: "association", label: "Association", symbol: "—" },
    { kind: "aggregation", label: "Aggregation", symbol: "◇—" },
    { kind: "composition", label: "Composition", symbol: "◆—" },
    { kind: "inheritance", label: "Inheritance", symbol: "—▷" },
    { kind: "dependency", label: "Dependency", symbol: "⇢" },
    { kind: "realization", label: "Realization", symbol: "┄▷" },
  ];

interface Props {
  project: Project;
  diagramId: string;
  addClass: () => void;
  addSequence: () => void;
  addRelationship: (kind: RelationshipKind) => void;
  addMessage: () => void;
  addFragment: (kind: "alt" | "opt") => void;
  restoreLifelines: () => void;
  arrange: () => void;
}
export default function Palette(p: Props) {
  const isClass = p.diagramId === "class";
  const [relMenu, setRelMenu] = useState(false);
  const canRelate = p.project.classes.length >= 2;
  const sequence = p.project.sequences.find((s) => s.id === p.diagramId);
  const canMessage = !!sequence?.lifelines.length;

  return (
    <aside className="palette" aria-label="Add to diagram">
      <div className="palette-intro">
        <strong>Add</strong>
        <span>
          {isClass
            ? "Build the class diagram"
            : "Build this sequence diagram"}
        </span>
      </div>

      {isClass ? (
        <div className="palette-actions">
          <button className="button primary add-main" onClick={p.addClass}>
            <Box size={16} /> Add class
          </button>
          <div className="export-menu palette-menu">
            <button
              className="button secondary add-main"
              disabled={!canRelate}
              aria-expanded={relMenu}
              aria-haspopup="menu"
              onClick={() => setRelMenu(!relMenu)}
              title={
                canRelate
                  ? "Add a relationship"
                  : "Add at least two classes first"
              }
            >
              <Link2 size={16} /> Add relationship{" "}
              <ChevronDown size={14} />
            </button>
            {relMenu && (
              <>
                <button
                  className="menu-backdrop"
                  aria-label="Close relationship menu"
                  onClick={() => setRelMenu(false)}
                />
                <div className="dropdown tool-dropdown" role="menu">
                  {RELATIONSHIPS.map((r) => (
                    <button
                      key={r.kind}
                      role="menuitem"
                      onClick={() => {
                        p.addRelationship(r.kind);
                        setRelMenu(false);
                      }}
                    >
                      <span className="relation-symbol">{r.symbol}</span>
                      {r.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <button className="button secondary add-main" onClick={p.addSequence}>
            <GitBranch size={16} /> Add sequence diagram
          </button>
        </div>
      ) : (
        <div className="palette-actions">
          <button
            className="button primary add-main"
            disabled={!canMessage}
            onClick={p.addMessage}
            title={
              canMessage
                ? "Add a message"
                : "Add classes first so lifelines exist"
            }
          >
            <ArrowRight size={16} /> Add message
          </button>
          <button
            className="button secondary add-main"
            onClick={() => p.addFragment("alt")}
          >
            <Plus size={16} /> Add alt fragment
          </button>
          <button
            className="button secondary add-main"
            onClick={() => p.addFragment("opt")}
          >
            <Plus size={16} /> Add opt fragment
          </button>
          <button className="button quiet add-main" onClick={p.restoreLifelines}>
            Sync class lifelines
          </button>
        </div>
      )}

      <p className="palette-hint">
        {isClass
          ? "Click a class to edit it. To connect: Add relationship, then click two classes."
          : "Click a message or lifeline on the canvas to edit it."}
      </p>

      <div className="palette-footer-actions">
        <button className="button quiet" onClick={p.arrange}>
          <LayoutGrid size={15} /> Arrange
        </button>
        {isClass && (
          <span className="palette-meta">
            <Layers size={13} /> {p.project.classes.length} classes
          </span>
        )}
      </div>
    </aside>
  );
}
