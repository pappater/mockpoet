// Reader Page Script
(async () => {
  const chapterListItems = document.getElementById('chapter-list-items');
  const chapterContentBody = document.getElementById('chapter-content-body');
  const chapterContentTitle = document.getElementById('chapter-content-title');
  const chapterList = document.getElementById('chapter-list');
  const hamburgerMenu = document.getElementById('hamburger-menu');

  let chaptersData = null;
  let currentChapter = 1;
  let currentNovelKey = sessionStorage.getItem('selectedNovel') || 'weight_of_promises';

  /**
   * Render the chapter list
   * @param {Object} data - The chapters data
   */
  function renderChapterList(data) {
    chapterListItems.innerHTML = '';
    
    data.chapters.forEach((chapter) => {
      const li = document.createElement('li');
      li.className = 'chapter-item';
      if (chapter.chapter === currentChapter) {
        li.classList.add('active');
      }
      
      li.innerHTML = `
        <span class="chapter-number">Ch. ${chapter.chapter}</span>
        <span class="chapter-name">Chapter ${chapter.chapter}</span>
      `;
      
      li.addEventListener('click', () => {
        loadChapter(chapter.chapter);
        // Close menu on mobile after selection
        if (window.innerWidth <= 768) {
          chapterList.classList.remove('open');
        }
      });
      
      chapterListItems.appendChild(li);
    });
  }

  /**
   * Load and display a chapter
   * @param {number} chapterNum - The chapter number to load
   */
  async function loadChapter(chapterNum) {
    currentChapter = chapterNum;
    
    // Update active state in chapter list
    document.querySelectorAll('.chapter-item').forEach((item) => {
      item.classList.remove('active');
    });
    const activeItem = chapterListItems.children[chapterNum - 1];
    if (activeItem) {
      activeItem.classList.add('active');
    }

    // Show loading state
    chapterContentBody.innerHTML = '<div class="chapter-content-loading">Loading chapter...</div>';
    chapterContentTitle.textContent = `Chapter ${chapterNum}`;

    try {
      const chapterData = chaptersData.chapters.find(ch => ch.chapter === chapterNum);
      if (!chapterData) {
        throw new Error('Chapter not found');
      }

      const content = await API.fetchChapterContent(chapterData.url, chapterData.filename, currentNovelKey);
      const html = API.parseMarkdown(content);
      
      chapterContentBody.innerHTML = html;

      // Scroll to top of content
      chapterContentBody.scrollTop = 0;
    } catch (error) {
      console.error('Failed to load chapter:', error);
      chapterContentBody.innerHTML = `
        <div class="chapter-content-error">
          <p>Error loading chapter content: ${error.message}</p>
          <p>Please try again later.</p>
        </div>
      `;
    }
  }

  /**
   * Initialize the reader
   */
  async function init() {
    try {
      // Show loading state
      chapterContentBody.innerHTML = '<div class="chapter-content-loading">Loading chapters...</div>';
      
      // Set the current novel in API
      API.setCurrentNovel(currentNovelKey);
      
      // Fetch chapters data for the selected novel
      chaptersData = await API.fetchChaptersData(currentNovelKey);
      
      // Update page title with novel name
      document.title = `${chaptersData.novel_title} - mockpoet`;
      
      // Render chapter list
      renderChapterList(chaptersData);
      
      // Load first chapter
      await loadChapter(1);
    } catch (error) {
      console.error('Failed to initialize reader:', error);
      chapterContentBody.innerHTML = `
        <div class="chapter-content-error">
          <p>Error loading book data: ${error.message}</p>
          <p>Please try again later.</p>
        </div>
      `;
    }
  }

  // Hamburger menu handler
  if (hamburgerMenu) {
    hamburgerMenu.addEventListener('click', () => {
      chapterList.classList.toggle('open');
    });
  }

  // Close menu when clicking outside on mobile
  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768 && 
        chapterList.classList.contains('open') &&
        !chapterList.contains(e.target) && 
        !hamburgerMenu.contains(e.target)) {
      chapterList.classList.remove('open');
    }
  });

  // Initialize the reader
  init();
})();
