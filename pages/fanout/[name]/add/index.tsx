import type { NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import React from "react";
import { AddMemberForm } from "@/components/form/AddMemberForm";
import { FormContainer } from "@/components/FormContainer";

const AddNew: NextPage = () => {
  const router = useRouter();
  const { name } = router.query;
  return (
    <div>
      <Head>
        <title>Add to Fanout</title>
        <meta name="description" content="Add to Fanout" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <FormContainer label="Create Fanout">
          <AddMemberForm name={name as string} />
        </FormContainer>
      </main>
    </div>
  );
};

export default AddNew;
