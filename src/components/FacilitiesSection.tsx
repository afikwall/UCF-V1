import { useState } from 'react';
import { useEntityGetAll } from '@blocksdiy/blocks-client-sdk/reactSdk';
import { FacilitiesEntity, SitesEntity } from '@/product-types';
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FacilityForm } from '@/components/FacilityForm';

type Facility = typeof FacilitiesEntity['instanceType'] & { id?: string };
type Site = typeof SitesEntity['instanceType'] & { id?: string };

interface ScopeFilter {
  where: { column: string; operator: string; value: string[] };
}

interface FacilitiesSectionProps {
  filter?: ScopeFilter;
  enabled: boolean;
  /** Sites this staff member may assign a facility to (admin = all). */
  siteOptions: Site[];
}

const statusVariant = (
  status?: string,
): 'default' | 'secondary' | 'outline' | 'destructive' => {
  if (status === 'Available') return 'default';
  if (status === 'Maintenance') return 'destructive';
  return 'secondary';
};

export const FacilitiesSection = ({
  filter,
  enabled,
  siteOptions,
}: FacilitiesSectionProps) => {
  const { data: facilities, isLoading } = useEntityGetAll(
    FacilitiesEntity,
    filter as Record<string, unknown> | undefined,
    { enabled },
  );
  const { data: sites } = useEntityGetAll(SitesEntity);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Facility | null>(null);
  const [siteFilter, setSiteFilter] = useState<string>('all');

  const siteNameById = new Map<string, string>();
  (sites ?? []).forEach((s) => {
    if (s.id) siteNameById.set(s.id, s.siteName ?? 'Unnamed site');
  });

  const allRows = (facilities ?? []) as Facility[];
  const rows =
    siteFilter === 'all'
      ? allRows
      : allRows.filter((f) => f.siteId === siteFilter);

  const openNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (f: Facility) => {
    setEditing(f);
    setDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-4">
        <CardTitle>Facilities</CardTitle>
        <div className="flex items-center gap-2">
          <Select value={siteFilter} onValueChange={setSiteFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All sites" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">All sites</SelectItem>
                {siteOptions.map((s) => (
                  <SelectItem key={s.id} value={s.id ?? ''}>
                    {s.siteName ?? 'Unnamed site'}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Button onClick={openNew} disabled={!enabled || siteOptions.length === 0}>
            <Plus data-icon="inline-start" />
            New facility
          </Button>
        </div>
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
            No facilities yet. Add a suite or conference room to get started.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Amenities</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Site</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((f) => (
                <TableRow
                  key={f.id}
                  className="cursor-pointer"
                  onClick={() => openEdit(f)}
                >
                  <TableCell className="font-medium">{f.name || '—'}</TableCell>
                  <TableCell>
                    {f.type ? <Badge variant="outline">{f.type}</Badge> : '—'}
                  </TableCell>
                  <TableCell>{f.capacity ?? '—'}</TableCell>
                  <TableCell className="max-w-[220px] truncate text-muted-foreground">
                    {f.amenities || '—'}
                  </TableCell>
                  <TableCell>
                    {f.availabilityStatus ? (
                      <Badge variant={statusVariant(f.availabilityStatus)}>
                        {f.availabilityStatus}
                      </Badge>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {f.siteId ? siteNameById.get(f.siteId) ?? '—' : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
      {dialogOpen && (
        <FacilityForm
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          facility={editing}
          siteOptions={siteOptions}
        />
      )}
    </Card>
  );
};