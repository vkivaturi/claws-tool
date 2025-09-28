#!/usr/bin/env node

import React from 'react';
import { render, Text } from 'ink';

const App = () => {
  return (
    <>
      <Text color="green">
        🐾 Welcome to Claws Tool!
      </Text>
      <Text>
        Hello World! This is your CLI interface powered by React and Ink.
      </Text>
      <Text color="gray">
        More features coming soon...
      </Text>
    </>
  );
};

render(<App />);
