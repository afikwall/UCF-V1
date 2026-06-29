import { useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router';
import { useEntityGetOne } from '@blocksdiy/blocks-client-sdk/reactSdk';
import { getPageUrl } from '@/lib/utils';
import { ClientsEntity } from '@/product-types';
import { usePersonaContext } from '@/hooks/usePersona';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ClientHeader } from '@/components/clienthub/ClientHeader';
import { ImpactSummaryPlaceholder } from '@/components/clienthub/ImpactSummaryPlaceholder';
import { StageStepper } from '@/components/clienthub/StageStepper';
import { MilestoneTracker } from '@/components/clienthub/MilestoneTracker';
import { CoachingLog } from '@/components/clienthub/CoachingLog';
import { DocumentsPanel } from '@/components/clienthub/DocumentsPanel';

const NotAuthorized = ({ message }: { message: string }) => (
  <div className="mx-auto flex max-w-md flex-col gap-6 p-6">
    <Card>
      <CardHeader className="items-center text-center">
        <ShieldAlert className="size-10 text-muted-foreground" />
        <CardTitle>Not authorized</CardTitle>
        <CardDescription>{message}</CardDescription>
      </CardHeader>
    </Card>
  </div>
);

export default function ClientDetail() {
  const persona = usePersonaContext();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id') ?? '';

  useEffect(() => {
    if (persona.status === 'unauthenticated') {
      navigate(getPageUrl('Login'));
    }
  }, [persona.status, navigate]);

  const { data: client, isLoading } = useEntityGetOne(
    ClientsEntity,
    { id },
    { enabled: !!id },
  );

  if (persona.status === 'unauthenticated') return null;

  if (persona.status === 'loading') {
    return (
      <div className="mx-auto flex max-w-5xl flex-col gap-4 p-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const isStaff =
    persona.status === 'ready' &&
    (persona.persona === 'ProgramAdmin' ||
      persona.persona === 'SiteManager' ||
      persona.persona === 'ProgramCoordinator');

  if (!isStaff) {
    return (
      <NotAuthorized message="The client hub is only available to program staff." />
    );
  }

  if (!id) {
    return <NotAuthorized message="No client was specified." />;
  }

  if (isLoading) {
    return (
      <div className="mx-auto flex max-w-5xl flex-col gap-4 p-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!client) {
    return <NotAuthorized message="This client could not be found." />;
  }

  // Site-scope guard: SiteManager/ProgramCoordinator may only open clients at a
  // site in their scope. ProgramAdmin always passes.
  if (
    persona.status === 'ready' &&
    (persona.persona === 'SiteManager' ||
      persona.persona === 'ProgramCoordinator')
  ) {
    const inScope =
      !!client.siteId && persona.scope.siteIds.includes(client.siteId);
    if (!inScope) {
      return (
        <NotAuthorized message="This client belongs to a site outside your assignment." />
      );
    }
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-6">
      <Button variant="ghost" size="sm" className="w-fit" asChild>
        <Link to={getPageUrl('Clients')}>
          <ArrowLeft data-icon="inline-start" />
          Back to Clients
        </Link>
      </Button>

      <ClientHeader client={client} />
      <ImpactSummaryPlaceholder client={client} />
      <StageStepper track={client.track} currentStage={client.stage} />
      <MilestoneTracker client={client} />
      <CoachingLog client={client} />
      <DocumentsPanel client={client} />
    </div>
  );
}