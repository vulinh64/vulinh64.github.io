import React from 'react';
import ReactPlayer from 'react-player';

const YoutubePlayer = ({ videoId }) => {
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

export default YoutubePlayer;