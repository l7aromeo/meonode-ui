'use strict'
import type { NodeElement, NodeProps } from '@src/node.type.js'
import { Node } from '@src/core.node.js'

// Layout components

/**
 * Represents a div element.
 * @param props Optional properties for the div element.
 * @returns A div element node.
 */
export const Div = (props?: NodeProps<'div'>) => Node('div', props)

/**
 * Represents a root div element with full viewport dimensions and column flex layout.
 * By default, applies flex column layout and 100% viewport dimensions.
 * @param props Optional properties for the root div element that merge with defaults.
 * @returns A div element node configured as root container.
 * @example
 * Root({
 *   backgroundColor: 'white',
 *   children: [Header(), Main(), Footer()]
 * })
 */
export const Root = (props?: NodeProps<'div'>) =>
  Div({
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    minWidth: '100vw',
    ...props,
  })

/**
 * Represents a column layout using flexbox.
 * @param props Optional properties for the column layout.
 * @returns A div element node with flexbox column layout.
 */
export const Column = (props?: NodeProps<'div'>) => Div({ display: 'flex', flexDirection: 'column', ...props })

/**
 * Represents a row layout using flexbox.
 * @param props Optional properties for the row layout.
 * @returns A div element node with flexbox row layout.
 */
export const Row = (props?: NodeProps<'div'>) => Div({ display: 'flex', flexDirection: 'row', ...props })

/**
 * Represents a grid layout.
 * @param props Optional properties for the grid layout.
 * @returns A div element node with grid layout.
 */
export const Grid = (props?: NodeProps<'div'>) => Div({ display: 'grid', ...props })

/**
 * Represents a centered container with flexbox alignment.
 * By default, centers content both horizontally and vertically.
 * @param props Optional properties for the div element.
 * @returns A div element node configured for centered content.
 */
export const Center = (props?: NodeProps<'div'>) =>
  Div({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    verticalAlign: 'middle',
    ...props,
  })

/**
 * Represents a fixed positioned element.
 * @param props Optional properties for the fixed positioned element.
 * @returns A div element node with fixed positioning.
 */
export const Fixed = (props?: NodeProps<'div'>) => Div({ position: 'fixed', ...props })

/**
 * Represents a relatively positioned element.
 * @param props Optional properties for the relatively positioned element.
 * @returns A div element node with relative positioning.
 */
export const Relative = (props?: NodeProps<'div'>) => Div({ position: 'relative', ...props })

/**
 * Represents an absolutely positioned element.
 * @param props Optional properties for the absolutely positioned element.
 * @returns A div element node with absolute positioning.
 */
export const Absolute = (props?: NodeProps<'div'>) => Div({ position: 'absolute', ...props })

/**
 * Represents a sticky positioned element.
 * @param props Optional properties for the sticky positioned element.
 * @returns A div element node with sticky positioning.
 */
export const Sticky = (props?: NodeProps<'div'>) => Div({ position: 'sticky', ...props })

/**
 * Represents a statically positioned element.
 * @param props Optional properties for the statically positioned element.
 * @returns A div element node with static positioning.
 */
export const Static = (props?: NodeProps<'div'>) => Div({ position: 'static', ...props })

// Typography

/**
 * Creates an h1 heading element node.
 * @param children The content to be rendered within the element (text, numbers, components, etc) for the heading.
 * @param props Optional properties for the h1 element.
 * @returns An h1 element node.
 */
export const H1 = (children: NodeElement, props?: Omit<NodeProps<'h1'>, 'children'>) =>
  Node('h1', {
    ...props,
    children,
  })

/**
 * Creates an h2 heading element node.
 * @param children The content to be rendered within the element (text, numbers, components, etc) for the heading.
 * @param props Optional properties for the h2 element.
 * @returns An h2 element node.
 */
export const H2 = (children: NodeElement, props?: Omit<NodeProps<'h2'>, 'children'>) =>
  Node('h2', {
    ...props,
    children,
  })

/**
 * Creates an h3 heading element node.
 * @param children The content to be rendered within the element (text, numbers, components, etc) for the heading.
 * @param props Optional properties for the h3 element.
 * @returns An h3 element node.
 */
export const H3 = (children: NodeElement, props?: Omit<NodeProps<'h3'>, 'children'>) =>
  Node('h3', {
    ...props,
    children,
  })

/**
 * Creates an h4 heading element node.
 * @param children The content to be rendered within the element (text, numbers, components, etc) for the heading.
 * @param props Optional properties for the h4 element.
 * @returns An h4 element node.
 */
export const H4 = (children: NodeElement, props?: Omit<NodeProps<'h4'>, 'children'>) =>
  Node('h4', {
    ...props,
    children,
  })

/**
 * Creates an h5 heading element node.
 * @param children The content to be rendered within the element (text, numbers, components, etc) for the heading.
 * @param props Optional properties for the h5 element.
 * @returns An h5 element node.
 */
export const H5 = (children: NodeElement, props?: Omit<NodeProps<'h5'>, 'children'>) =>
  Node('h5', {
    ...props,
    children,
  })

/**
 * Creates an h6 heading element node.
 * @param children The content to be rendered within the element (text, numbers, components, etc) for the heading.
 * @param props Optional properties for the h6 element.
 * @returns An h6 element node.
 */
export const H6 = (children: NodeElement, props?: Omit<NodeProps<'h6'>, 'children'>) =>
  Node('h6', {
    ...props,
    children,
  })

/**
 * Creates a strong element node for important text.
 * @param children The content to be rendered within the element (text, numbers, components, etc) to emphasize.
 * @param props Optional properties for the strong element.
 * @returns A strong element node.
 */
export const Strong = (children: NodeElement, props?: Omit<NodeProps<'strong'>, 'children'>) =>
  Node('strong', {
    ...props,
    children,
  })

/**
 * Creates an em element node for emphasized text.
 * @param children The content to be rendered within the element (text, numbers, components, etc) to emphasize.
 * @param props Optional properties for the em element.
 * @returns An em element node.
 */
export const Em = (children: NodeElement, props?: Omit<NodeProps<'em'>, 'children'>) =>
  Node('em', {
    ...props,
    children,
  })

/**
 * Creates a small element node for side-comments and small print.
 * @param children The content to be rendered within the element (text, numbers, components, etc).
 * @param props Optional properties for styling and configuring the small element.
 * @returns A small element node that can be rendered in React.
 */
export const Small = (children: NodeElement, props?: Omit<NodeProps<'small'>, 'children'>) =>
  Node('small', {
    ...props,
    children,
  })

/**
 * Creates a mark element node for highlighted text.
 * @param children The content to be rendered within the element (text, numbers, components, etc) to highlight.
 * @param props Optional properties for the mark element.
 * @returns A mark element node.
 */
export const Mark = (children: NodeElement, props?: Omit<NodeProps<'mark'>, 'children'>) =>
  Node('mark', {
    ...props,
    children,
  })

/**
 * Creates a span element node.
 * @param children The content to be rendered within the element (text, numbers, components, etc) for the span.
 * @param props Optional properties for the span element.
 * @returns A span element node.
 */
export const Span = (children: NodeElement, props?: Omit<NodeProps<'span'>, 'children'>) =>
  Node('span', {
    ...props,
    children,
  })

/**
 * Creates a paragraph element node.
 * @param children The content to be rendered within the element (text, numbers, components, etc) for the paragraph.
 * @param props Optional properties for the p element.
 * @returns A paragraph element node.
 */
export const P = (children: NodeElement, props?: Omit<NodeProps<'p'>, 'children'>) =>
  Node('p', {
    ...props,
    children,
  })

/**
 * Creates a preformatted text element node.
 * @param children The content to be rendered within the element (text, numbers, components, etc) for the pre element.
 * @param props Optional properties for the pre element.
 * @returns A pre element node.
 */
export const Pre = (children: NodeElement, props?: Omit<NodeProps<'pre'>, 'children'>) =>
  Node('pre', {
    ...props,
    children,
  })

/**
 * Creates a code element node for displaying code snippets.
 * @param children The content to be rendered within the element (text, numbers, components, etc) for the code.
 * @param props Optional properties for the code element.
 * @returns A code element node.
 */
export const Code = (children: NodeElement, props?: Omit<NodeProps<'code'>, 'children'>) =>
  Node('code', {
    ...props,
    children,
  })

/**
 * Represents a line break element.
 * @param props Optional properties for the br element.
 * @returns A br element node.
 */
export const Br = (props?: Omit<NodeProps<'br'>, 'children'>) => Node('br', props)

// Lists

/**
 * Represents an ordered list.
 * @param props Optional properties for the ol element.
 * @returns An ol element node.
 */
export const Ol = (props?: NodeProps<'ol'>) => Node('ol', props)

/**
 * Represents an unordered list.
 * @param props Optional properties for the ul element.
 * @returns A ul element node.
 */
export const Ul = (props?: NodeProps<'ul'>) => Node('ul', props)

/**
 * Represents a list item.
 * @param props Optional properties for the li element.
 * @returns An li element node.
 */
export const Li = (props?: NodeProps<'li'>) => Node('li', props)

/**
 * Represents a description list.
 * @param props Optional properties for the dl element.
 * @returns A dl element node.
 */
export const Dl = (props?: NodeProps<'dl'>) => Node('dl', props)

/**
 * Represents a term in a description list.
 * @param props Optional properties for the dt element.
 * @returns A dt element node.
 */
export const Dt = (props?: NodeProps<'dt'>) => Node('dt', props)

/**
 * Represents a description in a description list.
 * @param props Optional properties for the dd element.
 * @returns A dd element node.
 */
export const Dd = (props?: NodeProps<'dd'>) => Node('dd', props)

// Forms and inputs

/**
 * Represents an HTML form.
 * @param props Optional properties for the form element.
 * @returns A form element node.
 */
export const Form = (props?: NodeProps<'form'>) => Node('form', props)

/**
 * Represents a label for an input element.
 * @param props Optional properties for the label element.
 * @returns A label element node.
 */
export const Label = (props?: NodeProps<'label'>) => Node('label', props)

/**
 * Represents an input element.
 * @param props Optional properties for the input element.
 * @returns An input element node.
 */
export const Input = (props?: Omit<NodeProps<'input'>, 'children'>) => Node('input', props)

/**
 * Creates a button element node.
 * @param children The content to be rendered within the element (text, numbers, components, etc) for the button.
 * @param props Optional properties for the button element.
 * @returns A button element node.
 */
export const Button = (children: NodeElement, props?: Omit<NodeProps<'button'>, 'children'>) =>
  Node('button', {
    ...props,
    children,
  })

/**
 * Represents a textarea element for multiline text input.
 * @param props Optional properties for the textarea element.
 * @returns A textarea element node.
 */
export const Textarea = (props?: NodeProps<'textarea'>) => Node('textarea', props)

/**
 * Represents a select dropdown element.
 * @param props Optional properties for the select element.
 * @returns A select element node.
 */
export const Select = (props?: NodeProps<'select'>) => Node('select', props)

/**
 * Represents an option within a select element.
 * @param children The content to be rendered within the element (text, numbers, components, etc) for the option.
 * @param props Optional properties for the option element.
 * @returns An option element node.
 */
export const Option = (children: NodeElement, props?: Omit<NodeProps<'option'>, 'children'>) =>
  Node('option', {
    ...props,
    children,
  })

/**
 * Represents a fieldset element for grouping form elements.
 * @param props Optional properties for the fieldset element.
 * @returns A fieldset element node.
 */
export const Fieldset = (props?: NodeProps<'fieldset'>) => Node('fieldset', props)

/**
 * Represents a legend for a fieldset.
 * @param children The content to be rendered within the element (text, numbers, components, etc) for the legend.
 * @param props Optional properties for the legend element.
 * @returns A legend element node.
 */
export const Legend = (children: NodeElement, props?: Omit<NodeProps<'legend'>, 'children'>) =>
  Node('legend', {
    ...props,
    children,
  })

/**
 * Represents an option group within a select element.
 * @param props Optional properties for the optgroup element.
 * @returns An optgroup element node.
 */
export const Optgroup = (props?: NodeProps<'optgroup'>) => Node('optgroup', props)

// Tables

/**
 * Represents a table element.
 * @param props Optional properties for the table element.
 * @returns A table element node.
 */
export const Table = (props?: NodeProps<'table'>) => Node('table', props)

/**
 * Represents a table header section.
 * @param props Optional properties for the thead element.
 * @returns A thead element node.
 */
export const Thead = (props?: NodeProps<'thead'>) => Node('thead', props)

/**
 * Represents a table body section.
 * @param props Optional properties for the tbody element.
 * @returns A tbody element node.
 */
export const Tbody = (props?: NodeProps<'tbody'>) => Node('tbody', props)

/**
 * Represents a table footer section.
 * @param props Optional properties for the tfoot element.
 * @returns A tfoot element node.
 */
export const Tfoot = (props?: NodeProps<'tfoot'>) => Node('tfoot', props)

/**
 * Represents a table row.
 * @param props Optional properties for the tr element.
 * @returns A tr element node.
 */
export const Tr = (props?: NodeProps<'tr'>) => Node('tr', props)

/**
 * Represents a table header cell.
 * @param props Optional properties for the th element.
 * @returns A th element node.
 */
export const Th = (props?: NodeProps<'th'>) => Node('th', props)

/**
 * Represents a table data cell.
 * @param props Optional properties for the td element.
 * @returns A td element node.
 */
export const Td = (props?: NodeProps<'td'>) => Node('td', props)

/**
 * Represents a table caption.
 * @param children The content to be rendered within the element (text, numbers, components, etc) for the caption.
 * @param props Optional properties for the caption element.
 * @returns A caption element node.
 */
export const Caption = (children: NodeElement, props?: Omit<NodeProps<'caption'>, 'children'>) =>
  Node('caption', {
    ...props,
    children,
  })

/**
 * Represents a table column group.
 * @param props Optional properties for the colgroup element.
 * @returns A colgroup element node.
 */
export const Colgroup = (props?: NodeProps<'colgroup'>) => Node('colgroup', props)

/**
 * Represents a table column.
 * @param props Optional properties for the col element.
 * @returns A col element node.
 */
export const Col = (props?: Omit<NodeProps<'col'>, 'children'>) => Node('col', props)

// Media elements

/**
 * Represents an image element.
 * @param props Optional properties for the img element.
 * @returns An img element node.
 */
export const Img = (props?: Omit<NodeProps<'img'>, 'children'>) => Node('img', props)

/**
 * Represents a video element.
 * @param props Optional properties for the video element.
 * @returns A video element node.
 */
export const Video = (props?: NodeProps<'video'>) => Node('video', props)

/**
 * Represents an audio element.
 * @param props Optional properties for the audio element.
 * @returns An audio element node.
 */
export const Audio = (props?: NodeProps<'audio'>) => Node('audio', props)

/**
 * Represents a picture element.
 * @param props Optional properties for the picture element.
 * @returns A picture element node.
 */
export const Picture = (props?: NodeProps<'picture'>) => Node('picture', props)

/**
 * Represents a source element.
 * @param props Optional properties for the source element.
 * @returns A source element node.
 */
export const Source = (props?: Omit<NodeProps<'source'>, 'children'>) => Node('source', props)

/**
 * Represents a text track element.
 * @param props Optional properties for the track element.
 * @returns A track element node.
 */
export const Track = (props?: Omit<NodeProps<'track'>, 'children'>) => Node('track', props)

/**
 * Represents a canvas element.
 * @param props Optional properties for the canvas element.
 * @returns A canvas element node.
 */
export const Canvas = (props?: NodeProps<'canvas'>) => Node('canvas', props)

/**
 * Represents an iframe element.
 * @param props Optional properties for the iframe element.
 * @returns An iframe element node.
 */
export const Iframe = (props?: NodeProps<'iframe'>) => Node('iframe', props)

// SVG elements

/**
 * Represents an SVG container element.
 * @param props Optional properties for the svg element.
 * @returns An svg element node.
 */
export const Svg = (props?: NodeProps<'svg'>) => Node('svg', props)

/**
 * Represents an SVG path element.
 * @param props Optional properties for the path element.
 * @returns A path element node.
 */
export const SvgPath = (props?: NodeProps<'path'>) => Node('path', props)

/**
 * Represents an SVG circle element.
 * @param props Optional properties for the circle element.
 * @returns A circle element node.
 */
export const SvgCircle = (props?: NodeProps<'circle'>) => Node('circle', props)

/**
 * Represents an SVG ellipse element.
 * @param props Optional properties for the ellipse element.
 * @returns An ellipse element node.
 */
export const SvgEllipse = (props?: NodeProps<'ellipse'>) => Node('ellipse', props)

/**
 * Represents an SVG line element.
 * @param props Optional properties for the line element.
 * @returns A line element node.
 */
export const SvgLine = (props?: NodeProps<'line'>) => Node('line', props)

/**
 * Represents an SVG polyline element.
 * @param props Optional properties for the polyline element.
 * @returns A polyline element node.
 */
export const SvgPolyline = (props?: NodeProps<'polyline'>) => Node('polyline', props)

/**
 * Represents an SVG polygon element.
 * @param props Optional properties for the polygon element.
 * @returns A polygon element node.
 */
export const SvgPolygon = (props?: NodeProps<'polygon'>) => Node('polygon', props)

/**
 * Represents an SVG rectangle element.
 * @param props Optional properties for the rect element.
 * @returns A rect element node.
 */
export const SvgRect = (props?: NodeProps<'rect'>) => Node('rect', props)

/**
 * Represents an SVG use element.
 * @param props Optional properties for the use element.
 * @returns A use element node.
 */
export const SvgUse = (props?: NodeProps<'use'>) => Node('use', props)

/**
 * Represents an SVG definitions element.
 * @param props Optional properties for the defs element.
 * @returns A defs element node.
 */
export const SvgDefs = (props?: NodeProps<'defs'>) => Node('defs', props)

/**
 * Represents an SVG linear gradient element.
 * @param props Optional properties for the linearGradient element.
 * @returns A linearGradient element node.
 */
export const SvgLinearGradient = (props?: NodeProps<'linearGradient'>) => Node('linearGradient', props)

/**
 * Represents an SVG radial gradient element.
 * @param props Optional properties for the radialGradient element.
 * @returns A radialGradient element node.
 */
export const SvgRadialGradient = (props?: NodeProps<'radialGradient'>) => Node('radialGradient', props)

/**
 * Represents an SVG gradient stop element.
 * @param props Optional properties for the stop element.
 * @returns A stop element node.
 */
export const SvgStop = (props?: NodeProps<'stop'>) => Node('stop', props)

/**
 * Represents an SVG symbol element.
 * @param props Optional properties for the symbol element.
 * @returns A symbol element node.
 */
export const SvgSymbol = (props?: NodeProps<'symbol'>) => Node('symbol', props)

/**
 * Represents an SVG group element.
 * @param props Optional properties for the g element.
 * @returns A g element node.
 */
export const SvgG = (props?: NodeProps<'g'>) => Node('g', props)

/**
 * Represents an SVG text element.
 * @param props Optional properties for the text element.
 * @returns A text element node.
 */
export const SvgText = (props?: NodeProps<'text'>) => Node('text', props)

/**
 * Represents an SVG text span element.
 * @param props Optional properties for the tspan element.
 * @returns A tspan element node.
 */
export const SvgTspan = (props?: NodeProps<'tspan'>) => Node('tspan', props)

// Navigation and links

/**
 * Represents an anchor element.
 * @param props Optional properties for the a element.
 * @returns An a element node.
 */
export const A = (props?: NodeProps<'a'>) => Node('a', props)

/**
 * Represents a navigation element.
 * @param props Optional properties for the nav element.
 * @returns A nav element node.
 */
export const Nav = (props?: NodeProps<'nav'>) => Node('nav', props)

// Document structure

/**
 * Represents the body element of an HTML document.
 * @param props Optional properties for the body element.
 * @returns A body element node.
 */
export const Body = (props?: NodeProps<'body'>) => Node('body', props)

/**
 * Represents the main content of a document.
 * @param props Optional properties for the main element.
 * @returns A main element node.
 */
export const Main = (props?: NodeProps<'main'>) => Node('main', props)

/**
 * Represents a header element.
 * @param props Optional properties for the header element.
 * @returns A header element node.
 */
export const Header = (props?: NodeProps<'header'>) => Node('header', props)

/**
 * Represents a footer element.
 * @param props Optional properties for the footer element.
 * @returns A footer element node.
 */
export const Footer = (props?: NodeProps<'footer'>) => Node('footer', props)

/**
 * Represents an aside element.
 * @param props Optional properties for the aside element.
 * @returns An aside element node.
 */
export const Aside = (props?: NodeProps<'aside'>) => Node('aside', props)

/**
 * Represents a section element.
 * @param props Optional properties for the section element.
 * @returns A section element node.
 */
export const Section = (props?: NodeProps<'section'>) => Node('section', props)

/**
 * Represents an article element.
 * @param props Optional properties for the article element.
 * @returns An article element node.
 */
export const Article = (props?: NodeProps<'article'>) => Node('article', props)

/**
 * Represents a figure element.
 * @param props Optional properties for the figure element.
 * @returns A figure element node.
 */
export const Figure = (props?: NodeProps<'figure'>) => Node('figure', props)

/**
 * Represents a figure caption element.
 * @param children The content to be rendered within the element (text, numbers, components, etc) for the figcaption.
 * @param props Optional properties for the figcaption element.
 * @returns A figcaption element node.
 */
export const Figcaption = (children: NodeElement, props?: Omit<NodeProps<'figcaption'>, 'children'>) =>
  Node('figcaption', {
    ...props,
    children,
  })

/**
 * Represents a blockquote element.
 * @param props Optional properties for the blockquote element.
 * @returns A blockquote element node.
 */
export const Blockquote = (props?: NodeProps<'blockquote'>) => Node('blockquote', props)

/**
 * Represents an address element.
 * @param props Optional properties for the address element.
 * @returns An address element node.
 */
export const Address = (props?: NodeProps<'address'>) => Node('address', props)

/**
 * Represents a dialog element.
 * @param props Optional properties for the dialog element.
 * @returns A dialog element node.
 */
export const Dialog = (props?: NodeProps<'dialog'>) => Node('dialog', props)

/**
 * Represents a details element.
 * @param props Optional properties for the details element.
 * @returns A details element node.
 */
export const Details = (props?: NodeProps<'details'>) => Node('details', props)

/**
 * Represents a summary element for a details disclosure box.
 * @param children The content to be rendered within the element (text, numbers, components, etc) for the summary.
 * @param props Optional properties for the summary element.
 * @returns A summary element node.
 */
export const Summary = (children: NodeElement, props?: Omit<NodeProps<'summary'>, 'children'>) =>
  Node('summary', {
    ...props,
    children,
  })

// Document head elements

/**
 * Represents a head element.
 * @param props Optional properties for the head element.
 * @returns A head element node.
 */
export const Head = (props?: NodeProps<'head'>) => Node('head', props)

/**
 * Represents the root HTML element.
 * @param props Optional properties for the HTML element.
 * @returns An HTML element node.
 */
export const Html = (props?: NodeProps<'html'>) => Node('html', props)

/**
 * Represents a meta element.
 * @param props Optional properties for the meta element.
 * @returns A meta element node.
 */
export const Meta = (props?: Omit<NodeProps<'meta'>, 'children'>) => Node('meta', props)

/**
 * Represents a link element.
 * @param props Optional properties for the link element.
 * @returns A link element node.
 */
export const Link = (props?: Omit<NodeProps<'link'>, 'children'>) => Node('link', props)

/**
 * Represents a style element. Its content should be CSS text.
 * @param cssText Optional CSS code as a string.
 * @param props Optional properties for the style element.
 * @returns A style element node.
 */
export const Style = (cssText?: string, props?: Omit<NodeProps<'style'>, 'children'>) =>
  Node('style', {
    ...props,
    children: cssText,
  })

/**
 * Represents a script element. For inline scripts, its content should be JavaScript text.
 * @param scriptContent Optional JavaScript code as a string for inline scripts.
 * @param props Optional properties for the script element (e.g., src, type, async, defer).
 * @returns A script element node.
 */
export const Script = (scriptContent?: string, props?: Omit<NodeProps<'script'>, 'children'>) =>
  Node('script', {
    ...props,
    children: scriptContent,
  })

/**
 * Creates a title element node for document head title.
 * @param children The content to be rendered within the element (text, numbers, components, etc) for the title.
 * @param props Optional properties for the title element.
 * @returns A title element node.
 */
export const Title = (children: NodeElement, props?: Omit<NodeProps<'title'>, 'children'>) =>
  Node('title', {
    ...props,
    children,
  })

/**
 * Represents a base element.
 * @param props Optional properties for the base element.
 * @returns A base element node.
 */
export const Base = (props?: Omit<NodeProps<'base'>, 'children'>) => Node('base', props)

// --- Additional Text-Level Semantics ---

/**
 * Represents an abbreviation or acronym.
 * @param children The content to be rendered within the element (text, numbers, components, etc) for the abbreviation.
 * @param props Optional properties for the abbr element.
 * @returns An abbr element node.
 */
export const Abbr = (children: NodeElement, props?: Omit<NodeProps<'abbr'>, 'children'>) =>
  Node('abbr', {
    ...props,
    children,
  })

/**
 * Represents text that should be stylistically offset from normal prose (traditionally bold).
 * @param children The content to be rendered within the element (text, numbers, components, etc).
 * @param props Optional properties for the b element.
 * @returns A b element node.
 */
export const B = (children: NodeElement, props?: Omit<NodeProps<'b'>, 'children'>) =>
  Node('b', {
    ...props,
    children,
  })

/**
 * Represents text that is isolated from its surroundings for bidirectional text formatting.
 * @param children The content to be rendered within the element (text, numbers, components, etc).
 * @param props Optional properties for the bdi element.
 * @returns A bdi element node.
 */
export const Bdi = (children: NodeElement, props?: Omit<NodeProps<'bdi'>, 'children'>) =>
  Node('bdi', {
    ...props,
    children,
  })

/**
 * Overrides the current text directionality.
 * @param children The content to be rendered within the element (text, numbers, components, etc).
 * @param props Optional properties for the bdo element.
 * @returns A bdo element node.
 */
export const Bdo = (children: NodeElement, props?: Omit<NodeProps<'bdo'>, 'children'>) =>
  Node('bdo', {
    ...props,
    children,
  })

/**
 * Represents the title of a work (e.g., a book, a song, an essay).
 * @param children The content to be rendered within the element (text, numbers, components, etc) for the citation.
 * @param props Optional properties for the cite element.
 * @returns A cite element node.
 */
export const Cite = (children: NodeElement, props?: Omit<NodeProps<'cite'>, 'children'>) =>
  Node('cite', {
    ...props,
    children,
  })

/**
 * Links a piece of content with a machine-readable translation.
 * @param children The content to be rendered within the element (text, numbers, components, etc).
 * @param props Optional properties for the data element.
 * @returns A data element node.
 */
export const Data = (children: NodeElement, props?: Omit<NodeProps<'data'>, 'children'>) =>
  Node('data', {
    ...props,
    children,
  })

/**
 * Represents a definition of a term.
 * @param children The content to be rendered within the element (text, numbers, components, etc) for the definition.
 * @param props Optional properties for the dfn element.
 * @returns A dfn element node.
 */
export const Dfn = (children: NodeElement, props?: Omit<NodeProps<'dfn'>, 'children'>) =>
  Node('dfn', {
    ...props,
    children,
  })

/**
 * Represents text in an alternate voice or mood (traditionally italic).
 * @param children The content to be rendered within the element (text, numbers, components, etc).
 * @param props Optional properties for the i element.
 * @returns An i element node.
 */
export const I = (children: NodeElement, props?: Omit<NodeProps<'i'>, 'children'>) =>
  Node('i', {
    ...props,
    children,
  })

/**
 * Represents user input (typically keyboard input).
 * @param children The content to be rendered within the element (text, numbers, components, etc) representing keyboard input.
 * @param props Optional properties for the kbd element.
 * @returns A kbd element node.
 */
export const Kbd = (children: NodeElement, props?: Omit<NodeProps<'kbd'>, 'children'>) =>
  Node('kbd', {
    ...props,
    children,
  })

/**
 * Represents an inline quotation.
 * @param children The content to be rendered within the element (text, numbers, components, etc) for the quotation.
 * @param props Optional properties for the q element.
 * @returns A q element node.
 */
export const Q = (children: NodeElement, props?: Omit<NodeProps<'q'>, 'children'>) =>
  Node('q', {
    ...props,
    children,
  })

/**
 * Represents fallback parenthesis for ruby annotations.
 * @param children The content to be rendered within the element (text, numbers, components, etc).
 * @param props Optional properties for the rp element.
 * @returns An rp element node.
 */
export const Rp = (children: NodeElement, props?: Omit<NodeProps<'rp'>, 'children'>) =>
  Node('rp', {
    ...props,
    children,
  })

/**
 * Represents the ruby text component of a ruby annotation.
 * @param children The content to be rendered within the element (text, numbers, components, etc).
 * @param props Optional properties for the rt element.
 * @returns An rt element node.
 */
export const Rt = (children: NodeElement, props?: Omit<NodeProps<'rt'>, 'children'>) =>
  Node('rt', {
    ...props,
    children,
  })

/**
 * Represents a ruby annotation.
 * @param props Optional properties for the ruby element.
 * @returns A ruby element node.
 */
export const Ruby = (props?: NodeProps<'ruby'>) => Node('ruby', props)

/**
 * Represents text that is no longer accurate or relevant (strikethrough).
 * @param children The content to be rendered within the element (text, numbers, components, etc) to be struck through.
 * @param props Optional properties for the s element.
 * @returns An s element node.
 */
export const S = (children: NodeElement, props?: Omit<NodeProps<'s'>, 'children'>) =>
  Node('s', {
    ...props,
    children,
  })

/**
 * Represents sample output from a computer program.
 * @param children The content to be rendered within the element (text, numbers, components, etc) representing sample output.
 * @param props Optional properties for the samp element.
 * @returns A samp element node.
 */
export const Samp = (children: NodeElement, props?: Omit<NodeProps<'samp'>, 'children'>) =>
  Node('samp', {
    ...props,
    children,
  })

/**
 * Represents subscript text.
 * @param children The content to be rendered within the element (text, numbers, components, etc) for the subscript.
 * @param props Optional properties for the sub element.
 * @returns A sub element node.
 */
export const Sub = (children: NodeElement, props?: Omit<NodeProps<'sub'>, 'children'>) =>
  Node('sub', {
    ...props,
    children,
  })

/**
 * Represents superscript text.
 * @param children The content to be rendered within the element (text, numbers, components, etc) for the superscript.
 * @param props Optional properties for the sup element.
 * @returns A sup element node.
 */
export const Sup = (children: NodeElement, props?: Omit<NodeProps<'sup'>, 'children'>) =>
  Node('sup', {
    ...props,
    children,
  })

/**
 * Represents a specific period in time or a date.
 * @param children The content to be rendered within the element (text, numbers, components, etc) representing the time/date.
 * @param props Optional properties for the time element.
 * @returns A time element node.
 */
export const Time = (children: NodeElement, props?: Omit<NodeProps<'time'>, 'children'>) =>
  Node('time', {
    ...props,
    children,
  })

/**
 * Represents text that should be rendered with an unarticulated, non-textual annotation (traditionally underline).
 * @param children The content to be rendered within the element (text, numbers, components, etc) to be underlined.
 * @param props Optional properties for the u element.
 * @returns A u element node.
 */
export const U = (children: NodeElement, props?: Omit<NodeProps<'u'>, 'children'>) =>
  Node('u', {
    ...props,
    children,
  })

/**
 * Represents a variable in a mathematical expression or programming context.
 * @param children The content to be rendered within the element (text, numbers, components, etc) representing a variable.
 * @param props Optional properties for the var element.
 * @returns A var element node.
 */
export const Var = (children: NodeElement, props?: Omit<NodeProps<'var'>, 'children'>) =>
  Node('var', {
    ...props,
    children,
  })

/**
 * Represents a word break opportunity. This is a void element.
 * @param props Optional properties for the wbr element.
 * @returns A wbr element node.
 */
export const Wbr = (props?: Omit<NodeProps<'wbr'>, 'children'>) => Node('wbr', props)

// --- Additional Grouping Content ---

/**
 * Represents a thematic break between paragraph-level elements (e.g., a scene change in a story, or a shift of topic). This is a void element.
 * @param props Optional properties for the hr element.
 * @returns An hr element node.
 */
export const Hr = (props?: Omit<NodeProps<'hr'>, 'children'>) => Node('hr', props)

/**
 * Represents a group of commands that a user can perform or activate.
 * @param props Optional properties for the menu element.
 * @returns A menu element node.
 */
export const Menu = (props?: NodeProps<'menu'>) => Node('menu', props)

/**
 * Represents the parts of a document or application that contain search or filtering controls.
 * @param props Optional properties for the search element.
 * @returns A search element node.
 */
export const Search = (props?: NodeProps<'search'>) => Node('search', props)

// --- Additional Embedded Content ---

/**
 * Represents an integration point for an external application or interactive content (a plug-in). This is a void element.
 * @param props Optional properties for the embed element.
 * @returns An embed element node.
 */
export const Embed = (props?: Omit<NodeProps<'embed'>, 'children'>) => Node('embed', props)

/**
 * Represents an external resource, which can be treated as an image, a nested browsing context, or content to be handled by a plugin.
 * @param props Optional properties for the object element.
 * @returns An object element node.
 */
export const ObjectElement = (props?: NodeProps<'object'>) => Node('object', props) // Renamed to ObjectElement to avoid conflict with JavaScript's Object

/**
 * Defines parameters for an <object> element. This is a void element.
 * @param props Optional properties for the param element.
 * @returns A param element node.
 */
export const Param = (props?: Omit<NodeProps<'param'>, 'children'>) => Node('param', props)

/**
 * Represents an image map, with clickable areas.
 * @param props Optional properties for the map element.
 * @returns A map element node.
 */
export const MapElement = (props?: NodeProps<'map'>) => Node('map', props) // Renamed to MapElement to avoid conflict with JavaScript's Map

/**
 * Defines a client-side image map area. This is a void element.
 * @param props Optional properties for the area element.
 * @returns An area element node.
 */
export const Area = (props?: Omit<NodeProps<'area'>, 'children'>) => Node('area', props)

// --- Additional Forms Elements ---

/**
 * Contains a set of <option> elements that represent predefined options for other controls.
 * @param props Optional properties for the datalist element.
 * @returns A datalist element node.
 */
export const Datalist = (props?: NodeProps<'datalist'>) => Node('datalist', props)

/**
 * Represents the result of a calculation or user action.
 * @param props Optional properties for the output element.
 * @returns An output element node.
 */
export const Output = (props?: NodeProps<'output'>) => Node('output', props)

/**
 * Displays an indicator showing the completion progress of a task, typically displayed as a progress bar.
 * @param props Optional properties for the progress element.
 * @returns A progress element node.
 */
export const Progress = (props?: NodeProps<'progress'>) => Node('progress', props)

/**
 * Represents either a scalar value within a known range or a fractional value.
 * @param props Optional properties for the meter element.
 * @returns A meter element node.
 */
export const Meter = (props?: NodeProps<'meter'>) => Node('meter', props)

// --- Additional Scripting & Document Elements ---

/**
 * Defines a section of HTML to be inserted if a script type on the page is unsupported or if scripting is currently turned off in the browser.
 * @param props Optional properties for the noscript element.
 * @returns A noscript element node.
 */
export const Noscript = (props?: NodeProps<'noscript'>) => Node('noscript', props)

/**
 * A mechanism for holding HTML that is not to be rendered immediately when a page is loaded but may be instantiated subsequently during runtime using JavaScript.
 * @param props Optional properties for the template element.
 * @returns A template element node.
 */
export const Template = (props?: NodeProps<'template'>) => Node('template', props)

// --- Additional Sections Elements ---

/**
 * Represents a heading group. It is used to group a set of <h1>–<h6> elements.
 * @param props Optional properties for the hgroup element.
 * @returns An hgroup element node.
 */
export const Hgroup = (props?: NodeProps<'hgroup'>) => Node('hgroup', props)
