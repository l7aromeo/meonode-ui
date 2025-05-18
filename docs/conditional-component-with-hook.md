```ts

// Wraps a hook-capable component into a BaseNode-compatible Client Component
import { Component, Column, Row, Div, P  } from '@meonode/ui'
import { useState, useEffect } from 'react'

// Shared theme object passed into components. This may be written in a different file and imported.
const theme = {
  background: { primary: 'lightgreen', secondary: 'lightyellow' },
}

// Exported component rendered via <Component /> (client wrapper)
export default Component(() => {
  // React hook for conditional UI
  const [showDetails, setShowDetails] = useState(false)

  // Declarative layout using Column as root container
  return Column({
    theme,
    padding: 20,
    gap: 15,
    children: [
      // Header row with a toggle button
      Row({
        gap: 10,
        children: [
          Div({
            onClick: () => setShowDetails(prev => !prev),
            style: {
              cursor: 'pointer',
              userSelect: 'none',
              padding: '10px 20px',
              backgroundColor: 'theme.background.primary', // Node engine will handle this
              borderRadius: 5,
              fontWeight: 'bold',
            },
            children: showDetails ? 'Hide Details' : 'Show Details',
          }),
        ],
      }),

      // Conditionally render DetailComponent via function wrapper
      // Ensures it's treated as a renderable function (deferred React class or element that is NOT called directly)
      // Node engine will handle this like magic
      showDetails ? () => DetailComponent({ info: 'Here are some details!' }) : null,
    ],
  })
})

// A stateful detail section using useEffect and styled Div
const DetailComponent = ({ info }: { info: string }) => {
  useEffect(() => {
    console.log('DetailComponent mounted')
    return () => {
      console.log('DetailComponent unmounted')
    }
  }, [])

  return Div({
    padding: 15,
    border: '1px solid green',
    borderRadius: 6,
    backgroundColor: 'theme.background.secondary', // Node engine will handle this
    children: P({ children: info }),
  })
}

```
