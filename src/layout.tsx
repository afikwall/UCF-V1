import { ReactNode } from 'react';
import { useUser } from '@blocksdiy/blocks-client-sdk/reactSdk';
import { PersonaProvider } from '@/hooks/usePersona';
import { PersonaShell } from '@/components/PersonaShell';

const Layout = ({ children }: { children: ReactNode }) => {
  const user = useUser();

  // Unauthenticated: passthrough — pages handle their own login redirect.
  if (!user.isAuthenticated) {
    return <>{children}</>;
  }

  // Authenticated: resolve persona once via provider, then render the shell.
  return (
    <PersonaProvider>
      <PersonaShell>{children}</PersonaShell>
    </PersonaProvider>
  );
};

export default Layout;