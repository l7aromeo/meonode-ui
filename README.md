# @meonode/ui

[![NPM version](https://img.shields.io/npm/v/@meonode/ui.svg?style=flat)](https://www.npmjs.com/package/@meonode/ui)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/@meonode/ui)](https://bundlephobia.com/package/@meonode/ui)

**Type-safe React components without JSX**

A production-ready component library that replaces JSX with function-based composition, featuring direct CSS prop
styling, context-based theming, automatic memoization, and full React Server Components support—powered by
@emotion/react.

## Core Concept

MeoNode UI eliminates JSX while maintaining full React compatibility through functional composition. Style components
with CSS properties as props, leverage automatic theme resolution via React Context, and benefit from intelligent
caching without manual optimization.

**JSX Pattern:**

```tsx
<div style={{ padding: '20px', borderRadius: '12px' }}>
  <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>{title}</h2>
  {children}
</div>
```

**MeoNode Pattern:**

```typescript
Div({
  padding: '20px',
  borderRadius: '12px',
  backgroundColor: 'theme.primary',
  children: [H2(title, { fontSize: '1.5rem', marginBottom: '8px' }), ...children],
})
```

## Features

### Function-Based Composition

Plain JavaScript functions replace JSX—no build transforms, no syntax extensions. Compose UIs as first-class function
trees with full TypeScript inference.

Nothing here requires a build step. An optional build-time plugin exists purely as an optimization—see
[Optional Build-Time Compiler](#optional-build-time-compiler).

### Direct CSS-in-Props

Pass CSS properties directly to components. No separate styled-components declarations, no className juggling. All valid
CSS properties work as props with full type safety.

```typescript
Button('Submit', {
  padding: '12px 24px',
  backgroundColor: 'theme.primary',
  borderRadius: 8,
  transition: 'all 0.2s ease',
  css: {
    ':hover': { transform: 'scale(1.05)' },
  },
})
```

### Advanced Portal System

Manage complex UI layers like modals, drawers, and overlays with a powerful stack-based portal system. Supports nested portals and state synchronization.

**Key Features:**
- **Global Layout Integration:** Define the provider and host at the root for app-wide access.
- **Auto-Sync:** Keep portal content in sync with parent state automatically.
- **Nested Portals:** Open portals from within other portals easily.
- **Stack-based management:** Automatically manages multiple overlapping layers.

```typescript
// 1. Setup at Layout Level
const RootLayout = ({ children }: { children: ReactNode }) => 
  PortalProvider({
    children: [
      ...children,
      PortalHost() // Portals render here, on top of content
    ]
  })

// 2. Define data interface and portal content
interface MyData {
  count: number;
  setCount: React.Dispatch<React.SetStateAction<number>>;
}

const MyPortalContent = ({ data, close }: PortalLayerProps<MyData>) => 
  Div({
    children: [
      Text(`Count: ${data?.count}`),
      Button('Increment', { onClick: () => data?.setCount(c => c + 1) }),
      Button('Close', { onClick: close })
    ]
  })

// 3. Use anywhere in the tree
const MyComponent = () => {
  const [count, setCount] = useState(0)
  // Auto-sync: portal updates whenever count changes
  const portal = usePortal<MyData>({ count, setCount })

  return Div({
    children: [
      Button('Open Modal', { 
        onClick: () => portal.open(MyPortalContent) 
      })
    ]
  })
}
```



### Context-Based Theming

Theme values resolve automatically through React Context. Reference semantic tokens anywhere without prop drilling.
Supports nested themes and dynamic switching.

```typescript
ThemeProvider({
  theme: {
    mode: 'dark',
    system: {
      primary: { default: '#FF6B6B', content: '#4A0000' },
      spacing: { sm: 8, md: 16, lg: 24 },
    },
  },
  children: [
    /* your app */
  ],
})
```

### Surgical Memoization

Memoize at node-level granularity—not just entire components. Control re-renders with precision by specifying dependency
arrays directly on individual nodes.

**Node-Level Memoization:**

```typescript
const UserCard = ({ user }) =>
  Div(
    {
      padding: 16,
      children: [
        H2(user.name), // Re-renders on any prop change
        Text(user.bio),
      ],
    },
    [user.id],
  ).render() // Only re-render when user.id changes
```

**Component-Level Memoization:**

```typescript
Node(ExpensiveComponent, { data }, [data.id]).render()
```

### React Server Components Compatible

Full RSC support with proper client/server component boundaries. Use in Next.js App Router, Remix, or any RSC-enabled
environment without configuration.

### Emotion-Powered Styling

Built on @emotion/react for:

- Automatic critical CSS extraction
- Vendor prefixing
- Dead code elimination
- Server-side rendering support

### Smart Prop Differentiation

Automatically separates style props from DOM attributes. Pass `onClick`, `aria-*`, `data-*` alongside CSS props—MeoNode
routes them correctly.

```typescript
Button('Click Me', {
  padding: '12px', // → style
  color: 'theme.primary', // → style
  onClick: handleClick, // → DOM attribute
  'aria-label': 'Submit', // → DOM attribute
  disabled: isLoading, // → DOM attribute
})
```

## Performance Benchmarks

MeoNode is built for high-performance applications, featuring an optimized caching system and iterative rendering
engine.

> **How to read these numbers.** They come from `bun run test:perf`, which runs in **jsdom on Node**, not a browser.
> They are microbenchmarks, and absolute timings move with hardware, Node version, and background load — run-to-run
> spread of 10–20% on the same machine is normal. Treat them as orders of magnitude and as regression guards, not as
> precise figures. Reproduced below on an **Apple M4 Pro / 24 GB / Node 26 / React 19.2**, taking the middle of three
> runs. The compiled-vs-uncompiled ratio further down is the steadiest figure here — it varied by 0.01 across those
> runs — because it is a ratio of two paths measured in the same process.

### Layout Rendering

| Metric                  | Value    | Description                                         |
|:------------------------|:---------|:----------------------------------------------------|
| **Single-Page Layout**  | ~5–6 ms  | Full SPA layout with header, hero, features, etc.   |
| **10,000 Flat Nodes**   | ~190 ms  | Rendering 10k nodes at the same level               |
| **10,000 Nested Nodes** | ~1350 ms | Deeply nested structure (single parent-child chain) |

### Memory Management

| Metric                     | Value        | Description                                      |
|:---------------------------|:-------------|:-------------------------------------------------|
| **Navigation Memory Leak** | **−5.7 MB**  | Memory is efficiently reclaimed after navigation |
| **Mount/Unmount Cycles**   | Stable       | No leaks detected over 200 cycles                |
| **State Updates**          | Efficient    | Handles heavy state changes without bloating     |

### Form Input Performance

| Metric                | Value        | Description                                     |
|:----------------------|:-------------|:------------------------------------------------|
| **Avg Response Time** | **~4–6 ms**  | 100 controlled inputs with simulated typing     |
| **Max Response Time** | ~6–11 ms     | Worst case; the noisiest metric in the suite    |
| **Optimization**      | `deps`       | Granular updates prevent unnecessary re-renders |

### React Comparison (10k Flat Nodes)

| Implementation                | Time (ms) | Initial Mem |
|:------------------------------|:----------|:------------|
| React.createElement           | ~52 ms    | ~165 MB     |
| **React.createElement+Props** | ~77 ms    | ~250 MB     |
| MeoNode                       | ~135 ms   | ~305 MB     |
| **MeoNode+Props**             | ~135 ms   | ~330 MB     |

> **Read the bold rows.** Bare `React.createElement` does no prop work at all, while MeoNode always classifies props
> into CSS vs DOM attributes and computes a stable key. The `+Props` rows are the like-for-like comparison — roughly
> **1.75x**, not the ~2.6x the top two rows suggest.
>
> Note also that adding props costs MeoNode nothing measurable (~135 ms either way, the two are indistinguishable
> across runs) while it costs `React.createElement` about 25 ms, because MeoNode is already paying for prop handling in
> the bare case.
>
> MeoNode trades raw construction speed for caching, memoization and theme resolution that microbenchmarks like this
> deliberately defeat by giving every node unique props. The optional compiler below moves most of that construction
> cost to build time.

## Optional Build-Time Compiler

[`@meonode/compiler`](https://github.com/l7aromeo/meonode-compiler) is an SWC plugin that moves prop classification,
stable-key hashing and `theme.*` token resolution out of every render and into your build.

```bash
npm install --save-dev @meonode/compiler
```

```ts
// next.config.ts — pass the package NAME, not a resolved path
export default { experimental: { swcPlugins: [['@meonode/compiler', {}]] } }
```

| Benchmark                                          | Result           |
|:---------------------------------------------------|:-----------------|
| Node construction + prop processing, in isolation  | **1.79x faster** |
| End-to-end SSR render, production build            | **~30% faster**  |

The 1.79x figure covers only prop classification and stable-key hashing — it excludes React, Emotion and theme
resolution, so it is not how much faster a page renders. The end-to-end figure is, measured on a 156-node tree under
`renderToPipeableStream`.

It is **purely an optimization**. Requires `@meonode/ui` 1.7.0 or later; on older versions the markers are ignored.
Every call site it cannot prove safe is left untouched, and your app behaves identically whether the plugin is
installed, misconfigured, or absent. Note that newer `@meonode/ui` releases make compiling worth *more*, not less —
1.7.1 and 1.7.2 each removed per-node work that only pre-partitioned, token-free props can skip, taking the end-to-end
gain from 15% to roughly 30%.

📚 **[Full compiler documentation](https://ui.meonode.com/docs/getting-started/compiler)**

## Quick Start

```typescript
import { ThemeProvider, Center, Column, H1, Button, Text } from '@meonode/ui'

const theme = {
  mode: 'light',
  system: {
    primary: { default: '#FF6B6B', content: '#FFFFFF' },
    base: { default: '#F8F8F8', content: '#333333' },
  },
}

const App = () =>
  ThemeProvider({
    theme,
    children: [
      Center({
        padding: 40,
        backgroundColor: 'theme.base',
        children: Column({
          gap: 24,
          children: [
            H1('MeoNode UI', {
              fontSize: '3rem',
              color: 'theme.primary',
            }),
            Text('Type-safe React without JSX', {
              fontSize: '1.2rem',
              color: 'theme.base.content',
            }),
            Button('Get Started', {
              backgroundColor: 'theme.primary',
              color: 'theme.primary.content',
              padding: '12px 24px',
              borderRadius: 8,
              cursor: 'pointer',
              onClick: () => console.log('Started!'),
            }),
          ],
        }),
      }),
    ],
  }).render()
```

## Architecture

**Component Factory System**
`Node` factory + `Component` wrapper + semantic elements (Div, Button, etc.) enable both rapid prototyping and
sophisticated component architectures.

**Theme Resolution Engine**
Context-based theme propagation with automatic value resolution. Nested theme objects inherit and override parent values
without explicit passing.

**CSS Engine**
@emotion/react provides CSS-in-JS with automatic optimization, critical CSS extraction for SSR, and zero-runtime
overhead in production builds.

## Why MeoNode UI?

**For Teams Building Design Systems:**

- Context-based theme propagation
- Semantic token system ensures visual consistency
- Component composition patterns scale naturally
- Full TypeScript support catches design token errors

**For Performance-Critical Applications:**

- Emotion's CSS optimization and caching
- Surgical memoization at node granularity
- SSR-ready with critical CSS extraction
- RSC compatibility for modern React architectures

**For Developer Productivity:**

- No JSX compilation overhead
- Direct CSS-in-props reduces context switching
- Intelligent prop routing (style vs DOM attributes)
- Full autocomplete for all CSS properties
- Composable function trees with first-class JavaScript

## Documentation

📚 **[Complete Documentation & Examples](https://ui.meonode.com)**

🎮 **[Interactive Playground](https://codesandbox.io/p/github/l7aromeo/nextjs-meonode/main?import=true)**

## Contributing

We welcome contributions! Please see
our [contributing guidelines](https://github.com/l7aromeo/meonode-ui/blob/main/CONTRIBUTING.md).

## License

MIT © [Ukasyah Rahmatullah Zada](https://github.com/l7aromeo)

---

**[📖 Full Documentation](https://ui.meonode.com)** • **[🐛 Issues](https://github.com/l7aromeo/meonode-ui/issues)** • *
*[💬 Discussions](https://github.com/l7aromeo/meonode-ui/discussions)**
