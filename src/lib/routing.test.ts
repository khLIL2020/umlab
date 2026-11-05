import { expect, it } from "vitest";
import { Position } from "@xyflow/react";
import { handleIdFor, relationshipRoute } from "./routing";
it("uses facing outer boundaries when target is to the left", () => {
  const r = relationshipRoute(
    { x: 500, y: 50, width: 270, height: 160 },
    { x: 60, y: 50, width: 270, height: 160 },
  );
  expect(r.x1).toBe(500);
  expect(r.x2).toBe(330);
  expect(r.sourcePosition).toBe(Position.Left);
  expect(r.targetPosition).toBe(Position.Right);
});
it("uses vertical boundaries for stacked classes", () => {
  const r = relationshipRoute(
    { x: 50, y: 50, width: 270, height: 160 },
    { x: 50, y: 400, width: 270, height: 160 },
  );
  expect(r.y1).toBe(210);
  expect(r.y2).toBe(400);
  expect(handleIdFor(r.sourcePosition, "source")).toBe("bottom");
  expect(handleIdFor(r.targetPosition, "target")).toBe("top-t");
});
