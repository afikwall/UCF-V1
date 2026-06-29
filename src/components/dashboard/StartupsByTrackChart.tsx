import { PieChart, Pie, Cell } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import { ClientsEntity } from '@/product-types';

type Client = typeof ClientsEntity['instanceType'];

const TRACKS = ['Traction', 'Growth', 'Soft Landing'] as const;

const chartConfig = {
  Traction: { label: 'Traction', color: 'hsl(var(--chart-1))' },
  Growth: { label: 'Growth', color: 'hsl(var(--chart-2))' },
  'Soft Landing': { label: 'Soft Landing', color: 'hsl(var(--chart-3))' },
};

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
];

interface Props {
  clients: Client[];
  isLoading?: boolean;
}

export const StartupsByTrackChart = ({ clients, isLoading }: Props) => {
  const active = (clients ?? []).filter((c) => c?.status === 'Active');

  const data = TRACKS.map((track) => ({
    name: track,
    value: active.filter((c) => c?.track === track).length,
  })).filter((d) => d.value > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Startups by Track</CardTitle>
        <CardDescription>
          Distribution of active companies across program tracks.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[280px] w-full" />
        ) : data.length === 0 ? (
          <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
            No data yet
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="min-h-[280px] w-full">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
              >
                {data.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
};