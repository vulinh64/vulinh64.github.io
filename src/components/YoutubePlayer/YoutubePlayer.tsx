import React from 'react';
import ReactPlayer from 'react-player';
import styles from './styles.module.css';
import clsx from "clsx";
import Link from "@docusaurus/Link";

// Add this to the beginning of MD file (below front matter) if you want to use this component:
// import YoutubePlayer from '@site/src/components/YoutubePlayer/YoutubePlayer';
// Then add this line to the MD file wherever you want to show the youtube video:
// <YoutubePlayer videoId="[[youtube-video-id]]"></YoutubePlayer>

interface YoutubePlayerProps {
    videoId: string;
    children?: React.ReactNode;   // ← add this
}

const YoutubePlayer: React.FC<YoutubePlayerProps> = ({videoId, children}) => {
    if (!videoId || typeof videoId !== 'string' || videoId.length !== 11) {
        return (
            <div className={clsx(styles.errorContainer, "margin-top--lg", "margin-bottom--lg")}>
                <p>⚠️ Error: Invalid YouTube Video ID</p>
                <p>Please provide a valid 11-character video ID.</p>
            </div>
        );
    }

    const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;

    return (
        <div className="margin-top--lg margin-bottom--lg">
            <ReactPlayer
                controls={true}
                style={{
                    width: '100%',
                    height: 'auto',
                    aspectRatio: '16/9'
                }}
                src={youtubeUrl}
            />

            {children && (
                <Link
                    to={youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={clsx(
                        styles.subtitle,
                        "text--center",
                        "text--italic",
                        "noLinkDecoration" // optional class if you want to remove underline
                    )}
                >
                    {children}
                </Link>
            )}
        </div>
    );
};

export default YoutubePlayer;