import { useEntityGetAll } from '@blocksdiy/blocks-client-sdk/reactSdk';
import { PublicSitesEntity } from '@/product-types';
import { cn } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { TRACK_OPTIONS, TrackOption } from '@/utils/ApplyConstants';

interface PublicSite {
  id?: string;
  siteName?: string;
  status?: string;
}

interface ApplyTrackStepProps {
  track: TrackOption['id'] | null;
  onTrackChange: (id: TrackOption['id']) => void;
  siteId: string;
  onSiteChange: (id: string) => void;
  onBack: () => void;
  onContinue: () => void;
}

export const ApplyTrackStep = ({
  track,
  onTrackChange,
  siteId,
  onSiteChange,
  onBack,
  onContinue,
}: ApplyTrackStepProps) => {
  const { data: sites, isLoading } = useEntityGetAll(PublicSitesEntity);

  const activeSites = ((sites ?? []) as PublicSite[]).filter(
    (s) => s.status === 'Active',
  );

  const canContinue = !!track && !!siteId;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Choose your track &amp; site</CardTitle>
        <CardDescription>
          Tell us where your business is today and which UCF incubator location
          fits you best.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <Label className="text-sm font-medium">Select a track</Label>
          <div className="grid gap-3 sm:grid-cols-3">
            {TRACK_OPTIONS.map((opt) => {
              const selected = track === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onTrackChange(opt.id)}
                  className={cn(
                    'flex flex-col gap-1 rounded-lg border p-4 text-left transition-colors',
                    selected
                      ? 'border-accent bg-accent/10 ring-2 ring-accent'
                      : 'border-border hover:bg-accent/5',
                  )}
                >
                  <span className="text-sm font-semibold text-foreground">
                    {opt.title}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {opt.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Label htmlFor="site-select" className="text-sm font-medium">
            Select a site
          </Label>
          {isLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : activeSites.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No incubator sites are currently accepting applications. Please
              check back soon.
            </p>
          ) : (
            <Select value={siteId} onValueChange={onSiteChange}>
              <SelectTrigger id="site-select">
                <SelectValue placeholder="Choose a location" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {activeSites.map((s) => (
                    <SelectItem key={s.id} value={s.id ?? ''}>
                      {s.siteName ?? 'Unnamed site'}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          )}
        </div>
      </CardContent>
      <CardFooter className="justify-between">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onContinue} disabled={!canContinue}>
          Continue
        </Button>
      </CardFooter>
    </Card>
  );
};