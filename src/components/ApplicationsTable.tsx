import { useState } from 'react';
import { useEntityGetAll } from '@blocksdiy/blocks-client-sdk/reactSdk';
import { ApplicationsEntity, SitesEntity } from '@/product-types';
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
import { Card, CardContent } from '@/components/ui/card';
import { ApplicationDetailDialog } from '@/components/ApplicationDetailDialog';

type Application = typeof ApplicationsEntity['instanceType'] & {
  id?: string;
  createdAt?: string;
};

interface AppFilter {
  where: { column: string; operator: string; value: string[] };
}

interface ApplicationsTableProps {
  filter?: AppFilter;
  enabled: boolean;
}

const formatDate = (iso?: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const ApplicationsTable = ({ filter, enabled }: ApplicationsTableProps) => {
  const [selected, setSelected] = useState<Application | null>(null);

  const { data: applications, isLoading } = useEntityGetAll(
    ApplicationsEntity,
    filter as Record<string, unknown> | undefined,
    { enabled },
  );

  const { data: sites } = useEntityGetAll(SitesEntity);

  const siteNameById = new Map<string, string>();
  (sites ?? []).forEach((s) => {
    if (s.id) siteNameById.set(s.id, s.siteName ?? 'Unnamed site');
  });

  const rows = (applications ?? []) as Application[];
  const newCount = rows.filter((r) => r.status === 'Application Submitted').length;

  if (!enabled) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No sites are assigned to your account yet. Once you're assigned to a
          site, applications will appear here.
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No applications yet. New submissions will show up here automatically.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <h2 className="text-sm font-semibold text-foreground">
          {rows.length} application{rows.length === 1 ? '' : 's'}
        </h2>
        {newCount > 0 && (
          <Badge>
            {newCount} new
          </Badge>
        )}
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Track</TableHead>
                <TableHead>Site</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Founder</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="text-right">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((app) => (
                <TableRow key={app.id}>
                  <TableCell className="font-medium">
                    {app.companyName || '—'}
                  </TableCell>
                  <TableCell>
                    {app.recommendedTrack ? (
                      <Badge variant="secondary">{app.recommendedTrack}</Badge>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell>
                    {app.selectedSiteId
                      ? siteNameById.get(app.selectedSiteId) ?? '—'
                      : '—'}
                  </TableCell>
                  <TableCell>
                    {app.status ? (
                      <Badge variant="outline">{app.status}</Badge>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{app.founderName || '—'}</span>
                      <span className="text-xs text-muted-foreground">
                        {app.founderEmail || ''}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(app.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelected(app)}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <ApplicationDetailDialog
        application={selected}
        siteName={
          selected?.selectedSiteId
            ? siteNameById.get(selected.selectedSiteId)
            : undefined
        }
        onClose={() => setSelected(null)}
      />
    </div>
  );
};