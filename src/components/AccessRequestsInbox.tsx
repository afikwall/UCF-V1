import {
  useEntityGetAll,
  useEntityUpdate,
  useExecuteAction,
} from '@blocksdiy/blocks-client-sdk/reactSdk';
import {
  AccessRequestsEntity,
  SitesEntity,
  ClientsEntity,
  ApproveAccessRequestAction,
  DenyAccessRequestAction,
} from '@/product-types';
import { toast } from 'sonner';
import { Inbox, Copy, MailPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

type Request = (typeof AccessRequestsEntity)['instanceType'] & { id: string };
type Site = (typeof SitesEntity)['instanceType'] & { id: string };
type Client = (typeof ClientsEntity)['instanceType'] & { id: string };

const UNASSIGNED = '__unassigned__';

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

const isPending = (s?: string) => s === 'Pending';

export const AccessRequestsInbox = () => {
  const { data: requests, isLoading } = useEntityGetAll(AccessRequestsEntity);
  const { data: sites } = useEntityGetAll(SitesEntity);
  const { data: clients } = useEntityGetAll(ClientsEntity);

  const { executeFunction: approve } = useExecuteAction(
    ApproveAccessRequestAction,
  );
  const { executeFunction: deny } = useExecuteAction(DenyAccessRequestAction);
  const { updateFunction } = useEntityUpdate(AccessRequestsEntity);

  const siteList = (sites ?? []) as Site[];
  const clientList = (clients ?? []) as Client[];
  const reqList = (requests ?? []) as Request[];

  const siteName = (id?: string) =>
    siteList.find((s) => s.id === id)?.siteName ?? 'Unknown site';
  const companyName = (id?: string) =>
    clientList.find((c) => c.id === id)?.companyName ?? 'Unknown company';

  const targetLabel = (r: Request) => {
    if (r.requestedRole === 'Client' && r.targetClientId)
      return `Company: ${companyName(r.targetClientId)}`;
    if (r.requestedRole === 'Funder' && r.targetFunderId)
      return `Funder: ${companyName(r.targetFunderId)}`;
    if (r.targetSiteId) return `Site: ${siteName(r.targetSiteId)}`;
    return '—';
  };

  const handleApprove = async (r: Request) => {
    try {
      const res = await approve({ requestId: r.id });
      if (res?.success) {
        toast.success(
          res.pendingInvite
            ? 'Approved — invite the email in App Settings → Members'
            : 'Request approved',
        );
      } else {
        toast.error(res?.message || 'Failed to approve');
      }
    } catch {
      toast.error('Failed to approve');
    }
  };

  const handleDeny = async (r: Request) => {
    try {
      const res = await deny({ requestId: r.id });
      if (res?.success) {
        toast.success('Request denied');
      } else {
        toast.error(res?.message || 'Failed to deny');
      }
    } catch {
      toast.error('Failed to deny');
    }
  };

  const handleCopy = async (email?: string) => {
    if (!email) return;
    try {
      await navigator.clipboard.writeText(email);
      toast.success(`Copied ${email}`);
    } catch {
      toast.error('Could not copy to clipboard');
    }
  };

  const handleClearInvite = async (r: Request) => {
    try {
      await updateFunction({ id: r.id, data: { inviteCleared: true } });
      toast.success('Marked as invited');
    } catch {
      toast.error('Failed to update');
    }
  };

  // Group by siteId; pending first then decided within each group.
  const groups = new Map<string, Request[]>();
  for (const r of reqList) {
    const key = r.siteId || UNASSIGNED;
    const arr = groups.get(key) ?? [];
    arr.push(r);
    groups.set(key, arr);
  }
  const sortedGroups = Array.from(groups.entries()).map(([key, rows]) => {
    const sorted = [...rows].sort((a, b) => {
      const ap = isPending(a.status) ? 0 : 1;
      const bp = isPending(b.status) ? 0 : 1;
      return ap - bp;
    });
    return [key, sorted] as const;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Access Requests</CardTitle>
        <CardDescription>
          Review and decide on access-provisioning requests filed by staff.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : reqList.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <Inbox className="size-8 text-muted-foreground" />
            <div className="flex flex-col gap-1">
              <p className="font-medium text-foreground">No requests</p>
              <p className="text-sm text-muted-foreground">
                Access requests filed by staff will appear here.
              </p>
            </div>
          </div>
        ) : (
          sortedGroups.map(([groupKey, rows]) => (
            <div key={groupKey} className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold text-foreground">
                {groupKey === UNASSIGNED
                  ? 'Unassigned / Program-wide'
                  : siteName(groupKey)}
              </h3>
              <div className="flex flex-col gap-3">
                {rows.map((r) => (
                  <div
                    key={r.id}
                    className="flex flex-col gap-3 rounded-lg border border-border p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex flex-col gap-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-foreground">
                            {r.requestedUserEmail}
                          </span>
                          <Badge variant="secondary">{r.requestedRole}</Badge>
                          <Badge variant={statusVariant(r.status)}>
                            {r.status ?? 'Pending'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {targetLabel(r)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Requested by {r.requesterEmail || 'unknown'}
                        </p>
                        {r.note && (
                          <p className="text-sm text-foreground">{r.note}</p>
                        )}
                      </div>
                      {isPending(r.status) && (
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleApprove(r)}>
                            Approve
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                Deny
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Deny request?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This denies access for{' '}
                                  {r.requestedUserEmail}. No linkage will be
                                  created.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeny(r)}
                                >
                                  Deny
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      )}
                    </div>

                    {r.status === 'Approved - pending invite' &&
                      r.inviteCleared !== true && (
                        <Alert>
                          <MailPlus />
                          <AlertTitle>Finish provisioning</AlertTitle>
                          <AlertDescription>
                            <div className="flex flex-col gap-3">
                              <p>
                                Invite this person as a{' '}
                                <span className="font-medium">use</span> member
                                in App Settings → Members. The linkage is already
                                created — they just need an account.
                              </p>
                              <div className="flex flex-wrap items-center gap-2">
                                <code className="rounded bg-muted px-2 py-1 text-sm text-foreground">
                                  {r.requestedUserEmail}
                                </code>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleCopy(r.requestedUserEmail)
                                  }
                                >
                                  <Copy data-icon="inline-start" />
                                  Copy
                                </Button>
                              </div>
                              <Label className="flex items-center gap-2">
                                <Checkbox
                                  checked={false}
                                  onCheckedChange={(checked) => {
                                    if (checked === true) handleClearInvite(r);
                                  }}
                                />
                                <span className="text-sm font-normal">
                                  Invited / account exists
                                </span>
                              </Label>
                            </div>
                          </AlertDescription>
                        </Alert>
                      )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};