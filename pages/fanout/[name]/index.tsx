import { Box, Container, Heading, useColorModeValue } from "@chakra-ui/react";
import type { NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import React from "react";
import { Fanout } from "../../../src/components/Fanout/Fanout";

const FanoutPage: NextPage = () => {
  const router = useRouter();
  const { name } = router.query;
  
  return (
    <div>
      <Head>
        <title>Fanout wallet</title>
        <meta name="description" content="Create a fanout" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <Box
          color={useColorModeValue("black", "white")}
          w="100vw"
          backgroundColor="black.500"
          height="100vh"
          overflow="auto"
          paddingBottom="200px"
        >
          <Container mt={"35px"} justifyItems="stretch" maxW="container.md">
            <Fanout name={name as string} />
          </Container>
        </Box>
      </main>
    </div>
  );
};

export default FanoutPage;
