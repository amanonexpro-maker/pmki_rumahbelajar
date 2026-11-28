/**
 * Identity Domain Public API (11 §8).
 */
export const DOMAIN_NAME = "identity" as const;

export { ChangePasswordCard } from "./components/change-password-card";
export { LoginForm } from "./components/login-form";
export { LogoutButton } from "./components/logout-button";
export { MyProfileClient } from "./components/my-profile-client";
export { ResetPasswordForm } from "./components/reset-password-form";
export {
  changeMyPasswordAction,
  loginAction,
  logoutAction,
  requestPasswordResetAction,
  updateMyProfileAction,
} from "./actions/auth-actions";
export {
  getIdentityUserStatusById,
  getMyProfileView,
  getUserNamesByIds,
  listAllIdentityUsers,
  listPublicOptInIdentityProfiles,
  provisionIdentityUserViaAdminApi,
  resetIdentityUserPasswordToDefault,
  updateIdentityUserActiveState,
  updateMyAvatarUrl,
  type IdentityUserSummaryDTO,
  type MyProfilePermissionGroupDTO,
  type MyProfileViewDTO,
  type PublicOptInIdentityProfileDTO,
} from "./services/auth-service";
export {
  changePasswordSchema,
  DEFAULT_GENERIC_PASSWORD,
  loginSchema,
  resetPasswordSchema,
  updateMyProfileSchema,
  type ChangePasswordInput,
  type LoginInput,
  type ResetPasswordInput,
  type UpdateMyProfileInput,
} from "./validators/auth-validator";
