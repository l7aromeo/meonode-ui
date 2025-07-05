# @meonode/ui

[![NPM version](https://img.shields.io/npm/v/@meonode/ui.svg?style=flat)](https://www.npmjs.com/package/@meonode/ui)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/@meonode/ui)](https://bundlephobia.com/package/@meonode/ui)

**Build React UIs with Type-Safe Fluency**
A structured approach to component composition with built-in theming, prop separation, and dynamic children handling.

```tsx
// Quick Start Example
import { Component, Div, H1, Button } from '@meonode/ui';

// Create a reusable styled component
const BlueButton = Component(({ children, ...props }) =>
  Button(children, {
    padding: '12px 24px',
    borderRadius: '8px',
    backgroundColor: 'dodgerblue',
    color: 'white',
    ...props // Merge with incoming props
  })
);

// Compose your app
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

- 🎯 **Type-Safe Design** - Full TypeScript support with autocomplete for styles, props, and theme paths
- 🎨 **Theme-Aware Styles** - Write styles directly in props with dynamic theme resolution
- 🧩 **Component-First Architecture** - Compose UIs from structured nodes instead of JSX
- 🌐 **Contextual Theming** - Theme values propagate automatically through nested components
- ⚡ **Optimized Bundle** - Efficient core with tree-shaking support
- 🔄 **Seamless React Integration** - Works with hooks, HOCs, and React 18+ features

## Installation

```bash
# Using npm
npm install @meonode/ui react

# Using yarn
yarn add @meonode/ui react

# Using pnpm
pnpm add @meonode/ui react
```

---

## Core Concepts

### 1. Component Creation

Create elements using either the `Node` factory or pre-built components:

```tsx
import { Node, Div, H1 } from '@meonode/ui';

// Method 1: Node factory for custom elements
const Card = Node('div', {
  padding: '20px',
  borderRadius: '8px',
  boxShadow: '0 2px 12px rgba(0,0,0,0.1)'
});

// Method 2: Pre-built semantic components
const Header = () =>
  Div({
    padding: '20px',
    backgroundColor: 'navy',
    children: H1('App Header', { color: 'white' })
  });
```

### 2. Theming System

Define themes and access values using dot-notation:

```tsx
// theme.ts
export const theme = {
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

// ThemedComponent.tsx
import { Component, Div, H1, P } from '@meonode/ui';
import { theme } from './theme';

const ThemedCard = Component(() =>
  Div({
    theme, // Provide theme context
    padding: 'theme.spacing.lg',
    backgroundColor: 'theme.colors.primary',
    children: [
      H1('Themed Title', { color: 'theme.colors.text.primary' }),
      P('Content...', { color: 'theme.colors.text.secondary' })
    ]
  })
)
```

### 3. Prop Handling

Automatic separation of CSS props from DOM attributes:

```tsx
type User = {
  name: string
}

const ProfileCard = Component<{ user: User }>(({ user }) =>
  Div({
    // CSS Props
    padding: '20px',
    borderRadius: '8px',

    // DOM Props
    'aria-role': 'article',
    tabIndex: 0,

    // Children
    children: `Welcome ${user.name}!`
  })
)
```

---

## Key Features

| Feature              | Description                                                                 |
|----------------------|-----------------------------------------------------------------------------|
| **Smart Prop Merge** | CSS props merge with style objects; DOM props pass to underlying elements  |
| **Theme Resolution** | `theme.` references resolve through component hierarchy                     |
| **Type Guards**      | Autocomplete for CSS properties and theme paths with strict type checks     |
| **HOC Support**      | Wrap existing components with `Component()` for theme integration           |
| **Dynamic Children** | Supports function-as-child pattern with automatic theme propagation         |

---

## Passing Context Wrapper To Portal
```ts
import { Provider, useSelector } from 'react-redux'
import store from '/path/to/redux/store'

/**
 * ReduxProvider
 *
 * A wrapper component that integrates the Redux store with a React application.
 * It utilizes the `Provider` component from `react-redux` to make the Redux store
 * available to the entire component tree.
 *
 * @constant
 * @type {NodeElement}
 * @param {Object} store - The Redux store instance to be passed down to the application.
 */
const ReduxProvider = Node(Provider, { store })

/**
 * Represents a modal component that is implemented using a portal
 * and wrapped with a Redux provider. This component retrieves state
 * from the Redux store and responds to state changes.
 *
 * The `Modal` leverages the Redux `useSelector` hook to access specific
 * Redux state values and ensure dynamic behavior within the modal based
 * on the application's state.
 *
 * Dependencies:
 * - ReduxProvider: Ensures the modal has access to the Redux store.
 * - Portal: Renders the modal outside of its parent hierarchy and provides
 *   control methods such as `unmount` for cleaning up the modal.
 * - useSelector: Accesses specific data from the Redux state.
 *
 * Side Effects:
 * - The component logs the specific Redux state changes to the console
 *   when the state is updated.
 * - The modal listens for specific user interactions (e.g., clicking outside
 *   the modal area) and programmatically unmounts itself using `portal.unmount()`.
 *
 * Props:
 * - portal: Includes a method `unmount` to remove the modal from the DOM.
 */
const Modal = Portal(ReduxProvider, ({ portal }) => {
  const someReduxState = useSelector(state => state.someReduxState)

  useEffect(() => {
    console.log('Redux State value: ', someReduxState)
  }, [])

  return Div({
    padding: 10,
    backgroundColor: 'white',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    children: [
      P('Content...', { color: 'theme.colors.text.secondary' }),
      Button({ children: 'Close', onClick: () => portal.unmount() })
    ]
  })
})
```

---

## Repo Example Usage

This section provides a practical example of how to integrate `@meonode/ui` within a Next.js application. The linked repository showcases proper theme handling, especially when utilizing Redux with a preloaded state, and demonstrates its usage within a Server Component (RootLayout) environment. Crucially, it also illustrates how to effectively manage **conditional components that contain React hooks**, providing a robust pattern for dynamic UI rendering. This example is particularly useful for understanding how to set up a robust UI system with `@meonode/ui` in a complex React ecosystem like Next.js.

[Example Usage Of React Meonode in NextJS](https://github.com/l7aromeo/react-meonode)

---

## API Reference

### Core Functions

| Function    | Parameters                                                                                                                                  | Description                                                                                                                                                                                                      |
|-------------|---------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `Node`      | `element: NodeElement \| React.ComponentType`, `baseProps: object`                                                                          | Constructs a configurable UI node that supports flexible properties and dynamic styling.                                                                                                                         |
| `Component` | `(props: P) => ComponentNode`                                                                                                               | Transforms node trees into reusable React components with built-in type safety and seamless integration.                                                                                                         |
| `Portal`    | • `(component: (props: P) => ComponentNode)` or <br/> • `(provider: NodeElement, component: (props: P) => ComponentNode)` | Creates a React Portal component. Accepts either a component function directly, or a provider (e.g. Redux Provider) and the component. The component receives portal controls for mounting/unmounting. |

---

## Contributing

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. **Clone** your fork: `git clone https://github.com/your-username/meonode-ui.git`
3. **Install dependencies**: `yarn install` (or npm/pnpm)
4. **Create a feature branch**: `git checkout -b feature/amazing-feature`
5. **Commit changes** with descriptive messages
6. **Push** to your branch: `git push origin feature/amazing-feature`
7. **Open a Pull Request**

For major changes, please open an issue first to discuss your proposal.

---

**MIT Licensed** | Copyright © 2024 Ukasyah Rahmatullah Zada
*Empowering developers to build better UIs*
