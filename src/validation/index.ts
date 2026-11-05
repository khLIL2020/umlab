import type { Project, Issue } from "./types";
import {
  methodExistence,
  signatureMismatch,
  multiplicity,
  duplicateNames,
  completeness,
  visibility,
  inheritance,
  orphanLifelines,
  isolatedClasses,
} from "./rules";
export function validateProject(project: Project): Issue[] {
  return [
    methodExistence,
    signatureMismatch,
    multiplicity,
    duplicateNames,
    completeness,
    visibility,
    inheritance,
    orphanLifelines,
    isolatedClasses,
  ].flatMap((rule) => rule(project));
}
