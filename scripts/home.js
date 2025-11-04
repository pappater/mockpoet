// Home Page Script
(async () => {
  const bookCardContainer = document.getElementById('book-card-container');

  /**
   * Render the book card with data
   * @param {Object} data - The chapters data
   * @param {string} novelKey - The novel key
   */
  function renderBookCard(data, novelKey) {
    const card = document.createElement('div');
    card.className = 'book-card';
    card.innerHTML = `
      <h1 class="book-card-title">${data.novel_title}</h1>
      <div class="book-card-info">
        <div class="book-card-chapters">
          ${data.total_chapters} Chapter${data.total_chapters !== 1 ? 's' : ''} Available
        </div>
        <div class="book-card-updated">
          Last updated: ${new Date(data.last_updated).toLocaleDateString()}
        </div>
      </div>
    `;

    card.addEventListener('click', () => {
      // Store selected novel in sessionStorage
      sessionStorage.setItem('selectedNovel', novelKey);
      window.location.href = 'reader.html';
    });

    bookCardContainer.appendChild(card);
  }

  /**
   * Display error message
   * @param {string} message - The error message
   */
  function showError(message) {
    bookCardContainer.innerHTML = `
      <div class="error-message">
        <p>Error loading book data: ${message}</p>
        <p>Please try again later.</p>
      </div>
    `;
  }

  /**
   * Show loading state
   */
  function showLoading() {
    bookCardContainer.innerHTML = `
      <div class="loading-message">
        <p>Loading book information...</p>
      </div>
    `;
  }

  // Initialize
  try {
    showLoading();
    bookCardContainer.innerHTML = '';
    
    // Get all available novels
    const novels = API.getAvailableNovels();
    
    // Load data for each novel
    for (const novel of novels) {
      try {
        const data = await API.fetchChaptersData(novel.key);
        renderBookCard(data, novel.key);
      } catch (error) {
        console.error(`Failed to load data for ${novel.title}:`, error);
        // Continue loading other novels even if one fails
      }
    }
    
    // If no novels loaded successfully, show error
    if (bookCardContainer.children.length === 0) {
      showError('No novels could be loaded');
    }
  } catch (error) {
    console.error('Failed to load book data:', error);
    showError(error.message);
  }
})();
