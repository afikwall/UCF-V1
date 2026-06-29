import { useState } from 'react';
import {
  useEntityGetAll,
  useEntityCreate,
  useEntityUpdate,
} from '@blocksdiy/blocks-client-sdk/reactSdk';
import {
  ClientsEntity,
  CoachingSessionsEntity,
} from '@/product-types';
import { withOwnerEmail } from '@/utils/OwnerEmail';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field';
import { Plus, Pencil, Loader2 } from 'lucide-react';

type Client = typeof ClientsEntity['instanceType'] & { id?: string };
type Session = typeof CoachingSessionsEntity['instanceType'] & {
  id?: string;
};

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

const emptyForm = {
  date: '',
  type: '',
  durationMinutes: '',
  siteManager: '',
  topics: '',
  sessionNotes: '',
  actionItems: '',
  nextSessionDate: '',
};

export const CoachingLog = ({ client }: { client: Client }) => {
  const { data: sessions, isLoading } = useEntityGetAll(
    CoachingSessionsEntity,
    client.id
      ? { where: { column: 'clientId', operator: '=', value: client.id } }
      : undefined,
    { enabled: !!client.id },
  );

  const { createFunction, isLoading: isCreating } = useEntityCreate(
    CoachingSessionsEntity,
  );
  const { updateFunction, isLoading: isUpdating } = useEntityUpdate(
    CoachingSessionsEntity,
  );

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Session | null>(null);
  const [form, setForm] = useState({ ...emptyForm });

  const isSaving = isCreating || isUpdating;

  const rows = ((sessions ?? []) as Session[])
    .slice()
    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setOpen(true);
  };

  const openEdit = (s: Session) => {
    setEditing(s);
    setForm({
      date: s.date ?? '',
      type: s.type ?? '',
      durationMinutes: s.durationMinutes != null ? String(s.durationMinutes) : '',
      siteManager: s.siteManager ?? '',
      topics: s.topics ?? '',
      sessionNotes: s.sessionNotes ?? '',
      actionItems: s.actionItems ?? '',
      nextSessionDate: s.nextSessionDate ?? '',
    });
    setOpen(true);
  };

  const setField = (key: keyof typeof emptyForm, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async () => {
    const payload = {
      date: form.date || undefined,
      type: form.type || undefined,
      durationMinutes: form.durationMinutes
        ? Number(form.durationMinutes)
        : undefined,
      siteManager: form.siteManager || undefined,
      topics: form.topics || undefined,
      sessionNotes: form.sessionNotes || undefined,
      actionItems: form.actionItems || undefined,
      nextSessionDate: form.nextSessionDate || undefined,
    };
    if (editing?.id) {
      await updateFunction({ id: editing.id, data: payload });
    } else {
      // New session — stamp ownerEmail = parent Client.ownerEmail.
      await createFunction({
        data: withOwnerEmail(client, { clientId: client.id, ...payload }),
      });
    }
    toast.success('Session saved');
    setOpen(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <CardTitle>Coaching Log</CardTitle>
            <CardDescription>
              Coaching sessions and action items (staff view includes internal
              notes).
            </CardDescription>
          </div>
          <Button size="sm" onClick={openCreate}>
            <Plus data-icon="inline-start" />
            Add session
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No coaching sessions logged yet.
          </p>
        ) : (
          rows.map((s, i) => (
            <div key={s.id} className="flex flex-col gap-2">
              {i > 0 && <Separator />}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {formatDate(s.date)}
                  </span>
                  {s.type && <Badge variant="secondary">{s.type}</Badge>}
                  {s.durationMinutes != null && (
                    <span className="text-xs text-muted-foreground">
                      {s.durationMinutes} min
                    </span>
                  )}
                  {s.siteManager && (
                    <span className="text-xs text-muted-foreground">
                      with {s.siteManager}
                    </span>
                  )}
                </div>
                <Button variant="ghost" size="sm" onClick={() => openEdit(s)}>
                  <Pencil data-icon="inline-start" />
                  Edit
                </Button>
              </div>
              {s.topics && (
                <p className="text-sm text-foreground">{s.topics}</p>
              )}
              {s.actionItems && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Action items
                  </span>
                  <p className="text-sm text-foreground">{s.actionItems}</p>
                </div>
              )}
              {s.sessionNotes && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Internal notes (staff only)
                  </span>
                  <p className="text-sm text-muted-foreground">
                    {s.sessionNotes}
                  </p>
                </div>
              )}
              {s.nextSessionDate && (
                <span className="text-xs text-muted-foreground">
                  Next session: {formatDate(s.nextSessionDate)}
                </span>
              )}
            </div>
          ))
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? 'Edit session' : 'Add coaching session'}
            </DialogTitle>
            <DialogDescription>
              Record session details for {client.companyName}.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="cs-date">Date</FieldLabel>
              <Input
                id="cs-date"
                type="date"
                value={form.date}
                onChange={(e) => setField('date', e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="cs-type">Type</FieldLabel>
              <Input
                id="cs-type"
                value={form.type}
                onChange={(e) => setField('type', e.target.value)}
                placeholder="e.g. Mentoring, Office hours"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="cs-duration">Duration (minutes)</FieldLabel>
              <Input
                id="cs-duration"
                type="number"
                value={form.durationMinutes}
                onChange={(e) => setField('durationMinutes', e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="cs-sm">Site manager / coach</FieldLabel>
              <Input
                id="cs-sm"
                value={form.siteManager}
                onChange={(e) => setField('siteManager', e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="cs-topics">Topics</FieldLabel>
              <Textarea
                id="cs-topics"
                value={form.topics}
                onChange={(e) => setField('topics', e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="cs-actions">Action items</FieldLabel>
              <Textarea
                id="cs-actions"
                value={form.actionItems}
                onChange={(e) => setField('actionItems', e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="cs-notes">
                Internal notes (staff only)
              </FieldLabel>
              <Textarea
                id="cs-notes"
                value={form.sessionNotes}
                onChange={(e) => setField('sessionNotes', e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="cs-next">Next session date</FieldLabel>
              <Input
                id="cs-next"
                type="date"
                value={form.nextSessionDate}
                onChange={(e) => setField('nextSessionDate', e.target.value)}
              />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && (
                <Loader2 data-icon="inline-start" className="animate-spin" />
              )}
              Save session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};