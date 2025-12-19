/**
 * BERSERK SPA LOGIC
 */

// --- КОНФИГУРАЦИЯ И БАЗА ДАННЫХ ---
// Использовать сгенерированные данные, если есть, иначе запасной вариант/пусто
const mangaDatabase = typeof generatedMangaData !== 'undefined' ? { volumes: generatedMangaData } : { volumes: {} };

// --- СОСТОЯНИЕ ПРИЛОЖЕНИЯ ---
const state = {
    currentVolume: 1,
    currentChapter: 1,
    currentSection: 'manga' // 'manga', 'chapters-list', 'viewer', 'author' (об авторе), 'assets', 'news'
};

// --- ОСНОВНОЕ ПРИЛОЖЕНИЕ ---
const app = {
    init: () => {
        app.setupNavigation();
        // По умолчанию Том 1, если доступен
        const firstVol = Object.keys(mangaDatabase.volumes)[0];
        if(firstVol) state.currentVolume = parseInt(firstVol);
        
        app.renderVolumes();
        console.log("Берсерк SPA Инициализирован");
    },

    // НАВИГАЦИЯ
    setupNavigation: () => {
        const navLinks = document.querySelectorAll('.nav-links li');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                // Удалить класс active у всех
                navLinks.forEach(l => l.classList.remove('active'));
                // Добавить active нажатому элементу
                const targetLi = e.currentTarget;
                targetLi.classList.add('active');
                
                // Показать секцию
                const targetId = targetLi.dataset.target;
                app.showSection(targetId);
            });
        });
        
        // Слушатели выбора в просмотрщике
        document.getElementById('volume-select').addEventListener('change', (e) => {
            const vol = parseInt(e.target.value);
            // Сброс на главу 1 нового тома
            app.loadChapter(vol, 1);
        });

        document.getElementById('chapter-select').addEventListener('change', (e) => {
            const ch = parseInt(e.target.value);
            app.loadChapter(state.currentVolume, ch);
        });

        // Переключение хедера
        const headerToggleBtn = document.getElementById('header-toggle');
        if (headerToggleBtn) {
            headerToggleBtn.addEventListener('click', () => {
                const header = document.querySelector('.sticky-header');
                header.classList.toggle('header-collapsed');
            });
        }
    },

    showSection: (sectionId) => {
        // скрыть все секции
        document.querySelectorAll('.section').forEach(sec => sec.classList.add('hidden'));
        document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));

        // показать целевую секцию
        let target = document.getElementById(sectionId);
        
        // Обработка внутренней навигации манги
        if (sectionId === 'manga') {
            document.getElementById('manga').classList.remove('hidden');
        } else if (sectionId === 'chapters-list') {
            document.getElementById('chapters-list').classList.remove('hidden');
        } else if (sectionId === 'viewer') {
            document.getElementById('viewer').classList.remove('hidden');
        } else {
            // Общая навигация (Об авторе, Материалы, Новости)
            if(target) target.classList.remove('hidden');
        }
        
        state.currentSection = sectionId;
        window.scrollTo(0,0);
    },

    // ЛОГИКА БИБЛИОТЕКИ МАНГИ
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
            
            // Разрешить заглушку, если обложки нет (обрабатывается через css background)
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

    // ЛОГИКА ПРОСМОТРЩИКА
    loadChapter: (volNum, chNum) => {
        volNum = parseInt(volNum);
        chNum = parseInt(chNum);
        
        state.currentVolume = volNum;
        state.currentChapter = chNum;

        // Заполнить селекты при необходимости (или обновить значения)
        app.updateViewerControls(volNum, chNum);

        const pagesContainer = document.getElementById('pages-container');
        pagesContainer.innerHTML = ''; // Очистить предыдущее

        const volData = mangaDatabase.volumes[volNum];
        if (!volData) return;
        
        const chData = volData.chapters[chNum];
        if (!chData) {
            console.error("Глава не найдена");
            return;
        }

        // Использовать явный список страниц из генератора
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

        // Обновить опции томов
        volSelect.innerHTML = '';
        Object.keys(mangaDatabase.volumes).forEach(v => {
            const opt = document.createElement('option');
            opt.value = v;
            opt.innerText = mangaDatabase.volumes[v].title;
            opt.selected = parseInt(v) === currentVol;
            volSelect.appendChild(opt);
        });

        // Обновить опции глав для ТЕКУЩЕГО тома
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

// Запуск приложения
document.addEventListener('DOMContentLoaded', app.init);
