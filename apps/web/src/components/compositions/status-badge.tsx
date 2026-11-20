import * as React from "react";
import { Badge, type BadgeSize } from "@/components/ui";
import {
  ATTENDANCE_STATUS_META,
  CONSENT_STATUS_META,
  PUBLICATION_STATUS_META,
  REGISTRATION_STATUS_META,
  REPORT_STATUS_META,
  SYNC_STATUS_META,
  type AttendanceStatus,
  type ConsentStatus,
  type PublicationStatus,
  type RegistrationStatus,
  type ReportStatus,
  type StatusMeta,
  type SyncStatus,
} from "@/lib/status";

/**
 * Strongly typed StatusBadge bound exclusively to `src/lib/status`.
 * Raw arbitrary status strings are intentionally disallowed by TypeScript.
 */
export type StatusBadgeProps = (
  | { domain: "registration"; status: RegistrationStatus }
  | { domain: "attendance"; status: AttendanceStatus }
  | { domain: "consent"; status: ConsentStatus }
  | { domain: "report"; status: ReportStatus }
  | { domain: "publication"; status: PublicationStatus }
  | { domain: "sync"; status: SyncStatus }
) & {
  size?: BadgeSize;
  dot?: boolean;
  className?: string;
};

function resolveStatusMeta(props: StatusBadgeProps): StatusMeta {
  switch (props.domain) {
    case "registration":
      return REGISTRATION_STATUS_META[props.status];
    case "attendance":
      return ATTENDANCE_STATUS_META[props.status];
    case "consent":
      return CONSENT_STATUS_META[props.status];
    case "report":
      return REPORT_STATUS_META[props.status];
    case "publication":
      return PUBLICATION_STATUS_META[props.status];
    case "sync":
      return SYNC_STATUS_META[props.status];
  }
}

export function StatusBadge(props: StatusBadgeProps) {
  const { size = "md", dot = false, className } = props;
  const meta = resolveStatusMeta(props);

  return (
    <Badge variant={meta.tone} size={size} dot={dot} className={className}>
      {meta.label}
    </Badge>
  );
}

