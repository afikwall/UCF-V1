import { useRef, useState } from 'react';
import { useEntityGetAll } from '@blocksdiy/blocks-client-sdk/reactSdk';
import {
  ApplicationsEntity,
  SitesEntity,
  FitAssessmentScorecardsEntity,
} from '@/product-types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { PipelineColumn } from '@/components/PipelineColumn';
import { ApplicationDetailDialog } from '@/components/ApplicationDetailDialog';
import { HoldDialog } from '@/components/HoldDialog';
import { useApplicationStatus } from '@/hooks/useApplicationStatus';
import { PIPELINE_COLUMNS } from '@/utils/PipelineUtils';

type Application = typeof ApplicationsEntity['instanceType'] & { id?: string };

interface AppFilter {
  where: { column: string; operator: string; value: string[] };
}

interface PipelineBoardProps {
  filter?: AppFilter;
  scorecardFilter?: AppFilter;
  enabled: boolean;
}

export const PipelineBoard = ({
  filter,
  scorecardFilter,
  enabled,
}: PipelineBoardProps) => {
  const [selected, setSelected] = useState<Application | null>(null);
  const [holdApp, setHoldApp] = useState<Application | null>(null);

  // Optimistic status overrides: appId -> status. Applied while bucketing so a
  // dropped card jumps columns immediately; cleared on success or rollback.
  const [overrides, setOverrides] = useState<Record<string, string>>({});

  // Drag tracking (native HTML5 DnD). draggedRef holds the in-flight card;
  // didDragRef distinguishes a real drag from a click so detail still opens.
  const draggedRef = useRef<Application | null>(null);
  const didDragRef = useRef(false);

  const { moveTo, placeOnHold, isLoading: savingStatus } =
    useApplicationStatus();

  const { data: applications, isLoading } = useEntityGetAll(
    ApplicationsEntity,
    filter as Record<string, unknown> | undefined,
    { enabled },
  );

  const { data: sites } = useEntityGetAll(SitesEntity);

  const { data: scorecards } = useEntityGetAll(
    FitAssessmentScorecardsEntity,
    scorecardFilter as Record<string, unknown> | undefined,
    { enabled },
  );

  const siteNameById = new Map<string, string>();
  (sites ?? []).forEach((s) => {
    if (s.id) siteNameById.set(s.id, s.siteName ?? 'Unnamed site');
  });

  const weightedByAppId = new Map<string, number>();
  (scorecards ?? []).forEach((sc) => {
    if (sc.applicationId && typeof sc.weightedTotal === 'number') {
      weightedByAppId.set(sc.applicationId, sc.weightedTotal);
    }
  });

  const rows = (applications ?? []) as Application[];

  const handleMove = (app: Application, nextStatus: string) => {
    if (nextStatus === 'Hold') {
      setHoldApp(app);
      return;
    }
    moveTo(app, nextStatus).catch(() => {});
  };

  // Optimistic drag-drop move. Sets an override immediately, then persists; on
  // failure removes the override (rollback). Hold routes through the dialog.
  const handleDropCard = (status: string) => {
    const app = draggedRef.current;
    draggedRef.current = null;
    if (!app || !app.id) return;
    if ((app.status ?? '') === status) return;

    if (status === 'Hold') {
      setHoldApp(app);
      return;
    }

    const id = app.id;
    setOverrides((prev) => ({ ...prev, [id]: status }));
    moveTo(app, status).catch(() => {
      setOverrides((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    });
  };

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
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex min-w-[7rem] flex-1 basis-[8rem] flex-col gap-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No applications in the pipeline yet. New submissions appear here
          automatically.
        </CardContent>
      </Card>
    );
  }

  const byStatus = new Map<string, Application[]>();
  PIPELINE_COLUMNS.forEach((c) => byStatus.set(c.status, []));
  rows.forEach((app) => {
    const effectiveStatus =
      (app.id && overrides[app.id]) || app.status || '';
    const bucket = byStatus.get(effectiveStatus);
    if (bucket) bucket.push(app);
  });

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {PIPELINE_COLUMNS.map((col) => (
          <PipelineColumn
            key={col.status}
            label={col.label}
            status={col.status}
            applications={byStatus.get(col.status) ?? []}
            siteNameById={siteNameById}
            weightedByAppId={weightedByAppId}
            onOpen={setSelected}
            onMove={handleMove}
            onDropCard={handleDropCard}
            onCardDragStart={(app) => {
              draggedRef.current = app;
              didDragRef.current = true;
            }}
            onCardDragEnd={() => {
              // Clear the drag flag after the click event would have fired.
              setTimeout(() => {
                didDragRef.current = false;
              }, 0);
            }}
            didDrag={() => didDragRef.current}
          />
        ))}
      </div>

      <ApplicationDetailDialog
        application={selected}
        siteName={
          selected?.selectedSiteId
            ? siteNameById.get(selected.selectedSiteId)
            : undefined
        }
        onClose={() => setSelected(null)}
      />

      {holdApp && (
        <HoldDialog
          open={!!holdApp}
          onOpenChange={(open) => !open && setHoldApp(null)}
          defaultReason={holdApp.holdReason}
          defaultFollowUpDate={holdApp.followUpDate}
          saving={savingStatus}
          onConfirm={async (reason, followUpDate) => {
            const id = holdApp.id;
            if (id) setOverrides((prev) => ({ ...prev, [id]: 'Hold' }));
            try {
              await placeOnHold(holdApp, reason, followUpDate);
              setHoldApp(null);
            } catch {
              if (id) {
                setOverrides((prev) => {
                  const next = { ...prev };
                  delete next[id];
                  return next;
                });
              }
            }
          }}
        />
      )}
    </>
  );
};