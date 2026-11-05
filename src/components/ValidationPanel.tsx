import {
  AlertCircle,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  PanelRightClose,
} from "lucide-react";
import type { Issue } from "../validation/types";
interface Props {
  issues: Issue[];
  readOnly: boolean;
  navigate: (i: Issue) => void;
  fix: (i: Issue) => void;
  onClose?: () => void;
}
export default function ValidationPanel({
  issues,
  readOnly,
  navigate,
  fix,
  onClose,
}: Props) {
  const errors = issues.filter((i) => i.severity === "error"),
    warnings = issues.filter((i) => i.severity === "warning");
  return (
    <section className="validation">
      <div className="validation-title">
        <h2>Model check</h2>
        <span className="validation-summary">
          {errors.length} errors · {warnings.length} warnings
        </span>
        {onClose && (
          <button
            type="button"
            className="button secondary fold-check-button"
            aria-label="Fold model check"
            onClick={onClose}
          >
            <PanelRightClose size={15} /> Fold
          </button>
        )}
      </div>
      <div className="issue-scroll">
        {!issues.length ? (
          <div className="all-clear">
            <CheckCircle2 size={28} />
            <h3>No issues</h3>
            <p>Class and sequence diagrams are consistent.</p>
          </div>
        ) : (
          <>
            {errors.length > 0 && (
              <div className="issue-group">
                <h3>Errors</h3>
                {errors.map((i) => (
                  <IssueCard
                    key={i.id}
                    issue={i}
                    readOnly={readOnly}
                    navigate={navigate}
                    fix={fix}
                  />
                ))}
              </div>
            )}
            {warnings.length > 0 && (
              <div className="issue-group">
                <h3>Warnings</h3>
                {warnings.map((i) => (
                  <IssueCard
                    key={i.id}
                    issue={i}
                    readOnly={readOnly}
                    navigate={navigate}
                    fix={fix}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
function IssueCard({
  issue: i,
  readOnly,
  navigate,
  fix,
}: {
  issue: Issue;
  readOnly: boolean;
  navigate: (i: Issue) => void;
  fix: (i: Issue) => void;
}) {
  return (
    <article className={`issue-card ${i.severity}`}>
      <div className="issue-card-heading">
        {i.severity === "error" ? (
          <AlertCircle size={15} />
        ) : (
          <AlertTriangle size={15} />
        )}
        <strong>{i.category}</strong>
      </div>
      <p>{i.message}</p>
      <div className="issue-actions">
        <button className="issue-location" onClick={() => navigate(i)}>
          Show on diagram
          <ArrowUpRight size={13} />
        </button>
        {i.fix && !readOnly && (
          <button className="fix-button" onClick={() => fix(i)}>
            {i.fix.kind === "rename-message"
              ? `Use ${i.fix.name}()`
              : i.fix.kind === "add-method"
                ? `Add ${i.fix.name}() to class`
                : `Use ${i.fix.value}`}
          </button>
        )}
      </div>
    </article>
  );
}
