# @meonode/ui

[![NPM version](https://img.shields.io/npm/v/@meonode/ui.svg?style=flat)](https://www.npmjs.com/package/@meonode/ui)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
<!-- Add other badges as needed: build status, coverage, etc. -->

`@meonode/ui` is a lightweight yet powerful utility for the programmatic creation and manipulation of React elements. It
offers an enhanced, structured way to define components, manage props (separating CSS from DOM attributes), handle
theming, and compose children *before* they are rendered by React. This provides greater control and flexibility,
especially for dynamic UIs and design systems.

---

## Key Features

* **Programmatic React Element Construction:** Create complex React element trees using a fluent and intuitive API.
* **Advanced Prop Handling:** Automatically separates CSS style properties from other DOM attributes, simplifying
  component logic.
* **Integrated Theming System:** Pass theme objects down the tree and reference theme values (e.g.,
  `theme.colors.primary`) directly in style properties.
* **Flexible Children Management:** Supports various child types, including primitives, other `@meonode/ui` nodes,
  standard React elements, and functions for dynamic rendering (function-as-child pattern).
* **Type-Safe:** Written entirely in TypeScript, providing excellent autocompletion and compile-time safety.
* **Seamless Integration:** Works with existing React components and fits naturally into any React workflow.
* **`Component` HOC:** A higher-order component to easily wrap functions that return `@meonode/ui` instances, making
  them standard React components.

## Installation

First, ensure you have `react` installed as a dependency.

```shell
yarn add react @meonode/ui
```

To use the built-in integration with Material UI, install the following:

```shell
yarn add react @mui/material @meonode/ui @meonode/mui
```

---

## Core Concepts

### `Node(element, props)`

The primary factory function to create `@meonode/ui` instances (internally `BaseNode`).

*   `element`: The React element type (e.g., `'div'`, `MyReactComponent`, another `Node` instance).
*   `props`: An object containing properties for the element, including standard HTML attributes, event handlers, `children`, `theme`, and direct CSS style properties.

### `BaseNode`

The internal representation of a React element within `@meonode/ui`. It holds the element type, processed props (with styles and DOM attributes separated), and processed children. You typically don't interact with `BaseNode` directly but through the `Node` factory. Each `BaseNode` instance has a `render()` method to convert it into a renderable React element.

### `Component(componentFunction)`

A Higher-Order Component (HOC) that wraps a function. This function receives props and should return either a `@meonode/ui` instance (created via `Node()`) or a standard `ReactNode`. The `Component` HOC ensures that if a `@meonode/ui` instance is returned, its `render()` method is called, making it renderable by React.

### Theming

Pass a `theme` object via the `theme` prop to any `Node`. This theme becomes available to that `Node` and its descendants. Style properties can then reference theme values using a dot-path string:

---

## Usage Examples

### 1. Basic Usage with `Node()`

### 2. Applying Styles Directly root Prop

`@meonode/ui` intelligently separates CSS properties from other props. You can provide CSS properties directly at the root of the `props` object.


### 3. Using Themes

Themes allow for centralized styling and easy reuse of design tokens.

### 4. Handling Children

`@meonode/ui` offers flexible ways to define children:

**Note on Function Children and Themes:** When a function child returns a `BaseNode` instance (e.g., `() => Node(...)`), `@meonode/ui` ensures that the parent's theme is propagated to this returned `BaseNode` if it doesn't already have its own theme. This allows `BaseNode`s created within the function to resolve theme-based styles like `color: 'theme.colors.highlight'`.

### 5. Creating Reusable Components with `Component` HOC

The `Component` HOC simplifies creating standard React components from functions that return `@meonode/ui` nodes.

### 6. Using with Existing React Components

You can easily incorporate existing React components into your `@meonode/ui` structures.

---

## Usage Implementation

The example implementation can be seen in the docs folder:
1. [Basic Usage](./docs/basic-usage.md)
2. [Conditional Component With Hook](./docs/conditional-component-with-hook.md)

---

## API Overview

### `Node<E extends NodeElement>(element: E, props: Partial<NodeProps<E>> = {}): BaseNodeInstance<E>`

*   The main factory function to create `BaseNode` instances.
*   `element`: A string (e.g., 'div'), a React component, or another `BaseNodeInstance`.
*   `props`: Object containing element properties, styles, `children`, and `theme`.
*   Returns: A `BaseNodeInstance`. Call `.render()` on it to get a renderable React element.

### `Component<T extends Record<string, any>>(component: (props: T) => BaseNodeInstance<any> | ReactNode): (props: T) => ReactNode`

*   A Higher-Order Component.
*   `component`: A function that accepts props and returns a `BaseNodeInstance` or any `ReactNode`.
*   Returns: A standard React functional component.

### `BaseNodeInstance.render(): ReactNode`

*   A method on `BaseNodeInstance` (the object returned by `Node()`).
*   Converts the internal `BaseNode` representation into a standard, renderable React Node tree using `React.createElement`.

---

## How It Works (Briefly)

1. **Node Creation:**
  - When you call `Node(element, props)`, a `BaseNode` instance is created.

2. **Props Processing:**
  - The `BaseNode` constructor analyzes the `props`
  - It uses helper functions (`getCSSProps`, `getDOMProps`) to separate valid CSS style properties from other DOM
    attributes
  - If a `theme` (or `nodeTheme`) is provided, style values like `'theme.colors.primary'` are resolved against this
    theme object using `getValueByPath`

3. **Children Processing:**
  - Children are recursively processed
  - If a child is a primitive, React element, or another `BaseNode`, it's adapted
  - Function children are wrapped in a special internal `_functionRenderer` `BaseNode`. This renderer calls the function
    during the render phase and ensures that if the function returns a `BaseNode`, the parent's theme is correctly
    propagated to it

4. **Rendering:**
  - The `render()` method on a `BaseNode` instance recursively traverses its structure
  - Calls `render()` on any child `BaseNode`s
  - Ultimately uses `React.createElement` to construct the final tree of React elements
  - The `nodeTheme` prop is removed before passing props to `createElement`

---

## TypeScript Support

`@meonode/ui` is written in TypeScript and exports all necessary types for a robust development experience. You'll get autocompletion for props, style properties, and theme usage.

Key types like `NodeElement`, `NodeProps`, and `BaseNodeInstance` are available if you need to work with them directly, though typically `Node` and `Component` are sufficient.

---

## When to Use `@meonode/ui`?

* Perfect for design systems and UI libraries requiring consistent structure, theming, and maintainable patterns
* Ideal for generating dynamic UIs from configurations, metadata, schemas or API responses
* Powerful solution for centralized styling logic, prop transformations and runtime customization
* Excellent choice for complex component hierarchies needing programmatic manipulation
* Great alternative to JSX when you prefer a more functional programming approach

---

## Contributing

Contributions are welcome! Please feel free to contact me on discord: **[l7aromeo](https://discordapp.com/users/704803255561224264)**.

---

## [License](https://github.com/l7aromeo/meonode-ui/blob/main/LICENSE)

The MIT License (MIT)
Copyright (c) 2025 Ukasyah Rahmatullah Zada

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
