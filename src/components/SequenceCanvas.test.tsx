// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import SequenceCanvas from "./SequenceCanvas";
import { sampleProject } from "../data/sampleProject";
afterEach(cleanup);
it("centers a requested message on initial mount instead of overriding with fit", () => {
  render(
    <SequenceCanvas
      project={sampleProject}
      sequence={sampleProject.sequences[0]}
      selected="s-checkout"
      focusToken={1}
      readOnly={false}
      select={vi.fn()}
      update={vi.fn()}
    />,
  );
  expect(screen.getByText("90%")).toBeTruthy();
});
