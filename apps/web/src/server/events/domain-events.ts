/**
 * Canonical In-Process Typed Domain Event Bus (11 §31–32, U-09).
 * Used for audit logging, notifications, and decoupled cross-domain side effects.
 */
export type DomainEventName =
  | "StudentRegistered"
  | "StudentVerified"
  | "StudentPlaced"
  | "AttendanceRecorded"
  | "DevelopmentNoteCreated"
  | "ConsentUpdated"
  | "ReportApproved"
  | "PublicationPublished";

export interface DomainEventPayload<
  TName extends DomainEventName = DomainEventName,
  TData extends Record<string, unknown> = Record<string, unknown>,
> {
  name: TName;
  organizationId: string;
  serviceUnitId: string;
  actorId: string | null;
  entityType: string;
  entityId: string;
  description: string;
  metadata?: TData;
  occurredAt?: Date;
}

type DomainEventHandler = (event: DomainEventPayload) => Promise<void>;

const subscribers = new Map<DomainEventName | "*", Set<DomainEventHandler>>();

export function subscribeDomainEvent(
  eventName: DomainEventName | "*",
  handler: DomainEventHandler
): () => void {
  const existing = subscribers.get(eventName) ?? new Set<DomainEventHandler>();
  existing.add(handler);
  subscribers.set(eventName, existing);
  return () => {
    existing.delete(handler);
  };
}

export async function emitDomainEvent(
  event: DomainEventPayload
): Promise<void> {
  const specific = Array.from(subscribers.get(event.name) ?? []);
  const wildcard = Array.from(subscribers.get("*") ?? []);
  for (const handler of [...specific, ...wildcard]) {
    await handler(event);
  }
}

