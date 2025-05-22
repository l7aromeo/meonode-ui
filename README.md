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

```ts
'use client'
/**
 * This file demonstrates integration between React hooks and BaseNode components
 * using the @meonode/ui library for declarative UI construction.
 * It explores various rendering patterns, Higher-Order Component (HOC) usage,
 * and theme propagation with @meonode/ui components.
 */
import { Component, Column, Row, P, Node, Button } from '@meonode/ui'
import { useState, useEffect } from 'react'
import { CssBaseline, TextField } from '@meonode/mui'

/**
 * Global theme configuration.
 * Contains color palette definitions used by @meonode/ui components
 * when they resolve theme strings from context.
 * This can be extracted to a separate theme file for larger applications.
 */
const theme = {
  background: { primary: 'lightgreen', secondary: 'lightyellow' },
}

/**
 * The page's main logic is defined as a function (which may use React hooks).
 * This function is wrapped in the `Component` HOC from @meonode/ui.
 * The HOC standardizes it as a React component, ensuring it returns a ReactNode.
 * This makes the component compatible with React's rendering process,
 * supporting both client-side and server-side rendering.
 */
export default Component(() => {
  // State hook to control the visibility of additional content sections.
  const [showMore, setShowDetails] = useState(false) // 'showMore' controls visibility, 'setShowDetails' is the updater.

  /**
   * The main layout is structured as a Column.
   * It includes:
   * - A header row with a button to toggle the visibility of additional content.
   * - A series of examples demonstrating different ways to render detail components,
   *   both unconditionally and conditionally, highlighting theme propagation.
   */
  return Column({
    theme, // Provide the global theme to the Column and its descendants via React context.
    padding: 20,
    gap: 15,
    children: [
      CssBaseline, // Applies baseline MUI styles.
      // Interactive header section for toggling more content.
      Row({
        gap: 10,
        children: [
          Button(showMore ? 'Hide' : 'Show More', {
            onClick: () => setShowDetails(prev => !prev), // Click handler to toggle the 'showMore' state.
            cursor: 'pointer', // Visual cue for clickability.
            userSelect: 'none', // Prevents text selection on the button.
            padding: '10px 20px',
            backgroundColor: 'theme.background.primary', // Background color sourced from the theme context.
            borderRadius: 5,
            fontWeight: 'bold',
          }),
        ],
      }),

      /**
       * Unconditional rendering examples:
       * Demonstrates rendering DetailComponent (returns a @meonode/ui Node instance) and
       * ReturnRenderedDetailComponent (returns a ReactNode), and usage of the Node HOC.
       * Pay attention to how theme is (or isn't) propagated to these components.
       */
      DetailComponent({ info: 'Here are some details 1!' }), // Renders DetailComponent; its internal Row sources theme from parent Column's context.
      DetailComponent({ info: 'Here are some details 2!' }).render(), // Renders DetailComponent (invoking .render()); its internal Row sources theme from parent Column's context.
      // Node(DetailComponent, { info: 'Here are some details 3!' }), // ❌ Fails: Node HOC expects its first argument (a component function) to return ReactNode. DetailComponent returns a @meonode/ui Node instance.

      ReturnRenderedDetailComponent({ info: 'Here are some details 4!' }), // Renders ReturnRenderedDetailComponent; its internal Row inherits theme from parent Column's context.
      Node(ReturnRenderedDetailComponent, { info: 'Here are some details 5!' }), // Node HOC with a function returning ReactNode: Renders. Theme from Column is NOT propagated by Node HOC to the internal Row.
      Node(ReturnRenderedDetailComponent, { info: 'Here are some details 6!' }).render(), // Node HOC (then .render()): Renders. Theme from Column is NOT propagated by Node HOC to the internal Row.
      // Node(DetailComponent, { info: 'Here are some details 7!' }).render(), // ❌ Fails: Same reason as above; Node HOC expects a function returning ReactNode.

      /**
       * Conditional rendering examples (shown when 'showMore' is true):
       * These demonstrate various wrapping techniques (inline functions, Component HOC)
       * and their effect on rendering and theme propagation for both types of detail components.
       */
      showMore && (() => DetailComponent({ info: 'Here are some details 8!' })), // Method 1 (inline function wrapper): Renders DetailComponent; its internal Row sources theme from context.
      showMore && (() => DetailComponent({ info: 'Here are some details 9!' }).render()), // Method 2 (inline function wrapper + .render()): Renders DetailComponent; its internal Row sources theme from context.
      showMore && Component(() => DetailComponent({ info: 'Here are some details 10!' })), // Method 3 (Component HOC wrapper): Renders DetailComponent; its internal Row sources theme from context.

      showMore && (() => ReturnRenderedDetailComponent({ info: 'Here are some details 12!' })), // Method 4 (inline function wrapper): Renders ReturnRenderedDetailComponent; internal Row inherits theme from Column's context.
      showMore && Component(() => ReturnRenderedDetailComponent({ info: 'Here are some details 13!' })), // Method 5 (Component HOC wrapper): Renders ReturnRenderedDetailComponent; internal Row inherits theme from Column's context.
      showMore && Node(ReturnRenderedDetailComponent, { info: 'Here are some details 14!' }).render(), // Method 6 (Node HOC + .render()): Renders. Theme from Column is NOT propagated by Node HOC to internal Row.
      // showMore && ReturnRenderedDetailComponent({ info: 'Here are some details 15!' }), // ❌ Fails: Direct call to a component function using hooks (ReturnRenderedDetailComponent) inside render logic without a React-aware wrapper. This can violate Rules of Hooks.
    ],
  })
})

/**
 * A component that displays a styled detail section.
 * It uses `useEffect` for lifecycle logging. The internal `Row` component
 * sources its theme from the React context established by an ancestor
 * @meonode/ui component (e.g., the main Column in this page).
 * This component returns a @meonode/ui `Row` Node instance.
 *
 * @param {object} props - Component properties.
 * @param {string} props.info - Text content to display in the detail section.
 * @returns {import('@meonode/ui').Node} A @meonode/ui Row Node instance.
 */
const DetailComponent = ({ info }: { info: string }) => {
  // useEffect hook for logging component mount and unmount phases (for debugging).
  useEffect(() => {
    console.log('DetailComponent mounted:', info) // Example mount log
    return () => {
      console.log('DetailComponent unmounted:', info) // Example unmount log
    }
  }, [info]) // Effect depends on 'info' prop.

  // Returns a @meonode/ui Row component configured with props and children.
  // Its styling (e.g., backgroundColor) will resolve theme strings from React context.
  return Row({
    gap: 10,
    padding: 4,
    border: '1px solid green',
    borderRadius: 6,
    color: 'red',
    backgroundColor: 'theme.background.secondary', // Background color sourced from theme in React context.
    children: [P(info), TextField({ background: 'theme.background.primary' })],
  })
}

/**
 * An alternative detail component implementation that explicitly calls `.render()`
 * to return a `ReactNode` (a rendered React element) directly.
 * This makes it compatible with wrappers like the `Node` HOC that expect a function returning `ReactNode`.
 * It uses `useEffect` for lifecycle logging. The internal `Row` sources its
 * theme from React context.
 *
 * @param {object} props - Component properties.
 * @param {string} props.info - Text content to display.
 * @returns {React.ReactNode} A rendered React element (the result of `Row(...).render()`).
 */
const ReturnRenderedDetailComponent = ({ info }: { info: string }) => {
  // useEffect hook for logging component mount and unmount phases (for debugging).
  useEffect(() => {
    console.log('ReturnRenderedDetailComponent mounted:', info) // Example mount log
    return () => {
      console.log('ReturnRenderedDetailComponent unmounted:', info) // Example unmount log
    }
  }, [info]) // Effect depends on 'info' prop.

  // Constructs a @meonode/ui Row and immediately calls .render() on it.
  // The Row itself will attempt to resolve theme strings (e.g., 'theme.background.secondary')
  // from the React context provided by an ancestor @meonode/ui component (like the main Column).
  return Row({
    gap: 10,
    padding: 4,
    border: '1px solid green',
    borderRadius: 6,
    color: 'red',
    backgroundColor: 'theme.background.secondary', // Theme-aware background; relies on theme from React context.
    children: [P(info), TextField({ background: 'theme.background.primary' })],
  }).render() // Explicitly renders to ReactNode.
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
      Button({
        variant: 'contained',
        color: 'primary',
        children: 'Sign In'
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
