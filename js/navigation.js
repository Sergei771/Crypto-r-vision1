import CaesarCipher from './algorithms/caesarCipher.js';
import VigenereCipher from './algorithms/vigenereCipher.js';
import HashFunctions from './algorithms/hashFunctions.js';
import BlockCipherVisualizer from './algorithms/blockCiphers.js';
import RSA from './algorithms/rsa.js';
import Steganography from './algorithms/steganography.js';
import QuizManager from './components/quizManager.js';
// Import other algorithm or component modules as needed

/**
 * @class Navigation
 * Handles Single Page Application (SPA) routing and content loading.
 */
class Navigation {
    constructor() {
        this.contentElement = document.getElementById('content');
        this.navLinks = document.querySelectorAll('#main-nav .nav-link');
        this.mobileNavToggle = document.getElementById('mobile-nav-toggle');
        this.mainNav = document.getElementById('main-nav');

        if (!this.contentElement) {
            console.error("Navigation Error: Content element #content not found.");
            return;
        }

        // Store instances of dynamic components
        this.components = {
            caesarCipher: new CaesarCipher(),
            vigenereCipher: new VigenereCipher(),
            hashFunctions: new HashFunctions(),
            blockCipherVisualizer: new BlockCipherVisualizer(),
            rsa: new RSA(),
            steganography: new Steganography(),
            quizManager: new QuizManager()
            // Add other components here
        };

        this._setupEventListeners();
        this._handleInitialLoad();
    }

    /**
     * Sets up event listeners for navigation links and history changes.
     * @private
     */
    _setupEventListeners() {
        // Handle clicks on navigation links (in header, footer, or buttons)
        document.body.addEventListener('click', (event) => {
            const targetLink = event.target.closest('a[data-link]');
            // Check if the click was on a link with data-link inside #main-nav OR #main-footer OR if it's a .btn
            if (targetLink && targetLink.matches('#main-nav a[data-link], #main-footer a[data-link], .btn[data-link]')) {
                event.preventDefault();
                const page = targetLink.getAttribute('data-link');
                this.navigateTo(page);
                // Close mobile nav if open
                if (this.mainNav && this.mainNav.classList.contains('open')) {
                    this.mainNav.classList.remove('open');
                }
            }
        });

        // Handle browser back/forward buttons
        window.addEventListener('popstate', (event) => {
            const page = event.state?.page || 'home'; // Default to home if no state
            this._loadPage(page, false); // Don't push state again
        });

        // Handle mobile navigation toggle
        if (this.mobileNavToggle && this.mainNav) {
            this.mobileNavToggle.addEventListener('click', () => {
                this.mainNav.classList.toggle('open');
            });
        }
    }

    /**
     * Handles the initial page load, loading content based on the URL hash.
     * @private
     */
    _handleInitialLoad() {
        const initialPage = window.location.hash.substring(1) || 'home';
        this._loadPage(initialPage, false); // Load initial page without pushing state
        // Replace state to have correct state on initial load for back/forward
        history.replaceState({ page: initialPage }, '', `#${initialPage}`);
    }

    /**
     * Navigates to a specific page, updating history and loading content.
     * @param {string} page - The identifier of the page to load (e.g., 'home', 'fundamentals').
     */
    navigateTo(page) {
        if (history.state?.page !== page) {
            this._loadPage(page, true);
        }
    }

    /**
     * Loads the content for the specified page.
     * @param {string} page - The identifier of the page.
     * @param {boolean} pushState - Whether to push the new state onto the history stack.
     * @private
     */
    async _loadPage(page, pushState = true) {
        const pagePath = `pages/${page}.html`;
        this.contentElement.innerHTML = '<p>Chargement...</p>'; // Show loading indicator
        this._updateActiveLink(page);

        try {
            const response = await fetch(pagePath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const html = await response.text();
            this.contentElement.innerHTML = html;

            if (pushState) {
                history.pushState({ page: page }, '', `#${page}`);
            }

            // Initialize components relevant to the loaded page
            this._initializePageComponents(page);

            // Scroll to top of the content area
            // window.scrollTo(0, 0); // Scroll to very top
             this.contentElement.scrollIntoView({ behavior: 'smooth', block: 'start' });

        } catch (error) {
            console.error(`Error loading page '${page}':`, error);
            this.contentElement.innerHTML = `<p class="error">Erreur lors du chargement de la page '${page}'. Vérifiez le nom du fichier et le chemin.</p>`;
            // Optionally load a default error page or home page
             this._updateActiveLink('error'); // Indicate error state if needed
        }
    }

    /**
     * Updates the active state of the navigation links.
     * @param {string} page - The identifier of the currently active page.
     * @private
     */
    _updateActiveLink(page) {
        this.navLinks.forEach(link => {
            if (link.getAttribute('data-link') === page) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    /**
     * Initializes JavaScript components specific to the loaded page content.
     * @param {string} page - The identifier of the loaded page.
     * @private
     */
    _initializePageComponents(page) {
        console.log(`Initializing components for page: ${page}`);
        // Example: Initialize Caesar Cipher simulator if it's on the historical page
        if (page === 'historical') {
            // Check if the simulator elements are actually in the loaded HTML
            if (document.getElementById('caesarEncrypt')) {
                this.components.caesarCipher.initSimulatorUI();
            } else {
                console.log("Caesar simulator UI elements not found on historical page.");
            }
        }

        // Initialize Tabs if on the modern page
        if (page === 'modern') {
            // Assumes the tab container has the ID 'block-cipher-tabs' or a class '.tabs-container'
            if (typeof window.initTabs === 'function') {
                // Look for the specific container for block cipher tabs
                if (document.querySelector('#block-cipher-tabs')) {
                     window.initTabs('.tabs-container'); // Initialize tabs within the container
                 } else {
                     console.log("Block cipher tab container not found on modern page.");
                 }
            } else {
                console.error("initTabs function not found.");
            }
        }

        // Initialize Quiz Manager
        if (page === 'exercises') {
            // Check if the quiz container exists before initializing
            if (document.getElementById('quiz-container')) {
                this.components.quizManager.initQuiz(); // Call async init
            } else {
                 console.log("Quiz container not found on exercises page.");
            }
        }

        // Initialize Hash Functions Demo if on the modern page
        if (page === 'modern') {
            if (document.getElementById('hashButton')) {
                 this.components.hashFunctions.initDemoUI();
            }
        }

        // Initialize Block Cipher Visualizer if on the modern page
        if (page === 'modern') {
            if (document.getElementById('blockVisButton')) {
                 this.components.blockCipherVisualizer.initVisualizationUI();
            }
        }

        // Initialize Vigenere Cipher simulator if on the historical page
        if (page === 'historical') {
            if (document.getElementById('vigenereEncrypt')) { // Check for simulator elements
                this.components.vigenereCipher.initSimulatorUI();
            }
        }

        // Placeholder for RSA/Steg initializations if needed later
        if (page === 'modern' && document.getElementById('rsa-demo-placeholder')) {
            this.components.rsa.initUI();
        }
        if (page === 'applications' && document.getElementById('steganography-demo-placeholder')) {
            this.components.steganography.initUI();
        }

        // Add initialization for other components based on the page ID
        // Ensure components that should NOT persist across pages are reset or removed here
    }
}

export default Navigation; 