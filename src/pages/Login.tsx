import {
  useUser,
  useSendLoginLink,
} from '@blocksdiy/blocks-client-sdk/reactSdk';
import { useNavigate } from 'react-router';
import { useState, useEffect, FormEvent } from 'react';
import { toast } from 'sonner';
import { getPageUrl } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Field,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Loader2 } from 'lucide-react';
import { BipLogo } from '@/components/BipLogo';

export default function Login() {
  const user = useUser();
  const navigate = useNavigate();
  const { sendLoginLink, isLoading } = useSendLoginLink();
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (user.isAuthenticated) {
      navigate(getPageUrl('Home'));
    }
  }, [user.isAuthenticated, navigate]);

  if (user.isAuthenticated) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) return;
    await sendLoginLink({ email });
    toast.success('Check your email for the login link');
    setEmail('');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center gap-4 text-center">
          <BipLogo variant="dark" className="w-fit" />
          <div className="flex flex-col gap-1">
            <CardTitle>UCF Business Incubation Hub</CardTitle>
            <CardDescription>
              Sign in to the UCF Business Incubation Program portal
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email address</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </Field>
              <Button
                type="submit"
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                disabled={isLoading || !email}
              >
                {isLoading && <Loader2 data-icon="inline-start" className="animate-spin" />}
                {isLoading ? 'Sending...' : 'Send Login Link'}
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}