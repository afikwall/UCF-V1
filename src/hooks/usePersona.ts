import {
  useMemo,
  createContext,
  createElement,
  useContext,
  ReactNode,
} from 'react';
import { useUser, useEntityGetAll } from '@blocksdiy/blocks-client-sdk/reactSdk';
import {
  StaffAssignmentsEntity,
  ClientUsersEntity,
  FunderUsersEntity,
} from '@/product-types';
import { normalizeEmail } from '@/utils/EmailUtils';

export type PersonaResult =
  | { status: 'loading' }
  | { status: 'unauthenticated' }
  | { status: 'accessPending' }
  | {
      status: 'ready';
      persona: 'ProgramAdmin';
      scope: { allSites: true };
      canSeeSite: (id: string) => boolean;
      canSeeClient: (id: string) => boolean;
    }
  | {
      status: 'ready';
      persona: 'SiteManager' | 'ProgramCoordinator';
      scope: { siteIds: string[] };
      canSeeSite: (id: string) => boolean;
      canSeeClient: (id: string) => boolean;
    }
  | {
      status: 'ready';
      persona: 'Client';
      scope: { clientIds: string[] };
      canSeeSite: (id: string) => boolean;
      canSeeClient: (id: string) => boolean;
    }
  | {
      status: 'ready';
      persona: 'Funder';
      scope: { funderIds: string[] };
      canSeeSite: (id: string) => boolean;
      canSeeClient: (id: string) => boolean;
    };

export function usePersona(): PersonaResult {
  const user = useUser();
  const email = user.isAuthenticated ? normalizeEmail(user.email) : '';
  const role = user.role ?? '';

  const isStaff = role === 'SiteManager' || role === 'ProgramCoordinator';
  const isClient = role === 'Client';
  const isFunder = role === 'Funder';

  // Call ALL hooks unconditionally; gate fetching with `enabled`.
  const staffQuery = useEntityGetAll(
    StaffAssignmentsEntity,
    { userEmail: email },
    { enabled: user.isAuthenticated && isStaff && !!email },
  );
  const clientQuery = useEntityGetAll(
    ClientUsersEntity,
    { userEmail: email },
    { enabled: user.isAuthenticated && isClient && !!email },
  );
  const funderQuery = useEntityGetAll(
    FunderUsersEntity,
    { userEmail: email },
    { enabled: user.isAuthenticated && isFunder && !!email },
  );

  const staffRows = staffQuery.data;
  const staffLoading = staffQuery.isLoading;
  const clientRows = clientQuery.data;
  const clientLoading = clientQuery.isLoading;
  const funderRows = funderQuery.data;
  const funderLoading = funderQuery.isLoading;

  return useMemo<PersonaResult>(() => {
    if (!user.isAuthenticated) {
      return { status: 'unauthenticated' };
    }

    if (role === 'ProgramAdmin') {
      return {
        status: 'ready',
        persona: 'ProgramAdmin',
        scope: { allSites: true },
        canSeeSite: () => true,
        canSeeClient: () => true,
      };
    }

    if (isStaff) {
      if (staffLoading) return { status: 'loading' };
      const siteIds = (staffRows ?? [])
        .map((r) => r.siteId)
        .filter(Boolean) as string[];
      if (siteIds.length === 0) return { status: 'accessPending' };
      return {
        status: 'ready',
        persona: role as 'SiteManager' | 'ProgramCoordinator',
        scope: { siteIds },
        canSeeSite: (id: string) => siteIds.includes(id),
        canSeeClient: () => false,
      };
    }

    if (isClient) {
      if (clientLoading) return { status: 'loading' };
      const clientIds = (clientRows ?? [])
        .map((r) => r.clientId)
        .filter(Boolean) as string[];
      if (clientIds.length === 0) return { status: 'accessPending' };
      return {
        status: 'ready',
        persona: 'Client',
        scope: { clientIds },
        canSeeSite: () => false,
        canSeeClient: (id: string) => clientIds.includes(id),
      };
    }

    if (isFunder) {
      if (funderLoading) return { status: 'loading' };
      const funderIds = (funderRows ?? [])
        .map((r) => r.funderId)
        .filter(Boolean) as string[];
      if (funderIds.length === 0) return { status: 'accessPending' };
      return {
        status: 'ready',
        persona: 'Funder',
        scope: { funderIds },
        canSeeSite: () => false,
        canSeeClient: () => false,
      };
    }

    return { status: 'accessPending' };
  }, [
    user.isAuthenticated,
    role,
    isStaff,
    isClient,
    isFunder,
    staffRows,
    staffLoading,
    clientRows,
    clientLoading,
    funderRows,
    funderLoading,
  ]);
}

// Persona context — colocated here (not a separate src/context/ file) so it
// reliably persists with the hook it wraps. Provider + consumer for sharing
// one usePersona() result across the app.
const PersonaContext = createContext<PersonaResult | null>(null);

export function PersonaProvider({ children }: { children: ReactNode }) {
  const persona = usePersona();
  return createElement(PersonaContext.Provider, { value: persona }, children);
}

export function usePersonaContext(): PersonaResult {
  const ctx = useContext(PersonaContext);
  if (!ctx) {
    throw new Error('usePersonaContext must be used within a PersonaProvider');
  }
  return ctx;
}