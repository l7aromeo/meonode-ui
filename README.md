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
const BlueButton = Component((props) =>
  Button('Blue', {
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
);
```

### 3. Prop Handling

Automatic separation of CSS props from DOM attributes:

```tsx
const ProfileCard = Component(({ user }) =>
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
);
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

## Advanced Patterns

### Component Composition

```tsx
const Dashboard = Component(() => 
  Div({
    display: 'grid',
    gridTemplateColumns: '1fr 3fr',
    gap: '20px',
    children: [
      Sidebar({ width: '240px' }),
      MainContent({
        padding: '40px',
        children: AnalyticsChart({ dataset })
      })
    ]
  })
);
```

### Material UI Integration

```bash
yarn add @meonode/mui @mui/material
```

```tsx
import { Button, TextField } from '@meonode/mui';

const LoginForm = Component(() =>
  Div({
    maxWidth: '400px',
    margin: '0 auto',
    children: [
      TextField({ label: 'Email', fullWidth: true }),
      TextField({ label: 'Password', type: 'password' }),
      Button({
        variant: 'contained',
        children: 'Sign In'
      })
    ]
  })
);
```

## Comprehensive Example: Theme-Switching & Conditional Components
```tsx
'use client'
/**
 * This file showcases the integration of React hooks with @meonode/ui components
 * for building declarative user interfaces. It demonstrates different rendering
 * approaches, the use of Higher-Order Components (HOCs), and how theme context
 * is managed and propagated within the @meonode/ui component tree.
 */
import { Component, Column, Row, P, Node, Button, Theme, Center, NodeInstance, Absolute } from '@meonode/ui'
import { useState, useEffect, ReactElement, ReactNode } from 'react'
import { CssBaseline, FormControlLabel, TextField } from '@meonode/mui'
import { Switch as MUISwitch } from '@mui/material'
import { styled } from '@mui/material'

const MaterialUISwitch = styled(MUISwitch)(({ theme }) => ({
  width: 62,
  height: 34,
  padding: 7,
  '& .MuiSwitch-switchBase': {
    margin: 1,
    padding: 0,
    transform: 'translateX(6px)',
    '&.Mui-checked': {
      color: '#fff',
      transform: 'translateX(22px)',
      '& .MuiSwitch-thumb:before': {
        backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 20 20"><path fill="${encodeURIComponent(
          '#fff',
        )}" d="M4.2 2.5l-.7 1.8-1.8.7 1.8.7.7 1.8.6-1.8L6.7 5l-1.9-.7-.6-1.8zm15 8.3a6.7 6.7 0 11-6.6-6.6 5.8 5.8 0 006.6 6.6z"/></svg>')`,
      },
      '& + .MuiSwitch-track': {
        opacity: 1,
        backgroundColor: '#aab4be',
        ...theme.applyStyles('dark', {
          backgroundColor: '#8796A5',
        }),
      },
    },
  },
  '& .MuiSwitch-thumb': {
    backgroundColor: '#001e3c',
    width: 32,
    height: 32,
    '&::before': {
      content: "''",
      position: 'absolute',
      width: '100%',
      height: '100%',
      left: 0,
      top: 0,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
      backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 20 20"><path fill="${encodeURIComponent(
        '#fff',
      )}" d="M9.305 1.667V3.75h1.389V1.667h-1.39zm-4.707 1.95l-.982.982L5.09 6.072l.982-.982-1.473-1.473zm10.802 0L13.927 5.09l.982.982 1.473-1.473-.982-.982zM10 5.139a4.872 4.872 0 00-4.862 4.86A4.872 4.872 0 0010 14.862 4.872 4.872 0 0014.86 10 4.872 4.872 0 0010 5.139zm0 1.389A3.462 3.462 0 0113.471 10a3.462 3.462 0 01-3.473 3.472A3.462 3.462 0 016.527 10 3.462 3.462 0 0110 6.528zM1.665 9.305v1.39h2.083v-1.39H1.666zm14.583 0v1.39h2.084v-1.39h-2.084zM5.09 13.928L3.616 15.4l.982.982 1.473-1.473-.982-.982zm9.82 0l-.982.982 1.473 1.473.982-.982-1.473-1.473zM9.305 16.25v2.083h1.389V16.25h-1.39z"/></svg>')`,
    },
    ...theme.applyStyles('dark', {
      backgroundColor: '#003892',
    }),
  },
  '& .MuiSwitch-track': {
    opacity: 1,
    backgroundColor: '#aab4be',
    borderRadius: 20 / 2,
    ...theme.applyStyles('dark', {
      backgroundColor: '#8796A5',
    }),
  },
}))

/**
 * Defines the color palette for the light theme.
 * These color values are used by @meonode/ui components when they encounter
 * theme string references (e.g., 'theme.primary') and the current theme mode is 'light'.
 * In a larger application, this theme object would typically reside in a dedicated theme file.
 */
const lightTheme: Theme = {
  mode: 'light',
  colors: {
    primary: '#2563eb',
    secondary: '#64748b',
    accent: '#10b981',
    background: '#ffffff',
    foreground: '#0f172a',
    border: '#e2e8f0',
    muted: '#f8fafc',
    success: '#16a34a',
    warning: '#eab308',
    danger: '#dc2626',
  },
}

/**
 * Defines the color palette for the dark theme.
 * Similar to the light theme, these colors are used by @meonode/ui components
 * when resolving theme string references, but specifically when the current theme
 * mode is 'dark'.
 */
const darkTheme: Theme = {
  mode: 'dark',
  colors: {
    primary: '#3b82f6',
    secondary: '#94a3b8',
    accent: '#34d399',
    background: '#0f172a',
    foreground: '#f8fafc',
    border: '#334155',
    muted: '#1e293b',
    success: '#22c55e',
    warning: '#facc15',
    danger: '#ef4444',
  },
}

/**
 * The main page component, implemented as a functional component using React hooks.
 * It manages the theme mode state and the visibility of additional content.
 *
 * This function is wrapped by the `Component` HOC from `@meonode/ui`. The `Component`
 * HOC transforms the function into a standard React component that returns a `ReactNode`,
 * making it compatible with React's rendering lifecycle and enabling SSR/CSR.
 */
export default Component(() => {
  // State hook to control the visibility of additional content sections.
  const [showMore, setShowDetails] = useState(false)
  const [mode, setMode] = useState<'dark' | 'light'>('light')
  const theme = mode === 'dark' ? darkTheme : lightTheme

  /**
   * The root of the UI tree is a `Column` component from `@meonode/ui`.
   * This `Column` sets the theme context for its children.
   * Its children include:
   * - A theme toggle switch using MUI components wrapped in `@meonode/ui`'s `Node`.
   * - A button to toggle the visibility of the detail sections.
   * - Various examples demonstrating how to render components that return either
   *   `@meonode/ui` `Node` instances or `ReactNode`s, illustrating theme propagation
   *   both unconditionally and conditionally, highlighting theme propagation.
   */
  return Column({
    theme: theme.colors,
    padding: 20,
    gap: 15,
    minHeight: '100vh',
    backgroundColor: 'theme.background',
    color: 'theme.foreground',
    children: [
      CssBaseline, // Applies baseline Material UI styles for consistent rendering.
      // Theme toggle switch using MUI components wrapped with @meonode/ui's Node HOC.
      Center({
        children: FormControlLabel({
          control: Node(MaterialUISwitch).render() as ReactElement,
          alignItems: 'center',
          label: mode === 'dark' ? 'Dark Mode' : 'Light Mode',
          labelPlacement: 'start',
          checked: mode === 'dark',
          onChange: () => setMode(prev => (prev === 'dark' ? 'light' : 'dark')),
        }),
      }),
      // Button to show modal.
      Button('Show Modal', {
        onClick: () => Modal({ theme }), // Click handler to show modal immedietelly.
        cursor: 'pointer', // Visual cue for clickability.
        userSelect: 'none', // Prevents text selection on the button.
        padding: '10px 20px',
        backgroundColor: 'theme.primary', // Background color sourced from the theme context.
        borderRadius: 5,
        fontWeight: 'bold',
        color: 'white',
      }),
      // Button to toggle the visibility of the detail sections.
      Button(showMore ? 'Hide' : 'Show More', {
        onClick: () => setShowDetails(prev => !prev), // Click handler to toggle the 'showMore' state.
        cursor: 'pointer', // Visual cue for clickability.
        userSelect: 'none', // Prevents text selection on the button.
        padding: '10px 20px',
        backgroundColor: 'theme.accent', // Background color sourced from the theme context.
        borderRadius: 5,
        fontWeight: 'bold',
        color: 'white',
      }),

      /**
       * --- Unconditional Rendering Examples ---
       * These examples demonstrate rendering components that return either a
       * `@meonode/ui` `Node` instance (`DetailComponent`) or a `ReactNode`
       * (`ReturnRenderedDetailComponent`), and how the `Node` HOC affects this.
       * Observe how theme context is propagated (or not) in each case.
       */
      // 1. Rendering a component that returns a @meonode/ui Node instance directly.
      //    The internal Row component correctly receives theme context from the parent Column.
      DetailComponent({ info: 'Detail 1 (Node instance)' }),

      // 2. Rendering a component that returns a @meonode/ui Node instance, then calling .render().
      //    The internal Row component also correctly receives theme context.
      DetailComponent({ info: 'Detail 2 (Node instance + .render())' }).render(),

      // 3. Attempting to wrap a component returning a Node instance with Node HOC.
      //    ❌ Fails: The Node HOC expects the wrapped function to return a ReactNode, not a @meonode/ui Node instance.
      // Node(DetailComponent, { info: 'Detail 3 (Node HOC on Node instance)' }),

      // 4. Rendering a component that explicitly returns a ReactNode (.render() is called internally).
      //    The internal Row component correctly receives theme context from the parent Column.
      ReturnRenderedDetailComponent({ info: 'Detail 4 (ReactNode)' }),

      // 5. Wrapping a component returning ReactNode with Node HOC.
      //    Renders successfully. However, the Node HOC does NOT propagate theme context to the wrapped component's children.
      Node(ReturnRenderedDetailComponent, { info: 'Detail 5 (Node HOC on ReactNode)' }),

      // 6. Wrapping a component returning ReactNode with Node HOC, then calling .render().
      //    Renders successfully. Theme context is NOT propagated by the Node HOC.
      Node(ReturnRenderedDetailComponent, { info: 'Detail 6 (Node HOC on ReactNode + .render())' }).render(),

      /**
       * Conditional rendering examples (shown when 'showMore' is true):
       * These demonstrate various wrapping techniques (inline functions, Component HOC)
       * and their effect on rendering and theme propagation for both types of detail components.
       */
      // 7. Conditional rendering of a component returning a Node instance using an inline function wrapper.
      //    Renders successfully when `showMore` is true. The internal Row receives theme context.
      showMore && (() => DetailComponent({ info: 'Detail 7 (Conditional inline function + Node instance)' })),

      // 8. Conditional rendering of a component returning a Node instance using an inline function wrapper, then calling .render().
      //    Renders successfully when `showMore` is true. The internal Row receives theme context.
      showMore && (() => DetailComponent({ info: 'Detail 8 (Conditional inline function + Node instance + .render())' }).render()),

      // 9. Conditional rendering of a component returning a Node instance using the Component HOC wrapper.
      //    Renders successfully when `showMore` is true. The internal Row receives theme context.
      showMore && Component(() => DetailComponent({ info: 'Detail 9 (Conditional Component HOC + Node instance)' })),

      // 10. Conditional rendering of a component returning ReactNode using an inline function wrapper.
      //     Renders successfully when `showMore` is true. The internal Row receives theme context.
      showMore && (() => ReturnRenderedDetailComponent({ info: 'Detail 10 (Conditional inline function + ReactNode)' })),

      // 11. Conditional rendering of a component returning ReactNode using the Component HOC wrapper.
      //     Renders successfully when `showMore` is true. The internal Row receives theme context.
      showMore && Component(() => ReturnRenderedDetailComponent({ info: 'Detail 11 (Conditional Component HOC + ReactNode)' })),
      // showMore && ReturnRenderedDetailComponent({ info: 'Here are some details 15!' }), // ❌ Fails: Direct call to a component function using hooks (ReturnRenderedDetailComponent) inside render logic without a React-aware wrapper. This can violate Rules of Hooks.
    ],
  })
})

/**
 * A component that displays a styled detail section.
 * It uses `useEffect` for lifecycle logging. The internal `Row` component
 * sources its theme from the React context provided by an ancestor `@meonode/ui`
 * component (like the main `Column` in this page).
 *
 * This component returns a @meonode/ui `Row` Node instance.
 * This type of component is suitable for direct inclusion as a child within other
 * `@meonode/ui` components that expect `Node` instances or arrays of `Node` instances.
 * @param {object} props - Component properties.
 * @param {string} props.info - Text content to display in the detail section.
 * @returns {NodeInstance} A @meonode/ui Row Node instance.
 */
const DetailComponent = ({ info }: { info: string }): NodeInstance => {
  // useEffect hook for logging component mount and unmount phases (for debugging).
  useEffect(() => {
    console.log('DetailComponent mounted:', info) // Example mount log
    return () => {
      console.log('DetailComponent unmounted:', info) // Example unmount log
    }
  }, [info]) // Effect depends on 'info' prop.

  // Returns a @meonode/ui Row Node instance configured with props and children.
  // Its styling (e.g., backgroundColor) will resolve theme strings from React context.
  return Row({
    alignItems: 'center',
    gap: 10,
    padding: 4,
    border: '2px solid theme.accent',
    borderRadius: 6,
    backgroundColor: 'theme.warning', // Background color sourced from theme in React context.
    color: 'theme.danger',
    children: [P(info, { flex: 1, padding: '0 20px' }), TextField({ flex: 1, sx: { background: 'theme.primary' } })],
  })
}

/**
 * An alternative detail component implementation that explicitly calls `.render()`
 * to return a `ReactNode` (a rendered React element) directly.
 * This makes it compatible with standard React rendering patterns and wrappers
 * like the `Node` HOC that specifically expect a function returning `ReactNode`.
 * It uses `useEffect` for lifecycle logging. The internal `Row` sources its
 * theme from React context.
 *
 * This component returns a `ReactNode`.
 * @param {object} props - Component properties.
 * @param {string} props.info - Text content to display.
 * @returns {React.ReactNode} A rendered React element (the result of `Row(...).render()`).
 */
const ReturnRenderedDetailComponent = ({ info }: { info: string }): ReactNode => {
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
    alignItems: 'center',
    gap: 10,
    padding: 4,
    border: '2px solid theme.accent',
    borderRadius: 6,
    backgroundColor: 'theme.warning', // Theme-aware background; relies on theme from React context.
    color: 'theme.danger',
    children: [P(info, { flex: 1, padding: '0 20px' }), TextField({ flex: 1, sx: { background: 'theme.primary' } })],
  }).render() // Explicitly renders to ReactNode.
}

const Modal = ({ theme }: { theme: Theme }) => {
  const modal = Absolute({
    theme: theme.colors,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    onClick: e => {
      if (e.target === e.currentTarget) {
        modal?.unmount()
      }
    },
    children: Column({
      width: '50%',
      height: '50%',
      backgroundColor: 'theme.background',
      borderRadius: '8px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      transition: 'transform 0.2s ease-in-out',
      padding: 10,
      gap: 10,
      color: 'theme.foreground',
      children: [
        Center({ fontWeight: 'bold', children: 'Hello There' }),
        TextField({
          sx: {
            '& .MuiFormLabel-root': {
              color: 'theme.foreground',
              '&.Mui-focused': {
                color: 'theme.foreground',
              },
            },
            '& .MuiOutlinedInput-root': {
              color: 'theme.foreground',
              '& fieldset': {
                borderColor: 'theme.foreground',
              },
              '&:hover fieldset': {
                borderColor: 'theme.foreground',
              },
              '&.Mui-focused fieldset': {
                borderColor: 'theme.foreground',
              },
              borderRadius: 2,
            },
          },
          label: 'Hello',
          fullWidth: true,
        }),
      ],
    }),
  }).toPortal()
}
```

---

## API Reference

### Core Functions

| Function    | Parameters                              | Description                                  |
|-------------|-----------------------------------------|----------------------------------------------|
| `Node`      | `element: string | React.ComponentType`, `baseProps: object` | Creates a configurable UI node |
| `Component` | `(props: P) => Node | ReactNode`          | Converts node trees to React components      |

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
