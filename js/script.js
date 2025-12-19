/**
 * BERSERK SPA LOGIC
 */

// --- CONFIGURATION & DATABASE ---
// Use generated data if available, otherwise fallback/empty
const mangaDatabase = typeof generatedMangaData !== 'undefined' ? { volumes: generatedMangaData } : { volumes: {} };

// --- APP STATE ---
const state = {
    currentVolume: 1,
    currentChapter: 1,
    currentSection: 'manga' // 'manga', 'chapters-list', 'viewer', 'lore', 'assets', 'news'
};

// --- CORE APP ---
const app = {
    init: () => {
        app.setupNavigation();
        // Default to Volume 1 if available
        const firstVol = Object.keys(mangaDatabase.volumes)[0];
        if(firstVol) state.currentVolume = parseInt(firstVol);
        
        app.renderVolumes();
        console.log("Берсерк SPA Инициализирован");
    },

    // NAVIGATION
    setupNavigation: () => {
        const navLinks = document.querySelectorAll('.nav-links li');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                // Remove active class from all
                navLinks.forEach(l => l.classList.remove('active'));
                // Add active to clicked
                const targetLi = e.currentTarget;
                targetLi.classList.add('active');
                
                // Show section
                const targetId = targetLi.dataset.target;
                app.showSection(targetId);
            });
        });
        
        // Viewer Select Listeners
        document.getElementById('volume-select').addEventListener('change', (e) => {
            const vol = parseInt(e.target.value);
            // Reset to chapter 1 of new volume
            app.loadChapter(vol, 1);
        });

        document.getElementById('chapter-select').addEventListener('change', (e) => {
            const ch = parseInt(e.target.value);
            app.loadChapter(state.currentVolume, ch);
        });
    },

    showSection: (sectionId) => {
        // hide all sections
        document.querySelectorAll('.section').forEach(sec => sec.classList.add('hidden'));
        document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));

        // show target
        let target = document.getElementById(sectionId);
        
        // Handling internal manga navigation layers
        if (sectionId === 'manga') {
            document.getElementById('manga').classList.remove('hidden');
        } else if (sectionId === 'chapters-list') {
            document.getElementById('chapters-list').classList.remove('hidden');
        } else if (sectionId === 'viewer') {
            document.getElementById('viewer').classList.remove('hidden');
        } else {
            // General navs (Lore, Assets, News)
            if(target) target.classList.remove('hidden');
        }
        
        state.currentSection = sectionId;
        window.scrollTo(0,0);
    },

    // MANGA LIBRARY LOGIC
    renderVolumes: () => {
        const grid = document.getElementById('volumes-grid');
        grid.innerHTML = '';

        if (Object.keys(mangaDatabase.volumes).length === 0) {
            grid.innerHTML = '<p>Данные манги не найдены. Пожалуйста, запустите generate_config.ps1.</p>';
            return;
        }

        Object.keys(mangaDatabase.volumes).forEach(volNum => {
            const volData = mangaDatabase.volumes[volNum];
            const card = document.createElement('div');
            card.className = 'volume-card';
            card.onclick = () => app.openVolume(volNum);
            
            // Allow placeholder if cover doesn't exist (handled by css background)
            const coverImg = volData.cover ? `<img src="${volData.cover}" alt="Vol ${volNum}" class="volume-cover">` : `<div class="volume-cover">Vol ${volNum}</div>`;

            card.innerHTML = `
                ${coverImg}
                <div class="volume-title">${volData.title}</div>
                <div class="volume-info">${Object.keys(volData.chapters).length} Глав</div>
            `;
            grid.appendChild(card);
        });
    },

    openVolume: (volNum) => {
        state.currentVolume = parseInt(volNum);
        const volData = mangaDatabase.volumes[volNum];
        
        document.getElementById('selected-volume-title').innerText = volData.title;
        
        const list = document.getElementById('chapters-container');
        list.innerHTML = '';

        Object.keys(volData.chapters).forEach(chNum => {
            const chData = volData.chapters[chNum];
            const item = document.createElement('div');
            item.className = 'chapter-item';
            item.innerText = chData.title;
            item.onclick = () => app.loadChapter(state.currentVolume, chNum);
            list.appendChild(item);
        });

        app.showSection('chapters-list');
    },

    // VIEWER LOGIC
    loadChapter: (volNum, chNum) => {
        volNum = parseInt(volNum);
        chNum = parseInt(chNum);
        
        state.currentVolume = volNum;
        state.currentChapter = chNum;

        // Populate selects if needed (or update values)
        app.updateViewerControls(volNum, chNum);

        const pagesContainer = document.getElementById('pages-container');
        pagesContainer.innerHTML = ''; // Clear previous

        const volData = mangaDatabase.volumes[volNum];
        if (!volData) return;
        
        const chData = volData.chapters[chNum];
        if (!chData) {
            console.error("Глава не найдена");
            return;
        }

        // Use explicit page list from generator
        if (chData.pages && Array.isArray(chData.pages)) {
            chData.pages.forEach((pageName, index) => {
                const img = document.createElement('img');
                const src = `assets/manga/vol${volNum}/ch${chNum}/${pageName}`;
                
                img.src = src;
                img.className = 'manga-page-img';
                img.loading = 'lazy'; 
                img.alt = `Страница ${index + 1}`;
                
                pagesContainer.appendChild(img);
            });
        }
        
        app.showSection('viewer');
    },

    updateViewerControls: (currentVol, currentCh) => {
        const volSelect = document.getElementById('volume-select');
        const chSelect = document.getElementById('chapter-select');

        // Update Volume Options
        volSelect.innerHTML = '';
        Object.keys(mangaDatabase.volumes).forEach(v => {
            const opt = document.createElement('option');
            opt.value = v;
            opt.innerText = mangaDatabase.volumes[v].title;
            opt.selected = parseInt(v) === currentVol;
            volSelect.appendChild(opt);
        });

        // Update Chapter Options for CURRENT Volume
        chSelect.innerHTML = '';
        const volData = mangaDatabase.volumes[currentVol];
        Object.keys(volData.chapters).forEach(c => {
            const opt = document.createElement('option');
            opt.value = c;
            opt.innerText = volData.chapters[c].title;
            opt.selected = parseInt(c) === currentCh;
            chSelect.appendChild(opt);
        });
    },

    goBackToChapters: () => {
        app.openVolume(state.currentVolume);
    }
};

// Start App
document.addEventListener('DOMContentLoaded', app.init);
