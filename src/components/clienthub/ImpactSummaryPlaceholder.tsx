import { ClientsEntity } from '@/product-types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

type Client = typeof ClientsEntity['instanceType'];

const Metric = ({ label, value }: { label: string; value?: string | number }) => (
  <div className="flex flex-col gap-1 rounded-lg border border-border p-4">
    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
      {label}
    </span>
    <span className="text-2xl font-bold text-foreground">
      {value === undefined || value === null || value === '' ? '—' : value}
    </span>
  </div>
);

export const ImpactSummaryPlaceholder = ({ client }: { client: Client }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Impact Summary</CardTitle>
        <CardDescription>
          Full impact dashboard coming soon.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Metric
            label="Funding"
            value={
              client.funding != null
                ? `$${client.funding.toLocaleString()}`
                : undefined
            }
          />
          <Metric
            label="Revenue"
            value={
              client.revenue != null
                ? `$${client.revenue.toLocaleString()}`
                : undefined
            }
          />
          <Metric label="Team size" value={client.teamSize} />
          <Metric label="Mentors engaged" value={client.mentorsEngaged} />
          <Metric label="Resources used" value={client.resourcesUsed} />
        </div>
      </CardContent>
    </Card>
  );
};