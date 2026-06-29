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
import { ClientsTable } from '@/components/ClientsTable';

interface ScopeFilter {
  where: { column: string; operator: string; value: string[] };
}

export default function Clients() {
  const persona = usePersonaContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (persona.status === 'unauthenticated') {
      navigate(getPageUrl('Login'));
    }
  }, [persona.status, navigate]);

  // Compute the server-side read scope BEFORE rendering the table (which calls
  // the hook unconditionally). ProgramAdmin → unfiltered; SiteManager /
  // ProgramCoordinator → server-side 'in' filter on siteId; Client/Funder → no
  // access.
  let filter: ScopeFilter | undefined;
  let enabled = false;

  if (persona.status === 'ready') {
    if (persona.persona === 'ProgramAdmin') {
      filter = undefined;
      enabled = true;
    } else if (
      persona.persona === 'SiteManager' ||
      persona.persona === 'ProgramCoordinator'
    ) {
      const siteIds = persona.scope.siteIds;
      enabled = siteIds.length > 0;
      filter = enabled
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
              The client hub is only available to program staff.
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
          Clients
        </h1>
        <p className="text-muted-foreground">
          Active and onboarded companies in the UCF Business Incubation Program.
        </p>
      </div>
      <ClientsTable filter={filter} enabled={enabled} />
    </div>
  );
}