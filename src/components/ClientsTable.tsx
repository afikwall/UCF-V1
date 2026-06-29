import { useNavigate } from 'react-router';
import { useEntityGetAll } from '@blocksdiy/blocks-client-sdk/reactSdk';
import { ClientsEntity, SitesEntity } from '@/product-types';
import { getPageUrl } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

type Client = typeof ClientsEntity['instanceType'] & { id?: string };

interface ScopeFilter {
  where: { column: string; operator: string; value: string[] };
}

interface ClientsTableProps {
  filter?: ScopeFilter;
  enabled: boolean;
}

export const ClientsTable = ({ filter, enabled }: ClientsTableProps) => {
  const navigate = useNavigate();

  const { data: clients, isLoading } = useEntityGetAll(
    ClientsEntity,
    filter as Record<string, unknown> | undefined,
    { enabled },
  );

  const { data: sites } = useEntityGetAll(SitesEntity);
  const siteNameById = new Map<string, string>();
  (sites ?? []).forEach((s) => {
    if (s.id) siteNameById.set(s.id, s.siteName ?? 'Unnamed site');
  });

  const rows = (clients ?? []) as Client[];

  if (!enabled) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No sites are assigned to your account yet. Once you're assigned to a
          site, that site's clients will appear here.
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
          No clients yet. Accepted applications become clients and show up here.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Track</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Site</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((client) => (
              <TableRow
                key={client.id}
                className="cursor-pointer"
                onClick={() =>
                  client.id &&
                  navigate(getPageUrl('ClientDetail', { id: client.id }))
                }
              >
                <TableCell className="font-medium">
                  {client.companyName || '—'}
                </TableCell>
                <TableCell>
                  {client.track ? (
                    <Badge variant="secondary">{client.track}</Badge>
                  ) : (
                    '—'
                  )}
                </TableCell>
                <TableCell>{client.stage || '—'}</TableCell>
                <TableCell>
                  {client.status ? (
                    <Badge variant="outline">{client.status}</Badge>
                  ) : (
                    '—'
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {client.siteId
                    ? siteNameById.get(client.siteId) ?? '—'
                    : '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};