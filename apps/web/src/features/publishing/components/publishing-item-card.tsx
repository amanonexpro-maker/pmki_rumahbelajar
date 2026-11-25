"use client";

import * as React from "react";
import { StatusBadge } from "@/components/compositions";
import { WorkflowProgress } from "@/components/patterns";
import { Badge, Button, Icon } from "@/components/ui";
import { ICON_MAP } from "@/config/icons";
import type { PublicationStatus } from "@/lib/status";
import type { PublicationDTO } from "../types/publishing-types";
import { buildPublicationStages } from "../utils/publishing-utils";

export interface PublishingItemCardProps {
  publication: PublicationDTO;
  currentUserId: string;
  canCreate: boolean;
  canReview: boolean;
  canPublish: boolean;
  pending: boolean;
  onTransition: (publicationId: string, targetStatus: PublicationStatus) => void;
}

export const PublishingItemCard = React.memo(function PublishingItemCard({
  publication: post,
  currentUserId,
  canCreate,
  canReview,
  canPublish,
  pending,
  onTransition,
}: PublishingItemCardProps) {
  const isAuthor = post.authorId === currentUserId;

  return (
    <article
      style={{ contentVisibility: "auto", containIntrinsicSize: "220px" }}
      className="rounded-card border border-border bg-surface p-5 space-y-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="neutral" size="sm">
              {post.categoryLabel}
            </Badge>
            <StatusBadge domain="publication" status={post.status} />
          </div>
          <h2 className="text-base font-semibold text-foreground">
            {post.title}
          </h2>
          {post.excerpt && (
            <p className="text-xs text-secondary-foreground leading-relaxed">
              {post.excerpt}
            </p>
          )}
        </div>

        {/* Current State -> Available Action -> Next State */}
        <div className="flex flex-wrap items-center gap-2">
          {post.status === "DRAFT" && canCreate && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={pending}
              onClick={() => onTransition(post.id, "PRIVACY_REVIEW")}
              leftIcon={<Icon icon={ICON_MAP.send} size="xs" />}
            >
              Ajukan tinjauan privasi
            </Button>
          )}

          {post.status === "PRIVACY_REVIEW" && canReview && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={pending}
              onClick={() => onTransition(post.id, "APPROVED")}
              leftIcon={<Icon icon={ICON_MAP.shieldCheck} size="xs" />}
            >
              Setujui tinjauan privasi
            </Button>
          )}

          {post.status === "APPROVED" && canPublish && (
            <>
              {isAuthor ? (
                <span className="text-xs text-muted-foreground italic">
                  Menunggu pejabat penerbit lain (SoD: penulis ≠ penerbit)
                </span>
              ) : (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  disabled={pending}
                  onClick={() => onTransition(post.id, "PUBLISHED")}
                  leftIcon={<Icon icon={ICON_MAP.globe} size="xs" />}
                >
                  Terbitkan konten
                </Button>
              )}
            </>
          )}

          {post.status === "PUBLISHED" && canPublish && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={() => onTransition(post.id, "ARCHIVED")}
            >
              Arsipkan konten
            </Button>
          )}
        </div>
      </div>

      <WorkflowProgress
        compact
        stages={buildPublicationStages(post.status)}
      />
    </article>
  );
});

