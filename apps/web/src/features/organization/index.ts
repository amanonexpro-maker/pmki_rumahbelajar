/**
 * Organization Domain Public API (11-DOMAIN-DRIVEN-FEATURE-ARCHITECTURE.md §9).
 */
export const DOMAIN_NAME = "organization" as const;

export {
  assignOrUpdateUserScopeMembership,
  getDefaultPilotServiceUnit,
  getOrganizationScopeCatalog,
  getUserMemberships,
  listAllUserScopeMemberships,
  type MembershipRecord,
  type ScopeCatalogDTO,
  type ServiceUnitScope,
  type UserMembershipDetailDTO,
} from "./services/membership-service";

export {
  buildContextualDashboardViewModel,
  getIndonesianTimeGreeting,
  type ContextualDashboardViewModelDTO,
  type DashboardActionLinkDTO,
  type DashboardActivityEntryDTO,
  type DashboardAttentionItemDTO,
  type DashboardSummaryMetricDTO,
  type DashboardTone,
  type DashboardUpcomingScheduleDTO,
} from "./services/dashboard-overview-service";

export {
  ContextualDashboardBody,
  ContextualDashboardView,
  DashboardOrientationHeader,
} from "./components/contextual-dashboard-view";
