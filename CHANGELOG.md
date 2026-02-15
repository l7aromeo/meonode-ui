# Changelog

All notable changes to this project will be documented in this file.

## [1.1.4] - 2026-02-15

### Fix

- **nextjs**: prevent duplicate style tags and content in StyleRegistry ([`91bec99`](https://github.com/l7aromeo/meonode-ui/commit/91bec99))
    - Renamed `registry.client.ts` to `style-registry.client.ts` and implemented tracking of inserted IDs during SSR to avoid duplicate CSS injection in Next.js streaming.

### Test

- **emotion**: add style tag generation monitoring test ([`0576f0c`](https://github.com/l7aromeo/meonode-ui/commit/0576f0c))
    - Added tests to verify that nested `Div` structures efficiently batch styles into a single style tag and that state changes correctly append new rules.

## [1.1.3] - 2026-02-15

### Feat

- **hook**: remove deprecated `usePortal` hook and related portal update logic ([`eb40bd1`](https://github.com/l7aromeo/meonode-ui/commit/eb40bd1))
    - Deleted the unstable `usePortal` hook and removed the `update` method from `NodePortal` and `Portal` HOC to streamline the API.

### Refactor

- **core**: optimize core logic, instance ID generation, and utility helpers ([`27fdd1b`](https://github.com/l7aromeo/meonode-ui/commit/27fdd1b))
    - Switched `instanceId` to use a static counter for deterministic IDs.
    - Optimized the iterative render loop by reducing array allocations and improving capacity checks.
    - Refactored `NodeUtil.isNodeInstance` to use `instanceof BaseNode` for better performance.
    - Improved `getGlobalState` to use a shared internal scope.
    - Enhanced `NodeUtil` with a weak map cache for function prop hashes.

### Build

- **rollup**: update configuration to use `.cjs` extension for CommonJS output ([`7f6a130`](https://github.com/l7aromeo/meonode-ui/commit/7f6a130))
    - Updated `rollup.config.ts` and `package.json` to use `.cjs` for CJS bundles to ensure compatibility in ESM-first environments.

### Chore

- **deps**: update dependencies to latest versions ([`f95591e`](https://github.com/l7aromeo/meonode-ui/commit/f95591e))
    - Updated various devDependencies including `typescript-eslint`, `next`, `react`, and `rollup`.
- **git**: update `.gitignore` to include AI-related directories ([`0607574`](https://github.com/l7aromeo/meonode-ui/commit/0607574))
    - Added `.claude` to the ignore list.

## [1.1.2] - 2025-12-22

### Fix

- **types**: fix `ThemedCSSObject` to support nested selectors and theme functions in deeply nested objects ([`f938be5`](https://github.com/l7aromeo/meonode-ui/commit/f938be5ca17cb5af076e567cfb7df8a7df97cf0d))
    - Updated `ThemedCSSObject` to use an intersection type with an index signature, allowing arbitrary string keys (like pseudo-selectors and media queries) to correctly resolve theme functions.

### Chore

- **deps**: update dependencies to latest versions ([`51925b1`](https://github.com/l7aromeo/meonode-ui/commit/51925b152ac8406f16ce627adc61ba4c3f442fc7))
    - Updated `next` to `^16.1.0`, `react-router-dom` to `^7.11.0`, `rollup` to `^4.54.0`, `@testing-library/react` to `^16.3.1` and `@typescript/native-preview` to `^7.0.0`.

## [1.1.1] - 2025-12-05

### Fix
- **types**: update HasCSSCompatibleStyleProp to use CSSProperties directly ([`4e23499`](https://github.com/l7aromeo/meonode-ui/commit/4e234990147baba72064a2f7b4ff03fedfe23a98))

## [1.1.0] - 2025-12-05

### Feat

- **types**: enforce strict component props and improve type inference ([`047c0f8`](https://github.com/l7aromeo/meonode-ui/commit/047c0f8))
    - Redefined `MergedProps` and introduced `ValidateComponentProps` to strictly validate props passed to `Node` and `createNode`.
    - Added `ExactProps` generic constraint to prevent excess property passing, improving type safety.
    - Enhanced `PropsOf` to better infer props from React components, including `forwardRef` and `Memo` components.
- **theme**: enable theme variable resolution in style keys ([`30ca1fd`](https://github.com/l7aromeo/meonode-ui/commit/30ca1fd))
    - Updated `ThemeUtil` to resolve theme variables within style keys (e.g., media queries like `@media (max-width: theme.breakpoint.lg)`).

### Refactor

- **portal**: optimize portal implementation and fix types ([`9643682`](https://github.com/l7aromeo/meonode-ui/commit/9643682))
    - Refactored `Portal` HOC to use a cleaner, more efficient implementation for provider wrapping.
    - Improved type definitions for `PortalLauncher` and `PortalProps` to ensure correct prop inference.

### Fix

- **util**: correct function child detection and rendering logic ([`944cfbd`](https://github.com/l7aromeo/meonode-ui/commit/944cfbd))
    - Updated `isFunctionChild` type definition to correctly identify function children while excluding React components (Class, Memo, ForwardRef).
    - Updated `functionRenderer` type definition to properly handle function child execution.

### Test

- **test**: refactor tests to align with strict types and fix leaks ([`40c87c7`](https://github.com/l7aromeo/meonode-ui/commit/40c87c7))
    - Updated various tests (`advanced-features`, `leak-repro`, `memoization`) to comply with the new strict type requirements.
    - Added `strict-component-props.test.ts` and `theme-key-resolution.test.ts` to verify new features.

### Chore

- **build**: update build config and dependencies ([`a9367e0`](https://github.com/l7aromeo/meonode-ui/commit/a9367e0))
    - Updated `package.json` scripts and `tsconfig.json` for better build and test processes.

## [1.0.1] - 2025-11-30

### Fix

- **core**: fix style prop extraction for React Components ([`19618b4`](https://github.com/l7aromeo/meonode-ui/commit/19618b4))
    - Modified `processRawNode` to prevent `style` props from being extracted and flattened into HTML attributes when the node is a React Component.
    - This ensures components receive their `style` prop intact as an object, preventing invalid attribute errors.

## [1.0.0] - 2025-11-28

### Perf

- **cache**: Remove props, CSS, and theme caching to improve performance and reduce overhead. ([`206361d`](https://github.com/l7aromeo/meonode-ui/commit/206361d)), ([`d7baa16`](https://github.com/l7aromeo/meonode-ui/commit/d7baa16))

### Fix

- **theme-provider**: Allow `setTheme` to accept an updater function for more flexible state management. ([`be8d261`](https://github.com/l7aromeo/meonode-ui/commit/be8d261))
- **core**: Improve mount tracking for cached elements by ensuring `MeoNodeUnmounter` wraps all renderable nodes. ([`d0ca27e`](https://github.com/l7aromeo/meonode-ui/commit/d0ca27e))
- **theme-provider**: Remove incorrect `@private` JSDoc tag from `ThemeProvider` component. ([`816e398`](https://github.com/l7aromeo/meonode-ui/commit/816e398))

### Test

- **performance**: Add controlled input performance tests to simulate human typing and measure `deps` memoization effectiveness. ([`bba48b8`](https://github.com/l7aromeo/meonode-ui/commit/bba48b8))

### Docs

- **readme**: Update `README.md` to reflect the removal of automatic caching and emphasize `deps`-based memoization. ([`2600d9c`](https://github.com/l7aromeo/meonode-ui/commit/2600d9c))

## [1.0.0-0] - 2025-11-27

### Fix

- **core**: Overhaul mount tracking, caching, and fix stableKey generation to prevent memory leaks ([`af1b707`](https://github.com/l7aromeo/meonode-ui/commit/af1b707187b66cdbf9fe88f791aee30cfc7d2835))
    - Replaced the simple `Set` in `MountTrackerUtil` with a reference-counting system (`Map`) to ensure a node is only considered unmounted when all its instances are gone.
    - The root element of a render cycle is now wrapped with a `MeoNodeUnmounter` component before being cached to guarantee that the unmount logic is always present, even for cached elements.
    - Improved `stableKey` generation in `NodeUtil.createPropSignature` to correctly differentiate function props by hashing their string representation, preventing cache collisions for components with different `onClick` or similar handlers.
    - Added new test suites (`leak-repro.test.ts`, `props-caching-leak.test.ts`) to specifically target and verify the leak fixes.

### Perf

- **cache**: Improve props cache eviction strategy ([`ce2f561`](https://github.com/l7aromeo/meonode-ui/commit/ce2f5616b21d68873dff0f1c4466bf9a2a40ce4d))
    - Adjusted the `propProcessingCache` eviction logic in `NodeUtil` to be more aggressive, removing enough items to get back to the `CACHE_SIZE_LIMIT` plus an additional buffer batch, preventing unbounded growth under high load.

### Feat

- **deps**: Add react-router-dom and test polyfills ([`29dcf13`](https://github.com/l7aromeo/meonode-ui/commit/29dcf137b5ebcba0e09e5acf13aadac6a0a0f513))
    - Introduced `react-router-dom` as a new development dependency to enable integration testing with React Router.
    - Added `whatwg-fetch` and Node.js `util` polyfills to `jest.setup.ts` for compatibility in the Jest environment.

### Test

- **react-router**: Add integration tests for react-router-dom ([`8478623`](https://github.com/l7aromeo/meonode-ui/commit/8478623add6bc66b9805a3ec9c0661f4df223f63))
    - Introduced a new test suite to verify the proper functioning and caching behavior of MeoNode components when used within a React Router environment.
    - Includes tests for declarative and programmatic navigation, ensuring that component lifecycles and caching mechanisms interact correctly with React Router's dynamic rendering.

### Chore
- **package**: Rename publish:pre script to publish:prerelease and add publish:premajor script in package.json ([`a98ba69`](https://github.com/l7aromeo/meonode-ui/commit/a98ba697a6e024126256a0e2517c839bbecd8058))

## [0.4.14] - 2025-11-23

### Perf

- **cache**: enforce dependency-based caching with shouldCacheElement helper ([
  `fab5525`](https://github.com/l7aromeo/meonode-ui/commit/fab55253093fbd2958ad84bcc98b1f0d1a07349c))
    - Introduces NodeUtil.shouldCacheElement() helper to centralize and enforce the opt-in caching strategy where only
      nodes with explicit dependencies are cached
    - Completes the memory optimization by closing loopholes where nodes without dependencies were still being cached
      based on stableKey alone
    - Replaces 4 inconsistent cache eligibility checks in BaseNode.render():
        - Cache lookup for parent nodes
        - Cache lookup for child nodes
        - Cache storage during rendering
        - MeoNodeUnmounter wrapping decision
    - Impact: Reduces memory usage, ensures mount tracking and cache operations stay in sync, improves code
      maintainability

### Test

- **memoization**: refine test to assert precise cache size after rendering components ([
  `8ded697`](https://github.com/l7aromeo/meonode-ui/commit/8ded6974cc1565c384abe1a3ca54e1f7bc8a9619))

### Chore

- **type**: remove src/types/env.d.ts as it is no longer needed ([aab4299](https://github.com/l7aromeo/meonode-ui/commit/aab429944bf12269d5e6116d3460ff354a42f673))

## [0.4.13] - 2025-11-23

### Fix

- **props**: improve prop handling and prevent leakage ([
  `73cc696`](https://github.com/l7aromeo/meonode-ui/commit/73cc696b3df8c1bd2ddef789de58febc6cd2f1c5))
    - This commit refactors prop handling within the MeoNode ecosystem to ensure that internal processing props are not
      leaked to the DOM.
    - Key changes:
        - The `MeoNodeUnmounter` is updated to correctly isolate and pass through props intended for the underlying DOM
          element, improving compatibility with libraries like MUI.
        - Internal props such as `node`, `css`, and `disableEmotion` are now explicitly prevented from being rendered as
          HTML attributes.
        - Added comprehensive tests to verify that standard HTML attributes are passed through while internal props are
          successfully filtered out.
    - This improves the robustness and predictability of component rendering.

### Test

- **props**: add tests for prop handling and leakage ([
  `a508e10`](https://github.com/l7aromeo/meonode-ui/commit/a508e107539d9ce84e8d99b63a0af329b28f3249))
    - Added new tests to verify that component props are correctly passed as HTML attributes, handle createNode and
      Node() correctly, and crucially, that internal MeoNode props are not leaked to the DOM.

### Chore

- **core**: remove unnecessary type assertion from finalChildren assignment ([
  `827b3ef`](https://github.com/l7aromeo/meonode-ui/commit/827b3ef4490bca08d58ef5fe1fd885aadbbb1524))

## [0.4.12] - 2025-11-21

### Feat

- **build**: migrate from Babel to Rollup with ESM and CJS support ([
  `70326a1`](https://github.com/l7aromeo/meonode-ui/commit/70326a107259c095d571b838dda15ffbf845af1d))
    - Replace Babel build system with Rollup configuration to prevent output legacy javascript code
    - Add support for both ESM and CJS output formats
    - Update package.json exports to point to new build outputs
    - Add Rollup plugins for TypeScript, commonjs, minification, and preserve directives
    - Remove Babel-related dependencies and configuration files
    - Update tsconfig.json to use 'preserve' module setting and bundler resolution
    - Configure build to output to separate ESM and CJS directories

## [0.4.11] - 2025-11-21

### Fix

- **core**: enhance MeoNodeUnmounter cleanup logic and support additional props cloning ([
  `02c17f7`](https://github.com/l7aromeo/meonode-ui/commit/02c17f7))
    - Refactor MeoNodeUnmounter to use useEffectEvent for stable cleanup on unmount
    - Cleanup removes node from BaseNode.elementCache, untracks mount via MountTrackerUtil, unregisters from
      BaseNode.cacheCleanupRegistry, and clears lastSignature to prevent memory leaks
    - Support cloning and forwarding additional props to valid React children elements

### Refactor

- **node.util**: enhance documentation for utility methods and improve clarity ([
  `ee42c24`](https://github.com/l7aromeo/meonode-ui/commit/ee42c24))
- **theme**: reorder ThemeResolverCache methods for clarity ([
  `cb842c8`](https://github.com/l7aromeo/meonode-ui/commit/cb842c8))
    - Moved `_generateCacheKey` and `_evict` methods below the main logic in `ThemeResolverCache` for better readability
      and organization
    - Removed duplicate declaration of `_instance` property
    - Kept functionality unchanged, improving code structure and maintainability

### Test

- **perf**: add memory leak detection test for navigation cycles and improve formatMemory function ([
  `ba139fc`](https://github.com/l7aromeo/meonode-ui/commit/ba139fc))
    - Added a new performance test to detect memory leaks during repeated navigation cycles between pages
    - The test measures heap memory usage before, during, and after navigation, ensuring memory growth stays within
      acceptable limits
    - Enhanced the formatMemory utility to correctly handle negative byte values and added JSDoc comments for clarity
    - Removed an obsolete shallowly equal props performance test to streamline the test suite
- **unmounter**: add regression test for MeoNodeUnmounter to forward implicit props in MUI RadioGroup integration ([
  `2ecaabd`](https://github.com/l7aromeo/meonode-ui/commit/2ecaabd))
    - Added a test to ensure MeoNodeUnmounter correctly forwards props injected via React.cloneElement, addressing
      issues with libraries like MUI where RadioGroup injects 'checked' and 'onChange' into Radio components
    - This prevents swallowing of props and verifies proper behavior of controlled radio inputs
    - Also updated an existing cache size assertion to allow equality, reflecting improved mount tracking
- **perf**: update react-createelement comparison tests with 5000 nested nodes and fix typings ([
  `b345ec0`](https://github.com/l7aromeo/meonode-ui/commit/b345ec0))
    - Changed rerender to use React.cloneElement<any> for proper typing
    - Updated NUM_NODES constant to 5000 for nested structure tests
    - Removed redundant comments about node count reduction to prevent stack overflow

### Chore

- **deps**: upgrade devDependencies and update test scripts ([
  `2ea128e`](https://github.com/l7aromeo/meonode-ui/commit/2ea128e))
    - add new devDependencies: @emotion/is-prop-valid@1.4.0, @emotion/styled@11.14.1, @mui/material@7.3.5, and related
      packages
    - update yarn to version 4.11.0
    - update test scripts to increase max-old-space-size to 8192 and include react-createelement-comparison.test.ts in
      test and perf runs
    - update various package resolutions in yarn.lock to align with new versions and dependencies
- **babel**: add "builtIns": false to minify plugin configuration ([
  `e16cdfb`](https://github.com/l7aromeo/meonode-ui/commit/e16cdfb))
- **yarn**: update yarnPath to version 4.11.0 ([`ecb6c68`](https://github.com/l7aromeo/meonode-ui/commit/ecb6c68))

### Docs

- **CONTRIBUTING**: improve formatting and readability of contribution guidelines ([
  `a7462ed`](https://github.com/l7aromeo/meonode-ui/commit/a7462ed))

## [0.4.10] - 2025-11-20

### Fix

- **unmounter**: prevent redundant FinalizationRegistry callbacks ([
  `59f5adf`](https://github.com/l7aromeo/meonode-ui/commit/59f5adf2f553aa49a88d1b44366b004d829ca107))
    - Explicitly unregister node from cacheCleanupRegistry on unmount
    - Prevents double cleanup when node is both unmounted and GC'd
    - Improves cleanup efficiency and reduces unnecessary registry callbacks

### Perf

- **util**: optimize prop processing and child handling ([
  `be26488`](https://github.com/l7aromeo/meonode-ui/commit/be26488e304629dd13851dfcaa7fedf43ad8b5c3))
    - Conditional sort: only sort keys if length > 1 (eliminates unnecessary sorts)
    - Replace for...in with Object.keys() iteration for better performance and safety
    - Add fast path for single child processing (non-array or 1-element array)
    - Avoid unnecessary array operations for common single-child case
    - Performance impact:
        - Reduced CPU overhead for small prop objects
        - Faster iteration with Object.keys() vs for...in
        - Eliminates array map() call for single child components

- **core**: add exception safety and optimize render method ([
  `5aad000`](https://github.com/l7aromeo/meonode-ui/commit/5aad000335ff29f078a9d40192d5a70fe9b61d12))
    - Wrap render logic in try-finally to ensure renderContext is always released
    - Null out workStack slots before releasing to help GC
    - Pre-allocate finalChildren array to avoid resizing during iteration
    - Replace non-null assertion with explicit error handling for better debugging
    - Add object pooling for workStack and renderedElements (reduces GC pressure)
    - Pool capped at 50 contexts with 2048-item limit to prevent memory issues
    - Exception safety ensures cleanup even if rendering throws

### Test

- **perf**: add React comparison tests with memory tracking ([
  `bc66d54`](https://github.com/l7aromeo/meonode-ui/commit/bc66d540c4ffa4ad083322dbdbc201f652ea5314))
    - Add comprehensive performance comparison between React.createElement and MeoNode
    - Test both flat (10k nodes) and nested (5k nodes) structures
    - Include memory usage measurements (initial + after 100 updates)
    - Reduce nested nodes from 10k to 5k to prevent stack overflow with StyledRenderer
    - Add table output with time and memory columns for clear comparison
    - Add GC availability warning for accurate measurements
    - Provides detailed performance and memory behavior insights during re-renders
    - Avoids stack overflow in deeply nested test scenarios

- **performance**: enhance performance metrics report formatting and adjust thresholds ([
  `6f3abe4`](https://github.com/l7aromeo/meonode-ui/commit/6f3abe4442938aa6cd414341fdf2aba25a9ece58))
    - Improve table formatting for performance metrics
    - Adjust test thresholds based on optimization results
    - Enhanced reporting for better visibility into performance characteristics

## [0.4.9] - 2025-11-19

### Feat

- **build**: add support for @tests alias and include tests folder in build and test configs ([
  `4dfd165`](https://github.com/l7aromeo/meonode-ui/commit/4dfd165fa52f93fe63ac7338344b91dfa5622c4b))

### Perf

- **core**: optimize rendering, caching, and memory management ([
  `4f599be`](https://github.com/l7aromeo/meonode-ui/commit/4f599be44458fef208a30849545606b060c4ec6b))
    - Reworks the core rendering loop to use a more efficient, manually-managed work stack with exponential growth,
      reducing reallocations and improving performance for deep and wide node trees.
    - Optimizes stable key generation by removing expensive shallow equality checks in favor of strict reference
      equality, significantly speeding up prop processing for cached components.
    - Implements a high-performance MinHeap-based LRU cache eviction strategy for prop processing, replacing a slower
      sort-based method. This ensures that the most relevant props are kept in the cache with minimal overhead.
    - Introduces CSS object hashing to accelerate prop signature generation, avoiding costly serialization of large
      style objects.
    - Fixes several memory leaks by ensuring proper cleanup of node properties (lastSignature, lastPropsObj) and
      unregistering nodes from the cache cleanup registry upon eviction.
    - Decouples element cache deletion from mount tracking to prevent race conditions and ensure reliable cleanup during
      component unmounting.

### Refactor

- **build**: rename constants directory from constants to constant and update imports accordingly ([
  `9531947`](https://github.com/l7aromeo/meonode-ui/commit/9531947af9b304c11c0865e8deafa1a633220753))

### Test

- **perf**: overhaul performance test suite ([
  `e3bd6ac`](https://github.com/l7aromeo/meonode-ui/commit/e3bd6ac6ceca474f935da644ff0c23b2f1de7692))
    - Introduces a new, structured performance reporting system using cli-table3 for clear, grouped metrics.
    - Refactors the entire performance test suite into logical groups: Layout Rendering, Memory Management, and Prop
      Processing.
    - Adds comprehensive memory leak detection tests for heavy state changes and repeated mount/unmount cycles, using
      forced garbage collection for more accurate heap analysis.
    - Extracts the large, complex CSS object into a dedicated test constant for better separation of concerns.
    - Updates memoization tests to align with the new, weighted LRU cache eviction scoring.

### Chore

- **deps**: update dependencies including typescript-eslint to 8.47.0 and add cli-table3 0.6.5 ([
  `6064555`](https://github.com/l7aromeo/meonode-ui/commit/6064555f0108ed47f9b31e98c4758f7449a67ff2))

## [0.4.8] - 2025-11-18

### Feat

- **client**: add generic type parameter to render function for stronger type safety ([
  `90a770e`](https://github.com/l7aromeo/meonode-ui/commit/90a770e))
- **core**: improve BaseNode rendering with iterative traversal and memory optimizations ([
  `1d5330a`](https://github.com/l7aromeo/meonode-ui/commit/1d5330a))
    - Introduce WorkItem interface to represent nodes in the iterative work stack during BaseNode rendering.
    - Replace recursive render traversal with an iterative depth-first approach using a preallocated workStack array for
      better performance and reduced call stack usage.
    - Implement dynamic resizing of workStack array to handle arbitrary tree sizes efficiently.
    - Update BaseNode’s internal caching fields (`lastPropsRef` and `lastSignature`) to be public and consistently used
      for stable key generation.
    - Modify MeoNodeUnmounter component to accept BaseNode instance and clear its `lastPropsRef` and `lastSignature` on
      unmount to prevent memory leaks.
    - Refine type annotations across node utilities and factory functions for stronger type safety (
      `Record<string, unknown>` instead of `any`).
    - Optimize critical prop extraction logic by replacing Set and startsWith checks with faster inline charCode
      comparisons.
    - Clean up and clarify utility methods related to prop signature creation, shallow equality, and portal management.
    - Improve node.util.ts by adjusting caching strategies, prop categorization, and React element handling for better
      robustness and maintainability.

### Fixes

- **navigation-cache-manager**: add proper typing and global window declaration for cleanup flag ([
  `6180d40`](https://github.com/l7aromeo/meonode-ui/commit/6180d40))

### Refactor

- improve typings and type safety in theme util and styled renderer ([
  `dbe1f33`](https://github.com/l7aromeo/meonode-ui/commit/dbe1f33))
    - Added explicit TypeScript types (e.g., CssProp, Record<string, unknown>) for variables and function signatures in
      `styled-renderer.client.ts` and `theme.util.ts`.
    - Updated cache maps to use more precise generic types for better type inference and safety.
    - Enhanced `resolveObjWithTheme` and related theme resolution logic with stronger typing and nullish coalescing.
    - Improved error handling for invalid theme path values.
    - Applied copy-on-write pattern with properly typed arrays and objects during theme resolution.
    - Strengthened type guards, e.g., `isPlainObject` type predicate.
    - Minor fixes to variable declarations with explicit types for clarity and consistency.

### Chore

- **babel**: update preset-env targets and expand plugin exclusions ([
  `f38cd24`](https://github.com/l7aromeo/meonode-ui/commit/f38cd24))
    - Set preset-env targets to support ES modules
    - Enable bugfixes option
    - Add multiple plugins to exclude list for better optimization
    - Clean up formatting of root, alias, extensions, and exclude fields

### Test

- **performance**: add comprehensive performance tests and metrics reporting ([
  `c3d7a81`](https://github.com/l7aromeo/meonode-ui/commit/c3d7a81))
    - Add detailed performance tests measuring render times for realistic layouts, 10,000 flat nodes, and 10,000 deeply
      nested nodes.
    - Introduce a heavy state changes test to detect memory leaks and ensure responsiveness under frequent updates.
    - Collect and log performance metrics including median render times and memory usage for analysis.
    - Add tests for stableKey generation performance with identical, shallowly equal, unique, large, and complex CSS
      props.
    - Enhance test suite with CSS styling for better visualization and interaction during tests.
    - Improve cleanup and reporting to avoid resource leaks and provide clearer performance insights.

## [0.4.7] - 2025-11-17

### Fixes

- **core/cache:** optimize navigation cache debounce timing and enhance stableKey handling ([
  `fff6f207`](https://github.com/l7aromeo/meonode-ui/commit/fff6f2070a06cc5ad461a2f992b111fb957fae6f))
    - Adjust navigation cleanup debounce duration dynamically based on cache size for better performance.
    - Change stableKey and _lastSignature to be optional to better represent their possible undefined state.
    - Refactor _getStableKey to return undefined on server instead of empty string.
    - Optimize critical props extraction by introducing NodeUtil.extractCriticalProps helper.
    - Improve client-side caching logic to avoid lookups when stableKey is absent.
    - Remove unused imports and redundant code in node.util.ts; improve shallowEqual implementation.
    - Update createPropSignature to return undefined on server and use getElementTypeName directly.
    - Add detailed comments and refine hashString combining FNV-1a and djb2 hashes for robustness.

## [0.4.6] - 2025-11-17

### Fixes

- **core/cache:** enhance memoization & caching system to prevent memory leaks and ensure safe lifecycle management ([
  `253d7d00`](https://github.com/l7aromeo/meonode-ui/commit/253d7d006121dc588a51580d5120c7123a5f8777))
  This introduces a robust, three-layered cleanup strategy to ensure cache integrity:
    1. An immediate, lifecycle-driven cleanup via the new `MeoNodeUnmounter` component.
    2. A debounced, event-driven cleanup for SPA navigations via `NavigationCacheManagerUtil`.
    3. A final, GC-driven safety net using the `FinalizationRegistry` API.

### Refactor

- **core:** migrate core logic from `src/helper/` to a new `src/util/` directory for better separation of concerns.
- **core:** extract internal utility functions from `core.node.ts` into `node.util.ts`.
- **core:** make internal caches on `BaseNode` public to support the new externalized management architecture.

### Chore

- **tooling:** enable TypeScript's `strict: true` mode and update codebase to be fully compliant.
- **tooling:** add CommonJS (`require`) exports to `package.json` for improved module compatibility.
- **tooling:** add `NODE_OPTIONS='--expose-gc'` to the test script to allow for explicit garbage collection during
  tests.
- **tests:** refine test suite by standardizing `afterEach` hooks and updating memoization tests to directly validate
  internal caching.

## [0.4.5] - 2025-11-15

### Feat

- **cache**: implement robust cache management and theme caching ([
  `9ed749f6`](https://github.com/l7aromeo/meonode-ui/commit/9ed749f6d877fdc8b6a736788add13225b07dd63))
  Refactor NavigationCacheManager for robustness, add memory monitoring and auto-cleanup.
  Implement LRU eviction for ThemeResolverCache and integrate with BaseNode cache clearing.

### Refactor

- **test**: split node.test.ts into smaller, more focused test files ([
  `930f998e`](https://github.com/l7aromeo/meonode-ui/commit/930f998e5f91faef3ff42fcafc6b02fc23f422ff))
  This commit refactors the test suite by splitting the monolithic `node.test.ts`
  file into several smaller, more focused test files, each covering a specific
  aspect of the BaseNode functionality.

  Specifically, `memoization.test.ts` was created to house tests related to
  dependency tracking and memoization in real-world scenarios. During this
  refactoring, a `console.error` related to duplicate keys in a memoization
  test was identified and suppressed to prevent noisy test output while
  preserving the test's original intent of verifying cache collision prevention.

### Fix

- **core**: pass disableEmotion flag to _renderProcessedNode for improved processing ([
  `b68e3d4`](https://github.com/l7aromeo/meonode-ui/commit/b68e3d49a732ee590805a0298f733b800a9b172d))

### Chore

- **test**: adjust performance test cleanup by removing cache clearing from afterEach ([
  `f72cea5e`](https://github.com/l7aromeo/meonode-ui/commit/f72cea5ef983fdaba012a7d446b58c7da06f5e1a))

## [0.4.4] - 2025-11-15

### Perf

- **core**: implement intelligent caching and memory management ([
  `0e5671b`](https://github.com/l7aromeo/meonode-ui/commit/0e5671b36189c964d66676ef633f3ccdbd9004e2))
  Introduces a sophisticated caching and memory management system to prevent memory leaks and improve performance in
  Single Page Applications (SPAs).

  This new system intelligently tracks mounted components and automatically cleans up caches of unmounted components
  during navigation events.

  Key features and improvements include:

    - **Navigation-aware Cache Eviction:** A new `NavigationCacheManager` listens for browser navigation events (
      popstate, pushState, etc.) and triggers a safe cleanup of the element cache. This prevents the cache from growing
      indefinitely with stale entries from previous pages.

    - **Mount Tracking:** A `MountTracker` class now keeps a record of all mounted `BaseNode` instances. This allows the
      cache eviction logic to accurately determine which components are safe to remove from the cache.

    - **Advanced Eviction Policies:** The `SafeCacheManager` implements several eviction policies, including evicting
      unmounted components, old unmounted components, and an emergency eviction policy for high memory pressure
      scenarios.

    - **Memory-Safe Portal System:** The portal implementation has been refactored to use a `WeakMap`. This ensures that
      portal-related DOM elements and React roots are automatically garbage collected when the corresponding `BaseNode`
      instance is no longer in use, preventing a common source of memory leaks.

    - **Improved Cache Entry Metadata:** The element cache entries now store additional metadata, such as creation
      timestamp, access count, and a `WeakRef` to the node instance, enabling more intelligent eviction decisions.

    - **Enhanced Stability:** Component identifiers for caching are now generated using a `WeakMap`, providing more
      stable and reliable keys than relying on component names, which can be affected by minification.

    - **Comprehensive Test Coverage:** Added a suite of new integration tests to validate the caching and memory
      management system. These tests cover key scenarios including cache collision, rapid navigation, React 18 Strict
      Mode compatibility, large prop object fingerprinting, and LRU eviction logic.

### Fix

- **core**: simplify property assignment in common helper ([
  `312af57`](https://github.com/l7aromeo/meonode-ui/commit/312af574712202a25bdd62fab94441a937f159f2))

### Refactor

- **core**: add ElementCacheEntry interface for memoization and update css prop type ([
  `6a8381c`](https://github.com/l7aromeo/meonode-ui/commit/6a8381c4c85cb22df4ba398637401d420461e413))

## [0.4.3] - 2025-11-14

### Docs

- **core**: add detailed comments to rendering methods ([
  `731c83e`](https://github.com/l7aromeo/meonode-ui/commit/731c83e))

### Fix

- **core**: adjust isStyledComponent logic to improve style handling ([
  `ff7a59e`](https://github.com/l7aromeo/meonode-ui/commit/ff7a59e))

### Refactor

- **core**: simplify _processProps by removing style prop handling ([
  `b3570b4`](https://github.com/l7aromeo/meonode-ui/commit/b3570b4))

## [0.4.2] - 2025-11-14

### Fix

- **core**: remove deps property from props since it should not be passed to element attribute ([
  `6b01cbe`](https://github.com/l7aromeo/meonode-ui/commit/6b01cbe))

## [0.4.1] - 2025-11-14

### Test

- **node**: enhance dependency and memoization tests with real-world scenarios ([
  `d7452fa`](https://github.com/l7aromeo/meonode-ui/commit/d7452fae9b3ef22a82dc83210851849d82de479f))

### Fix

- **core**: enhance error handling and improve style property detection ([
  `ca79c27`](https://github.com/l7aromeo/meonode-ui/commit/ca79c277cdfea5b62b54779ec2492518681639d1))

### Chore

- **deps**: update dependencies in package.json for improved stability and performance ([
  `eba2108`](https://github.com/l7aromeo/meonode-ui/commit/eba21080c953b1c6b6c1bbb6a401257845116f09))

### Perf

- **core**: Optimize prop processing and caching with new signature generation ([
  `8cf0319`](https://github.com/l7aromeo/meonode-ui/commit/8cf0319fd99c3c8496b6e63207cb378b6c521ae2))

### Refactor

- **types**: move node.type.ts to types directory and update imports ([
  `ccf769a`](https://github.com/l7aromeo/meonode-ui/commit/ccf769a2670e4546bfa776034a4fa8925ca2d27d))

## [0.4.0] - 2025-11-13

### Feature

- **core**: Implemented an advanced memoization and caching system to optimize rendering performance. This includes:
    - **Dependency-Based Memoization**: Nodes can now be created with a dependency array, similar to React's `useMemo`,
      to prevent unnecessary re-renders of the node and its entire subtree if dependencies have not changed. ([
      `3b0a110`](https://github.com/l7aromeo/meonode-ui/commit/3b0a110eb3db25862476d020182be9f0dba663e4))
    - **Enhanced Prop Caching**: The prop signature generation is now more robust, and the cache uses an advanced LRU
      eviction strategy to remain efficient. ([
      `3b0a110`](https://github.com/l7aromeo/meonode-ui/commit/3b0a110eb3db25862476d020182be9f0dba663e4))
    - **API Updates**: The `Node`, `createNode`, `createChildrenFirstNode`, and `Component` HOCs have been updated to
      accept an optional `deps` array to enable memoization. ([
      `3b0a110`](https://github.com/l7aromeo/meonode-ui/commit/3b0a110eb3db25862476d020182be9f0dba663e4))

### Test

- **core**: Added a comprehensive suite of tests for the new memoization and caching system, covering dependency-based
  memoization, reactive and non-reactive children, complex state updates, and memoization of Higher-Order Components (
  HOCs). ([`6bcd1b1`](https://github.com/l7aromeo/meonode-ui/commit/6bcd1b1bc6b2450c3d4296cb4af326f61cfee401))

## [0.3.18] - 2025-11-12

### Fixed

- **core**: refine prop caching to handle dynamic props correctly ([
  `4c0641e`](https://github.com/l7aromeo/meonode-ui/commit/4c0641e892f934551f100629cac72fc3f4649ab0))

## [0.3.17] - 2025-11-12

### Perf

- **core**: implement iterative renderer and prop caching ([
  `8a3a264`](https://github.com/l7aromeo/meonode-ui/commit/8a3a264be68bd041b6340636f5f7ee2b0caa63ff))
- **helper**: refactor theme resolution logic for improved performance and cache correctness ([
  `9614cb8`](https://github.com/l7aromeo/meonode-ui/commit/9614cb8d2aeae0d9bd2f9cf3edd51c022cd93273))

### Chore

- fix typo in JSDoc comment for useTheme hook ([
  `de0ddd9`](https://github.com/l7aromeo/meonode-ui/commit/de0ddd9a6308f4a76b6ad843a6139d42bd3fcf53))
- add deprecation notice to usePortal hook for future removal ([
  `f8a2923`](https://github.com/l7aromeo/meonode-ui/commit/f8a29230cad3962addb8cf28ed3538e6de236181))
- update PortalProps type definition to provide a default type parameter ([
  `de73ba5`](https://github.com/l7aromeo/meonode-ui/commit/de73ba5b9d9dd51637b24b0309d681309d9338ae))
- update isNodeInstance type guard to use BaseNode instead of NodeInstance ([
  `2c69d05`](https://github.com/l7aromeo/meonode-ui/commit/2c69d05b3d1593a976e439ca7404696b781e5012))
- rename jest.config.mjs to jest.config.ts and update configuration for TypeScript support ([
  `a3213eb`](https://github.com/l7aromeo/meonode-ui/commit/a3213eb5b91a55364cb4f5362005bc2a46934de5))
- **scripts**: increase stack size for jest test and fix build commands ([
  `e046cdf`](https://github.com/l7aromeo/meonode-ui/commit/e046cdf397e2cf418e09e149a9e0cf1e48f3d926))
- update tsconfig.json to exclude dist and node_modules directories ([
  `eeb9577`](https://github.com/l7aromeo/meonode-ui/commit/eeb957722ab7a26cbe59047c068f9955b082502e))
- update tsconfig.json with enhanced compiler options and path mappings for better development experience ([
  `89bc1a4`](https://github.com/l7aromeo/meonode-ui/commit/89bc1a42c23f015acfed1bcb860ebb6a4c684fc1))

## [0.3.16] - 2025-11-05

### Added

- **tests**: add tests for Fragment, Suspense, and Activity components to verify styling prop handling ([
  `2af386f`](https://github.com/l7aromeo/meonode-ui/commit/2af386f))
- **core**: enhance NodeProps type to conditionally include built-in React components ([
  `3b8a4cb`](https://github.com/l7aromeo/meonode-ui/commit/3b8a4cb))
- **react**: add REACT_ACTIVITY_TYPE to react-is helper ([
  `e91e48f`](https://github.com/l7aromeo/meonode-ui/commit/e91e48f))
- **core**: export NO_STYLE_TAGS type for better type inference ([
  `a6db6e8`](https://github.com/l7aromeo/meonode-ui/commit/a6db6e8))
- **react**: add Fragment component to create a container without extra DOM elements ([
  `d5e376a`](https://github.com/l7aromeo/meonode-ui/commit/d5e376a))

## [0.3.15] - 2025-11-04

### Added

- **core**: add disableEmotion prop to disable emotion styling and propagate to children ([
  `377a9e9`](https://github.com/l7aromeo/meonode-ui/commit/377a9e9d4844ba7869155e686c9b31f0f9ce2329))
- **react**: enhance isContextProvider and isReactClassComponent checks ([
  `e8839e4`](https://github.com/l7aromeo/meonode-ui/commit/e8839e4c231bdd66686f7b43d9889a18cd9fc791))

## [0.3.14] - 2025-10-30

### Added

- **core**: Add handling for Suspense and Activity components ([
  `0f9fcb1`](https://github.com/l7aromeo/meonode-ui/commit/0f9fcb171fdce28b5a880e69e2d591543e3af817))

## [0.3.13] - 2025-10-30

### Fixed

- **theme.helper**: process theme strings returned from functions ([
  `286fd89`](https://github.com/l7aromeo/meonode-ui/commit/286fd89e28cc10b467a208be4cdf1b7508d0be8c))

## [0.3.12] - 2025-10-23

### Added

- **react**: add Suspense component and JSDoc for Activity and Suspense ([
  `c1760fd`](https://github.com/l7aromeo/meonode-ui/commit/c1760fd))

## [0.3.11] - 2025-10-19

### Added

- **components**: add react activity node and export it in main ([
  `aadbc2d`](https://github.com/l7aromeo/meonode-ui/commit/aadbc2d08a928f1ba88bd4572b45eed8cb100a87))
- **theme.helper**: update resolveObjWithTheme to improve object type checking ([
  `da1ce4c`](https://github.com/l7aromeo/meonode-ui/commit/da1ce4cd53ccbe2d2a562a49730151434177dc59))

### Changed

- **chore**: update dependencies in package.json and yarn.lock ([
  `0c0ced6`](https://github.com/l7aromeo/meonode-ui/commit/0c0ced68662bb701634d49dc79da86e4ddce5392))
- **chore**: remove \'use strict\' directive from multiple files ([
  `17d79dc`](https://github.com/l7aromeo/meonode-ui/commit/17d79dcb105a8c2062695071c3f587f6db9a5711))

### Docs

- **docs**: update Node.js version requirement in CONTRIBUTING.md ([
  `4c577c3`](https://github.com/l7aromeo/meonode-ui/commit/4c577c3e23294bdc188cda5b14375af1cb967888))

### Test

- **node**: add test case for preserving Node instances passed through props and theme resolution ([
  `f4d1344`](https://github.com/l7aromeo/meonode-ui/commit/f4d1344355f2a4631ccdf04998bcf618d4ce1dc6))

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

- **styling**: Enabled theme-aware functions for css props, allowing for more dynamic styling (e.g.,
  `color: theme => theme.system.colors.primary`).

### Refactor

- **core**: Refactored the style resolution logic (`resolveObjWithTheme` and `StyledRenderer`) to selectively process
  the `css` prop. This enables the new theme-function feature while ensuring that other props (like `children`) are not
  processed, maintaining compatibility with Next.js Server Components.

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

- **feat:** update NodeFunction type to improve dynamic node content generation and update FunctionRendererProps
  interface to use NodeFunction

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

- **feat(common.helper)**: add omit and omitUndefined utility functions to create object copies without specified keys
  or undefined values
- **feat**: integrate omit and omitUndefined functions to manage finalProps for standard HTML tags and custom components

### Refactor

- **refactor**: remove unnecessary type assertions for children in core.node.ts
- **refactor(core.node.ts)**: streamline element creation logic

### Test

- **test**: add test case for rendering Div node using Component HOC
- **feat(test)**: replace Div components with Container for consistency in performance tests
- **test(node.test.ts)**: add test for rendering an empty prop Div node

### Removed

- **types**: removed redundant `key` prop from `FinalNodeProps` and default `key` from `NodeProps` types for cleaner
  type definitions

## [0.2.16] - 2025-09-13

### Added

- **feat(core)**: introduce static _isServer property to optimize server-side checks in caching methods
- **feat(core)**: remove passedKey from _functionRenderer and simplify function-as-child wrapper; augment toPortal
  unmount to clean portal container

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
