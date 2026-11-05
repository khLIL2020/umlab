import { z } from "zod";
const text = z.string(),
  id = z.string().min(1),
  number = z.number().finite();
const parameter = z.object({ name: text, type: text }).strict();
const member = { id, name: text, visibility: z.enum(["+", "-", "#", ""]) };
export const projectSchema = z
  .object({
    version: z.literal(1),
    name: text,
    classes: z.array(
      z
        .object({
          id,
          name: text,
          position: z.object({ x: number, y: number }).strict(),
          attributes: z.array(z.object({ ...member, type: text }).strict()),
          methods: z.array(
            z
              .object({
                ...member,
                parameters: z.array(parameter),
                returnType: text,
              })
              .strict(),
          ),
        })
        .strict(),
    ),
    relationships: z.array(
      z
        .object({
          id,
          source: id,
          target: id,
          kind: z.enum([
            "association",
            "aggregation",
            "composition",
            "inheritance",
            "dependency",
            "realization",
          ]),
          name: text,
          sourceRole: text,
          targetRole: text,
          sourceMultiplicity: text,
          targetMultiplicity: text,
        })
        .strict(),
    ),
    sequences: z.array(
      z
        .object({
          id,
          name: text,
          lifelines: z.array(
            z.object({ id, classId: text, name: text, x: number }).strict(),
          ),
          messages: z.array(
            z
              .object({
                id,
                source: id,
                target: id,
                name: text,
                arguments: z.array(
                  z.object({ value: text, type: text }).strict(),
                ),
                kind: z.enum(["sync", "async", "return"]),
                y: number,
                activation: z.boolean(),
              })
              .strict(),
          ),
          fragments: z.array(
            z
              .object({
                id,
                kind: z.enum(["alt", "opt"]),
                guard: text,
                elseGuard: text,
                y: number,
                height: z.number().finite().min(60),
              })
              .strict(),
          ),
        })
        .strict(),
    ),
    comments: z.array(
      z.object({ id, elementId: id, diagramId: id.optional(), text }).strict(),
    ),
  })
  .strict();
