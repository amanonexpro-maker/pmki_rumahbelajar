/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Badge, Button, Icon } from '../ui/index.ts';
import { PageHeader } from '../patterns/index.ts';
import {
  ActivityList,
  AttentionList,
  SummaryMetric,
  UpcomingList,
  buildDashboardViewModel,
} from '../patterns/dashboard/index.ts';

export interface OverviewViewProps {
  onNavigate: (view: string) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({ onNavigate }) => {
  const vm = buildDashboardViewModel();

  return (
    <div className="flex flex-col gap-8 sm:gap-10">
      {/* 1. CONTEXT & GREETING (Open, spacious, not wrapped in a card — Section 4) */}
      <PageHeader
        eyebrow={`${vm.serviceUnitName} · Tahun Ajaran ${vm.academicYearName}`}
        title={`${vm.greeting}, ${vm.currentUser.name}`}
        badge={
          <Badge variant="primary" size="md">
            {vm.roleLabel}
          </Badge>
        }
        description={vm.contextSummarySentence}
        primaryAction={
          vm.primaryAction ? (
            <Button
              variant="primary"
              size="md"
              rightIcon={<Icon icon={ArrowRight} size="sm" />}
              onClick={() => onNavigate(vm.primaryAction!.destination)}
            >
              {vm.primaryAction.label}
            </Button>
          ) : undefined
        }
        secondaryActions={
          vm.secondaryAction ? (
            <Button
              variant="secondary"
              size="md"
              onClick={() => onNavigate(vm.secondaryAction!.destination)}
            >
              {vm.secondaryAction.label}
            </Button>
          ) : undefined
        }
      />

      {/*
       * Responsive Order (Sections 15 & 16):
       * Mobile (<640px): Context -> Needs Attention & Upcoming Work -> Summary -> Recent Activity
       * Tablet/Desktop (>=640px): Context -> Summary -> [Needs Attention | Upcoming Work] -> Recent Activity
       */}

      {/* 2. OPERATIONAL SUMMARY (Inline typography strip, no cards — Section 5) */}
      <div className="order-3 sm:order-2">
        <SummaryMetric items={vm.summaryMetrics} onNavigate={onNavigate} />
      </div>

      {/* 3. NEEDS ATTENTION & UPCOMING WORK (Sections 6 & 7) */}
      <div className="order-2 sm:order-3 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
        <div className="lg:col-span-6">
          <AttentionList items={vm.attentionItems} onNavigate={onNavigate} />
        </div>

        <div className="lg:col-span-6">
          <UpcomingList
            items={vm.upcomingItems}
            recentSessionsSummary={vm.recentSessionsSummary}
            onNavigate={onNavigate}
          />
        </div>
      </div>

      {/* 4. RECENT ACTIVITY (Restrained, privacy-safe human-readable list — Section 8) */}
      <div className="order-4">
        <ActivityList
          items={vm.activityItems}
          canViewAuditLog={vm.canViewAuditLog}
          onNavigate={onNavigate}
        />
      </div>
    </div>
  );
};
