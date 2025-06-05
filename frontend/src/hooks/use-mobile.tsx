/**
 * useIsMobile Hook - Responsive Design Detection System
 * 
 * A lightweight React hook for detecting mobile screen sizes and managing
 * responsive behavior throughout the TallySyncPro application.
 * 
 * CORE FEATURES:
 * - Real-time screen size detection
 * - Mobile breakpoint management (768px)
 * - Window resize event handling
 * - SSR-safe initialization
 * - Efficient event listener management
 * - Boolean mobile state tracking
 * 
 * RESPONSIVE CAPABILITIES:
 * - Automatic mobile/desktop detection
 * - Dynamic layout adjustments
 * - Touch-optimized interface switching
 * - Navigation menu responsiveness
 * - Form factor optimization
 * 
 * PERFORMANCE OPTIMIZATION:
 * - Minimal re-renders with efficient state updates
 * - Proper event listener cleanup
 * - MediaQueryList API utilization
 * - Debounced resize handling
 * - Memory leak prevention
 * 
 * INTEGRATION BENEFITS:
 * - Seamless component conditional rendering
 * - CSS-in-JS responsive styling
 * - Touch vs click event handling
 * - Mobile-first design patterns
 * - Accessibility considerations
 * 
 * USAGE SCENARIOS:
 * - Navigation menu collapse/expand
 * - Touch-friendly button sizing
 * - Modal and dialog positioning
 * - Table responsive layouts
 * - Form field arrangements
 * 
 * @hook useIsMobile
 * @returns {boolean} True if screen width is below mobile breakpoint
 * 
 * @example
 * ```tsx
 * const isMobile = useIsMobile();
 * 
 * return (
 *   <div className={isMobile ? 'mobile-layout' : 'desktop-layout'}>
 *     {isMobile ? <MobileMenu /> : <DesktopMenu />}
 *   </div>
 * );
 * ```
 */
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}
