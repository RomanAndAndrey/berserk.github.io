/**
 * =========================================================================
 * КОНФИГУРАЦИЯ И БАЗА ДАННЫХ (CONFIGURATION & DATABASE)
 * =========================================================================
 * Инициализация источников данных.
 * generatedMangaData и generatedMaterialsData - глобальные переменные,
 * которые могут быть определены в других скриптах (например, manga-data.js).
 */
const mangaDatabase = typeof generatedMangaData !== 'undefined' ? { volumes: generatedMangaData } : { volumes: {} };
const materialsData = typeof generatedMaterialsData !== 'undefined' ? generatedMaterialsData : [];

/**
 * СОСТОЯНИЕ ПРИЛОЖЕНИЯ (APP STATE)
 * Хранит текущий контекст использования приложения.
 * @property {number} currentVolume - Номер текущего просматриваемого тома.
 * @property {number} currentChapter - Номер текущей просматриваемой главы.
 * @property {string} currentSection - ID активной секции интерфейса (для SPA навигации).
 */
const state = {
    currentVolume: 1,
    currentChapter: 1,
    currentSection: 'manga' // Варианты: 'manga', 'chapters-list', 'viewer', 'author', 'assets', 'news'
};

// --- ОСНОВНОЕ ПРИЛОЖЕНИЕ ---
const app = {
    /**
     * Инициализация приложения.
     * Вызывается при событии DOMContentLoaded.
     * - Настраивает навигацию.
     * - Устанавливает начальный том.
     * - Рендерит библиотеку томов.
     * - Инициализирует галерею.
     */
    init: () => {
        app.setupNavigation();
        // По умолчанию Том 1, если доступен
        const firstVol = Object.keys(mangaDatabase.volumes)[0];
        if(firstVol) state.currentVolume = parseInt(firstVol);
        
        app.renderVolumes();
        app.setupGallery(); // Init gallery
        console.log("Берсерк SPA Инициализирован");
    },

    /**
     * НАСТРОЙКА НАВИГАЦИИ (NAVIGATION SETUP)
     * Вешает обработчики событий на элементы меню и управления.
     * - Обработка кликов по боковому меню (смена active класса).
     * - Обработка селектов выбора тома/главы в просмотрщике.
     * - Обработка переключателя видимости хедера.
     */
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

        // Переключение хедера (Sticky Header Toggle)
        const headerToggleBtn = document.getElementById('header-toggle');
        if (headerToggleBtn) {
            headerToggleBtn.addEventListener('click', () => {
                const header = document.querySelector('.sticky-header');
                const isCollapsed = header.classList.toggle('header-collapsed');
                // Изменить иконку: Открыто = Глаз, Свернуто = Крестик
                headerToggleBtn.innerText = isCollapsed ? '✖️' : '👁️';
            });
        }
    },

    /**
     * ПЕРЕКЛЮЧЕНИЕ СЕКЦИЙ (ROUTING)
     * Основная функция SPA-навигации. Скрывает все секции и показывает целевую.
     * @param {string} sectionId - ID HTML-элемента секции, которую нужно показать.
     */
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

    /**
     * РЕНДЕРИНГ БИБЛИОТЕКИ (RENDER LIBRARY)
     * Заполняет grid-сетку карточками томов на основе данных из mangaDatabase.
     * Создает элементы динамически, добавляя обложки и обработчики кликов.
     */
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

    /**
     * ОТКРЫТИЕ ТОМА (OPEN VOLUME)
     * Переход из библиотеки к списку глав конкретного тома.
     * @param {number|string} volNum - Номер тома для открытия.
     */
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

    /**
     * ЗАГРУЗКА ГЛАВЫ (LOAD CHAPTER)
     * Основная логика просмотрщика.
     * - Очищает текущий контейнер страниц.
     * - Генерирует теги <img> для каждой страницы выбранной главы.
     * - Обновляет навигационные контролы (селекты).
     * - Переключает вид на секцию просмотрщика.
     * 
     * @param {number|string} volNum - Номер тома.
     * @param {number|string} chNum - Номер главы.
     */
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
                img.alt = '';
                
                pagesContainer.appendChild(img);
            });
        }
        
        app.showSection('viewer');
    },

    /**
     * ОБНОВЛЕНИЕ ЭЛЕМЕНТОВ УПРАВЛЕНИЯ (UPDATE CONTROLS)
     * Синхронизирует выпадающие списки (select) с текущим состоянием просмотра.
     * Заполняет список глав, соответствующий выбранному тому.
     * 
     * @param {number} currentVol - Текущий том.
     * @param {number} currentCh - Текущая глава.
     */
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

    /**
     * ВОЗВРАТ К СПИСКУ ГЛАВ (BACK NAVIGATION)
     * Утилитарная функция для кнопки "Назад" в просмотрщике.
     * Возвращает пользователя в контекст текущего выбранного тома.
     */
    goBackToChapters: () => {
        app.openVolume(state.currentVolume);
    },

    /**
     * ИНИЦИАЛИЗАЦИЯ ГАЛЕРЕИ (GALLERY SETUP)
     * - Рендерит сетку изображений из materialsData.
     * - Настраивает модальное окно для просмотра увеличенных изображений.
     * - Добавляет обработчики закрытия модального окна (клик по крестику или фону).
     */
    // ГАЛЕРЕЯ / МОДАЛКА
    setupGallery: () => {
        const grid = document.getElementById('materials-gallery');
        const modal = document.getElementById('image-modal');
        const modalImg = document.getElementById('modal-img');
        const closeBtn = document.querySelector('.close-modal');

        // Populate Gallery from Data
        if (grid) {
            grid.innerHTML = '';
            if (materialsData.length > 0) {
                materialsData.forEach(src => {
                    const item = document.createElement('div');
                    item.className = 'gallery-item';
                    
                    const img = document.createElement('img');
                    img.src = src;
                    img.loading = 'lazy';
                    img.alt = 'Berserk Art'; // Generic alt since filenames might be ugly

                    item.appendChild(img);
                    grid.appendChild(item);

                    // Add click listener immediately
                    item.addEventListener('click', () => {
                        modal.classList.add('active');
                        modalImg.src = src;
                    });
                });
            } else {
                 grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #888;">Нет материалов (добавьте изображения в assets/materials и запустите генератор)</p>';
            }
        }

        // Закрытие
        if(closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.classList.remove('active');
            });
        }

        // Закрытие по клику вне
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    }
};

// Запуск приложения
document.addEventListener('DOMContentLoaded', app.init);
