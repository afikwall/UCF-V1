import { useState } from 'react';
import { useEntityGetAll } from '@blocksdiy/blocks-client-sdk/reactSdk';
import {
  FacilityBookingsEntity,
  FacilitiesEntity,
  SitesEntity,
} from '@/product-types';
import { Plus } from 'lucide-react';
import { EventsCalendar, Event } from '@/components/ui/events-calendar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BookingForm } from '@/components/BookingForm';
import { BookingDetailDialog } from '@/components/BookingDetailDialog';
import { PendingRequestsPanel } from '@/components/PendingRequestsPanel';

type Booking = typeof FacilityBookingsEntity['instanceType'] & { id?: string };
type Facility = typeof FacilitiesEntity['instanceType'] & { id?: string };
type Site = typeof SitesEntity['instanceType'] & { id?: string };

interface ScopeFilter {
  where: { column: string; operator: string; value: string[] };
}

interface RoomCalendarBoardProps {
  filter?: ScopeFilter;
  enabled: boolean;
  /** Sites the staff member can filter by (admin = all). */
  siteOptions: Site[];
  showSiteFilter: boolean;
  /** Site ids the staff member may act on; null = admin (any site). */
  allowedSiteIds: string[] | null;
}

const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export const RoomCalendarBoard = ({
  filter,
  enabled,
  siteOptions,
  showSiteFilter,
  allowedSiteIds,
}: RoomCalendarBoardProps) => {
  const { data: bookings, isLoading } = useEntityGetAll(
    FacilityBookingsEntity,
    filter as Record<string, unknown> | undefined,
    { enabled },
  );
  const { data: facilities } = useEntityGetAll(
    FacilitiesEntity,
    filter as Record<string, unknown> | undefined,
    { enabled },
  );

  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<Booking | null>(null);
  const [facilityFilter, setFacilityFilter] = useState('all');
  const [siteFilter, setSiteFilter] = useState('all');

  const facilityList = (facilities ?? []) as Facility[];
  const facilityNameById = new Map<string, string>();
  facilityList.forEach((f) => {
    if (f.id) facilityNameById.set(f.id, f.name ?? 'Unnamed facility');
  });
  const facilityColorById = new Map<string, string>();
  facilityList.forEach((f, i) => {
    if (f.id) facilityColorById.set(f.id, CHART_COLORS[i % CHART_COLORS.length]);
  });

  const allRows = (bookings ?? []) as Booking[];
  const rows = allRows.filter((b) => {
    if (facilityFilter !== 'all' && b.facilityId !== facilityFilter)
      return false;
    if (siteFilter !== 'all' && b.siteId !== siteFilter) return false;
    return true;
  });

  const events: Event[] = rows
    .filter((b) => b.startTime && b.endTime)
    .map((b) => {
      const facilityName = b.facilityId
        ? facilityNameById.get(b.facilityId) ?? 'Facility'
        : 'Facility';
      const label = b.purpose || b.requesterName || 'Booking';
      return {
        title: `${facilityName} — ${label}`,
        start: new Date(b.startTime as string),
        end: new Date(b.endTime as string),
        resource: b,
      };
    });

  if (!enabled) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No sites are assigned to your account yet.
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return <Skeleton className="h-[700px] w-full" />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Select value={facilityFilter} onValueChange={setFacilityFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All facilities" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">All facilities</SelectItem>
                {facilityList.map((f) => (
                  <SelectItem key={f.id} value={f.id ?? ''}>
                    {f.name ?? 'Unnamed facility'}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          {showSiteFilter && (
            <Select value={siteFilter} onValueChange={setSiteFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All sites" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">All sites</SelectItem>
                  {siteOptions.map((s) => (
                    <SelectItem key={s.id} value={s.id ?? ''}>
                      {s.siteName ?? 'Unnamed site'}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          )}
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          disabled={facilityList.length === 0}
        >
          <Plus data-icon="inline-start" />
          New booking
        </Button>
      </div>

      <PendingRequestsPanel
        bookings={allRows}
        facilityNameById={facilityNameById}
        allowedSiteIds={allowedSiteIds}
      />

      <Card>
        <CardContent className="p-4">
          <EventsCalendar
            events={events}
            selectable={false}
            resizable={false}
            draggableAccessor={() => false}
            resizableAccessor={() => false}
            onSelectEvent={(event: Event) =>
              setSelected(event.resource as Booking)
            }
            eventPropGetter={(event: Event) => {
              const b = event.resource as Booking;
              const color = b.facilityId
                ? facilityColorById.get(b.facilityId) ?? CHART_COLORS[0]
                : CHART_COLORS[0];
              return {
                style: {
                  backgroundColor: color,
                  color: 'white',
                  opacity: b.status === 'Rejected' ? 0.5 : 1,
                },
              };
            }}
            style={{ height: '700px' }}
          />
        </CardContent>
      </Card>

      {createOpen && (
        <BookingForm
          open={createOpen}
          onOpenChange={setCreateOpen}
          facilities={facilityList}
        />
      )}
      {selected && (
        <BookingDetailDialog
          open={!!selected}
          onOpenChange={(o) => !o && setSelected(null)}
          booking={selected}
          facilityName={
            selected.facilityId
              ? facilityNameById.get(selected.facilityId) ?? 'Facility'
              : 'Facility'
          }
        />
      )}
    </div>
  );
};