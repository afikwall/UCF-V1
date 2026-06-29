import { useState } from 'react';
import { Loader2, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { BipLogo } from '@/components/BipLogo';
import { cn } from '@/lib/utils';
import {
  SCREENER_QUESTIONS,
  ScreenerAnswers,
  ScreenerKey,
} from '@/utils/ApplyConstants';

interface ApplyScreenerStepProps {
  answers: ScreenerAnswers;
  onAnswer: (key: ScreenerKey, value: boolean) => void;
  onContinue: () => void;
  isPending: boolean;
  onCancel?: () => void;
}

interface OptionCardProps {
  label: string;
  selected: boolean;
  onSelect: () => void;
}

const OptionCard = ({ label, selected, onSelect }: OptionCardProps) => (
  <button
    type="button"
    onClick={onSelect}
    className={cn(
      'flex w-full items-center gap-3 rounded-lg border p-4 text-left transition-colors',
      selected
        ? 'border-accent bg-accent/10 ring-1 ring-accent'
        : 'border-border hover:border-accent/60',
    )}
  >
    <span
      className={cn(
        'flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
        selected ? 'border-accent bg-accent text-accent-foreground' : 'border-muted-foreground/40',
      )}
    >
      {selected && <Check className="size-3" />}
    </span>
    <span className="text-sm font-medium text-foreground">{label}</span>
  </button>
);

export const ApplyScreenerStep = ({
  answers,
  onAnswer,
  onContinue,
  isPending,
  onCancel,
}: ApplyScreenerStepProps) => {
  const [stepIndex, setStepIndex] = useState(0);
  const total = SCREENER_QUESTIONS.length;
  const question = SCREENER_QUESTIONS[stepIndex];
  const value = answers[question.key];
  const isAnswered = value !== undefined;
  const isLast = stepIndex === total - 1;

  const handleNext = () => {
    if (!isAnswered) return;
    if (isLast) {
      onContinue();
      return;
    }
    setStepIndex((i) => Math.min(i + 1, total - 1));
  };

  const handleBack = () => setStepIndex((i) => Math.max(i - 1, 0));

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8">
        <div className="flex items-center justify-between">
          <BipLogo variant="dark" />
          {onCancel && (
            <Button variant="ghost" size="sm" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>

        <Card className="mx-auto w-full max-w-xl">
        <CardHeader className="gap-3">
          <div className="flex items-center justify-between">
            <CardTitle>Eligibility Screener</CardTitle>
            <span className="text-sm font-medium text-muted-foreground">
              {stepIndex + 1} / {total}
            </span>
          </div>
          <Progress value={((stepIndex + 1) / total) * 100} />
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            {question.label}
          </h2>
          <div className="flex flex-col gap-3">
            <OptionCard
              label="Yes"
              selected={value === true}
              onSelect={() => onAnswer(question.key, true)}
            />
            <OptionCard
              label="No"
              selected={value === false}
              onSelect={() => onAnswer(question.key, false)}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Draft questions — final wording pending UCF review.
          </p>
          <div className="flex items-center justify-between">
            {stepIndex > 0 ? (
              <Button variant="ghost" onClick={handleBack} disabled={isPending}>
                <ArrowLeft data-icon="inline-start" />
                Back
              </Button>
            ) : (
              <span />
            )}
            <Button
              onClick={handleNext}
              disabled={!isAnswered || isPending}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {isPending && isLast && (
                <Loader2 data-icon="inline-start" className="animate-spin" />
              )}
              {isLast ? 'Finish' : 'Next'}
              {!(isPending && isLast) && <ArrowRight data-icon="inline-end" />}
            </Button>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
};