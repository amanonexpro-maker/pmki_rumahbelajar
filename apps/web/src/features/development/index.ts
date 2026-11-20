/**
 * Development Domain Public API (11 §13).
 */
export const DOMAIN_NAME = "development" as const;

export {
  listDevelopmentCategories,
  listDevelopmentNoteRevisions,
  listDevelopmentNotesForWorkspace,
  upsertDevelopmentNote,
} from "./services/development-service";

export { upsertDevelopmentNoteAction } from "./actions/development-actions";

export {
  authorizeCreateOrUpdateDevelopment,
  authorizeReadDevelopment,
  canViewDevelopmentNoteRecord,
} from "./permissions/development-policy";

export {
  upsertDevelopmentNoteSchema,
  type UpsertDevelopmentNoteInput,
} from "./validators/development-validator";

export type {
  DevelopmentCategoryDTO,
  DevelopmentNoteDTO,
  DevelopmentNoteRevisionDTO,
} from "./types/development-types";

export { DevelopmentWorkspaceClient } from "./components/development-workspace-client";

