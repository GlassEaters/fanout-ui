import React from 'react';
import { Box, Container, Heading, useColorModeValue } from "@chakra-ui/react";

export const FormContainer= ({ children, label }: { label: string, children: React.ReactNode }) => {
  return <Box
    color={useColorModeValue("black", "white")}
    w="100vw"
    backgroundColor="black.500"
    height="100vh"
    overflow="auto"
    paddingBottom="200px"
  >
    <Container mt={"35px"} justifyItems="stretch" maxW="container.md">
      <Heading mb={2} fontSize="24px" fontWeight={600}>
        { label }
      </Heading>
      <Box
        zIndex={1}
        shadow="xl"
        rounded="lg"
        p="16px"
        pb="29px"
        minH="300px"
        bg="black.300"
      >
        { children }
      </Box>
    </Container>
  </Box>;
}
