import { useState } from 'react';
import {
  useEntityGetAll,
  useEntityCreate,
  useEntityUpdate,
  useExecuteAction,
  useUser,
} from '@blocksdiy/blocks-client-sdk/reactSdk';
import {
  ApplicationsEntity,
  FitAssessmentScorecardsEntity,
  EvaluateApplicationAction,
} from '@/product-types';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field';
import { Sparkles, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { computeWeightedTotal } from '@/utils/PipelineUtils';

type Application = typeof ApplicationsEntity['instanceType'] & { id?: string };
type Scorecard = typeof FitAssessmentScorecardsEntity['instanceType'] & {
  id?: string;
};

interface FitScorecardFormProps {
  application: Application;
  onScored?: () => void;
}

const SCORE_FIELDS: {
  key:
    | 'scoreMarket'
    | 'scoreTechnology'
    | 'scoreTeam'
    | 'scoreTraction'
    | 'scoreProgramFit';
  label: string;
}[] = [
  { key: 'scoreMarket', label: 'Market / Scalability (25%)' },
  { key: 'scoreTechnology', label: 'Technology / Innovation (25%)' },
  { key: 'scoreTeam', label: 'Team (20%)' },
  { key: 'scoreTraction', label: 'Traction / Validation (20%)' },
  { key: 'scoreProgramFit', label: 'Program Fit (10%)' },
];

export const FitScorecardForm = ({
  application,
  onScored,
}: FitScorecardFormProps) => {
  const user = useUser();
  const appId = application.id ?? '';

  const { data: scorecards, isLoading } = useEntityGetAll(
    FitAssessmentScorecardsEntity,
    { where: { column: 'applicationId', operator: '=', value: appId } } as Record<
      string,
      unknown
    >,
    { enabled: !!appId },
  );

  const existing = (scorecards ?? [])[0] as Scorecard | undefined;

  const { createFunction, isLoading: creating } = useEntityCreate(
    FitAssessmentScorecardsEntity,
  );
  const { updateFunction, isLoading: updating } = useEntityUpdate(
    FitAssessmentScorecardsEntity,
  );
  const { executeFunction, isLoading: evaluating } = useExecuteAction(
    EvaluateApplicationAction,
  );

  // Editable form state. Seeded from the existing scorecard on first render.
  const [scoreMarket, setScoreMarket] = useState<number>(
    existing?.scoreMarket ?? 3,
  );
  const [scoreTechnology, setScoreTechnology] = useState<number>(
    existing?.scoreTechnology ?? 3,
  );
  const [scoreTeam, setScoreTeam] = useState<number>(existing?.scoreTeam ?? 3);
  const [scoreTraction, setScoreTraction] = useState<number>(
    existing?.scoreTraction ?? 3,
  );
  const [scoreProgramFit, setScoreProgramFit] = useState<number>(
    existing?.scoreProgramFit ?? 3,
  );
  const [reviewerName, setReviewerName] = useState<string>(
    existing?.reviewerName ?? user.name ?? '',
  );
  const [decisionRecommendation, setDecisionRecommendation] = useState<string>(
    existing?.decisionRecommendation ?? 'Hold',
  );
  const [notes, setNotes] = useState<string>(existing?.notes ?? '');
  const [aiGenerated, setAiGenerated] = useState<boolean>(
    existing?.aiGenerated ?? false,
  );

  const scores = {
    scoreMarket,
    scoreTechnology,
    scoreTeam,
    scoreTraction,
    scoreProgramFit,
  };
  const setters: Record<string, (n: number) => void> = {
    scoreMarket: setScoreMarket,
    scoreTechnology: setScoreTechnology,
    scoreTeam: setScoreTeam,
    scoreTraction: setScoreTraction,
    scoreProgramFit: setScoreProgramFit,
  };

  const weightedTotal = computeWeightedTotal(scores);

  const handleEvaluate = async () => {
    if (!appId) return;
    try {
      const res = (await executeFunction({ applicationId: appId })) as
        | Record<string, unknown>
        | undefined;
      if (!res) {
        toast.error('No result returned from the AI evaluation.');
        return;
      }
      const num = (v: unknown, fallback: number) =>
        typeof v === 'number' && !Number.isNaN(v) ? v : fallback;
      setScoreMarket(num(res.scoreMarket, 3));
      setScoreTechnology(num(res.scoreTechnology, 3));
      setScoreTeam(num(res.scoreTeam, 3));
      setScoreTraction(num(res.scoreTraction, 3));
      setScoreProgramFit(num(res.scoreProgramFit, 3));
      if (typeof res.decisionRecommendation === 'string') {
        setDecisionRecommendation(res.decisionRecommendation);
      }
      if (typeof res.notes === 'string') setNotes(res.notes);
      setAiGenerated(true);
      toast.success('AI evaluation complete. Review the scores, then save.');
    } catch {
      toast.error('AI evaluation failed. Please try again.');
    }
  };

  const handleSave = async () => {
    if (!appId) return;
    const payload = {
      applicationId: appId,
      siteId: application.selectedSiteId ?? '',
      scoreMarket,
      scoreTechnology,
      scoreTeam,
      scoreTraction,
      scoreProgramFit,
      weightedTotal,
      reviewerName: reviewerName.trim(),
      decisionRecommendation,
      notes,
      aiGenerated,
    };
    try {
      if (existing?.id) {
        await updateFunction({ id: existing.id, data: payload });
      } else {
        await createFunction({ data: payload });
      }
      toast.success('Scorecard saved.');
      onScored?.();
    } catch {
      toast.error('Could not save the scorecard.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  const saving = creating || updating;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground">
            Fit Scorecard
          </h3>
          {aiGenerated && <Badge variant="secondary">AI assisted</Badge>}
          {existing && <Badge variant="outline">Saved</Badge>}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleEvaluate}
          disabled={evaluating}
        >
          {evaluating ? (
            <Loader2 data-icon="inline-start" className="animate-spin" />
          ) : (
            <Sparkles data-icon="inline-start" />
          )}
          {evaluating ? 'Evaluating…' : 'Evaluate with AI'}
        </Button>
      </div>

      {evaluating && (
        <p className="text-sm text-muted-foreground">
          Evaluating… this can take up to a minute.
        </p>
      )}

      <FieldGroup>
        <div className="grid gap-4 sm:grid-cols-2">
          {SCORE_FIELDS.map((f) => (
            <Field key={f.key}>
              <FieldLabel htmlFor={f.key}>{f.label}</FieldLabel>
              <Select
                value={String(scores[f.key])}
                onValueChange={(v) => setters[f.key](Number(v))}
              >
                <SelectTrigger id={f.key}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          ))}
          <Field>
            <FieldLabel>Weighted total</FieldLabel>
            <div className="flex h-9 items-center">
              <Badge>{weightedTotal} / 100</Badge>
            </div>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="reviewerName">Reviewer</FieldLabel>
            <Input
              id="reviewerName"
              value={reviewerName}
              onChange={(e) => setReviewerName(e.target.value)}
              placeholder="Reviewer name"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="decisionRecommendation">
              Recommendation
            </FieldLabel>
            <Select
              value={decisionRecommendation}
              onValueChange={setDecisionRecommendation}
            >
              <SelectTrigger id="decisionRecommendation">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="Accept">Accept</SelectItem>
                  <SelectItem value="Decline">Decline</SelectItem>
                  <SelectItem value="Hold">Hold</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="notes">Notes</FieldLabel>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Reviewer rationale and observations…"
            rows={4}
          />
        </Field>
      </FieldGroup>

      <div className="flex justify-end">
        <Button type="button" onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 data-icon="inline-start" className="animate-spin" />
          ) : (
            <Save data-icon="inline-start" />
          )}
          {existing ? 'Update Scorecard' : 'Save Scorecard'}
        </Button>
      </div>
    </div>
  );
};