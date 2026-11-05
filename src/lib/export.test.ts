import { expect, it } from "vitest";
import { sampleProject } from "../data/sampleProject";
import { validateProject } from "../validation";
import { diagramSvg, reportText } from "./export";
it("exports portable SVG with all classes, relationships and escaped user text", () => {
  const p = structuredClone(sampleProject);
  p.classes[0].name = "<script>&";
  const svg = diagramSvg(p, "class");
  expect(svg).toContain("<svg");
  expect(svg).toContain("&lt;script&gt;&amp;");
  expect(svg).toContain("Library");
  expect(svg).toContain("0..*");
  expect(svg).toContain('marker-start="url(#uml-diamond)"');
  expect(svg.lastIndexOf("</rect>")).toBeLessThan(
    svg.indexOf('marker-start="url(#uml-diamond)"'),
  );
  expect(svg).not.toContain("<script>");
  expect(svg).not.toContain("foreignObject");
});
it("exports sequence messages and lifelines", () => {
  const svg = diagramSvg(sampleProject, "borrow-sequence");
  expect(svg).toContain("checkout(book, member)");
  expect(svg).toContain("Library");
});
it("report includes category counts, issues, checklist and comment content", () => {
  const p = structuredClone(sampleProject);
  p.comments.push({ id: "c", elementId: "book", text: "Review encapsulation" });
  const text = reportText(p, validateProject(p));
  expect(text).toContain("1 error");
  expect(text).toContain("Methods");
  expect(text).toContain("checkout");
  expect(text).toContain("Review encapsulation");
  expect(text).toContain("Assignment 2");
});
