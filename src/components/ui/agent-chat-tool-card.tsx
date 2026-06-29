import {
  ToolActions as HeadlessToolActions,
  ToolCard as HeadlessToolCard,
  ToolCollapseTrigger as HeadlessToolCollapseTrigger,
  ToolContent as HeadlessToolContent,
  ToolHeader as HeadlessToolHeader,
  ToolTitle as HeadlessToolTitle,
  useToolCard as useHeadlessToolCard,
} from '@blocksdiy/react-common/agent-chat';
import { cva, type VariantProps } from 'class-variance-authority';
import { ChevronRight } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';

// The tool row is intentionally quiet — no border, no background, no shadow.
// The lead chevron + the title sentence carry all the visual weight; right-side
// actions only appear on hover/focus-within. The whole row is a `group/tool` so
// children can opt into hover-revealed UI via `group-hover/tool:*`.
export const agentChatToolCardVariants = cva(
  'group/tool w-full max-w-full min-w-0 overflow-hidden text-foreground',
  {
    variants: {
      variant: {
        bubble: '',
        minimal: '',
      },
      size: {
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'bubble',
    },
  },
);

export const agentChatToolHeaderVariants = cva(
  'flex w-full min-w-0 items-center',
  {
    variants: {
      variant: {
        bubble: '',
        minimal: '',
      },
      size: {
        sm: 'gap-1.5 py-0.5',
        md: 'gap-1.5 py-1',
        lg: 'gap-2 py-1.5',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'bubble',
    },
  },
);

export const agentChatToolTitleVariants = cva(
  'flex min-w-0 flex-1 items-baseline truncate font-normal text-muted-foreground/70',
  {
    variants: {
      size: {
        sm: 'gap-1 text-sm leading-[1.6]',
        md: 'gap-1.5 text-base leading-[1.6]',
        lg: 'gap-1.5 text-lg leading-[1.6]',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

export const agentChatToolActionsVariants = cva(
  'flex shrink-0 items-center opacity-0 transition-opacity duration-150 focus-within:opacity-100 group-hover/tool:opacity-100',
  {
    variants: {
      size: {
        sm: 'gap-0.5',
        md: 'gap-1',
        lg: 'gap-1',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

export const agentChatToolContentInnerVariants = cva('', {
  variants: {
    size: {
      sm: '',
      md: '',
      lg: '',
    },
    padded: {
      true: 'border-l border-border/50',
      false: '',
    },
  },
  compoundVariants: [
    { size: 'sm', padded: true, className: 'pt-0 pb-1.5 ml-1 pl-3' },
    { size: 'md', padded: true, className: 'pt-0 pb-2 ml-1 pl-3.5' },
    { size: 'lg', padded: true, className: 'pt-0 pb-2.5 ml-1.5 pl-4' },
  ],
  defaultVariants: {
    size: 'md',
    padded: true,
  },
});

// Lead chevron is a quiet plain button — no border, no fill on hover, just
// a colour shift. We deliberately don't use the shared `Button` component
// here because every Button variant we'd pick (ghost, link) brings styling
// we'd then have to override; a tiny disclosure trigger is a different
// primitive and is honest about that.
export const agentChatToolLeadChevronVariants = cva(
  cn(
    'inline-flex shrink-0 items-center justify-center rounded-sm bg-transparent transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
  ),
  {
    variants: {
      size: {
        sm: 'size-3.5',
        md: 'size-4',
        lg: 'size-5',
      },
      status: {
        loading: '',
        completed: 'text-muted-foreground/50 hover:text-foreground',
        // Failed: fully red, no opacity dim. Stays clickable so the user can
        // still expand the panel and read the error.
        failed: 'text-destructive hover:text-destructive',
      },
    },
    defaultVariants: {
      size: 'md',
      status: 'completed',
    },
  },
);

export const agentChatToolLeadChevronIconVariants = cva(
  'transition-transform duration-200',
  {
    variants: {
      size: {
        sm: 'size-3',
        md: 'size-3.5',
        lg: 'size-4',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

// Visual state of the title text itself — shimmer for loading, destructive
// for failed, default styles for completed. Shared between activity tool
// rows and live-component tool rows so the language is consistent.
export const agentChatToolTitleStateVariants = cva('', {
  variants: {
    status: {
      // Left-to-right gradient sweep clipped to the text via bg-clip-text.
      // 200% width + -200% end position = clean continuous loop.
      loading:
        'animate-shimmer bg-gradient-to-r from-muted-foreground/30 via-foreground/80 to-muted-foreground/30 bg-[length:200%_100%] bg-clip-text text-transparent',
      completed: '',
      failed: 'text-destructive/80',
    },
  },
  defaultVariants: {
    status: 'completed',
  },
});

// Secondary icon button used inside `AgentChatToolControls` (Copy, View JSON,
// etc.). Plain button, not the shared `Button` component, for the same reason
// as the lead chevron — every Button variant we'd reach for would bring
// styling we'd only have to override.
export const agentChatToolSecondaryActionVariants = cva(
  cn(
    'inline-flex shrink-0 items-center justify-center rounded-md bg-transparent text-muted-foreground transition-colors',
    'hover:text-foreground',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
  ),
  {
    variants: {
      size: {
        sm: 'size-6',
        md: 'size-7',
        lg: 'size-8',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

export const agentChatToolSecondaryActionIconVariants = cva('', {
  variants: {
    size: {
      sm: 'size-3',
      md: 'size-3.5',
      lg: 'size-4',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

export type AgentChatToolCardSize = NonNullable<
  VariantProps<typeof agentChatToolCardVariants>['size']
>;
export type AgentChatToolCardVariant = NonNullable<
  VariantProps<typeof agentChatToolCardVariants>['variant']
>;
// Kept for backwards compatibility with consumers that still pass a status
// value, but the visual lead is now the chevron and the title shimmer — not
// these icons. We map the value to a className applied to the chevron.
export type AgentChatToolStatusIconValue = 'loading' | 'completed' | 'failed';

export interface AgentChatToolStatusIconProps {
  value: AgentChatToolStatusIconValue;
  size?: AgentChatToolCardSize;
  className?: string;
}

// Deprecated visual: the lead is now `AgentChatToolLeadChevron`. We keep this
// export as a no-op so existing call sites don't break while we migrate, but
// it intentionally renders nothing. Status is conveyed by the title (shimmer
// for loading, plain for done, destructive for failed).
export function AgentChatToolStatusIcon(_props: AgentChatToolStatusIconProps) {
  return null;
}

export interface AgentChatToolLeadChevronProps {
  status?: AgentChatToolStatusIconValue;
  size?: AgentChatToolCardSize;
  className?: string;
}

// In progress → no chevron at all (the title shimmer + dots tell the story).
// Done → chevron, rotates 90° down on open.
// Failed → red chevron, but otherwise identical (still expandable).
//
// Note on copy: the only English string here is the `aria-label`, which is
// invisible to sighted users (screen-reader only). We deliberately do NOT
// set a `title` attribute — that would surface as a visible native browser
// tooltip in a fixed language, and this boilerplate is consumed by apps in
// any language.
export function AgentChatToolLeadChevron({
  status = 'completed',
  size = 'md',
  className,
}: AgentChatToolLeadChevronProps) {
  const { open } = useHeadlessToolCard();

  if (status === 'loading') {
    return null;
  }

  return (
    <HeadlessToolCollapseTrigger asChild>
      <button
        type="button"
        className={cn(
          agentChatToolLeadChevronVariants({ size, status }),
          className,
        )}
        aria-label={open ? 'Collapse' : 'Expand'}
        aria-expanded={open}
      >
        <ChevronRight
          className={cn(
            agentChatToolLeadChevronIconVariants({ size }),
            open && 'rotate-90',
          )}
        />
      </button>
    </HeadlessToolCollapseTrigger>
  );
}

export interface AgentChatToolCardProps
  extends
    React.ComponentProps<'div'>,
    VariantProps<typeof agentChatToolCardVariants> {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AgentChatToolCard({
  size = 'md',
  variant = 'bubble',
  defaultOpen = false,
  className,
  ...props
}: AgentChatToolCardProps) {
  const resolvedSize = size ?? 'md';
  const resolvedVariant = variant ?? 'bubble';

  return (
    <HeadlessToolCard
      size={resolvedSize}
      variant={resolvedVariant}
      defaultOpen={defaultOpen}
      className={cn(agentChatToolCardVariants({ size, variant }), className)}
      {...props}
    />
  );
}

export interface AgentChatToolHeaderProps
  extends
    React.ComponentProps<'div'>,
    VariantProps<typeof agentChatToolHeaderVariants> {}

export function AgentChatToolHeader({
  size = 'md',
  variant = 'bubble',
  className,
  ...props
}: AgentChatToolHeaderProps) {
  return (
    <HeadlessToolHeader
      className={cn(agentChatToolHeaderVariants({ size, variant }), className)}
      {...props}
    />
  );
}

export interface AgentChatToolTitleProps
  extends
    React.ComponentProps<'div'>,
    VariantProps<typeof agentChatToolTitleVariants> {
  status?: React.ReactNode;
}

export function AgentChatToolTitle({
  size = 'md',
  className,
  ...props
}: AgentChatToolTitleProps) {
  return (
    <HeadlessToolTitle
      className={cn(agentChatToolTitleVariants({ size }), className)}
      {...props}
    />
  );
}

export interface AgentChatToolActionsProps
  extends
    React.ComponentProps<'div'>,
    VariantProps<typeof agentChatToolActionsVariants> {}

export function AgentChatToolActions({
  size = 'md',
  className,
  ...props
}: AgentChatToolActionsProps) {
  return (
    <HeadlessToolActions
      className={cn(agentChatToolActionsVariants({ size }), className)}
      {...props}
    />
  );
}

// Legacy chevron trigger — kept exported for any third party that imports it,
// but the new layout uses `AgentChatToolLeadChevron` on the *left* of the row.
export interface AgentChatToolCollapseTriggerProps {
  className?: string;
}

export function AgentChatToolCollapseTrigger({
  className,
}: AgentChatToolCollapseTriggerProps) {
  return <AgentChatToolLeadChevron className={className} />;
}

export interface AgentChatToolControlsProps
  extends
    React.ComponentProps<'div'>,
    VariantProps<typeof agentChatToolActionsVariants> {
  showCollapseTrigger?: boolean;
}

// `AgentChatToolControls` no longer renders a right-side chevron — the chevron
// is the lead indicator on the left now. Right side is for secondary actions
// only (Copy, JSON, etc.), all hover-revealed.
export function AgentChatToolControls({
  size = 'md',
  children,
  className,
}: AgentChatToolControlsProps) {
  return (
    <AgentChatToolActions size={size} className={className}>
      {children}
    </AgentChatToolActions>
  );
}

export interface AgentChatToolSecondaryActionProps extends Omit<
  React.ComponentProps<'button'>,
  'children'
> {
  size?: AgentChatToolCardSize;
  /**
   * Lucide-react icon component (passed as a component reference, not a
   * string — see the shadcn icons rule).
   */
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  /**
   * Accessibility-only label — applied as `aria-label` for screen readers.
   * Never rendered visibly. The boilerplate is shipped to apps in any
   * language; visible copy must come from the consumer, not from us.
   */
  label: string;
}

// Wraps a Lucide icon in a quiet plain-button hit target. Owners pass
// `icon={CopyIcon}` and `label="Copy code"`; the component handles size,
// focus styling, and the screen-reader `aria-label`.
//
// Intentionally no `title` attribute (would surface as a visible native
// tooltip in a fixed language) and no built-in tooltip (consumers can wrap
// in their own `Tooltip` with localised content if they want a hover hint).
export const AgentChatToolSecondaryAction = React.forwardRef<
  HTMLButtonElement,
  AgentChatToolSecondaryActionProps
>(function AgentChatToolSecondaryAction(
  { size = 'md', icon: Icon, label, className, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      className={cn(agentChatToolSecondaryActionVariants({ size }), className)}
      aria-label={label}
      {...props}
    >
      <Icon
        className={cn(agentChatToolSecondaryActionIconVariants({ size }))}
      />
    </button>
  );
});

// Animated disclosure: CSS grid `grid-template-rows` 0fr → 1fr transition.
// Cleaner than max-height because it adapts to intrinsic content size.
export const agentChatToolContentVariants = cva(
  'grid overflow-hidden transition-[grid-template-rows] duration-200 data-[state=closed]:grid-rows-[0fr] data-[state=open]:grid-rows-[1fr]',
);

export interface AgentChatToolContentProps extends React.ComponentProps<'div'> {}

export function AgentChatToolContent({
  className,
  ...props
}: AgentChatToolContentProps) {
  return (
    <HeadlessToolContent
      className={cn(agentChatToolContentVariants(), className)}
      {...props}
    />
  );
}

// Outer wrapper paired with `agentChatToolContentVariants`. The grid-row
// disclosure animates this wrapper's height; the inner div carries the
// actual padding and rail.
export const agentChatToolContentScrollerVariants = cva(
  'min-h-0 overflow-hidden',
);

export interface AgentChatToolContentInnerProps extends React.ComponentProps<'div'> {
  size?: AgentChatToolCardSize;
  padded?: VariantProps<typeof agentChatToolContentInnerVariants>['padded'];
}

export function AgentChatToolContentInner({
  size = 'md',
  padded = true,
  className,
  children,
  ...props
}: AgentChatToolContentInnerProps) {
  return (
    <div className={cn(agentChatToolContentScrollerVariants())} {...props}>
      <div
        className={cn(
          agentChatToolContentInnerVariants({ size, padded }),
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}
