import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router';
import { getPageUrl } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { BipLogo } from '@/components/BipLogo';

export default function Partners() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-3xl items-center px-4 py-4">
          <BipLogo variant="dark" />
        </div>
      </header>
      <main className="mx-auto flex max-w-2xl flex-col px-4 py-16">
        <Card className="bg-foreground text-background">
          <CardHeader>
            <CardTitle className="text-2xl text-background">
              A better-fit partner can help
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <p className="text-sm text-background/80">
              Based on your answers, the UCF Business Incubation Program may not
              be the right fit right now — but the Central Florida business
              support network can connect you with the right resources.
            </p>
            <p className="text-sm text-background/80">
              Visit the Central Florida Business Link to find partners offering
              mentoring, funding, and growth support for businesses at every
              stage.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="ghost"
                onClick={() => navigate(getPageUrl('Home'))}
                className="text-background hover:bg-background/10 hover:text-background"
              >
                <ArrowLeft data-icon="inline-start" />
                Back to home
              </Button>
              <a
                href="https://cflbizlink.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
                  Visit cflbizlink.com
                  <ArrowRight data-icon="inline-end" />
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}