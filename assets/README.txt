INSTRUCTIONS FOR ADDING MANGA PAGES
=====================================

1. Folders have been created for you matching the initial configuration in `js/script.js`.
   Structure: assets/manga/vol{X}/ch{Y}/

2. Place your images in the respective folders.
   Naming convention: 01.jpg, 02.jpg, 03.jpg ... 10.jpg
   (The script pads numbers with a zero if less than 10).

3. To add Volume Covers:
   - assets/manga/vol1/cover.jpg
   - assets/manga/vol2/cover.jpg

4. To add more Volumes/Chapters:
   - Open `js/script.js`
   - Update `mangaDatabase` object with new volumes/chapters/page_counts.
   - Create corresponding folders in `assets/manga/`.
