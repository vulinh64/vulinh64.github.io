$videoId = Read-Host "Enter YouTube Video ID (for example: dQw4w9WgXcQ)"

if ([string]::IsNullOrWhiteSpace($videoId)) {
    Write-Host "Error: Video ID cannot be empty." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

$importChoice = Read-Host "Wanna get the import? (Y/N)"

Write-Host ""

if ($importChoice.ToLower() -eq "y") {
    Write-Host "import YoutubePlayer from '@site/src/components/YoutubePlayer/YoutubePlayer';"
}

Write-Host "<YoutubePlayer videoId=`"$videoId`"></YoutubePlayer>"
Write-Host ""