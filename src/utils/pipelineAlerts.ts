// Pipeline alert thresholds + computation for the Applications dashboard.
// Time-in-stage rules surface applications that need staff attention.
//
// NOTE: this lives under src/utils/ (NOT src/config/) on purpose — a prior
// src/config/pipelineAlerts.ts repeatedly vanished from disk between compiles
// (recurring leaf-file loss). src/utils/ has proven stable, so keep it here.

import { useState } from 'react';

export interface PipelineAlertThresholds {
  // Days an application can sit in any active stage before it is "stuck".
  stuckInStageDays: number;
  // Days an application can sit in 'Under Review' before an intro meeting
  // should be advanced. (Pre-merge this was "Intro not scheduled"; with the
  // merged Intro Meeting stage the signal is "Under Review too long".)
  introNotScheduledDays: number;
  // Days an application can sit in 'Scored' before a decision is overdue.
  decisionOverdueDays: number;
}

export const DEFAULT_PIPELINE_ALERT_THRESHOLDS: PipelineAlertThresholds = {
  stuckInStageDays: 14,
  introNotScheduledDays: 7,
  decisionOverdueDays: 21,
};

// Statuses that are terminal / parked and therefore excluded from "stuck".
const EXCLUDED_FROM_STUCK = new Set<string>([
  'Hold',
  'Accepted',
  'Declined',
  'Withdrawn',
  'Partner Referral',
  // Pre-pipeline intake states never appear on the board either.
  'Screener Started',
  'Site Selected',
]);

interface AlertApp {
  id?: string;
  status?: string;
  companyName?: string;
  updatedAt?: string;
  createdAt?: string;
}

// Whole days since an ISO timestamp; 0 when missing/invalid.
export const daysSince = (iso?: string): number => {
  if (!iso) return 0;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return 0;
  const ms = Date.now() - then;
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
};

export interface PipelineAlerts<T extends AlertApp = AlertApp> {
  decisionOverdue: T[];
  introNotScheduled: T[];
  stuck: T[];
}

export const computeAlerts = <T extends AlertApp>(
  applications: T[] | undefined,
  thresholds: PipelineAlertThresholds,
): PipelineAlerts<T> => {
  const apps = applications ?? [];
  const age = (a: T) => daysSince(a.updatedAt ?? a.createdAt);

  const decisionOverdue = apps.filter(
    (a) => a.status === 'Scored' && age(a) > thresholds.decisionOverdueDays,
  );

  const introNotScheduled = apps.filter(
    (a) =>
      a.status === 'Under Review' && age(a) > thresholds.introNotScheduledDays,
  );

  const stuck = apps.filter(
    (a) =>
      !!a.status &&
      !EXCLUDED_FROM_STUCK.has(a.status) &&
      age(a) > thresholds.stuckInStageDays,
  );

  return { decisionOverdue, introNotScheduled, stuck };
};

// Hook holding the (currently in-memory, defaults-backed) thresholds.
export const useThresholds = () => {
  const [thresholds, setThresholds] = useState<PipelineAlertThresholds>(
    DEFAULT_PIPELINE_ALERT_THRESHOLDS,
  );
  return { ...thresholds, setThresholds };
};