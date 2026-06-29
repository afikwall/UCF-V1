import { useEntityGetAll } from '@blocksdiy/blocks-client-sdk/reactSdk';
import {
  ClientMilestoneProgressEntity,
  StageMilestonesEntity,
} from '@/product-types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { PortalMilestoneRow } from '@/components/portal/PortalMilestoneRow';

// Reads the Client's own ClientMilestoneProgress rows (server-side RowPolicy is
// the isolation boundary). Joins to StageMilestones for titles. Each row is
// editable (status + client comment) via the UpsertMyMilestoneProgress action.
export const PortalMilestones = ({ clientId }: { clientId?: string }) => {
  const { data: progress, isLoading } = useEntityGetAll(
    ClientMilestoneProgressEntity,
  );
  const { data: milestones } = useEntityGetAll(StageMilestonesEntity);

  const titleById = new Map<string, string>();
  (milestones ?? []).forEach((m) => {
    if (m.id) titleById.set(m.id, m.title ?? 'Milestone');
  });

  const rows = (progress ?? []).filter(
    (p) => !clientId || p.clientId === clientId,
  );
  const completedCount = rows.filter((p) => p.status === 'Completed').length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <CardTitle>Milestones</CardTitle>
            <CardDescription>
              Update your progress and leave notes for your program team.
            </CardDescription>
          </div>
          {!isLoading && (
            <Badge variant="secondary">
              {completedCount}/{rows.length} done
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {isLoading ? (
          <Skeleton className="h-20 w-full" />
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No milestones assigned yet.
          </p>
        ) : (
          rows.map((p) => (
            <PortalMilestoneRow
              key={p.id}
              progress={p}
              title={
                p.stageMilestoneId
                  ? titleById.get(p.stageMilestoneId) ?? 'Milestone'
                  : 'Milestone'
              }
            />
          ))
        )}
      </CardContent>
    </Card>
  );
};