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

  // ProgramAdmin is detected by Blocks build permission, NOT by user.role.
  const isBuild = user.permission === 'build';

  // For any authenticated NON-build user we fetch ALL THREE linkage tables,
  // filtered by the caller's normalized email. The role dropdown does NOT
  // influence persona — precedence is purely data-driven. All hooks are called
  // unconditionally (Rules of Hooks); fetching is gated only on auth + email.
  const linkageEnabled = user.isAuthenticated && !isBuild && !!email;

  const staffQuery = useEntityGetAll(
    StaffAssignmentsEntity,
    { userEmail: email },
    { enabled: linkageEnabled },
  );
  const clientQuery = useEntityGetAll(
    ClientUsersEntity,
    { userEmail: email },
    { enabled: linkageEnabled },
  );
  const funderQuery = useEntityGetAll(
    FunderUsersEntity,
    { userEmail: email },
    { enabled: linkageEnabled },
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

    // build permission === ProgramAdmin, resolved BEFORE any linkage query.
    if (isBuild) {
      return {
        status: 'ready',
        persona: 'ProgramAdmin',
        scope: { allSites: true },
        canSeeSite: () => true,
        canSeeClient: () => true,
      };
    }

    // Avoid flashing accessPending while linkage tables are still loading.
    if (staffLoading || clientLoading || funderLoading) {
      return { status: 'loading' };
    }

    // LOCKED precedence: StaffAssignments > FunderUsers > ClientUsers > pending.
    const staffList = staffRows ?? [];
    if (staffList.length > 0) {
      const siteIds = staffList
        .map((r) => r.siteId)
        .filter(Boolean) as string[];
      const hasSiteManager = staffList.some(
        (r) => r.staffRole === 'SiteManager',
      );
      const persona: 'SiteManager' | 'ProgramCoordinator' = hasSiteManager
        ? 'SiteManager'
        : (staffList[0].staffRole as 'SiteManager' | 'ProgramCoordinator') ??
          'ProgramCoordinator';
      return {
        status: 'ready',
        persona,
        scope: { siteIds },
        canSeeSite: (id: string) => siteIds.includes(id),
        canSeeClient: () => false,
      };
    }

    const funderList = funderRows ?? [];
    if (funderList.length > 0) {
      const funderIds = funderList
        .map((r) => r.funderId)
        .filter(Boolean) as string[];
      return {
        status: 'ready',
        persona: 'Funder',
        scope: { funderIds },
        canSeeSite: () => false,
        canSeeClient: () => false,
      };
    }

    const clientList = clientRows ?? [];
    if (clientList.length > 0) {
      const clientIds = clientList
        .map((r) => r.clientId)
        .filter(Boolean) as string[];
      return {
        status: 'ready',
        persona: 'Client',
        scope: { clientIds },
        canSeeSite: () => false,
        canSeeClient: (id: string) => clientIds.includes(id),
      };
    }

    return { status: 'accessPending' };
  }, [
    user.isAuthenticated,
    isBuild,
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