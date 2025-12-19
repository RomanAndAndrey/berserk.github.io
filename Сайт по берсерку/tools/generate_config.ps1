# PowerShell Script to Generate Manga Configuration
# Scans assets/manga/vol{X}/ch{Y} and creates js/manga-data.js

$assetsPath = Join-Path $PSScriptRoot "..\assets\manga"
$outputPath = Join-Path $PSScriptRoot "..\js\manga-data.js"

if (-not (Test-Path $assetsPath)) {
    Write-Host "Error: Assets folder not found at $assetsPath"
    exit 1
}

$volumes = @{}

# Get all Volume folders (vol1, vol2...)
$volDirs = Get-ChildItem -Path $assetsPath -Directory | Where-Object { $_.Name -match "^vol(\d+)$" }

foreach ($volDir in $volDirs) {
    $volNum = [int]$volDir.Name.Substring(3)
    $chapters = @{}

    # Check for cover
    $coverPath = "assets/manga/$($volDir.Name)/cover.jpg"
    
    # Get all Chapter folders (ch1, ch2...)
    $chDirs = Get-ChildItem -Path $volDir.FullName -Directory | Where-Object { $_.Name -match "^ch(\d+)$" }

    foreach ($chDir in $chDirs) {
        $chNum = [int]$chDir.Name.Substring(2)
        
        # Get all image files
        $images = Get-ChildItem -Path $chDir.FullName -File | Where-Object { $_.Extension -match "\.(jpg|jpeg|png|webp)$" } | Sort-Object Name
        
        $pageList = @()
        foreach ($img in $images) {
            $pageList += $img.Name
        }

        # Convert keys to String to avoid ConvertTo-Json issues
        $chapters["$chNum"] = @{
            title = "Chapter $chNum" 
            pages = $pageList
        }
    }

    $volumes["$volNum"] = @{
        title = "Volume $volNum"
        cover = $coverPath
        chapters = $chapters
    }
}

# Convert to JSON
$json = $volumes | ConvertTo-Json -Depth 5

# Wrap in JS variable
$content = "const generatedMangaData = " + $json + ";"

# Write to file
Set-Content -Path $outputPath -Value $content -Encoding UTF8
Write-Host "Successfully generated $outputPath"
