import { useState } from 'react';
import { ApplicationsEntity } from '@/product-types';
import { Badge } from '@/components/ui/badge';
import { PipelineCard } from '@/components/PipelineCard';
import { cn } from '@/lib/utils';

type Application = typeof ApplicationsEntity['instanceType'] & { id?: string };

interface PipelineColumnProps {
  label: string;
  status: string;
  applications: Application[];
  siteNameById: Map<string, string>;
  weightedByAppId: Map<string, number>;
  onOpen: (app: Application) => void;
  onMove: (app: Application, nextStatus: string) => void;
  onDropCard: (status: string) => void;
  onCardDragStart: (app: Application) => void;
  onCardDragEnd: () => void;
  didDrag: () => boolean;
}

export const PipelineColumn = ({
  label,
  status,
  applications,
  siteNameById,
  weightedByAppId,
  onOpen,
  onMove,
  onDropCard,
  onCardDragStart,
  onCardDragEnd,
  didDrag,
}: PipelineColumnProps) => {
  const [isOver, setIsOver] = useState(false);

  return (
    <div className="flex min-w-[7rem] flex-1 basis-[8rem] flex-col gap-2">
      <div className="flex items-center justify-between gap-1.5 rounded-md bg-muted px-2 py-1.5">
        <span className="truncate text-xs font-semibold text-foreground">
          {label}
        </span>
        <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
          {applications.length}
        </Badge>
      </div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          if (!isOver) setIsOver(true);
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setIsOver(false);
          }
        }}
        onDrop={(e) => {
          e.preventDefault();
          setIsOver(false);
          onDropCard(status);
        }}
        className={cn(
          'flex max-h-[calc(100vh-16rem)] flex-col gap-2 overflow-y-auto rounded-md p-1 transition-colors',
          isOver && 'bg-accent/10 ring-1 ring-accent',
        )}
      >
        {applications.length === 0 ? (
          <p className="px-1 py-2 text-[11px] text-muted-foreground">
            No applications.
          </p>
        ) : (
          applications.map((app) => (
            <PipelineCard
              key={app.id}
              application={app}
              siteName={
                app.selectedSiteId
                  ? siteNameById.get(app.selectedSiteId)
                  : undefined
              }
              weightedTotal={app.id ? weightedByAppId.get(app.id) : undefined}
              onOpen={onOpen}
              onMove={onMove}
              onDragStart={onCardDragStart}
              onDragEnd={onCardDragEnd}
              didDrag={didDrag}
            />
          ))
        )}
      </div>
    </div>
  );
};