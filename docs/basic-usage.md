```ts
// Component wraps a React Server Component into a Client Component
// Think of it like a factory that transforms JSX-like node definitions into actual React components
import { Component, Column, Row, Div, Img, P } from '@meonode/ui'

const theme = { background: { primary: 'red', secondary: 'blue' } }

// This is the actual exported component
export default Component(() => {
  return Card({
    title: 'Genshin Impact',
    subtitle: 'Adventure awaits!',
    imageUrl: 'https://upload-os-bbs.mihoyo.com/upload/2021/03/05/75387538/f37ce39baf72ffb84cb5c0040bdcbf10_2126420710320647353.jpg',
  })
})

// This function returns a structured layout using html.node helpers only
const Card = ({ title, subtitle, imageUrl }: { title: string; subtitle: string; imageUrl: string }) =>
  Column({
    theme,
    // Column is just a <div> with `display: flex; flex-direction: column`
    borderRadius: 10,
    overflow: 'hidden',
    border: '1px solid theme.background.primary', // Can use theme references
    width: 300,
    children: [
      // Img translates to a real <img> tag
      Img({
        src: imageUrl,
        width: '100%',
        height: 180,
        style: {
          objectFit: 'cover', // Ensures the image fills the area without distortion
        },
      }),
      // Div is a basic <div> wrapper
      Div({
        padding: 10,
        backgroundColor: 'theme.background.secondary',
        children: Column({
          gap: 5,
          children: [
            // P maps directly to <p>, with styling
            P({
              style: {
                fontSize: 18,
                fontWeight: 600,
              },
              children: title,
            }),
            P({
              style: {
                fontSize: 14,
                color: 'gray',
              },
              children: subtitle,
            }),
          ],
        }),
      }),
    ],
  })
```
