import { Box, Input } from '@chakra-ui/react';
import { Session } from 'next-auth';
import React, { useState } from 'react';
import { toast } from 'react-hot-toast';

interface MessageInputProps {
  session: Session;
  conversationId: string;
}

const MessageInput = ({ session, conversationId }: MessageInputProps) => {
  const [messageBody, setMessageBody] = useState('');

  const onSendMessage = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      // call sendMessage mutation
    } catch (error: any) {
      console.log('onSendMessage error', error);
      toast.error(error?.message);
    }
  };

  return (
    <Box
      px={4}
      py={6}
      width='100%'>
      <form onSubmit={() => {}}>
        <Input
          value={messageBody}
          onChange={(event) => setMessageBody(event.target.value)}
          placeholder='New message'
          resize='none'
          _focus={{
            boxShadow: 'none',
            border: '1px solid',
            borderColor: 'whiteAlpha.300',
          }}
        />
      </form>
    </Box>
  );
};

export default MessageInput;
