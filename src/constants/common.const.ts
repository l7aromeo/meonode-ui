export const NO_STYLE_TAGS = [
  'html',
  'head',
  'meta',
  'link',
  'script',
  'style',
  'noscript',
  'template',
  'slot',
  'base',
  'param',
  'source',
  'track',
  'wbr',
  'embed',
  'object',
  'iframe',
  'frame',
  'frameset',
  'applet',
  'bgsound',
  'noembed',
  'noframes',
] as const

export const noStyleTagsSet = new Set(NO_STYLE_TAGS)
export type NO_STYLE_TAGS = typeof NO_STYLE_TAGS
