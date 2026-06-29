import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useEntityGetAll } from '@blocksdiy/blocks-client-sdk/reactSdk';
import { SitesEntity } from '@/product-types';
import { getPageUrl } from '@/lib/utils';
import { ShieldAlert } from 'lucide-react';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { usePersonaContext } from '@/hooks/usePersona';
import { ContactsDirectory } from '@/components/ContactsDirectory';

type Site = typeof SitesEntity['instanceType'] & { id?: string };

interface ScopeFilter {
  where: { column: string; operator: string; value: unknown };
}

export default function Contacts() {
  const persona = usePersonaContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (persona.status === 'unauthenticated') {
      navigate(getPageUrl('Login'));
    }
  }, [persona.status, navigate]);

  // Sites power the siteId→siteName resolve and the form's site picker.
  const { data: sites } = useEntityGetAll(SitesEntity);

  // Compute scope BEFORE the directory renders (it calls hooks
  // unconditionally). ProgramAdmin → single unfiltered read. SM/Coordinator →
  // site-scoped 'in' filter, which the directory UNIONS with a program-wide
  // (blank siteId) read. Client/Funder → no access.
  let isAdmin = false;
  let siteFilter: ScopeFilter | undefined;
  let siteFilterEnabled = false;
  let allowedSiteIds: string[] | null = null; // null = all sites

  if (persona.status === 'ready') {
    if (persona.persona === 'ProgramAdmin') {
      isAdmin = true;
      allowedSiteIds = null;
    } else if (
      persona.persona === 'SiteManager' ||
      persona.persona === 'ProgramCoordinator'
    ) {
      const siteIds = persona.scope.siteIds;
      siteFilterEnabled = siteIds.length > 0;
      siteFilter = siteFilterEnabled
        ? { where: { column: 'siteId', operator: 'in', value: siteIds } }
        : undefined;
      allowedSiteIds = siteIds;
    }
  }

  const allSites = (sites ?? []) as Site[];
  const siteOptions =
    allowedSiteIds === null
      ? allSites
      : allSites.filter((s) => s.id && allowedSiteIds!.includes(s.id));

  if (persona.status === 'unauthenticated') return null;

  if (
    persona.status === 'ready' &&
    (persona.persona === 'Funder' || persona.persona === 'Client')
  ) {
    return (
      <div className="mx-auto flex max-w-md flex-col gap-6 p-6">
        <Card>
          <CardHeader className="items-center text-center">
            <ShieldAlert className="size-10 text-muted-foreground" />
            <CardTitle>Not available for your role</CardTitle>
            <CardDescription>
              The contacts directory is only available to program staff.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Contacts
        </h1>
        <p className="text-muted-foreground">
          Mentors, partners, investors, sponsors, and service providers across
          your sites and the program at large.
        </p>
      </div>
      <ContactsDirectory
        isAdmin={isAdmin}
        siteFilter={siteFilter}
        siteFilterEnabled={siteFilterEnabled}
        siteOptions={siteOptions}
      />
    </div>
  );
}