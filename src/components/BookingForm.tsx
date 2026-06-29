import { useState, FormEvent } from 'react';
import { useEntityCreate } from '@blocksdiy/blocks-client-sdk/reactSdk';
import { FacilityBookingsEntity, FacilitiesEntity } from '@/product-types';
import { withFacilitySiteId } from '@/utils/FacilitySiteId';
import {
  useCheckAvailability,
  notifyBookingChange,
} from '@/hooks/useFacilityAvailability';
import { formatSlot } from '@/utils/BookingSlot';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type Facility = typeof FacilitiesEntity['instanceType'] & { id?: string };

interface BookingFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facilities: Facility[];
  /** Optional prefilled slot (local datetime values for the inputs). */
  defaultStart?: string;
  defaultEnd?: string;
}

const STATUSES = ['Tentative', 'Confirmed', 'Rejected'];

export const BookingForm = ({
  open,
  onOpenChange,
  facilities,
  defaultStart,
  defaultEnd,
}: BookingFormProps) => {
  const { createFunction, isLoading } = useEntityCreate(FacilityBookingsEntity);

  const [facilityId, setFacilityId] = useState('');
  // Conflict-detection scoped to the chosen facility (loads on selection).
  const { checkConflict } = useCheckAvailability(facilityId || undefined);
  const [requesterName, setRequesterName] = useState('');
  const [requesterEmail, setRequesterEmail] = useState('');
  const [startTime, setStartTime] = useState(defaultStart ?? '');
  const [endTime, setEndTime] = useState(defaultEnd ?? '');
  const [purpose, setPurpose] = useState('');
  const [status, setStatus] = useState('Tentative');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!facilityId) {
      toast.error('Please choose a facility');
      return;
    }
    if (!startTime || !endTime) {
      toast.error('Start and end times are required');
      return;
    }
    const facility = facilities.find((f) => f.id === facilityId);
    if (!facility) {
      toast.error('Selected facility not found');
      return;
    }
    const startIso = new Date(startTime).toISOString();
    const endIso = new Date(endTime).toISOString();

    if (new Date(endIso).getTime() <= new Date(startIso).getTime()) {
      toast.error('End time must be after start time');
      return;
    }

    // BLOCK on any non-Rejected overlap for this facility on create.
    const { hasConflict, conflicts } = checkConflict({
      facilityId,
      startTime: startIso,
      endTime: endIso,
    });
    if (hasConflict) {
      const slots = conflicts
        .map((c) => formatSlot(c.startTime as string, c.endTime as string))
        .join('; ');
      toast.error(
        `${facility.name ?? 'This facility'} is already booked: ${slots}. Pick another time or facility.`,
      );
      return;
    }

    const base = {
      facilityId,
      requesterName: requesterName.trim(),
      requesterEmail: requesterEmail.trim(),
      startTime: startIso,
      endTime: endIso,
      purpose: purpose.trim(),
      status,
    };
    // Stamp siteId from the chosen facility (writer-stamp contract).
    const data = withFacilitySiteId(facility, base);
    try {
      const created = await createFunction({ data });
      // Derived/no-op email stub (real email deferred to server-side action).
      notifyBookingChange(
        status === 'Tentative' ? 'requested' : 'confirmed',
        created,
      );
      toast.success('Booking created');
      onOpenChange(false);
    } catch {
      toast.error('Could not create booking');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New booking</DialogTitle>
          <DialogDescription>
            Reserve a room on behalf of a requester.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel>Facility</FieldLabel>
              <Select value={facilityId} onValueChange={setFacilityId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a facility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {facilities.map((f) => (
                      <SelectItem key={f.id} value={f.id ?? ''}>
                        {f.name ?? 'Unnamed facility'}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="bk-name">Requester name</FieldLabel>
              <Input
                id="bk-name"
                value={requesterName}
                onChange={(e) => setRequesterName(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="bk-email">Requester email</FieldLabel>
              <Input
                id="bk-email"
                type="email"
                value={requesterEmail}
                onChange={(e) => setRequesterEmail(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="bk-start">Start</FieldLabel>
              <Input
                id="bk-start"
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="bk-end">End</FieldLabel>
              <Input
                id="bk-end"
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="bk-purpose">Purpose</FieldLabel>
              <Textarea
                id="bk-purpose"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel>Status</FieldLabel>
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
          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && (
                <Loader2 data-icon="inline-start" className="animate-spin" />
              )}
              Create booking
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};