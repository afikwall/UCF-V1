import { useState, type FormEvent } from 'react';
import {
  useUser,
  useEntityGetAll,
  useExecuteAction,
} from '@blocksdiy/blocks-client-sdk/reactSdk';
import {
  SitesEntity,
  ClientsEntity,
  AccessRequestsEntity,
  SubmitAccessRequestAction,
} from '@/product-types';
import { usePersonaContext } from '@/hooks/usePersona';
import { normalizeEmail } from '@/utils/EmailUtils';
import { toast } from 'sonner';
import { Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type Site = (typeof SitesEntity)['instanceType'] & { id: string };
type Client = (typeof ClientsEntity)['instanceType'] & { id: string };
type Request = (typeof AccessRequestsEntity)['instanceType'] & { id: string };

const ROLE_OPTIONS = [
  'Client',
  'Funder',
  'SiteManager',
  'ProgramCoordinator',
] as const;

const statusVariant = (
  status?: string,
): 'default' | 'secondary' | 'outline' | 'destructive' => {
  switch (status) {
    case 'Pending':
      return 'outline';
    case 'Approved':
      return 'default';
    case 'Approved - pending invite':
      return 'secondary';
    case 'Denied':
      return 'destructive';
    default:
      return 'outline';
  }
};

const isStaffRole = (r: string) =>
  r === 'SiteManager' || r === 'ProgramCoordinator';

export const RequestAccessForm = () => {
  const user = useUser();
  const persona = usePersonaContext();
  const email = user.isAuthenticated ? normalizeEmail(user.email) : '';

  // Staff scope — only the caller's own siteIds.
  const mySiteIds =
    persona.status === 'ready' &&
    (persona.persona === 'SiteManager' ||
      persona.persona === 'ProgramCoordinator')
      ? persona.scope.siteIds
      : [];

  const { data: sites } = useEntityGetAll(SitesEntity);
  const { data: clients } = useEntityGetAll(ClientsEntity);
  const { data: myRequests } = useEntityGetAll(
    AccessRequestsEntity,
    { requesterEmail: email },
    { enabled: !!email },
  );
  const { executeFunction, isLoading } = useExecuteAction(
    SubmitAccessRequestAction,
  );

  const siteList = (sites ?? []) as Site[];
  const clientList = (clients ?? []) as Client[];
  const requestList = (myRequests ?? []) as Request[];

  const mySites = siteList.filter((s) => mySiteIds.includes(s.id));

  const [requestedUserEmail, setRequestedUserEmail] = useState('');
  const [requestedRole, setRequestedRole] = useState('');
  const [targetClientId, setTargetClientId] = useState('');
  const [targetSiteId, setTargetSiteId] = useState('');
  const [note, setNote] = useState('');

  const showCompany = requestedRole === 'Client' || requestedRole === 'Funder';
  const showSite = isStaffRole(requestedRole);

  const siteName = (id?: string) =>
    siteList.find((s) => s.id === id)?.siteName ?? 'Unknown site';
  const companyName = (id?: string) =>
    clientList.find((c) => c.id === id)?.companyName ?? 'Unknown company';

  const reset = () => {
    setRequestedUserEmail('');
    setRequestedRole('');
    setTargetClientId('');
    setTargetSiteId('');
    setNote('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const normalized = normalizeEmail(requestedUserEmail);
    if (!normalized) {
      toast.error('Enter the email to grant access');
      return;
    }
    if (!requestedRole) {
      toast.error('Select a role');
      return;
    }
    if (showCompany && !targetClientId) {
      toast.error('Select a company');
      return;
    }
    if (showSite && !targetSiteId) {
      toast.error('Select a site');
      return;
    }

    try {
      const res = await executeFunction({
        requestedUserEmail: normalized,
        requestedRole,
        targetClientId: showCompany ? targetClientId : undefined,
        targetFunderId: undefined,
        targetSiteId: showSite ? targetSiteId : undefined,
        note: note || undefined,
      });
      if (res?.success) {
        toast.success('Access request submitted');
        reset();
      } else {
        toast.error(res?.message || 'Failed to submit request');
      }
    } catch {
      toast.error('Failed to submit request');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Request Access</CardTitle>
        <CardDescription>
          File a request for a Program Admin to grant someone access. Site
          requests are limited to your assigned sites.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="reqEmail">Email to grant access</FieldLabel>
                <Input
                  id="reqEmail"
                  type="email"
                  placeholder="name@example.com"
                  value={requestedUserEmail}
                  onChange={(e) => setRequestedUserEmail(e.target.value)}
                  disabled={isLoading}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="reqRole">Role</FieldLabel>
                <Select
                  value={requestedRole}
                  onValueChange={(v) => {
                    setRequestedRole(v);
                    setTargetClientId('');
                    setTargetSiteId('');
                  }}
                  disabled={isLoading}
                >
                  <SelectTrigger id="reqRole">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {ROLE_OPTIONS.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              {showCompany && (
                <Field>
                  <FieldLabel htmlFor="reqCompany">Company</FieldLabel>
                  <Select
                    value={targetClientId}
                    onValueChange={setTargetClientId}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="reqCompany">
                      <SelectValue placeholder="Select a company" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {clientList.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.companyName || 'Unnamed company'}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
              )}
              {showSite && (
                <Field>
                  <FieldLabel htmlFor="reqSite">Site</FieldLabel>
                  <Select
                    value={targetSiteId}
                    onValueChange={setTargetSiteId}
                    disabled={isLoading || mySites.length === 0}
                  >
                    <SelectTrigger id="reqSite">
                      <SelectValue
                        placeholder={
                          mySites.length === 0
                            ? 'No assigned sites'
                            : 'Select a site'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {mySites.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.siteName}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
              )}
            </div>
            <Field>
              <FieldLabel htmlFor="reqNote">Justification</FieldLabel>
              <Textarea
                id="reqNote"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Why does this person need access?"
                rows={3}
                disabled={isLoading}
              />
            </Field>
            <div>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 data-icon="inline-start" className="animate-spin" />
                ) : (
                  <Send data-icon="inline-start" />
                )}
                Submit Request
              </Button>
            </div>
          </FieldGroup>
        </form>

        <Separator />

        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-foreground">
            My requests
          </h3>
          {requestList.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              You haven't filed any requests yet.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {requestList.map((r) => (
                <div
                  key={r.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-foreground">
                        {r.requestedUserEmail}
                      </span>
                      <Badge variant="secondary">{r.requestedRole}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {r.targetClientId
                        ? companyName(r.targetClientId)
                        : r.targetSiteId
                          ? siteName(r.targetSiteId)
                          : 'Program-wide'}
                    </p>
                  </div>
                  <Badge variant={statusVariant(r.status)}>
                    {r.status ?? 'Pending'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};