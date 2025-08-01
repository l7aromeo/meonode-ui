'use strict'
import { BaseNode, Node } from '@src/core.node'
import type { BasePortalProps, ComponentNode, NodeInstance, NodeProps, PortalLauncher, PortalProps, Theme } from '@src/node.type'
import type { ReactNode } from 'react'
import { type Root as ReactDOMRoot } from 'react-dom/client'

/**
 * Creates a portal component with a single fixed provider.
 * The content component will be rendered within this provider. This is the preferred method
 * for providing fixed context to your portal content.
 * @param provider A single `NodeInstance` that will wrap the portal content. This should typically
 * be a React context provider (e.g., `ThemeProvider({ theme })`).
 * @param component The React component function that defines the portal's content. It receives
 * props of type `PortalProps<P>` and should return a `ComponentNode`.
 * @returns A launcher function that, when called, creates and controls the portal instance.
 * @example
 * ```ts
 * // Example of preferred usage with a single fixed provider:
 * const ThemedModal = Portal(
 * ThemeProvider({ theme: 'light' }),
 * (props) => Div({ children: props.children, style: { background: props.nodetheme?.background } })
 * );
 *
 * const modalInstance = ThemedModal({ children: "Preferred content" });
 * modalInstance.unmount();
 * ```
 */
export function Portal<P extends BasePortalProps | Record<string, any> = BasePortalProps>(
  provider: NodeInstance<any>,
  component: (props: PortalProps<P>) => ComponentNode,
): PortalLauncher<P>

/**
 * Creates a basic portal component without any fixed providers.
 * Dynamic providers can still be passed as props when launching the portal instance.
 * @param component The React component function that defines the portal's content. It receives
 * props of type `PortalProps<P>` and should return a `ComponentNode`.
 * @returns A launcher function that, when called, creates and controls the portal instance.
 * @example
 * ```ts
 * // Example of basic usage without fixed providers:
 * const BasicModal = Portal(
 * (props) => Div({ children: props.children, style: { padding: '20px', border: '1px solid black' } })
 * );
 *
 * const basicModalInstance = BasicModal({ children: "Hello from a basic portal!" });
 * basicModalInstance.unmount();
 *
 * // Example with dynamic providers when launching:
 * const DynamicThemedModal = Portal(
 * (props) => Div({ children: props.children, style: { background: props.nodetheme?.background || 'white' } })
 * );
 *
 * const dynamicModalInstance = DynamicThemedModal({
 * providers: ThemeProvider({ theme: 'blue' }), // Dynamic provider
 * children: "Content with dynamic theme"
 * });
 * dynamicModalInstance.unmount();
 * ```
 */
export function Portal<P extends BasePortalProps | Record<string, any> = BasePortalProps>(
  component: (props: PortalProps<P>) => ComponentNode,
): PortalLauncher<P>

// --- Implementation ---
export function Portal<P extends BasePortalProps | Record<string, any> = BasePortalProps>(
  arg1: NodeInstance<any> | ((props: PortalProps<P>) => ComponentNode),
  arg2?: (props: PortalProps<P>) => ComponentNode,
) {
  // --- Initialization ---
  let hocFixedProvider: NodeInstance<any>[] | undefined = undefined
  let componentFunction: (props: Partial<PortalProps<P>>) => ComponentNode
  let portalInstance: ReactDOMRoot | null = null

  // --- Argument Parsing and Overload Handling ---
  // Determines which Portal overload was called (e.g., with fixed provider or just component).
  if (typeof arg2 === 'function' && arg1 instanceof BaseNode) {
    // Handles the case where a fixed provider (single) is passed.
    hocFixedProvider = [arg1 as NodeInstance<any>]
    componentFunction = arg2 as (props: Partial<PortalProps<P>>) => ComponentNode
  } else if (typeof arg1 === 'function' && arg2 === undefined) {
    // Handles the case where only the component function is passed.
    componentFunction = arg1 as (props: Partial<PortalProps<P>>) => ComponentNode
  } else {
    throw new Error('Invalid arguments for Portal HOC. Use Portal(component) or Portal(providerNodeInstance, component).')
  }

  // --- Core Content Renderer Function ---
  // This function is the actual React component that will be rendered inside the portal.
  // It receives props and handles theme application and portal control.
  const Renderer = (propsFromNodeFactory: P & NodeProps<any> = {} as NodeProps<any>) => {
    const { nodetheme: _nodetheme, ...contentOnlyProps } = propsFromNodeFactory

    const result = componentFunction({
      ...contentOnlyProps,
      portal: portalInstance, // Passes the portal control object to the content component
    })

    // Ensures that the theme is correctly applied if the result is a BaseNode.
    if (result instanceof BaseNode) {
      return Node(result.element, {
        ...result.rawProps,
        nodetheme: result.rawProps?.nodetheme || result.rawProps?.theme || propsFromNodeFactory.nodetheme,
      }).render()
    }
    return result as ReactNode
  }

  // --- Portal Launcher Function (Returned to User) ---
  // This is the function that developers call to actually create and manage a portal instance.
  return function Func(
    props: Partial<P & NodeProps<any>> & {
      /** Optional provider components to wrap the portal content */
      provider?: NodeInstance<any>
    },
  ): ReactDOMRoot | null {
    let nodeToPortalize: NodeInstance<any>

    // Combine fixed and dynamic providers
    const dynamicProviders: NodeInstance<any>[] = []

    if (props.provider) {
      dynamicProviders.push(props.provider)
    }

    const finalProviderArray: NodeInstance<any>[] = [...(hocFixedProvider ?? []), ...dynamicProviders]

    // Separates props for the portal's content from internal props like 'provider' or 'nodetheme'.
    const { provider: _launcherProvider, nodetheme, ...contentPropsForRenderer } = props
    const propsForInnermostNode: NodeProps<any> = { ...contentPropsForRenderer, nodetheme }

    // Creates the base node for the portal's content.
    const contentNode = Node(Renderer, propsForInnermostNode)

    // --- Helper for Deep Content Injection ---
    // Recursively injects content into the deepest child of a provider chain.
    function injectContentDeeply(node: NodeInstance<any>, contentToInject: NodeInstance<any>, nodetheme?: Theme): NodeInstance<any> {
      const children = node.rawProps?.children

      // If no children, or children is not a NodeInstance, inject directly
      if (!children || !(children instanceof BaseNode)) {
        return Node(node.element, {
          ...node.rawProps,
          children: contentToInject,
          nodetheme: node.rawProps?.nodetheme || node.rawProps?.theme || nodetheme,
        })
      }

      // Recursively inject into the deepest node
      const newChild = injectContentDeeply(children, contentToInject)
      return Node(node.element, {
        ...node.rawProps,
        children: newChild,
        nodetheme: node.rawProps?.nodetheme || node.rawProps?.theme || nodetheme,
      })
    }

    // --- Provider Wrapping Logic ---
    // Iterates through the combined providers (fixed + dynamic) to wrap the content.
    // Providers are applied in reverse order to ensure the innermost content is wrapped by the outermost provider.
    if (finalProviderArray.length > 0) {
      nodeToPortalize = finalProviderArray.reduceRight((currentWrappedContent: NodeInstance<any>, providerNode: NodeInstance<any>) => {
        if (!(providerNode instanceof BaseNode)) {
          console.warn('Portal: Item in provider is not a valid NodeInstance. Skipping.', providerNode)
          return currentWrappedContent
        }

        const hasNestedChildren = providerNode.rawProps?.children instanceof BaseNode

        // If the provider already has nested children, inject content deeply.
        // Otherwise, simply set currentWrappedContent as its direct child.
        return hasNestedChildren
          ? injectContentDeeply(providerNode, currentWrappedContent, nodetheme)
          : Node(providerNode.element, {
              ...providerNode.rawProps,
              children: currentWrappedContent,
              nodetheme: providerNode.rawProps?.nodetheme || providerNode.rawProps?.theme || nodetheme,
            })
      }, contentNode)
    } else {
      // If no providers, the content node is the final node to portalize.
      nodeToPortalize = contentNode
    }

    // --- Portal Creation and Return ---
    // Creates the actual ReactDOM portal instance and returns it for external control.
    portalInstance = nodeToPortalize.toPortal()
    return portalInstance
  }
}
