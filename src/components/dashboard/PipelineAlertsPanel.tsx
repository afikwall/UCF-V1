import { Link } from 'react-router';
import { getPageUrl } from '@/lib/utils';
import { AlertTriangle, Clock, CalendarClock, Gavel } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ApplicationsEntity } from '@/product-types';
import {
  computeAlerts,
  daysSince,
  PipelineAlertThresholds,
} from '@/utils/pipelineAlerts';

type App = typeof ApplicationsEntity['instanceType'] & {
  id?: string;
  updatedAt?: string;
  createdAt?: string;
};

interface Props {
  applications: App[];
  thresholds: PipelineAlertThresholds;
  isLoading?: boolean;
}

interface AlertSectionProps {
  title: string;
  icon: typeof Clock;
  apps: App[];
}

const AlertSection = ({ title, icon: Icon, apps }: AlertSectionProps) => (
  <div className="flex flex-col gap-2">
    <div className="flex items-center gap-2">
      <Icon className="size-4 text-muted-foreground" />
      <span className="text-sm font-semibold text-foreground">{title}</span>
      <Badge variant={apps.length > 0 ? 'destructive' : 'secondary'}>
        {apps.length}
      </Badge>
    </div>
    {apps.length === 0 ? (
      <p className="pl-6 text-xs text-muted-foreground">No alerts</p>
    ) : (
      <ul className="flex flex-col gap-1 pl-6">
        {apps.map((app) => {
          const days = daysSince(app.updatedAt ?? app.createdAt);
          return (
            <li key={app.id ?? app.companyName}>
              <Link
                to={getPageUrl('Pipeline')}
                className="flex items-center justify-between gap-2 rounded-md px-2 py-1 text-sm hover:bg-accent hover:text-accent-foreground"
              >
                <span className="truncate font-medium">
                  {app.companyName || 'Unnamed company'}
                </span>
                <span className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline">{app.status}</Badge>
                  {days}d waiting
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    )}
  </div>
);

export const PipelineAlertsPanel = ({
  applications,
  thresholds,
  isLoading,
}: Props) => {
  const alerts = computeAlerts(applications, thresholds);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="size-5 text-accent" />
          <CardTitle>Pipeline Alerts</CardTitle>
        </div>
        <CardDescription>
          Applications that need attention based on time-in-stage rules.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {isLoading ? (
          <>
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </>
        ) : (
          <>
            <AlertSection
              title="Decision overdue"
              icon={Gavel}
              apps={alerts.decisionOverdue}
            />
            <AlertSection
              title="Intro not scheduled"
              icon={CalendarClock}
              apps={alerts.introNotScheduled}
            />
            <AlertSection
              title="Stuck in stage"
              icon={Clock}
              apps={alerts.stuck}
            />
            <p className="border-t border-border pt-3 text-xs text-muted-foreground">
              Current thresholds: stuck &gt;{thresholds.stuckInStageDays}d, intro
              &gt;{thresholds.introNotScheduledDays}d, decision &gt;
              {thresholds.decisionOverdueDays}d (configurable)
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
};