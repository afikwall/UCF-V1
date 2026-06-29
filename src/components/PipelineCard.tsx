import { ApplicationsEntity } from '@/product-types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ArrowRight, CalendarClock } from 'lucide-react';
import { getNextStatuses } from '@/utils/PipelineUtils';
import { cn } from '@/lib/utils';

type Application = typeof ApplicationsEntity['instanceType'] & { id?: string };

interface PipelineCardProps {
  application: Application;
  siteName?: string;
  weightedTotal?: number;
  onOpen: (app: Application) => void;
  onMove: (app: Application, nextStatus: string) => void;
  onDragStart: (app: Application) => void;
  onDragEnd: () => void;
  didDrag: () => boolean;
}

const formatDate = (iso?: string) => {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

export const PipelineCard = ({
  application,
  siteName,
  weightedTotal,
  onOpen,
  onMove,
  onDragStart,
  onDragEnd,
  didDrag,
}: PipelineCardProps) => {
  const nextStatuses = getNextStatuses(application.status);

  return (
    <Card
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move';
        onDragStart(application);
      }}
      onDragEnd={onDragEnd}
      className={cn(
        'flex cursor-grab flex-col gap-1.5 border-border p-2 active:cursor-grabbing',
      )}
    >
      <button
        type="button"
        onClick={() => {
          if (didDrag()) return;
          onOpen(application);
        }}
        className="text-left"
      >
        <span className="block truncate text-xs font-semibold text-foreground hover:underline">
          {application.companyName || 'Untitled company'}
        </span>
      </button>

      <span className="truncate text-[11px] text-muted-foreground">
        {siteName || 'Unassigned site'}
      </span>

      {(application.recommendedTrack || typeof weightedTotal === 'number') && (
        <div className="flex flex-wrap items-center gap-1">
          {application.recommendedTrack && (
            <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
              {application.recommendedTrack}
            </Badge>
          )}
          {typeof weightedTotal === 'number' && (
            <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
              Fit {weightedTotal}
            </Badge>
          )}
        </div>
      )}

      {application.status === 'Hold' && application.holdReason && (
        <div className="flex flex-col gap-0.5 rounded-md bg-muted p-1.5">
          <span className="line-clamp-2 text-[10px] text-muted-foreground">
            {application.holdReason}
          </span>
          {application.followUpDate && (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <CalendarClock className="size-3" />
              {formatDate(application.followUpDate)}
            </span>
          )}
        </div>
      )}

      {nextStatuses.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 w-full text-xs">
              Move
              <ArrowRight data-icon="inline-end" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Move to</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {nextStatuses.map((s) => (
                <DropdownMenuItem
                  key={s}
                  onClick={() => onMove(application, s)}
                >
                  {s}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </Card>
  );
};