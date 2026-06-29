import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field';
import { Loader2 } from 'lucide-react';

interface HoldDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultReason?: string;
  defaultFollowUpDate?: string;
  saving?: boolean;
  onConfirm: (reason: string, followUpDate: string) => void;
}

export const HoldDialog = ({
  open,
  onOpenChange,
  defaultReason,
  defaultFollowUpDate,
  saving,
  onConfirm,
}: HoldDialogProps) => {
  const [reason, setReason] = useState(defaultReason ?? '');
  const [followUpDate, setFollowUpDate] = useState(defaultFollowUpDate ?? '');

  const valid = reason.trim().length > 0 && followUpDate.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Place on Hold</DialogTitle>
          <DialogDescription>
            A hold requires a reason and a follow-up date. The application stays
            on the board in the Hold column.
          </DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field data-invalid={reason.trim().length === 0 ? true : undefined}>
            <FieldLabel htmlFor="holdReason">Hold reason</FieldLabel>
            <Textarea
              id="holdReason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why is this application on hold?"
              rows={3}
              aria-invalid={reason.trim().length === 0 ? true : undefined}
            />
          </Field>
          <Field data-invalid={followUpDate.length === 0 ? true : undefined}>
            <FieldLabel htmlFor="followUpDate">Follow-up date</FieldLabel>
            <Input
              id="followUpDate"
              type="date"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              aria-invalid={followUpDate.length === 0 ? true : undefined}
            />
          </Field>
        </FieldGroup>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!valid || saving}
            onClick={() => onConfirm(reason.trim(), followUpDate)}
          >
            {saving && (
              <Loader2 data-icon="inline-start" className="animate-spin" />
            )}
            Place on Hold
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};