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
 * This file showcases the integration of React hooks with `@meonode/ui` components
 * for building declarative user interfaces. It demonstrates different rendering
 * approaches, the use of Higher-Order Components (HOCs), and how theme context
 * is managed and propagated within the @meonode/ui component tree.
 */
import { Button, Center, Column, Component, Fixed, Node, type NodeInstance, P, Portal, Row, type Theme } from '@meonode/ui'
import { useState, useEffect, ReactElement, ReactNode } from 'react'
import { CssBaseline, FormControlLabel, TextField } from '@meonode/mui'
import { Switch as MUISwitch } from '@mui/material'
import { styled } from '@mui/material'

// Styled Material UI Switch component for theme toggling
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
 * Light theme configuration containing color palette values.
 * Used by `@meonode/ui` components when resolving theme references in light mode.
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
 * Dark theme configuration containing color palette values.
 * Used by `@meonode/ui` components when resolving theme references in dark mode.
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
 * Main page component using React hooks for state management.
 * Manages theme mode and visibility of additional content sections.
 * Wrapped by `Component` HOC to ensure React compatibility and SSR/CSR support.
 */
export default Component(() => {
  const [showMore, setShowDetails] = useState(false)
  const [mode, setMode] = useState<'dark' | 'light'>('light')
  const theme = mode === 'dark' ? darkTheme : lightTheme

  return Column({
    theme: theme.colors,
    padding: 20,
    gap: 15,
    minHeight: '100vh',
    backgroundColor: 'theme.background',
    color: 'theme.foreground',
    children: [
      CssBaseline,
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
      Button('Show Modal', {
        onClick: () => Modal({ theme: theme.colors }),
        cursor: 'pointer',
        userSelect: 'none',
        padding: '10px 20px',
        backgroundColor: 'theme.primary',
        borderRadius: 5,
        fontWeight: 'bold',
        color: 'white',
      }),
      Button(showMore ? 'Hide Details' : 'Show More Details', {
        onClick: () => setShowDetails(prev => !prev),
        cursor: 'pointer',
        userSelect: 'none',
        padding: '10px 20px',
        backgroundColor: 'theme.accent',
        borderRadius: 5,
        fontWeight: 'bold',
        color: 'white',
      }),

      /**
       * Component rendering examples demonstrating theme context propagation:
       * - Direct Node instance rendering
       * - Rendered Node instances
       * - ReactNode components
       * - HOC usage patterns
       */
      DetailComponent({
        info: 'Detail 1: Rendering a component that returns a @meonode/ui Node instance directly. The internal Row component correctly receives theme context from the parent Column.',
      }),

      DetailComponent({
        info: 'Detail 2: Rendering a component that returns a @meonode/ui Node instance, then calling .render(). The internal Row component also correctly receives theme context.',
      }).render(),

      // ❌ Fails: The Node HOC expects the wrapped function to return a ReactNode, not a @meonode/ui Node instance.
      // Node(DetailComponent, { info: 'Detail 3: Attempting to wrap a component returning a Node instance with Node HOC.' }),

      ReturnRenderedDetailComponent({
        info: 'Detail 4: Rendering a component that explicitly returns a ReactNode (.render() is called internally). The internal Row component correctly receives theme context from the parent Column.',
      }),

      Node(ReturnRenderedDetailComponent, {
        info: "Detail 5: Wrapping a component returning ReactNode with Node HOC (without .render()). Renders successfully. However, the Node HOC does NOT propagate theme context to the wrapped component's children.",
      }),

      Node(ReturnRenderedDetailComponent, {
        info: 'Detail 6: Wrapping a component returning ReactNode with Node HOC, then calling .render(). Renders successfully. Theme context is NOT propagated by the Node HOC.',
      }).render(),

      WrappedDetailComponent({
        info: 'Detail 7: Using Component HOC with Node instance returns. Theme context is correctly propagated.',
      }),

      /**
       * Conditional rendering examples (visible when showMore is true)
       * Demonstrates:
       * - Inline function wrappers
       * - Component HOC usage
       * - Theme context propagation patterns
       */
      showMore &&
      (() =>
        DetailComponent({
          info: 'Detail 8: Conditional rendering of a Node instance component using inline function wrapper. Theme context is correctly received.',
        })),

      showMore &&
      (() =>
        DetailComponent({
          info: 'Detail 9: Conditional rendering of a Node instance component with .render() call. Theme context is correctly propagated.',
        }).render()),

      showMore &&
      WrappedDetailComponent({
        info: 'Detail 10: Conditional rendering using Component HOC with Node instance. Theme context is correctly propagated.',
      }),

      showMore &&
      (() =>
        ReturnRenderedDetailComponent({
          info: 'Detail 11: Conditional rendering of ReactNode component using inline function. Theme context is properly propagated.',
        })),

      showMore &&
      Component(() =>
        ReturnRenderedDetailComponent({
          info: 'Detail 12: Conditional rendering with Component HOC wrapping ReactNode component. Note that theme context is not propagated in this case.',
        }),
      ),

      // showMore && ReturnRenderedDetailComponent({
      //   info: 'Detail 15: Direct component call violates Rules of Hooks!'
      // }), // ❌ Fails: Direct call to a component function using hooks inside render logic without a React-aware wrapper.
    ],
  })
})

/**
 * Styled detail section component returning a Node instance.
 * Uses useEffect for lifecycle logging.
 * Theme context is received from parent @meonode/ui components.
 */
const DetailComponent = ({ info }: { info: string }): NodeInstance => {
  useEffect(() => {
    console.log('DetailComponent mounted:', info)
    return () => {
      console.log('DetailComponent unmounted:', info)
    }
  }, [info])

  return Row({
    alignItems: 'center',
    gap: 10,
    padding: 4,
    border: '2px solid theme.accent',
    borderRadius: 6,
    backgroundColor: 'theme.warning',
    color: 'theme.danger',
    children: [P(info, { flex: 1, padding: '0 20px' }), TextField({ flex: 1, sx: { background: 'theme.primary' } })],
  })
}

/**
 * Styled detail section component wrapped with Component HOC.
 * Similar to DetailComponent but demonstrates HOC pattern.
 * Theme context is correctly propagated through the HOC.
 */
const WrappedDetailComponent = Component(({ info }): NodeInstance => {
  useEffect(() => {
    console.log('DetailComponent mounted')
    return () => {
      console.log('DetailComponent unmounted')
    }
  }, [info])

  return Row({
    alignItems: 'center',
    gap: 10,
    padding: 4,
    border: '2px solid theme.accent',
    borderRadius: 6,
    backgroundColor: 'theme.warning',
    color: 'theme.danger',
    children: [P(info, { flex: 1, padding: '0 20px' }), TextField({ flex: 1, sx: { background: 'theme.primary' } })],
  })
})

/**
 * Alternative detail component implementation returning ReactNode.
 * Explicitly calls .render() for React compatibility.
 * Demonstrates theme context usage with standard React patterns.
 */
const ReturnRenderedDetailComponent = ({ info }: { info: string }): ReactNode => {
  useEffect(() => {
    console.log('ReturnRenderedDetailComponent mounted')
    return () => {
      console.log('ReturnRenderedDetailComponent unmounted')
    }
  }, [info])

  return Row({
    alignItems: 'center',
    gap: 10,
    padding: 4,
    border: '2px solid theme.accent',
    borderRadius: 6,
    backgroundColor: 'theme.warning',
    color: 'theme.danger',
    children: [P(info, { flex: 1, padding: '0 20px' }), TextField({ flex: 1, sx: { background: 'theme.primary' } })],
  }).render()
}

/**
 * Modal component using Portal HOC for DOM placement.
 * Demonstrates theme-aware content rendering outside main hierarchy.
 * Includes nested modal support and Material UI integration.
 */
const Modal = Portal(({ theme, portal }) => {
  useEffect(() => {
    console.log('Modal mounted')
    return () => {
      console.log('Modal unmounted')
    }
  }, [])

  return Fixed({
    theme,
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
        portal.unmount()
      }
    },
    children: [
      Column({
        width: '50%',
        height: '80%',
        backgroundColor: 'theme.background',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        padding: 10,
        gap: 10,
        color: 'theme.foreground',
        children: [
          Button('More Modal', {
            onClick: () => Modal({ theme }),
            cursor: 'pointer',
            userSelect: 'none',
            padding: '10px 20px',
            backgroundColor: 'theme.primary',
            borderRadius: 5,
            fontWeight: 'bold',
            color: 'white',
          }),
          Center({ fontWeight: 'bold', children: 'Modal' }),
          Center({ children: Math.random() * 1000 }),
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
    ],
  })
})
```

---

## API Reference

### Core Functions

| Function    | Parameters                                                         | Description                                                                                              |
|-------------|--------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------|
| `Node`      | `element: NodeElement \| React.ComponentType`, `baseProps: object` | Constructs a configurable UI node that supports flexible properties and dynamic styling.                 |
| `Component` | `(props: P) => ComponentNode`                                      | Transforms node trees into reusable React components with built-in type safety and seamless integration. |
| `Portal`    | `(props: P) => ComponentNode`                                      | Converts node trees to React components and renders them in a React Portal with advanced DOM placement.  |
|

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
