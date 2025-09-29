# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.22] - 2025-09-29

### Refactor

- **refactor(core)**: Refactor key and CSS prop handling for improved rendering
  - Removed manual key generation logic, relying on React's reconciliation for array children.
  - Streamlined CSS prop handling within `BaseNode` and `StyledRenderer` for better integration with styling solutions.
  - Updated `createElement` calls to correctly spread children, supporting both single and array children.

## [0.2.21] - 2025-09-23

### Refactor

- **refactor(core):** make node processing logic static and robust

### Added

- **feat:** update NodeFunction type to improve dynamic node content generation and update FunctionRendererProps interface to use NodeFunction

### Fixed

- **fix(component.hoc.ts):** enhance node instance check in Renderer for improved stability
- **fix(node.type.ts):** remove unused processRawNode property from Node type

### Changed
- **package:** update dependencies to latest versions

## [0.2.20] - 2025-09-22

### Refactor

- **refactor(obj.helper)**: streamline serialization logic and improve performance

### Fixed

- **fix(eslint)**: enforce no-unsafe-function-type rule for better type safety
- **fix(node.helper.ts)**: update nodeSignature function to accept Children type and improve circular reference handling

## [0.2.19] - 2025-09-21

### Refactor

- **refactor(core)**: simplify PortalLauncher type definition for improved readability
- **refactor(core)**: enhance usePortal by improving component creation and cleanup logic
- **refactor(core)**: remove redundant re-render logic in portal rendering

### Test

- **test**: add unit tests for dynamic portal creation and management
- **test**: remove dynamic portal test case on node.test.ts

### Changed

- **chore**: update Yarn version to 4.10.2 and configure yarnPath in .yarnrc.yml

## [0.2.18] - 2025-09-19

### Added

- **feat(core)**: support function children and enhance rendering logic
- **feat(core)**: enhance portal with update method and NodePortal type
- **feat(hook)**: introduce usePortal hook for reactive portals

### Example

- **feat(portal)**: use `usePortal` hook to make the portal reactive to state changes

  ```typescript
  import { Button, Div, Node, Portal, type PortalProps } from '@meonode/ui';
  import { usePortal } from '@meonode/ui';
  import { useState } from 'react';

  const MyPortal = () => {
    const [state, setState] = useState<number>(0);
    const { setPortal, createComponent } = usePortal([state]);

    const PortalContent = createComponent(({ portal, text }: { text: string } & PortalProps<any>) => {
      return Div({
        children: [
          'This is portal content!',
          state === 1 ? text : 'Initial text value',
          Button(`Update Portal (${state + 1})`, {
            onClick: () => {
              setState((s: number) => s + 1);
            },
          }),
          Button('Close Portal', {
            onClick: () => {
              portal?.unmount();
            },
          }),
        ],
      }).render();
    });

    return Div({
      children: [
        Button('Open Portal', {
          onClick: () => {
            const portal = Portal<{ text: string }>(PortalContent)({ text: `Text prop still passed after update` });
            setPortal(portal);
          },
        }),
      ],
    }).render();
  };
  ```

## [0.2.17] - 2025-09-14

### Added

- **feat(common.helper)**: add omit and omitUndefined utility functions to create object copies without specified keys or undefined values
- **feat**: integrate omit and omitUndefined functions to manage finalProps for standard HTML tags and custom components

### Refactor

- **refactor**: remove unnecessary type assertions for children in core.node.ts
- **refactor(core.node.ts)**: streamline element creation logic

### Test

- **test**: add test case for rendering Div node using Component HOC
- **feat(test)**: replace Div components with Container for consistency in performance tests
- **test(node.test.ts)**: add test for rendering an empty prop Div node

### Removed

- **types**: removed redundant `key` prop from `FinalNodeProps` and default `key` from `NodeProps` types for cleaner type definitions

## [0.2.16] - 2025-09-13

### Added

- **feat(core)**: introduce static _isServer property to optimize server-side checks in caching methods
- **feat(core)**: remove passedKey from _functionRenderer and simplify function-as-child wrapper; augment toPortal unmount to clean portal container

### Refactor

- **feat**: refactor children prop type to use `Children` type for better clarity and consistency across the codebase

## [0.2.15] - 2025-09-12

### Added

- **feat(cache)**: implement hybrid caching strategy for processed children using WeakMap and Map to improve performance
  and memory management
- **feat(helper)**: implement nodeSignature for stable signatures and improve createStableHash with bounded traversal
- **feat(helper)**: enhance ObjHelper.stringify method for deterministic serialization with sorted keys and special type
  handling

### Refactor

- **refactor**: improve type definitions and error handling in rendering methods

### Test

- **test(tests)**: add performance tests for rendering a single-page layout in React
- **test**: add cleanup after each test and verify component display names for debugging

## [0.2.14] - 2025-09-12

### Added

- **feat**: Add `Container` alias for `Div` to simplify general-purpose container usage.
- **feat**: Add caching for processed children to optimize performance in `BaseNode` class.

### Removed

- **feat**: Remove `shallowEqual` utility function from `common.helper.ts`.

### Fixed

- **feat**: Improve performance by optimizing existing key checks and handling null values in rendering functions.

## [0.2.13] - 2025-09-11

### Added

- **feat**: Add pre-commit hook for linting and testing, update package.json scripts.
- **feat**: Add Jest configuration and setup for testing with TypeScript.
- **test**: Add comprehensive tests for BaseNode core functionality.

### Fixed

- **core**: Remove stylable elements from NO_STYLE_TAGS to ensure only non-visual/metadata tags are excluded from CSS
  styling.

## [0.2.12] - 2025-09-11

### Fixed

- **core.node**: Removed the child processing cache to fix a critical bug that caused infinite page loads in server-side
  rendering environments.
- **helper**: Corrected the element type retrieval logic within the hashing function used for child node processing.

## [0.2.11] - 2025-09-11

### Enhanced

- **core.node**: Significantly improved JSDoc documentation for the `BaseNode` class, providing better clarity on prop
  processing, child handling, and rendering logic.
- **core.node**: Overhauled the child processing and caching mechanism to improve server-side performance and resolve a
  memory leak. This includes a move from object stringification to a more performant hashing strategy for cache keys and
  the introduction of a cache management policy.

### Fixed

- **helper**: Corrected an issue in flexbox style processing where an unnecessary string check was performed.
- **core.node**: Updated a function placeholder to adhere to the unused parameter naming convention.

## [0.2.10] - 2025-09-10

### Added

- **core**: add top-level `render` function for a cleaner and simpler API when mounting a Meonode instance to the DOM.
  This abstracts away the need to manually use `react-dom/client`.
    - **Before**:
      ```typescript
      import { createRoot } from 'react-dom/client';
      import { Div } from '@meonode/ui';
  
      const container = document.getElementById('root');
      const root = createRoot(container);
      root.render(Div({ children: 'Hello' }).render());
      ```
    - **After**:
      ```typescript
      import { Div } from '@meonode/ui';
      import { render } from '@meonode/ui/client';
  
      const container = document.getElementById('root');
      render(Div({ children: 'Hello' }), container);
      ```
- **constants**: add `NO_STYLE_TAGS` array and `noStyleTagsSet` for quick lookup of tags that should not receive styles

### Enhanced

- **core**: enhance `StyledRenderer` integration to check for no-style tags

### Changed

- **helper**: update CSS property set to use constants and add no-style tag check
- **package**: update dependencies to latest versions
- **directory**: rename `data` directory to `constants` for clarity
- **file**: rename `cssProperties.ts` to `cssProperties.const.ts` to reflect its purpose

## [0.2.9] - 2025-09-05

### Fixed

- **core.types**: corrected `MergedProps` definition to restore proper TypeScript inference and props autocomplete
    - Fixes regression from v0.2.8 where `createNode` and `createChildrenFirstNode` lost autocomplete for props due to
      incorrect `MergedProps` typing

## [0.2.8] - 2025-09-05

### Changed

- **core.node**: refactor props handling to use a single utility type:
    - `MergedProps<E, AdditionalProps>` — merges `NodeProps<E>` with custom props, giving precedence to overlapping keys
      from `AdditionalProps`.
- Simplifies and unifies the typing system for node factories (`createNode`, `createChildrenFirstNode`).
- Improves developer experience when working with prebuilt components:
    - Example:
      ```typescript
      import { Div, Input } from '@meonode/ui'
  
      // Add new props
      Div<{ field: string }>({ field: 'Hello' })
  
      // Override existing React props
      Input<{ onChange: (e: { target: { value: string } }) => void }>({ 
        onChange: ({ target }) => console.log(target.value),
      })
      ```
  Extending prebuilt components is now safer and more predictable, with generic props always taking precedence when keys
  overlap.

- **helpers**: reorganize helper files and update import paths

### Fixed

- **styled-renderer**: make `children` prop optional in `StyledRendererProps`

## [0.2.7] - 2025-09-04

### Changed

- **core.node**: rename `childIndex` to `nodeIndex` and update key generation logic

## [0.2.6] - 2025-09-04

- **deps**: update TypeScript ESLint, native-preview, and jsdoc to latest versions
- **core.node**: improve generateIndexedKeyIfNeeded to accept object parameters and enhance key uniqueness with children
  count
- **imports**: update import paths to include file extensions for compatibility

## [0.2.5] - 2025-09-03

- **imports**: Update import paths to include file extensions for compatibility.

## [0.2.4] - 2025-09-02

### Added

- **core**: Exposed the original element via the created Node for easier access and debugging.
    ```typescript
    import { createNode } from "@meonode/ui";

    // Create a Node wrapping a 'div' element
    const MyComp = createNode('div');

    // Access the underlying element type
    console.log(MyComp.element); // 'div'
    ```

## [0.2.3] - 2025-09-01

### Fixed

- **types**: Remove forbidden css import to resolve RSC error

### Changed

- **package**: Bump version to 0.2.3

## [0.2.2] - 2025-09-01

### Added

- **core**: Include nativeProps in props extraction for improved component flexibility

### Enhanced

- **types**: Enhance StyledRendererProps and FinalNodeProps for improved type safety

### Changed

- **package**: Bump version to 0.2.2

## [0.2.1] - 2025-09-01

### Changed

- **types**: Update CSS type from CSSObject to CSSInterpolation for better compatibility
- **package**: Bump version to 0.2.1

## [0.2.0] - 2025-08-31

### Added

- **docs**: Add badges for NPM version, license, and bundle size to README

### Enhanced

- **docs**: Update installation instructions and enhance clarity in core concepts
- **docs**: Enhance documentation with new examples and improved clarity

### Removed

- **package**: Remove deprecated hook entry from package.json

### Fixed

- **core.node**: Add suppressHydrationWarning to propsForCreateElement

### Changed

- **package**: Bump version to 0.2.0

## [0.1.121] - 2025-08-30

### Changed

- **core.node**: Simplify style resolution and improve prop handling
- **StyledRenderer**: Remove unused style prop and simplify component
- **package**: Bump version to 0.1.121

## [0.1.120] - 2025-08-30

### Added

- **styles**: Add Emotion support and Next.js style registry integration
    - Add @emotion/react and @emotion/cache dependencies
    - Add StyledRenderer and StyleRegistry components for Emotion
    - Integrate StyledRenderer into BaseNode for style prop rendering
    - Add nextjs-registry export for Next.js style registry

### Enhanced

- **core**: Enhance style handling with StyledRenderer for Emotion support

### Fixed

- **deps**: Update peerDependencies for Emotion and React to use version constraints
- **deps**: Update @types/react and @types/react-dom to latest versions

### Changed

- **package**: Update peerDependencies for @emotion/cache
- **package**: Bump version to 0.1.120

## [0.1.118] - 2025-08-30

### Fixed

- **deps**: Update peerDependencies for Emotion and React to use version constraints

### Changed

- **package**: Bump version to 0.1.118

## [0.1.117] - 2025-08-30

### Added

- **flexbox**: Improve default style resolution and add flex shorthand parser
    - Add parseFlexShorthand to extract flex-grow, shrink, and basis
    - Enhance resolveDefaultStyle to respect explicit flex/flexShrink values
    - Improve handling of minHeight, minWidth, and flexShrink for flex items

### Enhanced

- **core**: Refine type of finalChildren for improved type safety
- **docs**: Update documentation for clarity on flexbox scrolling fixes

### Changed

- **core**: Move comments position for better readability
- **imports**: Remove .js extensions from internal imports
- **package**: Bump version to 0.1.117

## [0.1.116] - 2025-08-27

### Changed

- **package**: Bump version to 0.1.116

---

## Notes

- This changelog covers the most recent development history available
- The project focuses on building React UIs with type-safe fluency without JSX syntax
- Recent development has emphasized Emotion integration, type safety improvements, and enhanced flexbox support
- For a complete history, view all commits on GitHub: [View all commits](https://github.com/l7aromeo/meonode-ui/commits)
