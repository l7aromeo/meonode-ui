import { Activity as BaseActivity, Suspense as BaseSuspense } from 'react'
import { createNode } from '@src/core.node.js'

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
