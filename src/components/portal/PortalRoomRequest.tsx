import { useState } from 'react';
import {
  useExecuteAction,
  useEntityGetAll,
} from '@blocksdiy/blocks-client-sdk/reactSdk';
import { toast } from 'sonner';
import {
  ClientsEntity,
  FacilitiesEntity,
  RequestRoomBookingAction,
} from '@/product-types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FieldGroup,
  Field,
  FieldLabel,
} from '@/components/ui/field';
import { Loader2, CalendarPlus } from 'lucide-react';

type Client = typeof ClientsEntity['instanceType'] & { id?: string };
type Facility = typeof FacilitiesEntity['instanceType'] & { id?: string };

// Client-facing "Request a room" form. Submits a Tentative booking request via
// the RequestRoomBooking action (staff confirm). Scopes facility options to the
// client's site when siteId is available.
export const PortalRoomRequest = ({ client }: { client: Client }) => {
  const [open, setOpen] = useState(false);
  const [facilityId, setFacilityId] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [purpose, setPurpose] = useState('');

  const { data: facilities } = useEntityGetAll(FacilitiesEntity);
  const { executeFunction, isLoading } = useExecuteAction(
    RequestRoomBookingAction,
  );

  const allFacilities = (facilities ?? []) as Facility[];
  const options = client.siteId
    ? allFacilities.filter((f) => !f.siteId || f.siteId === client.siteId)
    : allFacilities;

  const reset = () => {
    setFacilityId('');
    setStartTime('');
    setEndTime('');
    setPurpose('');
  };

  const handleOpenChange = (next: boolean) => {
    if (!next && isLoading) return;
    if (next) reset();
    setOpen(next);
  };

  const handleSubmit = async () => {
    if (!client.id) return;
    if (!facilityId) {
      toast.error('Select a room');
      return;
    }
    if (!startTime || !endTime) {
      toast.error('Choose a start and end time');
      return;
    }
    const startIso = new Date(startTime).toISOString();
    const endIso = new Date(endTime).toISOString();
    if (new Date(endIso).getTime() <= new Date(startIso).getTime()) {
      toast.error('End time must be after start time');
      return;
    }
    try {
      const result = await executeFunction({
        clientId: client.id,
        facilityId,
        startTime: startIso,
        endTime: endIso,
        purpose,
      });
      if (result?.success) {
        toast.success(
          result.message || 'Request submitted (pending staff confirmation)',
        );
        setOpen(false);
      } else {
        toast.error(result?.message || 'Could not submit request');
      }
    } catch {
      toast.error('Could not submit request');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <CalendarPlus data-icon="inline-start" />
          Request a room
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Request a room</DialogTitle>
          <DialogDescription>
            Submit a booking request. Program staff will review and confirm it.
          </DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="room-facility">Room</FieldLabel>
            <Select value={facilityId} onValueChange={setFacilityId}>
              <SelectTrigger id="room-facility">
                <SelectValue placeholder="Select a room" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {options.map((f) => (
                    <SelectItem key={f.id} value={f.id ?? ''}>
                      {f.name || 'Room'}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor="room-start">Start</FieldLabel>
            <Input
              id="room-start"
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              disabled={isLoading}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="room-end">End</FieldLabel>
            <Input
              id="room-end"
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              disabled={isLoading}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="room-purpose">Purpose</FieldLabel>
            <Textarea
              id="room-purpose"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="What is this booking for?"
              rows={3}
              disabled={isLoading}
            />
          </Field>
        </FieldGroup>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading && (
              <Loader2 data-icon="inline-start" className="animate-spin" />
            )}
            {isLoading ? 'Submitting…' : 'Submit request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};