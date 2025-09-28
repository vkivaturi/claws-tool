#!/usr/bin/env node
import React, { useState } from 'react';
import { render, Text, Box, useInput } from 'ink';
import { LambdaClient, ListFunctionsCommand } from '@aws-sdk/client-lambda';
import { CloudWatchLogsClient, DescribeLogGroupsCommand } from '@aws-sdk/client-cloudwatch-logs';
import { CloudWatchClient, ListMetricsCommand } from '@aws-sdk/client-cloudwatch';
const options = [
    { id: 'lambda', label: 'Lambda', description: 'AWS Lambda Functions' },
    { id: 'cloudwatch-logs', label: 'CloudWatch Logs', description: 'View and search CloudWatch logs' },
    { id: 'cloudwatch-metrics', label: 'CloudWatch Metrics', description: 'Monitor CloudWatch metrics' }
];
const App = () => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [results, setResults] = useState(['🐾 Welcome to Claws Tool!', 'Select an option below to get started:']);
    const [awsResources, setAwsResources] = useState([]);
    const [resourceSelectedIndex, setResourceSelectedIndex] = useState(0);
    const [isLoadingAws, setIsLoadingAws] = useState(false);
    const [viewMode, setViewMode] = useState('options');
    const fetchLambdaFunctions = async () => {
        try {
            const client = new LambdaClient({});
            const command = new ListFunctionsCommand({});
            const response = await client.send(command);
            const functions = response.Functions?.map(func => ({
                name: func.FunctionName || 'Unknown',
                details: `Runtime: ${func.Runtime}, Handler: ${func.Handler}`
            })) || [];
            return functions;
        }
        catch (error) {
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
        }
        catch (error) {
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
        }
        catch (error) {
            throw new Error(`Failed to fetch CloudWatch metrics: ${error}`);
        }
    };
    const handleOptionSelection = async (optionId) => {
        setIsLoadingAws(true);
        setResults(prev => [...prev, `Loading ${options.find(o => o.id === optionId)?.label}...`]);
        try {
            let resources = [];
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
            setResults(prev => [...prev, `Found ${resources.length} items. Use ↑↓ to navigate, Enter to select, Esc to go back.`]);
        }
        catch (error) {
            setResults(prev => [...prev, `Error: ${error}`]);
        }
        finally {
            setIsLoadingAws(false);
        }
    };
    useInput((input, key) => {
        if (viewMode === 'options') {
            if (key.upArrow) {
                setSelectedIndex(prev => prev > 0 ? prev - 1 : options.length - 1);
            }
            else if (key.downArrow) {
                setSelectedIndex(prev => prev < options.length - 1 ? prev + 1 : 0);
            }
            else if (key.return && !isLoadingAws) {
                const selectedOption = options[selectedIndex];
                handleOptionSelection(selectedOption.id);
            }
        }
        else if (viewMode === 'resources') {
            if (key.upArrow) {
                setResourceSelectedIndex(prev => prev > 0 ? prev - 1 : awsResources.length - 1);
            }
            else if (key.downArrow) {
                setResourceSelectedIndex(prev => prev < awsResources.length - 1 ? prev + 1 : 0);
            }
            else if (key.return) {
                const selectedResource = awsResources[resourceSelectedIndex];
                setResults(prev => [...prev, `Selected: ${selectedResource.name}`, selectedResource.details]);
            }
            else if (key.escape) {
                setViewMode('options');
                setAwsResources([]);
                setResults(prev => [...prev, 'Back to main options']);
            }
        }
    });
    return (React.createElement(Box, { flexDirection: "column", height: 20 },
        React.createElement(Box, { flexDirection: "column", borderStyle: "single", borderColor: "blue", padding: 1, height: 12 },
            React.createElement(Text, { color: "cyan", bold: true }, "Results Panel"),
            React.createElement(Text, null, "\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500"),
            results.map((result, index) => (React.createElement(Text, { key: index, color: index === 0 ? 'green' : 'white' }, result)))),
        React.createElement(Box, { flexDirection: "column", borderStyle: "single", borderColor: "green", padding: 1, marginTop: 1 }, viewMode === 'options' ? (React.createElement(React.Fragment, null,
            React.createElement(Text, { color: "yellow", bold: true }, "Available Commands"),
            React.createElement(Text, null, "\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500"),
            options.map((option, index) => (React.createElement(Box, { key: option.id, flexDirection: "row" },
                React.createElement(Text, { color: index === selectedIndex ? 'black' : 'white', backgroundColor: index === selectedIndex ? 'green' : undefined },
                    index === selectedIndex ? '► ' : '  ',
                    option.label),
                React.createElement(Box, { marginLeft: 2 },
                    React.createElement(Text, { color: "gray" },
                        "- ",
                        option.description))))),
            React.createElement(Box, { marginTop: 1 },
                React.createElement(Text, { color: "gray", dimColor: true }, isLoadingAws ? 'Loading...' : 'Use ↑↓ arrows to navigate, Enter to select')))) : (React.createElement(React.Fragment, null,
            React.createElement(Text, { color: "yellow", bold: true },
                "AWS Resources (",
                awsResources.length,
                " items)"),
            React.createElement(Text, null, "\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500"),
            awsResources.length === 0 ? (React.createElement(Text, { color: "gray" }, "No resources found")) : (awsResources.slice(0, 8).map((resource, index) => (React.createElement(Box, { key: index, flexDirection: "column" },
                React.createElement(Text, { color: index === resourceSelectedIndex ? 'black' : 'white', backgroundColor: index === resourceSelectedIndex ? 'green' : undefined },
                    index === resourceSelectedIndex ? '► ' : '  ',
                    resource.name),
                index === resourceSelectedIndex && (React.createElement(Box, { marginLeft: 2 },
                    React.createElement(Text, { color: "gray" }, resource.details))))))),
            React.createElement(Box, { marginTop: 1 },
                React.createElement(Text, { color: "gray", dimColor: true }, "Use \u2191\u2193 arrows to navigate, Enter to select, Esc to go back")))))));
};
render(React.createElement(App, null));
//# sourceMappingURL=cli.js.map