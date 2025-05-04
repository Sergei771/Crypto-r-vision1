import Navigation from './navigation.js';

// Main entry point for JavaScript

/**
 * Updates the progress bar based on scroll position.
 */
function updateProgressBar() {
    const progressBar = document.getElementById("progressBar");
    if (!progressBar) return;

    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = height > 0 ? (winScroll / height) * 100 : 0;
    progressBar.style.width = scrolled + "%";
}

/**
 * Shows or hides the back-to-top button based on scroll position.
 */
function toggleBackToTopButton() {
    const backToTopButton = document.getElementById('backToTop');
    if (!backToTopButton) return;

    if (window.pageYOffset > 300) {
        backToTopButton.style.display = 'flex';
    } else {
        backToTopButton.style.display = 'none';
    }
}

/**
 * Scrolls the window smoothly to the top.
 */
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

/**
 * Initializes common UI elements like progress bar and back-to-top button.
 */
function initUI() {
    const backToTopButton = document.getElementById('backToTop');

    // Event Listeners
    window.addEventListener('scroll', () => {
        updateProgressBar();
        toggleBackToTopButton();
    });

    if (backToTopButton) {
        backToTopButton.addEventListener('click', scrollToTop);
    }

    // Initial calls
    updateProgressBar();
    toggleBackToTopButton();

    // console.log("UI Initialized"); // Logged within Navigation now
}

/**
 * Initializes tab functionality for a given container.
 * @param {string} containerSelector - CSS selector for the container holding tabs and content panes.
 */
function initTabs(containerSelector) {
    const container = document.querySelector(containerSelector);
    if (!container) {
        // console.warn(`Tab container '${containerSelector}' not found. Skipping tab initialization.`);
        return;
    }

    const tabButtons = container.querySelectorAll('.tab');
    const tabContents = container.querySelectorAll('.tab-content');

    if (tabButtons.length === 0 || tabContents.length === 0) {
        console.warn("Tabs or tab content not found within container:", containerSelector);
        return;
    }

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetSelector = button.getAttribute('data-tab-target');
            if (!targetSelector) return;

            const targetContent = container.querySelector(targetSelector);
            if (!targetContent) return;

            // Deactivate all tabs and content
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // Activate the clicked tab and its content
            button.classList.add('active');
            targetContent.classList.add('active');
        });
    });
    console.log(`Tabs initialized for container: ${containerSelector}`);
}

// --- Initialization --- 
document.addEventListener('DOMContentLoaded', () => {
    initUI();
    // Initialize the SPA navigation system
    const navigation = new Navigation();
    console.log("Navigation Initialized");

    // Expose initTabs globally or pass it to Navigation if preferred
    // For simplicity now, Navigation can call it directly if needed.
    window.initTabs = initTabs; // Make it accessible from Navigation
}); 