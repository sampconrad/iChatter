import { ConversationDeletedSubscriptionPayload, ConversationPopulated, ConversationUpdatedSubscriptionPayload, GraphQLContext } from '../../util/types';
import { GraphQLError } from 'graphql';
import { Prisma } from '@prisma/client';
import { withFilter } from 'graphql-subscriptions';
import { userIsConversationParticipant } from "../../util/functions";

const resolvers = {
  Query: {
    conversations: async (
      _: any,
      __: any,
      context: GraphQLContext
    ): Promise<Array<ConversationPopulated>> => {
      const { session, prisma } = context;

      if (!session?.user) {
        throw new GraphQLError('Not authorized');
      }

      const {
        user: { id: userId },
      } = session;

      try {
        const conversations = await prisma.conversation.findMany({
          include: conversationPopulated,
        });

        return conversations.filter(
          (conversation) => !!conversation.participants.find((p) => p.userId === userId)
        );
      } catch (error: any) {
        console.log('conversations error', error);
        throw new GraphQLError(error?.message);
      }
    },
  },
  Mutation: {
    createConversation: async (
      _: any,
      args: { participantIds: Array<string> },
      context: GraphQLContext
    ): Promise<{ conversationId: string }> => {
      const { session, prisma, pubsub } = context;
      const { participantIds } = args;

      if (!session?.user) {
        throw new GraphQLError('Not authorized');
      }

      const {
        user: { id: userId },
      } = session;

      try {
        const conversation = await prisma.conversation.create({
          data: {
            participants: {
              createMany: {
                data: participantIds.map((id) => ({
                  userId: id,
                  hasSeenLatestMessage: id === userId,
                })),
              },
            },
          },
          include: conversationPopulated,
        });

        pubsub.publish('CONVERSATION_CREATED', {
          conversationCreated: conversation,
        });

        return {
          conversationId: conversation.id,
        };
      } catch (error) {
        console.log('createConversation error', error);
        throw new GraphQLError('Error creating conversation');
      }
    },
    markConversationAsRead: async function (
      _: any,
      args: { userId: string; conversationId: string },
      context: GraphQLContext
    ): Promise<boolean> {
      const { userId, conversationId } = args;
      const { session, prisma } = context;

      if (!session?.user) {
        throw new GraphQLError('Not authorized');
      }

      try {
        const participant = await prisma.conversationParticipant.findFirst({
          where: {
            userId,
            conversationId,
          }
        })

        if (!participant) {
          throw new GraphQLError('Participant entity not found');
        }

        await prisma.conversationParticipant.update({
          where: {
            id: participant.id,
          },
          data: {
            hasSeenLatestMessage: true,
          },
        });

        return true;
      } catch (error: any) {
        console.log('markConversationAsRead error', error);
        throw new GraphQLError(error.message);
      }
    },
    deleteConversation: async function (
      _: any,
      args: { conversationId: string },
      context: GraphQLContext
      ): Promise<boolean> {
        const {session, prisma, pubsub} = context;
        const {conversationId} = args;

        if (!session?.user) {
          throw new GraphQLError("Not authorized")
        }

        try {
          const [deletedConversation] = await prisma.$transaction([prisma.conversation.delete({
            where: {
              id: conversationId
            },
            include: conversationPopulated,
          }),
          prisma.conversationParticipant.deleteMany({
            where: {
              conversationId,
            }
          }),
          prisma.message.deleteMany({
            where: {
              conversationId,
            }
          })
        ])

        pubsub.publish('CONVERSATION_DELETED', {
          conversationDeleted: deletedConversation,
        });
        } catch (error: any) {
          console.log('deleteConversation error', error)          
          throw new GraphQLError('Failed to delete conversation')
        }


        return true
      },
  },
  Subscription: {
    conversationCreated: {
      subscribe: withFilter(
        (_: any, __: any, context: GraphQLContext) => {
          const { pubsub } = context;

          return pubsub.asyncIterator(['CONVERSATION_CREATED']);
        },
        (payload: ConversationCreatedSubscriptionPayload, _, context: GraphQLContext) => {
          const { session } = context;

          if (!session?.user) {
            throw new GraphQLError('Not authorized');
          }

          const {
            conversationCreated: { participants },
          } = payload;

          return userIsConversationParticipant(participants, session.user.id)
        }
      ),
    },
    conversationUpdated: {
      subscribe: withFilter(
        (_: any, __: any, context: GraphQLContext) => {
          const { pubsub } = context;

          return pubsub.asyncIterator(['CONVERSATION_UPDATED']);
        }, 
        (payload: ConversationUpdatedSubscriptionPayload, _: any, context: GraphQLContext) => {

          const { session } = context;

          console.log('HERE IS PAYLOAD', payload);

          if (!session?.user) {
            throw new GraphQLError('Not authorized');
          }

          const { id: userId} = session.user;
          const {
            conversationUpdated: {
              conversation: {participants}
            }
          } = payload;

          return userIsConversationParticipant(participants, userId)
        }
      )
    },
    conversationDeleted: {
      subscribe: withFilter(
        (_: any, __: any, context: GraphQLContext) => {
          const { pubsub } = context;

          return pubsub.asyncIterator(['CONVERSATION_DELETED']);
        }, 
        (payload: ConversationDeletedSubscriptionPayload, _: any, context: GraphQLContext) => {

          const { session } = context;

          if (!session?.user) {
            throw new GraphQLError('Not authorized');
          }

          const {id: userId} = session.user;
          const {conversationDeleted: {participants}} = payload;

          return userIsConversationParticipant(participants, userId)
        }
      )
    }
  },
};

export interface ConversationCreatedSubscriptionPayload {
  conversationCreated: ConversationPopulated;
}

export const participantPopulated = Prisma.validator<Prisma.ConversationParticipantInclude>()({
  user: {
    select: {
      id: true,
      username: true,
      image: true,
    },
  },
});

export const conversationPopulated = Prisma.validator<Prisma.ConversationInclude>()({
  participants: {
    include: participantPopulated,
  },
  latestMessage: {
    include: {
      sender: {
        select: {
          id: true,
          username: true,
          image: true,
        },
      },
    },
  },
});

export default resolvers;
