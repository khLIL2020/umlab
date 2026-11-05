import { describe, expect, it } from "vitest";
import { validateProject } from "./index";
import type { Project } from "./types";
const fixture = (): Project => ({
  version: 1,
  name: "Test",
  classes: [
    {
      id: "a",
      name: "Library",
      position: { x: 0, y: 0 },
      attributes: [
        { id: "attr", name: "name", type: "String", visibility: "-" },
      ],
      methods: [
        {
          id: "method",
          name: "checkOut",
          parameters: [{ name: "book", type: "Book" }],
          returnType: "Loan",
          visibility: "+",
        },
      ],
    },
    {
      id: "b",
      name: "Book",
      position: { x: 300, y: 0 },
      attributes: [
        { id: "title", name: "title", type: "String", visibility: "-" },
      ],
      methods: [],
    },
  ],
  relationships: [
    {
      id: "r",
      source: "a",
      target: "b",
      kind: "association",
      name: "catalog",
      sourceRole: "",
      targetRole: "",
      sourceMultiplicity: "1",
      targetMultiplicity: "*",
    },
  ],
  sequences: [
    {
      id: "s",
      name: "Borrow",
      lifelines: [
        { id: "la", classId: "a", name: "library", x: 100 },
        { id: "lb", classId: "b", name: "book", x: 400 },
      ],
      messages: [
        {
          id: "msg",
          source: "lb",
          target: "la",
          name: "checkOut",
          arguments: [{ value: "book", type: "Book" }],
          kind: "sync",
          y: 150,
          activation: true,
        },
      ],
      fragments: [],
    },
  ],
  comments: [],
});
const has = (p: Project, category: string) =>
  validateProject(p).filter((i) => i.category === category);
describe("pure UML validation", () => {
  it("accepts a valid project", () =>
    expect(validateProject(fixture())).toEqual([]));
  it("reports a nonexistent receiving method", () => {
    const p = fixture();
    p.sequences[0].messages[0].name = "destroy";
    expect(has(p, "Methods")[0].message).toContain(
      "Library has no such method",
    );
  });
  it("suggests case-only and edit-distance typos with one fix", () => {
    const p = fixture();
    p.sequences[0].messages[0].name = "checkout";
    const issues = has(p, "Methods");
    expect(issues).toHaveLength(1);
    expect(issues[0].fix).toMatchObject({ name: "checkOut" });
    expect(issues[0].message).toContain("Did you mean");
  });
  it("warns on argument count and known types", () => {
    const p = fixture();
    p.sequences[0].messages[0].arguments = [];
    expect(has(p, "Signatures")).toHaveLength(1);
    p.sequences[0].messages[0].arguments = [{ value: "42", type: "number" }];
    expect(has(p, "Signatures")).toHaveLength(1);
  });
  it("does not invent unknown argument types", () => {
    const p = fixture();
    p.sequences[0].messages[0].arguments[0].type = "";
    expect(has(p, "Signatures")).toHaveLength(0);
  });
  it("checks missing and invalid multiplicities and suggests many → *", () => {
    const p = fixture();
    p.relationships[0].targetMultiplicity = "many";
    p.relationships[0].sourceMultiplicity = "";
    expect(has(p, "Multiplicity")).toHaveLength(2);
    expect(has(p, "Multiplicity").find((i) => i.fix)?.fix).toMatchObject({
      value: "*",
    });
  });
  it("accepts numeric and ranged multiplicities like 2 and 2..4", () => {
    const p = fixture();
    p.relationships[0].sourceMultiplicity = "2";
    p.relationships[0].targetMultiplicity = "2..4";
    expect(has(p, "Multiplicity")).toEqual([]);
  });
  it("warns for external actor lifelines instead of treating them as deleted classes", () => {
    const p = fixture();
    p.sequences[0].lifelines[0].classId = "";
    const issues = has(p, "Lifelines");
    expect(issues).toHaveLength(1);
    expect(issues[0].severity).toBe("warning");
    expect(issues[0].message).toMatch(/external actor|not linked to a class/i);
  });
  it("offers adding a missing method when there is no typo suggestion", () => {
    const p = fixture();
    p.sequences[0].messages[0].name = "renewLoan";
    const issue = has(p, "Methods")[0];
    expect(issue.fix).toMatchObject({
      kind: "add-method",
      classId: "a",
      name: "renewLoan",
    });
  });
  it("flags duplicate classes, identical method signatures, and member collisions", () => {
    const p = fixture();
    p.classes[1].name = "Library";
    p.classes[0].methods.push({ ...p.classes[0].methods[0], id: "m2" });
    p.classes[0].attributes[0].name = "checkOut";
    expect(has(p, "Names")).toHaveLength(3);
  });
  it("checks completeness including constructor exemption", () => {
    const p = fixture();
    p.classes[0].attributes[0].type = "";
    p.classes[0].methods[0].returnType = "";
    p.classes[1].attributes = [];
    p.relationships[0].name = "";
    expect(has(p, "Completeness")).toHaveLength(4);
    p.classes[0].methods[0].name = "Library";
    expect(has(p, "Completeness")).toHaveLength(3);
  });
  it("requires visibility", () => {
    const p = fixture();
    p.classes[0].methods[0].visibility = "";
    p.classes[0].attributes[0].visibility = "";
    expect(has(p, "Visibility")).toHaveLength(2);
  });
  it("detects inheritance cycles without recursion failure", () => {
    const p = fixture();
    p.relationships[0].kind = "inheritance";
    p.relationships.push({
      ...p.relationships[0],
      id: "r2",
      source: "b",
      target: "a",
    });
    expect(has(p, "Inheritance").some((i) => i.severity === "error")).toBe(
      true,
    );
  });
  it("warns on changed inherited signatures", () => {
    const p = fixture();
    p.relationships[0].kind = "inheritance";
    p.classes[1].methods = [
      { ...p.classes[0].methods[0], id: "parent", parameters: [] },
    ];
    expect(has(p, "Inheritance").some((i) => i.severity === "warning")).toBe(
      true,
    );
  });
  it("accepts inherited method invocations", () => {
    const p = fixture();
    p.relationships[0].kind = "inheritance";
    p.classes[1].methods = p.classes[0].methods;
    p.classes[0].methods = [];
    expect(has(p, "Methods")).toEqual([]);
  });
  it("reports orphan lifelines", () => {
    const p = fixture();
    p.sequences[0].lifelines[0].classId = "missing";
    expect(has(p, "Lifelines")).toHaveLength(1);
  });
  it("reports isolated classes, including self-relationships", () => {
    const p = fixture();
    p.relationships[0].target = "a";
    expect(has(p, "Structure")).toHaveLength(2);
  });
  it("does not treat returns as method calls", () => {
    const p = fixture();
    p.sequences[0].messages[0].kind = "return";
    p.sequences[0].messages[0].name = "loan";
    expect(has(p, "Methods")).toEqual([]);
  });
  it("accepts matching overload rather than warning on first overload", () => {
    const p = fixture();
    p.classes[0].methods.unshift({
      ...p.classes[0].methods[0],
      id: "other",
      parameters: [],
    });
    expect(has(p, "Signatures")).toEqual([]);
  });
  it("detects orphan message endpoints", () => {
    const p = fixture();
    p.sequences[0].messages[0].source = "gone";
    expect(has(p, "Lifelines")).toHaveLength(1);
  });
});
