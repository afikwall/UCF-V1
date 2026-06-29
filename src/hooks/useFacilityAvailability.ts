import { useEntityGetAll } from '@blocksdiy/blocks-client-sdk/reactSdk';
import { FacilityBookingsEntity } from '@/product-types';

type Booking = typeof FacilityBookingsEntity['instanceType'] & { id?: string };

interface CheckArgs {
  facilityId: string;
  startTime: string; // ISO
  endTime: string; // ISO
  excludeBookingId?: string;
}

interface ConflictResult {
  hasConflict: boolean;
  conflicts: Booking[];
}

/**
 * Conflict-detection hook.
 *
 * IMPLEMENTATION PATH: per-facility server fetch + JS overlap (the FALLBACK
 * described in the spec). Reason: every `useEntityGetAll` filter in this
 * codebase uses the single-condition shape `{ where: { column, operator,
 * value } }` — the SDK does not expose an `and` array of conditions here. So
 * we server-filter to ONE facility (a small row set, never a full-table scan)
 * and apply status + time-overlap + excludeId rules in JS.
 *
 * Pass the facilityId being booked so the hook scopes its fetch. Bookings for
 * other facilities are never loaded.
 */
export function useCheckAvailability(facilityId?: string) {
  const filter = facilityId
    ? { where: { column: 'facilityId', operator: '=', value: facilityId } }
    : undefined;

  const { data, isLoading } = useEntityGetAll(
    FacilityBookingsEntity,
    filter as Record<string, unknown> | undefined,
    { enabled: !!facilityId },
  );

  const facilityBookings = (data ?? []) as Booking[];

  // Overlap rule: existing.start < newEnd AND existing.end > newStart.
  const checkConflict = ({
    facilityId: targetFacilityId,
    startTime,
    endTime,
    excludeBookingId,
  }: CheckArgs): ConflictResult => {
    const newStart = new Date(startTime).getTime();
    const newEnd = new Date(endTime).getTime();

    const conflicts = facilityBookings.filter((b) => {
      if (b.facilityId !== targetFacilityId) return false;
      if (b.id && b.id === excludeBookingId) return false;
      if (b.status === 'Rejected') return false;
      if (!b.startTime || !b.endTime) return false;
      const exStart = new Date(b.startTime as string).getTime();
      const exEnd = new Date(b.endTime as string).getTime();
      if (Number.isNaN(exStart) || Number.isNaN(exEnd)) return false;
      return exStart < newEnd && exEnd > newStart;
    });

    return { hasConflict: conflicts.length > 0, conflicts };
  };

  return { checkConflict, isLoading };
}

/**
 * Email stub — intentionally a no-op.
 * TODO(server-action): notify coordinator/client on new request / confirm /
 * reject — real email delivery is deferred to the server-side-action layer.
 * Do NOT send email from the client.
 */
export function notifyBookingChange(
  _event: 'requested' | 'confirmed' | 'rejected',
  _booking: { id?: string },
): void {
  // no-op (deferred to server-side action layer)
}