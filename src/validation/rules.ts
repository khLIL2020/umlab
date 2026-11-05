import type { Issue, Method, Project, UMLClass } from "./types";
const issue = (
  severity: Issue["severity"],
  category: Issue["category"],
  elementId: string,
  message: string,
  suffix = "",
): Issue => ({
  id: `${category}:${elementId}:${suffix || message}`,
  severity,
  category,
  elementId,
  message,
});
export function levenshtein(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const old = row[j];
      row[j] = Math.min(
        row[j] + 1,
        row[j - 1] + 1,
        prev + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      prev = old;
    }
  }
  return row[b.length];
}
export function availableMethods(
  p: Project,
  classId: string,
  visited = new Set<string>(),
): Method[] {
  if (visited.has(classId)) return [];
  visited.add(classId);
  return [
    ...(p.classes.find((c) => c.id === classId)?.methods ?? []),
    ...p.relationships
      .filter((r) => r.kind === "inheritance" && r.source === classId)
      .flatMap((r) => availableMethods(p, r.target, visited)),
  ];
}
function calls(p: Project) {
  return p.sequences.flatMap((s) =>
    s.messages
      .filter((m) => m.kind !== "return")
      .flatMap((m) => {
        const l = s.lifelines.find((l) => l.id === m.target);
        const c = p.classes.find((c) => c.id === l?.classId);
        return c ? [{ s, m, c, methods: availableMethods(p, c.id) }] : [];
      }),
  );
}
export function methodExistence(p: Project): Issue[] {
  return calls(p)
    .filter(({ m, methods }) => !methods.some((x) => x.name === m.name))
    .map(({ s, m, c, methods }) => {
      const suggestion = [...methods]
        .sort(
          (a, b) => levenshtein(m.name, a.name) - levenshtein(m.name, b.name),
        )
        .find(
          (x) =>
            x.name.toLowerCase() === m.name.toLowerCase() ||
            levenshtein(m.name, x.name) <= 2,
        );
      return {
        ...issue(
          "error",
          "Methods",
          m.id,
          `Method '${m.name}()' is called on ${c.name}, but ${c.name} has no such method.${suggestion ? ` Did you mean '${suggestion.name}()'?` : ""}`,
        ),
        diagramId: s.id,
        ...(suggestion
          ? {
              fix: {
                kind: "rename-message" as const,
                diagramId: s.id,
                messageId: m.id,
                name: suggestion.name,
              },
            }
          : {}),
      };
    });
}
function normalizedType(type: string) {
  const t = type.trim().toLowerCase();
  return ["int", "integer", "double", "float", "long", "number"].includes(t)
    ? "number"
    : t === "bool"
      ? "boolean"
      : t;
}
export function signatureMismatch(p: Project): Issue[] {
  return calls(p).flatMap(({ s, m, c, methods }) => {
    const matches = methods.filter((x) => x.name === m.name);
    if (
      !matches.length ||
      matches.some(
        (x) =>
          x.parameters.length === m.arguments.length &&
          x.parameters.every(
            (param, i) =>
              !m.arguments[i].type ||
              !param.type ||
              normalizedType(param.type) ===
                normalizedType(m.arguments[i].type),
          ),
      )
    )
      return [];
    return [
      {
        ...issue(
          "warning",
          "Signatures",
          m.id,
          `The arguments for ${c.name}.${m.name}() do not match any defined signature. Expected ${matches.map((x) => `(${x.parameters.map((a) => a.type || "?").join(", ")})`).join(" or ")}; received (${m.arguments.map((a) => a.type || "unknown").join(", ")}).`,
        ),
        diagramId: s.id,
      },
    ];
  });
}
export function multiplicity(p: Project): Issue[] {
  return p.relationships
    .filter((r) =>
      ["association", "aggregation", "composition"].includes(r.kind),
    )
    .flatMap((r) =>
      (["source", "target"] as const).flatMap((end) => {
        const value = r[`${end}Multiplicity`].trim();
        if (["1", "*", "0..1", "1..*", "0..*"].includes(value)) return [];
        const suggestion = /^(many|n|0\.\.n)$/i.test(value)
          ? "*"
          : /^(one|1\.\.1)$/i.test(value)
            ? "1"
            : null;
        return [
          {
            ...issue(
              "error",
              "Multiplicity",
              r.id,
              `${end === "source" ? "Source" : "Target"} end of ${r.name || "relationship"} ${value ? `has invalid multiplicity '${value}'` : "is missing a multiplicity"}. Use 1, *, 0..1, 1..*, or 0..*.${suggestion ? ` Use '${suggestion}' here.` : ""}`,
              end,
            ),
            ...(suggestion
              ? {
                  fix: {
                    kind: "multiplicity" as const,
                    relationshipId: r.id,
                    end,
                    value: suggestion,
                  },
                }
              : {}),
          },
        ];
      }),
    );
}
const signature = (m: Method) =>
  `${m.name}(${m.parameters.map((p) => p.type.trim()).join(",")})`;
export function duplicateNames(p: Project): Issue[] {
  const issues: Issue[] = [];
  const names = new Set<string>();
  for (const c of p.classes) {
    if (names.has(c.name.trim()))
      issues.push(
        issue(
          "error",
          "Names",
          c.id,
          `More than one class is named '${c.name}'. Give each class a unique name.`,
        ),
      );
    names.add(c.name.trim());
    const signatures = new Set<string>();
    for (const m of c.methods) {
      if (signatures.has(signature(m)))
        issues.push(
          issue(
            "error",
            "Names",
            c.id,
            `${c.name} defines '${signature(m)}' more than once.`,
            m.id,
          ),
        );
      signatures.add(signature(m));
    }
    for (const a of c.attributes)
      if (c.methods.some((m) => m.name === a.name))
        issues.push(
          issue(
            "warning",
            "Names",
            c.id,
            `${c.name} has an attribute and a method named '${a.name}'. Consider distinct names.`,
            a.id,
          ),
        );
  }
  return issues;
}
export function completeness(p: Project): Issue[] {
  const issues: Issue[] = [];
  for (const c of p.classes) {
    if (!c.name.trim())
      issues.push(
        issue(
          "error",
          "Completeness",
          c.id,
          "This class needs a name.",
          "name",
        ),
      );
    if (!c.attributes.length && !c.methods.length)
      issues.push(
        issue(
          "warning",
          "Completeness",
          c.id,
          `${c.name} has no attributes or methods.`,
        ),
      );
    for (const a of c.attributes) {
      if (!a.type.trim())
        issues.push(
          issue(
            "error",
            "Completeness",
            c.id,
            `Attribute '${a.name}' in ${c.name} needs a type.`,
            a.id,
          ),
        );
      if (!a.name.trim())
        issues.push(
          issue(
            "error",
            "Completeness",
            c.id,
            `${c.name} has an unnamed attribute.`,
            a.id + "name",
          ),
        );
    }
    for (const m of c.methods) {
      if (!m.returnType.trim() && m.name !== c.name)
        issues.push(
          issue(
            "warning",
            "Completeness",
            c.id,
            `Method '${m.name}()' in ${c.name} needs a return type (use void if it returns nothing).`,
            m.id,
          ),
        );
      if (!m.name.trim())
        issues.push(
          issue(
            "error",
            "Completeness",
            c.id,
            `${c.name} has an unnamed method.`,
            m.id + "name",
          ),
        );
    }
  }
  for (const r of p.relationships.filter((r) =>
    ["association", "aggregation", "composition"].includes(r.kind),
  ))
    if (!r.name.trim() && !r.sourceRole.trim() && !r.targetRole.trim())
      issues.push(
        issue(
          "warning",
          "Completeness",
          r.id,
          "This relationship has no name or role. Add one to explain how the classes relate.",
        ),
      );
  return issues;
}
export function visibility(p: Project): Issue[] {
  return p.classes.flatMap((c) =>
    [...c.attributes, ...c.methods]
      .filter((m) => !["+", "-", "#"].includes(m.visibility))
      .map((m) =>
        issue(
          "warning",
          "Visibility",
          c.id,
          `'${m.name}' in ${c.name} needs visibility: + public, - private, or # protected.`,
          m.id,
        ),
      ),
  );
}
export function inheritance(p: Project): Issue[] {
  const issues: Issue[] = [];
  const edges = p.relationships.filter((r) => r.kind === "inheritance");
  const reaches = (
    from: string,
    to: string,
    seen = new Set<string>(),
  ): boolean => {
    if (from === to) return true;
    if (seen.has(from)) return false;
    seen.add(from);
    return edges
      .filter((r) => r.source === from)
      .some((r) => reaches(r.target, to, seen));
  };
  for (const e of edges) {
    if (reaches(e.target, e.source))
      issues.push(
        issue(
          "error",
          "Inheritance",
          e.id,
          "This inheritance creates a cycle. A class cannot inherit from itself, even indirectly.",
        ),
      );
    const child = p.classes.find((c) => c.id === e.source);
    const parents = availableMethods(p, e.target);
    for (const m of child?.methods ?? []) {
      const named = parents.filter((pm) => pm.name === m.name);
      if (
        named.length &&
        !named.some(
          (pm) =>
            signature(pm) === signature(m) && pm.returnType === m.returnType,
        )
      )
        issues.push(
          issue(
            "warning",
            "Inheritance",
            child!.id,
            `${child!.name}.${m.name}() has a different signature from its parent. Check whether this override is intended.`,
            m.id,
          ),
        );
    }
  }
  return issues;
}
export function orphanLifelines(p: Project): Issue[] {
  return p.sequences.flatMap((s) => [
    ...s.lifelines
      .filter((l) => !p.classes.some((c) => c.id === l.classId))
      .map((l) => ({
        ...issue(
          "error",
          "Lifelines",
          l.id,
          `Lifeline '${l.name}' refers to a class that no longer exists.`,
        ),
        diagramId: s.id,
      })),
    ...s.messages
      .filter(
        (m) =>
          ![m.source, m.target].every((id) =>
            s.lifelines.some((l) => l.id === id),
          ),
      )
      .map((m) => ({
        ...issue(
          "error",
          "Lifelines",
          m.id,
          `Message '${m.name}' has a missing sender or receiver lifeline.`,
        ),
        diagramId: s.id,
      })),
  ]);
}
export function isolatedClasses(p: Project): Issue[] {
  return p.classes
    .filter(
      (c) =>
        !p.relationships.some(
          (r) =>
            r.source !== r.target &&
            (r.source === c.id || r.target === c.id) &&
            p.classes.some((x) => x.id === r.source) &&
            p.classes.some((x) => x.id === r.target),
        ),
    )
    .map((c: UMLClass) =>
      issue(
        "warning",
        "Structure",
        c.id,
        `${c.name} has no relationships to another class. Connect it or check whether it belongs in this model.`,
      ),
    );
}
