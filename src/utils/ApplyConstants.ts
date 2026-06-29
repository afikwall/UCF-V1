import type { ApplicationsEntityRecommendedTrackEnum } from '@/product-types';

export type ScreenerKey =
  | 'screenerQ1'
  | 'screenerQ2'
  | 'screenerQ3'
  | 'screenerQ4'
  | 'screenerQ5';

export interface ScreenerQuestion {
  key: ScreenerKey;
  label: string;
}

// DRAFT placeholder copy — final wording pending UCF review.
export const SCREENER_QUESTIONS: ScreenerQuestion[] = [
  { key: 'screenerQ1', label: 'Is your business headquartered in Central Florida?' },
  { key: 'screenerQ2', label: 'Is your business for-profit?' },
  { key: 'screenerQ3', label: 'Is your business independent of a franchise?' },
  { key: 'screenerQ4', label: 'Is your business scalable?' },
  { key: 'screenerQ5', label: 'Is your business technology- or innovation-driven?' },
];

export type ScreenerAnswers = Partial<Record<ScreenerKey, boolean>>;

export interface TrackOption {
  id: ApplicationsEntityRecommendedTrackEnum;
  title: string;
  description: string;
}

// User-facing label → recommendedTrack enum mapping.
export const TRACK_OPTIONS: TrackOption[] = [
  {
    id: 'Traction',
    title: 'Launch Your Startup',
    description:
      'Early-stage founders validating an idea and building toward first traction.',
  },
  {
    id: 'Growth',
    title: 'Grow Your Business',
    description:
      'Established companies ready to scale revenue, team, and operations.',
  },
  {
    id: 'Soft Landing',
    title: 'Expand to Central Florida',
    description:
      'Out-of-region or international companies establishing a Central Florida presence.',
  },
];

export const isValidEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());