# @meonode/ui

[![NPM version](https://img.shields.io/npm/v/@meonode/ui.svg?style=flat)](https://www.npmjs.com/package/@meonode/ui)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Build React UIs with Type-Safe Fluency**  
A structured approach to component composition with built-in theming, prop separation, and dynamic children handling.

```ts
// Quick Start Example
import { Component, Div, H1, Button } from '@meonode/ui';

const BlueButton = Component((props) =>
  Button('Blue', {
    padding: '12px 24px',
    borderRadius: '8px',
    backgroundColor: 'dodgerblue',
    color: 'white',
    ...props
  })
);

const App = Component(() =>
  Div({
    padding: '40px',
    children: [
      H1('Welcome to Meonode', { fontSize: '2rem' }),
      BlueButton({
        onClick: () => alert('Hello World!'),
        children: 'Get Started'
      })
    ]
  })
);
```

## Why @meonode/ui?

- 🎯 **Type-Safe Design** - Full TypeScript support with autocomplete for styles and themes
- 🎨 **CSS-in-JS Without Runtime** - Write styles directly in props with theme references
- 🧩 **Component-First Architecture** - Compose UIs from structured nodes instead of JSX
- 🌐 **Theme Propagation** - Contextual theming that works with any component structure
- ⚡ **Zero Dependencies** - Lightweight core (under 15kb gzipped)

## Installation

```shell
npm install @meonode/ui react
# or
yarn add @meonode/ui react
```

## Core Concepts

### 1. Component Creation

Create elements using the `Node` factory or pre-built components:

```ts
import { Node, Div, H1 } from '@meonode/ui';

// Using Node factory
const Card = Node('div', {
  padding: '20px',
  borderRadius: '8px',
  boxShadow: '0 2px 12px rgba(0,0,0,0.1)'
});

// Using pre-built components
const Header = () =>
  Div({
    padding: '20px',
    backgroundColor: 'navy',
    children: H1('App Header', { color: 'white' })
  });
```

### 2. Theming System

Define and consume themes with dot-notation:

```ts
const theme = {
  colors: {
    primary: '#2196F3',
    text: {
      primary: '#1A237E',
      secondary: '#455A64'
    }
  },
  spacing: {
    md: '16px',
    lg: '24px'
  }
};

const ThemedCard = Component(() =>
  Div({
    theme,
    padding: 'theme.spacing.lg',
    backgroundColor: 'theme.colors.primary',
    children: [
      H1('Themed Title', { color: 'theme.colors.text.primary' }),
      P('Content...', { color: 'theme.colors.text.secondary' }) 
    ]
  })
);
```

### 3. Prop Handling

Automatic separation of CSS props from DOM attributes:

```ts
const ProfileCard = Component(({ user }) =>
  Div({
    // CSS Props
    padding: '20px',
    borderRadius: '8px',
    // DOM Props
    ariaRole: 'article',
    tabIndex: 0,
    // Children
    children: `Welcome ${user.name}!`
  })
);
```


## Key Features

| Feature              | Description                                                          |
|----------------------|----------------------------------------------------------------------|
| **Smart Prop Merge** | CSS properties are automatically merged with style object            |
| **Theme Resolution** | `theme.` references resolve through component hierarchy              |
| **Type Safety**      | Autocomplete for CSS properties and theme paths                      |
| **HOC Support**      | Wrap existing components with `Component()` for seamless integration |
| **Dynamic Children** | Function-as-child pattern with automatic theme propagation           |

## Advanced Usage

### Component Composition

```ts
const Dashboard = Component(() => 
  Div({
    display: 'grid',
    gridTemplateColumns: '1fr 3fr',
    gap: '20px',
    children: [
      Sidebar({
        width: '240px',
        items: navItems
      }),
      MainContent({
        padding: '40px',
        children: AnalyticsChart({ dataset })
      })
    ]
  })
);
```

### With Conditional Children That Contains Hook

also add this

```ts
// Wraps a hook-capable component into a BaseNode-compatible Client Component
'use client'
/**
 * This file demonstrates integration between React hooks and BaseNode components
 * using the @meonode/ui library for declarative UI construction
 */
import { Component, Column, Row, Div, P, Node } from '@meonode/ui'
import { useState, useEffect } from 'react'

/**
 * Global theme configuration
 * Contains color palette definitions used throughout components
 * Can be extracted to separate theme file if needed
 */
const theme = {
  background: { primary: 'lightgreen', secondary: 'lightyellow' },
}

/**
 * Main page component wrapped in Component HOC to enable client-side features
 * Demonstrates conditional rendering and component composition patterns
 */
export default Component(() => {
  // Controls visibility of detail sections
  const [showDetails, setShowDetails] = useState(false)

  /**
   * Main layout structured as a Column with:
   * - Header row containing toggle button
   * - Conditional detail sections using different rendering approaches
   */
  return Column({
    theme,
    padding: 20,
    gap: 15,
    children: [
      // Interactive header section
      Row({
        gap: 10,
        children: [
          Div({
            onClick: () => setShowDetails(prev => !prev), // Toggle detail visibility
            cursor: 'pointer',
            userSelect: 'none', // Prevent text selection
            padding: '10px 20px',
            backgroundColor: 'theme.background.primary', // Themed background
            borderRadius: 5,
            fontWeight: 'bold',
            children: showDetails ? 'Hide Details' : 'Show Details',
          }),
        ],
      }),

      /**
       * Multiple approaches to conditional detail rendering:
       * 1. Direct function wrapping
       * 2. Component HOC wrapping
       * 3. Node with ReturnRenderedDetailComponent
       * 4. Non-working example with raw Node usage
       */
      showDetails && (() => DetailComponent({ info: 'Here are some details 1!' })), // Method 1
      showDetails && Component(() => DetailComponent({ info: 'Here are some details 2!' })), // Method 2
      showDetails && Node(ReturnRenderedDetailComponent, { info: 'Here are some details 2!' }).render(), // Method 3

      // Fails because DetailComponent returns Node instance instead of ReactNode
      showDetails && Node(DetailComponent, { info: 'Here are some details 2!' }).render(), // ❌ Invalid
    ],
  })
})

/**
 * Displays a styled detail section with lifecycle logging
 * @param {Object} props - Component properties
 * @param {string} props.info - Text content to display
 * @returns {Node} Rendered Div Node instance
 */
const DetailComponent = ({ info }: { info: string }) => {
  // Log component lifecycle for debugging
  useEffect(() => {
    console.log('DetailComponent mounted')
    return () => {
      console.log('DetailComponent unmounted')
    }
  }, [])

  // Themed container with text content
  return Div({
    padding: 15,
    border: '1px solid green',
    borderRadius: 6,
    color: 'red',
    backgroundColor: 'theme.background.secondary', // Theme-aware background
    children: P(info),
  })
}

/**
 * Alternative implementation that explicitly returns rendered content
 * Functionally identical to DetailComponent but compatible with Node wrapper
 * @param {Object} props - Component properties
 * @param {string} props.info - Text content to display
 * @returns {ReactNode} Rendered React element
 */
const ReturnRenderedDetailComponent = ({ info }: { info: string }) => {
  // Log component lifecycle for debugging
  useEffect(() => {
    console.log('DetailComponent mounted')
    return () => {
      console.log('DetailComponent unmounted')
    }
  }, [])

  // Themed container with text content
  return Div({
    padding: 15,
    border: '1px solid green',
    borderRadius: 6,
    color: 'red',
    backgroundColor: 'theme.background.secondary', // Theme-aware background
    children: P(info),
  }).render()
}

```

### Material UI Integration

```shell
yarn add @meonode/mui @mui/material
```

```ts
import { Button, TextField } from '@meonode/mui';

const MuiLoginForm = Component(() =>
  Div({
    maxWidth: '400px',
    margin: '0 auto',
    children: [
      TextField({
        label: 'Email',
        fullWidth: true,
        margin: 'normal'
      }),
      TextField({
        label: 'Password',
        type: 'password',
        fullWidth: true,
        margin: 'normal'
      }),
      Button('Sign In', {
        variant: 'contained',
        color: 'primary'
      })
    ]
  })
);
```

## API Reference

### Core Functions

| Function       | Parameters                              | Description                                     |
|----------------|-----------------------------------------|-------------------------------------------------|
| `Node`         | `element: string \| Component`, `props` | Creates a new UI node                           |
| `Component`    | `(props) => Node \| ReactNode`          | Converts node trees to React components         |


## Contributing

We welcome contributions! Please follow these steps:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

Contact me on [Discord](https://discordapp.com/users/704803255561224264) for discussions.

---

**MIT Licensed** | Copyright © 2024 Ukasyah Rahmatullah Zada  
*Empowering developers to build better UIs*
