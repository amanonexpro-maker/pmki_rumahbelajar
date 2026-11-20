/**
 * Identity Domain Public API (11 §8).
 */
export const DOMAIN_NAME = "identity" as const;

export { LoginForm } from "./components/login-form";
export { LogoutButton } from "./components/logout-button";
export {
  loginAction,
  logoutAction,
  requestPasswordResetAction,
} from "./actions/auth-actions";
export {
  getIdentityUserStatusById,
  getUserNamesByIds,
  listAllIdentityUsers,
  provisionIdentityUserViaAdminApi,
  updateIdentityUserActiveState,
  type IdentityUserSummaryDTO,
} from "./services/auth-service";
export {
  loginSchema,
  resetPasswordSchema,
  type LoginInput,
  type ResetPasswordInput,
} from "./validators/auth-validator";
