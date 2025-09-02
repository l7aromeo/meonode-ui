# @meonode/ui

[![NPM version](https://img.shields.io/npm/v/@meonode/ui.svg?style=flat)](https://www.npmjs.com/package/@meonode/ui)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/@meonode/ui)](https://bundlephobia.com/package/@meonode/ui)

## **Build React UIs with Type-Safe Fluency Without JSX Syntax**

A revolutionary approach to React component composition featuring function-based syntax, direct CSS-first prop styling, built-in theming system, smart prop handling with raw property pass-through, dynamic children management, and powerful portal capabilities.

### ✨ Quick Start Example

```tsx
import { Component, Root, Center, Column, H1, Button, Text } from '@meonode/ui';

const theme = {
  primary: { default: '#FF6B6B', content: '#4A0000' },
  secondary: { default: '#6BCB77', content: '#0A3B0F' },
  base: { default: '#F8F8F8', content: '#333333' }
};

const App = Component(() =>
  Root({
    theme,
    backgroundColor: 'theme.base.default',
    children: Center({
      padding: 40,
      children: Column({
        gap: 24,
        textAlign: 'center',
        children: [
          H1('Welcome to MeoNode', {
            fontSize: '3rem',
            color: 'theme.primary.default',
            marginBottom: 16
          }),
          Button('Get Started', {
            backgroundColor: 'theme.primary.default',
            color: 'theme.primary.content',
            padding: '12px 24px',
            borderRadius: 8,
            fontSize: '1.1rem',
            cursor: 'pointer',
            onClick: () => alert('Hello MeoNode!')
          })
        ]
      })
    })
  })
);
```

-----

## 📦 Installation

```bash
# Using npm
npm install @meonode/ui react

# Using yarn
yarn add @meonode/ui react

# Using pnpm
pnpm add @meonode/ui react
```

-----

## ⚙️ CSS Engine Architecture

MeoNode UI is powered by **@emotion/react** under the hood, providing a robust and performant CSS-in-JS solution that enables all the advanced styling capabilities you see in the library.

### How It Works

```tsx
// Behind the scenes, MeoNode transforms this:
const StyledComponent = Component(() =>
  Div({
    padding: '20px',
    backgroundColor: 'theme.primary.default',
    css: {
      '&:hover': {
        transform: 'scale(1.05)',
        boxShadow: '0 8px 16px rgba(0,0,0,0.2)'
      },
      '@media (max-width: 768px)': {
        padding: '12px'
      }
    }
  })
);

// Into this Emotion-powered component:
import { css } from '@emotion/react';

const emotionStyles = css`
  padding: 20px;
  background-color: ${theme.primary.default};
  
  &:hover {
    transform: scale(1.05);
    box-shadow: 0 8px 16px rgba(0,0,0,0.2);
  }
  
  @media (max-width: 768px) {
    padding: 12px;
  }
`;
```

### Key Benefits of Emotion Integration

- **🎯 Performance**: Automatic CSS optimization and dead code elimination
- **🧩 Dynamic Styling**: Runtime theme value resolution and conditional styles
- **🔄 Server-Side Rendering**: Full SSR support with automatic critical CSS extraction
- **📱 Responsive Design**: Native media query support with optimal performance
- **🎨 Advanced Features**: Pseudo-classes, keyframe animations, and complex selectors

### Theme Resolution Engine

```tsx
// MeoNode's theme engine automatically resolves nested theme paths:
const theme = {
  colors: {
    primary: {
      500: '#3B82F6',
      600: '#2563EB'
    }
  }
};

// This syntax:
backgroundColor: 'theme.colors.primary.500'

// Gets resolved by the engine to:
backgroundColor: '#3B82F6'

// The resolution happens through Emotion's theming system:
import { ThemeProvider } from '@emotion/react';

// MeoNode wraps your components automatically:
const ThemedComponent = () => (
  <ThemeProvider theme={theme}>
    <div css={{
      backgroundColor: theme.colors.primary[500], // Resolved automatically
      '&:hover': {
        backgroundColor: theme.colors.primary[600]
      }
    }}>
      Content
    </div>
  </ThemeProvider>
);
```

### Style Processing Pipeline

1.  **Parse Props**: MeoNode separates CSS properties from DOM attributes
2.  **Resolve Theme**: Theme path strings are resolved to actual values
3.  **Generate Emotion CSS**: Styles are converted to Emotion's CSS format
4.  **Optimize**: Emotion handles deduplication, vendor prefixing, and optimization
5.  **Inject**: Styles are injected into the document head with unique class names

### Advanced Emotion Features Exposed

```tsx
// Access to Emotion's advanced features through MeoNode:
const AnimatedComponent = Component(() =>
  Div({
    css: {
      // Emotion's css prop supports all CSS features
      animation: 'slideIn 0.5s ease-out',
      
      // Advanced selectors
      '& > *:nth-of-type(odd)': {
        backgroundColor: '#f0f0f0'
      },
      
      // CSS custom properties
      '--primary-color': '#3B82F6',
      color: 'var(--primary-color)',
      
      // Container queries (when supported)
      '@container (min-width: 400px)': {
        padding: '2rem'
      },
      
      // Emotion's interpolation functions
      [`@media (min-width: ${theme.breakpoints.md})`]: {
        fontSize: '1.2rem'
      }
    }
  })
);
```

### Performance Optimizations

```tsx
// MeoNode leverages Emotion's performance features:

// 1. Automatic style memoization
const MemoizedStyles = Component(() => {
  // These styles are automatically memoized by Emotion
  const expensiveStyles = {
    background: `linear-gradient(45deg, 
      ${theme.colors.primary.default}, 
      ${theme.colors.secondary.default}
    )`,
    css: {
      // Complex animations are optimized
      '@keyframes complexAnimation': {
        '0%': { transform: 'rotate(0deg) scale(1)' },
        '50%': { transform: 'rotate(180deg) scale(1.2)' },
        '100%': { transform: 'rotate(360deg) scale(1)' }
      },
      animation: 'complexAnimation 2s infinite'
    }
  };
  
  return Div(expensiveStyles);
});

// 2. Critical CSS extraction for SSR
// MeoNode automatically handles Emotion's SSR setup:
import { CacheProvider } from '@emotion/react';
import createEmotionServer from '@emotion/server/create-instance';
import createCache from '@emotion/cache';

// This is handled internally by MeoNode for optimal SSR performance
```

-----

## 📚 Core Concepts

### 1\. 🏗️ Component Architecture

MeoNode uses function-based component creation for maximum flexibility:

```tsx
import { Node, Component, Div, H1, P } from '@meonode/ui';

// Method 1: Direct element creation
const SimpleCard = () =>
  Div({
    padding: '20px',
    borderRadius: '12px',
    backgroundColor: 'white',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    children: [
      H1('Card Title', { marginBottom: 8 }),
      P('Card content goes here...')
    ]
  });

// Method 2: Custom element factory
const Card = Node('article', {
  padding: '24px',
  borderRadius: '16px',
  backgroundColor: 'white',
  border: '1px solid #e0e0e0'
});

// Method 3: Reusable component with props
const UserCard = Component<{ user: { name: string; role: string } }>(({ user }) =>
  Card({
    children: [
      H1(user.name, { fontSize: '1.5rem', marginBottom: 4 }),
      P(user.role, { color: '#666', fontSize: '0.9rem' })
    ]
  })
);
```

### 2\. 🎨 Advanced Theming System

Create comprehensive design systems with nested theme objects:

```tsx
// Enhanced theme configuration
const theme = {
  colors: {
    primary: {
      50: '#E3F2FD',
      500: '#2196F3',
      900: '#0D47A1',
      gradient: 'linear-gradient(135deg, #2196F3, #21CBF3)'
    },
    semantic: {
      success: '#4CAF50',
      warning: '#FF9800',
      error: '#F44336'
    },
    text: {
      primary: '#212121',
      secondary: '#757575',
      disabled: '#BDBDBD'
    }
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px'
  },
  typography: {
    fontFamily: '"Inter", -apple-system, sans-serif',
    sizes: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem'
    }
  },
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px'
  }
};

// Usage with theme paths
const ThemedButton = Component(() =>
  Button('Primary Action', {
    theme, // Provide theme context
    backgroundColor: 'theme.colors.primary.500',
    color: 'white',
    padding: 'theme.spacing.md theme.spacing.lg',
    borderRadius: 'theme.borderRadius.md',
    fontFamily: 'theme.typography.fontFamily',
    fontSize: 'theme.typography.sizes.base'
  })
);
```

### 3\. 🎯 Advanced CSS Properties & Selectors

MeoNode provides powerful CSS manipulation through the `css` property for complex styling scenarios:

```tsx
import { Component, Div, Button, H2, P } from '@meonode/ui';

const InteractiveCard = Component(() =>
  Div({
    padding: '24px',
    borderRadius: '12px',
    backgroundColor: 'white',
    transition: 'all 0.3s ease',
    
    // Advanced CSS with pseudo-classes, hover states, and nested selectors
    css: {
      // Hover effects on the card itself
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 12px 24px rgba(0,0,0,0.15)'
      },
      
      // Style child buttons within this card
      '& button': {
        borderRadius: '8px',
        border: 'none',
        transition: 'all 0.2s ease'
      },
      
      // Specific button hover states
      '& button:hover': {
        backgroundColor: '#2196F3',
        color: 'white',
        transform: 'scale(1.05)',
        boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)'
      },
      
      // Focus states for accessibility
      '& button:focus': {
        outline: '2px solid #2196F3',
        outlineOffset: '2px'
      },
      
      // Media queries for responsive design
      '@media (max-width: 768px)': {
        padding: '16px',
        margin: '8px'
      },
      
      // Advanced selectors
      '& h2 + p': {
        marginTop: '8px',
        color: '#666'
      },
      
      // Pseudo-elements
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '4px',
        background: 'linear-gradient(90deg, #FF6B6B, #6BCB77)',
        borderRadius: '12px 12px 0 0'
      }
    },
    
    children: [
      H2('Interactive Component', {
        fontSize: '1.5rem',
        marginBottom: 12,
        color: '#333'
      }),
      P('This card demonstrates advanced CSS capabilities with hover effects, responsive design, and complex selectors.', {
        lineHeight: 1.6,
        marginBottom: 16
      }),
      Button('Try Hovering!', {
        padding: '10px 20px',
        backgroundColor: '#f5f5f5',
        color: '#333',
        cursor: 'pointer'
      })
    ]
  })
);
```

### 4\. 🔧 Smart Prop Handling

Automatic differentiation between CSS properties and DOM attributes:

```tsx
interface CardProps {
  title: string;
  urgent?: boolean;
}

const SmartCard = Component<CardProps>(({ title, urgent, ...restProps }) =>
  Div({
    // CSS Properties (automatically recognized)
    padding: '20px',
    borderRadius: '8px',
    backgroundColor: urgent ? '#FFF3E0' : 'white',
    borderLeft: urgent ? '4px solid #FF9800' : '4px solid transparent',
    
    // DOM Attributes (passed through)
    'data-testid': 'smart-card',
    'aria-label': `${title} card`,
    role: 'article',
    tabIndex: 0,
    
    // Event Handlers
    onClick: (e) => console.log('Card clicked:', title),
    onKeyDown: (e) => {
      if (e.key === 'Enter') console.log('Card activated:', title);
    },
    
    // Merge any additional props
    ...restProps,
    
    children: [
      H2(title, { 
        color: urgent ? '#E65100' : '#333',
        marginBottom: 12 
      }),
      P('Smart prop handling automatically separates CSS from DOM attributes.')
    ]
  })
);
```

### 5\. 🌟 Dynamic Children & Composition

Handle complex child patterns with ease:

```tsx
const DynamicList = Component<{ items: string[]; header?: string }>(({ items, header }) =>
  Div({
    children: [
      // Conditional header
      header && H2(header, { marginBottom: 16 }),
      
      // Dynamic list items
      ...items.map((item, index) =>
        Div({
          key: index,
          padding: '12px',
          borderBottom: index < items.length - 1 ? '1px solid #eee' : 'none',
          children: P(item)
        })
      ),
      
      // Conditional footer
      items.length === 0 && P('No items found', { 
        color: '#999', 
        fontStyle: 'italic',
        textAlign: 'center',
        padding: '20px'
      })
    ]
  })
);
```

### 6\. 🚪 Portal System with Context Integration

Create modals, tooltips, and overlays with full context access:

```tsx
import { Portal, Center, Column, Button, Text } from '@meonode/ui';
import { Provider, useSelector } from 'react-redux';
import store from './store';

// Redux Provider wrapper for portal components
const ReduxProvider = Node(Provider, { store });

// Modal with Redux integration
const NotificationModal = Portal<{ message: string }>(
  ReduxProvider, // Context provider wrapper
  ({ portal, message }) => {
    const userPreferences = useSelector(state => state.user.preferences);
    
    useEffect(() => {
      // Auto-close after 3 seconds
      const timer = setTimeout(portal.unmount, 3000);
      return () => clearTimeout(timer);
    }, [portal]);

    return Center({
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      backdropFilter: 'blur(8px)',
      zIndex: 1000,
      
      // Click outside to close
      onClick: (e) => {
        if (e.currentTarget === e.target) portal.unmount();
      },
      
      children: Column({
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '32px',
        maxWidth: '400px',
        margin: '20px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
        
        css: {
          // Entrance animation
          animation: 'slideIn 0.3s ease-out',
          '@keyframes slideIn': {
            from: { 
              opacity: 0, 
              transform: 'translateY(-20px) scale(0.95)' 
            },
            to: { 
              opacity: 1, 
              transform: 'translateY(0) scale(1)' 
            }
          }
        },
        
        children: [
          Text(message, {
            fontSize: '1.2rem',
            marginBottom: 20,
            textAlign: 'center',
            color: userPreferences.darkMode ? '#fff' : '#333'
          }),
          Button('Close', {
            backgroundColor: '#2196F3',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '8px',
            cursor: 'pointer',
            onClick: portal.unmount
          })
        ]
      })
    });
  }
);

// Usage
const App = Component(() => {
  const showModal = () => NotificationModal({ 
    message: 'Portal with Redux context access!' 
  });
  
  return Button('Show Modal', { onClick: showModal });
});
```

-----

## 🎯 Why Choose @meonode/ui?

### **Revolutionary Development Experience**

- **🎯 Type-Safe by Design** - Complete TypeScript integration with intelligent autocomplete for styles, props, and theme paths
- **🎨 Theme-Aware Everything** - Write styles directly in props with automatic theme value resolution and inheritance
- **🧩 Function-Based Composition** - Intuitive component building using structured function calls instead of JSX complexity
- **💫 Advanced CSS Control** - Full CSS capabilities including pseudo-classes, media queries, and complex selectors
- **🌐 Contextual Theming** - Theme values propagate automatically through nested component hierarchies
- **⚡ Performance Optimized** - Fast theme resolution and efficient CSS in JS powered by @emotion/react

### **Enterprise-Ready Features**

- **🔄 React Ecosystem Compatible** - Seamless integration with hooks, HOCs, context, and React 18+ concurrent features
- **🚪 Powerful Portal System** - Advanced portal management with context provider integration for modals and overlays
- **📱 Responsive by Default** - Built-in responsive design patterns with media query support
- **♿ Accessibility First** - Semantic HTML output with ARIA support and keyboard navigation

-----

## 📖 API Reference

### Core Functions

| Function | Signature | Description |
| :--- | :--- | :--- |
| `Node` | `(element: string \| ComponentType, baseProps?: object) => NodeFactory` | Creates a configurable UI node factory that supports flexible properties, dynamic styling, and theme resolution. |
| `Component` | `(render: (props: P) => ComponentNode) => React.Component<P>` | Transforms node trees into reusable React components with built-in type safety, prop handling, and seamless React integration. |
| `Portal` | `(component: (props: P & PortalProps) => ComponentNode) \| (provider: NodeElement, component: (props: P & PortalProps) => ComponentNode)` | Creates React Portal components with optional context provider wrapping. Components receive portal controls for programmatic mounting/unmounting and lifecycle management. |

### Pre-built Components

| Component Category | Components | Description |
| :--- | :--- | :--- |
| **Layout** | `Root`, `Center`, `Column`, `Row`, `Div`, `Section`, `Header`, `Footer`, `Main`, `Nav` | Semantic layout primitives with flexbox and grid support |
| **Typography** | `H1`, `H2`, `H3`, `H4`, `H5`, `H6`, `P`, `Text`, `Span`, `Strong`, `Em` | Typography elements with theme-aware styling |
| **Interactive** | `Button`, `Link`, `Input`, `Select`, `Textarea`, `Checkbox`, `Radio` | Form controls and interactive elements |
| **Media** | `Img`, `Video`, `Audio`, `Canvas`, `Svg` | Media and graphics components |
| **Semantic** | `Article`, `Aside`, `Details`, `Summary`, `Figure`, `Figcaption` | HTML5 semantic elements |

### PortalProps Interface

```tsx
interface PortalProps {
  portal: {
    unmount: () => void;
    mount: (component: ComponentNode) => void;
    isVisible: boolean;
  }
}
```

-----

## 🎨 Design Patterns

### 1\. Theme-First Design System

```tsx
// Complete design system setup
const designSystem = {
  colors: {
    brand: {
      primary: '#6366F1',
      secondary: '#8B5CF6',
      accent: '#F59E0B'
    },
    neutral: {
      50: '#F9FAFB',
      100: '#F3F4F6',
      500: '#6B7280',
      900: '#111827'
    },
    semantic: {
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#3B82F6'
    }
  },
  typography: {
    fontFamily: {
      sans: '"Inter", system-ui, sans-serif',
      mono: '"Fira Code", Consolas, monospace'
    },
    scale: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem'
    },
    weight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    }
  },
  spacing: {
    0: '0px',
    1: '0.25rem',
    2: '0.5rem',
    3: '0.75rem',
    4: '1rem',
    6: '1.5rem',
    8: '2rem',
    12: '3rem',
    16: '4rem'
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
  },
  borderRadius: {
    none: '0',
    sm: '0.125rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    full: '9999px'
  }
};

// Usage in components
const ThemedCard = Component<{ variant?: 'default' | 'success' | 'warning' | 'error' }>(
  ({ variant = 'default', children }) => {
    const variantStyles = {
      default: { 
        border: '1px solid theme.neutral.200',
        backgroundColor: 'theme.neutral.50' 
      },
      success: { 
        border: '1px solid theme.semantic.success',
        backgroundColor: '#F0FDF4' 
      },
      warning: { 
        border: '1px solid theme.semantic.warning',
        backgroundColor: '#FFFBEB' 
      },
      error: { 
        border: '1px solid theme.semantic.error',
        backgroundColor: '#FEF2F2' 
      }
    };

    return Div({
      theme: designSystem,
      padding: 'theme.spacing.6',
      borderRadius: 'theme.borderRadius.lg',
      boxShadow: 'theme.shadows.md',
      ...variantStyles[variant],
      children
    });
  }
);
```

### 2\. Responsive Design Patterns

```tsx
const ResponsiveGrid = Component<{ items: Array<{ title: string; content: string }> }>(
  ({ items }) =>
    Div({
      css: {
        display: 'grid',
        gap: '24px',
        
        // Responsive grid
        '@media (min-width: 640px)': {
          gridTemplateColumns: 'repeat(2, 1fr)'
        },
        '@media (min-width: 1024px)': {
          gridTemplateColumns: 'repeat(3, 1fr)'
        },
        '@media (min-width: 1280px)': {
          gridTemplateColumns: 'repeat(4, 1fr)'
        },
        
        // Grid item styling
        '& > *': {
          transition: 'transform 0.2s ease, box-shadow 0.2s ease'
        },
        
        '& > *:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 12px 24px rgba(0,0,0,0.15)'
        }
      },
      
      children: items.map((item, index) =>
        ThemedCard({
          key: index,
          children: [
            H2(item.title, {
              fontSize: '1.25rem',
              fontWeight: 'bold',
              marginBottom: 8,
              color: 'theme.neutral.900'
            }),
            P(item.content, {
              color: 'theme.neutral.600',
              lineHeight: 1.6
            })
          ]
        })
      )
    })
);
```

### 3\. Form Composition

```tsx
const ContactForm = Component(() => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
  };

  return Column({
    theme: designSystem,
    gap: 'theme.spacing.4',
    maxWidth: '500px',
    
    css: {
      '& input, & textarea': {
        width: '100%',
        padding: 'theme.spacing.3',
        borderRadius: 'theme.borderRadius.md',
        border: '1px solid theme.neutral.300',
        fontSize: 'theme.typography.scale.base',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
      },
      
      '& input:focus, & textarea:focus': {
        outline: 'none',
        borderColor: 'theme.colors.brand.primary',
        boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.1)'
      },
      
      '& label': {
        fontSize: 'theme.typography.scale.sm',
        fontWeight: 'theme.typography.weight.medium',
        color: 'theme.neutral.700',
        marginBottom: 'theme.spacing.2'
      }
    },
    
    children: [
      // Form element wrapper
      Node('form', {
        onSubmit: handleSubmit,
        children: [
          Column({
            gap: 'theme.spacing.2',
            children: [
              Node('label', { children: 'Name' }),
              Node('input', {
                type: 'text',
                value: formData.name,
                onChange: (e) => setFormData(prev => ({ ...prev, name: e.target.value })),
                placeholder: 'Enter your name'
              })
            ]
          }),
          
          Column({
            gap: 'theme.spacing.2',
            children: [
              Node('label', { children: 'Email' }),
              Node('input', {
                type: 'email',
                value: formData.email,
                onChange: (e) => setFormData(prev => ({ ...prev, email: e.target.value })),
                placeholder: 'Enter your email'
              })
            ]
          }),
          
          Column({
            gap: 'theme.spacing.2',
            children: [
              Node('label', { children: 'Message' }),
              Node('textarea', {
                value: formData.message,
                onChange: (e) => setFormData(prev => ({ ...prev, message: e.target.value })),
                placeholder: 'Enter your message',
                rows: 4
              })
            ]
          }),
          
          Button('Send Message', {
            type: 'submit',
            backgroundColor: 'theme.colors.brand.primary',
            color: 'white',
            padding: 'theme.spacing.3 theme.spacing.6',
            borderRadius: 'theme.borderRadius.md',
            fontWeight: 'theme.typography.weight.semibold',
            cursor: 'pointer',
            marginTop: 'theme.spacing.4'
          })
        ]
      })
    ]
  });
});
```

-----

## 🔧 Advanced Techniques

### Custom Hook Integration

```tsx
import { useState, useCallback } from 'react';

const useToggle = (initialValue = false) => {
  const [value, setValue] = useState(initialValue);
  const toggle = useCallback(() => setValue(v => !v), []);
  return [value, toggle] as const;
};

const ToggleCard = Component(() => {
  const [isExpanded, toggleExpanded] = useToggle(false);
  
  return Div({
    theme: designSystem,
    borderRadius: 'theme.borderRadius.lg',
    backgroundColor: 'white',
    boxShadow: 'theme.shadows.md',
    overflow: 'hidden',
    
    css: {
      transition: 'all 0.3s ease',
      cursor: 'pointer',
      
      '&:hover': {
        boxShadow: 'theme.shadows.lg',
        transform: 'translateY(-2px)'
      }
    },
    
    onClick: toggleExpanded,
    
    children: [
      Div({
        padding: 'theme.spacing.6',
        children: [
          H2('Expandable Card', {
            fontSize: 'theme.typography.scale.xl',
            marginBottom: 8
          }),
          P('Click to expand/collapse', {
            color: 'theme.neutral.600'
          })
        ]
      }),
      
      // Conditional expanded content
      isExpanded && Div({
        padding: 'theme.spacing.6',
        paddingTop: 0,
        borderTop: '1px solid theme.neutral.200',
        
        css: {
          animation: 'slideDown 0.3s ease',
          '@keyframes slideDown': {
            from: { 
              opacity: 0,
              maxHeight: 0,
              transform: 'translateY(-10px)' 
            },
            to: { 
              opacity: 1,
              maxHeight: '200px',
              transform: 'translateY(0)' 
            }
          }
        },
        
        children: P('This is the expanded content that appears when the card is clicked. It demonstrates conditional rendering with smooth animations.')
      })
    ]
  });
});
```

### Error Boundaries Integration

```tsx
import { Component, Div, H2, P, Button } from '@meonode/ui';
import { ErrorBoundary } from 'react-error-boundary';

const ErrorFallback = Component<{ error: Error; resetErrorBoundary: () => void }>(
  ({ error, resetErrorBoundary }) =>
    Div({
      theme: designSystem,
      padding: 'theme.spacing.8',
      backgroundColor: 'theme.semantic.error',
      color: 'white',
      borderRadius: 'theme.borderRadius.lg',
      textAlign: 'center',
      
      children: [
        H2('Something went wrong', {
          fontSize: 'theme.typography.scale.2xl',
          marginBottom: 16
        }),
        P(error.message, {
          marginBottom: 24,
          opacity: 0.9
        }),
        Button('Try Again', {
          backgroundColor: 'white',
          color: 'theme.semantic.error',
          padding: '12px 24px',
          borderRadius: 'theme.borderRadius.md',
          fontWeight: 'bold',
          cursor: 'pointer',
          onClick: resetErrorBoundary
        })
      ]
    })
);

const SafeApp = Component(() =>
  Node(ErrorBoundary, {
    FallbackComponent: ErrorFallback,
    onError: (error, errorInfo) => {
      console.error('App Error:', error, errorInfo);
    },
    children: YourMainApp()
  })
);
```

-----

## 🌟 Real-World Example Application

```tsx
import { Component, Root, Center, Column, Row, H1, H2, P, Button, Text, Portal } from '@meonode/ui';
import { useState, useEffect } from 'react';

// Complete theme system
const appTheme = {
  colors: {
    primary: {
      default: '#FF6B6B',
      content: '#4A0000',
      light: '#FFB3B3',
      dark: '#CC5555'
    },
    secondary: {
      default: '#6BCB77',
      content: '#0A3B0F',
      light: '#B3E6BC',
      dark: '#55A862'
    },
    base: {
      default: '#F8F8F8',
      content: '#333333',
      accent: '#88B04B',
      border: '#E0E0E0'
    }
  },
  spacing: {
    xs: '8px',
    sm: '12px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px'
  },
  typography: {
    family: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    sizes: {
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '2rem',
      '4xl': '2.5rem'
    }
  }
};

const notifications = [
  { id: 1, type: 'success', message: 'Component created successfully!' },
  { id: 2, type: 'info', message: 'MeoNode UI is theme-aware by default.' },
  { id: 3, type: 'warning', message: 'Remember to handle responsive design.' },
  { id: 4, type: 'error', message: 'This is just a demo error message.' }
];

// Enhanced Modal with animations and context
const NotificationModal = Portal<{ notification: typeof notifications[0] }>(
  ({ portal, notification }) => {
    useEffect(() => {
      const timer = setTimeout(portal.unmount, 4000);
      return () => clearTimeout(timer);
    }, [portal]);

    const typeStyles = {
      success: { bg: '#F0FDF4', border: '#22C55E', text: '#15803D' },
      info: { bg: '#EFF6FF', border: '#3B82F6', text: '#1D4ED8' },
      warning: { bg: '#FFFBEB', border: '#F59E0B', text: '#D97706' },
      error: { bg: '#FEF2F2', border: '#EF4444', text: '#DC2626' }
    }[notification.type];

    return Center({
      theme: appTheme,
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.4)',
      backdropFilter: 'blur(8px)',
      zIndex: 1000,
      
      onClick: (e) => {
        if (e.currentTarget === e.target) portal.unmount();
      },
      
      children: Column({
        backgroundColor: typeStyles.bg,
        borderRadius: 'theme.spacing.md',
        padding: 'theme.spacing.xl',
        margin: 'theme.spacing.lg',
        maxWidth: '400px',
        border: `2px solid ${typeStyles.border}`,
        
        css: {
          animation: 'modalSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
          
          '@keyframes modalSlideIn': {
            from: {
              opacity: 0,
              transform: 'scale(0.8) translateY(-40px)'
            },
            to: {
              opacity: 1,
              transform: 'scale(1) translateY(0)'
            }
          }
        },
        
        children: [
          H2(`${notification.type.toUpperCase()} Notification`, {
            color: typeStyles.text,
            fontSize: 'theme.typography.sizes.xl',
            marginBottom: 'theme.spacing.md',
            textAlign: 'center',
            textTransform: 'capitalize'
          }),
          
          P(notification.message, {
            color: typeStyles.text,
            lineHeight: 1.6,
            textAlign: 'center',
            marginBottom: 'theme.spacing.lg'
          }),
          
          Row({
            gap: 'theme.spacing.sm',
            justifyContent: 'center',
            children: [
              Button('Dismiss', {
                backgroundColor: 'transparent',
                color: typeStyles.text,
                border: `1px solid ${typeStyles.border}`,
                padding: 'theme.spacing.sm theme.spacing.md',
                borderRadius: 'theme.spacing.xs',
                cursor: 'pointer',
                onClick: portal.unmount
              }),
              
              Button('OK', {
                backgroundColor: typeStyles.border,
                color: 'white',
                padding: 'theme.spacing.sm theme.spacing.md',
                borderRadius: 'theme.spacing.xs',
                cursor: 'pointer',
                fontWeight: 'bold',
                onClick: portal.unmount
              })
            ]
          })
        ]
      })
    });
  }
);

// Main application component
const MeoNodeShowcase = Component(() => {
  const [selectedMessage, setSelectedMessage] = useState('');
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('light');

  const surprises = [
    'MeoNode makes UI development delightful! 🎉',
    'Intuitive design meets pure simplicity.',
    'Build beautiful interfaces effortlessly with type safety.',
    'Composable, theme-aware, and a joy to use!'
  ];

  const getRandomSurprise = () => {
    const randomMessage = surprises[Math.floor(Math.random() * surprises.length)];
    setSelectedMessage(randomMessage);
  };

  const showNotification = (type: 'success' | 'info' | 'warning' | 'error') => {
    const notification = notifications.find(n => n.type === type);
    if (notification) {
      NotificationModal({ notification });
    }
  };

  return Root({
    theme: appTheme,
    backgroundColor: currentTheme === 'light' ? 'theme.base.default' : '#1a1a1a',
    color: currentTheme === 'light' ? 'theme.base.content' : '#ffffff',
    minHeight: '100vh',
    fontFamily: 'theme.typography.family',
    
    children: Center({
      padding: 'theme.spacing.2xl',
      children: Column({
        gap: 'theme.spacing.xl',
        maxWidth: '800px',
        textAlign: 'center',
        
        css: {
          // Global button styling
          '& button': {
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            border: 'none',
            outline: 'none'
          },
          
          '& button:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
          },
          
          '& button:active': {
            transform: 'translateY(0)',
            transition: 'transform 0.1s ease'
          },
          
          // Responsive adjustments
          '@media (max-width: 768px)': {
            gap: 'theme.spacing.lg',
            padding: 'theme.spacing.lg',
            
            '& h1': {
              fontSize: 'theme.typography.sizes.3xl !important'
            }
          }
        },
        
        children: [
          // Header section
          Column({
            gap: 'theme.spacing.md',
            children: [
              H1('MeoNode UI Showcase', {
                fontSize: 'theme.typography.sizes.4xl',
                background: 'linear-gradient(135deg, theme.colors.primary.default, theme.colors.secondary.default)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: 'bold'
              }),
              
              P('Experience the power of function-based React components with advanced theming and CSS capabilities.', {
                fontSize: 'theme.typography.sizes.lg',
                color: currentTheme === 'light' ? 'theme.base.content' : '#cccccc',
                lineHeight: 1.6,
                maxWidth: '600px',
                margin: '0 auto'
              })
            ]
          }),
          
          // Interactive message display
          Div({
            padding: 'theme.spacing.lg',
            backgroundColor: currentTheme === 'light' ? 'white' : '#2a2a2a',
            borderRadius: 'theme.spacing.md',
            border: currentTheme === 'light' ? '1px solid theme.base.border' : '1px solid #404040',
            minHeight: '80px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            
            css: {
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: currentTheme === 'light' ? '#fafafa' : '#333333'
              }
            },
            
            children: Text(selectedMessage || 'Click a button below to see MeoNode in action! ✨', {
              fontSize: 'theme.typography.sizes.lg',
              color: currentTheme === 'light' ? 'theme.base.content' : '#ffffff',
              textAlign: 'center',
              lineHeight: 1.5
            })
          }),
          
          // Action buttons grid
          Row({
            gap: 'theme.spacing.md',
            justifyContent: 'center',
            flexWrap: 'wrap',
            children: [
              Button('🎉 Random Surprise', {
                backgroundColor: 'theme.colors.primary.default',
                color: 'theme.colors.primary.content',
                padding: 'theme.spacing.md theme.spacing.lg',
                borderRadius: 'theme.spacing.sm',
                fontSize: 'theme.typography.sizes.base',
                fontWeight: 'bold',
                cursor: 'pointer',
                onClick: getRandomSurprise
              }),
              
              Button('🌙 Toggle Theme', {
                backgroundColor: currentTheme === 'light' ? '#333333' : '#ffffff',
                color: currentTheme === 'light' ? '#ffffff' : '#333333',
                padding: 'theme.spacing.md theme.spacing.lg',
                borderRadius: 'theme.spacing.sm',
                fontSize: 'theme.typography.sizes.base',
                fontWeight: 'bold',
                cursor: 'pointer',
                onClick: () => setCurrentTheme(t => t === 'light' ? 'dark' : 'light')
              })
            ]
          }),
          
          // Notification demo buttons
          Column({
            gap: 'theme.spacing.sm',
            children: [
              H2('Portal Notifications Demo', {
                fontSize: 'theme.typography.sizes.xl',
                marginBottom: 'theme.spacing.md',
                color: currentTheme === 'light' ? 'theme.base.content' : '#ffffff'
              }),
              
              Row({
                gap: 'theme.spacing.sm',
                justifyContent: 'center',
                flexWrap: 'wrap',
                children: [
                  Button('✅ Success', {
                    backgroundColor: 'theme.colors.semantic.success',
                    color: 'white',
                    padding: 'theme.spacing.sm theme.spacing.md',
                    borderRadius: 'theme.spacing.xs',
                    cursor: 'pointer',
                    onClick: () => showNotification('success')
                  }),
                  
                  Button('ℹ️ Info', {
                    backgroundColor: 'theme.colors.semantic.info',
                    color: 'white',
                    padding: 'theme.spacing.sm theme.spacing.md',
                    borderRadius: 'theme.spacing.xs',
                    cursor: 'pointer',
                    onClick: () => showNotification('info')
                  }),
                  
                  Button('⚠️ Warning', {
                    backgroundColor: 'theme.colors.semantic.warning',
                    color: 'white',
                    padding: 'theme.spacing.sm theme.spacing.md',
                    borderRadius: 'theme.spacing.xs',
                    cursor: 'pointer',
                    onClick: () => showNotification('warning')
                  }),
                  
                  Button('❌ Error', {
                    backgroundColor: 'theme.colors.semantic.error',
                    color: 'white',
                    padding: 'theme.spacing.sm theme.spacing.md',
                    borderRadius: 'theme.spacing.xs',
                    cursor: 'pointer',
                    onClick: () => showNotification('error')
                  })
                ]
              })
            ]
          })
        ]
      })
    })
  });
});

export default MeoNodeShowcase;
```

-----

## 📋 Best Practices

### 1\. **Theme Organization**

- Structure themes hierarchically with logical groupings
- Use semantic naming for colors (primary, secondary, success, etc.)
- Include both light and dark variants in your theme system
- Define spacing and typography scales for consistency

### 2\. **Component Composition**

- Keep components focused and single-purpose
- Use the `Component` wrapper for reusable elements
- Leverage prop spreading for flexible component APIs
- Combine multiple simple components to create complex interfaces

### 3\. **Performance Optimization**

- Use React.memo for expensive components when needed
- Leverage the built-in tree-shaking capabilities
- Minimize theme object recreations in render functions
- Use CSS-in-JS patterns responsibly for optimal performance

### 4\. **CSS Architecture**

- Prefer theme values over hardcoded styles
- Use the `css` property for complex selectors and animations
- Implement responsive design through media queries
- Maintain consistent hover and focus states across components

-----

## 🔗 Integration Examples

### Next.js Integration

```tsx
// app/layout.tsx
import { Component, Root } from '@meonode/ui';
import { theme } from './theme';

const RootLayout = Component<{ children: React.ReactNode }>(({ children }) =>
  Root({
    theme,
    className: 'min-h-screen',
    children
  })
);
```

### Redux Integration

```tsx
import { Provider } from 'react-redux';
import { Node } from '@meonode/ui';
import store from './store';

const ReduxProvider = Node(Provider, { store });

const AppWithRedux = Component(() =>
  ReduxProvider({
    children: YourApp()
  })
);
```

-----

## 🌐 Community & Resources

### Example Repository

Explore a complete Next.js application showcasing MeoNode UI best practices...

**[🔗 MeoNode + Next.js Example](https://github.com/l7aromeo/react-meonode)**
**[🔗 Open in CodeSandbox](https://codesandbox.io/p/github/l7aromeo/react-meonode/main?import=true)**

This repository demonstrates:

- Server Component integration
- Redux state management with preloaded state
- Responsive design patterns
- Advanced portal usage
- Theme system implementation

-----

## 🤝 Contributing

We welcome contributions from the community\! Here's how to get started:

### Development Setup

```bash
# 1. Fork and clone the repository
git clone https://github.com/your-username/meonode-ui.git
cd meonode-ui

# 2. Install dependencies
npm install
# or
yarn install
# or
pnpm install

# 3. Start development server
npm run dev

# 4. Run tests
npm test

# 5. Build the project
npm run build
```

### Contribution Guidelines

1.  **🍴 Fork** the repository and create your feature branch
2.  **🔧 Install dependencies** and ensure tests pass
3.  **✨ Create your feature** with comprehensive tests
4.  **📝 Update documentation** for any new features
5.  **🧪 Test thoroughly** across different scenarios
6.  **📤 Submit a Pull Request** with a clear description

### Development Standards

- **TypeScript First** - All code must include proper type definitions
- **Test Coverage** - Maintain \>95% test coverage for new features
- **Documentation** - Update README and examples for new features
- **Performance** - Ensure no performance regressions
- **Accessibility** - Follow WCAG guidelines for new components

For major changes or new features, please open an issue first to discuss your proposal with the maintainers.

-----

## 📄 License & Support

**MIT Licensed** | Copyright © 2024 Ukasyah Rahmatullah Zada

### Getting Help

- 📚 **Documentation**: Full API reference and examples
- 🐛 **Issues**: [GitHub Issues](https://github.com/l7aromeo/meonode-ui/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/l7aromeo/meonode-ui/discussions)
- 📧 **Discord**: [l7aromeo](https://discord.com/users/704803255561224264)

-----

*Empowering developers to build exceptional UIs with type-safe, theme-aware, function-based React components.*

**MeoNode UI - Where Function Meets Beauty** ✨
