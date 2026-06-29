import { useEffect } from 'react';
import { useUser } from '@blocksdiy/blocks-client-sdk/reactSdk';
import { useNavigate } from 'react-router';
import { getPageUrl } from '@/lib/utils';
import { ShieldAlert, Lock } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { SitesSection } from '@/components/SitesSection';
import { StaffSection } from '@/components/StaffSection';
import { ClientAssignmentSection } from '@/components/ClientAssignmentSection';
import { FunderAssignmentSection } from '@/components/FunderAssignmentSection';
import { AccessRequestsInbox } from '@/components/AccessRequestsInbox';

export default function SitesAndUsers() {
  const user = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user.isAuthenticated) {
      navigate(getPageUrl('Login'));
    }
  }, [user.isAuthenticated, navigate]);

  if (!user.isAuthenticated) return null;

  if (user.permission !== 'build') {
    return (
      <div className="mx-auto flex max-w-md flex-col gap-6 p-6">
        <Card>
          <CardHeader className="items-center text-center">
            <ShieldAlert className="size-10 text-muted-foreground" />
            <CardTitle>Access restricted</CardTitle>
            <CardDescription>
              This page is available to Program Admins only. If you believe you
              should have access, contact your program administrator.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Sites &amp; Access
        </h1>
        <p className="text-muted-foreground">
          Manage incubator locations, staff and company assignments, and access
          requests across the UCF Business Incubation Program.
        </p>
      </div>

      <Alert>
        <Lock />
        <AlertTitle>Security: required manual configuration</AlertTitle>
        <AlertDescription>
          <div className="flex flex-col gap-2">
            <p>
              Client/Funder data isolation is enforced by server-side table
              policies that must be configured manually in App Settings → Table
              Permissions before enabling any external (Client/Funder) logins:
            </p>
            <ul className="flex list-disc flex-col gap-1 pl-5">
              <li>
                <span className="font-medium">Clients RowPolicy</span>{' '}
                (operation: read) — allow if user.role is
                ProgramAdmin/SiteManager/ProgramCoordinator (staff pass
                through), OR ownerEmail equals the current user's email
                (Client/Funder see only their own row).
              </li>
              <li>
                <span className="font-medium">Clients ColumnPolicy</span> (deny)
                — hide riskLevel and ein (internal fields) when the user's role
                is not ProgramAdmin/SiteManager/ProgramCoordinator.
              </li>
            </ul>
            <p>
              Staff site-to-site separation is currently app-layer (UI) only.
              Until these policies are set, do not provision Client/Funder
              accounts.
            </p>
          </div>
        </AlertDescription>
      </Alert>

      <SitesSection />
      <StaffSection />
      <ClientAssignmentSection />
      <FunderAssignmentSection />
      <AccessRequestsInbox />
    </div>
  );
}