param(
    [string]$FfmpegPath = (Get-Command ffmpeg -ErrorAction Stop).Source
)

$ErrorActionPreference = 'Stop'
$repositoryRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$imageRoot = Join-Path $repositoryRoot 'public\images\landing'
$outputRoot = Join-Path $repositoryRoot 'public\assets\cinematic-drone'

$backgrounds = @(
    'rail-yard.jpg',
    'site-construction.jpg',
    'solar-field.jpg',
    'transmission-tower.jpg',
    'construction-1280.webp',
    'infrastructure-1280.webp',
    'highland-overview.webp',
    'landscape-1280.webp',
    'wind-farm.webp',
    'bridge-inspection.webp',
    'pipeline-corridor.webp',
    'hydroelectric-dam.webp',
    'open-pit-quarry.webp',
    'industrial-port.webp',
    'coastal-flood-barrier.webp',
    'landing-apron.webp'
)

$storyDuration = $backgrounds.Count
$frameCount = $storyDuration * 24
$lastFrame = $frameCount - 1

foreach ($background in $backgrounds) {
    $path = Join-Path $imageRoot $background
    if (-not (Test-Path -LiteralPath $path)) {
        throw "Missing landing background: $path"
    }
}

New-Item -ItemType Directory -Force -Path $outputRoot | Out-Null

function New-FilterGraph([int]$Width, [int]$Height, [bool]$Mobile) {
    $filters = [System.Collections.Generic.List[string]]::new()

    for ($index = 0; $index -lt $backgrounds.Count; $index++) {
        $duration = if ($index -eq $backgrounds.Count - 1) { '1' } else { '1.25' }
        $filters.Add("[$index`:v]scale=${Width}:${Height}:force_original_aspect_ratio=increase,crop=${Width}:${Height},fps=24,trim=duration=$duration,settb=AVTB,setpts=PTS-STARTPTS,format=yuv420p[background$index]")
    }

    $previous = '[background0]'
    for ($index = 1; $index -lt $backgrounds.Count; $index++) {
        $offset = $index.ToString('0.000', [Globalization.CultureInfo]::InvariantCulture)
        $label = "[transition$index]"
        $filters.Add("$previous[background$index]xfade=transition=fade:duration=0.25:offset=$offset$label")
        $previous = $label
    }

    $panX = '(iw-iw/zoom)/2'
    $panY = '(ih-ih/zoom)/2'
    if ($Mobile) {
        $panY = "(ih-ih/zoom)*on/$lastFrame"
    }
    $filters.Add("${previous}zoompan=z='1+0.035*on/$lastFrame':x='$panX':y='$panY':d=1:s=${Width}x${Height}:fps=24,trim=duration=$storyDuration,settb=AVTB,setpts=PTS-STARTPTS,format=yuv420p[video]")

    return $filters -join ';'
}

function Build-LivingMissionVideo([int]$Width, [int]$Height, [bool]$Mobile, [string]$OutputName, [string]$PosterName) {
    $arguments = [System.Collections.Generic.List[string]]::new()
    $arguments.AddRange([string[]]@('-hide_banner', '-loglevel', 'fatal', '-filter_complex_threads', '2', '-y'))

    for ($index = 0; $index -lt $backgrounds.Count; $index++) {
        $duration = if ($index -eq $backgrounds.Count - 1) { '1' } else { '1.25' }
        $arguments.AddRange([string[]]@('-loop', '1', '-framerate', '24', '-t', $duration, '-i', (Join-Path $imageRoot $backgrounds[$index])))
    }

    $arguments.AddRange([string[]]@('-filter_complex', (New-FilterGraph -Width $Width -Height $Height -Mobile $Mobile)))
    $arguments.AddRange([string[]]@(
        '-map', '[video]',
        '-frames:v', "$frameCount",
        '-c:v', 'libx264',
        '-threads', '2',
        '-preset', 'medium',
        '-crf', '28',
        '-profile:v', 'high',
        '-g', '3',
        '-keyint_min', '3',
        '-bf', '2',
        '-sc_threshold', '0',
        '-pix_fmt', 'yuv420p',
        '-movflags', '+faststart',
        '-an',
        (Join-Path $outputRoot $OutputName)
    ))

    & $FfmpegPath @arguments
    if ($LASTEXITCODE -ne 0) {
        throw "FFmpeg failed to create $OutputName (exit $LASTEXITCODE)."
    }

    & $FfmpegPath -hide_banner -y -ss 0.25 -i (Join-Path $outputRoot $OutputName) -frames:v 1 -c:v libwebp -quality 84 (Join-Path $outputRoot $PosterName)
    if ($LASTEXITCODE -ne 0) {
        throw "FFmpeg failed to create $PosterName (exit $LASTEXITCODE)."
    }
}

Build-LivingMissionVideo -Width 1280 -Height 720 -Mobile $false -OutputName 'living-mission-industrial-v5.mp4' -PosterName 'living-mission-industrial-v5-poster.webp'
Build-LivingMissionVideo -Width 720 -Height 1280 -Mobile $true -OutputName 'living-mission-mobile-industrial-v5.mp4' -PosterName 'living-mission-mobile-industrial-v5-poster.webp'

Write-Output "Created $storyDuration-second, 24 FPS scroll-scrubbed desktop and mobile mission videos."
