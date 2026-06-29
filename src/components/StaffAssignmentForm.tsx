import { useState, type FormEvent } from 'react';
import { useEntityCreate } from '@blocksdiy/blocks-client-sdk/reactSdk';
import { SitesEntity, StaffAssignmentsEntity } from '@/product-types';
import { normalizeEmail } from '@/utils/EmailUtils';
import { toast } from 'sonner';
import { Loader2, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';

type Site = (typeof SitesEntity)['instanceType'] & { id: string };
type Assignment = (typeof StaffAssignmentsEntity)['instanceType'] & {
  id: string;
};

const ROLE_OPTIONS = ['SiteManager', 'ProgramCoordinator'] as const;

interface StaffAssignmentFormProps {
  sites: Site[];
  assignments: Assignment[];
}

export const StaffAssignmentForm = ({
  sites,
  assignments,
}: StaffAssignmentFormProps) => {
  const { createFunction, isLoading } = useEntityCreate(StaffAssignmentsEntity);
  const [emailInput, setEmailInput] = useState('');
  const [selectedSiteIds, setSelectedSiteIds] = useState<string[]>([]);
  const [role, setRole] = useState('');

  const toggleSite = (id: string) => {
    setSelectedSiteIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  const selectedLabel =
    selectedSiteIds.length === 0
      ? 'Select sites…'
      : `${selectedSiteIds.length} site${selectedSiteIds.length > 1 ? 's' : ''} selected`;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) {
      toast.error('Email is required');
      return;
    }
    if (selectedSiteIds.length === 0) {
      toast.error('Select at least one site');
      return;
    }
    if (!role) {
      toast.error('Select a role');
      return;
    }

    const email = normalizeEmail(emailInput);
    let created = 0;
    let skipped = 0;

    try {
      for (const siteId of selectedSiteIds) {
        const isDuplicate = assignments.some(
          (a) =>
            normalizeEmail(a.userEmail ?? '') === email &&
            a.siteId === siteId &&
            a.staffRole === role,
        );
        if (isDuplicate) {
          skipped += 1;
          continue;
        }
        await createFunction({
          data: {
            userEmail: email,
            siteId,
            staffRole: role as Assignment['staffRole'],
          },
        });
        created += 1;
      }

      if (created > 0) {
        toast.success(
          `Created ${created} assignment${created > 1 ? 's' : ''}` +
            (skipped > 0 ? `, skipped ${skipped} duplicate(s)` : ''),
        );
      } else {
        toast.info(
          `No new assignments created — ${skipped} duplicate(s) skipped`,
        );
      }

      setEmailInput('');
      setSelectedSiteIds([]);
      setRole('');
    } catch {
      toast.error('Failed to create assignments');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <FieldGroup>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field>
            <FieldLabel htmlFor="staffEmail">Staff Email</FieldLabel>
            <Input
              id="staffEmail"
              type="email"
              placeholder="name@example.com"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              disabled={isLoading}
            />
          </Field>
          <Field>
            <FieldLabel>Sites</FieldLabel>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="justify-between font-normal"
                  disabled={isLoading || sites.length === 0}
                >
                  {selectedLabel}
                  <ChevronsUpDown data-icon="inline-end" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-0" align="start">
                <ScrollArea className="max-h-64">
                  <div className="flex flex-col gap-1 p-2">
                    {sites.length === 0 ? (
                      <p className="px-2 py-1.5 text-sm text-muted-foreground">
                        No sites available
                      </p>
                    ) : (
                      sites.map((site) => (
                        <Label
                          key={site.id}
                          className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent hover:text-accent-foreground"
                        >
                          <Checkbox
                            checked={selectedSiteIds.includes(site.id)}
                            onCheckedChange={() => toggleSite(site.id)}
                          />
                          <span className="text-sm font-normal">
                            {site.siteName}
                          </span>
                        </Label>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </PopoverContent>
            </Popover>
          </Field>
          <Field>
            <FieldLabel htmlFor="staffRole">Role</FieldLabel>
            <Select value={role} onValueChange={setRole} disabled={isLoading}>
              <SelectTrigger id="staffRole">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <div>
          <Button type="submit" disabled={isLoading}>
            {isLoading && (
              <Loader2 data-icon="inline-start" className="animate-spin" />
            )}
            Assign Staff
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
};