import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { getPageUrl } from '@/lib/utils';
import { ShieldAlert } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { usePersonaContext } from '@/hooks/usePersona';
import { PipelineBoard } from '@/components/PipelineBoard';

interface AppFilter {
  where: { column: string; operator: string; value: string[] };
}

export default function Pipeline() {
  const persona = usePersonaContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (persona.status === 'unauthenticated') {
      navigate(getPageUrl('Login'));
    }
  }, [persona.status, navigate]);

  // Compute scope filters BEFORE rendering the board (which calls hooks
  // unconditionally). ProgramAdmin → unfiltered; SiteManager/ProgramCoordinator
  // → server-side 'in' filter on selectedSiteId (apps) and siteId (scorecards);
  // Funder → no access.
  let filter: AppFilter | undefined;
  let scorecardFilter: AppFilter | undefined;
  let enabled = false;

  if (persona.status === 'ready') {
    if (persona.persona === 'ProgramAdmin') {
      filter = undefined;
      scorecardFilter = undefined;
      enabled = true;
    } else if (
      persona.persona === 'SiteManager' ||
      persona.persona === 'ProgramCoordinator'
    ) {
      const siteIds = persona.scope.siteIds;
      enabled = siteIds.length > 0;
      filter = enabled
        ? { where: { column: 'selectedSiteId', operator: 'in', value: siteIds } }
        : undefined;
      scorecardFilter = enabled
        ? { where: { column: 'siteId', operator: 'in', value: siteIds } }
        : undefined;
    }
  }

  if (persona.status === 'unauthenticated') return null;

  if (persona.status === 'ready' && persona.persona === 'Funder') {
    return (
      <div className="mx-auto flex max-w-md flex-col gap-6 p-6">
        <Card>
          <CardHeader className="items-center text-center">
            <ShieldAlert className="size-10 text-muted-foreground" />
            <CardTitle>No access</CardTitle>
            <CardDescription>
              The applications pipeline is not available to funder accounts.
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
          Pipeline
        </h1>
        <p className="text-muted-foreground">
          Move applications through review stages, score fit, and make
          decisions.
        </p>
      </div>
      <PipelineBoard
        filter={filter}
        scorecardFilter={scorecardFilter}
        enabled={enabled}
      />
    </div>
  );
}