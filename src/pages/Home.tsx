import { useUser } from '@blocksdiy/blocks-client-sdk/reactSdk';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PublicLanding } from '@/components/PublicLanding';
import { RequestAccessForm } from '@/components/RequestAccessForm';
import { usePersonaContext } from '@/hooks/usePersona';

export default function Home() {
  const user = useUser();
  const persona = usePersonaContext();

  // Logged-out visitors see the public landing page (no redirect to Login).
  if (!user.isAuthenticated) return <PublicLanding />;

  const isStaff =
    persona.status === 'ready' &&
    (persona.persona === 'SiteManager' ||
      persona.persona === 'ProgramCoordinator');

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Welcome to the UCF Business Incubation Hub
        </h1>
        <p className="text-muted-foreground">
          The internal portal for the UCF Business Incubation Program.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {user.name || user.firstName || user.email || 'Welcome'}
          </CardTitle>
          <CardDescription>You are signed in.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {user.role && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Role</span>
              <Badge variant="secondary">{user.role}</Badge>
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            Features are coming soon. This is the foundation release of the Hub.
          </p>
        </CardContent>
      </Card>

      {isStaff && <RequestAccessForm />}
    </div>
  );
}