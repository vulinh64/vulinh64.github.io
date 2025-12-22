#!/bin/bash

read -p "Enter YouTube Video ID (for example: dQw4w9WgXcQ): " videoId

if [ -z "$videoId" ]; then
    echo -e "\033[0;31mError: Video ID cannot be empty.\033[0m"
    read -p "Press Enter to exit"
    exit 1
fi

read -p "Wanna get the import? (Y/N): " importChoice

echo ""

importChoiceLower=$(echo "$importChoice" | tr '[:upper:]' '[:lower:]')

if [ "$importChoiceLower" = "y" ]; then
    echo "import YoutubePlayer from '@site/src/components/YoutubePlayer/YoutubePlayer';"
fi

echo "<YoutubePlayer videoId=\"$videoId\"></YoutubePlayer>"
echo ""
