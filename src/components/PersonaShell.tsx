import { ReactNode } from 'react';
import { Link } from 'react-router';
import { useUser } from '@blocksdiy/blocks-client-sdk/reactSdk';
import { getPageUrl, logOut } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { BipLogo } from '@/components/BipLogo';
import { usePersonaContext } from '@/hooks/usePersona';

type NavItem = {
  label: string;
  page: string;
};

const navByRole: Record<string, NavItem[]> = {
  ProgramAdmin: [
    { label: 'Dashboard', page: 'Dashboard' },
    { label: 'Sites & Users', page: 'SitesAndUsers' },
    { label: 'Applications', page: 'Applications' },
    { label: 'Pipeline', page: 'Pipeline' },
    { label: 'Clients', page: 'Clients' },
    { label: 'Contacts', page: 'Contacts' },
    { label: 'Facilities', page: 'Facilities' },
    { label: 'Room Calendar', page: 'RoomCalendar' },
  ],
  SiteManager: [
    { label: 'Dashboard', page: 'Dashboard' },
    { label: 'Applications', page: 'Applications' },
    { label: 'Pipeline', page: 'Pipeline' },
    { label: 'Clients', page: 'Clients' },
    { label: 'Contacts', page: 'Contacts' },
    { label: 'Facilities', page: 'Facilities' },
    { label: 'Room Calendar', page: 'RoomCalendar' },
  ],
  ProgramCoordinator: [
    { label: 'Dashboard', page: 'Dashboard' },
    { label: 'Applications', page: 'Applications' },
    { label: 'Pipeline', page: 'Pipeline' },
    { label: 'Clients', page: 'Clients' },
    { label: 'Contacts', page: 'Contacts' },
    { label: 'Facilities', page: 'Facilities' },
    { label: 'Room Calendar', page: 'RoomCalendar' },
  ],
  Client: [{ label: 'My Company', page: 'MyCompany' }],
  Funder: [],
};

const UserMenu = () => {
  const user = useUser();
  const initials = (user.name || user.email || 'U')
    .split(/[\s@]+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="gap-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <Avatar className="size-7">
            <AvatarImage src={user.profileImageUrl} alt={user.name} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <span className="hidden max-w-[160px] truncate sm:inline">
            {user.email}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="truncate">{user.name || 'User'}</span>
          <span className="truncate text-xs font-normal text-muted-foreground">
            {user.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => logOut()}>
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const MinimalHeader = () => (
  <header className="flex items-center justify-between gap-4 border-b border-border bg-sidebar px-4 py-3">
    <BipLogo variant="light" />
    <UserMenu />
  </header>
);

export const PersonaShell = ({ children }: { children: ReactNode }) => {
  const user = useUser();
  const persona = usePersonaContext();

  if (persona.status === 'loading') {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <MinimalHeader />
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2 className="size-6 animate-spin text-accent" />
            <span className="text-sm">Loading…</span>
          </div>
        </div>
      </div>
    );
  }

  if (persona.status === 'accessPending') {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <MinimalHeader />
        <div className="flex flex-1 items-center justify-center p-6">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Access Pending</CardTitle>
              <CardDescription>
                Your account isn't linked to a site or company yet. Please
                contact your Program Administrator.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={() => logOut()}>
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // status === 'ready' — full shell. Nav is driven by role only.
  const navItems = navByRole[user.role ?? ''] ?? [];

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="border-b border-sidebar-border p-4">
          <Link to={getPageUrl('Home')} className="flex flex-col gap-1">
            <span className="text-base font-bold text-accent">
              UCF Business Incubation Hub
            </span>
            <span className="text-xs text-sidebar-foreground/70">
              Incubation Program Portal
            </span>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              {navItems.length === 0 ? (
                <p className="px-2 py-1 text-xs text-sidebar-foreground/60">
                  No navigation items yet
                </p>
              ) : (
                <SidebarMenu>
                  {navItems.map((item) => (
                    <SidebarMenuItem key={item.page}>
                      <SidebarMenuButton asChild>
                        <Link to={getPageUrl(item.page)}>{item.label}</Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              )}
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="flex items-center justify-between gap-4 border-b border-border bg-sidebar px-4 py-3">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="text-sidebar-foreground" />
            <BipLogo variant="light" />
          </div>
          <UserMenu />
        </header>
        <main className="flex-1 bg-background">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
};