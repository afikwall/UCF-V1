import { useEntityGetAll } from '@blocksdiy/blocks-client-sdk/reactSdk';
import { StageDefinitionsEntity } from '@/product-types';
import { cn } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Check } from 'lucide-react';

interface StageStepperProps {
  track?: string;
  currentStage?: string;
}

export const StageStepper = ({ track, currentStage }: StageStepperProps) => {
  // StageDefinitions is a tiny non-sensitive config table — fetch all and
  // filter client-side by track.
  const { data: defs, isLoading } = useEntityGetAll(StageDefinitionsEntity);

  const stages = (defs ?? [])
    .filter((d) => d.track === track)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const currentIndex = stages.findIndex((s) => s.stageName === currentStage);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Program Roadmap</CardTitle>
        <CardDescription>
          {track ? `${track} track stages` : 'Track not set'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : stages.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No stages defined for this track yet.
          </p>
        ) : (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-4">
            {stages.map((stage, index) => {
              const isCurrent = index === currentIndex;
              const isComplete = currentIndex >= 0 && index < currentIndex;
              return (
                <div key={stage.id} className="flex items-center gap-2">
                  <div className="flex flex-col items-center gap-1.5 text-center">
                    <div
                      className={cn(
                        'flex size-9 items-center justify-center rounded-full border text-sm font-semibold',
                        isCurrent &&
                          'border-primary bg-primary text-primary-foreground',
                        isComplete &&
                          'border-accent bg-accent text-accent-foreground',
                        !isCurrent &&
                          !isComplete &&
                          'border-border bg-muted text-muted-foreground',
                      )}
                    >
                      {isComplete ? <Check className="size-4" /> : index + 1}
                    </div>
                    <span
                      className={cn(
                        'max-w-[110px] text-xs',
                        isCurrent
                          ? 'font-semibold text-foreground'
                          : 'text-muted-foreground',
                      )}
                    >
                      {stage.stageName}
                    </span>
                  </div>
                  {index < stages.length - 1 && (
                    <div className="h-px w-6 bg-border" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};