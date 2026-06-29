import { useState, FormEvent } from 'react';
import {
  useEntityCreate,
  useEntityUpdate,
} from '@blocksdiy/blocks-client-sdk/reactSdk';
import { FacilitiesEntity, SitesEntity } from '@/product-types';
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
import {
  Field,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type Facility = typeof FacilitiesEntity['instanceType'] & { id?: string };
type Site = typeof SitesEntity['instanceType'] & { id?: string };

interface FacilityFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facility: Facility | null;
  siteOptions: Site[];
}

const TYPES = ['Office/Suite', 'Conference Room'];
const STATUSES = ['Available', 'Occupied', 'Maintenance'];

export const FacilityForm = ({
  open,
  onOpenChange,
  facility,
  siteOptions,
}: FacilityFormProps) => {
  const { createFunction, isLoading: creating } =
    useEntityCreate(FacilitiesEntity);
  const { updateFunction, isLoading: updating } =
    useEntityUpdate(FacilitiesEntity);

  const [name, setName] = useState(facility?.name ?? '');
  const [type, setType] = useState(facility?.type ?? 'Office/Suite');
  const [capacity, setCapacity] = useState(
    facility?.capacity != null ? String(facility.capacity) : '',
  );
  const [amenities, setAmenities] = useState(facility?.amenities ?? '');
  const [availabilityStatus, setAvailabilityStatus] = useState(
    facility?.availabilityStatus ?? 'Available',
  );
  const [notes, setNotes] = useState(facility?.notes ?? '');
  const [siteId, setSiteId] = useState(
    facility?.siteId ?? siteOptions[0]?.id ?? '',
  );

  const saving = creating || updating;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }
    if (!siteId) {
      toast.error('Please choose a site');
      return;
    }
    const data = {
      name: name.trim(),
      type,
      capacity: capacity ? Number(capacity) : undefined,
      amenities: amenities.trim(),
      availabilityStatus,
      notes: notes.trim(),
      siteId,
    };
    try {
      if (facility?.id) {
        await updateFunction({ id: facility.id, data });
        toast.success('Facility updated');
      } else {
        await createFunction({ data });
        toast.success('Facility created');
      }
      onOpenChange(false);
    } catch {
      toast.error('Could not save facility');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {facility?.id ? 'Edit facility' : 'New facility'}
          </DialogTitle>
          <DialogDescription>
            Suites and conference rooms available at a site.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="fac-name">Name</FieldLabel>
              <Input
                id="fac-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Suite 200"
              />
            </Field>
            <Field>
              <FieldLabel>Site</FieldLabel>
              <Select value={siteId} onValueChange={setSiteId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a site" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {siteOptions.map((s) => (
                      <SelectItem key={s.id} value={s.id ?? ''}>
                        {s.siteName ?? 'Unnamed site'}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Type</FieldLabel>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="fac-cap">Capacity</FieldLabel>
              <Input
                id="fac-cap"
                type="number"
                min="0"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="fac-amen">Amenities</FieldLabel>
              <Input
                id="fac-amen"
                value={amenities}
                onChange={(e) => setAmenities(e.target.value)}
                placeholder="Whiteboard, Projector, WiFi"
              />
            </Field>
            <Field>
              <FieldLabel>Availability</FieldLabel>
              <Select
                value={availabilityStatus}
                onValueChange={setAvailabilityStatus}
              >
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
            <Field>
              <FieldLabel htmlFor="fac-notes">Notes</FieldLabel>
              <Textarea
                id="fac-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
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
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 data-icon="inline-start" className="animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};