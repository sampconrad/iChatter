import { useMutation } from "@apollo/client";
import {
  Button,
  Center,
  Stack,
  Text,
  Image,
  Input,
  Flex,
} from "@chakra-ui/react";
import { Session } from "next-auth";
import { signIn } from "next-auth/react";
import { useState } from "react";
import toast from "react-hot-toast";
import UserOperations from "../../graphql/operations/user";
import { CreateUsernameData, CreateUsernameVariables } from "../../util/types";

interface IAuthProps {
  session: Session | null;
  reloadSession: () => void;
}

const Auth: React.FunctionComponent<IAuthProps> = ({
  session,
  reloadSession,
}) => {
  const [username, setUsername] = useState("");

  const [createUsername, { loading, error }] = useMutation<
    CreateUsernameData,
    CreateUsernameVariables
  >(UserOperations.Mutations.createUsername);

  const onSubmit = async () => {
    if (!username) return;
    try {
      const { data } = await createUsername({ variables: { username } });

      if (!data?.createUsername) {
        throw new Error();
      }

      if (data.createUsername.error) {
        const {
          createUsername: { error },
        } = data;

        throw new Error(error);
      }

      toast.success("Username successfully created! 🚀");

      /**
       * Reload session to obtain new username
       */
      reloadSession();
    } catch (error: any) {
      toast.error(error?.message);
      console.log("onSubmit error", error);
    }
  };

  return (
    <Center height="100vh">
      <Stack spacing={8} align="center">
        {session ? (
          <>
            <Text fontSize="3xl">Create a Username</Text>
            <Input
              placeholder="Enter a username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
            <Button width="100%" onClick={onSubmit} isLoading={loading}>
              Save
            </Button>
          </>
        ) : (
          <>
          <Image
            height='200px'
            alt='avatar'
            src='/images/full-logo.svg'
            filter='drop-shadow(2px 2px 4px #00000076)'
          />
          <Button
            onClick={() => signIn('google')}
            leftIcon={
              <Image
                alt='avatar'
                height='20px'
                src='/images/googlelogo.png'
              />
            }
            bg='brand.50'
            color='brand.800'
            _hover={{ bg: 'brand.100' }}
            _active={{ bg: 'brand.200' }}>
            Continue with Google
          </Button>
        </>
        )}
      </Stack>
    </Center>
  );
};

export default Auth;