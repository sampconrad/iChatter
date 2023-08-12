import { CreateConversationData, CreateConversationInput, SearchedUser, SearchUsersData, SearchUsersInput } from '@/util/types';
import { useLazyQuery, useMutation } from '@apollo/client';
import { Button, Flex, Input, Modal, ModalBody, ModalCloseButton, ModalContent, ModalHeader, ModalOverlay, Stack } from '@chakra-ui/react';
import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import UserOperations from '../../../../graphql/operations/user';
import ConversationOperations from '../../../../graphql/operations/conversation';
import Participants from './Participants';
import UserSearchList from './UserSearchList';
import { Session } from 'next-auth';
import { useRouter } from 'next/router';

interface ConversationModalProps {
  session: Session;
  isOpen: boolean;
  onClose: () => void;
}

const ConversationModal: React.FC<ConversationModalProps> = ({ session, isOpen, onClose }) => {
  const {
    user: { id: userId },
  } = session;

  const router = useRouter();

  const [username, setUsername] = useState('');
  const [participants, setParticipants] = useState<Array<SearchedUser>>([]);
  const [searchUsers, { data, error, loading }] = useLazyQuery<SearchUsersData, SearchUsersInput>(UserOperations.Queries.searchUsers);

  const [createConversation, { loading: createConversationLoading }] = useMutation<CreateConversationData, CreateConversationInput>(
    ConversationOperations.Mutations.createConversation
  );

  const onCreateConversation = async () => {
    const participantIds = [userId, ...participants.map((p) => p.id)];
    console.log('PARTICIPANT IDs', participantIds);

    try {
      const { data } = await createConversation({
        variables: {
          participantIds,
        },
      });

      if (!data?.createConversation) {
        throw new Error('Failed to create conversation');
      }

      const {
        createConversation: { conversationId },
      } = data;

      router.push({ query: { conversationId } });

      // clear state and close modal on sucessful creation
      setParticipants([]);
      setUsername('');
      onClose();
      
    } catch (error: any) {
      console.log('onCreateConversation error', error);
      toast.error(error?.message);
    }
  };

  const onSearch = (event: React.FormEvent) => {
    event.preventDefault();
    searchUsers({ variables: { username } });
    console.log('HERE IS SEARCH DATA', data);
  };

  const addParticipant = (user: SearchedUser) => {
    setParticipants((prev) => [...prev, user]);
    setUsername('');
  };

  const removeParticipant = (userId: string) => {
    setParticipants((prev) => prev.filter((p) => p.id !== userId));
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}>
        <ModalOverlay />
        <ModalContent
          bg='brand.800'
          pb={4}>
          <ModalHeader>Create a Conversation</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <form onSubmit={onSearch}>
              <Stack spacing={4}>
                <Input
                  placeholder='Enter a username'
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                />
                <Button
                  type='submit'
                  disabled={!username}
                  isLoading={loading}
                  bg='brand.500'
                  _hover={{ color: 'brand.900', bg: 'brand.50' }}>
                  Search
                </Button>
              </Stack>
            </form>
            {data?.searchUsers && (
              <UserSearchList
                users={data.searchUsers}
                addParticipant={addParticipant}
              />
            )}
            {participants.length !== 0 && (
              <>
                <Participants
                  participants={participants}
                  removeParticipant={removeParticipant}
                />
                <Button
                  bg='brand.100'
                  width='100%'
                  mt={6}
                  _hover={{ color: 'brand.900', bg: 'brand.50' }}
                  isLoading={createConversationLoading}
                  onClick={onCreateConversation}>
                  Create Conversation
                </Button>
              </>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default ConversationModal;
