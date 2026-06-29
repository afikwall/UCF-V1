import { useEntityGetAll } from '@blocksdiy/blocks-client-sdk/reactSdk';
import { ClientPortalSafeCoachingEntity } from '@/product-types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

// Reads the ClientPortalSafeCoaching VIEW — sessionNotes is physically excluded
// from this projection, so internal notes can never reach the portal.
interface SafeCoaching {
  id?: string;
  clientId?: string;
  date?: string;
  type?: string;
  actionItems?: string;
  nextSessionDate?: string;
}

const formatDate = (iso?: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const PortalActionItems = ({ clientId }: { clientId?: string }) => {
  const { data, isLoading } = useEntityGetAll(ClientPortalSafeCoachingEntity);

  const rows = ((data ?? []) as SafeCoaching[])
    .filter((r) => !clientId || r.clientId === clientId)
    .filter((r) => r.actionItems)
    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Action Items</CardTitle>
        <CardDescription>
          Follow-ups from your coaching sessions.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No action items yet.
          </p>
        ) : (
          rows.map((r, i) => (
            <div key={r.id} className="flex flex-col gap-1">
              {i > 0 && <Separator />}
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {formatDate(r.date)}
                {r.type ? ` · ${r.type}` : ''}
              </span>
              <p className="text-sm text-foreground">{r.actionItems}</p>
              {r.nextSessionDate && (
                <span className="text-xs text-muted-foreground">
                  Next session: {formatDate(r.nextSessionDate)}
                </span>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};