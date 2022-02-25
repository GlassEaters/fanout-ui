import { useFanoutForName } from "../../hooks/useFanoutForName";
import { useMembershipVouchers } from "../../hooks/useMembershipVouchers";
import {
  HStack,
  Icon,
  Text,
  Container,
  Heading,
  Skeleton,
  useColorModeValue,
  VStack,
  SimpleGrid,
  StackDivider,
  Stack,
  Button,
  Image
} from "@chakra-ui/react";
import { NATIVE_MINT } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { amountAsNum, useAccount, useMint, useTokenMetadata, useUserOwnedAmount, useWalletTokenAccounts } from "@strata-foundation/react";
import { useRouter } from "next/router";
import { AiOutlinePlusCircle } from "react-icons/ai";
import { route, routes } from "../../../utils/routes";
import { useMembershipVoucher } from "../../hooks/useMembershipVoucher";
import { numberWithCommas } from "@strata-foundation/marketplace-ui";
import BN from "bn.js";

function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

const Holding = ({
  mint,
  amount
}: {
  mint?: PublicKey;
  amount?: BN;
}) => {
  const { image, metadata, loading, displayName } = useTokenMetadata(mint);
  const mintAcc = useMint(mint);

  const amountNum = amount && mintAcc && amountAsNum(amount, mintAcc);

  return (
    <VStack
      align="start"
      rounded="lg"
      padding={4}
      bg={useColorModeValue("white", "black.300")}
    >
      {loading ? (
        <Skeleton w="50px" h="50px" />
      ) : (
        <Image w="50px" h="50px" src={image} alt={displayName} />
      )}
      <HStack w="full" justifyContent="space-between" spacing={1}>
        <Text fontWeight="700">{displayName}</Text>
        {loading ? (
          <Skeleton w="100px" />
        ) : (
          <Text fontWeight="700">
            {amountNum && numberWithCommas(amountNum, 4)}{" "}
            {metadata?.data.symbol}
          </Text>
        )}
      </HStack>
    </VStack>
  );
};

const Member = ({ member }: { member: PublicKey | undefined }) => {
  const { info: voucher, loading } = useMembershipVoucher(member)
  return (
    <HStack justifyContent="space-between" p={2}>
      {loading && <Skeleton width="250px" />}
      {!loading && (
        <>
          <Text>{voucher?.membershipKey.toBase58()}</Text>
          <Text>{voucher?.shares.toString()} shares</Text>
        </>
      )}
    </HStack>
  );
};

export const Fanout = ({ name }: { name: string }) => {
  const router = useRouter();
  const { info: fanout } = useFanoutForName(name);
  const { members } = useMembershipVouchers(fanout?.publicKey)
  const { result: tokens } = useWalletTokenAccounts(fanout?.accountKey);
  const { info: solOwnedAmount } = useAccount<BN>(
    fanout?.accountKey,
    (_, account) => new BN(account.lamports)
  );
  
  return (
    <Container rounded="lg" maxW={"container.lg"}>
      <VStack w="full">
        <VStack align="left" w="full" shadow="xl" rounded="lg" p="16px">
          <Heading size="lg">{name && capitalizeFirstLetter(name)}</Heading>
          <SimpleGrid columns={[1, 2, 3, 4]}>
            <Holding mint={NATIVE_MINT} amount={solOwnedAmount} />
            {tokens?.map(token => {
              return <Holding key={token.pubkey.toBase58()} mint={token.info.mint} amount={token.info.amount} />;
            })}
          </SimpleGrid>
        </VStack>
        <VStack align="left" w="full" shadow="xl" rounded="lg" p="16px">
          <Stack
            direction={["column", "column", "row"]}
            justifyContent={["start", "start", "space-between"]}
          >
            <Heading size="lg">Holders</Heading>
            <Button
              onClick={() => router.push(route(routes.addMember, { name }))}
              variant="outline"
              leftIcon={<Icon as={AiOutlinePlusCircle} />}
            >
              Add
            </Button>
          </Stack>
          <VStack
            p={4}
            rounded="lg"
            bg={useColorModeValue("white", "black.300")}
            align="stretch"
            divider={
              <StackDivider
                bg="gray.200"
                borderColor={useColorModeValue("gray.200", "gray.500")}
              />
            }
          >
            {members?.map(member => <Member member={member} key={member.toBase58()} />)}
          </VStack>
        </VStack>
      </VStack>
    </Container>
  );
};
