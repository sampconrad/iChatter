import { gql } from '@apollo/client';

const ConversationFields = `
      id
      participants {
        user {
          id
          username
          image
        }
        hasSeenLatestMessage
      }
      latestMessage {
        id
        sender {
          id
          username
          image
        }
        body
        createdAt
      }
      updatedAt
`;

export default {
  Queries: {
    conversations: gql`
      query Conversations {
        conversations {
          ${ConversationFields}
        }
      }
    `,
  },
  Mutations: {
    createConversation: gql`
      mutation CreateConversation($participantIds: [String]!) {
        createConversation(participantIds: $participantIds) {
          conversationId
        }
      }
    `,
  },
  Subscriptions: {
    conversationCreated: gql`
    subscription COnversationCreated {
      conversationCreated {
        ${ConversationFields}
      }
    }
    `,
  },
};
