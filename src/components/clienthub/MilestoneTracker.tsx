import { useState } from 'react';
import {
  useEntityGetAll,
  useEntityCreate,
  useEntityUpdate,
} from '@blocksdiy/blocks-client-sdk/reactSdk';
import {
  ClientsEntity,
  StageDefinitionsEntity,
  StageMilestonesEntity,
  ClientMilestoneProgressEntity,
} from '@/product-types';
import { withOwnerEmail } from '@/utils/OwnerEmail';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

type Client = typeof ClientsEntity['instanceType'] & { id?: string };
type Milestone = typeof StageMilestonesEntity['instanceType'] & { id?: string };
type Progress = typeof ClientMilestoneProgressEntity['instanceType'] & {
  id?: string;
};

const STATUS_OPTIONS = ['Not Started', 'In Progress', 'Completed'];

interface RowProps {
  client: Client;
  milestone: Milestone;
  progress?: Progress;
}

const MilestoneRow = ({ client, milestone, progress }: RowProps) => {
  const { createFunction, isLoading: isCreating } = useEntityCreate(
    ClientMilestoneProgressEntity,
  );
  const { updateFunction, isLoading: isUpdating } = useEntityUpdate(
    ClientMilestoneProgressEntity,
  );

  const [status, setStatus] = useState(progress?.status ?? 'Not Started');
  const [startedDate, setStartedDate] = useState(progress?.startedDate ?? '');
  const [completedDate, setCompletedDate] = useState(
    progress?.completedDate ?? '',
  );
  const [notes, setNotes] = useState(progress?.notes ?? '');

  const isSaving = isCreating || isUpdating;

  const handleSave = async () => {
    const payload = {
      status: status as Progress['status'],
      startedDate: startedDate || undefined,
      completedDate: completedDate || undefined,
      notes: notes || undefined,
    };
    if (progress?.id) {
      await updateFunction({ id: progress.id, data: payload });
    } else {
      // New progress row — stamp ownerEmail = parent Client.ownerEmail.
      await createFunction({
        data: withOwnerEmail(client, {
          clientId: client.id,
          stageMilestoneId: milestone.id,
          ...payload,
        }),
      });
    }
    toast.success('Milestone saved');
  };

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium text-foreground">
          {milestone.title || 'Untitled milestone'}
        </span>
        {milestone.description && (
          <span className="text-xs text-muted-foreground">
            {milestone.description}
          </span>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Select
          value={status}
          onValueChange={(v) => setStatus(v as Progress['status'])}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <Input
          type="date"
          value={startedDate}
          onChange={(e) => setStartedDate(e.target.value)}
          aria-label="Started date"
        />
        <Input
          type="date"
          value={completedDate}
          onChange={(e) => setCompletedDate(e.target.value)}
          aria-label="Completed date"
        />
        <Input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes"
        />
      </div>
      <div className="flex justify-end">
        <Button size="sm" onClick={handleSave} disabled={isSaving}>
          {isSaving && (
            <Loader2 data-icon="inline-start" className="animate-spin" />
          )}
          Save
        </Button>
      </div>
    </div>
  );
};

export const MilestoneTracker = ({ client }: { client: Client }) => {
  const { data: defs, isLoading: defsLoading } = useEntityGetAll(
    StageDefinitionsEntity,
  );
  const { data: allMilestones, isLoading: msLoading } = useEntityGetAll(
    StageMilestonesEntity,
  );
  const { data: progressRows, isLoading: progressLoading } = useEntityGetAll(
    ClientMilestoneProgressEntity,
    client.id
      ? { where: { column: 'clientId', operator: '=', value: client.id } }
      : undefined,
    { enabled: !!client.id },
  );

  const isLoading = defsLoading || msLoading || progressLoading;

  const trackStages = (defs ?? [])
    .filter((d) => d.track === client.track)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const trackStageIds = new Set(
    trackStages.map((s) => s.id).filter(Boolean) as string[],
  );

  const progressByMilestone = new Map<string, Progress>();
  (progressRows ?? []).forEach((p) => {
    if (p.stageMilestoneId) progressByMilestone.set(p.stageMilestoneId, p);
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Milestone Tracker</CardTitle>
        <CardDescription>
          Track this client's progress against the {client.track ?? 'program'}{' '}
          track milestones.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : trackStages.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No stages are defined for this track yet.
          </p>
        ) : (
          trackStages.map((stage, stageIdx) => {
            const stageMilestones = (allMilestones ?? [])
              .filter(
                (m) =>
                  m.stageDefinitionId &&
                  trackStageIds.has(m.stageDefinitionId) &&
                  m.stageDefinitionId === stage.id,
              )
              .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

            return (
              <div key={stage.id} className="flex flex-col gap-3">
                {stageIdx > 0 && <Separator />}
                <h3 className="text-sm font-semibold text-foreground">
                  {stage.stageName}
                </h3>
                {stageMilestones.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No milestones for this stage.
                  </p>
                ) : (
                  stageMilestones.map((m) => (
                    <MilestoneRow
                      key={m.id}
                      client={client}
                      milestone={m}
                      progress={
                        m.id ? progressByMilestone.get(m.id) : undefined
                      }
                    />
                  ))
                )}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};