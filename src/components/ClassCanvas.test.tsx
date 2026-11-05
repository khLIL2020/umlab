// @vitest-environment jsdom
import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeAll, expect, it, vi } from "vitest";
import ClassCanvas from "./ClassCanvas";
import { sampleProject } from "../data/sampleProject";
beforeAll(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});
afterEach(cleanup);
it("keyboard selection opens properties and arrow movement enters project history", () => {
  const select = vi.fn(),
    update = vi.fn();
  const { container } = render(
    <ClassCanvas
      project={sampleProject}
      issues={[]}
      selected={null}
      focusToken={0}
      readOnly={false}
      select={select}
      update={update}
      connect={vi.fn()}
    />,
  );
  const node = container.querySelector('[data-id="member"]')!;
  fireEvent.keyDown(node, { key: "Enter" });
  expect(select).toHaveBeenCalledWith("member");
  fireEvent.keyDown(node, { key: "ArrowRight" });
  expect(update).toHaveBeenCalled();
  const next = structuredClone(sampleProject);
  update.mock.calls.at(-1)![0](next);
  expect(next.classes[0].position.x).toBe(
    sampleProject.classes[0].position.x + 20,
  );
});
it("reviewer permits keyboard selection but never diagram movement", () => {
  const select = vi.fn(),
    update = vi.fn();
  const { container } = render(
    <ClassCanvas
      project={sampleProject}
      issues={[]}
      selected={null}
      focusToken={0}
      readOnly
      select={select}
      update={update}
      connect={vi.fn()}
    />,
  );
  const node = container.querySelector('[data-id="member"]')!;
  fireEvent.keyDown(node, { key: "Enter" });
  expect(select).toHaveBeenCalledWith("member");
  fireEvent.keyDown(node, { key: "ArrowRight" });
  expect(update).not.toHaveBeenCalled();
});
