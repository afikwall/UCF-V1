import { useEffect, useState, type FormEvent } from 'react';
import {
  useEntityCreate,
  useEntityUpdate,
} from '@blocksdiy/blocks-client-sdk/reactSdk';
import { SitesEntity } from '@/product-types';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type Site = (typeof SitesEntity)['instanceType'] & { id: string };

const STATUS_OPTIONS = [
  'Active',
  'Under Renovation',
  'Coming Soon',
  'Closed',
] as const;

interface SiteFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  site: Site | null;
}

const emptyForm = {
  siteName: '',
  address: '',
  city: '',
  state: '',
  zipCode: '',
  status: 'Active',
  totalCapacity: '',
  currentOccupancy: '',
};

export const SiteFormDialog = ({
  open,
  onOpenChange,
  site,
}: SiteFormDialogProps) => {
  const { createFunction, isLoading: isCreating } =
    useEntityCreate(SitesEntity);
  const { updateFunction, isLoading: isUpdating } =
    useEntityUpdate(SitesEntity);
  const [form, setForm] = useState({ ...emptyForm });

  useEffect(() => {
    if (open) {
      if (site) {
        setForm({
          siteName: site.siteName ?? '',
          address: site.address ?? '',
          city: site.city ?? '',
          state: site.state ?? '',
          zipCode: site.zipCode ?? '',
          status: site.status ?? 'Active',
          totalCapacity:
            site.totalCapacity != null ? String(site.totalCapacity) : '',
          currentOccupancy:
            site.currentOccupancy != null
              ? String(site.currentOccupancy)
              : '',
        });
      } else {
        setForm({ ...emptyForm });
      }
    }
  }, [open, site]);

  const isPending = isCreating || isUpdating;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.siteName.trim()) {
      toast.error('Site name is required');
      return;
    }
    const data = {
      siteName: form.siteName.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      zipCode: form.zipCode.trim(),
      status: form.status as Site['status'],
      totalCapacity: form.totalCapacity ? Number(form.totalCapacity) : 0,
      currentOccupancy: form.currentOccupancy
        ? Number(form.currentOccupancy)
        : 0,
    };
    try {
      if (site) {
        await updateFunction({ id: site.id, data });
        toast.success(`Updated "${data.siteName}"`);
      } else {
        await createFunction({ data });
        toast.success(`Created "${data.siteName}"`);
      }
      onOpenChange(false);
    } catch {
      toast.error('Something went wrong. Please try again.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{site ? 'Edit Site' : 'Add Site'}</DialogTitle>
          <DialogDescription>
            {site
              ? 'Update the details for this incubator location.'
              : 'Create a new incubator location.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="siteName">Site Name</FieldLabel>
              <Input
                id="siteName"
                value={form.siteName}
                onChange={(e) =>
                  setForm({ ...form, siteName: e.target.value })
                }
                disabled={isPending}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="address">Address</FieldLabel>
              <Input
                id="address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                disabled={isPending}
              />
            </Field>
            <div className="grid grid-cols-3 gap-3">
              <Field>
                <FieldLabel htmlFor="city">City</FieldLabel>
                <Input
                  id="city"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  disabled={isPending}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="state">State</FieldLabel>
                <Input
                  id="state"
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  disabled={isPending}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="zipCode">ZIP Code</FieldLabel>
                <Input
                  id="zipCode"
                  value={form.zipCode}
                  onChange={(e) =>
                    setForm({ ...form, zipCode: e.target.value })
                  }
                  disabled={isPending}
                />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="status">Status</FieldLabel>
              <Select
                value={form.status}
                onValueChange={(v) => setForm({ ...form, status: v })}
                disabled={isPending}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel htmlFor="totalCapacity">Total Capacity</FieldLabel>
                <Input
                  id="totalCapacity"
                  type="number"
                  min="0"
                  value={form.totalCapacity}
                  onChange={(e) =>
                    setForm({ ...form, totalCapacity: e.target.value })
                  }
                  disabled={isPending}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="currentOccupancy">
                  Current Occupancy
                </FieldLabel>
                <Input
                  id="currentOccupancy"
                  type="number"
                  min="0"
                  value={form.currentOccupancy}
                  onChange={(e) =>
                    setForm({ ...form, currentOccupancy: e.target.value })
                  }
                  disabled={isPending}
                />
              </Field>
            </div>
          </FieldGroup>
          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && (
                <Loader2 data-icon="inline-start" className="animate-spin" />
              )}
              {site ? 'Save Changes' : 'Create Site'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};