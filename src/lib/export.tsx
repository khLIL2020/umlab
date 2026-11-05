import { relationshipRoute } from "./routing";
import { renderToStaticMarkup } from "react-dom/server";
import type { Project, Issue } from "../validation/types";
import { SequenceDrawing } from "../components/SequenceCanvas";
import { UMLMarkers } from "../components/ClassCanvas";
export function rubric(p: Project, issues: Issue[]) {
  return [
    {
      label: "Domain model completeness",
      assignment: "Assignment 2",
      pass:
        p.classes.length > 0 &&
        !issues.some((i) =>
          ["Completeness", "Structure", "Multiplicity"].includes(i.category),
        ),
      detail: "Classes have members, types, relationships and multiplicities.",
    },
    {
      label: "Design class diagram correctness",
      assignment: "Assignment 3",
      pass: p.classes.length > 0 && !issues.some((i) => !i.diagramId),
      detail: "Names, signatures, visibility and inheritance pass the checks.",
    },
    {
      label: "Sequence-diagram consistency",
      assignment: "Assignments 2 & 3",
      pass:
        p.sequences.length > 0 &&
        p.sequences.every((s) => s.messages.length > 0) &&
        !issues.some((i) => i.diagramId),
      detail: "Calls match their receivers and use valid lifelines.",
    },
  ];
}
export function elementName(p: Project, id: string) {
  return (
    p.classes.find((c) => c.id === id)?.name ||
    p.relationships.find((r) => r.id === id)?.name ||
    p.sequences
      .flatMap((s) => [...s.messages, ...s.lifelines])
      .find((e) => e.id === id)?.name ||
    p.sequences.flatMap((s) => s.fragments).find((e) => e.id === id)?.kind ||
    id
  );
}
export function reportText(p: Project, issues: Issue[]): string {
  return [
    `UMLab review — ${p.name}`,
    `${issues.filter((i) => i.severity === "error").length} errors · ${issues.filter((i) => i.severity === "warning").length} warnings`,
    `${p.classes.length} classes · ${p.relationships.length} relationships · ${p.sequences.length} sequences`,
    "",
    "CATEGORY SUMMARY",
    ...[...new Set(issues.map((i) => i.category))].map(
      (c) =>
        `${c}: ${issues.filter((i) => i.category === c && i.severity === "error").length} errors, ${issues.filter((i) => i.category === c && i.severity === "warning").length} warnings`,
    ),
    "",
    "RUBRIC CHECKLIST",
    ...rubric(p, issues).map(
      (r) => `[${r.pass ? "x" : " "}] ${r.assignment}: ${r.label}`,
    ),
    "[ ] Manual review: responsibilities, domain accuracy, use-case coverage and design quality.",
    "",
    "FINDINGS",
    ...(issues.length
      ? issues.map(
          (i) =>
            `${i.severity.toUpperCase()} · ${i.category} · ${elementName(p, i.elementId)}: ${i.message}`,
        )
      : ["No automated issues found."]),
    "",
    "COMMENT PINS",
    ...p.comments.map((c) => `${elementName(p, c.elementId)}: ${c.text}`),
    "",
    "This checklist supports CS-2340 review; it is not an official rubric or an automatic grade.",
  ].join("\n");
}
function classSvg(p: Project) {
  const layouts = p.classes.map((c) => {
    const rows = [
      ...c.attributes.map(
        (a) => `${a.visibility || "?"} ${a.name}: ${a.type || "?"}`,
      ),
      ...c.methods.map(
        (m) =>
          `${m.visibility || "?"} ${m.name}(${m.parameters.map((p) => `${p.name}: ${p.type}`).join(", ")}): ${m.returnType || "?"}`,
      ),
    ];
    return {
      c,
      w: Math.max(270, ...rows.map((s) => s.length * 7.7 + 32)),
      h:
        76 +
        Math.max(1, c.attributes.length) * 22 +
        Math.max(1, c.methods.length) * 22,
    };
  });
  const minX = Math.min(0, ...layouts.map((l) => l.c.position.x - 40)),
    minY = Math.min(0, ...layouts.map((l) => l.c.position.y - 40)),
    width =
      Math.max(600, ...layouts.map((l) => l.c.position.x + l.w + 70)) - minX,
    height =
      Math.max(400, ...layouts.map((l) => l.c.position.y + l.h + 70)) - minY;
  return {
    width,
    height,
    content: (
      <g
        transform={`translate(${-minX},${-minY})`}
        fontFamily="system-ui, sans-serif"
        fontSize="13"
        fill="#20324c"
      >
        <UMLMarkers />
        {layouts.map(({ c, w, h }) => (
          <g
            key={c.id}
            transform={`translate(${c.position.x},${c.position.y})`}
          >
            <rect width={w} height={h} rx="7" fill="white" stroke="#aab5c4" />
            <rect width={w} height="42" rx="7" fill="#eef2f7" />
            <text x={16} y={27} fontSize="16" fontWeight="700">
              {c.name}
            </text>
            <line x1="0" x2={w} y1="42" y2="42" stroke="#ccd4df" />
            {c.attributes.map((a, i) => (
              <text key={a.id} x="16" y={65 + i * 22}>
                {a.visibility || "?"} {a.name}: {a.type || "?"}
              </text>
            ))}
            <line
              x1="0"
              x2={w}
              y1={54 + Math.max(1, c.attributes.length) * 22}
              y2={54 + Math.max(1, c.attributes.length) * 22}
              stroke="#ccd4df"
            />
            {c.methods.map((m, i) => (
              <text
                key={m.id}
                x="16"
                y={75 + Math.max(1, c.attributes.length) * 22 + i * 22}
              >
                {m.visibility || "?"} {m.name}(
                {m.parameters.map((p) => `${p.name}: ${p.type}`).join(", ")}):{" "}
                {m.returnType || "?"}
              </text>
            ))}
          </g>
        ))}
        {p.relationships.map((r) => {
          const a = layouts.find((l) => l.c.id === r.source),
            b = layouts.find((l) => l.c.id === r.target);
          if (!a || !b) return null;
          const { x1, y1, x2, y2, path, labelX, labelY } = relationshipRoute(
            { ...a.c.position, width: a.w, height: a.h },
            { ...b.c.position, width: b.w, height: b.h },
          );
          return (
            <g key={r.id}>
              <path
                d={path}
                stroke="#67758b"
                strokeWidth="1.4"
                fill="none"
                strokeDasharray={
                  ["dependency", "realization"].includes(r.kind)
                    ? "6 4"
                    : undefined
                }
                markerEnd={
                  ["inheritance", "realization"].includes(r.kind)
                    ? "url(#uml-triangle)"
                    : r.kind === "dependency"
                      ? "url(#uml-arrow)"
                      : undefined
                }
                markerStart={
                  r.kind === "composition"
                    ? "url(#uml-filled-diamond)"
                    : r.kind === "aggregation"
                      ? "url(#uml-diamond)"
                      : undefined
                }
              />
              <text x={labelX + 8} y={labelY - 8}>
                {r.name || r.kind}
              </text>
              {["association", "aggregation", "composition"].includes(
                r.kind,
              ) && (
                <>
                  <text x={x1 + 8} y={y1 - 12}>
                    {r.sourceRole} {r.sourceMultiplicity || "?"}
                  </text>
                  <text x={x2 - 8} y={y2 + 24} textAnchor="end">
                    {r.targetRole} {r.targetMultiplicity || "?"}
                  </text>
                </>
              )}
            </g>
          );
        })}
      </g>
    ),
  };
}
export function diagramSvg(p: Project, diagramId: string): string {
  let content: React.ReactNode, width: number, height: number;
  if (diagramId === "class") ({ content, width, height } = classSvg(p));
  else {
    const s = p.sequences.find((s) => s.id === diagramId);
    if (!s) throw new Error("Sequence not found.");
    const minX = Math.min(0, ...s.lifelines.map((l) => l.x - 100));
    width = Math.max(650, ...s.lifelines.map((l) => l.x + 180)) - minX;
    height = Math.max(
      700,
      ...s.messages.map((m) => m.y + 130),
      ...s.fragments.map((f) => f.y + f.height + 60),
    );
    content = (
      <g transform={`translate(${-minX},0)`}>
        <SequenceDrawing project={p} sequence={s} />
      </g>
    );
  }
  return renderToStaticMarkup(
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
    >
      <rect width="100%" height="100%" fill="#f8fafc" />
      {content}
    </svg>,
  );
}
export function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export async function exportImage(
  p: Project,
  diagramId: string,
  format: "svg" | "png",
) {
  const svg = diagramSvg(p, diagramId);
  if (format === "svg") {
    download(new Blob([svg], { type: "image/svg+xml" }), "umlab-diagram.svg");
    return;
  }
  const url = URL.createObjectURL(
    new Blob([svg], { type: "image/svg+xml;charset=utf-8" }),
  );
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () =>
        reject(new Error("Could not render the diagram image."));
      image.src = url;
    });
    const scale = Math.min(
      2,
      12000 / Math.max(image.width, image.height),
      Math.sqrt(32_000_000 / (image.width * image.height)),
    );
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(image.width * scale);
    canvas.height = Math.ceil(image.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("PNG export is not supported by this browser.");
    ctx.scale(scale, scale);
    ctx.drawImage(image, 0, 0);
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (blob) =>
          blob ? resolve(blob) : reject(new Error("Could not encode PNG.")),
        "image/png",
      ),
    );
    download(blob, "umlab-diagram.png");
  } finally {
    URL.revokeObjectURL(url);
  }
}
