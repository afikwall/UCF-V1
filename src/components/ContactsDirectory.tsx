import { useState } from 'react';
import { useEntityGetAll } from '@blocksdiy/blocks-client-sdk/reactSdk';
import { ContactsEntity, SitesEntity } from '@/product-types';
import { Plus, Search, Upload } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { ContactForm } from '@/components/ContactForm';

type Contact = typeof ContactsEntity['instanceType'] & { id?: string };
type Site = typeof SitesEntity['instanceType'] & { id?: string };

interface ScopeFilter {
  where: { column: string; operator: string; value: unknown };
}

interface ContactsDirectoryProps {
  /** ProgramAdmin: true => single unfiltered read of all contacts. */
  isAdmin: boolean;
  /** SM/Coordinator site-scoped filter ('in' over scope.siteIds). */
  siteFilter?: ScopeFilter;
  siteFilterEnabled: boolean;
  /** Sites this staff member may assign contacts to (admin = all). */
  siteOptions: Site[];
}

const CONTACT_TYPES = [
  'Mentor',
  'Partner',
  'Investor',
  'Sponsor',
  'Service Provider',
  'Other',
];

const parseTags = (csv?: string): string[] =>
  (csv ?? '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

const dedupeById = (rows: Contact[]): Contact[] => {
  const seen = new Set<string>();
  const out: Contact[] = [];
  for (const r of rows) {
    const key = r.id ?? '';
    if (key && seen.has(key)) continue;
    if (key) seen.add(key);
    out.push(r);
  }
  return out;
};

export const ContactsDirectory = ({
  isAdmin,
  siteFilter,
  siteFilterEnabled,
  siteOptions,
}: ContactsDirectoryProps) => {
  // READS — all useEntityGetAll calls are unconditional (rules of hooks).
  //
  // ProgramAdmin: ONE unfiltered read (sees every contact, including
  // program-wide blank-siteId rows).
  //
  // SiteManager / ProgramCoordinator: the displayed list is the UNION of TWO
  // server-side-filtered authorized reads, merged in the UI:
  //   (1) site rows  — siteId IN scope.siteIds
  //   (2) program-wide rows — siteId = '' (blank)
  // Program-wide (blank siteId) contacts are intentionally GLOBAL for all
  // staff, so every staff member sees them alongside their own site rows. The
  // union is purely a merge of two already-authorized reads — NOT a security
  // filter. We never fetch-all-then-filter for SM/Coordinator.
  const adminQuery = useEntityGetAll(ContactsEntity, undefined, {
    enabled: isAdmin,
  });

  const siteRowsQuery = useEntityGetAll(
    ContactsEntity,
    siteFilter as Record<string, unknown> | undefined,
    { enabled: !isAdmin && siteFilterEnabled },
  );

  // Program-wide: blank siteId. Some stores treat blank specially, so we also
  // run a null-equality read and merge it in; both are kept to single
  // server-filtered reads (no fetch-all).
  const programWideQuery = useEntityGetAll(
    ContactsEntity,
    { where: { column: 'siteId', operator: '=', value: '' } } as Record<
      string,
      unknown
    >,
    { enabled: !isAdmin },
  );
  const programWideNullQuery = useEntityGetAll(
    ContactsEntity,
    { where: { column: 'siteId', operator: '=', value: null } } as Record<
      string,
      unknown
    >,
    { enabled: !isAdmin },
  );

  const { data: sites } = useEntityGetAll(SitesEntity);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const siteNameById = new Map<string, string>();
  (sites ?? []).forEach((s) => {
    if (s.id) siteNameById.set(s.id, s.siteName ?? 'Unnamed site');
  });

  const isLoading = isAdmin
    ? adminQuery.isLoading
    : (siteFilterEnabled && siteRowsQuery.isLoading) ||
      programWideQuery.isLoading;

  // Build the displayed set: admin = single read; SM/Coord = union (deduped).
  const merged: Contact[] = isAdmin
    ? ((adminQuery.data ?? []) as Contact[])
    : dedupeById([
        ...((siteRowsQuery.data ?? []) as Contact[]),
        ...((programWideQuery.data ?? []) as Contact[]),
        ...((programWideNullQuery.data ?? []) as Contact[]),
      ]);

  // Distinct tags derived from the loaded contacts' CSV tags.
  const allTags = Array.from(
    new Set(merged.flatMap((c) => parseTags(c.tags))),
  ).sort((a, b) => a.localeCompare(b));

  const term = search.trim().toLowerCase();
  const rows = merged.filter((c) => {
    if (term) {
      const haystack = [c.fullName, c.company, c.email, c.expertise]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(term)) return false;
    }
    if (typeFilter !== 'all' && c.contactType !== typeFilter) return false;
    if (selectedTags.length > 0) {
      const tagSet = parseTags(c.tags);
      // Show only contacts whose tags include ALL selected tags.
      if (!selectedTags.every((t) => tagSet.includes(t))) return false;
    }
    return true;
  });

  const toggleTag = (tag: string) =>
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );

  const openNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (c: Contact) => {
    setEditing(c);
    setDialogOpen(true);
  };

  const noScope = !isAdmin && !siteFilterEnabled;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, company, email, expertise"
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">All types</SelectItem>
                {CONTACT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          {/* Disabled stub. Real CSV import + dedupe-on-normalized-email ships
              when UCF provides the Constant Contact export file. Wired to
              NOTHING intentionally. */}
          <Tooltip>
            <TooltipTrigger asChild>
              <span tabIndex={0}>
                <Button variant="outline" disabled>
                  <Upload data-icon="inline-start" />
                  Import from Constant Contact
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              Coming soon — awaiting export file
            </TooltipContent>
          </Tooltip>
          <Button onClick={openNew}>
            <Plus data-icon="inline-start" />
            New contact
          </Button>
        </div>
      </div>

      {allTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Tags:</span>
          {allTags.map((tag) => {
            const active = selectedTags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={cn(
                  'rounded-full border border-border px-3 py-1 text-xs transition-colors',
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )}
              >
                {tag}
              </button>
            );
          })}
          {selectedTags.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedTags([])}
            >
              Clear
            </Button>
          )}
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {noScope ? (
            <div className="py-12 text-center text-muted-foreground">
              No sites are assigned to your account yet. Program-wide contacts
              and your site's contacts will appear here once you're assigned to
              a site.
            </div>
          ) : isLoading ? (
            <div className="flex flex-col gap-3 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              {merged.length === 0
                ? 'No contacts yet. Add a mentor, partner, or investor to get started.'
                : 'No contacts match your filters.'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Site</TableHead>
                  <TableHead>Expertise</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((c) => {
                  const tagList = parseTags(c.tags);
                  return (
                    <TableRow
                      key={c.id}
                      className="cursor-pointer"
                      onClick={() => openEdit(c)}
                    >
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {c.fullName || '—'}
                          </span>
                          {c.title && (
                            <span className="text-xs text-muted-foreground">
                              {c.title}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {c.contactType ? (
                          <Badge variant="secondary">{c.contactType}</Badge>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell>{c.company || '—'}</TableCell>
                      <TableCell>
                        <div className="flex flex-col text-sm">
                          {c.email && (
                            <span className="truncate">{c.email}</span>
                          )}
                          {c.phone && (
                            <span className="text-muted-foreground">
                              {c.phone}
                            </span>
                          )}
                          {!c.email && !c.phone && '—'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {tagList.length > 0 ? (
                          <div className="flex max-w-[180px] flex-wrap gap-1">
                            {tagList.map((t) => (
                              <Badge key={t} variant="outline">
                                {t}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {c.siteId
                          ? siteNameById.get(c.siteId) ?? '—'
                          : 'Program-wide'}
                      </TableCell>
                      <TableCell className="max-w-[220px] truncate text-muted-foreground">
                        {c.expertise || '—'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {dialogOpen && (
        <ContactForm
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          contact={editing}
          siteOptions={siteOptions}
        />
      )}
    </div>
  );
};