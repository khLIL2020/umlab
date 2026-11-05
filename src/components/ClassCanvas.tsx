import { useEffect, useMemo, useState, useRef } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  Position,
  ConnectionMode,
  type EdgeProps,
  type Edge,
  type ReactFlowInstance,
  type Connection,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import ClassNode, { type ClassFlowNode } from "./ClassNode";
import type {
  Project,
  Issue,
  Relationship,
  RelationshipKind,
} from "../validation/types";
type RelEdge = Edge<{ model: Relationship }, "relationship">;
function RelationshipEdge(props: EdgeProps<RelEdge>) {
  const r = props.data!.model;
  const [path, x, y] = getSmoothStepPath(props);
  const association = ["association", "aggregation", "composition"].includes(
    r.kind,
  );
  return (
    <>
      <BaseEdge
        path={path}
        style={{
          stroke: props.selected ? "#a1741b" : "#8792a4",
          strokeWidth: props.selected ? 2.5 : 1.4,
          strokeDasharray: ["dependency", "realization"].includes(r.kind)
            ? "6 5"
            : undefined,
        }}
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
      <EdgeLabelRenderer>
        <span
          className="edge-label nodrag nopan"
          style={{
            transform: `translate(-50%, -50%) translate(${x}px,${y}px)`,
          }}
        >
          {r.name || r.kind}
        </span>
        {association && (
          <>
            <span
              className="edge-end"
              style={{
                transform: `translate(${props.sourceX + 12}px,${props.sourceY - 27}px)`,
              }}
            >
              {r.sourceRole} {r.sourceMultiplicity || "?"}
            </span>
            <span
              className="edge-end"
              style={{
                transform: `translate(${props.targetX - 16}px,${props.targetY + 12}px) translateX(-100%)`,
              }}
            >
              {r.targetRole} {r.targetMultiplicity || "?"}
            </span>
          </>
        )}
      </EdgeLabelRenderer>
    </>
  );
}
const nodeTypes = { umlClass: ClassNode };
const edgeTypes = { relationship: RelationshipEdge };
export function UMLMarkers() {
  return (
    <defs>
      <marker
        id="uml-triangle"
        viewBox="0 0 14 14"
        refX="13"
        refY="7"
        markerWidth="14"
        markerHeight="14"
        orient="auto-start-reverse"
      >
        <path d="M1 1 L13 7 L1 13 Z" fill="white" stroke="#67758b" />
      </marker>
      <marker
        id="uml-arrow"
        viewBox="0 0 12 12"
        refX="11"
        refY="6"
        markerWidth="12"
        markerHeight="12"
        orient="auto"
      >
        <path d="M1 1 L11 6 L1 11" fill="none" stroke="#67758b" />
      </marker>
      {["diamond", "filled-diamond"].map((kind) => (
        <marker
          key={kind}
          id={"uml-" + kind}
          viewBox="0 0 20 12"
          refX="1"
          refY="6"
          markerWidth="20"
          markerHeight="12"
          orient="auto"
        >
          <path
            d="M1 6 L10 1 L19 6 L10 11 Z"
            fill={kind === "diamond" ? "white" : "#67758b"}
            stroke="#67758b"
          />
        </marker>
      ))}
    </defs>
  );
}
interface Props {
  project: Project;
  issues: Issue[];
  selected: string | null;
  focusToken: number;
  readOnly: boolean;
  connectKind: RelationshipKind | null;
  connectFrom: string | null;
  select: (id: string | null) => void;
  update: (recipe: (p: Project) => void) => void;
  connect: (c: Connection) => void;
  onClassPick: (id: string) => void;
}
export default function ClassCanvas({
  project,
  issues,
  selected,
  focusToken,
  readOnly,
  connectKind,
  connectFrom,
  select,
  update,
  connect,
  onClassPick,
}: Props) {
  const [instance, setInstance] = useState<ReactFlowInstance<
    ClassFlowNode,
    RelEdge
  > | null>(null);
  const models = useMemo(
    () =>
      project.classes.map((c) => ({
        id: c.id,
        type: "umlClass" as const,
        position: c.position,
        selected: c.id === selected || c.id === connectFrom,
        data: {
          model: c,
          issueCount: issues.filter((i) => i.elementId === c.id).length,
          comments: project.comments.filter((x) => x.elementId === c.id).length,
          connectReady: !!connectKind,
          connectFrom: c.id === connectFrom,
        },
      })),
    [project, issues, selected, connectKind, connectFrom],
  );
  const lastFocus = useRef(-1);
  const [nodes, setNodes] = useState(models);
  useEffect(() => setNodes(models), [models]);
  useEffect(() => {
    if (
      !instance ||
      !selected ||
      !focusToken ||
      lastFocus.current === focusToken
    )
      return;
    lastFocus.current = focusToken;
    const c = project.classes.find((c) => c.id === selected);
    const r = project.relationships.find((r) => r.id === selected);
    const ids = c ? [c.id] : r ? [r.source, r.target] : [];
    if (ids.length)
      void instance.fitView({
        nodes: ids.map((id) => ({ id })),
        duration: 350,
        padding: 0.6,
        maxZoom: 1.25,
      });
  }, [focusToken, instance, selected, project.classes, project.relationships]);
  const edges: RelEdge[] = project.relationships.map((r) => ({
    id: r.id,
    source: r.source,
    target: r.target,
    type: "relationship",
    selected: r.id === selected,
    data: { model: r },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  }));
  return (
    <div
      className="canvas-inner"
      onKeyDownCapture={(e) => {
        const element = (e.target as Element).closest("[data-id]");
        const id = element?.getAttribute("data-id");
        if (!id) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.stopPropagation();
          if (connectKind) onClassPick(id);
          else select(id);
          return;
        }
        const delta: Record<string, [number, number]> = {
          ArrowLeft: [-20, 0],
          ArrowRight: [20, 0],
          ArrowUp: [0, -20],
          ArrowDown: [0, 20],
        };
        if (delta[e.key]) {
          e.preventDefault();
          e.stopPropagation();
          if (!readOnly)
            update((p) => {
              const c = p.classes.find((c) => c.id === id);
              if (c) {
                c.position.x += delta[e.key][0];
                c.position.y += delta[e.key][1];
              }
            });
        }
      }}
    >
      <svg className="absolute pointer-events-none" width="0" height="0">
        <UMLMarkers />
      </svg>
      <ReactFlow<ClassFlowNode, RelEdge>
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onInit={setInstance}
        onNodesChange={(changes) =>
          setNodes((ns) =>
            ns.map((n) => {
              const change = changes.find(
                (c) => c.type === "position" && c.id === n.id,
              );
              return change?.type === "position" && change.position
                ? { ...n, position: change.position }
                : n;
            }),
          )
        }
        onNodeDragStop={(_, n) => {
          if (!readOnly)
            update((p) => {
              const c = p.classes.find((c) => c.id === n.id);
              if (c) c.position = n.position;
            });
        }}
        onNodeClick={(_, n) => {
          if (connectKind) onClassPick(n.id);
          else select(n.id);
        }}
        onEdgeClick={(_, e) => select(e.id)}
        onPaneClick={() => select(null)}
        onConnect={connect}
        connectionMode={ConnectionMode.Loose}
        connectOnClick={!readOnly}
        nodesDraggable={!readOnly}
        nodesConnectable={!readOnly}
        edgesReconnectable={false}
        deleteKeyCode={null}
        snapToGrid
        snapGrid={[20, 20]}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.15}
        maxZoom={2}
        defaultEdgeOptions={{ type: "relationship" }}
      >
        <Background gap={22} size={1} color="#d4d9df" />
        <Controls showInteractive={false} />
        <MiniMap pannable zoomable nodeColor="#b2bdd0" maskColor="#f5f6f9a6" />
      </ReactFlow>
      {!project.classes.length && (
        <div className="empty-canvas">
          <BoxIcon />
          <h2>No classes yet</h2>
          <p>Add a class from the left panel to get started.</p>
        </div>
      )}
    </div>
  );
}
function BoxIcon() {
  return <span className="empty-symbol">◇</span>;
}
