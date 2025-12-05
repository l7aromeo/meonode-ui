import { BaseNode, Node } from '@src/core.node.js'
import type { BasePortalProps, ComponentNode, NodeElement, NodeInstance, NodeProps, NodePortal, PortalLauncher, PortalProps } from '@src/types/node.type.js'
import type { ReactNode } from 'react'

// --- Function Overloads ---

/**
 * Higher-Order Component (HOC) to create and manage React portals with optional provider wrapping.
 * This function supports two overloads:
 * 1. `Portal(providerNodeInstance, component)` - Creates a portal with a fixed provider node instance.
 * 2. `Portal(component)` - Creates a portal without a fixed provider, allowing dynamic providers at launch time.
 * @template P The prop types for the component rendered inside the portal, extending BasePortalProps.
 * @param provider Optional NodeInstance to wrap the portal content (fixed provider).
 * @param component The component function that returns the content to render inside the portal.
 * @returns A function that launches the portal instance, accepting props and optional dynamic providers.
 * @example
 * // Using Portal with a fixed provider
 * const MyPortal = Portal(MyProviderNodeInstance, (props) => (
 *   Div({
 *     backgroundColor: 'white',
 *     padding: '20px',
 *     borderRadius: '8px',
 *     children: [
 *       H1({ children: 'Fixed Provider Portal' }),
 *       Button({
 *         onClick: () => props.portal.unmount(),
 *         children: 'Close',
 *       }),
 *     ],
 *   })
 * ));
 *
 * // Launching the portal
 * const portalInstance = MyPortal({ someProp: 'value' });
 * @example
 * // Using Portal without a fixed provider
 * const MyPortal = Portal((props) => (
 *   Div({
 *     backgroundColor: 'white',
 *     padding: '20px',
 *     borderRadius: '8px',
 *     children: [
 *       H1({ children: 'Dynamic Provider Portal' }),
 *       Button({
 *         onClick: () => props.portal.unmount(),
 *         children: 'Close',
 *       }),
 *     ],
 *   })
 * ));
 *
 * // Launching the portal with a dynamic provider
 * const portalInstance = MyPortal({ provider: AnotherProviderNodeInstance, someProp: 'value' });
 */
export function Portal<P extends BasePortalProps | Record<string, any> = BasePortalProps>(
  provider: NodeInstance,
  component: (props: PortalProps<P>) => ComponentNode,
): PortalLauncher<P>

export function Portal<P extends BasePortalProps | Record<string, any> = BasePortalProps>(
  component: (props: PortalProps<P>) => ComponentNode,
): PortalLauncher<P>

// --- Implementation ---
export function Portal<P extends BasePortalProps | Record<string, any> = BasePortalProps>(
  arg1: NodeInstance | ((props: PortalProps<P>) => ComponentNode),
  arg2?: (props: PortalProps<P>) => ComponentNode,
) {
  // --- Initialization ---
  let hocFixedProvider: NodeInstance[] | undefined = undefined
  let componentFunction: (props: Partial<PortalProps<P>>) => ComponentNode
  let portalInstance: NodePortal = {
    unmount: () => {
      console.warn('Portal instance not yet created. Cannot unmount.')
    },
    update: (node?: NodeElement) => {
      console.warn('Portal instance not yet created. Cannot update.', node)
    },
  }

  // --- Argument Parsing and Overload Handling ---
  // Determines which Portal overload was called (e.g., with fixed provider or just component).
  if (typeof arg2 === 'function' && arg1 instanceof BaseNode) {
    // Handles the case where a fixed provider (single) is passed.
    hocFixedProvider = [arg1 as NodeInstance]
    componentFunction = arg2 as (props: Partial<PortalProps<P>>) => ComponentNode
  } else if (typeof arg1 === 'function' && arg2 === undefined) {
    // Handles the case where only the component function is passed.
    componentFunction = arg1 as (props: Partial<PortalProps<P>>) => ComponentNode
  } else {
    throw new Error('Invalid arguments for Portal HOC. Use Portal(component) or Portal(providerNodeInstance, component).')
  }

  // --- Core Content Renderer Function ---
  // This function is the actual React component that will be rendered inside the portal.
  const Renderer = (propsFromNodeFactory: P & NodeProps = {} as NodeProps) => {
    const result = componentFunction({
      ...propsFromNodeFactory,
      portal: portalInstance, // Passes the portal control object to the content component
    })

    // If the result is a BaseNode, render it.
    if (result instanceof BaseNode) {
      return result.render()
    }
    return result as ReactNode
  }

  // --- Portal Launcher Function (Returned to User) ---
  // This is the function that developers call to actually create and manage a portal instance.
  return function Func(
    props: Partial<P & NodeProps> & {
      /** Optional provider components to wrap the portal content */
      provider?: NodeInstance
    } = {},
  ): NodePortal {
    let nodeToPortalize: NodeInstance

    // Combine fixed and dynamic providers
    const dynamicProviders: NodeInstance[] = []

    if (props.provider) {
      dynamicProviders.push(props.provider)
    }

    const finalProviderArray: NodeInstance[] = [...(hocFixedProvider ?? []), ...dynamicProviders]

    // Separates props for the portal's content from internal props like 'provider'.
    const { provider: _launcherProvider, ...contentPropsForRenderer } = props

    // Creates the base node for the portal's content.
    const contentNode = Node(Renderer, contentPropsForRenderer as any)

    // --- Helper for Deep Content Injection ---
    // Recursively injects content into the deepest child of a provider chain.
    function injectContentDeeply(node: NodeInstance, contentToInject: NodeInstance): NodeInstance {
      const children = node.rawProps?.children

      // If no children, or children is not a NodeInstance, inject directly
      if (!children || !(children instanceof BaseNode)) {
        return Node(node.element, {
          ...node.rawProps,
          children: contentToInject,
        })
      }

      // Recursively inject into the deepest node
      const newChild = injectContentDeeply(children, contentToInject)
      return Node(node.element, {
        ...node.rawProps,
        children: newChild,
      })
    }

    // --- Provider Wrapping Logic ---
    // Iterates through the combined providers (fixed + dynamic) to wrap the content.
    // Providers are applied in reverse order to ensure the innermost content is wrapped by the outermost provider.
    if (finalProviderArray.length > 0) {
      nodeToPortalize = finalProviderArray.reduceRight((currentWrappedContent: NodeInstance, providerNode: NodeInstance) => {
        if (!(providerNode instanceof BaseNode)) {
          console.warn('Portal: Item in provider is not a valid NodeInstance. Skipping.', providerNode)
          return currentWrappedContent
        }

        const hasNestedChildren = providerNode.rawProps?.children instanceof BaseNode

        // If the provider already has nested children, inject content deeply.
        // Otherwise, simply set currentWrappedContent as its direct child.
        return hasNestedChildren
          ? injectContentDeeply(providerNode, currentWrappedContent)
          : Node(providerNode.element, {
              ...providerNode.rawProps,
              children: currentWrappedContent,
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
