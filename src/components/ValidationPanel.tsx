import {
  AlertCircle,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { Issue } from "../validation/types";
interface Props {
  issues: Issue[];
  readOnly: boolean;
  navigate: (i: Issue) => void;
  fix: (i: Issue) => void;
}
export default function ValidationPanel({
  issues,
  readOnly,
  navigate,
  fix,
}: Props) {
  const errors = issues.filter((i) => i.severity === "error"),
    warnings = issues.filter((i) => i.severity === "warning");
  return (
    <section className="validation">
      <div className="validation-title">
        <ShieldCheck size={19} />
        <h2>Model check</h2>
        <span className="live-dot" title="Validation runs on every change" />
      </div>
      <p className="validation-subtitle">
        A second pair of eyes, as you build.
      </p>
      <div className="validation-counts">
        <div className={errors.length ? "has-errors" : ""}>
          <strong>{errors.length}</strong>
          <span>
            <AlertCircle size={13} /> Errors
          </span>
        </div>
        <div>
          <strong>{warnings.length}</strong>
          <span>
            <AlertTriangle size={13} /> Warnings
          </span>
        </div>
      </div>
      <div className="issue-scroll">
        {!issues.length ? (
          <div className="all-clear">
            <CheckCircle2 size={32} />
            <h3>Looking good.</h3>
            <p>No issues found. Your diagrams agree with each other.</p>
            <small>
              Automated checks support review; they don’t replace design
              judgment.
            </small>
          </div>
        ) : (
          <>
            {errors.length > 0 && (
              <div className="issue-group">
                <h3>
                  NEEDS YOUR ATTENTION <span>{errors.length}</span>
                </h3>
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
                <h3>
                  WORTH A LOOK <span>{warnings.length}</span>
                </h3>
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
      <div className="validation-footer">
        <span className="live-dot" /> All 10 rule groups checked continuously
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
        <span>{i.severity}</span>
      </div>
      <p>{i.message}</p>
      <button className="issue-location" onClick={() => navigate(i)}>
        {i.diagramId ? "Sequence diagram" : "Class diagram"}
        <ArrowUpRight size={13} />
      </button>
      {i.fix && !readOnly && (
        <button className="fix-button" onClick={() => fix(i)}>
          <Sparkles size={13} />
          {i.fix.kind === "rename-message"
            ? `Use ${i.fix.name}()`
            : `Use ${i.fix.value}`}
          <span>↵</span>
        </button>
      )}
    </article>
  );
}
