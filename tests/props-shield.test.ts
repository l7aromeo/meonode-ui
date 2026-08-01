// @vitest-environment jsdom
//
// `props` is the documented escape hatch from CSS classification: "when a
// custom component takes a prop whose name matches a CSS property (e.g.
// `height` for chart dimensions), wrap it in `props` so the styling engine
// ignores it".
//
// It held on a direct call but not through `Node(Component, ...)`. The outer
// node unwrapped `props` and spread its contents onto the element, so by the
// time the Component HOC ran its own internal `Node(Renderer, ...)` the shielded
// values were ordinary top-level props again — and `height` was reclassified as
// CSS, reaching the component as a `className` instead of a number.
//
// Only bites props whose names collide with CSS properties, which is exactly
// the case the escape hatch exists for: height, width, color, display, order,
// content, filter, gap.
import { render } from '@testing-library/react'
import { Node, Component, Div } from '@src/main.js'

interface ChartProps {
  height: number
  data: number[]
}

/** Captures what the component body actually received. */
function capture() {
  const seen: { props?: Record<string, unknown> } = {}
  const Chart = Component<ChartProps>(p => {
    seen.props = p as unknown as Record<string, unknown>
    return Div({ children: 'chart' })
  })
  return { Chart, seen }
}

// Compile-time contract, enforced by the suite's own `tsc --noEmit`.
//
// The body and the call site need different shapes. A caller may satisfy the
// component's props through `props` instead of the top level — that is the whole
// point of the shield — but the *body* must still see them as declared. An
// earlier attempt widened both with one union, which made every prop optional
// inside the component: `data.length` stopped compiling without a guard.
interface StrictProps {
  height: number
  data: number[]
}

const BodySeesRequiredProps = Component<StrictProps>(({ height, data }) =>
  // No optional chaining anywhere: if these were optional this would not compile.
  Div({ children: `${data.length} points at ${height}px` }),
)

// And the call site may still route them through `props`.
const _callSiteAcceptsShield = () => BodySeesRequiredProps({ props: { height: 1, data: [] } })

describe('props shields component props from CSS classification', () => {
  it('survives Node(Component, { props })', () => {
    // The exact form the usage docs demonstrate.
    const { Chart, seen } = capture()

    render(Node(Chart, { props: { height: 500, data: [1, 2, 3] } }).render() as never)

    expect(seen.props?.height).toBe(500)
    expect(seen.props?.data).toEqual([1, 2, 3])
  })

  it('survives a direct call', () => {
    // Already worked; must keep working.
    const { Chart, seen } = capture()

    render(Div({ children: [Chart({ props: { height: 500, data: [1] } })] }).render() as never)

    expect(seen.props?.height).toBe(500)
  })

  it('still classifies top-level CSS props into a className', () => {
    // The other half of the contract: a CSS-named value passed at the top level
    // must still be classified as a style, alongside a shielded one.
    //
    // For a component target that style arrives as a `className` prop, which the
    // component then has to apply — MeoNode cannot put a class on markup it does
    // not own. This component ignores it, so nothing appears in the output; what
    // matters here is that `padding` was converted and `height` was not.
    const { Chart, seen } = capture()

    // Cast is deliberate and marks a *separate*, still-open gap: the runtime
    // accepts a top-level CSS prop on a component node and hands it down as a
    // className, and the usage docs describe that — but
    // `ValidateComponentProps` maps any prop outside the component's own to
    // `never`, so it does not type-check. Fixing that is a different change
    // from the `props` shield, and is not attempted here.
    render(Node(Chart, { padding: '20px', props: { height: 1, data: [] } } as never).render() as never)

    expect(seen.props?.height).toBe(1)
    expect(seen.props?.padding).toBeUndefined()
    expect(seen.props?.className).toMatch(/css-/)
  })

  it('leaves intrinsic elements alone', () => {
    // `props` on a DOM element still means native attributes.
    const { container } = render(Div({ props: { id: 'native' }, children: 'x' }).render() as never)

    expect(container.querySelector('#native')).not.toBeNull()
  })
})
