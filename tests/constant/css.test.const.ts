import { CssProp } from '@src/types/node.type'

const css: CssProp = {
  // Basic styling
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '20px',
  margin: '10px auto',
  width: '100%',
  maxWidth: '1200px',
  minHeight: '500px',
  backgroundColor: '#f5f5f5',
  color: '#333',
  fontSize: '16px',
  fontFamily: 'Inter, sans-serif',
  fontWeight: 500,
  lineHeight: 1.6,
  letterSpacing: '0.5px',

  // Border & shadows
  border: '1px solid rgba(0, 0, 0, 0.1)',
  borderRadius: '12px',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)',

  // Transforms & animations
  transform: 'translateY(0) scale(1) rotate(0deg)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  animation: 'fadeIn 0.5s ease-in-out',

  // Pseudo-classes
  '&:hover': {
    backgroundColor: '#ffffff',
    transform: 'translateY(-2px) scale(1.02)',
    boxShadow: '0 10px 20px rgba(0, 0, 0, 0.15), 0 3px 6px rgba(0, 0, 0, 0.1)',
    '& > .icon': {
      color: '#007bff',
      transform: 'rotate(180deg)',
    },
  },

  '&:active': {
    transform: 'translateY(0) scale(0.98)',
  },

  '&:focus': {
    outline: '2px solid #007bff',
    outlineOffset: '2px',
  },

  '&:disabled': {
    opacity: 0.5,
    cursor: 'not-allowed',
    pointerEvents: 'none',
  },

  // Pseudo-elements
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)',
    borderRadius: 'inherit',
    pointerEvents: 'none',
  },

  '&::after': {
    content: '"→"',
    marginLeft: '8px',
    transition: 'transform 0.2s ease',
  },

  // Child selectors
  '& > h1': {
    fontSize: '32px',
    fontWeight: 700,
    marginBottom: '16px',
    background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },

  '& > p': {
    fontSize: '16px',
    lineHeight: 1.8,
    color: '#666',
    marginBottom: '12px',
  },

  '& .card': {
    padding: '16px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
    transition: 'transform 0.2s ease',

    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    },
  },

  '& button': {
    padding: '12px 24px',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: '#007bff',
    color: 'white',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',

    '&:hover': {
      backgroundColor: '#0056b3',
      transform: 'scale(1.05)',
    },

    '&:active': {
      transform: 'scale(0.95)',
    },
  },

  // Sibling selectors
  '& + &': {
    marginTop: '24px',
  },

  '& ~ &': {
    borderTop: '1px solid #eee',
  },

  // Attribute selectors
  '&[data-active="true"]': {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196f3',
  },

  '&[aria-expanded="true"]': {
    '& .chevron': {
      transform: 'rotate(180deg)',
    },
  },

  // Media queries
  '@media (max-width: 768px)': {
    flexDirection: 'column',
    padding: '16px',
    maxWidth: '100%',

    '& > h1': {
      fontSize: '24px',
    },

    '& button': {
      width: '100%',
    },
  },

  '@media (min-width: 769px) and (max-width: 1024px)': {
    padding: '18px',
    maxWidth: '960px',
  },

  '@media (prefers-color-scheme: dark)': {
    backgroundColor: '#1a1a1a',
    color: '#f5f5f5',
    borderColor: 'rgba(255, 255, 255, 0.1)',

    '& > p': {
      color: '#ccc',
    },

    '& .card': {
      backgroundColor: '#2a2a2a',
    },
  },

  '@media (prefers-reduced-motion: reduce)': {
    animation: 'none',
    transition: 'none',

    '& *': {
      animation: 'none !important',
      transition: 'none !important',
    },
  },

  // Container queries (Emotion supports this with plugins)
  '@container (min-width: 400px)': {
    '& .card': {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '16px',
    },
  },

  // Keyframes (defined inline)
  '@keyframes fadeIn': {
    from: {
      opacity: 0,
      transform: 'translateY(20px)',
    },
    to: {
      opacity: 1,
      transform: 'translateY(0)',
    },
  },

  '@keyframes pulse': {
    '0%, 100%': {
      opacity: 1,
    },
    '50%': {
      opacity: 0.5,
    },
  },

  // Advanced positioning
  position: 'relative',
  zIndex: 10,
  isolation: 'isolate',

  // Clipping & masking
  clipPath: 'polygon(0 0, 100% 0, 100% 85%, 0 100%)',
  maskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)',

  // Filters & backdrop
  filter: 'blur(0px) brightness(1) contrast(1)',
  backdropFilter: 'blur(10px) saturate(180%)',

  // Advanced text
  textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  textTransform: 'uppercase',
  wordSpacing: '2px',
  textDecoration: 'none',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  overflow: 'hidden',

  // CSS variables
  '--primary-color': '#007bff',
  '--secondary-color': '#6c757d',
  '--spacing-unit': '8px',
  '--border-radius': '8px',

  // Using CSS variables
  borderColor: 'var(--primary-color)',
  gap: 'var(--spacing-unit)',

  // Advanced selectors
  '&:not(:last-child)': {
    marginBottom: '16px',
  },

  '&:nth-child(odd)': {
    backgroundColor: '#f9f9f9',
  },

  '&:nth-child(even)': {
    backgroundColor: '#ffffff',
  },

  '&:first-of-type': {
    borderTopLeftRadius: '12px',
    borderTopRightRadius: '12px',
  },

  '&:last-of-type': {
    borderBottomLeftRadius: '12px',
    borderBottomRightRadius: '12px',
  },

  // Complex nesting
  '& .header': {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',

    '& .title': {
      fontSize: '20px',
      fontWeight: 600,

      '& span': {
        color: 'var(--primary-color)',
        fontWeight: 700,
      },
    },

    '& .actions': {
      display: 'flex',
      gap: '8px',

      '& button': {
        padding: '8px 16px',

        '&[data-variant="primary"]': {
          backgroundColor: 'var(--primary-color)',
        },

        '&[data-variant="secondary"]': {
          backgroundColor: 'var(--secondary-color)',
        },
      },
    },
  },

  // Advanced animations
  willChange: 'transform, opacity',
  animationName: 'fadeIn, pulse',
  animationDuration: '0.5s, 2s',
  animationTimingFunction: 'ease-in-out, ease-in-out',
  animationIterationCount: '1, infinite',
  animationDelay: '0s, 0.5s',

  // Print styles
  '@media print': {
    display: 'block',
    pageBreakInside: 'avoid',
    color: 'black',
    backgroundColor: 'white',
    boxShadow: 'none',
  },

  // Focus-visible (modern accessibility)
  '&:focus-visible': {
    outline: '3px solid #007bff',
    outlineOffset: '2px',
    borderRadius: '4px',
  },

  // Logical properties
  insetInlineStart: '0',
  marginBlockEnd: '16px',
  paddingInline: '20px',
  borderInlineStart: '4px solid var(--primary-color)',
}
export default css
