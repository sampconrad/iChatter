import { Box, Text } from '@chakra-ui/react';
import { Session } from 'next-auth';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { ConversationPopulated } from '../../../../../backend/src/util/types';
import ConversationItem from './ConversationItem';
import ConversationModal from './Modal/ConversationModal';
import ConversationOperations from '../../../graphql/operations/conversation'
import { useMutation } from "@apollo/client";
import { toast } from "react-hot-toast";

interface ConversationListProps {
  session: Session;
  conversations: Array<ConversationPopulated>;
  onViewConversation: (conversationId: string, hasSeenLatestMessage: boolean | undefined) => void;
}

const ConversationList: React.FC<ConversationListProps> = ({
  session,
  conversations,
  onViewConversation,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [deleteConversation] = useMutation<{
    deleteConversation: boolean, 
    conversationId: string
  }>(ConversationOperations.Mutations.deleteConversation)

  const onOpen = () => {
    setIsOpen(true);
  };
  const onClose = () => {
    setIsOpen(false);
  };

  const router = useRouter();

  const {
    user: { id: userId },
  } = session;

  const onDeleteConversation = async (conversationId: string) => {
    try {
      toast.promise(
        deleteConversation({
          variables: {
            conversationId,
          },
          update: () => { 
            router.replace(typeof process.env.NEXT_PUBLIC_BASE_URL === 'string' ? process.env.NEXT_PUBLIC_BASE_URL : '')
          }
        }), {
          loading: 'Deleting conversation',
          success: 'Conversation deleted',
          error: 'Failed to delete conversation'
        }
      );
    } catch (error) {
      console.log('onDeleteConversation error', error)
    }
  }

  const sortedConversations = [...conversations].sort((a, b) => b.updatedAt.valueOf() - a.updatedAt.valueOf())

  return (
    <Box width='100%'>
      <Box
        py={2}
        px={4}
        mb={4}
        bg='blackAlpha.300'
        borderRadius={4}
        cursor='pointer'
        onClick={onOpen}>
        <Text
          textAlign='center'
          color='whiteAlpha.800'
          fontWeight={500}>
          Create a conversation
        </Text>
      </Box>
      <ConversationModal
        session={session}
        isOpen={isOpen}
        onClose={onClose}
      />
      {sortedConversations.map((conversation) => {
        const participant = conversation.participants.find((p: any) => p.user.id === userId);
        
        return (
          <ConversationItem
            key={conversation.id}
            userId={userId}
            conversation={conversation}
            onClick={() => onViewConversation(conversation.id, participant?.hasSeenLatestMessage)}
            onDeleteConversation={onDeleteConversation}
            hasSeenLatestMessage={participant?.hasSeenLatestMessage}
            isSelected={conversation.id === router.query.conversationId}
          />
        );
      })}
    </Box>
  );
};

export default ConversationList;
