import { LabeledPlaceholderTile } from '@/components/dashboard/LabeledPlaceholderTile';

const AWARD_ROWS = [
  'Major New Clients',
  'New Certifications',
  'New Management Team Members',
  'New Partnerships',
  'New Products',
  'Other',
];

export const AwardsMilestonesTile = () => (
  <LabeledPlaceholderTile
    title="Awards & Milestones"
    description="Populated from quarterly impact reports (Phase 6)."
    rows={AWARD_ROWS}
  />
);