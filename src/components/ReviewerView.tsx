import {
  CheckCircle2,
  Circle,
  ClipboardList,
  Copy,
  Printer,
} from "lucide-react";
import type { Project, Issue } from "../validation/types";
import { reportText, rubric } from "../lib/export";
export default function ReviewerView({
  project,
  issues,
  notify,
}: {
  project: Project;
  issues: Issue[];
  notify: (s: string) => void;
}) {
  const categories = [
    "Methods",
    "Signatures",
    "Multiplicity",
    "Names",
    "Completeness",
    "Visibility",
    "Inheritance",
    "Lifelines",
    "Structure",
  ];
  return (
    <aside className="reviewer-panel">
      <div className="reviewer-title">
        <ClipboardList size={20} />
        <h2>Review overview</h2>
      </div>
      <p className="helper">
        The model at a glance. Select any element to pin a comment.
      </p>
      <div className="review-total">
        <strong>
          {issues.filter((i) => i.severity === "error").length}
          <span>errors</span>
        </strong>
        <strong>
          {issues.filter((i) => i.severity === "warning").length}
          <span>warnings</span>
        </strong>
      </div>
      <table className="category-table">
        <thead>
          <tr>
            <th>Category</th>
            <th>Errors</th>
            <th>Warn.</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((c) => (
            <tr key={c}>
              <td>{c}</td>
              <td>
                {
                  issues.filter(
                    (i) => i.category === c && i.severity === "error",
                  ).length
                }
              </td>
              <td>
                {
                  issues.filter(
                    (i) => i.category === c && i.severity === "warning",
                  ).length
                }
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <h3 className="section-title mt-6">REVIEW CHECKLIST</h3>
      {rubric(project, issues).map((r) => (
        <div className="rubric-item" key={r.label}>
          {r.pass ? (
            <CheckCircle2 size={18} className="text-emerald-700" />
          ) : (
            <Circle size={18} />
          )}
          <div>
            <small>{r.assignment}</small>
            <strong>{r.label}</strong>
            <p>{r.detail}</p>
          </div>
        </div>
      ))}
      <p className="helper">
        Manual review still needed: domain accuracy, responsibilities, use-case
        coverage, and design quality. This is not an official rubric or an
        automatic grade.
      </p>
      <div className="review-actions">
        <button
          className="button secondary"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(reportText(project, issues));
              notify("Review report copied.");
            } catch {
              notify(
                "Clipboard unavailable. Select and copy the report below.",
              );
            }
          }}
        >
          <Copy size={14} /> Copy report
        </button>
        <button className="button secondary" onClick={() => window.print()}>
          <Printer size={14} /> Print
        </button>
      </div>
      <details className="report-details">
        <summary>Plain-text report</summary>
        <textarea
          readOnly
          aria-label="Plain-text review report"
          value={reportText(project, issues)}
        />
      </details>
    </aside>
  );
}
