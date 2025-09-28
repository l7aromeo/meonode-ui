# @meonode/ui

[![NPM version](https://img.shields.io/npm/v/@meonode/ui.svg?style=flat)](https://www.npmjs.com/package/@meonode/ui)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/@meonode/ui)](https://bundlephobia.com/package/@meonode/ui)

**Build React UIs with Type-Safe Fluency Without JSX Syntax**

A revolutionary approach to React component composition featuring function-based syntax, direct CSS-first prop styling, built-in theming system, and powerful portal capabilities.

## Quick Start

```bash
npm install @meonode/ui react
```

```typescript
import {
  Component,
  ThemeProvider,
  Div,
  Center,
  Column,
  H1,
  Button,
} from "@meonode/ui";

const theme = {
  mode: "light",
  system: {
    primary: { default: '#FF6B6B', content: '#4A0000' },
    base: { default: '#F8F8F8', content: '#333333' },
  }
};

const App = Component(() =>
  ThemeProvider({
    theme,
    children: Div({
      backgroundColor: "theme.base.default",
      children: Center({
        padding: 40,
        children: Column({
          gap: 24,
          textAlign: "center",
          children: [
            H1("Welcome to MeoNode", {
              fontSize: "3rem",
              color: "theme.primary.default",
            }),
            Button("Get Started", {
              backgroundColor: "theme.primary.default",
              color: "theme.primary.content",
              padding: "12px 24px",
              borderRadius: 8,
              cursor: "pointer",
              onClick: () => alert("Hello MeoNode!"),
            }),
          ],
        }),
      }),
    }),
  })
);
```

## Key Features

- **Function-based components** - No JSX required, pure TypeScript functions
- **Built-in Theming System** - Use `ThemeProvider` to propagate theme through your app.
- **Theme-aware styling** - Direct CSS props with automatic theme resolution
- **Advanced CSS support** - Pseudo-classes, media queries, animations via `css` prop
- **Portal system** - Context-aware modals and overlays
- **TypeScript first** - Full type safety with intelligent autocomplete
- **Performance optimized** - Powered by @emotion/react

## Documentation

📚 **[Complete Documentation & Examples](https://meonode-ui.vercel.app)**

🎮 **[Interactive Playground](https://codesandbox.io/p/github/l7aromeo/nextjs-meonode/main?import=true)**

## Core API

```typescript
// Create reusable components
const Card = Component<{ title: string }>(({ title }) =>
  Div({
    padding: '20px',
    borderRadius: '8px',
    backgroundColor: 'white',
    children: H2(title)
  })
);

// Advanced styling with css prop
const AnimatedBox = Div({
  padding: '20px',
  css: {
    '&:hover': { transform: 'scale(1.05)' },
    '@media (max-width: 768px)': { padding: '12px' }
  }
});

// Portal for modals/overlays
const Modal = Portal(({ portal, message }) =>
  Center({
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    onClick: portal.unmount,
    children: Div({
      backgroundColor: 'white',
      padding: '24px',
      borderRadius: '12px',
      children: [
        Text(message),
        Button('Close', { onClick: portal.unmount })
      ]
    })
  })
);
```

## Contributing

We welcome contributions! Please see our [contributing guidelines](https://github.com/l7aromeo/meonode-ui/blob/main/CONTRIBUTING.md).

## License

MIT © [Ukasyah Rahmatullah Zada](https://github.com/l7aromeo)

---

**[📖 Full Documentation](https://meonode-ui.vercel.app)** • **[🐛 Issues](https://github.com/l7aromeo/meonode-ui/issues)** • **[💬 Discussions](https://github.com/l7aromeo/meonode-ui/discussions)**
