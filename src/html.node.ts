'use strict'
import type { NodeProps } from '@src/node.type.js'
import { Node } from '@src/core.node.js'

// Basic HTML elements

/**
 * Represents the root HTML element.
 * @param props Optional properties for the HTML element.
 * @returns An HTML element node.
 */
export const Html = (props?: NodeProps<'html'>) => Node('html', props)

/**
 * Represents the body element of an HTML document.
 * @param props Optional properties for the body element.
 * @returns A body element node.
 */
export const Body = (props?: NodeProps<'body'>) => Node('body', props)

/**
 * Represents a div element.
 * @param props Optional properties for the div element.
 * @returns A div element node.
 */
export const Div = (props?: NodeProps<'div'>) => Node('div', props)

// Layout components

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
 * Represents the main content of a document.
 * @param props Optional properties for the main element.
 * @returns A main element node.
 */
export const Main = (props?: NodeProps<'main'>) => Node('main', props)

/**
 * Represents a centered layout using flexbox.
 * @param props Optional properties for the centered layout.
 * @returns A div element node with centered flexbox layout.
 */
export const Center = (props?: NodeProps<'div'>) =>
  Div({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...props,
  })

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
 * @param text Optional text, number or bigint content for the heading.
 * @param props Optional properties for the h1 element.
 * @returns An h1 element node.
 */
export const H1 = (text?: string | number | bigint, props?: Omit<NodeProps<'h1'>, 'children'>) =>
  Node('h1', {
    ...props,
    children: text,
  })

/**
 * Creates an h2 heading element node.
 * @param text Optional text, number or bigint content for the heading.
 * @param props Optional properties for the h2 element.
 * @returns An h2 element node.
 */
export const H2 = (text?: string | number | bigint, props?: Omit<NodeProps<'h2'>, 'children'>) =>
  Node('h2', {
    ...props,
    children: text,
  })

/**
 * Creates an h3 heading element node.
 * @param text Optional text, number or bigint content for the heading.
 * @param props Optional properties for the h3 element.
 * @returns An h3 element node.
 */
export const H3 = (text?: string | number | bigint, props?: Omit<NodeProps<'h3'>, 'children'>) =>
  Node('h3', {
    ...props,
    children: text,
  })

/**
 * Creates an h4 heading element node.
 * @param text Optional text, number or bigint content for the heading.
 * @param props Optional properties for the h4 element.
 * @returns An h4 element node.
 */
export const H4 = (text?: string | number | bigint, props?: Omit<NodeProps<'h4'>, 'children'>) =>
  Node('h4', {
    ...props,
    children: text,
  })

/**
 * Creates an h5 heading element node.
 * @param text Optional text, number or bigint content for the heading.
 * @param props Optional properties for the h5 element.
 * @returns An h5 element node.
 */
export const H5 = (text?: string | number | bigint, props?: Omit<NodeProps<'h5'>, 'children'>) =>
  Node('h5', {
    ...props,
    children: text,
  })

/**
 * Creates an h6 heading element node.
 * @param text Optional text, number or bigint content for the heading.
 * @param props Optional properties for the h6 element.
 * @returns An h6 element node.
 */
export const H6 = (text?: string | number | bigint, props?: Omit<NodeProps<'h6'>, 'children'>) =>
  Node('h6', {
    ...props,
    children: text,
  })

/**
 * Creates a strong element node for important text.
 * @param text Optional text, number or bigint content to emphasize.
 * @param props Optional properties for the strong element.
 * @returns A strong element node.
 */
export const Strong = (text?: string | number | bigint, props?: Omit<NodeProps<'strong'>, 'children'>) =>
  Node('strong', {
    ...props,
    children: text,
  })

/**
 * Creates an em element node for emphasized text.
 * @param text Optional text, number or bigint content to emphasize.
 * @param props Optional properties for the em element.
 * @returns An em element node.
 */
export const Em = (text?: string | number | bigint, props?: Omit<NodeProps<'em'>, 'children'>) =>
  Node('em', {
    ...props,
    children: text,
  })

/**
 * Creates a small element node for side-comments and small print.
 * @param text Optional text, number or bigint content to display smaller.
 * @param props Optional properties for the small element.
 * @returns A small element node.
 */
export const Small = (text?: string | number | bigint, props?: Omit<NodeProps<'small'>, 'children'>) =>
  Node('small', {
    ...props,
    children: text,
  })

/**
 * Creates a mark element node for highlighted text.
 * @param text Optional text, number or bigint content to highlight.
 * @param props Optional properties for the mark element.
 * @returns A mark element node.
 */
export const Mark = (text?: string | number | bigint, props?: Omit<NodeProps<'mark'>, 'children'>) =>
  Node('mark', {
    ...props,
    children: text,
  })

/**
 * Creates a span element node.
 * @param text Optional text, number or bigint content for the span.
 * @param props Optional properties for the span element.
 * @returns A span element node.
 */
export const Span = (text?: string | number | bigint, props?: Omit<NodeProps<'span'>, 'children'>) =>
  Node('span', {
    ...props,
    children: text,
  })

/**
 * Creates a paragraph element node.
 * @param text Optional text, number or bigint content for the paragraph.
 * @param props Optional properties for the p element.
 * @returns A paragraph element node.
 */
export const P = (text?: string | number | bigint, props?: Omit<NodeProps<'p'>, 'children'>) =>
  Node('p', {
    ...props,
    children: text,
  })

/**
 * Creates a preformatted text element node.
 * @param text Optional text, number or bigint content for the pre element.
 * @param props Optional properties for the pre element.
 * @returns A pre element node.
 */
export const Pre = (text?: string | number | bigint, props?: Omit<NodeProps<'pre'>, 'children'>) =>
  Node('pre', {
    ...props,
    children: text,
  })

/**
 * Creates a code element node for displaying code snippets.
 * @param text Optional text, number or bigint content for the code.
 * @param props Optional properties for the code element.
 * @returns A code element node.
 */
export const Code = (text?: string | number | bigint, props?: Omit<NodeProps<'code'>, 'children'>) =>
  Node('code', {
    ...props,
    children: text,
  })

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
export const Input = (props?: NodeProps<'input'>) => Node('input', props)

/**
 * Represents a button element.
 * @param props Optional properties for the button element.
 * @returns A button element node.
 */
export const Button = (props?: NodeProps<'button'>) => Node('button', props)

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
 * @param props Optional properties for the option element.
 * @returns An option element node.
 */
export const Option = (props?: NodeProps<'option'>) => Node('option', props)

/**
 * Represents a fieldset element for grouping form elements.
 * @param props Optional properties for the fieldset element.
 * @returns A fieldset element node.
 */
export const Fieldset = (props?: NodeProps<'fieldset'>) => Node('fieldset', props)

/**
 * Represents a legend for a fieldset.
 * @param props Optional properties for the legend element.
 * @returns A legend element node.
 */
export const Legend = (props?: NodeProps<'legend'>) => Node('legend', props)

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
 * @param props Optional properties for the caption element.
 * @returns A caption element node.
 */
export const Caption = (props?: NodeProps<'caption'>) => Node('caption', props)

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
export const Col = (props?: NodeProps<'col'>) => Node('col', props)

// Media elements

/**
 * Represents an image element (alias for Img).
 * @param props Optional properties for the img element.
 * @returns An img element node.
 */
export const Image = (props?: NodeProps<'img'>) => Node('img', props)

/**
 * Represents an image element.
 * @param props Optional properties for the img element.
 * @returns An img element node.
 */
export const Img = (props?: NodeProps<'img'>) => Node('img', props)

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
export const Source = (props?: NodeProps<'source'>) => Node('source', props)

/**
 * Represents a text track element.
 * @param props Optional properties for the track element.
 * @returns A track element node.
 */
export const Track = (props?: NodeProps<'track'>) => Node('track', props)

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
 * @param props Optional properties for the figcaption element.
 * @returns A figcaption element node.
 */
export const Figcaption = (props?: NodeProps<'figcaption'>) => Node('figcaption', props)

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
 * Represents a summary element.
 * @param props Optional properties for the summary element.
 * @returns A summary element node.
 */
export const Summary = (props?: NodeProps<'summary'>) => Node('summary', props)

// Document head elements

/**
 * Represents a head element.
 * @param props Optional properties for the head element.
 * @returns A head element node.
 */
export const Head = (props?: NodeProps<'head'>) => Node('head', props)

/**
 * Represents a meta element.
 * @param props Optional properties for the meta element.
 * @returns A meta element node.
 */
export const Meta = (props?: NodeProps<'meta'>) => Node('meta', props)

/**
 * Represents a link element.
 * @param props Optional properties for the link element.
 * @returns A link element node.
 */
export const Link = (props?: NodeProps<'link'>) => Node('link', props)

/**
 * Represents a style element.
 * @param props Optional properties for the style element.
 * @returns A style element node.
 */
export const Style = (props?: NodeProps<'style'>) => Node('style', props)

/**
 * Represents a script element.
 * @param props Optional properties for the script element.
 * @returns A script element node.
 */
export const Script = (props?: NodeProps<'script'>) => Node('script', props)

/**
 * Represents a title element.
 * @param props Optional properties for the title element.
 * @returns A title element node.
 */
export const Title = (props?: NodeProps<'title'>) => Node('title', props)

/**
 * Represents a base element.
 * @param props Optional properties for the base element.
 * @returns A base element node.
 */
export const Base = (props?: NodeProps<'base'>) => Node('base', props)
