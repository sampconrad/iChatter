import { gql, useMutation, useQuery, useSubscription } from '@apollo/client';
import { Box } from '@chakra-ui/react';
import { Session } from 'next-auth';
import ConversationList from './ConversationList';
import ConversationOperations from '../../../graphql/operations/conversation';
import { ConversationUpdatedData, ConversationsData } from '@/util/types';
import { ConversationPopulated, ParticipantPopulated } from '../../../../../backend/src/util/types';
import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import SkeletonLoader from '@/components/common/SkeletonLoader';

interface ConversationsWrapperProps {
  session: Session;
}

const ConversationsWrapper: React.FC<ConversationsWrapperProps> = ({ session }) => {
  const router = useRouter();
  const {
    query: { conversationId },
  } = router;

  const {
    user: { id: userId },
  } = session;
  
  const {
    data: conversationsData,
    error: conversationsError,
    loading: conversationsLoading,
    subscribeToMore,
  } = useQuery<ConversationsData, null>(ConversationOperations.Queries.conversations);

  const [markConversationAsRead] = useMutation<
    { markConversationAsRead: boolean },
    { userId: string; conversationId: string }
  >(ConversationOperations.Mutations.markConversationAsRead);

  useSubscription<ConversationUpdatedData, null>(
    ConversationOperations.Subscriptions.conversationUpdated, 
    {
      onData: ({client, data}) => {
        const {data: subscriptionData } = data;

        console.log('ON DATA FIRING', subscriptionData)

        if (!subscriptionData) return;

        const {conversationUpdated: {conversation: updatedConversation }} = subscriptionData

        const currentlyViewingConversation = updatedConversation.id === conversationId;

        if (currentlyViewingConversation) {
          onViewConversation(conversationId, false)
        }
        
      }
    }
  );

  const onViewConversation = async (
    conversationId: string,
    hasSeenLatestMessage: boolean | undefined
  ) => {
    router.push({ query: { conversationId } });

    if (hasSeenLatestMessage) return;

    try {
      await markConversationAsRead({
        variables: {
          userId,
          conversationId,
        },
        optimisticResponse: {
          markConversationAsRead: true,
        },
        update: (cache) => {
          const participantsFragment = cache.readFragment<{
            participants: Array<ParticipantPopulated>;
          }>({
            id: `Conversation:${conversationId}`,
            fragment: gql`
              fragment Participants on Conversation {
                participants {
                  user {
                    id
                    username
                  }
                  hasSeenLatestMessage
                }
              }
            `,
          });

          if (!participantsFragment) return;

          const participants = [...participantsFragment.participants];

          const userParticipantIdx = participants.findIndex((p) => p.user.id === userId);

          if (userParticipantIdx === -1) return;

          const userParticipant = participants[userParticipantIdx];

          participants[userParticipantIdx] = {
            ...userParticipant,
            hasSeenLatestMessage: true,
          };

          cache.writeFragment({
            id: `Conversation:${conversationId}`,
            fragment: gql`
              fragment UpdatedParticipant on Conversation {
                participants
              }
            `,
            data: {
              participants,
            },
          });
        },
      });
    } catch (error: any) {
      console.log('onViewConversation error', error);
    }
  };

  const subscribeToNewConversations = () => {
    subscribeToMore({
      document: ConversationOperations.Subscriptions.conversationCreated,
      updateQuery: (
        prev,
        {
          subscriptionData,
        }: { subscriptionData: { data: { conversationCreated: ConversationPopulated } } }
      ) => {
        if (!subscriptionData.data) return prev;

        const newConversation = subscriptionData.data.conversationCreated;

        return Object.assign({}, prev, {
          conversations: [newConversation, ...prev.conversations],
        });
      },
    });
  };

  useEffect(() => {
    subscribeToNewConversations();
  }, []);

  return (
    <Box
      display={{ base: conversationId ? 'none' : 'flex', md: 'flex' }}
      width={{ base: '100%', md: '400px' }}
      flexDirection='column'
      bg='whiteAlpha.50'
      gap={4}
      py={6}
      px={3}>
      {conversationsLoading ? (
        <SkeletonLoader
          count={7}
          height='80px'
        />
      ) : (
        <ConversationList
          session={session}
          conversations={conversationsData?.conversations || []}
          onViewConversation={onViewConversation}
        />
      )}
    </Box>
  );
};

export default ConversationsWrapper;
