import { gql } from '@apollo/client';
import { MessageFields } from "./message";

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
        ${MessageFields}
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
