import { useState } from 'react';
import { useExecuteAction } from '@blocksdiy/blocks-client-sdk/reactSdk';
import { toast } from 'sonner';
import {
  ClientMilestoneProgressEntity,
  ClientMilestoneProgressEntityStatusEnum,
  UpsertMyMilestoneProgressAction,
} from '@/product-types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Field, FieldLabel } from '@/components/ui/field';
import { Loader2, Save } from 'lucide-react';

type Progress = typeof ClientMilestoneProgressEntity['instanceType'] & {
  id?: string;
};

const STATUSES: ClientMilestoneProgressEntityStatusEnum[] = [
  'Not Started',
  'In Progress',
  'Completed',
];

// Update-only milestone row: status Select + client comment, saved via the
// UpsertMyMilestoneProgress action. No create UI.
export const PortalMilestoneRow = ({
  progress,
  title,
}: {
  progress: Progress;
  title: string;
}) => {
  const [status, setStatus] = useState<string>(progress.status ?? 'Not Started');
  const [comment, setComment] = useState(progress.clientComment ?? '');

  const { executeFunction, isLoading } = useExecuteAction(
    UpsertMyMilestoneProgressAction,
  );

  const handleSave = async () => {
    if (!progress.id) return;
    try {
      const result = await executeFunction({
        progressId: progress.id,
        status: status as ClientMilestoneProgressEntityStatusEnum,
        clientComment: comment,
      });
      if (result?.success) {
        toast.success(result.message || 'Milestone updated');
      } else {
        toast.error(result?.message || 'Could not update milestone');
      }
    } catch {
      toast.error('Could not update milestone');
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border p-3">
      <span className="text-sm font-medium text-foreground">{title}</span>
      <Field>
        <FieldLabel htmlFor={`status-${progress.id}`}>Status</FieldLabel>
        <Select value={status} onValueChange={setStatus} disabled={isLoading}>
          <SelectTrigger id={`status-${progress.id}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </Field>
      <Field>
        <FieldLabel htmlFor={`comment-${progress.id}`}>Your comment</FieldLabel>
        <Textarea
          id={`comment-${progress.id}`}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Add a note for your program team"
          rows={2}
          disabled={isLoading}
        />
      </Field>
      <div className="flex justify-end">
        <Button size="sm" onClick={handleSave} disabled={isLoading}>
          {isLoading ? (
            <Loader2 data-icon="inline-start" className="animate-spin" />
          ) : (
            <Save data-icon="inline-start" />
          )}
          {isLoading ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </div>
  );
};