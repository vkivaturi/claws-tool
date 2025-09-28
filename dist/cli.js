#!/usr/bin/env node
import React from 'react';
import { render, Text } from 'ink';
const App = () => {
    return (React.createElement(React.Fragment, null,
        React.createElement(Text, { color: "green" }, "\uD83D\uDC3E Welcome to Claws Tool!"),
        React.createElement(Text, null, "Hello World! This is your CLI interface powered by React and Ink."),
        React.createElement(Text, { color: "gray" }, "More features coming soon...")));
};
render(React.createElement(App, null));
//# sourceMappingURL=cli.js.map