import React from 'react';
import Link from '@docusaurus/Link';
import styles from './styles.module.css';

// Import statement:
// import GoBackToTldrButton from '@site/src/components/GoBackToTldrButton';
// Usage: just put this in your MD files:
// <GoBackToTldrButton></GoBackToTldrButton>

// Requires a header called TL;DR in the post
function GoBackToTldrButton() {
  return (
    <Link
      to="#tldr"
      className={styles.goBackButton}>
      {'Click Here to Go Back to TL;DR'}
    </Link>
  );
}

export default GoBackToTldrButton;