#!/usr/bin/env node
import React, { useState } from 'react';
import { render, Text, Box, useInput } from 'ink';
const options = [
    { id: 'lambda', label: 'Lambda', description: 'AWS Lambda Functions' },
    { id: 'cloudwatch-logs', label: 'CloudWatch Logs', description: 'View and search CloudWatch logs' },
    { id: 'cloudwatch-metrics', label: 'CloudWatch Metrics', description: 'Monitor CloudWatch metrics' }
];
const App = () => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [results, setResults] = useState(['🐾 Welcome to Claws Tool!', 'Select an option below to get started:']);
    useInput((input, key) => {
        if (key.upArrow) {
            setSelectedIndex(prev => prev > 0 ? prev - 1 : options.length - 1);
        }
        else if (key.downArrow) {
            setSelectedIndex(prev => prev < options.length - 1 ? prev + 1 : 0);
        }
        else if (key.return) {
            const selectedOption = options[selectedIndex];
            setResults(prev => [...prev, `Selected: ${selectedOption.label}`, `${selectedOption.description}`]);
        }
    });
    return (React.createElement(Box, { flexDirection: "column", height: 20 },
        React.createElement(Box, { flexDirection: "column", borderStyle: "single", borderColor: "blue", padding: 1, height: 12 },
            React.createElement(Text, { color: "cyan", bold: true }, "Results Panel"),
            React.createElement(Text, null, "\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500"),
            results.map((result, index) => (React.createElement(Text, { key: index, color: index === 0 ? 'green' : 'white' }, result)))),
        React.createElement(Box, { flexDirection: "column", borderStyle: "single", borderColor: "green", padding: 1, marginTop: 1 },
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
                React.createElement(Text, { color: "gray", dimColor: true }, "Use \u2191\u2193 arrows to navigate, Enter to select")))));
};
render(React.createElement(App, null));
//# sourceMappingURL=cli.js.map