// Pipeline stage model for the UCF Business Incubation Hub applications board.

export interface StageColumn {
  // The application `status` value mapped to this column.
  status: string;
  // Display label shown on the board column header.
  label: string;
}

// Ordered review pipeline columns. 'Application Submitted' appears first as
// 'Submitted' so staff can pull new submissions into review.
export const PIPELINE_COLUMNS: StageColumn[] = [
  { status: 'Application Submitted', label: 'Submitted' },
  { status: 'Under Review', label: 'Under Review' },
  { status: 'Intro Meeting', label: 'Intro Meeting' },
  { status: 'Presentation', label: 'Presentation' },
  { status: 'Scored', label: 'Scored' },
  { status: 'Accepted', label: 'Accepted' },
  { status: 'Declined', label: 'Declined' },
  { status: 'Hold', label: 'Hold' },
];

// Statuses that have a board column.
export const COLUMN_STATUSES = PIPELINE_COLUMNS.map((c) => c.status);

// Decision / terminal-ish states.
export const DECISION_STATUSES = ['Accepted', 'Declined', 'Hold'];

// Allowed forward transitions from each status. Pragmatic — staff can correct.
const TRANSITIONS: Record<string, string[]> = {
  'Application Submitted': ['Under Review'],
  'Under Review': ['Intro Meeting', 'Hold'],
  'Intro Meeting': ['Presentation', 'Partner Referral', 'Hold'],
  Presentation: ['Scored', 'Hold'],
  Scored: ['Accepted', 'Declined', 'Hold'],
  Hold: [
    'Under Review',
    'Intro Meeting',
    'Presentation',
    'Scored',
  ],
  Accepted: [],
  Declined: ['Under Review'],
};

export const getNextStatuses = (status?: string): string[] => {
  if (!status) return [];
  return TRANSITIONS[status] ?? [];
};

// Weighted scorecard total. Weights: Market 25, Tech 25, Team 20, Traction 20,
// Program Fit 10. Each score is 1-5 → ((m*25 + t*25 + tm*20 + tr*20 + pf*10)/5)
// which yields a 0-100 scale (max = (25+25+20+20+10)*5/5 = 100).
export const computeWeightedTotal = (scores: {
  scoreMarket: number;
  scoreTechnology: number;
  scoreTeam: number;
  scoreTraction: number;
  scoreProgramFit: number;
}): number => {
  const { scoreMarket, scoreTechnology, scoreTeam, scoreTraction, scoreProgramFit } =
    scores;
  const raw =
    scoreMarket * 25 +
    scoreTechnology * 25 +
    scoreTeam * 20 +
    scoreTraction * 20 +
    scoreProgramFit * 10;
  return Math.round(raw / 5);
};