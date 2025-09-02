# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.4] - 2025-09-02

### Added
- **core**: Exposed the original element via the created Node for easier access and debugging.
    ```typescript
    import { createNode } from "@meonode/ui";

    // Create a Node wrapping a 'div' element
    const MyComp = createNode('div');

    // Access the underlying element type
    console.log(MyComp.element); // 'div'
    ```

## [0.2.3] - 2025-09-01

### Fixed
- **types**: Remove forbidden css import to resolve RSC error

### Changed
- **package**: Bump version to 0.2.3

## [0.2.2] - 2025-09-01

### Added
- **core**: Include nativeProps in props extraction for improved component flexibility

### Enhanced
- **types**: Enhance StyledRendererProps and FinalNodeProps for improved type safety

### Changed
- **package**: Bump version to 0.2.2

## [0.2.1] - 2025-09-01

### Changed
- **types**: Update CSS type from CSSObject to CSSInterpolation for better compatibility
- **package**: Bump version to 0.2.1

## [0.2.0] - 2025-08-31

### Added
- **docs**: Add badges for NPM version, license, and bundle size to README

### Enhanced
- **docs**: Update installation instructions and enhance clarity in core concepts
- **docs**: Enhance documentation with new examples and improved clarity

### Removed
- **package**: Remove deprecated hook entry from package.json

### Fixed
- **core.node**: Add suppressHydrationWarning to propsForCreateElement

### Changed
- **package**: Bump version to 0.2.0

## [0.1.121] - 2025-08-30

### Changed
- **core.node**: Simplify style resolution and improve prop handling
- **StyledRenderer**: Remove unused style prop and simplify component
- **package**: Bump version to 0.1.121

## [0.1.120] - 2025-08-30

### Added
- **styles**: Add Emotion support and Next.js style registry integration
    - Add @emotion/react and @emotion/cache dependencies
    - Add StyledRenderer and StyleRegistry components for Emotion
    - Integrate StyledRenderer into BaseNode for style prop rendering
    - Add nextjs-registry export for Next.js style registry

### Enhanced
- **core**: Enhance style handling with StyledRenderer for Emotion support

### Fixed
- **deps**: Update peerDependencies for Emotion and React to use version constraints
- **deps**: Update @types/react and @types/react-dom to latest versions

### Changed
- **package**: Update peerDependencies for @emotion/cache
- **package**: Bump version to 0.1.120

## [0.1.118] - 2025-08-30

### Fixed
- **deps**: Update peerDependencies for Emotion and React to use version constraints

### Changed
- **package**: Bump version to 0.1.118

## [0.1.117] - 2025-08-30

### Added
- **flexbox**: Improve default style resolution and add flex shorthand parser
    - Add parseFlexShorthand to extract flex-grow, shrink, and basis
    - Enhance resolveDefaultStyle to respect explicit flex/flexShrink values
    - Improve handling of minHeight, minWidth, and flexShrink for flex items

### Enhanced
- **core**: Refine type of finalChildren for improved type safety
- **docs**: Update documentation for clarity on flexbox scrolling fixes

### Changed
- **core**: Move comments position for better readability
- **imports**: Remove .js extensions from internal imports
- **package**: Bump version to 0.1.117

## [0.1.116] - 2025-08-27

### Changed
- **package**: Bump version to 0.1.116

---

## Notes

- This changelog covers the most recent development history available
- The project focuses on building React UIs with type-safe fluency without JSX syntax
- Recent development has emphasized Emotion integration, type safety improvements, and enhanced flexbox support
- For a complete history, view all commits on GitHub: [View all commits](https://github.com/l7aromeo/meonode-ui/commits)

## Development Highlights

### Major Features Added
- **Emotion Support**: Complete integration with @emotion/react for CSS-in-JS styling
- **Next.js Integration**: Style registry support for server-side rendering
- **Enhanced Type Safety**: Improved TypeScript definitions and prop handling
- **Flexbox Enhancements**: Advanced flex shorthand parsing and default style resolution

### Core Improvements
- Better component flexibility with native props extraction
- Simplified style resolution and prop handling
- Enhanced documentation and examples
- Improved dependency management and version constraints
