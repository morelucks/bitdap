# Implementation Plan - Dark/Light Mode Theme System

- [ ] 1. Set up theme infrastructure and context
  - Create ThemeContext with theme state management
  - Implement useTheme hook for component access
  - Add theme type definitions and interfaces
  - _Requirements: 1.1, 2.1_

- [ ]* 1.1 Write unit tests for ThemeContext
  - Test context initialization
  - Test theme toggle functionality
  - Test setTheme method
  - _Requirements: 1.1, 1.2_

- [ ] 2. Implement theme persistence layer
  - Create localStorage utilities for theme storage
  - Implement theme retrieval from localStorage
  - Add system preference detection
  - Handle localStorage unavailability gracefully
  - _Requirements: 1.3, 1.4, 1.5_

- [ ]* 2.1 Write property test for theme persistence
  - **Property 1: Theme Persistence Round Trip**
  - **Validates: Requirements 1.3, 1.4**

- [ ] 3. Create ThemeProvider component
  - Wrap application with theme context
  - Initialize theme on mount
  - Detect system preference changes
  - Apply theme to document root
  - _Requirements: 1.4, 1.5_

- [ ]* 3.1 Write unit tests for ThemeProvider
  - Test initialization with localStorage
  - Test initialization with system preference
  - Test system preference change detection
  - _Requirements: 1.4, 1.5_

- [ ] 4. Define light mode color palette
  - Create CSS variables for light theme
  - Define background colors
  - Define text colors
  - Define border and accent colors
  - _Requirements: 2.1, 2.2_

- [ ] 5. Define dark mode color palette
  - Create CSS variables for dark theme
  - Define background colors
  - Define text colors
  - Define border and accent colors
  - _Requirements: 2.1, 2.2_

- [ ]* 5.1 Write property test for theme application consistency
  - **Property 2: Theme Application Consistency**
  - **Validates: Requirements 2.1, 2.2, 3.2**

- [ ] 6. Update globals.css with CSS variables
  - Add CSS variable definitions for both themes
  - Implement theme switching via data-theme attribute
  - Add smooth transitions for color changes
  - _Requirements: 2.1, 2.2, 3.1, 3.2_

- [ ] 7. Create ThemeToggle component
  - Build toggle button UI
  - Add theme icon that changes based on current theme
  - Implement click handler for theme switching
  - Add accessibility attributes
  - _Requirements: 1.1, 4.1, 4.2, 4.3_

- [ ]* 7.1 Write unit tests for ThemeToggle component
  - Test button renders correctly
  - Test click toggles theme
  - Test icon changes with theme
  - Test accessibility attributes
  - _Requirements: 1.1, 4.1_

- [ ] 8. Update layout.tsx with ThemeProvider
  - Wrap RootLayout with ThemeProvider
  - Ensure ThemeProvider wraps all children
  - Add ThemeToggle to header
  - _Requirements: 1.1, 4.1_

- [ ] 9. Update globals.css for light mode
  - Add light mode background gradient
  - Update card styles for light mode
  - Update text colors for light mode
  - Update border colors for light mode
  - _Requirements: 2.1, 5.1, 5.2_

- [ ] 10. Update component styles for theme support
  - Update WalletConnectButton.module.css
  - Update MarketplaceListings.module.css
  - Update MarketplaceStats.module.css
  - Update PurchaseModal.module.css
  - _Requirements: 2.1, 2.2, 5.1, 5.2_

- [ ] 11. Update CreateListing component styles
  - Add light mode styles
  - Update form input colors
  - Update button styles
  - _Requirements: 2.1, 5.1, 5.2_

- [ ] 12. Update ContractInfo component styles
  - Add light mode styles
  - Update card backgrounds
  - Update text colors
  - _Requirements: 2.1, 5.1, 5.2_

- [ ] 13. Update ContractDetails component styles
  - Add light mode styles
  - Update explorer link colors
  - Update status badge colors
  - _Requirements: 2.1, 5.1, 5.2_

- [ ] 14. Update WalletExample component styles
  - Add light mode styles
  - Update example code display
  - Update button styles
  - _Requirements: 2.1, 5.1, 5.2_

- [ ]* 14.1 Write property test for contrast maintenance
  - **Property 3: Contrast Maintenance**
  - **Validates: Requirements 5.1, 5.2**

- [ ] 15. Update marketplace page styles
  - Add light mode styles to marketplace.module.css
  - Update grid and card styles
  - Update text and border colors
  - _Requirements: 2.1, 5.1, 5.2_

- [ ] 16. Add theme transition animations
  - Implement smooth color transitions
  - Add transition timing (300ms)
  - Prevent transition on initial load
  - _Requirements: 3.1, 3.2, 3.3_

- [ ]* 16.1 Write unit tests for theme transitions
  - Test transition timing
  - Test no transition on initial load
  - Test smooth color changes
  - _Requirements: 3.1, 3.2_

- [ ] 17. Update page.tsx with theme support
  - Add light mode styles to home page
  - Update hero section colors
  - Update button and link colors
  - _Requirements: 2.1, 5.1, 5.2_

- [ ] 18. Add mobile responsiveness for theme toggle
  - Ensure toggle button is accessible on mobile
  - Add touch-friendly sizing
  - Test on various screen sizes
  - _Requirements: 4.4_

- [ ]* 18.1 Write unit tests for mobile responsiveness
  - Test toggle button on mobile viewports
  - Test touch interactions
  - Test layout on small screens
  - _Requirements: 4.4_

- [ ]* 18.2 Write property test for system preference detection
  - **Property 4: System Preference Detection**
  - **Validates: Requirements 1.5**

- [ ] 19. Create theme utilities file
  - Add helper functions for theme operations
  - Add color conversion utilities
  - Add theme validation functions
  - _Requirements: 2.1, 2.2_

- [ ]* 19.1 Write unit tests for theme utilities
  - Test theme validation
  - Test color operations
  - Test helper functions
  - _Requirements: 2.1, 2.2_

- [ ] 20. Update README with theme documentation
  - Document theme system architecture
  - Add usage examples
  - Document CSS variables
  - Add troubleshooting guide
  - _Requirements: 2.1, 2.2_

- [ ]* 20.1 Write property test for toggle idempotence
  - **Property 5: Toggle State Idempotence**
  - **Validates: Requirements 1.1, 1.2**

- [ ] 21. Checkpoint - Ensure all tests pass
  - Run all unit tests
  - Run all property-based tests
  - Verify no console errors
  - Test theme switching manually
  - _Requirements: All_

- [ ] 22. Add keyboard navigation support
  - Implement keyboard shortcut for theme toggle (e.g., Ctrl+Shift+T)
  - Add focus management
  - Test with screen readers
  - _Requirements: 4.1, 4.2_

- [ ]* 22.1 Write unit tests for keyboard navigation
  - Test keyboard shortcut
  - Test focus management
  - Test screen reader compatibility
  - _Requirements: 4.1, 4.2_

- [ ] 23. Final Checkpoint - Verify complete implementation
  - Ensure all tests pass
  - Test theme persistence across sessions
  - Test system preference detection
  - Verify all components styled correctly
  - _Requirements: All_
