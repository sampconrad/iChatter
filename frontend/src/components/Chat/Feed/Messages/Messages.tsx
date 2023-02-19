import SkeletonLoader from '@/components/common/SkeletonLoader';
import conversation from '@/graphql/operations/conversation';
import { MessagesData, MessageSubscriptionData, MessagesVariables } from '@/util/types';
import { useQuery } from '@apollo/client';
import { Flex, Stack } from '@chakra-ui/react';
import { useEffect } from 'react';
import { toast } from 'react-hot-toast';
import MessageOperations from '../../../../graphql/operations/message';

interface MessagesProps {
  userId: string;
  conversationId: string;
}

const Messages: React.FC<MessagesProps> = ({ userId, conversationId }) => {
  const { data, loading, error, subscribeToMore } = useQuery<MessagesData, MessagesVariables>(
    MessageOperations.Query.messages,
    {
      variables: {
        conversationId,
      },
      onError: ({ message }) => {
        toast.error(message);
      },
    }
  );

  if (error) {
    return null;
  }

  const subscribeToMoreMessages = (conversationId: string) => {
    subscribeToMore({
      document: MessageOperations.Subscription.messageSent,
      variables: {
        conversationId,
      },
      updateQuery: (prev, { subscriptionData }: MessageSubscriptionData) => {
        if (!subscriptionData) return prev;

        console.log('HERE IS SUBSCRIPTION DATA', subscriptionData);

        const newMessage = subscriptionData.data.messageSent;

        return Object.assign({}, prev, {
          messages: [newMessage, ...prev.messages],
        });
      },
    });
  };

  useEffect(() => {
    const unsubscribe = subscribeToMoreMessages(conversationId);

    return () => unsubscribe;
  }, [conversationId]);

  console.log('HERE IS MESSAGE DATA', data);

  return (
    <Flex
      direction='column'
      justify='flex-end'
      overflow='hidden'>
      {loading && (
        <Stack
          spacing={4}
          px={4}>
          <SkeletonLoader
            count={4}
            height='60px'
            width='100%'
          />
        </Stack>
      )}
      {data?.messages && (
        <Flex
          direction='column-reverse'
          overflowY='scroll'
          height='100%'>
          {data.messages.map((message) => (
            // <MessageItem/>
            <div key={message.id}>{message.body}</div>
          ))}
        </Flex>
      )}
    </Flex>
  );
};

export default Messages;
