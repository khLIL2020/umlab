import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { Box, MessageCircle } from "lucide-react";
import type { UMLClass } from "../validation/types";
export type ClassFlowNode = Node<
  { model: UMLClass; issueCount: number; comments: number },
  "umlClass"
>;
export default function ClassNode({
  data,
  selected,
}: NodeProps<ClassFlowNode>) {
  const c = data.model;
  return (
    <div className={`class-node ${selected ? "is-selected" : ""}`}>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      <header>
        <Box size={16} />
        <strong>{c.name || "Unnamed class"}</strong>
        {data.issueCount > 0 && (
          <span className="node-issue">! {data.issueCount}</span>
        )}
        {data.comments > 0 && (
          <span className="comment-badge">
            <MessageCircle size={12} />
            {data.comments}
          </span>
        )}
      </header>
      <div className="class-members">
        {c.attributes.length ? (
          c.attributes.map((a) => (
            <div key={a.id}>
              <span className="visibility">{a.visibility || "?"}</span>
              {a.name || "unnamed"}
              <span className="type">: {a.type || "?"}</span>
            </div>
          ))
        ) : (
          <span className="muted italic">No attributes</span>
        )}
      </div>
      <div className="class-members">
        {c.methods.length ? (
          c.methods.map((m) => (
            <div key={m.id}>
              <span className="visibility">{m.visibility || "?"}</span>
              {m.name}(
              {m.parameters.map((p) => `${p.name}: ${p.type}`).join(", ")})
              <span className="type">: {m.returnType || "?"}</span>
            </div>
          ))
        ) : (
          <span className="muted italic">No methods</span>
        )}
      </div>
    </div>
  );
}
