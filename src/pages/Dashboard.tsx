import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { getPageUrl } from '@/lib/utils';
import { ShieldAlert } from 'lucide-react';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { usePersonaContext } from '@/hooks/usePersona';
import { DashboardContent } from '@/components/dashboard/DashboardContent';

interface ScopeFilter {
  where: { column: string; operator: string; value: string[] };
}

export default function Dashboard() {
  const persona = usePersonaContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (persona.status === 'unauthenticated') {
      navigate(getPageUrl('Login'));
    }
  }, [persona.status, navigate]);

  // Compute server-side scope BEFORE rendering content (whose hooks run
  // unconditionally). ProgramAdmin → unfiltered + admin site filter;
  // SiteManager/ProgramCoordinator → server-side 'in' filter on
  // selectedSiteId (apps) and siteId (clients); Funder/Client → no access.
  let isAdmin = false;
  let appsFilter: ScopeFilter | undefined;
  let clientsFilter: ScopeFilter | undefined;
  let enabled = false;

  if (persona.status === 'ready') {
    if (persona.persona === 'ProgramAdmin') {
      isAdmin = true;
      enabled = true;
    } else if (
      persona.persona === 'SiteManager' ||
      persona.persona === 'ProgramCoordinator'
    ) {
      const siteIds = persona.scope.siteIds;
      enabled = siteIds.length > 0;
      appsFilter = enabled
        ? {
            where: {
              column: 'selectedSiteId',
              operator: 'in',
              value: siteIds,
            },
          }
        : undefined;
      clientsFilter = enabled
        ? { where: { column: 'siteId', operator: 'in', value: siteIds } }
        : undefined;
    }
  }

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
              The staff KPI dashboard is only available to program staff.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="text-muted-foreground">
          Program KPIs, startup impact, and applicant-pipeline alerts.
        </p>
      </div>
      <DashboardContent
        isAdmin={isAdmin}
        appsFilter={appsFilter}
        clientsFilter={clientsFilter}
        enabled={enabled}
      />
    </div>
  );
}