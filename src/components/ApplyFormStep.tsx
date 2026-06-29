import { useState, FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { TrackOption, isValidEmail } from '@/utils/ApplyConstants';

export interface ApplyFormValues {
  companyName: string;
  founderName: string;
  founderEmail: string;
  founderPhone: string;
  businessDescription: string;
  industryNaics: string;
  stage: string;
  competitiveAdvantage: string;
  marketValidation: string;
  growthPlan: string;
  financials: string;
  programFit: string;
  ucfConnections: string;
  race: string;
  ethnicity: string;
  veteran: string;
  ageGroup: string;
  disability: string;
  referralSource: string;
}

const EMPTY: ApplyFormValues = {
  companyName: '',
  founderName: '',
  founderEmail: '',
  founderPhone: '',
  businessDescription: '',
  industryNaics: '',
  stage: '',
  competitiveAdvantage: '',
  marketValidation: '',
  growthPlan: '',
  financials: '',
  programFit: '',
  ucfConnections: '',
  race: '',
  ethnicity: '',
  veteran: '',
  ageGroup: '',
  disability: '',
  referralSource: '',
};

interface ApplyFormStepProps {
  track: TrackOption['id'];
  onBack: () => void;
  onSubmit: (values: ApplyFormValues) => void;
  isPending: boolean;
}

export const ApplyFormStep = ({
  track,
  onBack,
  onSubmit,
  isPending,
}: ApplyFormStepProps) => {
  const [values, setValues] = useState<ApplyFormValues>(EMPTY);
  const [touched, setTouched] = useState(false);

  const set = (key: keyof ApplyFormValues, value: string) =>
    setValues((v) => ({ ...v, [key]: value }));

  const emailValid = isValidEmail(values.founderEmail);
  const errors = {
    companyName: !values.companyName.trim(),
    founderName: !values.founderName.trim(),
    founderEmail: !values.founderEmail.trim() || !emailValid,
    founderPhone: !values.founderPhone.trim(),
    businessDescription: !values.businessDescription.trim(),
  };
  const hasErrors = Object.values(errors).some(Boolean);

  const helper = (field: 'stage' | 'marketValidation' | 'growthPlan' | 'financials' | 'ucfConnections') => {
    if (track === 'Soft Landing' && field === 'ucfConnections') {
      return 'Soft Landing: emphasize your Central Florida expansion plan and any UCF connections.';
    }
    if (track === 'Traction' && field === 'stage') {
      return 'Launch: clearly describe your current stage.';
    }
    if (track === 'Traction' && field === 'marketValidation') {
      return 'Launch: share the market validation evidence you have so far.';
    }
    if (track === 'Growth' && field === 'growthPlan') {
      return 'Grow: detail your growth plan and targets.';
    }
    if (track === 'Growth' && field === 'financials') {
      return 'Grow: include a financials summary (revenue, runway, projections).';
    }
    return undefined;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (hasErrors) return;
    onSubmit(values);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Application details</CardTitle>
        <CardDescription>
          Tell us about your business. Fields marked with * are required.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="flex flex-col gap-8">
          <FieldGroup>
            <h3 className="text-sm font-semibold text-foreground">Contact</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field data-invalid={touched && errors.companyName ? true : undefined}>
                <FieldLabel htmlFor="companyName">Company name *</FieldLabel>
                <Input
                  id="companyName"
                  value={values.companyName}
                  onChange={(e) => set('companyName', e.target.value)}
                  aria-invalid={touched && errors.companyName ? true : undefined}
                />
              </Field>
              <Field data-invalid={touched && errors.founderName ? true : undefined}>
                <FieldLabel htmlFor="founderName">Founder name *</FieldLabel>
                <Input
                  id="founderName"
                  value={values.founderName}
                  onChange={(e) => set('founderName', e.target.value)}
                  aria-invalid={touched && errors.founderName ? true : undefined}
                />
              </Field>
              <Field data-invalid={touched && errors.founderEmail ? true : undefined}>
                <FieldLabel htmlFor="founderEmail">Founder email *</FieldLabel>
                <Input
                  id="founderEmail"
                  type="email"
                  value={values.founderEmail}
                  onChange={(e) => set('founderEmail', e.target.value)}
                  aria-invalid={touched && errors.founderEmail ? true : undefined}
                />
                {touched && errors.founderEmail && (
                  <FieldDescription>
                    Enter a valid email address.
                  </FieldDescription>
                )}
              </Field>
              <Field data-invalid={touched && errors.founderPhone ? true : undefined}>
                <FieldLabel htmlFor="founderPhone">Founder phone *</FieldLabel>
                <Input
                  id="founderPhone"
                  value={values.founderPhone}
                  onChange={(e) => set('founderPhone', e.target.value)}
                  aria-invalid={touched && errors.founderPhone ? true : undefined}
                />
              </Field>
            </div>
          </FieldGroup>

          <Separator />

          <FieldGroup>
            <h3 className="text-sm font-semibold text-foreground">
              About your business
            </h3>
            <Field data-invalid={touched && errors.businessDescription ? true : undefined}>
              <FieldLabel htmlFor="businessDescription">
                Business description *
              </FieldLabel>
              <Textarea
                id="businessDescription"
                value={values.businessDescription}
                onChange={(e) => set('businessDescription', e.target.value)}
                aria-invalid={
                  touched && errors.businessDescription ? true : undefined
                }
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="industryNaics">Industry / NAICS</FieldLabel>
                <Input
                  id="industryNaics"
                  value={values.industryNaics}
                  onChange={(e) => set('industryNaics', e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="stage">Business stage</FieldLabel>
                <Input
                  id="stage"
                  value={values.stage}
                  onChange={(e) => set('stage', e.target.value)}
                />
                {helper('stage') && (
                  <FieldDescription>{helper('stage')}</FieldDescription>
                )}
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="competitiveAdvantage">
                Competitive advantage
              </FieldLabel>
              <Textarea
                id="competitiveAdvantage"
                value={values.competitiveAdvantage}
                onChange={(e) => set('competitiveAdvantage', e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="marketValidation">
                Market validation
              </FieldLabel>
              <Textarea
                id="marketValidation"
                value={values.marketValidation}
                onChange={(e) => set('marketValidation', e.target.value)}
              />
              {helper('marketValidation') && (
                <FieldDescription>{helper('marketValidation')}</FieldDescription>
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor="growthPlan">Growth plan</FieldLabel>
              <Textarea
                id="growthPlan"
                value={values.growthPlan}
                onChange={(e) => set('growthPlan', e.target.value)}
              />
              {helper('growthPlan') && (
                <FieldDescription>{helper('growthPlan')}</FieldDescription>
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor="financials">Financials</FieldLabel>
              <Textarea
                id="financials"
                value={values.financials}
                onChange={(e) => set('financials', e.target.value)}
              />
              {helper('financials') && (
                <FieldDescription>{helper('financials')}</FieldDescription>
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor="programFit">Program fit</FieldLabel>
              <Textarea
                id="programFit"
                value={values.programFit}
                onChange={(e) => set('programFit', e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="ucfConnections">
                Connections to UCF
              </FieldLabel>
              <Textarea
                id="ucfConnections"
                value={values.ucfConnections}
                onChange={(e) => set('ucfConnections', e.target.value)}
              />
              {helper('ucfConnections') && (
                <FieldDescription>{helper('ucfConnections')}</FieldDescription>
              )}
            </Field>
          </FieldGroup>

          <Separator />

          <FieldGroup>
            <div className="flex flex-col gap-1">
              <h3 className="text-sm font-semibold text-foreground">
                Demographics
              </h3>
              <p className="text-xs text-muted-foreground">
                Optional — for program reporting. Your answers do not affect your
                application.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="race">Race</FieldLabel>
                <Input
                  id="race"
                  value={values.race}
                  onChange={(e) => set('race', e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="ethnicity">Ethnicity</FieldLabel>
                <Input
                  id="ethnicity"
                  value={values.ethnicity}
                  onChange={(e) => set('ethnicity', e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="veteran">Veteran status</FieldLabel>
                <Input
                  id="veteran"
                  value={values.veteran}
                  onChange={(e) => set('veteran', e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="ageGroup">Age group</FieldLabel>
                <Input
                  id="ageGroup"
                  value={values.ageGroup}
                  onChange={(e) => set('ageGroup', e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="disability">Disability status</FieldLabel>
                <Input
                  id="disability"
                  value={values.disability}
                  onChange={(e) => set('disability', e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="referralSource">
                  How did you hear about us?
                </FieldLabel>
                <Input
                  id="referralSource"
                  value={values.referralSource}
                  onChange={(e) => set('referralSource', e.target.value)}
                />
              </Field>
            </div>
          </FieldGroup>
        </CardContent>
        <CardFooter className="justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={onBack}
            disabled={isPending}
          >
            Back
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending && (
              <Loader2 data-icon="inline-start" className="animate-spin" />
            )}
            Submit application
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};