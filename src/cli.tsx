#!/usr/bin/env node

import React, { useState, useEffect } from 'react';
import { render, Text, Box, useInput } from 'ink';

interface Option {
  id: string;
  label: string;
  description: string;
}

const options: Option[] = [
  { id: 'lambda', label: 'Lambda', description: 'AWS Lambda Functions' },
  { id: 'cloudwatch-logs', label: 'CloudWatch Logs', description: 'View and search CloudWatch logs' },
  { id: 'cloudwatch-metrics', label: 'CloudWatch Metrics', description: 'Monitor CloudWatch metrics' }
];

const App = () => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [results, setResults] = useState<string[]>(['🐾 Welcome to Claws Tool!', 'Select an option below to get started:']);

  useInput((input, key) => {
    if (key.upArrow) {
      setSelectedIndex(prev => prev > 0 ? prev - 1 : options.length - 1);
    } else if (key.downArrow) {
      setSelectedIndex(prev => prev < options.length - 1 ? prev + 1 : 0);
    } else if (key.return) {
      const selectedOption = options[selectedIndex];
      setResults(prev => [...prev, `Selected: ${selectedOption.label}`, `${selectedOption.description}`]);
    }
  });

  return (
    <Box flexDirection="column" height={20}>
      {/* Results Panel */}
      <Box flexDirection="column" borderStyle="single" borderColor="blue" padding={1} height={12}>
        <Text color="cyan" bold>Results Panel</Text>
        <Text>─────────────</Text>
        {results.map((result, index) => (
          <Text key={index} color={index === 0 ? 'green' : 'white'}>
            {result}
          </Text>
        ))}
      </Box>

      {/* Command Options Box */}
      <Box flexDirection="column" borderStyle="single" borderColor="green" padding={1} marginTop={1}>
        <Text color="yellow" bold>Available Commands</Text>
        <Text>─────────────────</Text>
        {options.map((option, index) => (
          <Box key={option.id} flexDirection="row">
            <Text color={index === selectedIndex ? 'black' : 'white'} 
                  backgroundColor={index === selectedIndex ? 'green' : undefined}>
              {index === selectedIndex ? '► ' : '  '}
              {option.label}
            </Text>
            <Box marginLeft={2}>
              <Text color="gray">
                - {option.description}
              </Text>
            </Box>
          </Box>
        ))}
        <Box marginTop={1}>
          <Text color="gray" dimColor>
            Use ↑↓ arrows to navigate, Enter to select
          </Text>
        </Box>
      </Box>
    </Box>
  );
};

render(<App />);
