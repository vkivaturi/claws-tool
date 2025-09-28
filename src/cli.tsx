#!/usr/bin/env node

import React, { useState, useEffect } from 'react';
import { render, Text, Box, useInput } from 'ink';
import { LambdaClient, ListFunctionsCommand, GetFunctionCommand, InvokeCommand } from '@aws-sdk/client-lambda';
import { CloudWatchLogsClient, DescribeLogGroupsCommand } from '@aws-sdk/client-cloudwatch-logs';
import { CloudWatchClient, ListMetricsCommand } from '@aws-sdk/client-cloudwatch';

interface Option {
  id: string;
  label: string;
  description: string;
}

interface AwsResource {
  name: string;
  details: string;
  arn?: string;
}

interface LambdaAction {
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
  const [awsResources, setAwsResources] = useState<AwsResource[]>([]);
  const [resourceSelectedIndex, setResourceSelectedIndex] = useState(0);
  const [isLoadingAws, setIsLoadingAws] = useState(false);
  const [viewMode, setViewMode] = useState<'options' | 'resources' | 'lambda-actions' | 'lambda-config' | 'lambda-test'>('options');
  const [selectedLambda, setSelectedLambda] = useState<AwsResource | null>(null);
  const [lambdaActions] = useState<LambdaAction[]>([
    { id: 'configuration', label: 'Configuration', description: 'View function configuration details' },
    { id: 'test', label: 'Test', description: 'Execute function with test JSON input' }
  ]);
  const [actionSelectedIndex, setActionSelectedIndex] = useState(0);
  const [testInput, setTestInput] = useState('{"key": "value"}');
  const [isEditingInput, setIsEditingInput] = useState(false);

  const fetchLambdaFunctions = async () => {
    try {
      const client = new LambdaClient({});
      const command = new ListFunctionsCommand({});
      const response = await client.send(command);
      
      const functions = response.Functions?.map(func => ({
        name: func.FunctionName || 'Unknown',
        details: `Runtime: ${func.Runtime}, Handler: ${func.Handler}`,
        arn: func.FunctionArn
      })) || [];
      
      return functions;
    } catch (error) {
      throw new Error(`Failed to fetch Lambda functions: ${error}`);
    }
  };

  const fetchLogGroups = async () => {
    try {
      const client = new CloudWatchLogsClient({});
      const command = new DescribeLogGroupsCommand({});
      const response = await client.send(command);
      
      const logGroups = response.logGroups?.map(group => ({
        name: group.logGroupName || 'Unknown',
        details: `Size: ${group.storedBytes || 0} bytes, Retention: ${group.retentionInDays || 'Never'} days`
      })) || [];
      
      return logGroups;
    } catch (error) {
      throw new Error(`Failed to fetch log groups: ${error}`);
    }
  };

  const fetchCloudWatchMetrics = async () => {
    try {
      const client = new CloudWatchClient({});
      const command = new ListMetricsCommand({
        Namespace: 'AWS/Lambda'
      });
      const response = await client.send(command);
      
      const metrics = response.Metrics?.map(metric => ({
        name: metric.MetricName || 'Unknown',
        details: `Namespace: ${metric.Namespace}, Dimensions: ${metric.Dimensions?.length || 0}`
      })) || [];
      
      return metrics;
    } catch (error) {
      throw new Error(`Failed to fetch CloudWatch metrics: ${error}`);
    }
  };

  const fetchLambdaConfiguration = async (functionName: string) => {
    try {
      const client = new LambdaClient({});
      const command = new GetFunctionCommand({ FunctionName: functionName });
      const response = await client.send(command);
      
      const config = response.Configuration;
      const configDetails = [
        `Function Name: ${config?.FunctionName}`,
        `Runtime: ${config?.Runtime}`,
        `Handler: ${config?.Handler}`,
        `Memory: ${config?.MemorySize} MB`,
        `Timeout: ${config?.Timeout} seconds`,
        `Last Modified: ${config?.LastModified}`,
        `Code Size: ${config?.CodeSize} bytes`,
        `State: ${config?.State}`,
        `Role: ${config?.Role}`,
        `Environment Variables: ${Object.keys(config?.Environment?.Variables || {}).length} vars`
      ];
      
      return configDetails;
    } catch (error) {
      throw new Error(`Failed to fetch Lambda configuration: ${error}`);
    }
  };

  const invokeLambdaFunction = async (functionName: string, payload: string) => {
    try {
      const client = new LambdaClient({});
      const command = new InvokeCommand({
        FunctionName: functionName,
        Payload: new TextEncoder().encode(payload),
        LogType: 'Tail'
      });
      
      const response = await client.send(command);
      const responsePayload = response.Payload ? new TextDecoder().decode(response.Payload) : 'No response';
      const logResult = response.LogResult ? atob(response.LogResult) : 'No logs';
      
      return {
        statusCode: response.StatusCode,
        payload: responsePayload,
        logs: logResult,
        executedVersion: response.ExecutedVersion,
        logGroupName: `/aws/lambda/${functionName}`
      };
    } catch (error) {
      throw new Error(`Failed to invoke Lambda function: ${error}`);
    }
  };

  const handleOptionSelection = async (optionId: string) => {
    setIsLoadingAws(true);
    setResults(prev => [...prev, `Loading ${options.find(o => o.id === optionId)?.label}...`]);
    
    try {
      let resources: AwsResource[] = [];
      
      switch (optionId) {
        case 'lambda':
          resources = await fetchLambdaFunctions();
          break;
        case 'cloudwatch-logs':
          resources = await fetchLogGroups();
          break;
        case 'cloudwatch-metrics':
          resources = await fetchCloudWatchMetrics();
          break;
      }
      
      setAwsResources(resources);
      setResourceSelectedIndex(0);
      setViewMode('resources');
      const actionText = optionId === 'lambda' ? 'Use ↑↓ to navigate, Enter to select function, Esc to go back.' : 'Use ↑↓ to navigate, Enter to select, Esc to go back.';
      setResults(prev => [...prev, `Found ${resources.length} items. ${actionText}`]);
    } catch (error) {
      setResults(prev => [...prev, `Error: ${error}`]);
    } finally {
      setIsLoadingAws(false);
    }
  };

  const handleLambdaConfiguration = async (functionName: string) => {
    setIsLoadingAws(true);
    setViewMode('lambda-config');
    setResults(prev => [...prev, `Loading configuration for ${functionName}...`]);
    
    try {
      const configDetails = await fetchLambdaConfiguration(functionName);
      setResults(prev => [...prev, 'Configuration Details:', ...configDetails, '', 'Press Esc to go back']);
    } catch (error) {
      setResults(prev => [...prev, `Error: ${error}`]);
    } finally {
      setIsLoadingAws(false);
    }
  };

  const handleLambdaTest = async (functionName: string, payload: string) => {
    setIsLoadingAws(true);
    setResults(prev => [...prev, `Executing ${functionName} with payload: ${payload}`]);
    
    try {
      const result = await invokeLambdaFunction(functionName, payload);
      setResults(prev => [...prev, 
        '═══════════════════════════════════════',
        '🚀 LAMBDA EXECUTION RESULTS',
        '═══════════════════════════════════════',
        `✅ Status Code: ${result.statusCode}`,
        '',
        '📤 FUNCTION OUTPUT:',
        '───────────────────────────────────────',
        result.payload,
        '───────────────────────────────────────',
        '',
        `📋 Executed Version: ${result.executedVersion}`,
        `📊 Log Group: ${result.logGroupName}`,
        '',
        '📝 EXECUTION LOGS:',
        '───────────────────────────────────────',
        result.logs,
        '───────────────────────────────────────',
        '',
        'Press Esc to go back'
      ]);
    } catch (error) {
      setResults(prev => [...prev, `Error: ${error}`]);
    } finally {
      setIsLoadingAws(false);
    }
  };

  useInput((input, key) => {
    if (viewMode === 'options') {
      if (key.upArrow) {
        setSelectedIndex(prev => prev > 0 ? prev - 1 : options.length - 1);
      } else if (key.downArrow) {
        setSelectedIndex(prev => prev < options.length - 1 ? prev + 1 : 0);
      } else if (key.return && !isLoadingAws) {
        const selectedOption = options[selectedIndex];
        handleOptionSelection(selectedOption.id);
      }
    } else if (viewMode === 'resources') {
      if (key.upArrow) {
        setResourceSelectedIndex(prev => prev > 0 ? prev - 1 : awsResources.length - 1);
      } else if (key.downArrow) {
        setResourceSelectedIndex(prev => prev < awsResources.length - 1 ? prev + 1 : 0);
      } else if (key.return) {
        const selectedResource = awsResources[resourceSelectedIndex];
        if (options[selectedIndex]?.id === 'lambda') {
          setSelectedLambda(selectedResource);
          setViewMode('lambda-actions');
          setActionSelectedIndex(0);
          setResults(prev => [...prev, `Selected Lambda: ${selectedResource.name}`, 'Choose an action:']);
        } else {
          setResults(prev => [...prev, `Selected: ${selectedResource.name}`, selectedResource.details]);
        }
      } else if (key.escape) {
        setViewMode('options');
        setAwsResources([]);
        setResults(prev => [...prev, 'Back to main options']);
      }
    } else if (viewMode === 'lambda-actions') {
      if (key.upArrow) {
        setActionSelectedIndex(prev => prev > 0 ? prev - 1 : lambdaActions.length - 1);
      } else if (key.downArrow) {
        setActionSelectedIndex(prev => prev < lambdaActions.length - 1 ? prev + 1 : 0);
      } else if (key.return && selectedLambda) {
        const selectedAction = lambdaActions[actionSelectedIndex];
        if (selectedAction.id === 'configuration') {
          handleLambdaConfiguration(selectedLambda.name);
        } else if (selectedAction.id === 'test') {
          setViewMode('lambda-test');
          setResults(prev => [...prev, `Testing ${selectedLambda.name}`, 'Edit JSON input and press Enter to execute:']);
        }
      } else if (key.escape) {
        setViewMode('resources');
        setSelectedLambda(null);
        setResults(prev => [...prev, 'Back to Lambda functions']);
      }
    } else if (viewMode === 'lambda-config') {
      if (key.escape) {
        setViewMode('lambda-actions');
        setResults(prev => [...prev, 'Back to Lambda actions']);
      }
    } else if (viewMode === 'lambda-test') {
      if (isEditingInput) {
        if (key.return) {
          setIsEditingInput(false);
          if (selectedLambda) {
            handleLambdaTest(selectedLambda.name, testInput);
          }
        } else if (key.escape) {
          setIsEditingInput(false);
        } else if (input && input.length === 1) {
          if (key.backspace || key.delete) {
            setTestInput(prev => prev.slice(0, -1));
          } else {
            setTestInput(prev => prev + input);
          }
        }
      } else {
        if (key.return) {
          setIsEditingInput(true);
        } else if (key.escape) {
          setViewMode('lambda-actions');
          setResults(prev => [...prev, 'Back to Lambda actions']);
        }
      }
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
        {viewMode === 'options' ? (
          <>
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
                {isLoadingAws ? 'Loading...' : 'Use ↑↓ arrows to navigate, Enter to select'}
              </Text>
            </Box>
          </>
        ) : viewMode === 'resources' ? (
          <>
            <Text color="yellow" bold>AWS Resources ({awsResources.length} items)</Text>
            <Text>─────────────────</Text>
            {awsResources.length === 0 ? (
              <Text color="gray">No resources found</Text>
            ) : (
              awsResources.slice(0, 8).map((resource, index) => (
                <Box key={index} flexDirection="column">
                  <Text color={index === resourceSelectedIndex ? 'black' : 'white'} 
                        backgroundColor={index === resourceSelectedIndex ? 'green' : undefined}>
                    {index === resourceSelectedIndex ? '► ' : '  '}
                    {resource.name}
                  </Text>
                  {index === resourceSelectedIndex && (
                    <Box marginLeft={2}>
                      <Text color="gray">
                        {resource.details}
                      </Text>
                    </Box>
                  )}
                </Box>
              ))
            )}
            <Box marginTop={1}>
              <Text color="gray" dimColor>
                Use ↑↓ arrows to navigate, Enter to select, Esc to go back
              </Text>
            </Box>
          </>
        ) : viewMode === 'lambda-actions' ? (
          <>
            <Text color="yellow" bold>Lambda Actions for {selectedLambda?.name}</Text>
            <Text>─────────────────</Text>
            {lambdaActions.map((action, index) => (
              <Box key={action.id} flexDirection="row">
                <Text color={index === actionSelectedIndex ? 'black' : 'white'} 
                      backgroundColor={index === actionSelectedIndex ? 'green' : undefined}>
                  {index === actionSelectedIndex ? '► ' : '  '}
                  {action.label}
                </Text>
                <Box marginLeft={2}>
                  <Text color="gray">
                    - {action.description}
                  </Text>
                </Box>
              </Box>
            ))}
            <Box marginTop={1}>
              <Text color="gray" dimColor>
                Use ↑↓ arrows to navigate, Enter to select, Esc to go back
              </Text>
            </Box>
          </>
        ) : viewMode === 'lambda-test' ? (
          <>
            <Text color="yellow" bold>Test {selectedLambda?.name}</Text>
            <Text>─────────────────</Text>
            <Text color="cyan">JSON Input:</Text>
            <Box borderStyle="single" borderColor={isEditingInput ? 'yellow' : 'gray'} padding={1}>
              <Text color={isEditingInput ? 'yellow' : 'white'}>
                {testInput}
                {isEditingInput && <Text color="yellow">|</Text>}
              </Text>
            </Box>
            <Box marginTop={1}>
              <Text color="gray" dimColor>
                {isEditingInput ? 'Type JSON, Enter to execute, Esc to cancel' : 'Press Enter to edit input, Esc to go back'}
              </Text>
            </Box>
          </>
        ) : (
          <>
            <Text color="yellow" bold>Configuration View</Text>
            <Text>─────────────────</Text>
            <Text color="gray" dimColor>
              Press Esc to go back
            </Text>
          </>
        )}
      </Box>
    </Box>
  );
};

render(<App />);
