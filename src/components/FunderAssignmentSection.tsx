import { useState, type FormEvent } from 'react';
import {
  useEntityGetAll,
  useExecuteAction,
} from '@blocksdiy/blocks-client-sdk/reactSdk';
import {
  ClientsEntity,
  FunderUsersEntity,
  StaffAssignmentsEntity,
  ClientUsersEntity,
  AssignFunderCompanyAction,
  RevokeFunderCompanyAction,
} from '@/product-types';
import { normalizeEmail } from '@/utils/EmailUtils';
import { toast } from 'sonner';
import { Loader2, Landmark, TriangleAlert, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
import { Skeleton } from '@/components/ui/skeleton';

type Client = (typeof ClientsEntity)['instanceType'] & { id: string };
type FunderUser = (typeof FunderUsersEntity)['instanceType'] & { id: string };

export const FunderAssignmentSection = () => {
  const { data: clients } = useEntityGetAll(ClientsEntity);
  const { data: funderUsers, isLoading } = useEntityGetAll(FunderUsersEntity);
  const { data: staffAssignments } = useEntityGetAll(StaffAssignmentsEntity);
  const { data: clientUsers } = useEntityGetAll(ClientUsersEntity);

  const { executeFunction: assign, isLoading: assigning } = useExecuteAction(
    AssignFunderCompanyAction,
  );
  const { executeFunction: revoke } = useExecuteAction(RevokeFunderCompanyAction);

  const [email, setEmail] = useState('');
  const [funderId, setFunderId] = useState('');

  const clientList = (clients ?? []) as Client[];
  const userList = (funderUsers ?? []) as FunderUser[];

  const companyName = (id?: string) =>
    clientList.find((c) => c.id === id)?.companyName ?? 'Unknown company';

  const normalized = normalizeEmail(email);

  const hasStaffConflict =
    !!normalized &&
    (staffAssignments ?? []).some(
      (a) => normalizeEmail(a.userEmail ?? '') === normalized,
    );
  const hasClientConflict =
    !!normalized &&
    (clientUsers ?? []).some(
      (c) => normalizeEmail(c.userEmail ?? '') === normalized,
    );
  const showConflict = hasStaffConflict || hasClientConflict;

  // Group funder rows by email.
  const grouped = new Map<string, FunderUser[]>();
  for (const row of userList) {
    const key = normalizeEmail(row.userEmail ?? '');
    if (!key) continue;
    const arr = grouped.get(key) ?? [];
    arr.push(row);
    grouped.set(key, arr);
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!normalized) {
      toast.error('Email is required');
      return;
    }
    if (!funderId) {
      toast.error('Select a company');
      return;
    }
    try {
      const res = await assign({ userEmail: normalized, funderId });
      if (res?.success) {
        toast.success(
          res.created
            ? `Linked ${normalized} to ${companyName(funderId)}`
            : `${normalized} is already linked to ${companyName(funderId)}`,
        );
        setEmail('');
        setFunderId('');
      } else {
        toast.error(res?.message || 'Failed to link company');
      }
    } catch {
      toast.error('Failed to link company');
    }
  };

  const handleRemove = async (userEmail: string, fId: string) => {
    try {
      const res = await revoke({
        userEmail: normalizeEmail(userEmail),
        funderId: fId,
      });
      if (res?.success) {
        toast.success(`Removed link to ${companyName(fId)}`);
      } else {
        toast.error(res?.message || 'Failed to remove link');
      }
    } catch {
      toast.error('Failed to remove link');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Funder Company Access</CardTitle>
        <CardDescription>
          Link a funder email to one or more companies. Funders may track
          multiple portfolio companies.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="funderEmail">Funder Email</FieldLabel>
                <Input
                  id="funderEmail"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={assigning}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="funderCompany">Company</FieldLabel>
                <Select
                  value={funderId}
                  onValueChange={setFunderId}
                  disabled={assigning}
                >
                  <SelectTrigger id="funderCompany">
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
            </div>
            {showConflict && (
              <Alert variant="destructive">
                <TriangleAlert />
                <AlertTitle>Precedence conflict</AlertTitle>
                <AlertDescription>
                  This email is already provisioned as{' '}
                  {hasStaffConflict ? 'staff' : 'a client'}; per precedence they
                  will resolve as that, not as a funder.
                </AlertDescription>
              </Alert>
            )}
            <div>
              <Button type="submit" disabled={assigning}>
                {assigning && (
                  <Loader2 data-icon="inline-start" className="animate-spin" />
                )}
                Link Company
              </Button>
            </div>
          </FieldGroup>
        </form>

        <Separator />

        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : grouped.size === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <Landmark className="size-8 text-muted-foreground" />
            <div className="flex flex-col gap-1">
              <p className="font-medium text-foreground">
                No funder company links yet
              </p>
              <p className="text-sm text-muted-foreground">
                Use the form above to link a funder email to a company.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {Array.from(grouped.entries()).map(([groupEmail, rows]) => (
              <div
                key={groupEmail}
                className="flex flex-col gap-3 rounded-lg border border-border p-4"
              >
                <p className="font-medium text-foreground">{groupEmail}</p>
                <div className="flex flex-wrap gap-2">
                  {rows.map((row) => (
                    <Badge
                      key={row.id}
                      variant="secondary"
                      className="gap-1 pr-1"
                    >
                      {companyName(row.funderId)}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-4"
                        aria-label={`Remove ${companyName(row.funderId)}`}
                        onClick={() =>
                          handleRemove(
                            row.userEmail ?? groupEmail,
                            row.funderId ?? '',
                          )
                        }
                      >
                        <X />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};