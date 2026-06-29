import 'streamdown/styles.css';

import { AgentChat as SDKAgentChat } from '@blocksdiy/blocks-client-sdk';
import { useClient } from '@blocksdiy/blocks-client-sdk/reactSdk';
import type { AgentChatComponent } from '@blocksdiy/react-common/new-agent-chat';
import * as AgentChatPrimitive from '@blocksdiy/react-common/new-agent-chat';
import { cva, type VariantProps } from 'class-variance-authority';
import { format } from 'date-fns';
import {
  ArrowUp,
  File,
  FileImage,
  FileText,
  Loader2,
  Paperclip,
  X,
} from 'lucide-react';
import { motion, MotionProps } from 'motion/react';
import * as React from 'react';
import { Streamdown } from 'streamdown';
// import { code as streamdownCode } from '@streamdown/code';
// import { mermaid as streamdownMermaid } from '@streamdown/mermaid';
import { z } from 'zod';

import {
  AgentChatProductTypesProvider,
  ChatCodeComponent,
} from '@/components/ui/agent-chat-code-component';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  GET_USER_CHOICE_TOOL_DESCRIPTION,
  GET_USER_CHOICE_TOOL_NAME,
  getUserChoiceParametersSchema,
  GetUserChoiceToolResult,
} from '@/components/ui/deep-agent-chat-get-user-choice';
import { ToolCallFallback } from '@/components/ui/deep-agent-chat-tool-fallback';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import * as ProductTypes from '@/product-types';

export type Message = AgentChatPrimitive.Message;
export type Attachment = AgentChatPrimitive.Attachment;

const GENERATE_DYNAMIC_CHAT_COMPONENT_TOOL_NAME =
  'generate_dynamic_chat_component';
const CHAT_COMPONENT_MESSAGE_PART_CLASS_NAME = 'w-full md:w-full';

export const getFileIcon = (fileType: string) => {
  if (fileType.startsWith('image/')) {
    return FileImage;
  }

  if (fileType.includes('pdf') || fileType.includes('doc')) {
    return FileText;
  }

  return File;
};

const getMessageCreatedAt = (message: Message): string | undefined => {
  return (message as { createdAt?: string }).createdAt;
};

const chatComponentParametersSchema = z.object({}).loose();
type ChatComponentJsonSchemaInput = Parameters<typeof z.fromJSONSchema>[0];

const parseChatComponentInputSchema = (
  input: AgentChatComponent['input'] | string | undefined,
): ChatComponentJsonSchemaInput | undefined => {
  if (!input) {
    return undefined;
  }

  if (typeof input !== 'string') {
    return input as ChatComponentJsonSchemaInput;
  }

  const normalizedInput = input
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();

  try {
    const parsed = JSON.parse(normalizedInput) as unknown;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as ChatComponentJsonSchemaInput)
      : undefined;
  } catch {
    return undefined;
  }
};

const getChatComponentParametersSchema = (component: AgentChatComponent) => {
  const inputSchema = parseChatComponentInputSchema(component.input);
  if (!inputSchema) {
    return chatComponentParametersSchema;
  }

  try {
    return z.fromJSONSchema(
      inputSchema,
    ) as typeof chatComponentParametersSchema;
  } catch {
    return chatComponentParametersSchema;
  }
};

export const agentChatContentVariants = cva('flex flex-col h-full', {
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

export const agentChatMessageGroupVariants = cva(
  'flex group relative flex transition-colors',
  {
    variants: {
      size: {
        sm: 'py-2 px-4 gap-x-4',
        md: 'py-2 px-4 gap-x-4',
        lg: 'py-3 px-6 gap-x-6',
      },
      role: {
        user: 'flex-row-reverse',
        assistant: 'flex-row',
      },
    },
    defaultVariants: {
      size: 'md',
      role: 'assistant',
    },
  },
);

const agentChatMessageGroupContentVariants = cva(
  'flex min-w-0 flex-1 flex-col',
  {
    variants: {
      role: {
        user: 'items-end',
        assistant: 'items-start',
      },
    },
    defaultVariants: {
      role: 'assistant',
    },
  },
);

export const agentChatMessagesVariants = cva('', {
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

export const agentChatMessagePartVariants = cva('relative flex flex-col', {
  variants: {
    size: {
      sm: 'py-1',
      md: 'py-1',
      lg: 'py-2',
    },
    role: {
      user: 'bg-primary text-primary-foreground rounded-lg max-w-full px-2',
      assistant: 'max-w-full',
    },
  },
  defaultVariants: {
    size: 'md',
    role: 'assistant',
  },
});

export const agentChatLoadingDotsWrapperVariants = cva('flex items-center', {
  variants: {
    size: {
      sm: 'h-5',
      md: 'h-6',
      lg: 'h-7',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

export const agentChatLoadingDotsVariants = cva(
  "text-[2px] relative mx-[3.5em] inline-block size-[2.5em] animate-bubble-loader rounded-full text-muted-foreground/70 indent-[-9999em] transform-[translateZ(0)_translateY(-2.5em)] [animation-delay:-0.16s] [animation-fill-mode:both] before:absolute before:left-[-3.5em] before:top-0 before:size-[2.5em] before:animate-bubble-loader before:rounded-full before:content-[''] before:[animation-delay:-0.32s] before:[animation-fill-mode:both] after:absolute after:left-[3.5em] after:top-0 after:size-[2.5em] after:animate-bubble-loader after:rounded-full after:content-[''] after:[animation-fill-mode:both]",
  {
    variants: {
      size: {
        sm: '',
        md: '',
        lg: '',
      },
      state: {
        active: '',
        paused: 'paused before:paused after:paused',
      },
    },
    defaultVariants: {
      size: 'md',
      state: 'active',
    },
  },
);

export const agentChatMessageAvatarVariants = cva('shrink-0 hidden md:flex', {
  variants: {
    role: {
      user: '',
      assistant: '',
    },
    size: {
      sm: 'h-8 w-8',
      md: 'h-9 w-9',
      lg: 'h-10 w-10',
    },
  },
  defaultVariants: {
    role: 'assistant',
    size: 'md',
  },
});

export const agentChatMessageAvatarFallbackVariants = cva('', {
  variants: {
    size: {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

export const agentChatMessageTimestampVariants = cva(
  'flex items-center opacity-0 transition-opacity duration-150 ease-out group-hover:opacity-100 [[data-message-role=user]:has(+[data-message-role=user])_&]:hidden [[data-message-role=assistant]:has(+[data-message-role=assistant])_&]:hidden',
  {
    variants: {
      role: {
        user: 'flex-row-reverse',
        assistant: 'flex-row opacity-100',
      },
      size: {
        sm: 'px-2 py-1',
        md: 'px-3 py-1.5',
        lg: 'px-4 py-2',
      },
    },
    defaultVariants: {
      role: 'assistant',
      size: 'md',
    },
  },
);

const agentChatMessageTimestampTextVariants = cva(
  'text-xs text-muted-foreground',
  {
    variants: {
      role: {
        user: '',
        assistant: 'opacity-0 transition-opacity group-hover:opacity-100',
      },
    },
    defaultVariants: {
      role: 'assistant',
    },
  },
);

export const agentChatFooterVariants = cva('flex flex-col border-t shrink-0', {
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

export const agentChatFetchingContentVariants = cva(
  'flex flex-col items-center',
  {
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
  },
);

const agentChatFetchingOverlayVariants = cva(
  'absolute inset-0 bg-background flex items-center justify-center transition-opacity duration-200 ease-out data-[state=open]:opacity-100 data-[state=closed]:opacity-0 data-[state=open]:pointer-events-auto data-[state=closed]:pointer-events-none',
);

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
  'group/attachment inline-flex items-center justify-center [&>svg]:h-4 [&>svg]:w-4 shrink-0',
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

const agentChatAttachmentRemoveVariants = cva(
  'shrink-0 hover:bg-accent rounded-full p-1 -m-1 [&>svg]:h-4 [&>svg]:w-4 invisible group-hover/attachment:visible',
);

const agentChatAttachmentFileNameVariants = cva('font-normal truncate grow');

const agentChatInputVariants = cva(
  '[field-sizing:content] min-h-[auto] resize-none border-none bg-transparent shadow-none hover:shadow-none focus:shadow-none focus-visible:shadow-none focus-visible:ring-0 focus-visible:ring-offset-0',
  {
    variants: {
      size: {
        sm: 'p-2 text-base md:text-sm leading-4',
        md: 'p-2 text-base md:text-base leading-6',
        lg: 'p-4 text-lg md:text-lg leading-6',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

const agentChatFooterToolbarVariants = cva('flex', {
  variants: {
    mode: {
      voice: 'items-center',
      input: 'items-end',
    },
    size: {
      sm: 'gap-2 p-2',
      md: 'gap-2 p-2',
      lg: 'gap-3 p-3',
    },
  },
  defaultVariants: {
    mode: 'input',
    size: 'md',
  },
});

const agentChatStreamdownVariants = cva(
  'text-inherit [&_[data-streamdown=link].text-primary]:!text-inherit [&_[data-streamdown=link]]:underline-offset-2',
);

const agentChatMessageFilePartVariants = cva('py-1.5');

type AgentChatMessageGroupPrimitiveProps = React.ComponentProps<'div'> & {
  messageGroup: { messageIds: string[]; role: 'assistant' | 'user' };
  isLast?: boolean;
};

const AgentChatMessageGroupPrimitive =
  AgentChatPrimitive.AgentChatMessageGroup ??
  function AgentChatMessageGroupPrimitiveFallback({
    messageGroup,
    isLast: _isLast,
    ...props
  }: AgentChatMessageGroupPrimitiveProps) {
    return (
      <div
        data-slot="agent-chat-message-group"
        data-message-group={messageGroup.role}
        data-message-group-role={messageGroup.role}
        {...props}
      />
    );
  };

interface AgentChatAttachmentBadgeProps extends VariantProps<
  typeof agentChatAttachmentBadgeVariants
> {
  attachment: Attachment;
  onRemove?: () => void;
  className?: string;
}

function AttachmentFileIcon({ fileType }: { fileType: string }) {
  if (fileType.startsWith('image/')) {
    return <FileImage className="shrink-0" />;
  }

  if (fileType.includes('pdf') || fileType.includes('doc')) {
    return <FileText className="shrink-0" />;
  }

  return <File className="shrink-0" />;
}

function AgentChatAttachmentBadge({
  attachment,
  onRemove,
  size = 'md',
  className,
}: AgentChatAttachmentBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(agentChatAttachmentBadgeVariants({ size }), className)}
    >
      <AttachmentFileIcon fileType={attachment.fileType} />
      <span className={agentChatAttachmentFileNameVariants()}>
        {attachment.fileName}
      </span>
      {onRemove && (
        <button
          onClick={onRemove}
          className={agentChatAttachmentRemoveVariants()}
          aria-label="Remove attachment"
        >
          <X />
          <span className="sr-only">Remove attachment</span>
        </button>
      )}
    </Badge>
  );
}

function AgentChatAvatar({
  role = 'assistant',
  size = 'md',
  className,
}: VariantProps<typeof agentChatMessageAvatarVariants> & {
  className?: string;
}) {
  const client = useClient();
  const user = client.getUser();
  const { agent } = useAgentChat();

  const displayName = React.useMemo(() => {
    if (role === 'assistant') {
      if (agent?.title) {
        return agent.title
          .split(' ')
          .map((word) => word[0])
          .join('')
          .toUpperCase();
      }
      return 'AI';
    }

    if (!user) {
      return 'U';
    }

    const initials = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`;
    return initials || 'U';
  }, [role, user, agent?.title]);

  return (
    <Avatar
      className={cn(agentChatMessageAvatarVariants({ role, size }), className)}
    >
      <AvatarImage
        src={role === 'user' ? user.profileImageUrl : agent?.photoUrl}
      />
      <AvatarFallback
        className={agentChatMessageAvatarFallbackVariants({ size })}
      >
        {displayName}
      </AvatarFallback>
    </Avatar>
  );
}

export function AgentChatLoadingDots({
  show,
  size = 'md',
  ...props
}: MotionProps &
  VariantProps<typeof agentChatLoadingDotsWrapperVariants> & {
    show: boolean;
  }) {
  const loadingDotsState = show ? 'active' : 'paused';

  return (
    <motion.div
      className={cn(agentChatLoadingDotsWrapperVariants({ size }))}
      initial={false}
      animate={{ opacity: show ? 1 : 0 }}
      exit={{ opacity: 0, transition: { duration: 0 } }}
      transition={{ duration: 0.16, ease: 'easeInOut' }}
      {...props}
    >
      <span
        aria-hidden={!show}
        aria-label="Is agent thinking"
        className={agentChatLoadingDotsVariants({
          size,
          state: loadingDotsState,
        })}
      />
    </motion.div>
  );
}

interface AgentChatMessageProps {
  messageId: string;
  isStreaming: boolean;
}

const GenerateDynamicChatComponentToolResult = ({
  status,
  result,
  size = 'md',
}: {
  toolCallId: string;
  result: string;
  status: AgentChatPrimitive.ToolCallStatus;
  parameters: Record<string, unknown>;
  size?: 'sm' | 'md' | 'lg';
}) => {
  let parsedResult: {
    code?: string;
    props?: Record<string, unknown>;
  };

  try {
    parsedResult = JSON.parse(result) as typeof parsedResult;
  } catch (error) {
    const message =
      result ||
      (error instanceof Error ? error.message : 'Invalid component result');
    return (
      <div className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {message}
      </div>
    );
  }

  return (
    <ChatCodeComponent
      status={status}
      code={parsedResult.code}
      props={parsedResult.props}
      size={size}
    />
  );
};

const ChatComponentToolResult = ({
  status,
  component,
  parameters,
  respond,
  result,
}: {
  status: AgentChatPrimitive.ToolCallStatus;
  component: AgentChatComponent;
  parameters: Record<string, unknown>;
  respond?: (result: unknown) => Promise<void>;
  result?: unknown;
}) => {
  return (
    <ChatCodeComponent
      status={status}
      code={component.code}
      props={parameters}
      respond={respond}
      result={result}
    />
  );
};

interface MessageTextContentProps {
  text?: string;
  isStreaming: boolean;
}

function AgentChatMessageTextPart({
  text,
  isStreaming,
  ...props
}: VariantProps<typeof agentChatMessagePartVariants> &
  MessageTextContentProps & { className?: string }) {
  if (!text) {
    return null;
  }

  return (
    <AgentChatMessagePart {...props}>
      <Streamdown
        mode={isStreaming ? 'streaming' : 'static'}
        animated={{ animation: 'fadeIn' }}
        isAnimating={isStreaming}
        className={agentChatStreamdownVariants()}
        // plugins={{ code: streamdownCode, mermaid: streamdownMermaid }}
        shikiTheme={['dracula', 'dracula']}
      >
        {text}
      </Streamdown>
    </AgentChatMessagePart>
  );
}

function AgentChatMessageFilePart({
  attachment,
  size,
  className,
}: {
  attachment: Attachment;
  size: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  return (
    <div className={cn(agentChatMessageFilePartVariants(), className)}>
      <AgentChatAttachmentBadge attachment={attachment} size={size} />
    </div>
  );
}

function AgentChatMessagePart({
  children,
  className,
  size,
  role = 'assistant',
}: {
  children: React.ReactNode;
  className?: string;
} & VariantProps<typeof agentChatMessagePartVariants>) {
  return (
    <div
      data-slot="agent-chat-message-part"
      className={cn(agentChatMessagePartVariants({ size, role }), className)}
    >
      {children}
    </div>
  );
}

export function AgentChatMessageGroup({
  size,
  hideAvatar,
  dateFormat,
  className,
  messageGroup,
  showTimestamps,
  isLast: isLastMessageGroup,
  ...props
}: {
  size: 'sm' | 'md' | 'lg';
  hideAvatar: boolean;
  dateFormat: string;
  className?: string;
  messageGroup: { messageIds: string[]; role: 'assistant' | 'user' };
  showTimestamps: boolean;
  isLast: boolean;
}) {
  const { messageById, isThinking } = useAgentChat();
  const lastMessageIdInGroup =
    messageGroup.messageIds[messageGroup.messageIds.length - 1];
  const lastMessage = messageById.get(lastMessageIdInGroup);

  const lastMessageCreatedAtValue = lastMessage
    ? getMessageCreatedAt(lastMessage)
    : undefined;
  const createdAt = lastMessageCreatedAtValue
    ? new Date(lastMessageCreatedAtValue)
    : null;
  const hasValidCreatedAt = Boolean(
    createdAt && !Number.isNaN(createdAt.getTime()),
  );
  const timestampText =
    hasValidCreatedAt && createdAt ? format(createdAt, dateFormat) : '';
  const isStreamingMessageGroup = isThinking && isLastMessageGroup;

  return (
    <AgentChatMessageGroupPrimitive
      className={cn(
        agentChatMessageGroupVariants({ size, role: messageGroup.role }),
        className,
      )}
      messageGroup={messageGroup}
    >
      {!hideAvatar && messageGroup.role === 'assistant' && (
        <AgentChatAvatar role={messageGroup.role} size={size} />
      )}
      <div
        className={cn(
          agentChatMessageGroupContentVariants({ role: messageGroup.role }),
          className,
        )}
        {...props}
      >
        {messageGroup.messageIds.map((messageId, index) => {
          const isLastMessage = index === messageGroup.messageIds.length - 1;

          return (
            <AgentChatMessage
              key={messageId}
              messageId={messageId}
              size={size}
              isStreaming={isStreamingMessageGroup && isLastMessage}
              className={className}
            />
          );
        })}
        {messageGroup.role === 'assistant' && (
          <AgentChatMessagePart
            size={size}
            role={messageGroup.role}
            className={className}
          >
            <AgentChatLoadingDots show={isStreamingMessageGroup} size={size} />
          </AgentChatMessagePart>
        )}
        {showTimestamps && hasValidCreatedAt && (
          <div
            data-slot="agent-chat-message-timestamp"
            className={agentChatMessageTimestampVariants({
              size,
              role: messageGroup.role,
            })}
          >
            {!hideAvatar && messageGroup.role === 'assistant' && (
              <AgentChatAvatar role={messageGroup.role} size={size} />
            )}
            <span
              className={agentChatMessageTimestampTextVariants({
                role: messageGroup.role,
              })}
            >
              {timestampText}
            </span>
          </div>
        )}
      </div>
    </AgentChatMessageGroupPrimitive>
  );
}

export function AgentChatMessage({
  messageId,
  size = 'md',
  isStreaming,
  className,
}: AgentChatMessageProps &
  VariantProps<typeof agentChatMessageGroupVariants> &
  React.ComponentProps<'div'>) {
  const { messageById, toolMessages, renderToolCall } = useAgentChat();
  const message = messageById.get(messageId);

  if (!message) {
    return null;
  }

  if (message.role !== 'user' && message.role !== 'assistant') {
    return null;
  }

  const toolCallElements =
    message.role === 'assistant'
      ? message.toolCalls
          ?.map((toolCall) => {
            return renderToolCall({
              toolCall,
              toolMessage: toolMessages.find(
                (m) => m.toolCallId === toolCall.id,
              ),
            });
          })
          .filter((element) => element !== null) || []
      : [];

  return (
    <>
      {message.content ? (
        typeof message.content === 'string' ? (
          <AgentChatMessageTextPart
            size={size}
            role={message.role}
            text={message.content}
            isStreaming={isStreaming}
            className={className}
          />
        ) : (
          message.content.map((part, index) => {
            return (
              <React.Fragment
                key={`message-${message.id}-part-${part.type}-${index}`}
              >
                {part.type === 'text' && (
                  <AgentChatMessageTextPart
                    size={size}
                    role={message.role}
                    text={part.text}
                    isStreaming={isStreaming}
                    className={className}
                  />
                )}
                {(part.type === 'document' ||
                  part.type === 'image' ||
                  part.type === 'video') && (
                  <AgentChatMessageFilePart
                    size={size || 'md'}
                    className={className}
                    attachment={{
                      url: part.source.value,
                      fileName:
                        (part.metadata as { filename?: string })?.filename ??
                        '',
                      fileType: part.source.mimeType ?? '',
                    }}
                  />
                )}
              </React.Fragment>
            );
          })
        )
      ) : null}
      {toolCallElements.map((toolCallElement, index) => {
        return (
          <React.Fragment key={`message-${messageId}-tool-call-${index}`}>
            {toolCallElement}
          </React.Fragment>
        );
      })}
    </>
  );
}

export interface AgentChatThinkingProps {
  size?: 'sm' | 'md' | 'lg';
}

export function AgentChatThinking(
  _props: AgentChatThinkingProps & React.ComponentProps<'div'>,
) {
  return null;
}

export function AgentChatFetching({
  size = 'md',
  className,
  ...props
}: VariantProps<typeof agentChatFetchingContentVariants> &
  React.ComponentProps<'div'>) {
  return (
    <AgentChatPrimitive.AgentChatFetching
      className={cn(agentChatFetchingOverlayVariants(), className)}
      {...props}
    >
      <div className={agentChatFetchingContentVariants({ size })}>
        <Loader2 className="animate-spin text-muted-foreground/60" />
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
  useAgentBlockDirectChat?: boolean;
  children?: React.ReactNode;
}

export function AgentChat({
  agentChat,
  chatContext,
  noPersistency,
  useAgentBlockDirectChat,
  ...props
}: AgentChatProps) {
  const client = useClient();
  const user = client.getUser();
  const agentChatProps = agentChat.getAgentChatComponentProps() as ReturnType<
    typeof agentChat.getAgentChatComponentProps
  > & {
    agentId?: string;
    agentHarness?: string;
    componentIds?: string[];
  };
  const { agentChatId, agentId, agentHarness, componentIds, appId, token } =
    agentChatProps;

  const finalChatContext = {
    currentUserData: user,
    chatContext,
  };

  return (
    <AgentChatProductTypesProvider value={ProductTypes}>
      <AgentChatPrimitive.AgentChatRoot
        appId={appId}
        token={token}
        agentId={agentId}
        agentHarness={agentHarness}
        useAgentBlockDirectChat={useAgentBlockDirectChat}
        agentChatId={agentChatId}
        noPersistency={noPersistency || !user.isAuthenticated}
        chatContext={finalChatContext}
        componentIds={componentIds}
        {...props}
      />
    </AgentChatProductTypesProvider>
  );
}

const DefaultToolCall = ({
  size = 'md',
  hidden = false,
}: {
  size?: 'sm' | 'md' | 'lg';
  hidden?: boolean;
}) => {
  AgentChatPrimitive.useDefaultRenderTool(
    {
      render: ({ name, parameters, status, result }) => {
        if (hidden) {
          return <></>;
        }

        return (
          <AgentChatMessagePart size={size}>
            <ToolCallFallback
              name={name}
              parameters={parameters}
              status={status}
              result={result}
              size={size}
            />
          </AgentChatMessagePart>
        );
      },
    },
    [hidden, size],
  );

  return null;
};

const GetUserChoiceToolRegistration = ({
  size = 'md',
}: {
  size?: 'sm' | 'md' | 'lg';
}) => {
  AgentChatPrimitive.useHumanInTheLoop(
    {
      name: GET_USER_CHOICE_TOOL_NAME,
      description: GET_USER_CHOICE_TOOL_DESCRIPTION,
      parameters: getUserChoiceParametersSchema,
      render: (renderProps) => {
        return (
          <AgentChatMessagePart size={size} role="assistant">
            <GetUserChoiceToolResult
              args={renderProps.args}
              result={renderProps.result}
              respond={renderProps.respond}
            />
          </AgentChatMessagePart>
        );
      },
    },
    [size],
  );

  return null;
};

const GenerateDynamicChatComponentToolCall = ({
  size = 'md',
}: {
  size?: 'sm' | 'md' | 'lg';
}) => {
  AgentChatPrimitive.useRenderTool(
    {
      name: GENERATE_DYNAMIC_CHAT_COMPONENT_TOOL_NAME,
      parameters: z.object({}).loose(),
      render: ({ toolCallId, status, result, parameters }) => {
        if (status !== AgentChatPrimitive.ToolCallStatus.Complete || !result) {
          return <></>;
        }

        return (
          <AgentChatMessagePart
            size={size}
            className={CHAT_COMPONENT_MESSAGE_PART_CLASS_NAME}
          >
            <GenerateDynamicChatComponentToolResult
              toolCallId={toolCallId}
              status={status as AgentChatPrimitive.ToolCallStatus}
              result={result}
              parameters={parameters}
              size={size}
            />
          </AgentChatMessagePart>
        );
      },
    },
    [size],
  );

  return null;
};

const ChatComponentRenderToolCall = ({
  size = 'md',
  component,
}: {
  size?: 'sm' | 'md' | 'lg';
  component: AgentChatComponent;
}) => {
  const parametersSchema = React.useMemo(
    () => getChatComponentParametersSchema(component),
    [component],
  );
  const toolName = `show-component-${AgentChatPrimitive.getAgentChatComponentToolName(
    component.name,
  )}`;

  AgentChatPrimitive.useFrontendTool(
    {
      name: toolName,
      description: component.description,
      parameters: parametersSchema,
      handler: async () =>
        `<prebuilt_chat_component_rendered tool="${toolName}" component="${component.name}" status="success" />`,
      render: ({ status, args }) => {
        return (
          <AgentChatMessagePart
            size={size}
            role="assistant"
            className={CHAT_COMPONENT_MESSAGE_PART_CLASS_NAME}
          >
            <ChatComponentToolResult
              status={status as AgentChatPrimitive.ToolCallStatus}
              component={component}
              parameters={args as Record<string, unknown>}
            />
          </AgentChatMessagePart>
        );
      },
    },
    [component, parametersSchema, size, toolName],
  );

  return null;
};

// HITL chat_component (`userInterrupt`): a FRONTEND-ONLY tool, like
// `get_user_choice`. CopilotKit registers it with the agent and pauses the run
// entirely client-side — no backend `interrupt()` / checkpointer involved. The
// rendered code calls `respond(payload)` (exposed in the live scope) to resume,
// which CopilotKit forwards as `Command(resume=payload)`.
const ChatComponentInterruptToolCall = ({
  size = 'md',
  component,
}: {
  size?: 'sm' | 'md' | 'lg';
  component: AgentChatComponent;
}) => {
  const parametersSchema = React.useMemo(
    () => getChatComponentParametersSchema(component),
    [component],
  );
  const toolName = `show-component-${AgentChatPrimitive.getAgentChatComponentToolName(
    component.name,
  )}`;

  AgentChatPrimitive.useHumanInTheLoop(
    {
      name: toolName,
      description: component.description,
      parameters: parametersSchema,
      render: (renderProps) => {
        // `result` is the payload the user previously sent via `respond(...)`.
        // On reload the HITL tool call is replayed WITH its result, so we feed
        // it back into the component (see ChatCodeComponent's `result`) so it
        // can rehydrate its answered state instead of rendering fresh.
        const { status, args, respond, result } = renderProps;
        return (
          <AgentChatMessagePart
            size={size}
            role="assistant"
            className={CHAT_COMPONENT_MESSAGE_PART_CLASS_NAME}
          >
            <ChatComponentToolResult
              status={status as AgentChatPrimitive.ToolCallStatus}
              component={component}
              parameters={args as Record<string, unknown>}
              respond={respond}
              result={result}
            />
          </AgentChatMessagePart>
        );
      },
    },
    [component, parametersSchema, size, toolName],
  );

  return null;
};

export type AgentChatContentProps = VariantProps<
  typeof agentChatContentVariants
> &
  React.ComponentProps<'div'>;

const ChatComponentToolCall = ({
  size = 'md',
  component,
}: {
  size?: 'sm' | 'md' | 'lg';
  component: AgentChatComponent;
}) => {
  if (component.userInterrupt) {
    return <ChatComponentInterruptToolCall size={size} component={component} />;
  }
  return <ChatComponentRenderToolCall size={size} component={component} />;
};

export function AgentChatContent({
  size = 'md',
  className,
  ...props
}: VariantProps<typeof agentChatContentVariants> &
  React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="agent-chat-content"
      className={cn(agentChatContentVariants({ size }), className)}
      {...props}
    />
  );
}

export interface AgentChatMessagesProps {
  showTimestamps?: boolean;
  dateFormat?: string;
  hideAvatar?: boolean;
  messageClassName?: string;
}

export type AgentChatMessagesComponentProps = AgentChatMessagesProps &
  VariantProps<typeof agentChatMessagesVariants> &
  React.ComponentProps<'div'>;

export function AgentChatMessages({
  size = 'md',
  hideAvatar = false,
  showTimestamps = true,
  dateFormat = 'HH:mm',
  messageClassName,
  className,
  ...props
}: AgentChatMessagesComponentProps) {
  const { agentChat, components, messageGroups } = useAgentChat();
  const resolvedSize = size ?? 'md';

  return (
    <AgentChatPrimitive.AgentChatMessages
      className={cn(
        agentChatMessagesVariants({ size: resolvedSize }),
        className,
      )}
      scrollAreaClassName="relative"
      {...props}
    >
      <GetUserChoiceToolRegistration size={resolvedSize} />
      <DefaultToolCall
        size={resolvedSize}
        hidden={agentChat?.hideToolsUi === true}
      />
      {!agentChat ||
      agentChat.disableGeneratingDynamicChatComponent === true ? null : (
        <GenerateDynamicChatComponentToolCall size={resolvedSize} />
      )}
      {components.map((component) => (
        <ChatComponentToolCall
          size={resolvedSize}
          component={component}
          key={`chat-component-tool-call-${component.id}`}
        />
      ))}
      {messageGroups.map((messageGroup, index) => (
        <AgentChatMessageGroup
          key={`message-group-${index}`}
          messageGroup={messageGroup}
          isLast={index === messageGroups.length - 1}
          size={resolvedSize}
          hideAvatar={hideAvatar}
          dateFormat={dateFormat}
          className={messageClassName}
          showTimestamps={showTimestamps}
        />
      ))}
    </AgentChatPrimitive.AgentChatMessages>
  );
}

interface AgentChatInputProps {
  sendOnEnter?: boolean;
}

export function AgentChatInput({
  className,
  onSubmit,
  sendOnEnter = true,
  placeholder = 'Type a message...',
  ...props
}: AgentChatInputProps &
  VariantProps<typeof agentChatInputVariants> &
  React.ComponentProps<'textarea'>) {
  return (
    <AgentChatPrimitive.AgentChatInput asChild>
      <Textarea
        placeholder={placeholder}
        className={cn(agentChatInputVariants({ size: props.size }), className)}
        onSubmit={sendOnEnter ? undefined : onSubmit}
        {...props}
      />
    </AgentChatPrimitive.AgentChatInput>
  );
}

interface AgentChatFooterProps {
  withVoice?: boolean;
  inputClassName?: string;
  sendButtonClassName?: string;
  attachmentButtonClassName?: string;
}

export function AgentChatFooter({
  withVoice = false,
  ...props
}: AgentChatFooterProps &
  VariantProps<typeof agentChatFooterVariants> &
  React.ComponentProps<'div'>) {
  if (withVoice) {
    return <AgentChatFooterInner withVoice {...props} />;
  }

  return <AgentChatFooterInner {...props} />;
}

export function AgentChatFooterInner({
  size = 'md',
  className,
  inputClassName,
  sendButtonClassName,
  attachmentButtonClassName,
  // withVoice = false,
  children,
  ...props
}: AgentChatFooterProps &
  VariantProps<typeof agentChatFooterVariants> &
  React.ComponentProps<'div'>) {
  const { attachments, removeAttachment, agentChat } = useAgentChat();
  const disableAttachments = agentChat
    ? agentChat.disableAttachments === true
    : true;
  // const { isConnected, isConnecting, isSpeaking, stream, startVoiceCall, endVoiceCall } =
  //   AgentChatPrimitive.useAgentChatVoice();

  // const isVoiceActive = withVoice && (isConnected || isConnecting);
  const iconSize = 'icon';
  const iconButtonClassName = cn(
    size === 'sm' && 'h-9 w-9 [&_svg]:size-4',
    size === 'md' && '[&_svg]:size-5',
    size === 'lg' && 'h-11 w-11 [&_svg]:size-5',
  );
  const isVoiceActive = false;

  return (
    <div
      className={cn(agentChatFooterVariants({ size }), className)}
      {...props}
    >
      {isVoiceActive ? (
        <div
          className={agentChatFooterToolbarVariants({ mode: 'voice', size })}
        >
          {/* <LiveWaveform
              active={isConnected && !isSpeaking}
              processing={isConnecting || isSpeaking}
              stream={stream}
              mode="scrolling"
              height={size === "lg" ? 76 : 64}
              barWidth={3}
              barGap={2}
              fadeEdges
              style={{
                transition: "color 0.2s ease-in-out",
                color: isSpeaking
                  ? "var(--muted-foreground)"
                  : !isConnected || isConnecting
                    ? "var(--muted-foreground)"
                    : "var(--primary)",
              }}
            />
            <Button
              onClick={endVoiceCall}
              variant="outline"
              size={size === "sm" || size === "md" ? "sm" : "md"}
            >
              <X />
              <span>{isConnecting ? "Connecting..." : "Voice mode"}</span>
            </Button> */}
        </div>
      ) : (
        <>
          {!disableAttachments && attachments.length > 0 && (
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
          )}

          <div
            className={agentChatFooterToolbarVariants({ mode: 'input', size })}
          >
            <AgentChatInput
              size={size}
              className={cn('flex-1 min-w-0', inputClassName)}
            />

            {!disableAttachments && (
              <AgentChatPrimitive.AgentChatAttachmentTrigger asChild>
                <Button
                  size={iconSize}
                  variant="outline"
                  className={cn(iconButtonClassName, attachmentButtonClassName)}
                >
                  <Paperclip />
                  <span className="sr-only">Attach file</span>
                </Button>
              </AgentChatPrimitive.AgentChatAttachmentTrigger>
            )}

            {/* {withVoice && (
                <Button size={iconSize} variant="outline" onClick={startVoiceCall}>
                  <Mic />
                  <span className="sr-only">Start voice mode</span>
                </Button>
              )} */}

            <AgentChatPrimitive.AgentChatSendTrigger asChild>
              <Button
                size={iconSize}
                variant="default"
                className={cn(iconButtonClassName, sendButtonClassName)}
              >
                <ArrowUp />
                {/* {isThinking ? <Square className="fill-current" /> : <ArrowUp />} */}
                <span className="sr-only">Send message</span>
                {/* <span className="sr-only">{isThinking ? "Stop run" : "Send message"}</span> */}
              </Button>
            </AgentChatPrimitive.AgentChatSendTrigger>
          </div>
        </>
      )}

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
  useAgentBlockDirectChat,
  withVoice = false,
  hideAvatar = false,
  messagesContainerClassName,
  messageClassName,
  footerClassName,
  inputClassName,
  sendButtonClassName,
  attachmentButtonClassName,
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
      useAgentBlockDirectChat={useAgentBlockDirectChat}
    >
      <AgentChatContent {...props}>
        <AgentChatMessages
          size={props.size}
          hideAvatar={hideAvatar}
          className={messagesContainerClassName}
          messageClassName={messageClassName}
        />
        <AgentChatFooter
          size={props.size}
          withVoice={withVoice}
          className={footerClassName}
          inputClassName={inputClassName}
          sendButtonClassName={sendButtonClassName}
          attachmentButtonClassName={attachmentButtonClassName}
        />
        <AgentChatFetching size={props.size} />
      </AgentChatContent>
    </AgentChat>
  );
}

export type AgentChatSimpleProps = AgentChatProps & {
  withVoice?: boolean;
  hideAvatar?: boolean;
  messagesContainerClassName?: string;
  messageClassName?: string;
  footerClassName?: string;
  inputClassName?: string;
  sendButtonClassName?: string;
  attachmentButtonClassName?: string;
} & VariantProps<typeof agentChatContentVariants> &
  React.ComponentProps<'div'>;

export const useAgentChat = AgentChatPrimitive.useAgentChat;

export { AgentChatPrimitive };
