import { cn } from '@/lib/utils';

interface BipLogoProps {
  variant?: 'light' | 'dark';
  className?: string;
}

// UCF Business Incubation Program mark — gold "UCF" badge (always visible on
// both dark headers and light cards) + program name lockup. No external image.
export const BipLogo = ({ variant = 'dark', className }: BipLogoProps) => {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-accent text-sm font-extrabold tracking-tight text-accent-foreground">
        UCF
      </div>
      <div className="flex flex-col leading-tight text-left">
        <span
          className={cn(
            'text-sm font-bold tracking-tight',
            variant === 'light' ? 'text-background' : 'text-foreground',
          )}
        >
          Business Incubation Program
        </span>
        <span
          className={cn(
            'text-[10px] uppercase tracking-widest',
            variant === 'light'
              ? 'text-background/70'
              : 'text-muted-foreground',
          )}
        >
          University of Central Florida
        </span>
      </div>
    </div>
  );
};