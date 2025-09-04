import React, {type ReactNode, useState, useEffect, useCallback} from 'react';
import clsx from 'clsx';
import TOCItems from '@theme/TOCItems';
import type {Props} from '@theme/TOC';

import styles from './styles.module.css';

// =============================================================================
// CONSTANTS
// =============================================================================

const MOBILE_BREAKPOINT_PX = 996; // Match Docusaurus default breakpoint
const HEADING_LEVEL_H2 = 2; // Only show H2 headings on mobile for cleaner navigation

// CSS class names for TOC links
const TOC_LINK_BASE_CLASS = 'table-of-contents__link toc-highlight';
const TOC_LINK_ACTIVE_CLASS = 'table-of-contents__link--active';

// =============================================================================
// ICON COMPONENTS
// =============================================================================

const MenuIcon = () => (
    <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
    >
        <line x1="8" y1="6" x2="21" y2="6"/>
        <line x1="8" y1="12" x2="21" y2="12"/>
        <line x1="8" y1="18" x2="21" y2="18"/>
        <line x1="3" y1="6" x2="3.01" y2="6"/>
        <line x1="3" y1="12" x2="3.01" y2="12"/>
        <line x1="3" y1="18" x2="3.01" y2="18"/>
    </svg>
);

const CloseIcon = () => (
    <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
    >
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
);

// =============================================================================
// CUSTOM HOOKS
// =============================================================================

/**
 * Hook to detect if viewport is at mobile breakpoint
 * Handles window resize events for responsive behavior
 */
const useMobileViewport = () => {
    const [isMobileViewport, setIsMobileViewport] = useState(false);

    useEffect(() => {
        const updateViewportState = () => {
            setIsMobileViewport(window.innerWidth <= MOBILE_BREAKPOINT_PX);
        };

        // Set initial state
        updateViewportState();

        // Listen for viewport changes (resize, orientation change)
        window.addEventListener('resize', updateViewportState);

        return () => window.removeEventListener('resize', updateViewportState);
    }, []);

    return isMobileViewport;
};

/**
 * Hook to detect when user has scrolled past the first H2 heading
 */
const useScrollPastFirstH2 = () => {
    const [hasScrolledPastFirstH2, setHasScrolledPastFirstH2] = useState(false);

    useEffect(() => {
        const checkScrollPosition = () => {
            // Find the first H2 heading in the document
            const firstH2 = document.querySelector('h2');

            if (!firstH2) {
                // If no H2 exists, don't show the button
                setHasScrolledPastFirstH2(false);
                return;
            }

            // Get the position of the first H2 relative to the viewport
            const rect = firstH2.getBoundingClientRect();
            const navbarHeight = getComputedStyle(document.documentElement)
                .getPropertyValue('--ifm-navbar-height') || '60px';
            const navbarHeightPx = parseInt(navbarHeight, 10) || 60;

            // Consider "scrolled past" when the H2 is above the navbar + some buffer
            const buffer = 20; // Small buffer for better UX
            const hasScrolledPast = rect.bottom < (navbarHeightPx + buffer);

            setHasScrolledPastFirstH2(hasScrolledPast);
        };

        // Check initial position
        checkScrollPosition();

        // Listen for scroll events with throttling for better performance
        let ticking = false;
        const handleScroll = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    checkScrollPosition();
                    ticking = false;
                });
                ticking = true;
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return hasScrolledPastFirstH2;
};

/**
 * Hook to prevent body scroll when mobile menu is open
 * Preserves original overflow style for proper cleanup
 */
const useScrollLock = (shouldLockScroll: boolean) => {
    useEffect(() => {
        if (!shouldLockScroll) return;

        const originalBodyOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = originalBodyOverflow;
        };
    }, [shouldLockScroll]);
};

// =============================================================================
// COMPONENT INTERFACES
// =============================================================================

interface FloatingTOCButtonProps {
    onToggleMenu: () => void;
    isMenuOpen: boolean;
}

interface MobileNavigationMenuProps {
    isVisible: boolean;
    onClose: () => void;
    tocConfiguration: Props;
    filteredHeadings: any[];
}

// =============================================================================
// MOBILE TOC COMPONENTS
// =============================================================================

const FloatingTOCButton: React.FC<FloatingTOCButtonProps> = ({
                                                                 onToggleMenu,
                                                                 isMenuOpen
                                                             }) => (
    <button
        className={styles.floatingTocButton}
        onClick={onToggleMenu}
        aria-label={isMenuOpen ? "Close table of contents" : "Open table of contents"}
        aria-expanded={isMenuOpen}
        type="button"
    >
        <MenuIcon />
    </button>
);

const MobileNavigationMenu: React.FC<MobileNavigationMenuProps> = ({
                                                                       isVisible,
                                                                       onClose,
                                                                       tocConfiguration,
                                                                       filteredHeadings
                                                                   }) => {
    if (!isVisible) return null;

    const mobileMenuProps = {
        ...tocConfiguration,
        toc: filteredHeadings
    };

    return (
        <>
            {/* Background overlay - clicking closes the menu */}
            <div
                className={styles.navigationOverlay}
                onClick={onClose}
                role="button"
                tabIndex={0}
                aria-label="Close navigation menu"
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        onClose();
                    }
                }}
            />

            {/* Slide-out navigation panel */}
            <nav className={styles.mobileNavigationPanel} role="navigation" aria-label="Table of contents">
                <header className={styles.navigationHeader}>
                    <h3 className={styles.navigationTitle}>Contents</h3>
                    <button
                        className={styles.closeNavigationButton}
                        onClick={onClose}
                        aria-label="Close navigation menu"
                        type="button"
                    >
                        <CloseIcon />
                    </button>
                </header>

                <div className={styles.navigationContent}>
                    <TOCItems
                        {...mobileMenuProps}
                        linkClassName={TOC_LINK_BASE_CLASS}
                        linkActiveClassName={TOC_LINK_ACTIVE_CLASS}
                        onLinkClick={onClose}
                    />
                </div>
            </nav>
        </>
    );
};

// =============================================================================
// MAIN TOC COMPONENT
// =============================================================================

export default function TOC({ className, ...tocProps }: Props): ReactNode {
    // State management
    const [isMobileMenuVisible, setIsMobileMenuVisible] = useState(false);

    // Custom hooks
    const isMobileViewport = useMobileViewport();
    const hasScrolledPastFirstH2 = useScrollPastFirstH2();
    useScrollLock(isMobileMenuVisible);

    // Data processing
    const h2HeadingsOnly = tocProps.toc?.filter(
        heading => heading.level === HEADING_LEVEL_H2
    ) || [];

    // Conditional rendering logic - now includes scroll check
    const shouldShowMobileTOC = isMobileViewport &&
        h2HeadingsOnly.length > 0 &&
        hasScrolledPastFirstH2;

    // Event handlers
    const handleToggleMobileMenu = useCallback(() => {
        setIsMobileMenuVisible(prevState => !prevState);
    }, []);

    const handleCloseMobileMenu = useCallback(() => {
        setIsMobileMenuVisible(false);
    }, []);

    return (
        <>
            {/* Desktop TOC - Traditional sticky sidebar */}
            <div className={clsx(
                styles.desktopTableOfContents,
                'thin-scrollbar',
                className
            )}>
                <TOCItems
                    {...tocProps}
                    linkClassName={TOC_LINK_BASE_CLASS}
                    linkActiveClassName={TOC_LINK_ACTIVE_CLASS}
                />
            </div>

            {/* Mobile TOC - Floating button with slide-out menu */}
            {shouldShowMobileTOC && (
                <>
                    <FloatingTOCButton
                        onToggleMenu={handleToggleMobileMenu}
                        isMenuOpen={isMobileMenuVisible}
                    />
                    <MobileNavigationMenu
                        isVisible={isMobileMenuVisible}
                        onClose={handleCloseMobileMenu}
                        tocConfiguration={tocProps}
                        filteredHeadings={h2HeadingsOnly}
                    />
                </>
            )}
        </>
    );
}