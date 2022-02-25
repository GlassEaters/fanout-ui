import type { NextPage } from 'next';
import Head from 'next/head';
import React from 'react';
import { FanoutForm } from '../src/components/form/FanoutForm';
import { FormContainer } from '../src/components/FormContainer';

const Home: NextPage = () => {
  return (
    <div>
      <Head>
        <title>Fanout wallet</title>
        <meta name="description" content="Create a fanout" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <FormContainer label="Create Fanout">
          <FanoutForm />
        </FormContainer>
      </main>
    </div>
  );
};

export default Home;
