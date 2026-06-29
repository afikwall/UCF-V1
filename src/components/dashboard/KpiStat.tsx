import { ReactNode } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface KpiStatProps {
  title: string;
  value: number | string;
  caption?: string;
  icon?: ReactNode;
  isLoading?: boolean;
}

export const KpiStat = ({
  title,
  value,
  caption,
  icon,
  isLoading,
}: KpiStatProps) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon ? <span className="text-muted-foreground">{icon}</span> : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        {isLoading ? (
          <Skeleton className="h-9 w-16" />
        ) : (
          <span className="text-3xl font-bold tracking-tight text-foreground">
            {value}
          </span>
        )}
        {caption ? (
          <span className="text-xs text-muted-foreground">{caption}</span>
        ) : null}
      </CardContent>
    </Card>
  );
};