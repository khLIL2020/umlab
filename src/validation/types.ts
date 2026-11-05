export type Visibility = "+" | "-" | "#" | "";
export interface Parameter {
  name: string;
  type: string;
}
export interface Attribute {
  id: string;
  name: string;
  type: string;
  visibility: Visibility;
}
export interface Method {
  id: string;
  name: string;
  parameters: Parameter[];
  returnType: string;
  visibility: Visibility;
}
export interface UMLClass {
  id: string;
  name: string;
  attributes: Attribute[];
  methods: Method[];
  position: { x: number; y: number };
}
export type RelationshipKind =
  | "association"
  | "aggregation"
  | "composition"
  | "inheritance"
  | "dependency"
  | "realization";
export interface Relationship {
  id: string;
  source: string;
  target: string;
  kind: RelationshipKind;
  name: string;
  sourceRole: string;
  targetRole: string;
  sourceMultiplicity: string;
  targetMultiplicity: string;
}
export interface Lifeline {
  id: string;
  classId: string;
  name: string;
  x: number;
}
export interface Argument {
  value: string;
  type: string;
}
export interface Message {
  id: string;
  source: string;
  target: string;
  name: string;
  arguments: Argument[];
  kind: "sync" | "async" | "return";
  y: number;
  activation: boolean;
}
export interface Fragment {
  id: string;
  kind: "alt" | "opt";
  guard: string;
  elseGuard: string;
  y: number;
  height: number;
}
export interface SequenceDiagram {
  id: string;
  name: string;
  lifelines: Lifeline[];
  messages: Message[];
  fragments: Fragment[];
}
export interface Comment {
  id: string;
  elementId: string;
  diagramId?: string;
  text: string;
}
export interface Project {
  version: 1;
  name: string;
  classes: UMLClass[];
  relationships: Relationship[];
  sequences: SequenceDiagram[];
  comments: Comment[];
}
export type Category =
  | "Methods"
  | "Signatures"
  | "Multiplicity"
  | "Names"
  | "Completeness"
  | "Visibility"
  | "Inheritance"
  | "Lifelines"
  | "Structure";
export type Fix =
  | {
      kind: "rename-message";
      diagramId: string;
      messageId: string;
      name: string;
    }
  | {
      kind: "multiplicity";
      relationshipId: string;
      end: "source" | "target";
      value: string;
    }
  | {
      kind: "add-method";
      classId: string;
      name: string;
      parameters: Parameter[];
      returnType: string;
    };
export interface Issue {
  id: string;
  severity: "error" | "warning";
  category: Category;
  message: string;
  elementId: string;
  diagramId?: string;
  fix?: Fix;
}
