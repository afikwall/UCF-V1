import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ClientsEntity } from '@/product-types';

type Client = typeof ClientsEntity['instanceType'];

interface EconomicImpact {
  grantIncome: number;
  outsideInvestment: number;
  revenueGenerated: number;
}

// Graceful-degrade source. There is NO QuarterlyImpactReports entity yet
// (Phase 6). Grant income and outside investment have no current source, so
// they return 0 ("No data yet"). Revenue is a best-effort sum of any present
// Clients.revenue values (guard null → 0) so the tile shows something real
// without ever crashing on sparse data.
function getEconomicImpact(clients: Client[]): EconomicImpact {
  const revenueGenerated = (clients ?? []).reduce(
    (sum, c) => sum + (typeof c?.revenue === 'number' ? c.revenue : 0),
    0,
  );
  return {
    grantIncome: 0,
    outsideInvestment: 0,
    revenueGenerated,
  };
}

const currency = (n: number) =>
  n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });

interface Props {
  clients: Client[];
  isLoading?: boolean;
}

export const EconomicImpactTile = ({ clients, isLoading }: Props) => {
  const impact = getEconomicImpact(clients ?? []);

  const rows = [
    { label: 'Grant Income', value: impact.grantIncome, hasData: false },
    {
      label: 'Outside Investment',
      value: impact.outsideInvestment,
      hasData: false,
    },
    {
      label: 'Revenue Generated',
      value: impact.revenueGenerated,
      hasData: impact.revenueGenerated > 0,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Economic Impact</CardTitle>
        <CardDescription>
          Populated from quarterly impact reports (Phase 6).
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {isLoading ? (
          <>
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
          </>
        ) : (
          rows.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between border-b border-border pb-2 last:border-0 last:pb-0"
            >
              <span className="text-sm text-muted-foreground">{row.label}</span>
              <span className="text-sm font-semibold text-foreground">
                {row.hasData ? currency(row.value) : 'No data yet'}
              </span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};