'use strict'
import { createNode, createChildrenFirstNode } from '@src/core.node.js'

// Layout components

/**
 * Represents a div element.
 * @param props Optional properties for the div element.
 * @returns A div element node.
 */
export const Div = createNode('div')

/**
 * Alias for \`Div(...)\`. Recommended for general-purpose container elements.
 *
 * **Example:**
 * ```typescript
 * Container({
 *   padding: 'theme.spacing.md',
 *   backgroundColor: 'lightgray',
 *   children: [H2('Welcome'), P('This is a container example.')]
 * })
 * ```
 */
export const Container = Div

/**
 * Represents a root div element with full viewport dimensions and column flex layout.
 * By default, applies flex column layout and 100% viewport dimensions.
 * @param props Optional properties for the root div element that merge with defaults.
 * @returns A div element node configured as root container.
 * @example
 * ```typescript
 * Root({
 *   backgroundColor: 'white',
 *   children: [Header(), Main(), Footer()]
 * })
 * ```
 */
export const Root = createNode('div', {
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100dvh',
  minWidth: '100dvw',
})

/**
 * Represents a column layout using flexbox.
 * @param props Optional properties for the column layout.
 * @returns A div element node with flexbox column layout.
 */
export const Column = createNode('div', {
  display: 'flex',
  flexDirection: 'column',
})

/**
 * Represents a row layout using flexbox.
 * @param props Optional properties for the row layout.
 * @returns A div element node with flexbox row layout.
 */
export const Row = createNode('div', {
  display: 'flex',
  flexDirection: 'row',
})

/**
 * Represents a grid layout.
 * @param props Optional properties for the grid layout.
 * @returns A div element node with grid layout.
 */
export const Grid = createNode('div', { display: 'grid' })

/**
 * Represents a centered container with flexbox alignment.
 * By default, centers content both horizontally and vertically.
 * @param props Optional properties for the div element.
 * @returns A div element node configured for centered content.
 */
export const Center = createNode('div', {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
})

/**
 * Represents a fixed positioned element.
 * @param props Optional properties for the fixed positioned element.
 * @returns A div element node with fixed positioning.
 */
export const Fixed = createNode('div', { position: 'fixed' })

/**
 * Represents a relatively positioned element.
 * @param props Optional properties for the relatively positioned element.
 * @returns A div element node with relative positioning.
 */
export const Relative = createNode('div', { position: 'relative' })

/**
 * Represents an absolutely positioned element.
 * @param props Optional properties for the absolutely positioned element.
 * @returns A div element node with absolute positioning.
 */
export const Absolute = createNode('div', { position: 'absolute' })

/**
 * Represents a sticky positioned element.
 * @param props Optional properties for the sticky positioned element.
 * @returns A div element node with sticky positioning.
 */
export const Sticky = createNode('div', { position: 'sticky' })

/**
 * Represents a statically positioned element.
 * @param props Optional properties for the statically positioned element.
 * @returns A div element node with static positioning.
 */
export const Static = createNode('div', { position: 'static' })

// Typography

/**
 * Creates an h1 heading element node.
 * @param children The content to be rendered within the element (text, numbers, components, etc) for the heading.
 * @param props Optional properties for the h1 element.
 * @returns An h1 element node.
 */
export const H1 = createChildrenFirstNode('h1')

/**
 * Creates an h2 heading element node.
 * @param children The content to be rendered within the element (text, numbers, components, etc) for the heading.
 * @param props Optional properties for the h2 element.
 * @returns An h2 element node.
 */
export const H2 = createChildrenFirstNode('h2')

/**
 * Creates an h3 heading element node.
 * @param children The content to be rendered within the element (text, numbers, components, etc) for the heading.
 * @param props Optional properties for the h3 element.
 * @returns An h3 element node.
 */
export const H3 = createChildrenFirstNode('h3')

/**
 * Creates an h4 heading element node.
 * @param children The content to be rendered within the element (text, numbers, components, etc) for the heading.
 * @param props Optional properties for the h4 element.
 * @returns An h4 element node.
 */
export const H4 = createChildrenFirstNode('h4')

/**
 * Creates an h5 heading element node.
 * @param children The content to be rendered within the element (text, numbers, components, etc) for the heading.
 * @param props Optional properties for the h5 element.
 * @returns An h5 element node.
 */
export const H5 = createChildrenFirstNode('h5')

/**
 * Creates an h6 heading element node.
 * @param children The content to be rendered within the element (text, numbers, components, etc) for the heading.
 * @param props Optional properties for the h6 element.
 * @returns An h6 element node.
 */
export const H6 = createChildrenFirstNode('h6')

/**
 * Creates a strong element node for important text.
 * @param children The content to be rendered within the element (text, numbers, components, etc) to emphasize.
 * @param props Optional properties for the strong element.
 * @returns A strong element node.
 */
export const Strong = createChildrenFirstNode('strong')

/**
 * Creates an em element node for emphasized text.
 * @param children The content to be rendered within the element (text, numbers, components, etc) to emphasize.
 * @param props Optional properties for the em element.
 * @returns An em element node.
 */
export const Em = createChildrenFirstNode('em')

/**
 * Creates a small element node for side-comments and small print.
 * @param children The content to be rendered within the element (text, numbers, components, etc).
 * @param props Optional properties for styling and configuring the small element.
 * @returns A small element node that can be rendered in React.
 */
export const Small = createChildrenFirstNode('small')

/**
 * Creates a mark element node for highlighted text.
 * @param children The content to be rendered within the element (text, numbers, components, etc) to highlight.
 * @param props Optional properties for the mark element.
 * @returns A mark element node.
 */
export const Mark = createChildrenFirstNode('mark')

/**
 * Creates a span element node.
 * @param children The content to be rendered within the element (text, numbers, components, etc) for the span.
 * @param props Optional properties for the span element.
 * @returns A span element node.
 */
export const Span = createChildrenFirstNode('span')

/**
 * Creates a paragraph element node.
 * @param children The content to be rendered within the element (text, numbers, components, etc) for the paragraph.
 * @param props Optional properties for the p element.
 * @returns A paragraph element node.
 */
export const P = createChildrenFirstNode('p')

/**
 * Renders a semantic block of text using a `<p>` element.
 * Alias for `P(...)`, recommended for general-purpose text content.
 * @example
 * ```typescript
 * Text('This is a sample text paragraph.', { fontSize: 'theme.text.base', color: 'theme.text.primary' })
 * ```
 */
export const Text = P

/**
 * Creates a preformatted text element node.
 * @param children The content to be rendered within the element (text, numbers, components, etc) for the pre element.
 * @param props Optional properties for the pre element.
 * @returns A pre element node.
 */
export const Pre = createChildrenFirstNode('pre')

/**
 * Creates a code element node for displaying code snippets.
 * @param children The content to be rendered within the element (text, numbers, components, etc) for the code.
 * @param props Optional properties for the code element.
 * @returns A code element node.
 */
export const Code = createChildrenFirstNode('code')

/**
 * Represents a line break element.
 * @param props Optional properties for the br element.
 * @returns A br element node.
 */
export const Br = createNode('br')

// Lists

/**
 * Represents an ordered list.
 * @param props Optional properties for the ol element.
 * @returns An ol element node.
 */
export const Ol = createNode('ol')

/**
 * Represents an unordered list.
 * @param props Optional properties for the ul element.
 * @returns A ul element node.
 */
export const Ul = createNode('ul')

/**
 * Represents a list item.
 * @param props Optional properties for the li element.
 * @returns An li element node.
 */
export const Li = createNode('li')

/**
 * Represents a description list.
 * @param props Optional properties for the dl element.
 * @returns A dl element node.
 */
export const Dl = createNode('dl')

/**
 * Represents a term in a description list.
 * @param props Optional properties for the dt element.
 * @returns A dt element node.
 */
export const Dt = createNode('dt')

/**
 * Represents a description in a description list.
 * @param props Optional properties for the dd element.
 * @returns A dd element node.
 */
export const Dd = createNode('dd')

// Forms and inputs

/**
 * Represents an HTML form.
 * @param props Optional properties for the form element.
 * @returns A form element node.
 */
export const Form = createNode('form')

/**
 * Represents a label for an input element.
 * @param props Optional properties for the label element.
 * @returns A label element node.
 */
export const Label = createNode('label')

/**
 * Represents an input element.
 * @param props Optional properties for the input element.
 * @returns An input element node.
 */
export const Input = createNode('input')

/**
 * Creates a button element node.
 * @param children The content to be rendered within the element (text, numbers, components, etc) for the button.
 * @param props Optional properties for the button element.
 * @returns A button element node.
 */
export const Button = createChildrenFirstNode('button')

/**
 * Represents a textarea element for multiline text input.
 * @param props Optional properties for the textarea element.
 * @returns A textarea element node.
 */
export const Textarea = createNode('textarea')

/**
 * Represents a select dropdown element.
 * @param props Optional properties for the select element.
 * @returns A select element node.
 */
export const Select = createNode('select')

/**
 * Represents an option within a select element.
 * @param children The content to be rendered within the element (text, numbers, components, etc) for the option.
 * @param props Optional properties for the option element.
 * @returns An option element node.
 */
export const Option = createChildrenFirstNode('option')

/**
 * Represents a fieldset element for grouping form elements.
 * @param props Optional properties for the fieldset element.
 * @returns A fieldset element node.
 */
export const Fieldset = createNode('fieldset')

/**
 * Represents a legend for a fieldset.
 * @param children The content to be rendered within the element (text, numbers, components, etc) for the legend.
 * @param props Optional properties for the legend element.
 * @returns A legend element node.
 */
export const Legend = createChildrenFirstNode('legend')

/**
 * Represents an option group within a select element.
 * @param props Optional properties for the optgroup element.
 * @returns An optgroup element node.
 */
export const Optgroup = createNode('optgroup')

// Tables

/**
 * Represents a table element.
 * @param props Optional properties for the table element.
 * @returns A table element node.
 */
export const Table = createNode('table')

/**
 * Represents a table header section.
 * @param props Optional properties for the thead element.
 * @returns A thead element node.
 */
export const Thead = createNode('thead')

/**
 * Represents a table body section.
 * @param props Optional properties for the tbody element.
 * @returns A tbody element node.
 */
export const Tbody = createNode('tbody')

/**
 * Represents a table footer section.
 * @param props Optional properties for the tfoot element.
 * @returns A tfoot element node.
 */
export const Tfoot = createNode('tfoot')

/**
 * Represents a table row.
 * @param props Optional properties for the tr element.
 * @returns A tr element node.
 */
export const Tr = createNode('tr')

/**
 * Represents a table header cell.
 * @param props Optional properties for the th element.
 * @returns A th element node.
 */
export const Th = createNode('th')

/**
 * Represents a table data cell.
 * @param props Optional properties for the td element.
 * @returns A td element node.
 */
export const Td = createNode('td')

/**
 * Represents a table caption.
 * @param children The content to be rendered within the element (text, numbers, components, etc) for the caption.
 * @param props Optional properties for the caption element.
 * @returns A caption element node.
 */
export const Caption = createChildrenFirstNode('caption')

/**
 * Represents a table column group.
 * @param props Optional properties for the colgroup element.
 * @returns A colgroup element node.
 */
export const Colgroup = createNode('colgroup')

/**
 * Represents a table column.
 * @param props Optional properties for the col element.
 * @returns A col element node.
 */
export const Col = createNode('col')

// Media elements

/**
 * Represents an image element.
 * @param props Optional properties for the img element.
 * @returns An img element node.
 */
export const Img = createNode('img')

/**
 * Represents a video element.
 * @param props Optional properties for the video element.
 * @returns A video element node.
 */
export const Video = createNode('video')

/**
 * Represents an audio element.
 * @param props Optional properties for the audio element.
 * @returns An audio element node.
 */
export const Audio = createNode('audio')

/**
 * Represents a picture element.
 * @param props Optional properties for the picture element.
 * @returns A picture element node.
 */
export const Picture = createNode('picture')

/**
 * Represents a source element.
 * @param props Optional properties for the source element.
 * @returns A source element node.
 */
export const Source = createNode('source')

/**
 * Represents a text track element.
 * @param props Optional properties for the track element.
 * @returns A track element node.
 */
export const Track = createNode('track')

/**
 * Represents a canvas element.
 * @param props Optional properties for the canvas element.
 * @returns A canvas element node.
 */
export const Canvas = createNode('canvas')

/**
 * Represents an iframe element.
 * @param props Optional properties for the iframe element.
 * @returns An iframe element node.
 */
export const Iframe = createNode('iframe')

// SVG elements

/**
 * Represents an SVG container element.
 * @param props Optional properties for the svg element.
 * @returns An svg element node.
 */
export const Svg = createNode('svg')

/**
 * Represents an SVG path element.
 * @param props Optional properties for the path element.
 * @returns A path element node.
 */
export const SvgPath = createNode('path')

/**
 * Represents an SVG circle element.
 * @param props Optional properties for the circle element.
 * @returns A circle element node.
 */
export const SvgCircle = createNode('circle')

/**
 * Represents an SVG ellipse element.
 * @param props Optional properties for the ellipse element.
 * @returns An ellipse element node.
 */
export const SvgEllipse = createNode('ellipse')

/**
 * Represents an SVG line element.
 * @param props Optional properties for the line element.
 * @returns A line element node.
 */
export const SvgLine = createNode('line')

/**
 * Represents an SVG polyline element.
 * @param props Optional properties for the polyline element.
 * @returns A polyline element node.
 */
export const SvgPolyline = createNode('polyline')

/**
 * Represents an SVG polygon element.
 * @param props Optional properties for the polygon element.
 * @returns A polygon element node.
 */
export const SvgPolygon = createNode('polygon')

/**
 * Represents an SVG rectangle element.
 * @param props Optional properties for the rect element.
 * @returns A rect element node.
 */
export const SvgRect = createNode('rect')

/**
 * Represents an SVG use element.
 * @param props Optional properties for the use element.
 * @returns A use element node.
 */
export const SvgUse = createNode('use')

/**
 * Represents an SVG definitions element.
 * @param props Optional properties for the defs element.
 * @returns A defs element node.
 */
export const SvgDefs = createNode('defs')

/**
 * Represents an SVG linear gradient element.
 * @param props Optional properties for the linearGradient element.
 * @returns A linearGradient element node.
 */
export const SvgLinearGradient = createNode('linearGradient')

/**
 * Represents an SVG radial gradient element.
 * @param props Optional properties for the radialGradient element.
 * @returns A radialGradient element node.
 */
export const SvgRadialGradient = createNode('radialGradient')

/**
 * Represents an SVG gradient stop element.
 * @param props Optional properties for the stop element.
 * @returns A stop element node.
 */
export const SvgStop = createNode('stop')

/**
 * Represents an SVG symbol element.
 * @param props Optional properties for the symbol element.
 * @returns A symbol element node.
 */
export const SvgSymbol = createNode('symbol')

/**
 * Represents an SVG group element.
 * @param props Optional properties for the g element.
 * @returns A g element node.
 */
export const SvgG = createNode('g')

/**
 * Represents an SVG text element.
 * @param props Optional properties for the text element.
 * @returns A text element node.
 */
export const SvgText = createNode('text')

/**
 * Represents an SVG text span element.
 * @param props Optional properties for the tspan element.
 * @returns A tspan element node.
 */
export const SvgTspan = createNode('tspan')

// Navigation and links

/**
 * Represents an anchor element.
 * @param props Optional properties for the a element.
 * @returns An a element node.
 */
export const A = createNode('a')

/**
 * Represents a navigation element.
 * @param props Optional properties for the nav element.
 * @returns A nav element node.
 */
export const Nav = createNode('nav')

// Document structure

/**
 * Represents the body element of an HTML document.
 * @param props Optional properties for the body element.
 * @returns A body element node.
 */
export const Body = createNode('body')

/**
 * Represents the main content of a document.
 * @param props Optional properties for the main element.
 * @returns A main element node.
 */
export const Main = createNode('main', {
  display: 'flex',
  flexDirection: 'column',
})

/**
 * Represents a header element.
 * @param props Optional properties for the header element.
 * @returns A header element node.
 */
export const Header = createNode('header')

/**
 * Represents a footer element.
 * @param props Optional properties for the footer element.
 * @returns A footer element node.
 */
export const Footer = createNode('footer')

/**
 * Represents an aside element.
 * @param props Optional properties for the aside element.
 * @returns An aside element node.
 */
export const Aside = createNode('aside')

/**
 * Represents a section element.
 * @param props Optional properties for the section element.
 * @returns A section element node.
 */
export const Section = createNode('section')

/**
 * Represents an article element.
 * @param props Optional properties for the article element.
 * @returns An article element node.
 */
export const Article = createNode('article')

/**
 * Represents a figure element.
 * @param props Optional properties for the figure element.
 * @returns A figure element node.
 */
export const Figure = createNode('figure')

/**
 * Represents a figure caption element.
 * @param children The content to be rendered within the element (text, numbers, components, etc) for the figcaption.
 * @param props Optional properties for the figcaption element.
 * @returns A figcaption element node.
 */
export const Figcaption = createChildrenFirstNode('figcaption')

/**
 * Represents a blockquote element.
 * @param props Optional properties for the blockquote element.
 * @returns A blockquote element node.
 */
export const Blockquote = createNode('blockquote')

/**
 * Represents an address element.
 * @param props Optional properties for the address element.
 * @returns An address element node.
 */
export const Address = createNode('address')

/**
 * Represents a dialog element.
 * @param props Optional properties for the dialog element.
 * @returns A dialog element node.
 */
export const Dialog = createNode('dialog')

/**
 * Represents a details element.
 * @param props Optional properties for the details element.
 * @returns A details element node.
 */
export const Details = createNode('details')

/**
 * Represents a summary element for a details disclosure box.
 * @param children The content to be rendered within the element (text, numbers, components, etc) for the summary.
 * @param props Optional properties for the summary element.
 * @returns A summary element node.
 */
export const Summary = createChildrenFirstNode('summary')

// Document head elements

/**
 * Represents a head element.
 * @param props Optional properties for the head element.
 * @returns A head element node.
 */
export const Head = createNode('head')

/**
 * Represents the root HTML element.
 * @param props Optional properties for the HTML element.
 * @returns An HTML element node.
 */
export const Html = createNode('html')

/**
 * Represents a meta element.
 * @param props Optional properties for the meta element.
 * @returns A meta element node.
 */
export const Meta = createNode('meta')

/**
 * Represents a link element.
 * @param props Optional properties for the link element.
 * @returns A link element node.
 */
export const Link = createNode('link')

/**
 * Represents a style element. Its content should be CSS text.
 * @param props Optional properties for the style element.
 * @returns A style element node.
 */
export const Style = createNode('style')

/**
 * Represents a script element. For inline scripts, its content should be JavaScript text.
 * @param props Optional properties for the script element (e.g., src, type, async, defer).
 * @returns A script element node.
 */
export const Script = createNode('script')

/**
 * Creates a title element node for document head title.
 * @param children The content to be rendered within the element (text, numbers, components, etc) for the title.
 * @param props Optional properties for the title element.
 * @returns A title element node.
 */
export const Title = createChildrenFirstNode('title')

/**
 * Represents a base element.
 * @param props Optional properties for the base element.
 * @returns A base element node.
 */
export const Base = createNode('base')

// --- Additional Text-Level Semantics ---

/**
 * Represents an abbreviation or acronym.
 * @param children The content to be rendered within the element (text, numbers, components, etc) for the abbreviation.
 * @param props Optional properties for the abbr element.
 * @returns An abbr element node.
 */
export const Abbr = createChildrenFirstNode('abbr')

/**
 * Represents text that should be stylistically offset from normal prose (traditionally bold).
 * @param children The content to be rendered within the element (text, numbers, components, etc).
 * @param props Optional properties for the b element.
 * @returns A b element node.
 */
export const B = createChildrenFirstNode('b')

/**
 * Represents text that is isolated from its surroundings for bidirectional text formatting.
 * @param children The content to be rendered within the element (text, numbers, components, etc).
 * @param props Optional properties for the bdi element.
 * @returns A bdi element node.
 */
export const Bdi = createChildrenFirstNode('bdi')

/**
 * Overrides the current text directionality.
 * @param children The content to be rendered within the element (text, numbers, components, etc).
 * @param props Optional properties for the bdo element.
 * @returns A bdo element node.
 */
export const Bdo = createChildrenFirstNode('bdo')

/**
 * Represents the title of a work (e.g., a book, a song, an essay).
 * @param children The content to be rendered within the element (text, numbers, components, etc) for the citation.
 * @param props Optional properties for the cite element.
 * @returns A cite element node.
 */
export const Cite = createChildrenFirstNode('cite')

/**
 * Links a piece of content with a machine-readable translation.
 * @param children The content to be rendered within the element (text, numbers, components, etc).
 * @param props Optional properties for the data element.
 * @returns A data element node.
 */
export const Data = createChildrenFirstNode('data')

/**
 * Represents a definition of a term.
 * @param children The content to be rendered within the element (text, numbers, components, etc) for the definition.
 * @param props Optional properties for the dfn element.
 * @returns A dfn element node.
 */
export const Dfn = createChildrenFirstNode('dfn')

/**
 * Represents text in an alternate voice or mood (traditionally italic).
 * @param children The content to be rendered within the element (text, numbers, components, etc).
 * @param props Optional properties for the i element.
 * @returns An i element node.
 */
export const I = createChildrenFirstNode('i')

/**
 * Represents user input (typically keyboard input).
 * @param children The content to be rendered within the element (text, numbers, components, etc) representing keyboard input.
 * @param props Optional properties for the kbd element.
 * @returns A kbd element node.
 */
export const Kbd = createChildrenFirstNode('kbd')

/**
 * Represents an inline quotation.
 * @param children The content to be rendered within the element (text, numbers, components, etc) for the quotation.
 * @param props Optional properties for the q element.
 * @returns A q element node.
 */
export const Q = createChildrenFirstNode('q')

/**
 * Represents fallback parenthesis for ruby annotations.
 * @param children The content to be rendered within the element (text, numbers, components, etc).
 * @param props Optional properties for the rp element.
 * @returns An rp element node.
 */
export const Rp = createChildrenFirstNode('rp')

/**
 * Represents the ruby text component of a ruby annotation.
 * @param children The content to be rendered within the element (text, numbers, components, etc).
 * @param props Optional properties for the rt element.
 * @returns An rt element node.
 */
export const Rt = createChildrenFirstNode('rt')

/**
 * Represents a ruby annotation.
 * @param props Optional properties for the ruby element.
 * @returns A ruby element node.
 */
export const Ruby = createNode('ruby')

/**
 * Represents text that is no longer accurate or relevant (strikethrough).
 * @param children The content to be rendered within the element (text, numbers, components, etc) to be struck through.
 * @param props Optional properties for the s element.
 * @returns An s element node.
 */
export const S = createChildrenFirstNode('s')

/**
 * Represents sample output from a computer program.
 * @param children The content to be rendered within the element (text, numbers, components, etc) representing sample output.
 * @param props Optional properties for the samp element.
 * @returns A samp element node.
 */
export const Samp = createChildrenFirstNode('samp')

/**
 * Represents subscript text.
 * @param children The content to be rendered within the element (text, numbers, components, etc) for the subscript.
 * @param props Optional properties for the sub element.
 * @returns A sub element node.
 */
export const Sub = createChildrenFirstNode('sub')

/**
 * Represents superscript text.
 * @param children The content to be rendered within the element (text, numbers, components, etc) for the superscript.
 * @param props Optional properties for the sup element.
 * @returns A sup element node.
 */
export const Sup = createChildrenFirstNode('sup')

/**
 * Represents a specific period in time or a date.
 * @param children The content to be rendered within the element (text, numbers, components, etc) representing the time/date.
 * @param props Optional properties for the time element.
 * @returns A time element node.
 */
export const Time = createChildrenFirstNode('time')

/**
 * Represents text that should be rendered with an unarticulated, non-textual annotation (traditionally underline).
 * @param children The content to be rendered within the element (text, numbers, components, etc) to be underlined.
 * @param props Optional properties for the u element.
 * @returns A u element node.
 */
export const U = createChildrenFirstNode('u')

/**
 * Represents a variable in a mathematical expression or programming context.
 * @param children The content to be rendered within the element (text, numbers, components, etc) representing a variable.
 * @param props Optional properties for the var element.
 * @returns A var element node.
 */
export const Var = createChildrenFirstNode('var')

/**
 * Represents a word break opportunity. This is a void element.
 * @param props Optional properties for the wbr element.
 * @returns A wbr element node.
 */
export const Wbr = createNode('wbr')

// --- Additional Grouping Content ---

/**
 * Represents a thematic break between paragraph-level elements (e.g., a scene change in a story, or a shift of topic). This is a void element.
 * @param props Optional properties for the hr element.
 * @returns An hr element node.
 */
export const Hr = createNode('hr')

/**
 * Represents a group of commands that a user can perform or activate.
 * @param props Optional properties for the menu element.
 * @returns A menu element node.
 */
export const Menu = createNode('menu')

/**
 * Represents the parts of a document or application that contain search or filtering controls.
 * @param props Optional properties for the search element.
 * @returns A search element node.
 */
export const Search = createNode('search')

// --- Additional Embedded Content ---

/**
 * Represents an integration point for an external application or interactive content (a plug-in). This is a void element.
 * @param props Optional properties for the embed element.
 * @returns An embed element node.
 */
export const Embed = createNode('embed')

/**
 * Represents an external resource, which can be treated as an image, a nested Browse context, or content to be handled by a plugin.
 * @param props Optional properties for the object element.
 * @returns An object element node.
 */
export const ObjectElement = createNode('object')

/**
 * Defines parameters for an <object> element. This is a void element.
 * @param props Optional properties for the param element.
 * @returns A param element node.
 */
export const Param = createNode('param')

/**
 * Represents an image map, with clickable areas.
 * @param props Optional properties for the map element.
 * @returns A map element node.
 */
export const MapElement = createNode('map')

/**
 * Defines a client-side image map area. This is a void element.
 * @param props Optional properties for the area element.
 * @returns An area element node.
 */
export const Area = createNode('area')

// --- Additional Forms Elements ---

/**
 * Contains a set of <option> elements that represent predefined options for other controls.
 * @param props Optional properties for the datalist element.
 * @returns A datalist element node.
 */
export const Datalist = createNode('datalist')

/**
 * Represents the result of a calculation or user action.
 * @param props Optional properties for the output element.
 * @returns An output element node.
 */
export const Output = createNode('output')

/**
 * Displays an indicator showing the completion progress of a task, typically displayed as a progress bar.
 * @param props Optional properties for the progress element.
 * @returns A progress element node.
 */
export const Progress = createNode('progress')

/**
 * Represents either a scalar value within a known range or a fractional value.
 * @param props Optional properties for the meter element.
 * @returns A meter element node.
 */
export const Meter = createNode('meter')

// --- Additional Scripting & Document Elements ---

/**
 * Defines a section of HTML to be inserted if a script type on the page is unsupported or if scripting is currently turned off in the browser.
 * @param props Optional properties for the noscript element.
 * @returns A noscript element node.
 */
export const Noscript = createNode('noscript')

/**
 * A mechanism for holding HTML that is not to be rendered immediately when a page is loaded but may be instantiated subsequently during runtime using JavaScript.
 * @param props Optional properties for the template element.
 * @returns A template element node.
 */
export const Template = createNode('template')

// --- Additional Sections Elements ---

/**
 * Represents a heading group. It is used to group a set of <h1>–<h6> elements.
 * @param props Optional properties for the hgroup element.
 * @returns An hgroup element node.
 */
export const Hgroup = createNode('hgroup')
