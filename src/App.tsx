import { useEffect, useMemo, useRef, useState } from "react";
import {
  Layers,
  GitBranch,
  Info,
  X,
  Plus,
  ShieldCheck,
  AlertCircle,
  Link2,
} from "lucide-react";
function LinkHint() {
  return <Link2 size={15} />;
}
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
  const [showChecks, setShowChecks] = useState(false);
  const [connectKind, setConnectKind] = useState<RelationshipKind | null>(
    null,
  );
  const [connectFrom, setConnectFrom] = useState<string | null>(null);
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
  const errorCount = issues.filter((i) => i.severity === "error").length;
  const warningCount = issues.filter((i) => i.severity === "warning").length;
  const sequence = project.sequences.find((s) => s.id === diagramId);
  const isClass = diagramId === "class";
  const currentDiagram = isClass || sequence ? diagramId : "class";
  const notify = (text: string) => setToast(text);
  const clearConnect = () => {
    setConnectKind(null);
    setConnectFrom(null);
  };
  const select = (id: string | null) => {
    if (connectKind) return;
    setSelected(id);
  };
  const beginConnect = (kind: RelationshipKind) => {
    if (readOnly || project.classes.length < 2) return;
    setSelected(null);
    setShowChecks(false);
    setDiagramId("class");
    setConnectKind(kind);
    setConnectFrom(null);
    notify(`Click the first class, then the second (${kind}). Esc cancels.`);
  };
  const onClassPick = (id: string) => {
    if (!connectKind) {
      setSelected(id);
      return;
    }
    if (!connectFrom) {
      setConnectFrom(id);
      notify("Now click the class to connect to.");
      return;
    }
    if (connectFrom === id) {
      notify("Pick a different class for the other end.");
      return;
    }
    addRelationship(connectKind, connectFrom, id);
    clearConnect();
    notify("Relationship added. Edit roles and multiplicity in the side panel.");
  };
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
    select(id);
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
      } else if (e.key === "Escape") {
        setSelected(null);
        setShowChecks(false);
        clearConnect();
      }
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
    if (!source || !target) {
      beginConnect(kind);
      return;
    }
    const id = uid();
    update((p) =>
      p.relationships.push({
        id,
        source,
        target,
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
          setReadOnly={(v) => {
            setReadOnly(v);
            setSelected(null);
            setShowChecks(false);
          }}
          canUndo={store.canUndo}
          canRedo={store.canRedo}
          undo={store.undo}
          redo={store.redo}
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
              addClass={addClass}
              addSequence={addSequence}
              addRelationship={addRelationship}
              addMessage={addMessage}
              addFragment={addFragment}
              restoreLifelines={syncLifelines}
              arrange={arrange}
            />
          )}
          <main className="main-area">
            <div className="nav-row">
              <div className="canvas-tabs" role="tablist" aria-label="Diagrams">
                <button
                  role="tab"
                  aria-selected={isClass}
                  className={isClass ? "active" : ""}
                  onClick={() => setDiagram("class")}
                >
                  <Layers size={14} /> Class diagram
                </button>
                {project.sequences.map((s) => (
                  <button
                    key={s.id}
                    role="tab"
                    aria-selected={s.id === diagramId}
                    className={s.id === diagramId ? "active" : ""}
                    onClick={() => setDiagram(s.id)}
                  >
                    <GitBranch size={14} />
                    {s.name}
                    {issues.some(
                      (i) =>
                        i.diagramId === s.id && i.severity === "error",
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
            </div>
            {hint && !readOnly && !connectKind && (
              <div className="onboarding">
                <Info size={15} />
                <span>
                  Use Add on the left. Click a class to edit it. To connect two
                  classes: Add relationship → click first class → click second.
                </span>
                <button onClick={dismissHint} aria-label="Dismiss onboarding">
                  <X size={15} />
                </button>
              </div>
            )}
            {connectKind && (
              <div className="connect-banner" role="status">
                <LinkHint />
                <span>
                  {connectFrom
                    ? `Connecting ${project.classes.find((c) => c.id === connectFrom)?.name ?? "class"} → click the target class`
                    : `Click the source class for ${connectKind}`}
                </span>
                <button className="button quiet" onClick={clearConnect}>
                  Cancel
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
                    connectKind={connectKind}
                    connectFrom={connectFrom}
                    select={select}
                    update={update}
                    onClassPick={onClassPick}
                    connect={(c: Connection) => {
                      if (c.source && c.target && c.source !== c.target) {
                        addRelationship(
                          connectKind ?? "association",
                          c.source,
                          c.target,
                        );
                        clearConnect();
                      }
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
                      select={select}
                      update={update}
                    />
                  )
                )}
              </div>
              {selected && !connectKind && (
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
              <aside
                className={`checks-rail ${showChecks ? "open" : "folded"} ${errorCount ? "has-errors" : ""}`}
              >
                <button
                  type="button"
                  className="checks-rail-tab"
                  aria-expanded={showChecks}
                  aria-controls="model-check-panel"
                  title={
                    showChecks ? "Fold model check" : "Open model check"
                  }
                  onClick={() => setShowChecks((v) => !v)}
                >
                  {errorCount ? (
                    <AlertCircle size={16} />
                  ) : (
                    <ShieldCheck size={16} />
                  )}
                  <span className="checks-rail-label">Model check</span>
                  <span className="checks-badge">
                    {errorCount || warningCount
                      ? `${errorCount}/${warningCount}`
                      : "ok"}
                  </span>
                  <span className="checks-fold-hint">
                    {showChecks ? "Fold ›" : "‹ Open"}
                  </span>
                </button>
                <div
                  id="model-check-panel"
                  className="checks-rail-panel"
                  hidden={!showChecks}
                >
                  {showChecks && (
                    <ValidationPanel
                      issues={issues}
                      readOnly={readOnly}
                      navigate={(i) => {
                        clearConnect();
                        navigate(i);
                      }}
                      fix={apply}
                      onClose={() => setShowChecks(false)}
                    />
                  )}
                </div>
              </aside>
            </div>
            {!readOnly && (
              <details className="project-settings">
                <summary>Rename project or sequence</summary>
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
