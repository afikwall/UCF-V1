import { useState } from 'react';
import { useExecuteAction } from '@blocksdiy/blocks-client-sdk/reactSdk';
import { toast } from 'sonner';
import { ApplicationsEntity, AcceptApplicationAction } from '@/product-types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  CheckCircle2,
  XCircle,
  PauseCircle,
  ClipboardCheck,
  Loader2,
} from 'lucide-react';
import { FitScorecardForm } from '@/components/FitScorecardForm';
import { HoldDialog } from '@/components/HoldDialog';
import { useApplicationStatus } from '@/hooks/useApplicationStatus';

type Application = typeof ApplicationsEntity['instanceType'] & { id?: string };

interface ApplicationDetailDialogProps {
  application: Application | null;
  siteName?: string;
  onClose: () => void;
}

const Row = ({ label, value }: { label: string; value?: string }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
      {label}
    </span>
    <span className="text-sm text-foreground">{value?.trim() || '—'}</span>
  </div>
);

const formatDate = (iso?: string) => {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const ApplicationDetailDialog = ({
  application,
  siteName,
  onClose,
}: ApplicationDetailDialogProps) => {
  const app = application;
  const { moveTo, placeOnHold, isLoading } = useApplicationStatus();
  const { executeFunction: acceptApplication, isLoading: isAccepting } =
    useExecuteAction(AcceptApplicationAction);
  const [holdOpen, setHoldOpen] = useState(false);
  const [decision, setDecision] = useState<null | 'Decline'>(null);
  const [acceptOpen, setAcceptOpen] = useState(false);

  const busy = isLoading || isAccepting;

  const handleAccept = async () => {
    if (!app?.id) return;
    try {
      const result = await acceptApplication({ applicationId: app.id });
      if (result?.success) {
        toast.success('Client created');
        setAcceptOpen(false);
        onClose();
      } else {
        toast.error(result?.message || 'Accept failed');
      }
    } catch {
      toast.error('Accept failed');
    }
  };

  return (
    <Dialog open={!!app} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{app?.companyName || 'Application'}</DialogTitle>
          <DialogDescription className="flex flex-wrap items-center gap-2">
            {app?.recommendedTrack && (
              <Badge variant="secondary">{app.recommendedTrack}</Badge>
            )}
            {app?.status && <Badge variant="outline">{app.status}</Badge>}
          </DialogDescription>
        </DialogHeader>
        {app && (
          <ScrollArea className="max-h-[70vh] pr-4">
            <div className="flex flex-col gap-5">
              {app.status === 'Hold' && (app.holdReason || app.followUpDate) && (
                <Alert>
                  <PauseCircle />
                  <AlertTitle>On Hold</AlertTitle>
                  <AlertDescription>
                    {app.holdReason || 'No reason provided.'}
                    {app.followUpDate
                      ? ` · Follow up by ${formatDate(app.followUpDate)}`
                      : ''}
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <Row label="Founder" value={app.founderName} />
                <Row label="Email" value={app.founderEmail} />
                <Row label="Phone" value={app.founderPhone} />
                <Row label="Site" value={siteName} />
                <Row label="Industry / NAICS" value={app.industryNaics} />
                <Row label="Stage" value={app.stage} />
              </div>
              <Separator />
              <Row label="Business description" value={app.businessDescription} />
              <Row label="Competitive advantage" value={app.competitiveAdvantage} />
              <Row label="Market validation" value={app.marketValidation} />
              <Row label="Growth plan" value={app.growthPlan} />
              <Row label="Financials" value={app.financials} />
              <Row label="Program fit" value={app.programFit} />
              <Row label="UCF connections" value={app.ucfConnections} />
              <Separator />
              <div className="grid gap-4 sm:grid-cols-2">
                <Row label="Race" value={app.race} />
                <Row label="Ethnicity" value={app.ethnicity} />
                <Row label="Veteran status" value={app.veteran} />
                <Row label="Age group" value={app.ageGroup} />
                <Row label="Disability status" value={app.disability} />
                <Row label="Referral source" value={app.referralSource} />
              </div>

              <Separator />

              <FitScorecardForm
                application={app}
                onScored={() => {
                  if (app.status !== 'Scored' && app.status !== 'Accepted') {
                    moveTo(app, 'Scored');
                  }
                }}
              />

              <Separator />

              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-semibold text-foreground">
                  Decision
                </h3>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busy || app.status === 'Scored'}
                    onClick={() => moveTo(app, 'Scored')}
                  >
                    <ClipboardCheck data-icon="inline-start" />
                    Mark as Scored
                  </Button>
                  <Button
                    size="sm"
                    disabled={busy || app.status === 'Accepted'}
                    onClick={() => setAcceptOpen(true)}
                  >
                    {isAccepting ? (
                      <Loader2 data-icon="inline-start" className="animate-spin" />
                    ) : (
                      <CheckCircle2 data-icon="inline-start" />
                    )}
                    {isAccepting ? 'Accepting…' : 'Accept'}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={busy || app.status === 'Declined'}
                    onClick={() => setDecision('Decline')}
                  >
                    <XCircle data-icon="inline-start" />
                    Decline
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busy}
                    onClick={() => setHoldOpen(true)}
                  >
                    <PauseCircle data-icon="inline-start" />
                    Hold
                  </Button>
                </div>
              </div>
            </div>
          </ScrollArea>
        )}

        {app && (
          <HoldDialog
            open={holdOpen}
            onOpenChange={setHoldOpen}
            defaultReason={app.holdReason}
            defaultFollowUpDate={app.followUpDate}
            saving={isLoading}
            onConfirm={async (reason, followUpDate) => {
              await placeOnHold(app, reason, followUpDate);
              setHoldOpen(false);
            }}
          />
        )}

        {app && (
          <AlertDialog
            open={decision !== null}
            onOpenChange={(open) => !open && setDecision(null)}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Decline application?</AlertDialogTitle>
                <AlertDialogDescription>
                  This sets the application status to Declined for{' '}
                  {app.companyName || 'this company'}.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={async () => {
                    await moveTo(app, 'Declined');
                    setDecision(null);
                  }}
                >
                  Confirm
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {app && (
          <AlertDialog
            open={acceptOpen}
            onOpenChange={(open) => {
              if (!open && !isAccepting) setAcceptOpen(false);
            }}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Accept this application?</AlertDialogTitle>
                <AlertDialogDescription>
                  Accept this application? This creates a client record and a
                  founder login mapping.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isAccepting}>
                  Cancel
                </AlertDialogCancel>
                <Button disabled={isAccepting} onClick={handleAccept}>
                  {isAccepting && (
                    <Loader2
                      data-icon="inline-start"
                      className="animate-spin"
                    />
                  )}
                  {isAccepting ? 'Accepting…' : 'Accept'}
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </DialogContent>
    </Dialog>
  );
};