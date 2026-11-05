import { useEffect, useMemo, useRef, useState } from "react";
import {
  Layers,
  GitBranch,
  Info,
  X,
  ChevronRight,
  LockKeyhole,
  Plus,
} from "lucide-react";
import type { Connection } from "@xyflow/react";
import Toolbar from "./components/Toolbar";
import Palette from "./components/Palette";
import ClassCanvas from "./components/ClassCanvas";
import SequenceCanvas from "./components/SequenceCanvas";
import Properties from "./components/Properties";
import ValidationPanel from "./components/ValidationPanel";
import ReviewerView from "./components/ReviewerView";
import {
  useDiagramStore,
  uid,
  applyFix,
  duplicateElement,
  removeElement,
  parseProject,
} from "./store/diagramStore";
import { validateProject } from "./validation";
import { availableMethods } from "./validation/rules";
import type { Issue, Project, RelationshipKind } from "./validation/types";
import { download, exportImage, reportText } from "./lib/export";
import { sampleProject } from "./data/sampleProject";
import "./App.css";
export default function App() {
  const store = useDiagramStore(),
    { project, update } = store;
  const [readOnly, setReadOnly] = useState(false);
  const [diagramId, setDiagramId] = useState("class");
  const [selected, setSelected] = useState<string | null>(null);
  const [focusToken, setFocusToken] = useState(0);
  const [toast, setToast] = useState("");
  const [hint, setHint] = useState(() => {
    try {
      return !localStorage.getItem("umlab.onboarded");
    } catch {
      return true;
    }
  });
  const file = useRef<HTMLInputElement>(null);
  const issues = useMemo(() => validateProject(project), [project]);
  const sequence = project.sequences.find((s) => s.id === diagramId);
  const isClass = diagramId === "class";
  const currentDiagram = isClass || sequence ? diagramId : "class";
  const notify = (text: string) => setToast(text);
  useEffect(() => {
    if (toast) {
      const id = setTimeout(() => setToast(""), 4500);
      return () => clearTimeout(id);
    }
  }, [toast]);
  useEffect(() => {
    if (diagramId !== "class" && !sequence) {
      setDiagramId("class");
      setSelected(null);
    }
  }, [diagramId, sequence]);
  const setDiagram = (id: string) => {
    setDiagramId(id);
    setSelected(null);
  };
  const focus = (id: string) => {
    setSelected(id);
    setFocusToken((n) => n + 1);
  };
  const remove = () => {
    if (!readOnly && selected) {
      store.replace(removeElement(project, selected));
      setSelected(null);
    }
  };
  const duplicate = () => {
    if (!readOnly && selected) {
      store.replace(duplicateElement(project, selected));
      notify("Element duplicated.");
    }
  };
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.closest('input,textarea,select,[contenteditable="true"]') ||
        readOnly
      )
        return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) store.redo();
        else store.undo();
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "d") {
        e.preventDefault();
        duplicate();
      } else if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        remove();
      } else if (e.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });
  const addClass = () => {
    if (readOnly) return;
    const id = uid();
    let name = "NewClass",
      i = 2;
    while (project.classes.some((c) => c.name === name))
      name = `NewClass${i++}`;
    update((p) => {
      p.classes.push({
        id,
        name,
        attributes: [],
        methods: [],
        position: {
          x: 100 + (p.classes.length % 3) * 320,
          y: 80 + Math.floor(p.classes.length / 3) * 300,
        },
      });
      for (const s of p.sequences)
        s.lifelines.push({
          id: uid(),
          classId: id,
          name: name[0].toLowerCase() + name.slice(1),
          x: Math.max(-130, ...s.lifelines.map((l) => l.x)) + 250,
        });
    });
    setDiagramId("class");
    focus(id);
  };
  const addRelationship = (
    kind: RelationshipKind,
    source?: string,
    target?: string,
  ) => {
    if (readOnly || project.classes.length < 2) return;
    const id = uid();
    update((p) =>
      p.relationships.push({
        id,
        source: source ?? p.classes[0].id,
        target: target ?? p.classes[1].id,
        kind,
        name: "",
        sourceRole: "",
        targetRole: "",
        sourceMultiplicity: "1",
        targetMultiplicity: "0..*",
      }),
    );
    setDiagramId("class");
    setSelected(id);
  };
  const addSequence = () => {
    if (readOnly) return;
    const id = uid();
    update((p) =>
      p.sequences.push({
        id,
        name: `Sequence ${p.sequences.length + 1}`,
        lifelines: p.classes.map((c, i) => ({
          id: uid(),
          classId: c.id,
          name: c.name[0]?.toLowerCase() + c.name.slice(1),
          x: 120 + i * 250,
        })),
        messages: [],
        fragments: [],
      }),
    );
    setDiagram(id);
  };
  const addMessage = () => {
    if (readOnly || !sequence?.lifelines.length) return;
    const id = uid(),
      source = sequence.lifelines[0],
      target = sequence.lifelines[1] ?? source,
      method = availableMethods(project, target.classId)[0];
    update((p) =>
      p.sequences
        .find((s) => s.id === diagramId)!
        .messages.push({
          id,
          source: source.id,
          target: target.id,
          name: method?.name ?? "message",
          arguments:
            method?.parameters.map((p) => ({ value: p.name, type: p.type })) ??
            [],
          kind: "sync",
          activation: true,
          y: Math.max(80, ...sequence.messages.map((m) => m.y)) + 90,
        }),
    );
    focus(id);
  };
  const addFragment = (kind: "alt" | "opt") => {
    if (readOnly || !sequence) return;
    const id = uid();
    update((p) =>
      p.sequences
        .find((s) => s.id === diagramId)!
        .fragments.push({
          id,
          kind,
          guard: "condition",
          elseGuard: "else",
          y: 140,
          height: 240,
        }),
    );
    focus(id);
  };
  const syncLifelines = () => {
    if (readOnly || !sequence) return;
    update((p) => {
      const s = p.sequences.find((s) => s.id === diagramId)!;
      for (const c of p.classes)
        if (!s.lifelines.some((l) => l.classId === c.id))
          s.lifelines.push({
            id: uid(),
            classId: c.id,
            name: c.name[0]?.toLowerCase() + c.name.slice(1),
            x: Math.max(-130, ...s.lifelines.map((l) => l.x)) + 250,
          });
    });
    notify("Lifelines synced with classes.");
  };
  const arrange = () => {
    if (readOnly) return;
    update((p) => {
      if (isClass)
        p.classes.forEach((c, i) => {
          c.position = {
            x: 60 + (i % 2) * 430,
            y: 60 + Math.floor(i / 2) * 350,
          };
        });
      else {
        const s = p.sequences.find((s) => s.id === diagramId);
        s?.lifelines.forEach((l, i) => {
          l.x = 120 + i * 250;
        });
        s?.messages
          .sort((a, b) => a.y - b.y)
          .forEach((m, i) => {
            m.y = 160 + i * 90;
          });
      }
    });
    setSelected(null);
    notify("Diagram arranged on the grid.");
  };
  const exportFile = async (format: "json" | "svg" | "png") => {
    try {
      if (format === "json")
        download(
          new Blob([JSON.stringify(project, null, 2)], {
            type: "application/json",
          }),
          "umlab-project.json",
        );
      else await exportImage(project, currentDiagram, format);
      notify(`${format.toUpperCase()} exported.`);
    } catch (e) {
      notify(e instanceof Error ? e.message : "Export failed.");
    }
  };
  const importFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const chosen = e.target.files?.[0];
    e.target.value = "";
    if (!chosen || readOnly) return;
    try {
      if (chosen.size > 5_000_000)
        throw new Error("Maximum import size is 5 MB.");
      store.replace(parseProject(await chosen.text()));
      setDiagram("class");
      notify("Project imported. You can undo this change.");
    } catch (error) {
      notify(
        error instanceof Error ? error.message : "Could not read this file.",
      );
    }
  };
  const navigate = (i: Issue) => {
    setDiagramId(i.diagramId ?? "class");
    focus(i.elementId);
  };
  const apply = (i: Issue) => {
    if (i.fix && !readOnly) {
      store.replace(applyFix(project, i.fix));
      notify("Fix applied. The model has been checked again.");
    }
  };
  const load = (p: Project) => {
    store.replace(structuredClone(p));
    setDiagram("class");
    notify("Project loaded. Undo restores your previous work.");
  };
  const dismissHint = () => {
    setHint(false);
    try {
      localStorage.setItem("umlab.onboarded", "1");
    } catch {
      /* hints are optional */
    }
  };
  return (
    <div className="app-shell">
      <div className="screen-app">
        <Toolbar
          name={project.name}
          readOnly={readOnly}
          setReadOnly={setReadOnly}
          canUndo={store.canUndo}
          canRedo={store.canRedo}
          undo={store.undo}
          redo={store.redo}
          arrange={arrange}
          importFile={() => file.current?.click()}
          exportFile={exportFile}
          storageError={store.storageError}
          newProject={() =>
            load({
              version: 1,
              name: "Untitled project",
              classes: [],
              relationships: [],
              sequences: [],
              comments: [],
            })
          }
          loadSample={() => load(sampleProject)}
        />
        <input
          ref={file}
          className="sr-only"
          type="file"
          accept="application/json,.json"
          aria-label="Import project JSON"
          onChange={importFile}
        />
        {store.storageError && (
          <div className="storage-warning" role="alert">
            {store.storageError}
          </div>
        )}
        <div className={`workspace ${readOnly ? "review-mode" : ""}`}>
          {readOnly ? (
            <ReviewerView project={project} issues={issues} notify={notify} />
          ) : (
            <Palette
              project={project}
              diagramId={currentDiagram}
              selected={selected}
              setDiagram={setDiagram}
              select={focus}
              addClass={addClass}
              addSequence={addSequence}
              addRelationship={addRelationship}
              addMessage={addMessage}
              addFragment={addFragment}
              restoreLifelines={syncLifelines}
            />
          )}
          <main className="main-area">
            <div className="canvas-heading">
              <div className="breadcrumbs">
                <span>{project.name}</span>
                <ChevronRight size={13} />
                {isClass ? <Layers size={15} /> : <GitBranch size={15} />}
                <strong>{isClass ? "Class diagram" : sequence?.name}</strong>
              </div>
              <span className="diagram-label">
                {readOnly ? (
                  <>
                    <LockKeyhole size={12} /> READ ONLY
                  </>
                ) : isClass ? (
                  "DESIGN CLASS DIAGRAM"
                ) : (
                  "SEQUENCE DIAGRAM"
                )}
              </span>
            </div>
            <div className="canvas-tabs">
              <button
                className={isClass ? "active" : ""}
                onClick={() => setDiagram("class")}
              >
                <Layers size={14} /> Class diagram
              </button>
              {project.sequences.map((s) => (
                <button
                  key={s.id}
                  className={s.id === diagramId ? "active" : ""}
                  onClick={() => setDiagram(s.id)}
                >
                  <GitBranch size={14} />
                  {s.name}
                  {issues.some(
                    (i) => i.diagramId === s.id && i.severity === "error",
                  ) && (
                    <span
                      className="tab-error"
                      aria-label="Contains an error"
                    />
                  )}
                </button>
              ))}
              {!readOnly && (
                <button
                  className="new-diagram-tab"
                  aria-label="New sequence diagram"
                  onClick={addSequence}
                >
                  <Plus size={16} />
                </button>
              )}
            </div>
            {hint && !readOnly && (
              <div className="onboarding">
                <Info size={16} />
                <span>
                  <strong>Your next great design starts here.</strong> Start
                  with the sample project, then make it yours.
                </span>
                <button onClick={dismissHint} aria-label="Dismiss onboarding">
                  <X size={15} />
                </button>
              </div>
            )}
            <div className="canvas-layout">
              <div className="canvas-container">
                {currentDiagram === "class" ? (
                  <ClassCanvas
                    project={project}
                    issues={issues}
                    selected={selected}
                    focusToken={focusToken}
                    readOnly={readOnly}
                    select={setSelected}
                    update={update}
                    connect={(c: Connection) => {
                      if (c.source && c.target)
                        addRelationship("association", c.source, c.target);
                    }}
                  />
                ) : (
                  sequence && (
                    <SequenceCanvas
                      project={project}
                      sequence={sequence}
                      selected={selected}
                      focusToken={focusToken}
                      readOnly={readOnly}
                      select={setSelected}
                      update={update}
                    />
                  )
                )}
              </div>
              {selected && (
                <Properties
                  key={selected}
                  project={project}
                  selected={selected}
                  diagramId={currentDiagram}
                  readOnly={readOnly}
                  update={update}
                  remove={remove}
                  duplicate={duplicate}
                  close={() => setSelected(null)}
                />
              )}
            </div>
            <footer className="canvas-footer">
              <span>
                <span className="status-dot" />{" "}
                {readOnly
                  ? "Reviewer mode · select an element to comment"
                  : "All changes stay in this browser"}
              </span>
              <span>
                {project.classes.length} classes <b>·</b>{" "}
                {project.relationships.length} relationships <b>·</b>{" "}
                {project.sequences.length} sequence
                {project.sequences.length === 1 ? "" : "s"}
              </span>
            </footer>
            {!readOnly && (
              <details className="project-settings">
                <summary>Project settings</summary>
                <label>
                  Project name
                  <input
                    value={project.name}
                    onChange={(e) =>
                      update((p) => {
                        p.name = e.target.value;
                      })
                    }
                  />
                </label>
                {sequence && (
                  <>
                    <label>
                      Sequence name
                      <input
                        value={sequence.name}
                        onChange={(e) =>
                          update((p) => {
                            p.sequences.find(
                              (s) => s.id === sequence.id,
                            )!.name = e.target.value;
                          })
                        }
                      />
                    </label>
                    <button
                      className="button danger"
                      onClick={() => {
                        store.replace(removeElement(project, sequence.id));
                        setDiagram("class");
                      }}
                    >
                      Delete sequence
                    </button>
                  </>
                )}
              </details>
            )}
          </main>
          <aside className="right-panel">
            <ValidationPanel
              issues={issues}
              readOnly={readOnly}
              navigate={navigate}
              fix={apply}
            />
            <div className="tip-card">
              <span className="eyebrow">SMALL DETAIL. BETTER DESIGN.</span>
              <p>
                {readOnly
                  ? "Good feedback explains why. Pin a comment to the element you’re reviewing."
                  : "A sequence diagram tells a story. Every call should have a home in your class diagram."}
              </p>
              <span>Think in objects. Build with confidence.</span>
            </div>
          </aside>
        </div>
        <div className="toast-region" role="status" aria-live="polite">
          {toast && (
            <div className="toast">
              {toast}
              <button
                aria-label="Dismiss notification"
                onClick={() => setToast("")}
              >
                <X size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
      <article className="print-report">
        <h1>UMLab · Review report</h1>
        <pre>{reportText(project, issues)}</pre>
      </article>
    </div>
  );
}
