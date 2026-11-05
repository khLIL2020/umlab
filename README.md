# UMLab

A browser-only UML workbench for Georgia Tech CS-2340 students and reviewers. Build class and sequence diagrams, catch inconsistencies as you work, and review a submission with actionable comments. MIT licensed; no account, server, database, analytics, or paid hosting required.

**Live site:** [https://khlil2020.github.io/umlab/](https://khlil2020.github.io/umlab/)

## Run locally

Requires Node.js 22.12+ (or a supported newer version) and npm.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. All diagram data stays in your browser's localStorage. Each browser and origin has its own copy: export/import JSON to move work between local and hosted instances.

```sh
npm test          # pure validation, history, import and export tests
npm run build    # TypeScript checks and production build in dist/
npm run preview  # preview the production build
npm run format   # format source files
```

## Use UMLab

1. **Start with the sample.** Four library classes and a borrow-book sequence load on first use. There is exactly one deliberate error: `checkout()` should be `checkOut()`. The Model check panel offers a one-click fix.
2. **Build a class diagram.** Add a class from the left palette. Select a class to edit its name, attributes, visibility, method parameters and return types. Parameters use `name: Type, name: Type`; press Enter or leave the field to apply. Add relationships from the palette, then choose source and target in Properties, or connect node handles. Association, aggregation, composition, inheritance, dependency and realization are supported. The source is the child in inheritance and the whole in aggregation/composition. Multiplicities have preset suggestions and accept freehand values for validation.
3. **Add a sequence.** Use the + next to Diagrams. Classes become lifelines automatically, including classes added later. “Sync class lifelines” restores any deleted class lifelines. Select a message to choose sender, receiver, synchronous/asynchronous/return type and activation bar. The receiving method dropdown includes inherited methods. You may also type the name freehand. Arguments use `value: Type, value: Type`; omit a type when unknown. Self-calls use the same sender and receiver. Add alt/opt fragments and edit guards and height. Drag lifelines horizontally, messages and fragments vertically; pan and zoom the canvas. Rename or delete a sequence under Project settings.
4. **Read Model check.** Validation runs after every model change. Errors and warnings have plain-language explanations and an element reference. Click the diagram link to select and center the affected element. Where unambiguous, apply the suggested fix. Return messages are response values rather than calls and are exempt from method lookup. Argument types are checked when supplied; this is not a programming-language type checker.
5. **Review.** Switch to Reviewer for a read-only canvas, category counts and an automatic checklist aligned with Assignments 2 and 3. Click an element to attach a comment pin. Comments are the only writable content in Reviewer mode. Copy the report, select its plain text, or print/save to PDF using the browser print dialog. The checklist is a review aid, not an official grading rubric; domain accuracy, responsibilities and use-case coverage require human review.
6. **Save and share.** Autosave runs after every change. Export Project JSON for an editable backup, or PNG/SVG for the full active diagram. JSON includes all diagrams and comments. SVG uses native vector shapes and text, with no embedded HTML or remote assets. PNG uses the same complete diagram. SVG is preferable for very large models; PNG is bounded to 12,000 pixels per side and 32 million pixels. Import validates structure, IDs and file size before replacing the current project; undo restores the previous project.

Use Export → New empty project or Load library sample to start over; either action can be undone. Browser storage can be cleared by the browser or unavailable in private/limited environments. A visible warning appears if saving fails. Keep JSON backups of important work. Corrupt stored data is preserved rather than overwritten; export the current work, clear the site's local storage in browser settings and re-import to restore autosave.

### Keyboard controls

All buttons and form controls are keyboard accessible. Tab to focus a class, relationship, lifeline or message and press Enter to select it. React Flow provides arrow-key class movement in Builder mode. Shortcuts outside text fields:

| Shortcut             | Action                     |
| -------------------- | -------------------------- |
| Delete / Backspace   | Delete selected element    |
| Ctrl/Cmd + Z         | Undo                       |
| Ctrl/Cmd + Shift + Z | Redo                       |
| Ctrl/Cmd + D         | Duplicate selected element |
| Escape               | Deselect                   |

History keeps the last 100 edits for the current session, including add, edit, delete, drag, import, comments and fixes. Reload keeps the project, but resets history. Deleting a class removes its relationships and preserves orphan lifelines so the validator can explain what needs repair.

## Deploy to GitHub Pages

1. Create a public GitHub repository, preferably `umlab`, and push this folder to its `main` branch.
2. In repository **Settings → Pages → Build and deployment**, select **GitHub Actions**.
3. The included `.github/workflows/deploy.yml` runs tests and a static build on every push to `main` (or manual dispatch), then publishes `dist/` using Pages.
4. Find the verified site URL in the Actions deployment result and update the Live site link above.

`vite.config.ts` uses `base: './'`. Vite emits relative asset URLs, so `/umlab/` (or any repository subpath) works without hardcoding an owner or repository name. This also lets the **identical dist output** run at a domain root on Netlify or Vercel. Upload/deploy `dist/` as a static site; there is no routing, redirect configuration, backend or hosting-specific runtime. Use the canonical Pages URL with its trailing slash.

## Code and contribution

- `src/validation/types.ts`: serializable model and issue/fix contracts.
- `src/validation/rules.ts`: pure rules; `index.ts` runs them. No validation in React components.
- `src/store/`: bounded undo/redo, browser persistence, strict JSON schema, pure fixes/deletions/duplication.
- `src/components/`: canvases, palette, property editor, toolbar, validation and reviewer panels.
- `src/data/sampleProject.ts`: documented one-error fixture.
- `src/lib/export.tsx`: standalone SVG/PNG and text report generation.

To contribute, fork the repository, create a focused branch, and include a failing regression test for changed model/validation behavior. Run `npm test` and `npm run build`, check keyboard behavior and both modes, then open a pull request describing the problem, solution and validation. Keep logic pure and browser-only. Use case diagrams, automatic grading, accounts, collaboration and LMS integrations are outside the current scope.

UMLab is an independent student tool, not an official Georgia Tech product.
