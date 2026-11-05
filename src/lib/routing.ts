import { getSmoothStepPath, Position } from "@xyflow/react";
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}
export function relationshipRoute(a: Rect, b: Rect) {
  const horizontal =
    Math.abs(b.x + b.width / 2 - (a.x + a.width / 2)) >
    Math.abs(b.y + b.height / 2 - (a.y + a.height / 2));
  const forward = horizontal ? b.x > a.x : b.y > a.y;
  const sourcePosition = horizontal
    ? forward
      ? Position.Right
      : Position.Left
    : forward
      ? Position.Bottom
      : Position.Top;
  const targetPosition = horizontal
    ? forward
      ? Position.Left
      : Position.Right
    : forward
      ? Position.Top
      : Position.Bottom;
  const x1 = horizontal ? a.x + (forward ? a.width : 0) : a.x + a.width / 2;
  const y1 = horizontal ? a.y + a.height / 2 : a.y + (forward ? a.height : 0);
  const x2 = horizontal ? b.x + (forward ? 0 : b.width) : b.x + b.width / 2;
  const y2 = horizontal ? b.y + b.height / 2 : b.y + (forward ? 0 : b.height);
  const [path, labelX, labelY] = getSmoothStepPath({
    sourceX: x1,
    sourceY: y1,
    targetX: x2,
    targetY: y2,
    sourcePosition,
    targetPosition,
    borderRadius: 6,
    offset: 30,
  });
  return { x1, y1, x2, y2, path, labelX, labelY };
}
