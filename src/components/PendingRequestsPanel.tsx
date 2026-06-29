import { useState } from 'react';
import { useEntityUpdate } from '@blocksdiy/blocks-client-sdk/reactSdk';
import { FacilityBookingsEntity } from '@/product-types';
import {
  useCheckAvailability,
  notifyBookingChange,
} from '@/hooks/useFacilityAvailability';
import { formatSlot } from '@/utils/BookingSlot';
import { toast } from 'sonner';
import { Check, X, Loader2, Inbox } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
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

type Booking = typeof FacilityBookingsEntity['instanceType'] & { id?: string };

interface PendingRequestsPanelProps {
  /** Site-scoped bookings already loaded for the calendar. */
  bookings: Booking[];
  facilityNameById: Map<string, string>;
  /** Site ids the staff member may act on; null = admin (any site). */
  allowedSiteIds: string[] | null;
}

interface PendingRowProps {
  booking: Booking;
  facilityName: string;
  canAct: boolean;
}

const PendingRow = ({ booking, facilityName, canAct }: PendingRowProps) => {
  const { updateFunction, isLoading } = useEntityUpdate(FacilityBookingsEntity);
  // Conflict-detection scoped to this request's facility.
  const { checkConflict } = useCheckAvailability(booking.facilityId);
  const [warnSlots, setWarnSlots] = useState<string[] | null>(null);

  const persist = async (status: 'Confirmed' | 'Rejected') => {
    if (!booking.id) return;
    try {
      const updated = await updateFunction({ id: booking.id, data: { status } });
      // Derived/no-op email stub (real email deferred to server-side action).
      notifyBookingChange(
        status === 'Confirmed' ? 'confirmed' : 'rejected',
        updated,
      );
      toast.success(status === 'Confirmed' ? 'Booking confirmed' : 'Booking rejected');
    } catch {
      toast.error('Could not update booking');
    }
  };

  const handleConfirm = async () => {
    if (!canAct) return;
    const { conflicts } = checkConflict({
      facilityId: booking.facilityId ?? '',
      startTime: booking.startTime as string,
      endTime: booking.endTime as string,
      excludeBookingId: booking.id,
    });
    // WARN only on Confirmed-vs-Confirmed overlaps; allow override.
    const confirmedClashes = conflicts.filter((c) => c.status === 'Confirmed');
    if (confirmedClashes.length > 0) {
      setWarnSlots(
        confirmedClashes.map((c) =>
          formatSlot(c.startTime as string, c.endTime as string),
        ),
      );
      return;
    }
    await persist('Confirmed');
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-1">
        <span className="font-medium text-foreground">{facilityName}</span>
        <span className="text-sm text-muted-foreground">
          {formatSlot(booking.startTime as string, booking.endTime as string)}
        </span>
        <span className="text-sm">
          {booking.requesterName || 'Unknown requester'}
          {booking.requesterEmail ? ` · ${booking.requesterEmail}` : ''}
        </span>
        {booking.purpose && (
          <span className="text-sm text-muted-foreground">{booking.purpose}</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={handleConfirm}
          disabled={!canAct || isLoading}
        >
          {isLoading ? (
            <Loader2 data-icon="inline-start" className="animate-spin" />
          ) : (
            <Check data-icon="inline-start" />
          )}
          Confirm
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => persist('Rejected')}
          disabled={!canAct || isLoading}
        >
          <X data-icon="inline-start" />
          Reject
        </Button>
      </div>

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
                await persist('Confirmed');
              }}
            >
              Confirm anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export const PendingRequestsPanel = ({
  bookings,
  facilityNameById,
  allowedSiteIds,
}: PendingRequestsPanelProps) => {
  // Derive the Tentative subset from the already site-scoped rows.
  const pending = bookings
    .filter((b) => b.status === 'Tentative')
    .sort(
      (a, b) =>
        new Date(a.startTime as string).getTime() -
        new Date(b.startTime as string).getTime(),
    );

  // Derived "coordinator notified" signal — a live count of pending requests
  // for the user's sites (like Applications "N new"). Derived-only: no email.
  const pendingCount = pending.length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Inbox className="size-5 text-muted-foreground" />
            <CardTitle className="text-lg">Pending Requests</CardTitle>
          </div>
          {pendingCount > 0 && <Badge>{pendingCount} pending</Badge>}
        </div>
        <CardDescription>
          Tentative booking requests for your sites. Confirm or reject each.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {pendingCount === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No pending requests.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {pending.map((b, i) => {
              const facilityName = b.facilityId
                ? facilityNameById.get(b.facilityId) ?? 'Facility'
                : 'Facility';
              // Guard: a coordinator cannot act on another site's request.
              // (admin = allowedSiteIds null → can act on any site.)
              const canAct =
                allowedSiteIds === null ||
                (!!b.siteId && allowedSiteIds.includes(b.siteId));
              return (
                <div key={b.id ?? i} className="flex flex-col gap-4">
                  {i > 0 && <Separator />}
                  <PendingRow
                    booking={b}
                    facilityName={facilityName}
                    canAct={canAct}
                  />
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};