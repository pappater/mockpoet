// Reader Page Script
(async () => {
  const chapterListItems = document.getElementById('chapter-list-items');
  const chapterContentBody = document.getElementById('chapter-content-body');
  const chapterContentTitle = document.getElementById('chapter-content-title');
  const backButton = document.getElementById('back-button');

  let chaptersData = null;
  let currentChapter = 1;

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

      const content = await API.fetchChapterContent(chapterData.url, chapterData.filename);
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
      
      // Fetch chapters data
      chaptersData = await API.fetchChaptersData();
      
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

  // Back button handler
  backButton.addEventListener('click', () => {
    window.location.href = 'index.html';
  });

  // Initialize the reader
  init();
})();
