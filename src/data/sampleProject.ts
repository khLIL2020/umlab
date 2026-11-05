import type { Project, Method, Attribute } from "../validation/types";
const a = (id: string, name: string, type: string): Attribute => ({
  id,
  name,
  type,
  visibility: "-",
});
const m = (
  id: string,
  name: string,
  params: string[],
  returnType: string,
): Method => ({
  id,
  name,
  parameters: params.map((p) => {
    const [name, type] = p.split(":");
    return { name, type };
  }),
  returnType,
  visibility: "+",
});
export const sampleProject: Project = {
  version: 1,
  name: "Library system",
  classes: [
    {
      id: "member",
      name: "Member",
      position: { x: 60, y: 70 },
      attributes: [
        a("member-id", "memberId", "String"),
        a("member-name", "name", "String"),
      ],
      methods: [
        m("borrow", "borrowBook", ["book:Book"], "Loan"),
        m("return", "returnBook", ["loan:Loan"], "void"),
      ],
    },
    {
      id: "library",
      name: "Library",
      position: { x: 460, y: 70 },
      attributes: [
        a("library-name", "name", "String"),
        a("catalog", "catalog", "List<Book>"),
      ],
      methods: [
        m("checkout", "checkOut", ["book:Book", "member:Member"], "Loan"),
        m("find", "findBook", ["isbn:String"], "Book"),
      ],
    },
    {
      id: "book",
      name: "Book",
      position: { x: 460, y: 410 },
      attributes: [
        a("isbn", "isbn", "String"),
        a("title", "title", "String"),
        a("available", "available", "boolean"),
      ],
      methods: [m("isAvailable", "isAvailable", [], "boolean")],
    },
    {
      id: "loan",
      name: "Loan",
      position: { x: 60, y: 410 },
      attributes: [
        a("due", "dueDate", "Date"),
        a("returned", "returned", "boolean"),
      ],
      methods: [
        m("close", "close", [], "void"),
        m("overdue", "isOverdue", [], "boolean"),
      ],
    },
  ],
  relationships: [
    {
      id: "r1",
      source: "member",
      target: "library",
      kind: "association",
      name: "borrows from",
      sourceRole: "members",
      targetRole: "library",
      sourceMultiplicity: "0..*",
      targetMultiplicity: "1",
    },
    {
      id: "r2",
      source: "library",
      target: "book",
      kind: "aggregation",
      name: "catalogs",
      sourceRole: "library",
      targetRole: "books",
      sourceMultiplicity: "1",
      targetMultiplicity: "0..*",
    },
    {
      id: "r3",
      source: "member",
      target: "loan",
      kind: "association",
      name: "holds",
      sourceRole: "borrower",
      targetRole: "loans",
      sourceMultiplicity: "1",
      targetMultiplicity: "0..*",
    },
    {
      id: "r4",
      source: "loan",
      target: "book",
      kind: "association",
      name: "records",
      sourceRole: "loans",
      targetRole: "book",
      sourceMultiplicity: "0..*",
      targetMultiplicity: "1",
    },
  ],
  sequences: [
    {
      id: "borrow-sequence",
      name: "Borrow a book",
      lifelines: [
        { id: "l-member", classId: "member", name: "member", x: 120 },
        { id: "l-library", classId: "library", name: "library", x: 370 },
        { id: "l-book", classId: "book", name: "book", x: 620 },
        { id: "l-loan", classId: "loan", name: "loan", x: 870 },
      ],
      messages: [
        {
          id: "s-checkout",
          source: "l-member",
          target: "l-library",
          name: "checkout",
          arguments: [
            { value: "book", type: "Book" },
            { value: "member", type: "Member" },
          ],
          kind: "sync",
          y: 170,
          activation: true,
        },
        {
          id: "s-available",
          source: "l-library",
          target: "l-book",
          name: "isAvailable",
          arguments: [],
          kind: "sync",
          y: 255,
          activation: true,
        },
        {
          id: "s-return",
          source: "l-book",
          target: "l-library",
          name: "true",
          arguments: [],
          kind: "return",
          y: 330,
          activation: false,
        },
        {
          id: "s-loan",
          source: "l-library",
          target: "l-member",
          name: "loan",
          arguments: [],
          kind: "return",
          y: 420,
          activation: false,
        },
      ],
      fragments: [],
    },
  ],
  comments: [],
};
