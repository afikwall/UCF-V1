import { LabeledPlaceholderTile } from '@/components/dashboard/LabeledPlaceholderTile';

const JOB_ROWS = [
  'W-2 Full Time',
  'W-2 Part Time',
  '1099 Full Time',
  '1099 Part Time',
  'Students',
  'UCF Grads',
  'Veterans',
];

export const JobsCreatedTile = () => (
  <LabeledPlaceholderTile
    title="Jobs Created"
    description="Populated from quarterly impact reports (Phase 6)."
    rows={JOB_ROWS}
  />
);