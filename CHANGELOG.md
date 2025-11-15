# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.5] - 2025-11-15

### Feat
- **cache**: implement robust cache management and theme caching ([`c453cb8`](https://github.com/l7aromeo/meonode-ui/commit/c453cb872e96c5ea49ddb39b189c79e53e46082a))
  Refactor NavigationCacheManager for robustness, add memory monitoring and auto-cleanup.
  Implement LRU eviction for ThemeResolverCache and integrate with BaseNode cache clearing.

### Refactor
- **test**: split node.test.ts into smaller, more focused test files ([`930f998`](https://github.com/l7aromeo/meonode-ui/commit/930f998e5f91faef3ff42fcafc6b02fc23f422ff))
  This commit refactors the test suite by splitting the monolithic `node.test.ts`
  file into several smaller, more focused test files, each covering a specific
  aspect of the BaseNode functionality.

  Specifically, `memoization.test.ts` was created to house tests related to
  dependency tracking and memoization in real-world scenarios. During this
  refactoring, a `console.error` related to duplicate keys in a memoization
  test was identified and suppressed to prevent noisy test output while
  preserving the test's original intent of verifying cache collision prevention.

### Fix
- **core**: pass disableEmotion flag to _renderProcessedNode for improved processing ([`b68e3d4`](https://github.com/l7aromeo/meonode-ui/commit/b68e3d49a732ee590805a0298f733b800a9b172d))

### Chore
- **test**: adjust performance test cleanup by removing cache clearing from afterEach ([`77e9fa4`](https://github.com/l7aromeo/meonode-ui/commit/77e9fa4a8731935048ea4bf5c8e8e7169fd88df2))

## [0.4.4] - 2025-11-15

### Perf
- **core**: implement intelligent caching and memory management ([`0e5671b`](https://github.com/l7aromeo/meonode-ui/commit/0e5671b36189c964d66676ef633f3ccdbd9004e2))
  Introduces a sophisticated caching and memory management system to prevent memory leaks and improve performance in Single Page Applications (SPAs).

  This new system intelligently tracks mounted components and automatically cleans up caches of unmounted components during navigation events.

  Key features and improvements include:

  - **Navigation-aware Cache Eviction:** A new `NavigationCacheManager` listens for browser navigation events (popstate, pushState, etc.) and triggers a safe cleanup of the element cache. This prevents the cache from growing indefinitely with stale entries from previous pages.

  - **Mount Tracking:** A `MountTracker` class now keeps a record of all mounted `BaseNode` instances. This allows the cache eviction logic to accurately determine which components are safe to remove from the cache.

  - **Advanced Eviction Policies:** The `SafeCacheManager` implements several eviction policies, including evicting unmounted components, old unmounted components, and an emergency eviction policy for high memory pressure scenarios.

  - **Memory-Safe Portal System:** The portal implementation has been refactored to use a `WeakMap`. This ensures that portal-related DOM elements and React roots are automatically garbage collected when the corresponding `BaseNode` instance is no longer in use, preventing a common source of memory leaks.

  - **Improved Cache Entry Metadata:** The element cache entries now store additional metadata, such as creation timestamp, access count, and a `WeakRef` to the node instance, enabling more intelligent eviction decisions.

  - **Enhanced Stability:** Component identifiers for caching are now generated using a `WeakMap`, providing more stable and reliable keys than relying on component names, which can be affected by minification.

  - **Comprehensive Test Coverage:** Added a suite of new integration tests to validate the caching and memory management system. These tests cover key scenarios including cache collision, rapid navigation, React 18 Strict Mode compatibility, large prop object fingerprinting, and LRU eviction logic.

### Fix
- **core**: simplify property assignment in common helper ([`312af57`](https://github.com/l7aromeo/meonode-ui/commit/312af574712202a25bdd62fab94441a937f159f2))

### Refactor
- **core**: add ElementCacheEntry interface for memoization and update css prop type ([`6a8381c`](https://github.com/l7aromeo/meonode-ui/commit/6a8381c4c85cb22df4ba398637401d420461e413))

## [0.4.3] - 2025-11-14

### Docs
- **core**: add detailed comments to rendering methods ([`731c83e`](https://github.com/l7aromeo/meonode-ui/commit/731c83e))

### Fix
- **core**: adjust isStyledComponent logic to improve style handling ([`ff7a59e`](https://github.com/l7aromeo/meonode-ui/commit/ff7a59e))

### Refactor
- **core**: simplify _processProps by removing style prop handling ([`b3570b4`](https://github.com/l7aromeo/meonode-ui/commit/b3570b4))

## [0.4.2] - 2025-11-14

### Fix
- **core**: remove deps property from props since it should not be passed to element attribute ([`6b01cbe`](https://github.com/l7aromeo/meonode-ui/commit/6b01cbe))

## [0.4.1] - 2025-11-14

### Test
- **node**: enhance dependency and memoization tests with real-world scenarios ([`d7452fa`](https://github.com/l7aromeo/meonode-ui/commit/d7452fae9b3ef22a82dc83210851849d82de479f))

### Fix
- **core**: enhance error handling and improve style property detection ([`ca79c27`](https://github.com/l7aromeo/meonode-ui/commit/ca79c277cdfea5b62b54779ec2492518681639d1))

### Chore
- **deps**: update dependencies in package.json for improved stability and performance ([`eba2108`](https://github.com/l7aromeo/meonode-ui/commit/eba21080c953b1c6b6c1bbb6a401257845116f09))

### Perf
- **core**: Optimize prop processing and caching with new signature generation ([`8cf0319`](https://github.com/l7aromeo/meonode-ui/commit/8cf0319fd99c3c8496b6e63207cb378b6c521ae2))

### Refactor
- **types**: move node.type.ts to types directory and update imports ([`ccf769a`](https://github.com/l7aromeo/meonode-ui/commit/ccf769a2670e4546bfa776034a4fa8925ca2d27d))

## [0.4.0] - 2025-11-13

### Feature
- **core**: Implemented an advanced memoization and caching system to optimize rendering performance. This includes:
    - **Dependency-Based Memoization**: Nodes can now be created with a dependency array, similar to React's `useMemo`, to prevent unnecessary re-renders of the node and its entire subtree if dependencies have not changed. ([`3b0a110`](https://github.com/l7aromeo/meonode-ui/commit/3b0a110eb3db25862476d020182be9f0dba663e4))
    - **Enhanced Prop Caching**: The prop signature generation is now more robust, and the cache uses an advanced LRU eviction strategy to remain efficient. ([`3b0a110`](https://github.com/l7aromeo/meonode-ui/commit/3b0a110eb3db25862476d020182be9f0dba663e4))
    - **API Updates**: The `Node`, `createNode`, `createChildrenFirstNode`, and `Component` HOCs have been updated to accept an optional `deps` array to enable memoization. ([`3b0a110`](https://github.com/l7aromeo/meonode-ui/commit/3b0a110eb3db25862476d020182be9f0dba663e4))

### Test
- **core**: Added a comprehensive suite of tests for the new memoization and caching system, covering dependency-based memoization, reactive and non-reactive children, complex state updates, and memoization of Higher-Order Components (HOCs). ([`6bcd1b1`](https://github.com/l7aromeo/meonode-ui/commit/6bcd1b1bc6b2450c3d4296cb4af326f61cfee401))

## [0.3.18] - 2025-11-12

### Fixed
- **core**: refine prop caching to handle dynamic props correctly ([`4c0641e`](https://github.com/l7aromeo/meonode-ui/commit/4c0641e892f934551f100629cac72fc3f4649ab0))

## [0.3.17] - 2025-11-12

### Perf
- **core**: implement iterative renderer and prop caching ([`8a3a264`](https://github.com/l7aromeo/meonode-ui/commit/8a3a264be68bd041b6340636f5f7ee2b0caa63ff))
- **helper**: refactor theme resolution logic for improved performance and cache correctness ([`9614cb8`](https://github.com/l7aromeo/meonode-ui/commit/9614cb8d2aeae0d9bd2f9cf3edd51c022cd93273))

### Chore
- fix typo in JSDoc comment for useTheme hook ([`de0ddd9`](https://github.com/l7aromeo/meonode-ui/commit/de0ddd9a6308f4a76b6ad843a6139d42bd3fcf53))
- add deprecation notice to usePortal hook for future removal ([`f8a2923`](https://github.com/l7aromeo/meonode-ui/commit/f8a29230cad3962addb8cf28ed3538e6de236181))
- update PortalProps type definition to provide a default type parameter ([`de73ba5`](https://github.com/l7aromeo/meonode-ui/commit/de73ba5b9d9dd51637b24b0309d681309d9338ae))
- update isNodeInstance type guard to use BaseNode instead of NodeInstance ([`2c69d05`](https://github.com/l7aromeo/meonode-ui/commit/2c69d05b3d1593a976e439ca7404696b781e5012))
- rename jest.config.mjs to jest.config.ts and update configuration for TypeScript support ([`a3213eb`](https://github.com/l7aromeo/meonode-ui/commit/a3213eb5b91a55364cb4f5362005bc2a46934de5))
- **scripts**: increase stack size for jest test and fix build commands ([`e046cdf`](https://github.com/l7aromeo/meonode-ui/commit/e046cdf397e2cf418e09e149a9e0cf1e48f3d926))
- update tsconfig.json to exclude dist and node_modules directories ([`eeb9577`](https://github.com/l7aromeo/meonode-ui/commit/eeb957722ab7a26cbe59047c068f9955b082502e))
- update tsconfig.json with enhanced compiler options and path mappings for better development experience ([`89bc1a4`](https://github.com/l7aromeo/meonode-ui/commit/89bc1a42c23f015acfed1bcb860ebb6a4c684fc1))

## [0.3.16] - 2025-11-05

### Added
- **tests**: add tests for Fragment, Suspense, and Activity components to verify styling prop handling ([`2af386f`](https://github.com/l7aromeo/meonode-ui/commit/2af386f))
- **core**: enhance NodeProps type to conditionally include built-in React components ([`3b8a4cb`](https://github.com/l7aromeo/meonode-ui/commit/3b8a4cb))
- **react**: add REACT_ACTIVITY_TYPE to react-is helper ([`e91e48f`](https://github.com/l7aromeo/meonode-ui/commit/e91e48f))
- **core**: export NO_STYLE_TAGS type for better type inference ([`a6db6e8`](https://github.com/l7aromeo/meonode-ui/commit/a6db6e8))
- **react**: add Fragment component to create a container without extra DOM elements ([`d5e376a`](https://github.com/l7aromeo/meonode-ui/commit/d5e376a))

## [0.3.15] - 2025-11-04

### Added
- **core**: add disableEmotion prop to disable emotion styling and propagate to children ([`377a9e9`](https://github.com/l7aromeo/meonode-ui/commit/377a9e9d4844ba7869155e686c9b31f0f9ce2329))
- **react**: enhance isContextProvider and isReactClassComponent checks ([`e8839e4`](https://github.com/l7aromeo/meonode-ui/commit/e8839e4c231bdd66686f7b43d9889a18cd9fc791))

## [0.3.14] - 2025-10-30

### Added
- **core**: Add handling for Suspense and Activity components ([`0f9fcb1`](https://github.com/l7aromeo/meonode-ui/commit/0f9fcb171fdce28b5a880e69e2d591543e3af817))

## [0.3.13] - 2025-10-30

### Fixed
- **theme.helper**: process theme strings returned from functions ([`286fd89`](https://github.com/l7aromeo/meonode-ui/commit/286fd89e28cc10b467a208be4cdf1b7508d0be8c))

## [0.3.12] - 2025-10-23

### Added
- **react**: add Suspense component and JSDoc for Activity and Suspense ([`c1760fd`](https://github.com/l7aromeo/meonode-ui/commit/c1760fd))


## [0.3.11] - 2025-10-19

### Added
- **components**: add react activity node and export it in main ([`aadbc2d`](https://github.com/l7aromeo/meonode-ui/commit/aadbc2d08a928f1ba88bd4572b45eed8cb100a87))
- **theme.helper**: update resolveObjWithTheme to improve object type checking ([`da1ce4c`](https://github.com/l7aromeo/meonode-ui/commit/da1ce4cd53ccbe2d2a562a49730151434177dc59))

### Changed
- **chore**: update dependencies in package.json and yarn.lock ([`0c0ced6`](https://github.com/l7aromeo/meonode-ui/commit/0c0ced68662bb701634d49dc79da86e4ddce5392))
- **chore**: remove \'use strict\' directive from multiple files ([`17d79dc`](https://github.com/l7aromeo/meonode-ui/commit/17d79dcb105a8c2062695071c3f587f6db9a5711))

### Docs
- **docs**: update Node.js version requirement in CONTRIBUTING.md ([`4c577c3`](https://github.com/l7aromeo/meonode-ui/commit/4c577c3e23294bdc188cda5b14375af1cb967888))

### Test
- **node**: add test case for preserving Node instances passed through props and theme resolution ([`f4d1344`](https://github.com/l7aromeo/meonode-ui/commit/f4d1344355f2a4631ccdf04998bcf618d4ce1dc6))

## [0.3.10] - 2025-10-09

### Fixed

- **core**: Re-hydrate BaseNode instances that lose class identity during React lifecycle.

### Changed

- **deps**: update dependencies to latest versions in package.json

## [0.3.9] - 2025-09-30

### Fixed

- **html.node**: update `Root` node default minHeight and minWidth to use dynamic viewport units

## [0.3.8] - 2025-09-29

### Added

- **styling**: Enabled theme-aware functions for css props, allowing for more dynamic styling (e.g., `color: theme => theme.system.colors.primary`).

### Refactor

- **core**: Refactored the style resolution logic (`resolveObjWithTheme` and `StyledRenderer`) to selectively process the `css` prop. This enables the new theme-function feature while ensuring that other props (like `children`) are not processed, maintaining compatibility with Next.js Server Components.

## [0.3.7] - 2025-09-27

### Added

- **rsc:** make client components RSC compatible

### Refactor

- **node:** isolate css prop for StyledRenderer

## [0.3.6] - 2025-09-27

### Changed

- **changelog:** update missing changelog entries

## [0.3.5] - 2025-09-27

### Refactor

- **refactor:** remove automatic key generation and use spread children in createElement
    - Remove _generateKey method and all automatic key generation logic
    - Simplify _processRawNode by removing nodeIndex parameter and complex case handling
    - Update render() to spread array children as individual arguments to createElement
    - Only preserve explicit non-null keys from original React elements
    - Fix component remounting issues when children content changes (e.g., during typing)

## [0.3.4] - 2025-09-26

### Fixed

- **fix:** add cookie path to prevent duplicate theme cookie

## [0.3.3] - 2025-09-26

### Fixed

- **fix:** enhance element type validation to allow `createPortal` to be a children

## [0.3.2] - 2025-09-26

### Fixed

- **fix**: update import paths for Node component to improve module structure
- **fix(theme-provider):** update type imports and enhance function return type for better clarity

## [0.3.1] - 2025-09-26

### Docs

- **docs(readme):** update readme with new theme system

## [0.3.0] - 2025-09-26

### Added

- **feat(theme):** use React Context for theme propagation

### Refactor

- **refactor(core):** remove unused _childrenHash property from Node class

### Example

- **feat(theme):** use React Context for theme propagation

  **Before**:
  ```typescript
  import { Div } from '@meonode/ui';

  const App = () => {
    return Div({
      theme: {
        // theme object
      },
      children: 'Hello world!',
    });
  };
  ```

  **After**:
  ```typescript
  import { Div, ThemeProvider } from '@meonode/ui';

  const App = () => {
    return ThemeProvider({
      theme: {
        mode: 'light', // or 'dark' or any custom mode
        system: {
          base: {
            default: '#ffffff',
            content: '#000000',
          }
        }
      },
      children: [
        Div({
          backgroundColor: 'theme.base',
          color: 'theme.content',
          children: 'Hello world!',
        }),
      ],
    });
  };
  ```

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
