import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
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
} from '@/components/ui/chart';
import { ApplicationsEntity } from '@/product-types';

type App = typeof ApplicationsEntity['instanceType'];

// Meaningful in-pipeline statuses to surface as a funnel-like bar chart.
const PIPELINE_STATUSES = [
  'Application Submitted',
  'Under Review',
  'Intro Meeting',
  'Presentation',
  'Scored',
  'Accepted',
] as const;

const chartConfig = {
  count: { label: 'Applications', color: 'hsl(var(--chart-1))' },
};

interface Props {
  applications: App[];
  isLoading?: boolean;
}

export const PipelineKpis = ({ applications, isLoading }: Props) => {
  const apps = applications ?? [];

  const data = PIPELINE_STATUSES.map((status) => ({
    status,
    count: apps.filter((a) => a?.status === status).length,
  }));

  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Applications Pipeline</CardTitle>
        <CardDescription>
          Application counts across review stages.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : total === 0 ? (
          <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
            No data yet
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
            <BarChart data={data} layout="vertical" margin={{ left: 24 }}>
              <CartesianGrid horizontal={false} strokeDasharray="3 3" />
              <XAxis type="number" allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="status"
                width={160}
                tick={{ fontSize: 12 }}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey="count"
                fill="var(--color-count)"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
};