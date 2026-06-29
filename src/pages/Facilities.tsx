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
import { FacilitiesSection } from '@/components/FacilitiesSection';
import { LeasesSection } from '@/components/LeasesSection';

type Site = typeof SitesEntity['instanceType'] & { id?: string };

interface ScopeFilter {
  where: { column: string; operator: string; value: string[] };
}

export default function Facilities() {
  const persona = usePersonaContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (persona.status === 'unauthenticated') {
      navigate(getPageUrl('Login'));
    }
  }, [persona.status, navigate]);

  // Sites are needed for the facility site picker / filter. Always called.
  const { data: sites } = useEntityGetAll(SitesEntity);

  // Compute scope BEFORE rendering sections (which call hooks unconditionally).
  let filter: ScopeFilter | undefined;
  let enabled = false;
  let allowedSiteIds: string[] | null = null; // null = all sites

  if (persona.status === 'ready') {
    if (persona.persona === 'ProgramAdmin') {
      filter = undefined;
      enabled = true;
      allowedSiteIds = null;
    } else if (
      persona.persona === 'SiteManager' ||
      persona.persona === 'ProgramCoordinator'
    ) {
      const siteIds = persona.scope.siteIds;
      enabled = siteIds.length > 0;
      filter = enabled
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
              Facilities and leases are only available to program staff.
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
          Facilities
        </h1>
        <p className="text-muted-foreground">
          Manage suites, conference rooms, and client leases across your sites.
        </p>
      </div>
      <FacilitiesSection
        filter={filter}
        enabled={enabled}
        siteOptions={siteOptions}
      />
      <LeasesSection filter={filter} enabled={enabled} />
    </div>
  );
}