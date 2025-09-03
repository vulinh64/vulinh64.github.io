import React from 'react';
import Link from '@docusaurus/Link';
import styles from './styles.module.css';
import clsx from "clsx";

// Import statement:
// import GoBackToTldrButton from '@site/src/components/GoBackToTldrButton';
// Usage: just put this in your MD files:
// <GoBackToTldrButton></GoBackToTldrButton>

// Requires a header called TL;DR in the post
const GoBackToTldrButton: React.FC = () => {
    return (
        <Link
            to="#tldr"
            className={clsx(styles.goBackButton, "margin-top--lg", "margin-bottom--lg")}>
            {'Click Here to Go Back to TL;DR'}
        </Link>
    );
};

export default GoBackToTldrButton;