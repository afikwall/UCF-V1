import { useState } from 'react';
import { useEntityUpdate } from '@blocksdiy/blocks-client-sdk/reactSdk';
import { FacilityBookingsEntity } from '@/product-types';
import { formatShortDate } from '@/utils/Money';
import { formatSlot } from '@/utils/BookingSlot';
import {
  useCheckAvailability,
  notifyBookingChange,
} from '@/hooks/useFacilityAvailability';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type Booking = typeof FacilityBookingsEntity['instanceType'] & { id?: string };

interface BookingDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: Booking | null;
  facilityName: string;
}

const STATUSES = ['Tentative', 'Confirmed', 'Rejected'];

const formatTime = (iso?: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

export const BookingDetailDialog = ({
  open,
  onOpenChange,
  booking,
  facilityName,
}: BookingDetailDialogProps) => {
  const { updateFunction, isLoading } = useEntityUpdate(FacilityBookingsEntity);
  const [status, setStatus] = useState(booking?.status ?? 'Tentative');
  const [warnSlots, setWarnSlots] = useState<string[] | null>(null);
  // Scope conflict-detection to this booking's facility.
  const { checkConflict } = useCheckAvailability(booking?.facilityId);

  if (!booking) return null;

  const persist = async () => {
    if (!booking.id) return;
    try {
      const updated = await updateFunction({
        id: booking.id,
        data: { status },
      });
      // Derived/no-op email stub (real email deferred to server-side action).
      if (status === 'Confirmed') notifyBookingChange('confirmed', updated);
      if (status === 'Rejected') notifyBookingChange('rejected', updated);
      toast.success('Booking status updated');
      onOpenChange(false);
    } catch {
      toast.error('Could not update booking');
    }
  };

  const handleSave = async () => {
    if (!booking.id) return;
    // Only Confirming needs a check; Tentative↔Rejected do not.
    if (status === 'Confirmed') {
      const { conflicts } = checkConflict({
        facilityId: booking.facilityId ?? '',
        startTime: booking.startTime as string,
        endTime: booking.endTime as string,
        excludeBookingId: booking.id,
      });
      // WARN only on Confirmed-vs-Confirmed overlaps (Tentative overlaps are
      // expected for pending requests). Allow override.
      const confirmedClashes = conflicts.filter((c) => c.status === 'Confirmed');
      if (confirmedClashes.length > 0) {
        setWarnSlots(
          confirmedClashes.map((c) =>
            formatSlot(c.startTime as string, c.endTime as string),
          ),
        );
        return;
      }
    }
    await persist();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{facilityName}</DialogTitle>
          <DialogDescription>
            {formatShortDate(booking.startTime)} · {formatTime(booking.startTime)}{' '}
            – {formatTime(booking.endTime)}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 text-sm">
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground">Requester</span>
            <span className="font-medium">
              {booking.requesterName || '—'}
              {booking.requesterEmail ? ` · ${booking.requesterEmail}` : ''}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground">Purpose</span>
            <span>{booking.purpose || '—'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Current status</span>
            <Badge variant="outline">{booking.status || 'Tentative'}</Badge>
          </div>
          <FieldGroup>
            <Field>
              <FieldLabel>Update status</FieldLabel>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
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
          </FieldGroup>
        </div>
        <DialogFooter className="mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading && (
              <Loader2 data-icon="inline-start" className="animate-spin" />
            )}
            Save status
          </Button>
        </DialogFooter>
      </DialogContent>

      <AlertDialog
        open={warnSlots !== null}
        onOpenChange={(o) => !o && setWarnSlots(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Overlaps a confirmed booking</AlertDialogTitle>
            <AlertDialogDescription>
              This overlaps an already-confirmed booking
              {warnSlots && warnSlots.length > 0
                ? ` (${warnSlots.join('; ')})`
                : ''}
              . Confirm anyway?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                setWarnSlots(null);
                await persist();
              }}
            >
              Confirm anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
};