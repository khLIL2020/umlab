import { useEffect, useRef, useState } from "react";
import { Minus, Plus, Maximize } from "lucide-react";
import type { Project, SequenceDiagram } from "../validation/types";
interface Props {
  project: Project;
  sequence: SequenceDiagram;
  selected: string | null;
  focusToken: number;
  readOnly: boolean;
  select: (id: string | null) => void;
  update: (recipe: (p: Project) => void) => void;
}
export function SequenceDrawing({
  project,
  sequence: s,
  selected,
  select,
  beginDrag,
}: {
  project: Project;
  sequence: SequenceDiagram;
  selected?: string | null;
  select?: (id: string) => void;
  beginDrag?: (
    e: React.PointerEvent,
    id: string,
    kind: "lifeline" | "message" | "fragment",
  ) => void;
}) {
  const bottom = Math.max(
    580,
    ...s.messages.map((m) => m.y + 100),
    ...s.fragments.map((f) => f.y + f.height + 40),
  );
  const xs = s.lifelines.map((l) => l.x);
  const left = Math.min(30, ...xs.map((x) => x - 85)),
    right = Math.max(450, ...xs.map((x) => x + 90));
  const interactive = (
    id: string,
    kind: "lifeline" | "message" | "fragment",
  ) => ({
    tabIndex: select ? 0 : undefined,
    role: select ? "button" : undefined,
    onClick: () => select?.(id),
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        select?.(id);
      }
    },
    onPointerDown: (e: React.PointerEvent) => beginDrag?.(e, id, kind),
  });
  return (
    <g fontFamily="Inter, system-ui, sans-serif" fontSize="13" fill="#20324c">
      <defs>
        <marker
          id="seq-solid"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="9"
          markerHeight="9"
          orient="auto"
        >
          <path d="M0 0 L10 5 L0 10 Z" fill="#42546e" />
        </marker>
        <marker
          id="seq-open"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="9"
          markerHeight="9"
          orient="auto"
        >
          <path d="M0 0 L10 5 L0 10" fill="none" stroke="#42546e" />
        </marker>
      </defs>
      {s.fragments.map((f) => (
        <g
          key={f.id}
          {...interactive(f.id, "fragment")}
          aria-label={`${f.kind} fragment ${f.guard}`}
          className="sequence-element"
        >
          <rect
            x={left}
            y={f.y}
            width={right - left}
            height={f.height}
            rx="3"
            fill={selected === f.id ? "#fff4d8" : "#f6f8fc"}
            fillOpacity=".7"
            stroke={selected === f.id ? "#a1741b" : "#8794a7"}
          />
          <path
            d={`M${left} ${f.y + 26}h43l12 -12v-14`}
            fill="none"
            stroke="#8794a7"
          />
          <text x={left + 12} y={f.y + 18} fontWeight="700">
            {f.kind}
          </text>
          <text x={left + 70} y={f.y + 21}>
            [{f.guard}]
          </text>
          {f.kind === "alt" && (
            <>
              <line
                x1={left}
                x2={right}
                y1={f.y + f.height / 2}
                y2={f.y + f.height / 2}
                stroke="#8794a7"
                strokeDasharray="6 4"
              />
              <text x={left + 70} y={f.y + f.height / 2 + 22}>
                [{f.elseGuard || "else"}]
              </text>
            </>
          )}
        </g>
      ))}
      {s.lifelines.map((l) => (
        <g
          key={l.id}
          {...interactive(l.id, "lifeline")}
          aria-label={`Lifeline ${l.name}`}
          className="sequence-element"
        >
          <line
            x1={l.x}
            x2={l.x}
            y1="100"
            y2={bottom}
            stroke="#9da9b9"
            strokeDasharray="6 5"
          />
          <rect
            x={l.x - 83}
            y="42"
            width="166"
            height="58"
            rx="6"
            stroke={selected === l.id ? "#a1741b" : "#aeb8c7"}
            strokeWidth={selected === l.id ? 2 : 1}
            fill={selected === l.id ? "#fff4d8" : "white"}
          />
          <text x={l.x} y="68" textAnchor="middle" fontWeight="600">
            {l.name}
          </text>
          <text x={l.x} y="87" textAnchor="middle" fill="#718098">
            :{" "}
            {project.classes.find((c) => c.id === l.classId)?.name ||
              "Missing class"}
          </text>
        </g>
      ))}
      {s.messages.map((m, index) => {
        const source = s.lifelines.find((l) => l.id === m.source),
          target = s.lifelines.find((l) => l.id === m.target);
        if (!source || !target)
          return (
            <g key={m.id} {...interactive(m.id, "message")}>
              <text x="40" y={m.y} fill="#b83242">
                ⚠ {m.name}: missing lifeline
              </text>
            </g>
          );
        const self = source.id === target.id;
        const path = self
          ? `M${source.x} ${m.y} h55 v32 h-55`
          : `M${source.x} ${m.y} H${target.x}`;
        const label = `${index + 1}. ${m.name}${m.kind === "return" ? "" : `(${m.arguments.map((a) => a.value).join(", ")})`}`;
        return (
          <g
            key={m.id}
            {...interactive(m.id, "message")}
            aria-label={`Message ${label}`}
            className="sequence-element"
          >
            {m.activation && m.kind !== "return" && (
              <rect
                x={target.x - 6}
                y={m.y}
                width="12"
                height={self ? 55 : 60}
                fill="#e1e8f0"
                stroke="#8794a7"
              />
            )}
            {selected === m.id && (
              <rect
                x={Math.min(source.x, target.x) - 12}
                y={m.y - 30}
                width={Math.max(100, Math.abs(target.x - source.x) + 24)}
                height={self ? 75 : 49}
                rx="5"
                fill="#f7e6b8"
                fillOpacity=".6"
              />
            )}
            <path
              d={path}
              stroke="#42546e"
              strokeWidth="1.6"
              strokeDasharray={m.kind === "return" ? "6 4" : undefined}
              fill="none"
              markerEnd={`url(#seq-${m.kind === "sync" ? "solid" : "open"})`}
            />
            <path d={path} stroke="transparent" strokeWidth="20" fill="none" />
            <text
              x={self ? source.x + 8 : (source.x + target.x) / 2}
              y={m.y - 10}
              textAnchor={self ? "start" : "middle"}
              fill={selected === m.id ? "#805b10" : "#20324c"}
            >
              {label}
            </text>
            {project.comments.some((c) => c.elementId === m.id) && (
              <text x={target.x + 12} y={m.y + 18} fill="#956b18">
                ● comment
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
}
export default function SequenceCanvas({
  project,
  sequence,
  selected,
  focusToken,
  readOnly,
  select,
  update,
}: Props) {
  const root = useRef<SVGSVGElement>(null);
  const [view, setView] = useState({ x: 25, y: 15, scale: 0.85 });
  const drag = useRef<{
    id: string;
    kind: string;
    x: number;
    y: number;
    startX: number;
    startY: number;
  } | null>(null);
  const lastFocus = useRef(-1);
  const [preview, setPreview] = useState<SequenceDiagram | null>(null);
  useEffect(() => setPreview(null), [sequence]);
  const fit = () => {
    const rect = root.current?.getBoundingClientRect();
    const width = Math.max(650, ...sequence.lifelines.map((l) => l.x + 130)),
      height = Math.max(
        650,
        ...sequence.messages.map((m) => m.y + 100),
        ...sequence.fragments.map((f) => f.y + f.height + 50),
      );
    setView({
      x: 20,
      y: 10,
      scale: Math.min(
        (rect?.width || 800) / width,
        (rect?.height || 600) / height,
        1,
      ),
    });
  };
  useEffect(fit, [sequence.id]); // Fit first; an explicit issue focus takes precedence.
  useEffect(() => {
    if (!selected || !focusToken || lastFocus.current === focusToken) return;
    lastFocus.current = focusToken;
    const m = sequence.messages.find((m) => m.id === selected);
    const l = sequence.lifelines.find((l) => l.id === selected);
    const f = sequence.fragments.find((f) => f.id === selected);
    const x =
      l?.x ?? sequence.lifelines.find((l) => l.id === m?.target)?.x ?? 300;
    const y = m?.y ?? f?.y ?? 70;
    const rect = root.current?.getBoundingClientRect();
    setView({
      x: (rect?.width || 800) / 2 - x * 0.9,
      y: (rect?.height || 600) / 2 - y * 0.9,
      scale: 0.9,
    });
  }, [focusToken, selected, sequence]);

  const start = (e: React.PointerEvent, id: string, kind: string) => {
    e.stopPropagation();
    select(id);
    if (readOnly) return;
    root.current?.setPointerCapture(e.pointerId);
    drag.current = {
      id,
      kind,
      x: e.clientX,
      y: e.clientY,
      startX: view.x,
      startY: view.y,
    };
  };
  return (
    <div className="canvas-inner sequence-canvas">
      <svg
        ref={root}
        width="100%"
        height="100%"
        aria-label="Sequence diagram canvas"
        onWheel={(e) => {
          const rect = root.current!.getBoundingClientRect();
          const scale = Math.max(
            0.2,
            Math.min(2, view.scale * (e.deltaY > 0 ? 0.9 : 1.1)),
          );
          const px = e.clientX - rect.left,
            py = e.clientY - rect.top;
          setView({
            scale,
            x: px - ((px - view.x) * scale) / view.scale,
            y: py - ((py - view.y) * scale) / view.scale,
          });
        }}
        onPointerDown={(e) => {
          if (e.target === e.currentTarget) {
            select(null);
            e.currentTarget.setPointerCapture(e.pointerId);
            drag.current = {
              id: "",
              kind: "pan",
              x: e.clientX,
              y: e.clientY,
              startX: view.x,
              startY: view.y,
            };
          }
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (!d) return;
          if (d.kind === "pan") {
            setView((v) => ({
              ...v,
              x: d.startX + e.clientX - d.x,
              y: d.startY + e.clientY - d.y,
            }));
            return;
          }
          const copy = structuredClone(sequence);
          if (d.kind === "lifeline") {
            const l = copy.lifelines.find((l) => l.id === d.id)!;
            l.x = Math.max(
              90,
              Math.round((l.x + (e.clientX - d.x) / view.scale) / 10) * 10,
            );
          } else {
            const item =
              d.kind === "message"
                ? copy.messages.find((m) => m.id === d.id)
                : copy.fragments.find((f) => f.id === d.id);
            if (item)
              item.y = Math.max(
                120,
                Math.round((item.y + (e.clientY - d.y) / view.scale) / 10) * 10,
              );
          }
          setPreview(copy);
        }}
        onPointerUp={() => {
          if (preview && !readOnly)
            update((p) => {
              const i = p.sequences.findIndex((s) => s.id === sequence.id);
              p.sequences[i] = preview;
            });
          drag.current = null;
          setPreview(null);
        }}
        onPointerCancel={() => {
          drag.current = null;
          setPreview(null);
        }}
      >
        <g transform={`translate(${view.x},${view.y}) scale(${view.scale})`}>
          <SequenceDrawing
            project={project}
            sequence={preview ?? sequence}
            selected={selected}
            select={select}
            beginDrag={start}
          />
        </g>
      </svg>
      <div className="sequence-controls">
        <button
          aria-label="Zoom in"
          onClick={() =>
            setView((v) => ({ ...v, scale: Math.min(2, v.scale * 1.2) }))
          }
        >
          <Plus size={17} />
        </button>
        <button
          aria-label="Zoom out"
          onClick={() =>
            setView((v) => ({ ...v, scale: Math.max(0.2, v.scale / 1.2) }))
          }
        >
          <Minus size={17} />
        </button>
        <button aria-label="Fit sequence to view" onClick={fit}>
          <Maximize size={17} />
        </button>
      </div>
      <span className="sequence-zoom">{Math.round(view.scale * 100)}%</span>
      {!sequence.lifelines.length && (
        <div className="empty-canvas">
          <h2>Add classes to bring this sequence to life.</h2>
          <p>Lifelines are created from your classes automatically.</p>
        </div>
      )}
    </div>
  );
}
