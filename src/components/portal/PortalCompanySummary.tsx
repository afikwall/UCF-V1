import { ClientsEntity } from '@/product-types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Building2 } from 'lucide-react';
import { PortalProfileEditor } from '@/components/portal/PortalProfileEditor';

type Client = typeof ClientsEntity['instanceType'] & { id?: string };

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

const Row = ({ label, value }: { label: string; value?: string | number }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
      {label}
    </span>
    <span className="text-sm text-foreground">
      {value === undefined || value === null || value === '' ? '—' : value}
    </span>
  </div>
);

// Client-safe summary. NEVER renders riskLevel or ein (the ColumnPolicy strips
// them server-side for clients; we also never reference them here).
export const PortalCompanySummary = ({ client }: { client: Client }) => {
  const initials = (client.companyName || 'C')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
          <Avatar className="size-14">
            <AvatarImage src={client.logoUrl} alt={client.companyName} />
            <AvatarFallback>
              {client.logoUrl ? <Building2 /> : initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-1">
            <CardTitle className="text-2xl">
              {client.companyName || 'Your Company'}
            </CardTitle>
            <CardDescription className="flex flex-wrap items-center gap-2">
              {client.track && <Badge variant="secondary">{client.track}</Badge>}
              {client.stage && <Badge variant="outline">{client.stage}</Badge>}
            </CardDescription>
          </div>
          </div>
          <PortalProfileEditor client={client} />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Row label="Industry / NAICS" value={client.industryNaics} />
          <Row label="Start date" value={formatDate(client.startDate)} />
          <Row label="Track" value={client.track} />
          <Row label="Current stage" value={client.stage} />
          <Row label="Mentors engaged" value={client.mentorsEngaged} />
          <Row label="Resources used" value={client.resourcesUsed} />
        </div>
        {client.description && (
          <>
            <Separator />
            <Row label="About" value={client.description} />
          </>
        )}
      </CardContent>
    </Card>
  );
};