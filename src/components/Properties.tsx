import { useEffect, useState } from "react";
import { Plus, Trash2, Copy, X, MessageSquare } from "lucide-react";
import type {
  Project,
  Visibility,
  RelationshipKind,
  UMLClass,
  SequenceDiagram,
} from "../validation/types";
import { uid } from "../store/diagramStore";
import { availableMethods } from "../validation/rules";
export function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}
function DraftField({
  label,
  value,
  onCommit,
  placeholder,
}: {
  label: string;
  value: string;
  onCommit: (v: string) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  return (
    <label className="field">
      <span>{label}</span>
      <input
        value={draft}
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => onCommit(draft)}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
      />
      <small>Press Enter or leave the field to apply.</small>
    </label>
  );
}
function Select({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {children}
      </select>
    </label>
  );
}
const visOptions = (
  <>
    <option value="+">+ public</option>
    <option value="-">− private</option>
    <option value="#"># protected</option>
    <option value="">Unspecified</option>
  </>
);
interface Props {
  project: Project;
  selected: string;
  diagramId: string;
  readOnly: boolean;
  update: (recipe: (p: Project) => void) => void;
  remove: () => void;
  duplicate: () => void;
  close: () => void;
}
export default function Properties({
  project,
  selected,
  diagramId,
  readOnly,
  update,
  remove,
  duplicate,
  close,
}: Props) {
  const [comment, setComment] = useState("");
  useEffect(() => setComment(""), [selected]);
  const c = project.classes.find((c) => c.id === selected),
    r = project.relationships.find((r) => r.id === selected),
    s = project.sequences.find((s) => s.id === diagramId),
    m = s?.messages.find((m) => m.id === selected),
    l = s?.lifelines.find((l) => l.id === selected),
    f = s?.fragments.find((f) => f.id === selected);
  const editClass = (recipe: (c: UMLClass) => void) =>
    update((p) => {
      const target = p.classes.find((c) => c.id === selected);
      if (target) recipe(target);
    });
  const editRel = (key: keyof NonNullable<typeof r>, value: string) =>
    update((p) => {
      const target = p.relationships.find((r) => r.id === selected);
      if (target) Object.assign(target, { [key]: value });
    });
  const editSequence = (recipe: (s: SequenceDiagram) => void) =>
    update((p) => {
      const target = p.sequences.find((s) => s.id === diagramId);
      if (target) recipe(target);
    });
  const label =
    c?.name || r?.name || m?.name || l?.name || f?.kind || "Element";
  if (!c && !r && !m && !l && !f) return null;
  return (
    <section className="properties">
      <div className="panel-heading">
        <h3>{readOnly ? "Review element" : "Properties"}</h3>
        <button
          className="icon-button"
          aria-label="Close properties"
          onClick={close}
        >
          <X size={16} />
        </button>
      </div>
      <div className="property-scroll">
        <div className="element-heading">
          <span className="eyebrow">
            {c
              ? "Class"
              : r
                ? "Relationship"
                : m
                  ? "Message"
                  : l
                    ? "Lifeline"
                    : "Fragment"}
          </span>
          <h3>{label}</h3>
        </div>
        {!readOnly && (
          <>
            {c && (
              <>
                <Field
                  label="Class name"
                  value={c.name}
                  onChange={(name) =>
                    editClass((c) => {
                      c.name = name;
                    })
                  }
                />
                <h4>
                  Attributes{" "}
                  <button
                    aria-label="Add attribute"
                    onClick={() =>
                      editClass((c) =>
                        c.attributes.push({
                          id: uid(),
                          name: "attribute",
                          type: "String",
                          visibility: "-",
                        }),
                      )
                    }
                  >
                    <Plus size={15} />
                  </button>
                </h4>
                {c.attributes.map((a) => (
                  <div className="member-editor" key={a.id}>
                    <div className="row">
                      <Select
                        label="Visibility"
                        value={a.visibility}
                        onChange={(v) =>
                          editClass((c) => {
                            c.attributes.find(
                              (x) => x.id === a.id,
                            )!.visibility = v as Visibility;
                          })
                        }
                      >
                        {visOptions}
                      </Select>
                      <button
                        className="icon-button danger"
                        aria-label={`Delete attribute ${a.name}`}
                        onClick={() =>
                          editClass((c) => {
                            c.attributes = c.attributes.filter(
                              (x) => x.id !== a.id,
                            );
                          })
                        }
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <Field
                      label="Attribute name"
                      value={a.name}
                      onChange={(v) =>
                        editClass((c) => {
                          c.attributes.find((x) => x.id === a.id)!.name = v;
                        })
                      }
                    />
                    <Field
                      label="Type"
                      value={a.type}
                      onChange={(v) =>
                        editClass((c) => {
                          c.attributes.find((x) => x.id === a.id)!.type = v;
                        })
                      }
                    />
                  </div>
                ))}
                <h4>
                  Methods{" "}
                  <button
                    aria-label="Add method"
                    onClick={() =>
                      editClass((c) =>
                        c.methods.push({
                          id: uid(),
                          name: "method",
                          parameters: [],
                          returnType: "void",
                          visibility: "+",
                        }),
                      )
                    }
                  >
                    <Plus size={15} />
                  </button>
                </h4>
                {c.methods.map((m) => (
                  <div className="member-editor" key={m.id}>
                    <div className="row">
                      <Select
                        label="Visibility"
                        value={m.visibility}
                        onChange={(v) =>
                          editClass((c) => {
                            c.methods.find((x) => x.id === m.id)!.visibility =
                              v as Visibility;
                          })
                        }
                      >
                        {visOptions}
                      </Select>
                      <button
                        className="icon-button danger"
                        aria-label={`Delete method ${m.name}`}
                        onClick={() =>
                          editClass((c) => {
                            c.methods = c.methods.filter((x) => x.id !== m.id);
                          })
                        }
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <Field
                      label="Method name"
                      value={m.name}
                      onChange={(v) =>
                        editClass((c) => {
                          c.methods.find((x) => x.id === m.id)!.name = v;
                        })
                      }
                    />
                    <DraftField
                      label="Parameters (name: type, …)"
                      value={m.parameters
                        .map((p) => `${p.name}: ${p.type}`)
                        .join(", ")}
                      placeholder="book: Book, member: Member"
                      onCommit={(v) =>
                        editClass((c) => {
                          c.methods.find((x) => x.id === m.id)!.parameters =
                            v.trim()
                              ? v.split(",").map((part) => {
                                  const [name, ...type] = part.split(":");
                                  return {
                                    name: name.trim(),
                                    type: type.join(":").trim(),
                                  };
                                })
                              : [];
                        })
                      }
                    />
                    <Field
                      label="Return type"
                      value={m.returnType}
                      onChange={(v) =>
                        editClass((c) => {
                          c.methods.find((x) => x.id === m.id)!.returnType = v;
                        })
                      }
                    />
                  </div>
                ))}
              </>
            )}
            {r && (
              <>
                <Select
                  label="Relationship type"
                  value={r.kind}
                  onChange={(v) => editRel("kind", v as RelationshipKind)}
                >
                  {[
                    "association",
                    "aggregation",
                    "composition",
                    "inheritance",
                    "dependency",
                    "realization",
                  ].map((k) => (
                    <option key={k}>{k}</option>
                  ))}
                </Select>
                <Field
                  label="Relationship name"
                  value={r.name}
                  onChange={(v) => editRel("name", v)}
                />
                {(["source", "target"] as const).map((end) => (
                  <div className="member-editor" key={end}>
                    <Select
                      label={
                        end === "source"
                          ? "Source / child / whole"
                          : "Target / parent / part"
                      }
                      value={r[end]}
                      onChange={(v) => editRel(end, v)}
                    >
                      {project.classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </Select>
                    {["association", "aggregation", "composition"].includes(
                      r.kind,
                    ) && (
                      <>
                        <Field
                          label={`${end} role`}
                          value={r[`${end}Role`]}
                          onChange={(v) => editRel(`${end}Role`, v)}
                        />
                        <label className="field">
                          <span>{end} multiplicity</span>
                          <input
                            list="multiplicities"
                            aria-label={`${end} multiplicity`}
                            value={r[`${end}Multiplicity`]}
                            onChange={(e) =>
                              editRel(`${end}Multiplicity`, e.target.value)
                            }
                          />
                        </label>
                      </>
                    )}
                  </div>
                ))}
                <datalist id="multiplicities">
                  {["0..1", "1", "0..*", "1..*", "*"].map((v) => (
                    <option key={v} value={v} />
                  ))}
                </datalist>
              </>
            )}
            {m && s && (
              <>
                {(["source", "target"] as const).map((end) => (
                  <Select
                    key={end}
                    label={end === "source" ? "From lifeline" : "To lifeline"}
                    value={m[end]}
                    onChange={(v) =>
                      editSequence((s) => {
                        s.messages.find((x) => x.id === m.id)![end] = v;
                      })
                    }
                  >
                    {s.lifelines.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}:{" "}
                        {project.classes.find((c) => c.id === l.classId)
                          ?.name || "missing"}
                      </option>
                    ))}
                  </Select>
                ))}
                <Select
                  label="Message type"
                  value={m.kind}
                  onChange={(v) =>
                    editSequence((s) => {
                      s.messages.find((x) => x.id === m.id)!.kind =
                        v as typeof m.kind;
                    })
                  }
                >
                  <option value="sync">Synchronous</option>
                  <option value="async">Asynchronous</option>
                  <option value="return">Return</option>
                </Select>
                {m.kind !== "return" && (
                  <Select
                    label="Choose receiving method"
                    value=""
                    onChange={(v) => {
                      const receiver = s.lifelines.find(
                        (l) => l.id === m.target,
                      );
                      const method = availableMethods(
                        project,
                        receiver?.classId ?? "",
                      ).find((x) => x.id === v);
                      if (method)
                        editSequence((s) => {
                          const target = s.messages.find((x) => x.id === m.id)!;
                          target.name = method.name;
                          target.arguments = method.parameters.map((p) => ({
                            value: p.name,
                            type: p.type,
                          }));
                        });
                    }}
                  >
                    <option value="">Select a method…</option>
                    {availableMethods(
                      project,
                      s.lifelines.find((l) => l.id === m.target)?.classId ?? "",
                    ).map((x) => (
                      <option value={x.id} key={x.id}>
                        {x.name}({x.parameters.map((p) => p.type).join(", ")})
                      </option>
                    ))}
                  </Select>
                )}
                <Field
                  label={
                    m.kind === "return"
                      ? "Return value"
                      : "Message name (freehand)"
                  }
                  value={m.name}
                  onChange={(v) =>
                    editSequence((s) => {
                      s.messages.find((x) => x.id === m.id)!.name = v;
                    })
                  }
                />
                <DraftField
                  label="Arguments (value: type, …)"
                  value={m.arguments
                    .map((a) => (a.type ? `${a.value}: ${a.type}` : a.value))
                    .join(", ")}
                  onCommit={(v) =>
                    editSequence((s) => {
                      s.messages.find((x) => x.id === m.id)!.arguments =
                        v.trim()
                          ? v.split(",").map((part) => {
                              const [value, ...type] = part.split(":");
                              return {
                                value: value.trim(),
                                type: type.join(":").trim(),
                              };
                            })
                          : [];
                    })
                  }
                />
                <label className="check-field">
                  <input
                    type="checkbox"
                    checked={m.activation}
                    onChange={(e) =>
                      editSequence((s) => {
                        s.messages.find((x) => x.id === m.id)!.activation =
                          e.target.checked;
                      })
                    }
                  />{" "}
                  Show activation bar
                </label>
              </>
            )}
            {l && (
              <>
                <Field
                  label="Instance name"
                  value={l.name}
                  onChange={(v) =>
                    editSequence((s) => {
                      s.lifelines.find((x) => x.id === l.id)!.name = v;
                    })
                  }
                />
                <Select
                  label="Class"
                  value={l.classId}
                  onChange={(v) =>
                    editSequence((s) => {
                      s.lifelines.find((x) => x.id === l.id)!.classId = v;
                    })
                  }
                >
                  <option value="">External actor / UI</option>
                  {project.classes.map((c) => (
                    <option value={c.id} key={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </>
            )}
            {f && (
              <>
                <Select
                  label="Fragment type"
                  value={f.kind}
                  onChange={(v) =>
                    editSequence((s) => {
                      s.fragments.find((x) => x.id === f.id)!.kind = v as
                        "alt" | "opt";
                    })
                  }
                >
                  <option value="alt">alt — alternatives</option>
                  <option value="opt">opt — optional</option>
                </Select>
                <Field
                  label="Guard condition"
                  value={f.guard}
                  onChange={(v) =>
                    editSequence((s) => {
                      s.fragments.find((x) => x.id === f.id)!.guard = v;
                    })
                  }
                />
                {f.kind === "alt" && (
                  <Field
                    label="Else condition"
                    value={f.elseGuard}
                    onChange={(v) =>
                      editSequence((s) => {
                        s.fragments.find((x) => x.id === f.id)!.elseGuard = v;
                      })
                    }
                  />
                )}
                <label className="field">
                  <span>Height</span>
                  <input
                    type="number"
                    min="60"
                    value={f.height}
                    onChange={(e) =>
                      editSequence((s) => {
                        s.fragments.find((x) => x.id === f.id)!.height =
                          Math.max(60, Number(e.target.value) || 60);
                      })
                    }
                  />
                </label>
              </>
            )}
            <div className="property-actions">
              <button className="button secondary" onClick={duplicate}>
                <Copy size={14} /> Duplicate
              </button>
              <button className="button danger" onClick={remove}>
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </>
        )}
        <div className="comments">
          <h4>
            <MessageSquare size={15} /> Comment pins
          </h4>
          {project.comments
            .filter((c) => c.elementId === selected)
            .map((c) => (
              <div className="comment" key={c.id}>
                <p>{c.text}</p>
                <button
                  aria-label="Delete comment"
                  onClick={() =>
                    update((p) => {
                      p.comments = p.comments.filter((x) => x.id !== c.id);
                    })
                  }
                >
                  <X size={13} />
                </button>
              </div>
            ))}
          <label className="field">
            <span>Attach a comment to {label}</span>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={1000}
              placeholder="Leave a specific, actionable note…"
            />
          </label>
          <button
            className="button secondary"
            disabled={!comment.trim()}
            onClick={() => {
              update((p) =>
                p.comments.push({
                  id: uid(),
                  elementId: selected,
                  ...(diagramId !== "class" ? { diagramId } : {}),
                  text: comment.trim(),
                }),
              );
              setComment("");
            }}
          >
            <Plus size={14} /> Pin comment
          </button>
        </div>
      </div>
    </section>
  );
}
