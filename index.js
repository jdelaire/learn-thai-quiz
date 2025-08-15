// Search and Filter functionality for the index page
document.addEventListener('DOMContentLoaded', function() {
  const searchInput = document.getElementById('searchInput');
  const filterButtons = document.querySelectorAll('.filter-btn');
  const quizCards = document.querySelectorAll('.quiz-card');

  // Search functionality
  searchInput.addEventListener('input', function() {
    const searchTerm = this.value.toLowerCase().trim();
    filterQuizzes();
  });

  // Filter functionality
  filterButtons.forEach(button => {
    button.addEventListener('click', function() {
      // Remove active class from all buttons
      filterButtons.forEach(btn => btn.classList.remove('active'));
      // Add active class to clicked button
      this.classList.add('active');
      filterQuizzes();
    });
  });

  function filterQuizzes() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const activeCategory = document.querySelector('.filter-btn.active').dataset.category;

    quizCards.forEach(card => {
      const title = card.querySelector('h2').textContent.toLowerCase();
      const description = card.querySelector('p').textContent.toLowerCase();
      const category = card.dataset.category;
      
      const matchesSearch = searchTerm === '' || 
                           title.includes(searchTerm) || 
                           description.includes(searchTerm);
      
      const matchesCategory = activeCategory === 'all' || category === activeCategory;
      
      if (matchesSearch && matchesCategory) {
        card.style.display = 'flex';
        card.style.animation = 'fadeIn 0.3s ease-in';
      } else {
        card.style.display = 'none';
      }
    });

    // Show/hide "no results" message
    const visibleCards = document.querySelectorAll('.quiz-card[style*="display: flex"]');
    let noResultsMessage = document.getElementById('noResultsMessage');
    
    if (visibleCards.length === 0) {
      if (!noResultsMessage) {
        noResultsMessage = document.createElement('div');
        noResultsMessage.id = 'noResultsMessage';
        noResultsMessage.className = 'no-results';
        noResultsMessage.innerHTML = `
          <div class="no-results-content">
            <div class="no-results-icon">🔍</div>
            <h3>No quizzes found</h3>
            <p>Try adjusting your search or filter criteria</p>
          </div>
        `;
        document.querySelector('.quiz-container').appendChild(noResultsMessage);
      }
      noResultsMessage.style.display = 'block';
    } else if (noResultsMessage) {
      noResultsMessage.style.display = 'none';
    }
  }

  // Add fade-in animation for cards
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .no-results {
      grid-column: 1 / -1;
      text-align: center;
      padding: 3em;
    }
    
    .no-results-content {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      padding: 2em;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    .no-results-icon {
      font-size: 4em;
      margin-bottom: 1em;
      opacity: 0.7;
    }
    
    .no-results h3 {
      margin: 0 0 0.5em 0;
      color: white;
    }
    
    .no-results p {
      margin: 0;
      opacity: 0.8;
    }
  `;
  document.head.appendChild(style);

  // Initialize with all quizzes visible
  filterQuizzes();
});