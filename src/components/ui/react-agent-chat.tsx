// React-agent chat UI — workflow streaming via `@blocksdiy/react-common/agent-chat`.
// Deep agents use `deep-agent-chat.tsx` + `@blocksdiy/react-common/new-agent-chat`.

import { AgentChat as SDKAgentChat } from '@blocksdiy/blocks-client-sdk';
import { useClient } from '@blocksdiy/blocks-client-sdk/reactSdk';
import * as AgentChatPrimitive from '@blocksdiy/react-common/agent-chat';
import { AgentChatData, MessageItem } from '@blocksdiy/react-common/agent-chat';
import { cva, type VariantProps } from 'class-variance-authority';
import { format } from 'date-fns';
import {
  File,
  FileImage,
  FileText,
  Loader2,
  Mic,
  Paperclip,
  Send,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import * as React from 'react';
import { Streamdown } from 'streamdown';

import {
  AgentChatToolCard,
  type AgentChatToolCardSize,
  type AgentChatToolCardVariant,
  AgentChatToolContent,
  AgentChatToolContentInner,
  AgentChatToolHeader,
  agentChatToolHeaderVariants,
  AgentChatToolLeadChevron,
  type AgentChatToolStatusIconValue,
  AgentChatToolTitle,
  agentChatToolTitleStateVariants,
} from '@/components/ui/agent-chat-tool-card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LiveWaveform } from '@/components/ui/live-waveform';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

const GENERATE_DYNAMIC_CHAT_COMPONENT_TOOL_NAME =
  'generate_dynamic_chat_component';
const GENERATE_DYNAMIC_CHAT_COMPONENT_TOOL_TYPE = `tool-${GENERATE_DYNAMIC_CHAT_COMPONENT_TOOL_NAME}`;

const agentChatContentVariants = cva(
  'flex flex-col overflow-hidden h-full w-full',
  {
    variants: {
      variant: {
        bubble: '',
        minimal: '',
      },
      userPosition: {
        side: '',
        bottom: '',
      },
      size: {
        sm: '',
        md: '',
        lg: '',
      },
    },
    defaultVariants: {
      variant: 'bubble',
      userPosition: 'side',
      size: 'md',
    },
  },
);

const agentChatMessagesVariants = cva('flex flex-col', {
  variants: {
    size: {
      sm: 'p-2',
      md: 'p-2',
      lg: 'p-3',
    },
    variant: {
      bubble: '',
      minimal: '',
    },
  },
  defaultVariants: {
    size: 'md',
    variant: 'bubble',
  },
});

// Hover-only timestamp. Quiet color (60% muted-foreground), opacity-0 by
// default and revealed by `group-hover` on the message row (the row carries
// the `group` class via `messageVariants`).
const agentChatMessageTimestampVariants = cva(
  'flex items-center text-xs text-muted-foreground/60 opacity-0 transition-opacity group-hover:opacity-100',
  {
    variants: {
      variant: {
        bubble: '',
        minimal: '',
      },
      role: {
        human: '',
        ai: '',
      },
      userPosition: {
        side: '',
        bottom: '',
      },
      size: {
        sm: '',
        md: '',
        lg: '',
      },
    },
    compoundVariants: [
      {
        userPosition: 'bottom',
        size: 'sm',
        className: 'gap-2',
      },
      {
        userPosition: 'bottom',
        size: 'md',
        className: 'gap-2',
      },
      {
        userPosition: 'bottom',
        size: 'lg',
        className: 'gap-3',
      },
      {
        variant: 'bubble',
        role: 'ai',
        className: 'flex-row',
      },
      {
        variant: 'bubble',
        role: 'human',
        className: 'flex-row-reverse',
      },
    ],
    defaultVariants: {
      variant: 'bubble',
      userPosition: 'side',
      size: 'md',
      role: 'ai',
    },
  },
);

const messageVariants = cva('group relative flex transition-colors', {
  variants: {
    variant: {
      bubble: '',
      minimal: '',
    },
    size: {
      sm: '',
      md: '',
      lg: '',
    },
    role: {
      human: '',
      ai: '',
    },
  },
  compoundVariants: [
    {
      variant: 'bubble',
      size: 'sm',
      className: 'p-2 gap-2',
    },
    {
      variant: 'bubble',
      size: 'md',
      className: 'p-2 gap-2',
    },
    {
      variant: 'bubble',
      size: 'lg',
      className: 'p-3 gap-3',
    },
    {
      variant: 'bubble',
      role: 'ai',
      className: 'flex-row',
    },
    {
      variant: 'bubble',
      role: 'human',
      className: 'flex-row-reverse',
    },
  ],
  defaultVariants: {
    variant: 'bubble',
    size: 'md',
    role: 'ai',
  },
});

// Layout intent:
// - AI in bubble variant: NO bubble at all. Text sits flush on the canvas next
//   to the avatar — no background, border, shadow, or padding. The width cap
//   gives long answers comfortable line length.
// - Human in bubble variant: tight, more rounded pill (rounded-2xl). The
//   per-size compounds use the smaller padding values from the spec.
const messageContentVariants = cva('relative min-w-0 overflow-visible', {
  variants: {
    variant: {
      bubble: 'rounded-lg max-w-full md:max-w-[70%]',
      minimal: 'max-w-none',
    },
    size: {
      sm: '',
      md: '',
      lg: '',
    },
    role: {
      human: '',
      ai: '',
    },
  },
  compoundVariants: [
    // Tightened human-bubble paddings (was px-3/4/5 py-2/2.5/3)
    {
      variant: 'bubble',
      role: 'human',
      size: 'sm',
      className: 'px-2.5 py-1.5',
    },
    {
      variant: 'bubble',
      role: 'human',
      size: 'md',
      className: 'px-3 py-2',
    },
    {
      variant: 'bubble',
      role: 'human',
      size: 'lg',
      className: 'px-4 py-2.5',
    },
    {
      role: 'human',
      variant: 'bubble',
      className:
        'overflow-hidden rounded-2xl bg-primary text-primary-foreground',
    },
    // AI in bubble: strip the bubble entirely. `!important` overrides any
    // size-based padding compounds upstream and guarantees flush layout.
    {
      role: 'ai',
      variant: 'bubble',
      className:
        'bg-transparent text-foreground !px-0 !py-0 !rounded-none max-w-full md:!max-w-[88%]',
    },
    {
      variant: 'minimal',
      className: '!px-0 !py-0 !ml-0 !mr-0',
    },
  ],
  defaultVariants: {
    size: 'md',
    variant: 'bubble',
  },
});

const agentChatFooterVariants = cva('flex flex-col border-t shrink-0', {
  variants: {
    size: {
      sm: '',
      md: '',
      lg: '',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

const agentChatThinkingVariants = cva(
  'flex items-center text-sm text-muted-foreground',
  {
    variants: {
      size: {
        sm: 'gap-2 p-2 [&>svg]:h-4 [&>svg]:w-4 [&>span]:text-sm',
        md: 'gap-2 p-2 [&>svg]:h-4 [&>svg]:w-4 [&>span]:text-base',
        lg: 'gap-3 p-3 [&>svg]:h-5 [&>svg]:w-5 [&>span]:text-lg',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

const agentChatFetchingContentVariants = cva('flex flex-col items-center', {
  variants: {
    size: {
      sm: 'gap-2 [&>svg]:h-7 [&>svg]:w-7 [&>span]:text-sm',
      md: 'gap-2 [&>svg]:h-9 [&>svg]:w-9 [&>span]:text-base',
      lg: 'gap-3 [&>svg]:h-11 [&>svg]:w-11 [&>span]:text-lg',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

const agentChatAvatarVariants = cva('shrink-0', {
  variants: {
    role: {
      human: '',
      ai: '',
    },
    size: {
      sm: '',
      md: '',
      lg: '',
    },
    userPosition: {
      side: '',
      bottom: 'size-7',
    },
    // Pulse the avatar to signal "agent is working". `transform`-only — no
    // opacity dimming. `origin-center` keeps the pulse in place; the
    // `will-change-transform` hint nudges the GPU compositor to keep things
    // smooth even on cheaper devices.
    isPulsing: {
      true: 'origin-center will-change-transform animate-size-pulse',
      false: '',
    },
  },
  compoundVariants: [
    { userPosition: 'side', size: 'sm', className: 'size-7' },
    { userPosition: 'side', size: 'md', className: 'size-9' },
    { userPosition: 'side', size: 'lg', className: 'size-11' },
  ],
  defaultVariants: {
    role: 'ai',
    size: 'md',
    userPosition: 'side',
    isPulsing: false,
  },
});

const agentChatAvatarFallbackVariants = cva('', {
  variants: {
    size: {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
    },
    userPosition: {
      side: '',
      bottom: 'text-sm',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

const agentChatMessageContentWrapperVariants = cva('flex flex-col flex-1', {
  variants: {
    variant: {
      bubble: '',
      minimal: '',
    },
    size: {
      sm: '',
      md: '',
      lg: '',
    },
    role: {
      human: '',
      ai: '',
    },
  },
  compoundVariants: [
    {
      variant: 'minimal',
      size: 'md',
      className: 'gap-1',
    },
    {
      variant: 'minimal',
      size: 'lg',
      className: 'gap-1',
    },
    {
      variant: 'bubble',
      role: 'human',
      size: 'sm',
      className: 'gap-2',
    },
    {
      variant: 'bubble',
      role: 'human',
      size: 'md',
      className: 'gap-2',
    },
    {
      variant: 'bubble',
      role: 'human',
      size: 'lg',
      className: 'gap-3',
    },
    // AI uses a tight gap-0.5 between (a future) header and the content. With
    // the bubble stripped, this also keeps consecutive AI parts hugging.
    {
      variant: 'bubble',
      role: 'ai',
      className: 'gap-0.5',
    },
    {
      role: 'human',
      variant: 'bubble',
      className: 'items-end',
    },
    {
      role: 'ai',
      variant: 'bubble',
      className: 'items-start',
    },
  ],
  defaultVariants: {
    variant: 'bubble',
    size: 'md',
    role: 'ai',
  },
});

const agentChatMessageAttachmentsVariants = cva('flex flex-wrap', {
  variants: {
    variant: {
      bubble: '',
      minimal: '',
    },
    role: {
      human: '',
      ai: '',
    },
    size: {
      sm: 'gap-2',
      md: 'gap-2',
      lg: 'gap-3',
    },
  },
  compoundVariants: [
    {
      variant: 'bubble',
      role: 'ai',
      className: 'flex-row',
    },
    {
      variant: 'bubble',
      role: 'human',
      className: 'flex-row-reverse',
    },
  ],
  defaultVariants: {
    variant: 'bubble',
    role: 'ai',
    size: 'md',
  },
});

const agentChatFooterAttachmentsVariants = cva('flex overflow-auto pb-0', {
  variants: {
    size: {
      sm: 'gap-2 p-2',
      md: 'gap-2 p-2',
      lg: 'gap-3 p-3',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

const agentChatAttachmentBadgeVariants = cva(
  'inline-flex items-center justify-center [&>svg]:h-4 [&>svg]:w-4 shrink-0',
  {
    variants: {
      size: {
        sm: 'text-sm gap-1 px-2 h-7 max-w-[150px]',
        md: 'text-base gap-1.5 px-3 h-9 max-w-[200px]',
        lg: 'text-lg gap-2 px-4 h-11 max-w-[250px]',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

const agentChatInputVariants = cva(
  'resize-none border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none !min-h-0',
  {
    variants: {
      size: {
        sm: 'px-2 py-1.5 text-sm md:text-sm',
        md: 'px-3 py-1.5 text-sm md:text-base',
        lg: 'px-4 py-2 text-lg md:text-lg',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

const getFileIcon = (fileType: string) => {
  if (fileType.startsWith('image/')) {
    return FileImage;
  }

  if (fileType.includes('pdf') || fileType.includes('doc')) {
    return FileText;
  }

  return File;
};

export type Message = AgentChatPrimitive.MessageItem;
export type Attachment = AgentChatPrimitive.Attachment;

interface AgentChatToolCallData {
  id?: string;
  name?: string;
  type: string;
  state?: string;
  title?: string;
  description?: string;
  toolName?: string;
  toolCallId?: string;
  errorText?: string;
  input?: {
    title?: string;
    description?: string;
  } & Record<string, unknown>;
  output?: {
    title?: string;
    description?: string;
    code?: string;
    chatComponent?: boolean;
  } & Record<string, unknown>;
  text?: string;
  url?: string;
  filename?: string;
  mediaType?: string;
}

type LegacyMessageItem = MessageItem & {
  msg: MessageItem['msg'] & {
    role: 'human' | 'ai';
  };
};

type AgentChatSize = AgentChatToolCardSize;
type AgentChatVariant = AgentChatToolCardVariant;

interface AgentChatAttachmentBadgeProps extends VariantProps<
  typeof agentChatAttachmentBadgeVariants
> {
  attachment: Attachment;
  onRemove?: () => void;
  className?: string;
}

function AgentChatAttachmentBadge({
  attachment,
  onRemove,
  size = 'md',
  className,
}: AgentChatAttachmentBadgeProps) {
  const Icon = getFileIcon(attachment.fileType);

  return (
    <Badge
      variant="outline"
      className={cn(
        'group/attachment',
        agentChatAttachmentBadgeVariants({ size }),
        className,
      )}
    >
      <Icon className="shrink-0" />
      <span className="font-normal truncate grow">{attachment.fileName}</span>
      {onRemove && (
        <button
          onClick={onRemove}
          className="shrink-0 hover:bg-accent rounded-full p-1 -m-1 [&>svg]:h-4 [&>svg]:w-4 invisible group-hover/attachment:visible"
          aria-label="Remove attachment"
        >
          <X />
          <span className="sr-only">Remove attachment</span>
        </button>
      )}
    </Badge>
  );
}

const isGenerateDynamicChatComponentToolCall = (
  toolCall: AgentChatToolCallData,
) =>
  toolCall.type === GENERATE_DYNAMIC_CHAT_COMPONENT_TOOL_TYPE ||
  toolCall.toolName === GENERATE_DYNAMIC_CHAT_COMPONENT_TOOL_NAME ||
  toolCall.output?.chatComponent === true;

const getRawToolName = (toolCall: AgentChatToolCallData) =>
  toolCall.toolName ||
  toolCall.type.replace(/^tool-/, '').replace(/^dynamic-tool$/, 'tool');

const formatToolName = (toolCall: AgentChatToolCallData) => {
  const rawName = getRawToolName(toolCall);

  return rawName
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

interface AgentChatToolStatus {
  label: string;
  value: AgentChatToolStatusIconValue;
}

// 3 states only: progress, done, failed. The lead chevron + the title together
// encode state — the chevron is hidden during progress, the title shimmers.
const getStatusValue = (
  toolCall: AgentChatToolCallData,
): AgentChatToolStatusIconValue => {
  switch (toolCall.state) {
    case 'output-available':
      return 'completed';
    case 'output-error':
      return 'failed';
    default:
      return 'loading';
  }
};

// We deliberately do NOT add status-aware verbs ("Preparing X", "Using X",
// "X failed") — those would be fixed English in a boilerplate consumed by
// any-language apps. Visual state is encoded by the title styling (shimmer
// for loading, destructive for failed) and, when expandable, the chevron.
const getSingleToolLabel = (toolCall: AgentChatToolCallData) =>
  formatToolName(toolCall);

const getToolStatus = (
  toolCall: AgentChatToolCallData,
): AgentChatToolStatus => {
  const value = getStatusValue(toolCall);
  return { label: getSingleToolLabel(toolCall), value };
};

// Placeholder for the (yet-to-be-shipped) reasoning channel. When the SDK
// starts surfacing model reasoning on tool calls, this is the single place
// to wire it up. We check the common locations defensively so the UI lights
// up as soon as the field appears, without another diff.
//
// IMPORTANT: today this returns `undefined` for every real tool call, which
// means activity tool rows render flat (no chevron, no expand panel) by
// design — there's nothing to disclose yet.
const getToolReasoning = (
  toolCall: AgentChatToolCallData,
): string | undefined => {
  const candidates: unknown[] = [
    (toolCall as { reasoning?: unknown }).reasoning,
    (toolCall.output as { reasoning?: unknown } | undefined)?.reasoning,
    (toolCall.input as { reasoning?: unknown } | undefined)?.reasoning,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate;
    }
  }
  return undefined;
};

interface AgentChatToolGroup {
  key: string;
  calls: AgentChatToolCallData[];
  representative: AgentChatToolCallData;
}

// Collapse consecutive same-tool runs (e.g. 3 × createTodo) into one row.
// The representative is the latest part — its input/output drive the
// expanded panel — and the displayed label is recomputed from the group.
const groupConsecutiveToolCalls = (
  toolCalls: AgentChatToolCallData[],
): AgentChatToolGroup[] => {
  const groups: AgentChatToolGroup[] = [];
  for (let index = 0; index < toolCalls.length; index += 1) {
    const call = toolCalls[index];
    const name = getRawToolName(call);
    const last = groups[groups.length - 1];
    if (last && getRawToolName(last.representative) === name) {
      last.calls.push(call);
      last.representative = call;
      continue;
    }
    groups.push({
      key: call.toolCallId || `${call.type}-${index}`,
      calls: [call],
      representative: call,
    });
  }
  return groups;
};

const getGroupStatus = (group: AgentChatToolGroup): AgentChatToolStatus => {
  const total = group.calls.length;
  if (total === 1) {
    return getToolStatus(group.representative);
  }

  const completedCount = group.calls.filter(
    (call) => call.state === 'output-available',
  ).length;
  const failedCount = group.calls.filter(
    (call) => call.state === 'output-error',
  ).length;
  const doneCount = completedCount + failedCount;
  // Use the humanised tool name for the group label. Suffix is purely
  // numeric — "2/3" while running, "×3" when done — so it reads in any
  // language.
  const baseLabel = getSingleToolLabel(group.representative);

  if (doneCount < total) {
    return {
      label: `${baseLabel} ${doneCount + 1}/${total}`,
      value: 'loading',
    };
  }

  // All done. Surface failure if any sub-call failed — open question in spec
  // whether to break this down separately. For now: latest wins on visual
  // state, label uses the language-neutral "×N" multiplication symbol.
  return {
    label: `${baseLabel} \u00D7${total}`,
    value: failedCount > 0 ? 'failed' : 'completed',
  };
};

const getMessageToolCalls = (
  message: LegacyMessageItem,
): AgentChatToolCallData[] => {
  const toolCalls = message.msg.payload?.toolCalls;
  if (!Array.isArray(toolCalls)) {
    return [];
  }

  return toolCalls
    .filter((toolCall): toolCall is AgentChatToolCallData =>
      Boolean(toolCall && typeof toolCall === 'object'),
    )
    .map((toolCall) => {
      const toolName =
        toolCall.toolName ||
        toolCall.name ||
        toolCall.type?.replace(/^tool-/, '') ||
        'tool';

      return {
        ...toolCall,
        toolName,
        toolCallId: toolCall.toolCallId || toolCall.id,
        type: toolCall.type || `tool-${toolName}`,
      };
    });
};

// Body of an expanded tool panel — currently only used for `reasoning` text
// when the SDK populates it. Same prose rhythm as the `LiveError` text in
// the live-component part; no `mt-*` here because the rail's vertical
// padding owns the rhythm.
const agentChatToolDisclosureBodyVariants = cva(
  'whitespace-pre-wrap font-sans text-sm leading-relaxed text-muted-foreground',
);

function AgentChatToolReasoningBody({ text }: { text: string }) {
  return (
    <div className={cn(agentChatToolDisclosureBodyVariants())}>{text}</div>
  );
}

// Three animated dots that follow the title sentence during progress.
// Explicit color (not transparent through the parent's gradient) so they stay
// visible against any background.
const agentChatToolTypingDotsVariants = cva(
  'ml-px inline-flex items-baseline text-muted-foreground/60',
);

const agentChatToolTypingDotVariants = cva('animate-typing-dot');

const TYPING_DOT_DELAYS_MS = [0, 200, 400] as const;

function AgentChatToolTypingDots() {
  return (
    <span className={cn(agentChatToolTypingDotsVariants())} aria-hidden="true">
      {TYPING_DOT_DELAYS_MS.map((delay) => (
        <span
          key={delay}
          className={cn(agentChatToolTypingDotVariants())}
          style={{ animationDelay: `${delay}ms` }}
        >
          .
        </span>
      ))}
    </span>
  );
}

function AgentChatActivityPart({
  group,
  size = 'md',
  variant = 'bubble',
}: {
  group: AgentChatToolGroup;
  size?: AgentChatSize;
  variant?: AgentChatVariant;
}) {
  const status = getGroupStatus(group);
  const reasoning = getToolReasoning(group.representative);
  // The chevron only earns its place when there's something to disclose.
  // Today that's reasoning (when the SDK starts emitting it). Tomorrow it
  // could grow to include input/output dumps, traces, etc. — drive it from
  // this single boolean so the row layout stays consistent.
  const isExpandable = Boolean(reasoning);

  // Title is shared between the expandable and flat layouts.
  const titleNode = (
    <AgentChatToolTitle
      size={size}
      className={cn(agentChatToolTitleStateVariants({ status: status.value }))}
    >
      {status.label}
      {status.value === 'loading' && <AgentChatToolTypingDots />}
    </AgentChatToolTitle>
  );

  // Flat layout: no card chrome, no chevron, no expand panel. The row is
  // non-interactive — visual state is carried by the title styling
  // (shimmer for loading, destructive for failed).
  if (!isExpandable) {
    return (
      <div className={cn(agentChatToolHeaderVariants({ size, variant }))}>
        {titleNode}
      </div>
    );
  }

  // Expandable layout: full card with the lead chevron + animated
  // disclosure panel containing the reasoning body.
  return (
    <AgentChatToolCard size={size} variant={variant}>
      <AgentChatToolHeader size={size} variant={variant}>
        <AgentChatToolLeadChevron status={status.value} size={size} />
        {titleNode}
      </AgentChatToolHeader>
      <AgentChatToolContent>
        <AgentChatToolContentInner size={size}>
          {reasoning && <AgentChatToolReasoningBody text={reasoning} />}
        </AgentChatToolContentInner>
      </AgentChatToolContent>
    </AgentChatToolCard>
  );
}

// Tighter line-height (1.6), softer body color (90%), less heavy headings
// (semibold, not bold), tighter list rhythm. The intent is calm long-form
// reading — the AI message body sits flush on the canvas, no bubble, so the
// typography itself has to feel restrained.
const streamdownClassName = ({
  size,
  role,
  variant,
}: {
  size?: 'sm' | 'md' | 'lg';
  role: 'ai' | 'human';
  variant?: 'bubble' | 'minimal';
}) =>
  cn(
    'prose min-w-0 max-w-full overflow-hidden text-foreground/90 dark:prose-invert',
    'prose-headings:text-foreground prose-p:text-foreground/90 prose-strong:text-foreground',
    'prose-headings:font-semibold prose-strong:font-semibold',
    'prose-p:my-1 prose-p:leading-[1.6] prose-headings:mb-2 prose-headings:mt-3',
    'prose-ul:my-2 prose-ol:my-2 prose-ul:pl-5 prose-ol:pl-5',
    'prose-li:my-0 prose-li:pl-0',
    'prose-li:marker:text-muted-foreground/50',
    'prose-blockquote:my-2 prose-pre:my-2 prose-hr:my-2',
    'prose-table:my-1.5 prose-table:text-foreground prose-th:border-border prose-td:border-border',
    'prose-th:px-3 prose-th:py-2 prose-td:px-3 prose-td:py-2',
    '[&>*:first-child]:mt-0 [&>*:last-child]:mb-0',
    '[&_table]:w-max [&_table]:max-w-none [&_table]:overflow-hidden [&_table]:rounded-md [&_table]:border [&_table]:border-border',
    '[&_:has(>table)]:max-w-full [&_:has(>table)]:overflow-x-auto',
    '[&_pre]:max-w-full [&_pre]:overflow-x-auto',
    '[&_code]:break-words [&_img]:max-w-full',
    size === 'sm' && 'prose-sm',
    size === 'md' && 'prose-base',
    size === 'lg' && 'prose-lg',
    role === 'human' &&
      variant === 'bubble' &&
      'text-primary-foreground prose-p:text-primary-foreground prose-strong:text-primary-foreground',
  );

const stripGeneratedComponentLinks = (content: string) =>
  content
    .replace(/(?:[^\n]*\n\n)?\[[^\]]+\]\(sandbox:\/\/external\?[^)]*\)/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

function AgentChatStreamdown({
  content,
  isStreaming,
  size,
  role,
  variant,
}: {
  content: string;
  isStreaming?: boolean;
  size?: 'sm' | 'md' | 'lg';
  role: 'ai' | 'human';
  variant?: 'bubble' | 'minimal';
}) {
  const shouldUseStreamingMarkdown = Boolean(isStreaming && role === 'ai');
  const displayContent =
    role === 'ai' ? stripGeneratedComponentLinks(content) : content;

  return (
    <Streamdown
      mode={shouldUseStreamingMarkdown ? 'streaming' : 'static'}
      animated={
        shouldUseStreamingMarkdown
          ? {
              animation: 'fadeIn',
              duration: 60,
              easing: 'ease-out',
              sep: 'word',
            }
          : undefined
      }
      isAnimating={shouldUseStreamingMarkdown}
      className={streamdownClassName({ size, role, variant })}
    >
      {displayContent}
    </Streamdown>
  );
}

// Flex column that hosts the rendered tool-call rows inside an AI message.
// The size-keyed gap is the *only* vertical rhythm between consecutive tool
// rows — tool cards do NOT add their own `my-*`.
const agentChatToolCallsContentVariants = cva(
  'flex w-full min-w-0 max-w-full flex-col items-start overflow-visible',
  {
    variants: {
      size: {
        sm: 'gap-1',
        md: 'gap-1.5',
        lg: 'gap-2',
      },
      variant: {
        bubble: '',
        minimal: 'gap-1',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'bubble',
    },
  },
);

function AgentChatToolCallsContent({
  toolCalls,
  size,
  variant,
}: {
  toolCalls: AgentChatToolCallData[];
  size?: AgentChatSize;
  variant?: 'bubble' | 'minimal';
}) {
  const { sendMessage } = useAgentChat();
  const liveComponentScopeExtras = React.useMemo(
    () => ({
      AgentChatPrimitive,
      AgentChatMessage,
      AgentChatThinking,
      AgentChatFetching,
      AgentChat,
      AgentChatContent,
      AgentChatMessages,
      AgentChatInput,
      AgentChatFooter,
      AgentChatSimple,
      useAgentChat,
      sendMessage,
    }),
    [sendMessage],
  );

  const generatedToolCalls = toolCalls.filter(
    isGenerateDynamicChatComponentToolCall,
  );
  const activityToolCalls = toolCalls.filter(
    (toolCall) => !isGenerateDynamicChatComponentToolCall(toolCall),
  );

  // O(n) and cheap; useMemo would never hit cache anyway because
  // `activityToolCalls` is a fresh array reference each render.
  const activityGroups = groupConsecutiveToolCalls(activityToolCalls);

  if (generatedToolCalls.length === 0 && activityGroups.length === 0) {
    return null;
  }

  return (
    <div className={cn(agentChatToolCallsContentVariants({ size, variant }))}>
      {activityGroups.map((group) => (
        <AgentChatActivityPart
          key={group.key}
          group={group}
          size={size}
          variant={variant}
        />
      ))}
    </div>
  );
}

export interface AgentChatMessageProps {
  message: Message;
  index: number;
  showTimestamp?: boolean;
  dateFormat?: string;
  userPosition?: 'side' | 'bottom';
}

export type AgentChatMessageComponentProps = AgentChatMessageProps &
  VariantProps<typeof messageVariants> &
  React.ComponentProps<'div'>;

type LegacyAgentChatMessageProps = Omit<AgentChatMessageProps, 'message'> & {
  message: LegacyMessageItem;
};

function AgentChatAvatar({
  role = 'ai',
  size = 'md',
  userPosition = 'side',
  isPulsing = false,
  className,
}: VariantProps<typeof agentChatAvatarVariants> & {
  className?: string;
}) {
  const client = useClient();
  const user = client.getUser();
  const { agentChatData } = useAgentChat();

  const displayName = React.useMemo(() => {
    if (role === 'ai') {
      if (agentChatData?.agent?.title) {
        const agentChatInitials = agentChatData.agent.title
          .split(' ')
          .map((word) => word[0])
          .join('')
          .toUpperCase();
        return agentChatInitials;
      }
      return 'AI';
    }

    const initials = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`;
    return initials || 'U';
  }, [role, user.firstName, user.lastName, agentChatData?.agent?.title]);

  return (
    <Avatar
      className={cn(
        agentChatAvatarVariants({
          role,
          size,
          userPosition,
          isPulsing,
          className,
        }),
      )}
    >
      <AvatarImage
        src={
          role === 'human'
            ? user.profileImageUrl
            : agentChatData?.agent?.photoUrl
        }
        alt={
          role === 'human'
            ? user.firstName || user.lastName || 'You'
            : agentChatData?.agent?.title || 'Assistant'
        }
      />
      <AvatarFallback
        className={cn(
          agentChatAvatarFallbackVariants({
            size,
            userPosition,
          }),
        )}
      >
        {displayName}
      </AvatarFallback>
    </Avatar>
  );
}

export function AgentChatMessage({
  message,
  index,
  variant = 'bubble',
  size = 'md',
  userPosition = 'side',
  showTimestamp = true,
  dateFormat = 'HH:mm',
  className,
  ...props
}: AgentChatMessageComponentProps) {
  return (
    <LegacyAgentChatMessage
      message={message}
      index={index}
      variant={variant}
      size={size}
      userPosition={userPosition}
      showTimestamp={showTimestamp}
      dateFormat={dateFormat}
      className={className}
      {...props}
    />
  );
}

function LegacyAgentChatMessage({
  message,
  index,
  variant = 'bubble',
  size = 'md',
  userPosition = 'side',
  showTimestamp = true,
  dateFormat = 'HH:mm',
  className,
  ...props
}: LegacyAgentChatMessageProps &
  VariantProps<typeof messageVariants> &
  React.ComponentProps<'div'>) {
  const client = useClient();
  const { isThinking, messages } = useAgentChat();
  const nextMessage = messages[index + 1];
  const previousMessage = messages[index - 1];
  const isLastInGroup =
    !nextMessage || nextMessage.msg.role !== message.msg.role;
  const isFirstInGroup =
    !previousMessage || previousMessage.msg.role !== message.msg.role;
  const user = client.getUser();

  const messageContent =
    variant === 'minimal' && userPosition === 'side'
      ? `**${message.msg.role === 'human' ? user.firstName || 'You' : 'AI'}:** ${
          message.msg.content || ''
        }`
      : message.msg.content;
  const toolCalls = getMessageToolCalls(message);
  const isStreamingMessage =
    isThinking && message.msg.role === 'ai' && index === messages.length - 1;

  // Pulse the visible avatar of the latest AI group's representative. The
  // representative is the FIRST message in the group (only it renders a
  // visible avatar; subsequent ones use `invisible`). A message belongs to
  // the latest AI group iff it is AI, isFirstInGroup, isThinking, and every
  // message from this index forward is also AI (no human breaks the run).
  const isLatestAiGroupRepresentative =
    isThinking &&
    message.msg.role === 'ai' &&
    isFirstInGroup &&
    messages.slice(index).every((m) => m.msg.role === 'ai');

  const hasContent = Boolean(messageContent) || toolCalls.length > 0;

  return (
    <AgentChatPrimitive.AgentChatMessage
      message={message}
      index={index}
      className={cn(
        messageVariants({ size, role: message.msg.role }),
        !isLastInGroup && 'pb-0',
        className,
      )}
      {...props}
    >
      {variant === 'bubble' && userPosition === 'side' && (
        <AgentChatAvatar
          role={message.msg.role}
          size={size}
          userPosition={userPosition}
          isPulsing={isLatestAiGroupRepresentative}
          className={!isFirstInGroup ? 'invisible' : undefined}
        />
      )}

      <div
        className={agentChatMessageContentWrapperVariants({
          size,
          variant,
          role: message.msg.role,
        })}
      >
        {hasContent && (
          <div
            data-slot="agent-chat-message-content"
            className={cn(
              messageContentVariants({ size, role: message.msg.role, variant }),
            )}
          >
            {messageContent && (
              <AgentChatStreamdown
                content={messageContent}
                isStreaming={isStreamingMessage}
                size={size || undefined}
                role={message.msg.role}
                variant={variant || undefined}
              />
            )}
            {toolCalls.length > 0 && (
              <AgentChatToolCallsContent
                toolCalls={toolCalls}
                size={size || undefined}
                variant={variant || undefined}
              />
            )}
          </div>
        )}
        {message.msg.attachments && message.msg.attachments.length > 0 && (
          <div
            data-slot="agent-chat-message-attachments"
            className={agentChatMessageAttachmentsVariants({
              size,
              variant,
              role: message.msg.role,
            })}
          >
            {message.msg.attachments.map((attachment, i) => (
              <AgentChatAttachmentBadge
                key={i}
                attachment={attachment}
                size={size}
              />
            ))}
          </div>
        )}
        {showTimestamp && isLastInGroup && (
          <div
            data-slot="agent-chat-message-timestamp"
            className={cn(
              agentChatMessageTimestampVariants({
                variant,
                userPosition,
                size,
                role: message.msg.role,
              }),
            )}
          >
            {userPosition === 'bottom' && (
              <AgentChatAvatar
                role={message.msg.role}
                size={size}
                userPosition={userPosition}
              />
            )}
            <span>{format(new Date(message.createdAt), dateFormat)}</span>
          </div>
        )}
      </div>
    </AgentChatPrimitive.AgentChatMessage>
  );
}

export interface AgentChatThinkingProps {
  variant?: AgentChatVariant;
  userPosition?: 'side' | 'bottom';
}

export type AgentChatThinkingComponentProps = VariantProps<
  typeof agentChatThinkingVariants
> &
  AgentChatThinkingProps &
  React.ComponentProps<'div'>;

// Returns `null` by design: the brief gap between user-sends-message and
// AI-starts-streaming is intentional dead air. Once the AI's first token
// arrives, its message renders and its avatar pulses (see `isPulsing` on
// `AgentChatAvatar`). Stacking a placeholder would compete with that.
export function AgentChatThinking(_props: AgentChatThinkingComponentProps) {
  return null;
}

export type AgentChatFetchingProps = VariantProps<
  typeof agentChatThinkingVariants
> &
  React.ComponentProps<'div'>;

export function AgentChatFetching({
  size = 'md',
  className,
  ...props
}: AgentChatFetchingProps) {
  return (
    <AgentChatPrimitive.AgentChatFetching
      className={cn(
        'absolute inset-0 bg-background/80 backdrop-blur-sm',
        'flex items-center justify-center',
        className,
      )}
      {...props}
    >
      <div className={agentChatFetchingContentVariants({ size })}>
        <Loader2 className="animate-spin text-muted-foreground" />
        <span className="text-muted-foreground">Loading messages...</span>
      </div>
    </AgentChatPrimitive.AgentChatFetching>
  );
}

export interface AgentChatProps {
  agentChat: SDKAgentChat;
  chatId?: string;
  defaultThreadId?: string;
  noPersistency?: boolean;
  chatContext?: any;
  chatContextFiles?: Attachment[];
  children?: React.ReactNode;
}

const AgentChatRootPrimitive =
  AgentChatPrimitive.AgentChatRoot as React.ComponentType<{
    appId: string;
    token?: string;
    agentChatId?: string;
    chatId?: string;
    defaultThreadId?: string;
    chatContext?: unknown;
    chatContextFiles?: Attachment[];
    agentChatData?: AgentChatData;
    noPersistency?: boolean;
    shortTermMemory?: { isEnabled: boolean; isPersistent?: boolean };
    children?: React.ReactNode;
  }>;

export function AgentChat({
  agentChat,
  chatContext,
  noPersistency,
  ...props
}: AgentChatProps) {
  const client = useClient();
  const user = client.getUser();

  const agentChatProps = agentChat.getAgentChatComponentProps();
  const { agentChatId, appId, token } = agentChatProps;

  const finalChatContext = {
    currentUserData: user,
    chatContext: chatContext,
  };

  return (
    <AgentChatRootPrimitive
      appId={appId}
      token={token}
      agentChatId={agentChatId}
      chatContext={finalChatContext}
      noPersistency={noPersistency || !user.isAuthenticated}
      {...props}
    />
  );
}

export function AgentChatContent({
  variant = 'bubble',
  size = 'md',
  userPosition = 'side',
  className,
  ...props
}: AgentChatContentProps) {
  return (
    <div
      data-slot="agent-chat-content"
      className={cn(
        agentChatContentVariants({ variant, size, userPosition, className }),
      )}
      {...props}
    />
  );
}

export type AgentChatContentProps = VariantProps<
  typeof agentChatContentVariants
> &
  React.ComponentProps<'div'>;

export interface AgentChatMessagesProps {
  showTimestamps?: boolean;
  dateFormat?: string;
  userPosition?: 'side' | 'bottom';
}

export type AgentChatMessagesComponentProps = AgentChatMessagesProps &
  VariantProps<typeof messageVariants> &
  React.ComponentProps<'div'>;

export function AgentChatMessages({
  variant = 'bubble',
  size = 'md',
  userPosition = 'side',
  showTimestamps = true,
  dateFormat = 'HH:mm',
  className,
  ...props
}: AgentChatMessagesComponentProps) {
  const { messages } = useAgentChat();

  return (
    <AgentChatPrimitive.AgentChatMessages
      scrollAreaClassName="flex-1"
      autoScroll
      asChild
    >
      <div
        className={cn(agentChatMessagesVariants({ variant, size }), className)}
        {...props}
      >
        {messages.map((message, index) => {
          const flatMsg = message as MessageItem & MessageItem['msg'];
          if (flatMsg.payload?.isVoiceMarker) {
            return (
              <div
                key={message.id}
                className="flex items-center justify-center py-3"
              >
                <span className="text-xs text-muted-foreground">
                  {flatMsg.content}
                </span>
              </div>
            );
          }

          return (
            <AgentChatMessage
              key={message.id}
              message={message}
              index={index}
              variant={variant}
              size={size}
              userPosition={userPosition}
              showTimestamp={showTimestamps}
              dateFormat={dateFormat}
            />
          );
        })}

        <AgentChatThinking
          size={size}
          variant={variant || undefined}
          userPosition={userPosition}
        />
        <AgentChatFetching size={size} />
      </div>
    </AgentChatPrimitive.AgentChatMessages>
  );
}

export interface AgentChatInputProps {
  acceptFiles?: boolean;
  sendOnEnter?: boolean;
}

export type AgentChatInputComponentProps = AgentChatInputProps &
  VariantProps<typeof agentChatInputVariants> &
  React.ComponentProps<'textarea'>;

export function AgentChatInput({
  className,
  onSubmit,
  sendOnEnter = true,
  placeholder = 'Type a message...',
  ...props
}: AgentChatInputComponentProps) {
  return (
    <AgentChatPrimitive.AgentChatInput asChild>
      <Textarea
        placeholder={placeholder}
        rows={1}
        className={cn(agentChatInputVariants({ size: props.size }), className)}
        onSubmit={sendOnEnter ? undefined : onSubmit}
        {...props}
      />
    </AgentChatPrimitive.AgentChatInput>
  );
}

export interface AgentChatFooterProps {
  hideAttachmentButton?: boolean;
  withVoice?: boolean;
}

export type AgentChatFooterComponentProps = AgentChatFooterProps &
  VariantProps<typeof agentChatFooterVariants> &
  React.ComponentProps<'div'>;

export function AgentChatFooter({
  withVoice = false,
  ...props
}: AgentChatFooterComponentProps) {
  if (withVoice) {
    return (
      <AgentChatPrimitive.AgentChatVoice>
        <AgentChatFooterInner withVoice {...props} />
      </AgentChatPrimitive.AgentChatVoice>
    );
  }

  return <AgentChatFooterInner {...props} />;
}

export function AgentChatFooterInner({
  size = 'md',
  className,
  hideAttachmentButton = false,
  withVoice = false,
  children,
  ...props
}: AgentChatFooterProps &
  VariantProps<typeof agentChatFooterVariants> &
  React.ComponentProps<'div'>) {
  const { attachments, isThinking, removeAttachment } = useAgentChat();
  const {
    isConnected,
    isConnecting,
    isSpeaking,
    stream,
    startVoiceCall,
    endVoiceCall,
  } = AgentChatPrimitive.useAgentChatVoice();

  const buttonSize =
    size === 'sm' || size === 'md' ? 'size-8 [&>svg]:size-4' : undefined;

  const isVoiceActive = withVoice && (isConnected || isConnecting);

  const smoothFade = { duration: 0.2, ease: [0.4, 0, 0.2, 1] } as const;

  return (
    <div
      className={cn(agentChatFooterVariants({ size, className }))}
      {...props}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isVoiceActive ? (
          <motion.div
            key="voice"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={smoothFade}
            className="flex items-center gap-2 px-2 py-1.5"
          >
            <LiveWaveform
              active={isConnected && !isSpeaking}
              processing={isConnecting || isSpeaking}
              stream={stream}
              mode="scrolling"
              height={size === 'lg' ? 44 : size === 'md' ? 36 : 32}
              barWidth={3}
              barGap={2}
              fadeEdges
              style={{
                transition: 'color 0.2s ease-in-out',
                color: isSpeaking
                  ? 'hsl(var(--muted-foreground))'
                  : !isConnected || isConnecting
                    ? 'hsl(var(--muted-foreground))'
                    : 'hsl(var(--primary))',
              }}
            />
            <Button
              onClick={endVoiceCall}
              variant="outline"
              className={cn(buttonSize, 'shrink-0 w-auto')}
            >
              <X />
              <span>{isConnecting ? 'Connecting...' : 'Voice mode'}</span>
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="text"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={smoothFade}
          >
            <AnimatePresence initial={false}>
              {attachments.length > 0 && (
                <motion.div
                  key="attachments"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={smoothFade}
                  style={{ overflow: 'hidden' }}
                >
                  <div className={agentChatFooterAttachmentsVariants({ size })}>
                    {attachments.map((attachment) => (
                      <AgentChatAttachmentBadge
                        key={attachment.url}
                        attachment={attachment}
                        size={size}
                        onRemove={() => removeAttachment(attachment.url)}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center gap-2 px-2 py-1.5">
              <AgentChatInput size={size} className="flex-1 min-w-0" />

              {!hideAttachmentButton && (
                <AgentChatPrimitive.AgentChatAttachmentTrigger asChild>
                  <Button size="icon" variant="outline" className={buttonSize}>
                    <Paperclip />
                    <span className="sr-only">Attach file</span>
                  </Button>
                </AgentChatPrimitive.AgentChatAttachmentTrigger>
              )}

              {withVoice && (
                <Button
                  size="icon"
                  variant="outline"
                  onClick={startVoiceCall}
                  className={buttonSize}
                >
                  <Mic />
                  <span className="sr-only">Start voice mode</span>
                </Button>
              )}

              <AgentChatPrimitive.AgentChatSendTrigger asChild>
                <Button size="icon" variant="default" className={buttonSize}>
                  {isThinking ? <Loader2 className="animate-spin" /> : <Send />}
                  <span className="sr-only">Send message</span>
                </Button>
              </AgentChatPrimitive.AgentChatSendTrigger>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {children}
    </div>
  );
}

export function AgentChatSimple({
  agentChat,
  chatId,
  defaultThreadId,
  noPersistency,
  chatContext,
  chatContextFiles,
  withVoice = false,
  size = 'md',
  variant = 'bubble',
  ...props
}: AgentChatSimpleProps) {
  return (
    <AgentChat
      agentChat={agentChat}
      chatId={chatId}
      defaultThreadId={defaultThreadId}
      noPersistency={noPersistency}
      chatContext={chatContext}
      chatContextFiles={chatContextFiles}
    >
      <AgentChatContent variant={variant} size={size} {...props}>
        <AgentChatMessages
          variant={variant}
          size={size}
          userPosition={props.userPosition || undefined}
        />
        <AgentChatFooter size={size} withVoice={withVoice} />
      </AgentChatContent>
    </AgentChat>
  );
}

export type AgentChatSimpleProps = AgentChatProps & {
  withVoice?: boolean;
} & VariantProps<typeof agentChatContentVariants> &
  React.ComponentProps<'div'>;

export const useAgentChat = AgentChatPrimitive.useAgentChat;

export { AgentChatPrimitive };
