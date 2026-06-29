import * as React from 'react';

import * as DeepAgentChat from './deep-agent-chat';
import * as ReactAgentChat from './react-agent-chat';

type AgentChatHarness = 'deep_agent' | 'react_agent' | string | undefined;
type AgentChatHarnessContextValue = {
  isDeepAgent: boolean;
};

const AgentChatHarnessContext =
  React.createContext<AgentChatHarnessContextValue | null>(null);

export function AgentChatMessage(
  props: ReactAgentChat.AgentChatMessageComponentProps,
) {
  const Chat = useAgentChatImplementation() as any;

  return <Chat.AgentChatMessage {...props} />;
}

export const AgentChatMessageGroup = DeepAgentChat.AgentChatMessageGroup;

export function AgentChatThinking(
  props: ReactAgentChat.AgentChatThinkingComponentProps,
) {
  const Chat = useAgentChatImplementation() as any;

  return <Chat.AgentChatThinking {...props} />;
}

export function AgentChatFetching(
  props: ReactAgentChat.AgentChatFetchingProps,
) {
  const Chat = useAgentChatImplementation() as any;

  return <Chat.AgentChatFetching {...props} />;
}

export function AgentChat(props: ReactAgentChat.AgentChatProps) {
  const isDeepAgentChat = isDeepAgent(props);
  const Chat = isDeepAgentChat ? DeepAgentChat : ReactAgentChat;

  return (
    <AgentChatHarnessContext.Provider value={{ isDeepAgent: isDeepAgentChat }}>
      <Chat.AgentChat {...props} />
    </AgentChatHarnessContext.Provider>
  );
}

export function AgentChatContent(props: ReactAgentChat.AgentChatContentProps) {
  const Chat = useAgentChatImplementation() as any;

  return <Chat.AgentChatContent {...props} />;
}

export function AgentChatMessages(
  props: ReactAgentChat.AgentChatMessagesComponentProps,
) {
  const Chat = useAgentChatImplementation() as any;

  return <Chat.AgentChatMessages {...props} />;
}

export function AgentChatInput(
  props: ReactAgentChat.AgentChatInputComponentProps,
) {
  const Chat = useAgentChatImplementation() as any;

  return <Chat.AgentChatInput {...props} />;
}

export function AgentChatFooter(
  props: ReactAgentChat.AgentChatFooterComponentProps,
) {
  const Chat = useAgentChatImplementation() as any;

  return <Chat.AgentChatFooter {...props} />;
}

export function AgentChatFooterInner(
  props: ReactAgentChat.AgentChatFooterComponentProps,
) {
  const Chat = useAgentChatImplementation() as any;

  return <Chat.AgentChatFooterInner {...props} />;
}

export function AgentChatSimple(props: ReactAgentChat.AgentChatSimpleProps) {
  const isDeepAgentChat = isDeepAgent(props);
  const Chat = isDeepAgentChat ? DeepAgentChat : ReactAgentChat;

  return (
    <AgentChatHarnessContext.Provider value={{ isDeepAgent: isDeepAgentChat }}>
      <Chat.AgentChatSimple {...props} />
    </AgentChatHarnessContext.Provider>
  );
}

const isDeepAgent = (props: ReactAgentChat.AgentChatProps) => {
  return getAgentChatHarness(props) === 'deep_agent';
};

const getAgentChatHarness = (
  props: ReactAgentChat.AgentChatProps,
): AgentChatHarness => {
  const agentChatProps =
    props.agentChat.getAgentChatComponentProps() as ReturnType<
      typeof props.agentChat.getAgentChatComponentProps
    > & {
      agentHarness?: AgentChatHarness;
    };

  return agentChatProps.agentHarness;
};

const useAgentChatImplementation = () => {
  const context = React.useContext(AgentChatHarnessContext);

  if (context?.isDeepAgent) {
    return DeepAgentChat;
  }

  return ReactAgentChat;
};

export const useAgentChat = () => {
  const Chat = useAgentChatImplementation() as any;

  return Chat.useAgentChat();
};

export const AgentChatPrimitive = ReactAgentChat.AgentChatPrimitive;
