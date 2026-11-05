import { useEffect, useState } from "react";
import type { Project, Fix } from "../validation/types";
import { sampleProject } from "../data/sampleProject";
import { projectSchema } from "./schema";
export const uid = () => crypto.randomUUID();
export interface History {
  past: Project[];
  present: Project;
  future: Project[];
}
export function commit(s: History, p: Project): History {
  return JSON.stringify(s.present) === JSON.stringify(p)
    ? s
    : { past: [...s.past.slice(-99), s.present], present: p, future: [] };
}
export function undo(s: History): History {
  return s.past.length
    ? {
        past: s.past.slice(0, -1),
        present: s.past.at(-1)!,
        future: [s.present, ...s.future],
      }
    : s;
}
export function redo(s: History): History {
  return s.future.length
    ? {
        past: [...s.past, s.present],
        present: s.future[0],
        future: s.future.slice(1),
      }
    : s;
}
export function parseProject(text: string): Project {
  if (text.length > 5_000_000)
    throw new Error("This file is too large (maximum 5 MB).");
  const result = projectSchema.safeParse(JSON.parse(text));
  if (!result.success)
    throw new Error(
      `Invalid UMLab file: ${result.error.issues[0].path.join(".")} ${result.error.issues[0].message}`,
    );
  const p = result.data;
  const ids = [
    ...p.classes.flatMap((c) => [
      c.id,
      ...c.attributes.map((a) => a.id),
      ...c.methods.map((m) => m.id),
    ]),
    ...p.relationships.map((r) => r.id),
    ...p.sequences.flatMap((s) => [
      s.id,
      ...s.lifelines.map((l) => l.id),
      ...s.messages.map((m) => m.id),
      ...s.fragments.map((f) => f.id),
    ]),
    ...p.comments.map((c) => c.id),
  ];
  if (new Set(ids).size !== ids.length)
    throw new Error("Invalid UMLab file: element IDs must be unique.");
  if (
    p.relationships.some(
      (r) =>
        ![r.source, r.target].every((id) => p.classes.some((c) => c.id === id)),
    )
  )
    throw new Error("A relationship refers to a missing class.");
  return p;
}
export function applyFix(p: Project, fix: Fix): Project {
  const next = structuredClone(p);
  if (fix.kind === "rename-message") {
    const m = next.sequences
      .find((s) => s.id === fix.diagramId)
      ?.messages.find((m) => m.id === fix.messageId);
    if (m) m.name = fix.name;
  } else {
    const r = next.relationships.find((r) => r.id === fix.relationshipId);
    if (r) r[`${fix.end}Multiplicity`] = fix.value;
  }
  return next;
}
export function removeElement(p: Project, id: string): Project {
  const next = structuredClone(p);
  const removed = new Set([id]);
  next.classes = next.classes.filter((c) => c.id !== id);
  next.relationships = next.relationships.filter((r) => {
    const keep = r.id !== id && r.source !== id && r.target !== id;
    if (!keep) removed.add(r.id);
    return keep;
  });
  next.sequences = next.sequences.filter((s) => {
    if (s.id !== id) return true;
    [...s.lifelines, ...s.messages, ...s.fragments].forEach((e) =>
      removed.add(e.id),
    );
    return false;
  });
  for (const s of next.sequences) {
    s.lifelines = s.lifelines.filter((l) => l.id !== id);
    s.messages = s.messages.filter((m) => {
      const keep = m.id !== id && m.source !== id && m.target !== id;
      if (!keep) removed.add(m.id);
      return keep;
    });
    s.fragments = s.fragments.filter((f) => f.id !== id);
  }
  next.comments = next.comments.filter((c) => !removed.has(c.elementId));
  return next;
}
export function duplicateElement(p: Project, id: string): Project {
  const next = structuredClone(p);
  const c = next.classes.find((c) => c.id === id);
  if (c) {
    let name = c.name + "Copy";
    while (next.classes.some((c) => c.name === name)) name += "Copy";
    const copy = {
      ...structuredClone(c),
      id: uid(),
      name,
      position: { x: c.position.x + 45, y: c.position.y + 45 },
      attributes: c.attributes.map((a) => ({ ...a, id: uid() })),
      methods: c.methods.map((m) => ({ ...structuredClone(m), id: uid() })),
    };
    next.classes.push(copy);
    for (const s of next.sequences)
      s.lifelines.push({
        id: uid(),
        classId: copy.id,
        name: copy.name[0]?.toLowerCase() + copy.name.slice(1),
        x: Math.max(0, ...s.lifelines.map((l) => l.x)) + 250,
      });
  }
  const r = next.relationships.find((r) => r.id === id);
  if (r) next.relationships.push({ ...r, id: uid() });
  for (const s of next.sequences) {
    const m = s.messages.find((m) => m.id === id);
    if (m) s.messages.push({ ...structuredClone(m), id: uid(), y: m.y + 45 });
    const f = s.fragments.find((f) => f.id === id);
    if (f) s.fragments.push({ ...f, id: uid(), y: f.y + 45 });
    const l = s.lifelines.find((l) => l.id === id);
    if (l)
      s.lifelines.push({
        ...l,
        id: uid(),
        name: l.name + "Copy",
        x: l.x + 180,
      });
  }
  return next;
}
const STORAGE_KEY = "umlab.project.v1";
function load(): { project: Project; error: string } {
  try {
    const text = localStorage.getItem(STORAGE_KEY);
    return {
      project: text ? parseProject(text) : structuredClone(sampleProject),
      error: "",
    };
  } catch {
    return {
      project: structuredClone(sampleProject),
      error:
        "Saved data could not be loaded. The sample is open; the original data was left untouched. Export your work before leaving.",
    };
  }
}
export function useDiagramStore() {
  const [initial] = useState(load);
  const [history, setHistory] = useState<History>({
    past: [],
    present: initial.project,
    future: [],
  });
  const [storageError, setStorageError] = useState(initial.error);
  useEffect(() => {
    if (initial.error) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history.present));
      setStorageError("");
    } catch {
      setStorageError(
        "Autosave is unavailable. Export JSON to keep a copy of your work.",
      );
    }
  }, [history.present, initial.error]);
  return {
    project: history.present,
    storageError,
    canUndo: !!history.past.length,
    canRedo: !!history.future.length,
    update: (recipe: (p: Project) => void) =>
      setHistory((s) => {
        const p = structuredClone(s.present);
        recipe(p);
        return commit(s, p);
      }),
    replace: (p: Project) => setHistory((s) => commit(s, p)),
    undo: () => setHistory(undo),
    redo: () => setHistory(redo),
  };
}
