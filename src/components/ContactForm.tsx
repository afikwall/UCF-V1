import { useState, FormEvent, KeyboardEvent } from 'react';
import {
  useEntityCreate,
  useEntityUpdate,
  useEntityGetAll,
} from '@blocksdiy/blocks-client-sdk/reactSdk';
import { ContactsEntity, SitesEntity } from '@/product-types';
import { normalizeEmail } from '@/utils/EmailUtils';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Loader2, Plus } from 'lucide-react';
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
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type Contact = typeof ContactsEntity['instanceType'] & { id?: string };
type Site = typeof SitesEntity['instanceType'] & { id?: string };

interface ContactFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: Contact | null;
  /** Sites this staff member may assign a contact to (admin = all). */
  siteOptions: Site[];
}

// Sentinel used in the site Select to represent a program-wide (blank siteId)
// contact, since SelectItem cannot hold an empty-string value.
const PROGRAM_WIDE = '__program_wide__';

const CONTACT_TYPES = [
  'Mentor',
  'Partner',
  'Investor',
  'Sponsor',
  'Service Provider',
  'Other',
];

// Parse a comma-separated tag string into a clean array of trimmed,
// non-blank tag names.
const parseTags = (raw: string | undefined | null): string[] =>
  (raw ?? '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

export const ContactForm = ({
  open,
  onOpenChange,
  contact,
  siteOptions,
}: ContactFormProps) => {
  const { createFunction, isLoading: creating } =
    useEntityCreate(ContactsEntity);
  const { updateFunction, isLoading: updating } =
    useEntityUpdate(ContactsEntity);
  const { data: allContacts } = useEntityGetAll(ContactsEntity);

  const [fullName, setFullName] = useState(contact?.fullName ?? '');
  const [email, setEmail] = useState(contact?.email ?? '');
  const [phone, setPhone] = useState(contact?.phone ?? '');
  const [company, setCompany] = useState(contact?.company ?? '');
  const [title, setTitle] = useState(contact?.title ?? '');
  const [contactType, setContactType] = useState<string>(
    contact?.contactType ?? 'Mentor',
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(
    parseTags(contact?.tags),
  );
  const [newTag, setNewTag] = useState('');
  // Tags the user has added inline that may not yet exist on any saved
  // contact — kept so their pills render immediately.
  const [addedTags, setAddedTags] = useState<string[]>([]);
  const [expertise, setExpertise] = useState(contact?.expertise ?? '');
  const [notes, setNotes] = useState(contact?.notes ?? '');
  // Blank siteId maps to the PROGRAM_WIDE sentinel in the Select.
  const [siteId, setSiteId] = useState<string>(
    contact?.siteId ? contact.siteId : PROGRAM_WIDE,
  );

  const saving = creating || updating;

  // Union of all tags in use across contacts, tags already on this contact,
  // inline-added tags, and currently selected tags. Case-insensitive dedupe
  // preserving first-seen casing, sorted alphabetically.
  const availableTags = (() => {
    const seen = new Map<string, string>();
    const add = (tag: string) => {
      const key = tag.toLowerCase();
      if (!seen.has(key)) seen.set(key, tag);
    };
    (allContacts ?? []).forEach((c) => parseTags(c.tags).forEach(add));
    parseTags(contact?.tags).forEach(add);
    addedTags.forEach(add);
    selectedTags.forEach(add);
    return Array.from(seen.values()).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: 'base' }),
    );
  })();

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.some((t) => t.toLowerCase() === tag.toLowerCase())
        ? prev.filter((t) => t.toLowerCase() !== tag.toLowerCase())
        : [...prev, tag],
    );
  };

  const handleAddTag = () => {
    const value = newTag.trim();
    if (!value) return;
    const exists = availableTags.some(
      (t) => t.toLowerCase() === value.toLowerCase(),
    );
    if (!exists) setAddedTags((prev) => [...prev, value]);
    if (!selectedTags.some((t) => t.toLowerCase() === value.toLowerCase())) {
      setSelectedTags((prev) => [...prev, value]);
    }
    setNewTag('');
  };

  const handleNewTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error('Full name is required');
      return;
    }
    const data = {
      fullName: fullName.trim(),
      // Email is normalized (trim + lowercase) before every write so it stays
      // dedup-friendly for the future Constant Contact import.
      email: normalizeEmail(email),
      phone: phone.trim(),
      company: company.trim(),
      title: title.trim(),
      contactType: contactType as Contact['contactType'],
      tags: selectedTags.join(', '),
      expertise: expertise.trim(),
      notes: notes.trim(),
      // PROGRAM_WIDE sentinel writes a blank siteId (global for all staff).
      siteId: siteId === PROGRAM_WIDE ? '' : siteId,
    };
    try {
      if (contact?.id) {
        await updateFunction({ id: contact.id, data });
        toast.success('Contact updated');
      } else {
        await createFunction({ data });
        toast.success('Contact created');
      }
      onOpenChange(false);
    } catch {
      toast.error('Could not save contact');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {contact?.id ? 'Edit contact' : 'New contact'}
          </DialogTitle>
          <DialogDescription>
            Mentors, partners, investors, sponsors, and service providers.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="c-name">Full name</FieldLabel>
              <Input
                id="c-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Doe"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="c-email">Email</FieldLabel>
              <Input
                id="c-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@example.com"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="c-phone">Phone</FieldLabel>
              <Input
                id="c-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (407) 555-0100"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="c-company">Company</FieldLabel>
              <Input
                id="c-company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="c-title">Title</FieldLabel>
              <Input
                id="c-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel>Type</FieldLabel>
              <Select value={contactType} onValueChange={setContactType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {CONTACT_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Site</FieldLabel>
              <Select value={siteId} onValueChange={setSiteId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a site" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value={PROGRAM_WIDE}>
                      Program-wide (no site)
                    </SelectItem>
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
              <FieldLabel>Tags</FieldLabel>
              <p className="text-sm text-muted-foreground">
                Tap to select; used for Constant Contact segments.
              </p>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => {
                  const selected = selectedTags.some(
                    (t) => t.toLowerCase() === tag.toLowerCase(),
                  );
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={cn(
                        'rounded-full border px-3.5 py-1.5 text-sm transition-colors cursor-pointer',
                        selected
                          ? 'bg-gradient-to-r from-accent to-[hsl(40_90%_60%)] text-accent-foreground border-transparent font-medium'
                          : 'border-border bg-transparent text-foreground hover:bg-muted',
                      )}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={handleNewTagKeyDown}
                  placeholder="Add a tag"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddTag}
                >
                  <Plus data-icon="inline-start" />
                  Add
                </Button>
              </div>
            </Field>
            <Field>
              <FieldLabel htmlFor="c-expertise">Expertise</FieldLabel>
              <Textarea
                id="c-expertise"
                value={expertise}
                onChange={(e) => setExpertise(e.target.value)}
                placeholder="Areas of expertise"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="c-notes">Notes</FieldLabel>
              <Textarea
                id="c-notes"
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