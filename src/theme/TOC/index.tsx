import React, {type ReactNode, useState, useEffect, useCallback} from 'react';
import clsx from 'clsx';
import TOCItems from '@theme/TOCItems';
import type {Props} from '@theme/TOC';

import styles from './styles.module.css';

// Constants for consistent styling and behavior
const LINK_CLASS_NAME = 'table-of-contents__link toc-highlight';
const LINK_ACTIVE_CLASS_NAME = 'table-of-contents__link--active';
const MOBILE_BREAKPOINT = 996; // Match Docusaurus default mobile breakpoint

const TOCIcon = () => (
    <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
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
    >
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
);

/**
 * Custom hook to detect mobile viewport
 * Listens to window resize events to handle orientation changes
 * @returns {boolean} true if viewport width is <= mobile breakpoint
 */
const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkIfMobile = () => {
            setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
        };

        // Check on mount
        checkIfMobile();

        // Listen for window resize events (handles device rotation, browser resize)
        window.addEventListener('resize', checkIfMobile);

        // Cleanup listener on unmount
        return () => window.removeEventListener('resize', checkIfMobile);
    }, []);

    return isMobile;
};

/**
 * Custom hook to prevent body scrolling when mobile menu is open
 * This prevents the background content from scrolling while the TOC overlay is visible
 * Uses overflow:hidden instead of position:fixed to preserve anchor navigation
 * @param {boolean} isLocked - whether to lock scrolling
 */
const useBodyScrollLock = (isLocked: boolean) => {
    useEffect(() => {
        if (isLocked) {
            // Store original overflow value to restore later
            const originalOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';

            // Cleanup function to restore original overflow
            return () => {
                document.body.style.overflow = originalOverflow;
            };
        }
    }, [isLocked]);
};

interface MobileTOCButtonProps {
    onClick: () => void;
}

const MobileTOCButton: React.FC<MobileTOCButtonProps> = ({onClick}) => (
    <button
        className={styles.mobileTocButton}
        onClick={onClick}
        aria-label="Contents"
        type="button"
    >
        <TOCIcon/>
    </button>
);

interface MobileTOCMenuProps {
    isOpen: boolean;
    onClose: () => void;
    tocProps: Props;
    filteredToc: any[]; // TOC items filtered to only show H2 headings
}

const MobileTOCMenu: React.FC<MobileTOCMenuProps> = ({
                                                         isOpen,
                                                         onClose,
                                                         tocProps,
                                                         filteredToc
                                                     }) => {
    // Don't render anything if menu is closed
    if (!isOpen) return null;

    // Create modified props with filtered TOC for mobile
    const mobileTocProps = {...tocProps, toc: filteredToc};

    return (
        <>
            {/* Semi-transparent overlay that closes menu when clicked */}
            <div className={styles.mobileTocOverlay} onClick={onClose}/>

            {/* Slide-in menu from right side */}
            <div className={styles.mobileTocMenu}>
                {/* Menu header with title and close button */}
                <div className={styles.mobileTocHeader}>
                    <h3>Contents</h3>
                    <button
                        className={styles.closeMobileToc}
                        onClick={onClose}
                        aria-label="Close TOC"
                        type="button"
                    >
                        <CloseIcon/>
                    </button>
                </div>

                {/* Scrollable TOC content area */}
                <div className={styles.mobileTocContent}>
                    <TOCItems
                        {...mobileTocProps}
                        linkClassName={LINK_CLASS_NAME}
                        linkActiveClassName={LINK_ACTIVE_CLASS_NAME}
                        onLinkClick={onClose} // Auto-close menu when TOC item is clicked
                    />
                </div>
            </div>
        </>
    );
};

export default function TOC({className, ...props}: Props): ReactNode {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const isMobile = useIsMobile();

    // Prevent background scrolling when mobile menu is open
    useBodyScrollLock(isMobileMenuOpen);

    // Filter TOC to only show H2 headings on mobile for cleaner navigation
    const filteredTocTree = props.toc?.filter(item => item.level === 2) || [];

    // Only show mobile TOC if we're on mobile AND have H2 headings to show
    const showMobileTOC = isMobile && filteredTocTree.length > 0;

    // Event handlers with useCallback to prevent unnecessary re-renders
    const toggleMobileMenu = useCallback(() => {
        setIsMobileMenuOpen(prev => !prev);
    }, []);

    const closeMobileMenu = useCallback(() => {
        setIsMobileMenuOpen(false);
    }, []);

    return (
        <>
            {/* Desktop TOC - traditional sticky sidebar */}
            <div className={clsx(styles.tableOfContents, 'thin-scrollbar', className, styles.desktopToc)}>
                <TOCItems
                    {...props}
                    linkClassName={LINK_CLASS_NAME}
                    linkActiveClassName={LINK_ACTIVE_CLASS_NAME}
                />
            </div>

            {/* Mobile TOC - floating button + slide-out menu */}
            {showMobileTOC && (
                <>
                    <MobileTOCButton onClick={toggleMobileMenu}/>
                    <MobileTOCMenu
                        isOpen={isMobileMenuOpen}
                        onClose={closeMobileMenu}
                        tocProps={props}
                        filteredToc={filteredTocTree}
                    />
                </>
            )}
        </>
    );
}