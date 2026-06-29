import { useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { getPageUrl } from '@/lib/utils';
import { useEntityCreate } from '@blocksdiy/blocks-client-sdk/reactSdk';
import { ApplicationsEntity } from '@/product-types';
import { BipLogo } from '@/components/BipLogo';
import { Progress } from '@/components/ui/progress';
import { normalizeEmail } from '@/utils/EmailUtils';
import {
  ScreenerAnswers,
  ScreenerKey,
  SCREENER_QUESTIONS,
  TrackOption,
} from '@/utils/ApplyConstants';
import { ApplyScreenerStep } from '@/components/ApplyScreenerStep';
import { ApplyTrackStep } from '@/components/ApplyTrackStep';
import { ApplyFormStep, ApplyFormValues } from '@/components/ApplyFormStep';
import { ApplyConfirmStep } from '@/components/ApplyConfirmStep';

type WizardStep = 'screener' | 'track' | 'form' | 'confirm';

const STEP_PROGRESS: Record<WizardStep, { value: number; label: string } | null> = {
  screener: { value: 33, label: 'Step 1 of 3 — Eligibility' },
  track: { value: 66, label: 'Step 2 of 3 — Track & site' },
  form: { value: 100, label: 'Step 3 of 3 — Application' },
  confirm: null,
};

export default function Apply() {
  const navigate = useNavigate();
  const [step, setStep] = useState<WizardStep>('screener');
  const [answers, setAnswers] = useState<ScreenerAnswers>({});
  const [track, setTrack] = useState<TrackOption['id'] | null>(null);
  const [siteId, setSiteId] = useState('');
  const [submittedCompany, setSubmittedCompany] = useState('');

  const { createFunction, isLoading } = useEntityCreate(ApplicationsEntity);

  const reset = () => {
    setAnswers({});
    setTrack(null);
    setSiteId('');
    setSubmittedCompany('');
    setStep('screener');
  };

  const handleAnswer = (key: ScreenerKey, value: boolean) =>
    setAnswers((a) => ({ ...a, [key]: value }));

  const handleScreenerContinue = async () => {
    const allYes = SCREENER_QUESTIONS.every((q) => answers[q.key] === true);
    if (allYes) {
      setStep('track');
      return;
    }
    // Routes to Partners (better-fit) when the applicant answers "No" to ANY of
    // the 5 eligibility questions (i.e. not all five are Yes).
    // Create a PII-free Partner Referral row, then navigate to the Partners page.
    try {
      await createFunction({
        data: {
          screenerQ1: answers.screenerQ1 ?? false,
          screenerQ2: answers.screenerQ2 ?? false,
          screenerQ3: answers.screenerQ3 ?? false,
          screenerQ4: answers.screenerQ4 ?? false,
          screenerQ5: answers.screenerQ5 ?? false,
          status: 'Partner Referral',
        },
      });
    } catch {
      toast.error('We could not record your responses, but you can continue.');
    }
    navigate(getPageUrl('Partners'));
  };

  const handleSubmit = async (values: ApplyFormValues) => {
    if (!track || !siteId) return;
    try {
      await createFunction({
        data: {
          screenerQ1: true,
          screenerQ2: true,
          screenerQ3: true,
          screenerQ4: true,
          screenerQ5: true,
          recommendedTrack: track,
          selectedSiteId: siteId,
          companyName: values.companyName.trim(),
          founderName: values.founderName.trim(),
          founderEmail: normalizeEmail(values.founderEmail),
          founderPhone: values.founderPhone.trim(),
          businessDescription: values.businessDescription.trim(),
          industryNaics: values.industryNaics.trim(),
          stage: values.stage.trim(),
          competitiveAdvantage: values.competitiveAdvantage.trim(),
          marketValidation: values.marketValidation.trim(),
          growthPlan: values.growthPlan.trim(),
          financials: values.financials.trim(),
          programFit: values.programFit.trim(),
          ucfConnections: values.ucfConnections.trim(),
          race: values.race.trim(),
          ethnicity: values.ethnicity.trim(),
          veteran: values.veteran.trim(),
          ageGroup: values.ageGroup.trim(),
          disability: values.disability.trim(),
          referralSource: values.referralSource.trim(),
          status: 'Application Submitted',
        },
      });
      setSubmittedCompany(values.companyName.trim());
      toast.success('Your application has been submitted.');
      setStep('confirm');
    } catch {
      toast.error('Something went wrong submitting your application. Please try again.');
    }
  };

  const progress = STEP_PROGRESS[step];

  // The eligibility screener renders its OWN top bar + single card (matching the
  // reference design), so it is shown standalone WITHOUT the outer "Apply to the
  // UCF Business Incubation Program" header + progress chrome. The later
  // application steps (track/form/confirm) keep the outer header + progress bar.
  if (step === 'screener') {
    return (
      <ApplyScreenerStep
        answers={answers}
        onAnswer={handleAnswer}
        onContinue={handleScreenerContinue}
        isPending={isLoading}
        onCancel={() => navigate(getPageUrl('Home'))}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-3xl items-center px-4 py-4">
          <BipLogo variant="dark" />
        </div>
      </header>
      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Apply to the UCF Business Incubation Program
          </h1>
          <p className="text-sm text-muted-foreground">
            A short, guided application to help us understand your business and
            connect you with the right resources.
          </p>
        </div>

        {progress && (
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              {progress.label}
            </span>
            <Progress value={progress.value} />
          </div>
        )}

        {step === 'track' && (
          <ApplyTrackStep
            track={track}
            onTrackChange={setTrack}
            siteId={siteId}
            onSiteChange={setSiteId}
            onBack={() => setStep('screener')}
            onContinue={() => setStep('form')}
          />
        )}
        {step === 'form' && track && (
          <ApplyFormStep
            track={track}
            onBack={() => setStep('track')}
            onSubmit={handleSubmit}
            isPending={isLoading}
          />
        )}
        {step === 'confirm' && (
          <ApplyConfirmStep
            companyName={submittedCompany}
            onStartAnother={reset}
          />
        )}
      </main>
    </div>
  );
}