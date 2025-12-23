# PowerShell скрипт для генерации конфигурации манги
# Сканирует assets/manga/vol{X}/ch{Y} и создает js/manga-data.js

$assetsPath = Join-Path $PSScriptRoot "..\assets\manga"
$outputPath = Join-Path $PSScriptRoot "..\js\manga-data.js"

if (-not (Test-Path $assetsPath)) {
    Write-Host "Error: Assets folder not found at $assetsPath"
    exit 1
}

$volumes = @{}

# Получить все папки томов (vol1, vol2...)
$volDirs = Get-ChildItem -Path $assetsPath -Directory | Where-Object { $_.Name -match "^vol(\d+)$" }

foreach ($volDir in $volDirs) {
    $volNum = [int]$volDir.Name.Substring(3)
    $chapters = @{}

    # Проверка наличия обложки
    $coverPath = "assets/manga/$($volDir.Name)/cover.jpg"
    
    # Получить все папки глав (ch1, ch2...)
    $chDirs = Get-ChildItem -Path $volDir.FullName -Directory | Where-Object { $_.Name -match "^ch(\d+)$" }

    foreach ($chDir in $chDirs) {
        $chNum = [int]$chDir.Name.Substring(2)
        
        # Получить все файлы изображений
        $images = Get-ChildItem -Path $chDir.FullName -File | Where-Object { $_.Extension -match "\.(jpg|jpeg|png|webp)$" } | Sort-Object Name
        
        $pageList = @()
        foreach ($img in $images) {
            $pageList += $img.Name
        }

        # Преобразовать ключи в строку во избежание проблем с ConvertTo-Json
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

# --- Генерация Материалов ---
$materialsPath = Join-Path $PSScriptRoot "..\assets\materials"
$materialsList = @()

if (Test-Path $materialsPath) {
    $matImages = Get-ChildItem -Path $materialsPath -File | Where-Object { $_.Extension -match "\.(jpg|jpeg|png|webp|gif)$" } | Sort-Object Name
    foreach ($img in $matImages) {
        $materialsList += "assets/materials/$($img.Name)"
    }
} else {
    Write-Host "Materials folder not found at $materialsPath, skipping materials generation."
}

# Конвертация в JSON
$jsonVolumes = $volumes | ConvertTo-Json -Depth 5
$jsonMaterials = $materialsList | ConvertTo-Json -Depth 2

# Обернуть в JS переменную
$content = "const generatedMangaData = $jsonVolumes;`nconst generatedMaterialsData = $jsonMaterials;"

# Записать в файл
Set-Content -Path $outputPath -Value $content -Encoding UTF8
Write-Host "Successfully generated $outputPath"
