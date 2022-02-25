import {
  Box,
  Button,
  Center,
  Container,
  Heading,
  HStack,
  Image,
  Link,
  LinkProps,
  Text,
} from "@chakra-ui/react";
import { useWallet } from "@solana/wallet-adapter-react";
import React from "react";
import { WalletModalButton } from "@strata-foundation/marketplace-ui";

interface IMenuItemProps extends LinkProps {
  isLast?: boolean;
}

export const Header: React.FC = () => {
  const { disconnect, connected } = useWallet();
  return (
    <>
      <Center
        zIndex={100}
        position="fixed"
        w="full"
        height="56px"
        alignItems="center"
        color="white"
        bg="black.300"
      >
        <Container
          maxW="container.lg"
          w="full"
          display="flex"
          justifyContent="space-between"
        >
          <Link href="/">
            {/* <Image alt="Strata Marketplace" src="/logo.svg" /> */}
            <Heading size="lg">Fanout</Heading>
          </Link>
          <Box
            display={{ md: "block" }}
            flexBasis={{ base: "100%", md: "auto" }}
          >
            <HStack
              align="center"
              justify={["center", "space-between", "flex-end", "flex-end"]}
              direction={["column", "row", "row", "row"]}
              display={["none", "none", "flex"]}
              pt={[4, 4, 0, 0]}
            >
              {connected && (
                <Button
                  _hover={{ backgroundColor: "black.500" }}
                  variant="ghost"
                  onClick={() => disconnect()}
                >
                  Disconnect
                </Button>
              )}
              <WalletModalButton />
            </HStack>
          </Box>
        </Container>
      </Center>
      <Box height="56px" />
    </>
  );
};
