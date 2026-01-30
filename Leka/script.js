
class TechNewsAggregator {
    constructor() {
        this.apiKey = 'YOUR_NEWSAPI_KEY_HERE'; // Replace with your NewsAPI key
        this.baseUrl = 'https://newsapi.org/v2/everything';
        this.articles = [];
        this.filteredArticles = [];
        this.currentPage = 1;
        this.itemsPerPage = 6;
        this.keywords = ['AI', 'cloud', 'tech', 'technology', 'machine learning', 'artificial intelligence'];
        
        this.elements = {
            searchInput: document.getElementById('searchInput'),
            categorySelect: document.getElementById('categorySelect'),
            newsContainer: document.getElementById('newsContainer'),
            loading: document.getElementById('loading'),
            error: document.getElementById('error'),
            noResults: document.getElementById('noResults'),
            prevBtn: document.getElementById('prevBtn'),
            nextBtn: document.getElementById('nextBtn'),
            pageInfo: document.getElementById('pageInfo')
        };

        this.init();
    }

    async init() {
        this.bindEvents();
        await this.fetchNews();
    }

    bindEvents() {
        this.elements.searchInput.addEventListener('input', debounce(this.handleFilter.bind(this), 300));
        this.elements.categorySelect.addEventListener('change', this.handleFilter.bind(this));
        this.elements.prevBtn.addEventListener('click', () => this.changePage(-1));
        this.elements.nextBtn.addEventListener('click', () => this.changePage(1));
    }

    async fetchNews() {
        try {
            this.showLoading();
            this.hideError();
            this.hideNoResults();

            const query = this.keywords.join(' OR ');
            const response = await fetch(
                `${this.baseUrl}?q=${encodeURIComponent(query)}&language=en&sortBy=publishedAt&pageSize=100&apiKey=${this.apiKey}`
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.status !== 'ok') {
                throw new Error(data.message || 'API error');
            }

            this.articles = data.articles.map((article, index) => ({
                ...article,
                uniqueId: Symbol(`article-${index}-${Date.now()}`)
            })).filter(article => article.urlToImage); // Filter out articles without images

            this.filteredArticles = [...this.articles];
            this.currentPage = 1;
            this.render();

        } catch (error) {
            console.error('Fetch error:', error);
            this.showError();
        }
    }

    handleFilter() {
        const searchTerm = this.elements.searchInput.value.toLowerCase();
        const category = this.elements.categorySelect.value;

        this.filteredArticles = this.articles.filter(article => {
            const matchesSearch = !searchTerm || 
                article.title.toLowerCase().includes(searchTerm) ||
                article.description?.toLowerCase().includes(searchTerm);
            
            const matchesCategory = !category || 
                (article.source?.name?.toLowerCase().includes(category) ||
                 article.category?.toLowerCase().includes(category));

            return matchesSearch && matchesCategory;
        });

        this.currentPage = 1;
        this.render();
    }

    changePage(direction) {
        const maxPage = Math.ceil(this.filteredArticles.length / this.itemsPerPage);
        this.currentPage = Math.max(1, Math.min(maxPage, this.currentPage + direction));
        this.render();
    }

    render() {
        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        const paginatedArticles = this.filteredArticles.slice(start, end);

        this.elements.newsContainer.innerHTML = '';

        if (paginatedArticles.length === 0) {
            if (this.filteredArticles.length === 0) {
                this.showNoResults();
            }
            this.updatePagination(1, 0);
            return;
        }

        paginatedArticles.forEach(article => {
            const card = this.createNewsCard(article);
            this.elements.newsContainer.appendChild(card);
        });

        this.updatePagination(
            this.currentPage, 
            Math.ceil(this.filteredArticles.length / this.itemsPerPage)
        );
        
        this.hideLoading();
        this.hideNoResults();
    }

    createNewsCard(article) {
        const card = document.createElement('article');
        card.className = 'news-card';
        card.onclick = () => window.open(article.url, '_blank');

        const idSymbol = article.uniqueId.description || `ID-${Math.random().toString(36).substr(2, 9)}`;
        
        card.innerHTML = `
            <img src="${article.urlToImage}" alt="${article.title}" class="news-image" loading="lazy">
            <div class="news-content">
                <div class="news-id">🆔 ${idSymbol.slice(-8)}</div>
                <h3 class="news-title">${this.truncateText(article.title, 80)}</h3>
                <p class="news-description">${this.truncateText(article.description || '', 120)}</p>
                <div class="news-meta">
                    <span>📅 ${new Date(article.publishedAt).toLocaleDateString()}</span>
                    <span>🔗 ${article.source.name}</span>
                </div>
            </div>
        `;

        return card;
    }

    truncateText(text, maxLength) {
        return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
    }

    updatePagination(currentPage, totalPages) {
        this.elements.pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
        this.elements.prevBtn.disabled = currentPage === 1;
        this.elements.nextBtn.disabled = currentPage === totalPages || totalPages === 0;
    }

    showLoading() {
        this.elements.loading.classList.remove('hidden');
    }

    hideLoading() {
        this.elements.loading.classList.add('hidden');
    }

    showError() {
        this.elements.error.classList.remove('hidden');
        this.elements.newsContainer.innerHTML = '';
    }

    hideError() {
        this.elements.error.classList.add('hidden');
    }

    showNoResults() {
        this.elements.noResults.classList.remove('hidden');
    }

    hideNoResults() {
        this.elements.noResults.classList.add('hidden');
    }
}

// Utility function for debouncing
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TechNewsAggregator();
});
