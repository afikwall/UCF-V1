import { useState, FormEvent } from 'react';
import {
  useEntityCreate,
  useEntityUpdate,
} from '@blocksdiy/blocks-client-sdk/reactSdk';
import { LeasesEntity, ClientsEntity, FacilitiesEntity } from '@/product-types';
import { withFacilitySiteId } from '@/utils/FacilitySiteId';
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
import { ScrollArea } from '@/components/ui/scroll-area';
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

type Lease = typeof LeasesEntity['instanceType'] & { id?: string };
type Client = typeof ClientsEntity['instanceType'] & { id?: string };
type Facility = typeof FacilitiesEntity['instanceType'] & { id?: string };

interface LeaseFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lease: Lease | null;
  clients: Client[];
  facilities: Facility[];
}

const STATUSES = ['Active', 'Pending', 'Ended'];

const NUMBER_FIELDS: { key: keyof Lease; label: string }[] = [
  { key: 'programFee', label: 'Program fee' },
  { key: 'spaceFee', label: 'Space fee' },
  { key: 'totalMonthly', label: 'Total monthly' },
  { key: 'deposit', label: 'Deposit' },
  { key: 'firstPayment', label: 'First payment' },
  { key: 'currentContractAmount', label: 'Current contract amount' },
  { key: 'aggregateContractAmount', label: 'Aggregate contract amount' },
];

export const LeaseForm = ({
  open,
  onOpenChange,
  lease,
  clients,
  facilities,
}: LeaseFormProps) => {
  const { createFunction, isLoading: creating } = useEntityCreate(LeasesEntity);
  const { updateFunction, isLoading: updating } = useEntityUpdate(LeasesEntity);

  const [clientId, setClientId] = useState(lease?.clientId ?? '');
  const [facilityId, setFacilityId] = useState(lease?.facilityId ?? '');
  const [suiteNumber, setSuiteNumber] = useState(lease?.suiteNumber ?? '');
  const [status, setStatus] = useState(lease?.status ?? 'Pending');
  const [moveInDate, setMoveInDate] = useState(
    lease?.moveInDate ? lease.moveInDate.slice(0, 10) : '',
  );
  const [terms, setTerms] = useState(lease?.terms ?? '');
  const [amounts, setAmounts] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    NUMBER_FIELDS.forEach(({ key }) => {
      const v = lease?.[key];
      init[key as string] = v != null ? String(v) : '';
    });
    return init;
  });

  const saving = creating || updating;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!facilityId) {
      toast.error('Please choose a facility');
      return;
    }
    const facility = facilities.find((f) => f.id === facilityId);
    if (!facility) {
      toast.error('Selected facility not found');
      return;
    }

    const numericData: Record<string, number | undefined> = {};
    NUMBER_FIELDS.forEach(({ key }) => {
      const raw = amounts[key as string];
      numericData[key as string] = raw ? Number(raw) : undefined;
    });

    const base = {
      clientId: clientId || undefined,
      facilityId,
      suiteNumber: suiteNumber.trim(),
      status,
      moveInDate: moveInDate || undefined,
      terms: terms.trim(),
      ...numericData,
    };
    // Stamp siteId from the chosen facility (writer-stamp contract).
    const data = withFacilitySiteId(facility, base);

    try {
      if (lease?.id) {
        await updateFunction({ id: lease.id, data });
        toast.success('Lease updated');
      } else {
        await createFunction({ data });
        toast.success('Lease created');
      }
      onOpenChange(false);
    } catch {
      toast.error('Could not save lease');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{lease?.id ? 'Edit lease' : 'New lease'}</DialogTitle>
          <DialogDescription>
            Lease terms and financials for an incubation client.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <ScrollArea className="max-h-[60vh] pr-4">
            <FieldGroup>
              <Field>
                <FieldLabel>Client</FieldLabel>
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id ?? ''}>
                          {c.companyName ?? 'Unnamed company'}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
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
                <FieldLabel htmlFor="lease-suite">Suite number</FieldLabel>
                <Input
                  id="lease-suite"
                  value={suiteNumber}
                  onChange={(e) => setSuiteNumber(e.target.value)}
                />
              </Field>
              {NUMBER_FIELDS.map(({ key, label }) => (
                <Field key={key as string}>
                  <FieldLabel htmlFor={`lease-${key as string}`}>
                    {label}
                  </FieldLabel>
                  <Input
                    id={`lease-${key as string}`}
                    type="number"
                    min="0"
                    step="0.01"
                    value={amounts[key as string]}
                    onChange={(e) =>
                      setAmounts((prev) => ({
                        ...prev,
                        [key as string]: e.target.value,
                      }))
                    }
                  />
                </Field>
              ))}
              <Field>
                <FieldLabel htmlFor="lease-movein">Move-in date</FieldLabel>
                <Input
                  id="lease-movein"
                  type="date"
                  value={moveInDate}
                  onChange={(e) => setMoveInDate(e.target.value)}
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
              <Field>
                <FieldLabel htmlFor="lease-terms">Terms</FieldLabel>
                <Textarea
                  id="lease-terms"
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                />
              </Field>
            </FieldGroup>
          </ScrollArea>
          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && (
                <Loader2 data-icon="inline-start" className="animate-spin" />
              )}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};