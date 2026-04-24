import { Div } from '@meonode/ui'

interface ThemeScopeBlockProps {
  pageTestId: string
  innerTestId: string
  text: string
}

/**
 * Shared fixture node used by both server and client ThemeProvider tests.
 * Keeping this shape identical isolates provider-boundary differences.
 */
export function ThemeScopeBlock({ pageTestId, innerTestId, text }: ThemeScopeBlockProps) {
  return Div({
    'data-testid': pageTestId,
    children: Div({
      'data-testid': innerTestId,
      backgroundColor: 'theme.primary',
      children: text,
    }),
  })
}
