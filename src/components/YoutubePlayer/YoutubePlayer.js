import React from 'react';
import PropTypes from 'prop-types';
import ReactPlayer from 'react-player';
import styles from './styles.module.css';

const YoutubePlayer = ({ videoId }) => {
    if (!videoId || typeof videoId !== 'string' || videoId.length !== 11) {
      return (
        <div className={styles.errorContainer}>
          <p>⚠️ Error: Invalid YouTube Video ID</p>
          <p>Please provide a valid 11-character video ID.</p>
        </div>
      );
    }

    const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;

    return (
        <ReactPlayer
            controls={true}
            style={{
                width: '100%', height: 'auto', aspectRatio: '16/9'
            }}
            src={youtubeUrl}
        />
    );
};

YoutubePlayer.propTypes = {
    videoId: PropTypes.string.isRequired,
};

export default YoutubePlayer;