import { Rocket, Users, BarChart3, ArrowRight, LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router';
import { getPageUrl } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BipLogo } from '@/components/BipLogo';

interface Feature {
  icon: LucideIcon;
  title: string;
  body: string;
}

const FEATURES: Feature[] = [
  {
    icon: Rocket,
    title: 'Traction & Growth',
    body: 'Validate early traction or accelerate revenue with structured stages and milestones tailored to your track.',
  },
  {
    icon: Users,
    title: 'Soft Landing',
    body: 'International companies expanding into Florida get market-entry support and a local foothold.',
  },
  {
    icon: BarChart3,
    title: 'Measurable Impact',
    body: "Jobs, revenue, grants, and investment tracked quarterly to show your growth and the program's economic impact.",
  },
];

const FeatureCard = ({ icon: Icon, title, body }: Feature) => (
  <Card className="border-background/15 bg-background/5">
    <CardContent className="flex flex-col gap-3 p-6">
      <Icon className="size-7 text-accent" />
      <h3 className="text-lg font-semibold text-background">{title}</h3>
      <p className="text-sm text-background/70">{body}</p>
    </CardContent>
  </Card>
);

export const PublicLanding = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <BipLogo variant="dark" />
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => navigate(getPageUrl('Login'))}>
              Staff Console
            </Button>
            <Button
              onClick={() => navigate(getPageUrl('Apply'))}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              Apply
            </Button>
          </div>
        </div>
      </nav>

      <section className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-6 py-24 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Grow your business with the{' '}
          <span className="text-accent">UCF Business Incubation Program</span>
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Coaching, mentorship, facilities, and a path to capital across eight
          Central Florida incubation sites. Start with a two-minute eligibility
          screener.
        </p>
        <Button
          size="lg"
          onClick={() => navigate(getPageUrl('Apply'))}
          className="bg-accent text-accent-foreground hover:bg-accent/90"
        >
          Start your application
          <ArrowRight data-icon="inline-end" />
        </Button>
      </section>

      <section className="bg-foreground">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="grid gap-6 md:grid-cols-3">
            {FEATURES.map((f) => (
              <FeatureCard key={f.title} {...f} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};