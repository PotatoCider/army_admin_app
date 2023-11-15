## Requirements

1. [NPM](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)

## Installation
To install project dependencies:
```
npm install
```

## Building
To build the project:
```
npm run build
```

## Development / Hot Reloading
This simply rebuilds the project whenever a file changes.
```
npm run dev
```

## Implementation Details
Tailwind CSS is used for its builtin CSS classes.

This project inlines all JavaScript and CSS assets into one file using [inliner](https://github.com/remy/inliner). This allows it to be easily distributed and used as one HTML file.