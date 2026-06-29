import { useEffect, useState } from 'react';
import { useUser, useEntityGetAll } from '@blocksdiy/blocks-client-sdk/reactSdk';
import { useNavigate } from 'react-router';
import { getPageUrl } from '@/lib/utils';
import { ClientsEntity, ClientUsersEntity } from '@/product-types';
import { normalizeEmail } from '@/utils/EmailUtils';
import { usePersonaContext } from '@/hooks/usePersona';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Building2 } from 'lucide-react';
import { PortalCompanySummary } from '@/components/portal/PortalCompanySummary';
import { StageStepper } from '@/components/clienthub/StageStepper';
import { PortalMilestones } from '@/components/portal/PortalMilestones';
import { PortalActionItems } from '@/components/portal/PortalActionItems';
import { PortalDocuments } from '@/components/portal/PortalDocuments';
import { PortalPlaceholders } from '@/components/portal/PortalPlaceholders';
import { PortalRoomAvailability } from '@/components/portal/PortalRoomAvailability';

export default function MyCompany() {
  const user = useUser();
  const navigate = useNavigate();
  const persona = usePersonaContext();

  const isClient = persona.status === 'ready' && persona.persona === 'Client';

  useEffect(() => {
    if (persona.status === 'unauthenticated' || !user.isAuthenticated) {
      navigate(getPageUrl('Login'));
    }
  }, [persona.status, user.isAuthenticated, navigate]);

  // CRITICAL: Isolation = server-side RowPolicy/ColumnPolicy (App Settings).
  // Not an app-layer filter. Client login stays OFF until those are configured.
  // We read the BASE Clients table directly; with the RowPolicy active a Client
  // only receives their own row(s), and the ColumnPolicy strips riskLevel/ein.
  const { data: clients, isLoading } = useEntityGetAll(
    ClientsEntity,
    {},
    { enabled: isClient },
  );

  // B3 multi-company switcher: list the client's authorized companies via the
  // ClientUsers linkage (userEmail → clientId). The selector only chooses among
  // the Clients rows the server already authorized for this user — no extra
  // server call to "get my client".
  const email = user.isAuthenticated ? normalizeEmail(user.email) : '';
  const { data: clientUsers } = useEntityGetAll(
    ClientUsersEntity,
    { userEmail: email },
    { enabled: isClient && !!email },
  );
  const authorizedClientIds = (clientUsers ?? [])
    .map((r) => r.clientId)
    .filter(Boolean) as string[];

  const [activeId, setActiveId] = useState<string>('');

  if (persona.status === 'loading') {
    return (
      <div className="mx-auto flex max-w-4xl flex-col gap-4 p-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!isClient) {
    return (
      <div className="mx-auto flex max-w-md flex-col gap-6 p-6">
        <Card>
          <CardHeader className="items-center text-center">
            <Building2 className="size-10 text-muted-foreground" />
            <CardTitle>Not available for your role</CardTitle>
            <CardDescription>
              This page is only available to client companies in the program.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const allClients = clients ?? [];
  // If the user has multiple authorized companies, restrict to those; otherwise
  // use whatever the RowPolicy returned.
  const myClients =
    authorizedClientIds.length > 1
      ? allClients.filter((c) => c.id && authorizedClientIds.includes(c.id))
      : allClients;

  const hasSwitcher = myClients.length > 1;
  const activeClient =
    (activeId && myClients.find((c) => c.id === activeId)) || myClients[0];

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            My Company
          </h1>
          <p className="text-muted-foreground">
            Your company's progress in the UCF Business Incubation Program.
          </p>
        </div>
        {hasSwitcher && (
          <Select
            value={activeClient?.id ?? ''}
            onValueChange={setActiveId}
          >
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select company" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {myClients.map((c) => (
                  <SelectItem key={c.id} value={c.id ?? ''}>
                    {c.companyName || 'Company'}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        )}
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : !activeClient ? (
        <Card>
          <CardHeader className="items-center text-center">
            <Building2 className="size-10 text-muted-foreground" />
            <CardTitle>No company profile</CardTitle>
            <CardDescription>
              Your company profile isn't available yet.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          <PortalCompanySummary client={activeClient} />
          <StageStepper
            track={activeClient.track}
            currentStage={activeClient.stage}
          />
          <div className="grid gap-6 lg:grid-cols-2">
            <PortalMilestones clientId={activeClient.id} />
            <PortalActionItems clientId={activeClient.id} />
          </div>
          <PortalDocuments clientId={activeClient.id} />
          {/* Client-safe room occupancy (reads ClientRoomAvailabilitySafe view
              only — no requester identity/purpose). Client booking requests
              (create a Tentative FacilityBooking) ship when the client portal
              goes live (ops gate); staff create/confirm bookings meanwhile. */}
          <div className="grid gap-6 lg:grid-cols-2">
            <PortalRoomAvailability client={activeClient} />
            <PortalPlaceholders />
          </div>
        </>
      )}
    </div>
  );
}