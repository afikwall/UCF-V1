import { useState, type FormEvent } from 'react';
import {
  useEntityGetAll,
  useExecuteAction,
} from '@blocksdiy/blocks-client-sdk/reactSdk';
import {
  ClientsEntity,
  ClientUsersEntity,
  StaffAssignmentsEntity,
  FunderUsersEntity,
  AssignClientCompanyAction,
  RevokeClientCompanyAction,
} from '@/product-types';
import { normalizeEmail } from '@/utils/EmailUtils';
import { toast } from 'sonner';
import { Loader2, Building2, TriangleAlert } from 'lucide-react';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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

type Client = (typeof ClientsEntity)['instanceType'] & { id: string };
type ClientUser = (typeof ClientUsersEntity)['instanceType'] & { id: string };

export const ClientAssignmentSection = () => {
  const { data: clients } = useEntityGetAll(ClientsEntity);
  const { data: clientUsers, isLoading } = useEntityGetAll(ClientUsersEntity);
  const { data: staffAssignments } = useEntityGetAll(StaffAssignmentsEntity);
  const { data: funderUsers } = useEntityGetAll(FunderUsersEntity);

  const { executeFunction: assign, isLoading: assigning } = useExecuteAction(
    AssignClientCompanyAction,
  );
  const { executeFunction: revoke } = useExecuteAction(RevokeClientCompanyAction);

  const [email, setEmail] = useState('');
  const [clientId, setClientId] = useState('');

  const clientList = (clients ?? []) as Client[];
  const userList = (clientUsers ?? []) as ClientUser[];

  const companyName = (id?: string) =>
    clientList.find((c) => c.id === id)?.companyName ?? 'Unknown company';

  const normalized = normalizeEmail(email);

  const hasStaffConflict =
    !!normalized &&
    (staffAssignments ?? []).some(
      (a) => normalizeEmail(a.userEmail ?? '') === normalized,
    );
  const hasFunderConflict =
    !!normalized &&
    (funderUsers ?? []).some(
      (f) => normalizeEmail(f.userEmail ?? '') === normalized,
    );
  const showConflict = hasStaffConflict || hasFunderConflict;

  const startChange = (row: ClientUser) => {
    setEmail(row.userEmail ?? '');
    setClientId(row.clientId ?? '');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!normalized) {
      toast.error('Email is required');
      return;
    }
    if (!clientId) {
      toast.error('Select a company');
      return;
    }
    try {
      const res = await assign({ userEmail: normalized, clientId });
      if (res?.success) {
        toast.success(
          res.moved
            ? `Moved ${normalized} to ${companyName(clientId)}`
            : `Assigned ${normalized} to ${companyName(clientId)}`,
        );
        setEmail('');
        setClientId('');
      } else {
        toast.error(res?.message || 'Failed to assign company');
      }
    } catch {
      toast.error('Failed to assign company');
    }
  };

  const handleRevoke = async (row: ClientUser) => {
    try {
      const res = await revoke({ userEmail: normalizeEmail(row.userEmail ?? '') });
      if (res?.success) {
        toast.success(`Revoked access for ${row.userEmail}`);
      } else {
        toast.error(res?.message || 'Failed to revoke access');
      }
    } catch {
      toast.error('Failed to revoke access');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Client Company Access</CardTitle>
        <CardDescription>
          Assign a client email to exactly one company. Reassigning moves the
          single link — clients never belong to more than one company.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="clientEmail">Client Email</FieldLabel>
                <Input
                  id="clientEmail"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={assigning}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="clientCompany">Company</FieldLabel>
                <Select
                  value={clientId}
                  onValueChange={setClientId}
                  disabled={assigning}
                >
                  <SelectTrigger id="clientCompany">
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
                  {hasStaffConflict ? 'staff' : 'a funder'}; per precedence they
                  will resolve as that, not as a client.
                </AlertDescription>
              </Alert>
            )}
            <div>
              <Button type="submit" disabled={assigning}>
                {assigning && (
                  <Loader2 data-icon="inline-start" className="animate-spin" />
                )}
                Assign Company
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
        ) : userList.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <Building2 className="size-8 text-muted-foreground" />
            <div className="flex flex-col gap-1">
              <p className="font-medium text-foreground">
                No client company links yet
              </p>
              <p className="text-sm text-muted-foreground">
                Use the form above to link a client email to a company.
              </p>
            </div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {userList.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.userEmail}</TableCell>
                  <TableCell>{companyName(row.clientId)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{row.status ?? 'Invited'}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startChange(row)}
                      >
                        Change
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            Revoke
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Revoke access?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This removes {row.userEmail} from{' '}
                              {companyName(row.clientId)}.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleRevoke(row)}>
                              Revoke
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};