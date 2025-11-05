import { Fragment as BaseFragment, Activity as BaseActivity, Suspense as BaseSuspense } from 'react'
import { createNode } from '@src/core.node.js'

/**
 * A container that does not render any extra DOM element.
 * @see {@link https://react.dev/reference/react/Fragment React Docs}
 * @example
 *
 * ```typescript
 * import { Fragment, Div, Span } from '@meonode/ui';
 *
 * Fragment({
 *   children: [
 *     Div('First Div'),
 *     Span('A Span inside Fragment'),
 *     Div('Second Div'),
 *   ],
 * })
 * ```
 */
export const Fragment = createNode(BaseFragment)

/**
 * Lets you hide and restore the UI and internal state of its children.
 * @see {@link https://react.dev/reference/react/Activity React Docs}
 * @example
 *
 * ```typescript
 * import { Activity } from '@meonode/ui';
 *
 * Activity({
 *   mode: isShowingSidebar ? "visible" : "hidden",
 *   children: Div(...),
 * })
 * ```
 */
export const Activity = createNode(BaseActivity)

/**
 * Lets you display a fallback until its children have finished loading.
 * @see {@link https://react.dev/reference/react/Suspense React Docs}
 * @example
 *
 * ```typescript
 * import { Suspense } from '@meonode/ui';
 *
 * Suspense({
 *   fallback: 'Loading...',
 *   children: Div(...),
 * })
 * ```
 */
export const Suspense = createNode(BaseSuspense)
