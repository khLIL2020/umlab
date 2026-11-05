import {
  Box,
  ArrowRight,
  Plus,
  GitBranch,
  Layers,
  MousePointer2,
  BookOpen,
  ChevronRight,
} from "lucide-react";
import type { Project, RelationshipKind } from "../validation/types";
interface Props {
  project: Project;
  diagramId: string;
  selected: string | null;
  setDiagram: (id: string) => void;
  select: (id: string) => void;
  addClass: () => void;
  addSequence: () => void;
  addRelationship: (kind: RelationshipKind) => void;
  addMessage: () => void;
  addFragment: (kind: "alt" | "opt") => void;
  restoreLifelines: () => void;
}
export default function Palette(p: Props) {
  const isClass = p.diagramId === "class";
  return (
    <aside className="palette">
      <div className="palette-top">
        <span className="eyebrow">WORKSPACE</span>
        <h2>Library of ideas.</h2>
        <p>A better model, one connection at a time.</p>
      </div>
      <div className="palette-section">
        <div className="section-title">
          DIAGRAMS{" "}
          <button aria-label="Add sequence diagram" onClick={p.addSequence}>
            <Plus size={15} />
          </button>
        </div>
        <button
          className={`diagram-button ${isClass ? "active" : ""}`}
          onClick={() => p.setDiagram("class")}
        >
          <Layers size={16} />
          <span>Class diagram</span>
          <span className="count">{p.project.classes.length}</span>
        </button>
        {p.project.sequences.map((s) => (
          <button
            key={s.id}
            className={`diagram-button ${p.diagramId === s.id ? "active" : ""}`}
            onClick={() => p.setDiagram(s.id)}
          >
            <GitBranch size={16} />
            <span>{s.name}</span>
            <ChevronRight size={13} />
          </button>
        ))}
      </div>
      <div className="palette-section">
        <div className="section-title">
          {isClass ? "BUILD YOUR MODEL" : "BUILD AN INTERACTION"}
        </div>
        {isClass ? (
          <>
            <button className="add-class" onClick={p.addClass}>
              <Box size={22} />
              <span>
                <strong>Class</strong>
                <small>An object in your system</small>
              </span>
              <Plus size={17} />
            </button>
            <div className="section-title mt-6">RELATIONSHIPS</div>
            <div className="relationship-list">
              {(
                [
                  "association",
                  "aggregation",
                  "composition",
                  "inheritance",
                  "dependency",
                  "realization",
                ] as const
              ).map((kind, i) => (
                <button
                  key={kind}
                  disabled={p.project.classes.length < 2}
                  onClick={() => p.addRelationship(kind)}
                >
                  <span className="relation-symbol">
                    {["—", "◇—", "◆—", "—▷", "⇢", "┄▷"][i]}
                  </span>
                  <span>{kind}</span>
                  <Plus size={13} />
                </button>
              ))}
            </div>
            <p className="helper">
              Add a relationship, then choose its endpoints in Properties. Or
              connect the handles on two classes.
            </p>
          </>
        ) : (
          <>
            <button
              className="add-class"
              disabled={
                !p.project.sequences.find((s) => s.id === p.diagramId)
                  ?.lifelines.length
              }
              onClick={p.addMessage}
            >
              <ArrowRight size={22} />
              <span>
                <strong>Message</strong>
                <small>A call between lifelines</small>
              </span>
              <Plus size={17} />
            </button>
            <div className="relationship-list mt-4">
              <button onClick={() => p.addFragment("alt")}>
                <span className="fragment-symbol">alt</span>Alternative
                <Plus size={13} />
              </button>
              <button onClick={() => p.addFragment("opt")}>
                <span className="fragment-symbol">opt</span>Optional
                <Plus size={13} />
              </button>
              <button onClick={p.restoreLifelines}>
                <Plus size={15} />
                Sync class lifelines
              </button>
            </div>
            <p className="helper">
              Drag lifelines horizontally and messages vertically. Select a
              message to choose a method or type a call.
            </p>
          </>
        )}
      </div>
      <div className="palette-section model-list">
        <div className="section-title">
          CLASSES <span>{p.project.classes.length}</span>
        </div>
        {p.project.classes.map((c) => (
          <button
            key={c.id}
            onClick={() => {
              p.setDiagram("class");
              p.select(c.id);
            }}
            className={p.selected === c.id ? "chosen" : ""}
          >
            <Box size={14} />
            {c.name || "Unnamed class"}
          </button>
        ))}
      </div>
      <div className="palette-footer">
        <BookOpen size={17} />
        <div>
          <strong>Made for CS 2340</strong>
          <small>Objects & Design · Georgia Tech</small>
        </div>
      </div>
      <div className="shortcut-hint">
        <MousePointer2 size={12} /> Select an element to edit it
      </div>
    </aside>
  );
}
