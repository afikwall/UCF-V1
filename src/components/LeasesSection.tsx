import { useState } from 'react';
import { useEntityGetAll } from '@blocksdiy/blocks-client-sdk/reactSdk';
import { LeasesEntity, ClientsEntity, FacilitiesEntity } from '@/product-types';
import { formatMoney, formatShortDate } from '@/utils/Money';
import { Plus } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LeaseForm } from '@/components/LeaseForm';

type Lease = typeof LeasesEntity['instanceType'] & { id?: string };
type Client = typeof ClientsEntity['instanceType'] & { id?: string };
type Facility = typeof FacilitiesEntity['instanceType'] & { id?: string };

interface ScopeFilter {
  where: { column: string; operator: string; value: string[] };
}

interface LeasesSectionProps {
  filter?: ScopeFilter;
  enabled: boolean;
}

const statusVariant = (
  status?: string,
): 'default' | 'secondary' | 'outline' => {
  if (status === 'Active') return 'default';
  if (status === 'Pending') return 'secondary';
  return 'outline';
};

export const LeasesSection = ({ filter, enabled }: LeasesSectionProps) => {
  const { data: leases, isLoading } = useEntityGetAll(
    LeasesEntity,
    filter as Record<string, unknown> | undefined,
    { enabled },
  );
  const { data: clients } = useEntityGetAll(
    ClientsEntity,
    filter as Record<string, unknown> | undefined,
    { enabled },
  );
  const { data: facilities } = useEntityGetAll(
    FacilitiesEntity,
    filter as Record<string, unknown> | undefined,
    { enabled },
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Lease | null>(null);

  const clientList = (clients ?? []) as Client[];
  const facilityList = (facilities ?? []) as Facility[];

  const clientNameById = new Map<string, string>();
  clientList.forEach((c) => {
    if (c.id) clientNameById.set(c.id, c.companyName ?? 'Unnamed company');
  });
  const facilityNameById = new Map<string, string>();
  facilityList.forEach((f) => {
    if (f.id) facilityNameById.set(f.id, f.name ?? 'Unnamed facility');
  });

  const rows = (leases ?? []) as Lease[];

  const openNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (l: Lease) => {
    setEditing(l);
    setDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-4">
        <CardTitle>Leases</CardTitle>
        <Button onClick={openNew} disabled={!enabled}>
          <Plus data-icon="inline-start" />
          New lease
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {!enabled ? (
          <div className="py-12 text-center text-muted-foreground">
            No sites are assigned to your account yet.
          </div>
        ) : isLoading ? (
          <div className="flex flex-col gap-3 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            No leases yet. Create a lease to assign a client to a suite.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Suite</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Facility</TableHead>
                <TableHead>Total monthly</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Move-in</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((l) => (
                <TableRow
                  key={l.id}
                  className="cursor-pointer"
                  onClick={() => openEdit(l)}
                >
                  <TableCell className="font-medium">
                    {l.suiteNumber || '—'}
                  </TableCell>
                  <TableCell>
                    {l.clientId
                      ? clientNameById.get(l.clientId) ?? '—'
                      : '—'}
                  </TableCell>
                  <TableCell>
                    {l.facilityId
                      ? facilityNameById.get(l.facilityId) ?? '—'
                      : '—'}
                  </TableCell>
                  <TableCell>{formatMoney(l.totalMonthly)}</TableCell>
                  <TableCell>
                    {l.status ? (
                      <Badge variant={statusVariant(l.status)}>
                        {l.status}
                      </Badge>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatShortDate(l.moveInDate)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
      {dialogOpen && (
        <LeaseForm
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          lease={editing}
          clients={clientList}
          facilities={facilityList}
        />
      )}
    </Card>
  );
};