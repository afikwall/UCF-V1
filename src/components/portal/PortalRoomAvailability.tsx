import { useEntityGetAll } from '@blocksdiy/blocks-client-sdk/reactSdk';
import {
  ClientRoomAvailabilitySafeEntity,
  ClientsEntity,
  FacilitiesEntity,
} from '@/product-types';
import { formatSlot } from '@/utils/BookingSlot';
import { PortalRoomRequest } from '@/components/portal/PortalRoomRequest';
import { DoorOpen } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

type SafeSlot = typeof ClientRoomAvailabilitySafeEntity['instanceType'];
type Facility = typeof FacilitiesEntity['instanceType'] & { id?: string };
type Client = typeof ClientsEntity['instanceType'] & { id?: string };

/**
 * Client-safe room occupancy surface.
 *
 * CRITICAL: reads ONLY the ClientRoomAvailabilitySafeEntity VIEW, which exposes
 * facilityId / siteId / startTime / endTime / status — and intentionally has NO
 * requesterName / requesterEmail / purpose. We NEVER render requester identity
 * or purpose here. Facility NAMES are not sensitive, so we resolve them from
 * FacilitiesEntity for display. Read-only.
 *
 * Client booking requests (create a Tentative FacilityBooking) ship when the
 * client portal goes live (ops gate); staff create/confirm bookings in the
 * meantime. No request form is built on the client side.
 */
export const PortalRoomAvailability = ({ client }: { client?: Client }) => {
  const { data: slots, isLoading } = useEntityGetAll(
    ClientRoomAvailabilitySafeEntity,
  );
  const { data: facilities } = useEntityGetAll(FacilitiesEntity);

  const facilityNameById = new Map<string, string>();
  ((facilities ?? []) as Facility[]).forEach((f) => {
    if (f.id) facilityNameById.set(f.id, f.name ?? 'Room');
  });

  const rows = (slots ?? []) as SafeSlot[];
  // Group occupancy by facility (busy/free time blocks only — no identities).
  const byFacility = new Map<string, SafeSlot[]>();
  rows
    .filter((s) => s.facilityId && s.startTime && s.endTime && s.status !== 'Rejected')
    .forEach((s) => {
      const key = s.facilityId as string;
      const list = byFacility.get(key) ?? [];
      list.push(s);
      byFacility.set(key, list);
    });

  const groups = Array.from(byFacility.entries()).map(([facilityId, list]) => ({
    facilityId,
    name: facilityNameById.get(facilityId) ?? 'Room',
    slots: list.sort(
      (a, b) =>
        new Date(a.startTime as string).getTime() -
        new Date(b.startTime as string).getTime(),
    ),
  }));
  groups.sort((a, b) => a.name.localeCompare(b.name));

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <DoorOpen className="size-5 text-muted-foreground" />
            <CardTitle className="text-lg">Room Availability</CardTitle>
          </div>
          {client && <PortalRoomRequest client={client} />}
        </div>
        <CardDescription>
          Booked time blocks for meeting rooms and shared spaces at your site.
          Submit a request and your program team will confirm it.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : groups.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No rooms are currently booked. Spaces appear here as they fill up.
          </p>
        ) : (
          <div className="flex flex-col gap-5">
            {groups.map((g, gi) => (
              <div key={g.facilityId} className="flex flex-col gap-3">
                {gi > 0 && <Separator />}
                <span className="font-medium text-foreground">{g.name}</span>
                <div className="flex flex-col gap-2">
                  {g.slots.map((s, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2"
                    >
                      <span className="text-sm text-muted-foreground">
                        {formatSlot(s.startTime as string, s.endTime as string)}
                      </span>
                      <Badge
                        variant={s.status === 'Confirmed' ? 'default' : 'secondary'}
                      >
                        {s.status === 'Confirmed' ? 'Booked' : 'Held'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};