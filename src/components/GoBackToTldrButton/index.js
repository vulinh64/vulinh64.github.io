import React from 'react';
import Link from '@docusaurus/Link';
import styles from './styles.module.css';

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