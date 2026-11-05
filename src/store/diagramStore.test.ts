import { expect, it } from "vitest";
import { sampleProject } from "../data/sampleProject";
import { validateProject } from "../validation";
import {
  commit,
  undo,
  redo,
  parseProject,
  applyFix,
  removeElement,
  duplicateElement,
  type History,
} from "./diagramStore";
const sample = () => structuredClone(sampleProject);
it("sample has exactly one deliberate error and its fix resolves all issues", () => {
  const p = sample();
  const issues = validateProject(p);
  expect(issues).toHaveLength(1);
  expect(issues[0].severity).toBe("error");
  expect(validateProject(applyFix(p, issues[0].fix!))).toEqual([]);
  expect(p.sequences[0].messages[0].name).toBe("checkout");
});
it("undo/redo restores add, edit and delete snapshots and clears redo on new edits", () => {
  const p = sample();
  let h: History = { past: [], present: p, future: [] };
  const edit = { ...p, name: "Edited" };
  h = commit(h, edit);
  expect(h.present.name).toBe("Edited");
  h = undo(h);
  expect(h.present).toEqual(p);
  h = redo(h);
  expect(h.present).toEqual(edit);
  h = commit(h, removeElement(edit, "book"));
  expect(h.present.classes).toHaveLength(3);
  h = undo(h);
  expect(h.present).toEqual(edit);
  h = commit(h, duplicateElement(edit, "book"));
  expect(h.present.classes).toHaveLength(5);
  expect(h.future).toEqual([]);
});
it("JSON round-trips every field without loss", () =>
  expect(parseProject(JSON.stringify(sample()))).toEqual(sample()));
it("rejects malformed imports, unknown versions, duplicate IDs and nonfinite coordinates", () => {
  expect(() => parseProject("{}")).toThrow();
  const p = sample();
  expect(() => parseProject(JSON.stringify({ ...p, version: 2 }))).toThrow();
  p.classes[1].id = p.classes[0].id;
  expect(() => parseProject(JSON.stringify(p))).toThrow();
  const q = sample();
  q.classes[0].position.x = Infinity;
  expect(() => parseProject(JSON.stringify(q))).toThrow();
});
it("deleting a class removes relationships but retains orphan lifelines for validation and undo", () => {
  const p = removeElement(sample(), "library");
  expect(p.classes.some((c) => c.id === "library")).toBe(false);
  expect(
    p.relationships.some(
      (r) => r.source === "library" || r.target === "library",
    ),
  ).toBe(false);
  expect(validateProject(p).some((i) => i.category === "Lifelines")).toBe(true);
});
it("deleting a lifeline removes its messages and attached comments", () => {
  const p = sample();
  p.comments = [{ id: "comment", elementId: "s-checkout", text: "review" }];
  const result = removeElement(p, "l-library");
  expect(result.sequences[0].messages).toEqual([]);
  expect(result.comments).toEqual([]);
});
it("duplicated classes receive unique member IDs and a distinct name", () => {
  const p = duplicateElement(sample(), "book");
  const copy = p.classes.at(-1)!;
  expect(copy.name).toBe("BookCopy");
  expect(copy.id).not.toBe("book");
  expect(copy.attributes[0].id).not.toBe("isbn");
});

it("round-trips unassigned lifelines and large finite fragment heights from the editor", () => {
  const p = sample();
  p.sequences[0].lifelines[0].classId = "";
  p.sequences[0].fragments.push({
    id: "fragment",
    kind: "opt",
    guard: "ready",
    elseGuard: "",
    y: 120,
    height: 100001,
  });
  expect(parseProject(JSON.stringify(p))).toEqual(p);
  const lifelineIssues = validateProject(p).filter(
    (i) => i.category === "Lifelines",
  );
  expect(lifelineIssues).toHaveLength(1);
  expect(lifelineIssues[0].severity).toBe("warning");
});
it("can add a missing method from a one-click fix", () => {
  const p = sample();
  p.sequences[0].messages[0].name = "renewLoan";
  const issue = validateProject(p).find((i) => i.fix?.kind === "add-method");
  expect(issue?.fix).toMatchObject({
    kind: "add-method",
    name: "renewLoan",
  });
  expect(validateProject(applyFix(p, issue!.fix!))).toEqual([]);
});
