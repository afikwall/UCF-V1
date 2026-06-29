import { useState } from 'react';
import {
  useEntityUpdate,
  useExecuteAction,
} from '@blocksdiy/blocks-client-sdk/reactSdk';
import {
  ClientsEntity,
  SitesEntity,
  GenerateContractAction,
} from '@/product-types';
import { useEntityGetAll } from '@blocksdiy/blocks-client-sdk/reactSdk';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  FieldGroup,
  Field,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Building2,
  Pencil,
  FileText,
  Wand2,
  Loader2,
  ExternalLink,
} from 'lucide-react';

type Client = typeof ClientsEntity['instanceType'] & { id?: string };

const STATUS_OPTIONS = [
  'Prospect',
  'Applicant',
  'Active',
  'On Hold',
  'At Risk',
  'Withdrawn',
  'Graduated',
];
const RISK_OPTIONS = ['Low', 'Medium', 'High'];

const Detail = ({ label, value }: { label: string; value?: string | number }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
      {label}
    </span>
    <span className="text-sm text-foreground">
      {value === undefined || value === null || value === '' ? '—' : value}
    </span>
  </div>
);

export const ClientHeader = ({ client }: { client: Client }) => {
  const { data: sites } = useEntityGetAll(SitesEntity);
  const siteName = sites?.find((s) => s.id === client.siteId)?.siteName;

  const { updateFunction, isLoading: isSaving } =
    useEntityUpdate(ClientsEntity);
  const { executeFunction: generateContract, isLoading: isGenerating } =
    useExecuteAction(GenerateContractAction);

  const [editOpen, setEditOpen] = useState(false);
  const [autofillOpen, setAutofillOpen] = useState(false);
  const [status, setStatus] = useState(client.status ?? '');
  const [stage, setStage] = useState(client.stage ?? '');
  const [riskLevel, setRiskLevel] = useState(client.riskLevel ?? '');

  const initials = (client.companyName || 'C')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const openEdit = () => {
    setStatus(client.status ?? '');
    setStage(client.stage ?? '');
    setRiskLevel(client.riskLevel ?? '');
    setEditOpen(true);
  };

  const handleSave = async () => {
    if (!client.id) return;
    await updateFunction({
      id: client.id,
      data: {
        status: status || undefined,
        stage: stage || undefined,
        riskLevel: riskLevel || undefined,
      },
    });
    toast.success('Client updated');
    setEditOpen(false);
  };

  const handleGenerateContract = async () => {
    if (!client.id) return;
    const res = await generateContract({ clientId: client.id });
    toast.success(`Contract: ${res?.status ?? 'pending-template'}`);
  };

  const autofillFields: Array<{ label: string; value?: string | number }> = [
    { label: 'Company', value: client.companyName },
    { label: 'Founder email', value: client.founderEmail },
    { label: 'CEO', value: client.ceoName },
    { label: 'CEO email', value: client.ceoEmail },
    { label: 'CEO phone', value: client.ceoPhone },
    { label: 'EIN', value: client.ein },
    { label: 'Industry / NAICS', value: client.industryNaics },
    { label: 'Website', value: client.website },
    { label: 'Track', value: client.track },
    { label: 'Stage', value: client.stage },
    { label: 'Suite', value: client.suite },
    { label: 'Location type', value: client.locationType },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="size-14">
              <AvatarImage src={client.logoUrl} alt={client.companyName} />
              <AvatarFallback>
                {client.logoUrl ? <Building2 /> : initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-1">
              <CardTitle className="text-2xl">
                {client.companyName || 'Client'}
              </CardTitle>
              <CardDescription className="flex flex-wrap items-center gap-2">
                {client.track && (
                  <Badge variant="secondary">{client.track}</Badge>
                )}
                {client.stage && <Badge variant="outline">{client.stage}</Badge>}
                {client.status && (
                  <Badge variant="outline">{client.status}</Badge>
                )}
                {client.riskLevel && (
                  <Badge
                    variant={
                      client.riskLevel === 'High' ? 'destructive' : 'secondary'
                    }
                  >
                    Risk: {client.riskLevel}
                  </Badge>
                )}
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={openEdit}>
              <Pencil data-icon="inline-start" />
              Quick edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateContract}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <Loader2 data-icon="inline-start" className="animate-spin" />
              ) : (
                <FileText data-icon="inline-start" />
              )}
              Generate contract
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutofillOpen(true)}
            >
              <Wand2 data-icon="inline-start" />
              Run intake autofill
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Detail label="Site" value={siteName} />
          <Detail label="Suite" value={client.suite} />
          <Detail label="Location type" value={client.locationType} />
          <Detail label="Industry / NAICS" value={client.industryNaics} />
          <Detail label="EIN (internal)" value={client.ein} />
          <Detail label="Soft-landing origin" value={client.softLandingOrigin} />
        </div>

        <Separator />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Detail label="CEO" value={client.ceoName} />
          <Detail label="CEO email" value={client.ceoEmail} />
          <Detail label="CEO phone" value={client.ceoPhone} />
        </div>

        {client.website && (
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Website
            </span>
            <a
              href={client.website}
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-fit items-center gap-1 text-sm text-primary underline-offset-4 hover:underline"
            >
              {client.website}
              <ExternalLink className="size-3.5" />
            </a>
          </div>
        )}

        {client.description && (
          <>
            <Separator />
            <Detail label="Description" value={client.description} />
          </>
        )}
      </CardContent>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Quick edit</DialogTitle>
            <DialogDescription>
              Update status, stage, and risk level for {client.companyName}.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel>Status</FieldLabel>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="stage-input">Stage</FieldLabel>
              <Input
                id="stage-input"
                value={stage}
                onChange={(e) => setStage(e.target.value)}
                placeholder="Stage name"
              />
            </Field>
            <Field>
              <FieldLabel>Risk level (internal)</FieldLabel>
              <Select value={riskLevel} onValueChange={setRiskLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select risk level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {RISK_OPTIONS.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && (
                <Loader2 data-icon="inline-start" className="animate-spin" />
              )}
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={autofillOpen} onOpenChange={setAutofillOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Intake autofill preview</DialogTitle>
            <DialogDescription>
              Mapped client fields available for contracts and onboarding forms.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            {autofillFields.map((f) => (
              <Detail key={f.label} label={f.label} value={f.value} />
            ))}
          </div>
          <DialogFooter>
            <Button onClick={() => setAutofillOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};