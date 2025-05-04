/**
 * @class BlockCipherVisualizer
 * Creates simple visualizations for ECB and CBC block cipher modes.
 */
class BlockCipherVisualizer {
    constructor() {
        this.blockSize = 8; // Example block size for visualization
        this.colorMap = {}; // To store mapping from plaintext block to color
        this.assignedColors = [
            '#e41a1c', '#377eb8', '#4daf4a', '#984ea3',
            '#ff7f00', '#ffff33', '#a65628', '#f781bf' // Example colors
        ];
        this.nextColorIndex = 0;
    }

    /**
     * Assigns a color to a plaintext block, reusing if block is seen again.
     * @param {string} block - The plaintext block.
     * @returns {string} The assigned color hex code.
     * @private
     */
    _getColorForBlock(block) {
        if (!this.colorMap[block]) {
            this.colorMap[block] = this.assignedColors[this.nextColorIndex % this.assignedColors.length];
            this.nextColorIndex++;
        }
        return this.colorMap[block];
    }

    /**
     * Splits text into blocks of the defined size.
     * @param {string} text - The input text.
     * @returns {string[]} An array of text blocks.
     * @private
     */
    _splitIntoBlocks(text) {
        const blocks = [];
        for (let i = 0; i < text.length; i += this.blockSize) {
            blocks.push(text.substring(i, i + this.blockSize).padEnd(this.blockSize, '_')); // Pad last block if needed
        }
        return blocks;
    }

    /**
     * Creates the HTML for a single visualization block.
     * @param {string} text - The text content of the block.
     * @param {string} [color=''] - The background color.
     * @param {string[]} [classes=[]] - Additional CSS classes.
     * @returns {string} HTML string for the block.
     * @private
     */
    _createBlockHtml(text, color = '', classes = []) {
        const style = color ? `style="background-color: ${color};"` : '';
        return `<div class="vis-block ${classes.join(' ')}" ${style} title="${text}">${text}</div>`;
    }

    /**
     * Renders the ECB visualization.
     * @param {string} plaintext - The plaintext input.
     * @param {HTMLElement} container - The container element to render into.
     * @private
     */
    _renderECB(plaintext, container) {
        this.colorMap = {}; // Reset color map for each visualization
        this.nextColorIndex = 0;
        const blocks = this._splitIntoBlocks(plaintext);
        let html = '<div class="block-row plaintext-row"><h5>Plaintext:</h5>';
        blocks.forEach(block => {
            html += this._createBlockHtml(block, this._getColorForBlock(block), ['plaintext']);
        });
        html += '</div>';

        html += '<div class="block-row ciphertext-row"><h5>Ciphertext (ECB):</h5>';
        blocks.forEach(block => {
            // In ECB, ciphertext block color matches plaintext block color
            html += this._createBlockHtml(block, this._getColorForBlock(block), ['ciphertext']);
        });
        html += '</div>';
        container.innerHTML = html;
    }

    /**
     * Simple hex color mixing (average components) for visualization.
     * Not cryptographically accurate, just for visual effect.
     * @param {string} color1 Hex color string (e.g., '#ffffff')
     * @param {string} color2 Hex color string
     * @returns {string} Mixed hex color string
     * @private
     */
    _mixColors(color1, color2) {
        const c1 = parseInt(color1.substring(1), 16);
        const c2 = parseInt(color2.substring(1), 16);

        const r1 = (c1 >> 16) & 255;
        const g1 = (c1 >> 8) & 255;
        const b1 = c1 & 255;

        const r2 = (c2 >> 16) & 255;
        const g2 = (c2 >> 8) & 255;
        const b2 = c2 & 255;

        // Simple average
        const r = Math.round((r1 + r2) / 2);
        const g = Math.round((g1 + g2) / 2);
        const b = Math.round((b1 + b2) / 2);

        // Convert back to hex
        return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
    }

    /**
     * Renders the CBC visualization, attempting to show block dependency via color mixing.
     * @param {string} plaintext - The plaintext input.
     * @param {HTMLElement} container - The container element to render into.
     * @private
     */
    _renderCBC(plaintext, container) {
        this.colorMap = {}; // Reset color map
        this.nextColorIndex = 0;
        const blocks = this._splitIntoBlocks(plaintext);
        const ivColor = '#888888'; // Grey for IV
        const uniqueCipherColors = this.assignedColors.slice(); // Use a copy for unique cipher base colors

        let html = '<div class="block-row plaintext-row"><h5>Plaintext:</h5>';
        html += this._createBlockHtml('IV', ivColor, ['iv-block']); // Add IV placeholder
        blocks.forEach(block => {
            // Assign a unique color to each *plaintext* block instance for visual tracking
            html += this._createBlockHtml(block, this._getColorForBlock(block), ['plaintext']);
        });
        html += '</div>';

        // Simulate the XOR step visually (optional, adds complexity)
        // html += '<div class="block-row xor-row"><h5>Plaintext ⊕ Prev Cipher:</h5>'; ...

        html += '<div class="block-row ciphertext-row"><h5>Ciphertext (CBC):</h5>';
        html += this._createBlockHtml('IV', ivColor, ['iv-block']); // Show IV
        let previousCipherColor = ivColor; // Start with IV color
        blocks.forEach((block, index) => {
            // Get the original plaintext block color
            const plainColor = this._getColorForBlock(block);
            // Simulate dependency: mix plaintext color with previous ciphertext color
            const currentCipherColor = this._mixColors(plainColor, previousCipherColor);
            // Ensure mixed color isn't too similar to previous or plain (optional refinement)

            html += this._createBlockHtml(block, currentCipherColor, ['ciphertext']);
            previousCipherColor = currentCipherColor; // The *actual* resulting color becomes the previous for the next block
        });
        html += '</div>';
        container.innerHTML = html;
    }

    /**
     * Initializes the UI listeners for the block cipher visualization demo.
     */
    initVisualizationUI() {
        const inputElement = document.getElementById('blockVisInput');
        const visualizeButton = document.getElementById('blockVisButton');
        const ecbContainer = document.getElementById('ecbVisualization');
        const cbcContainer = document.getElementById('cbcVisualization');

        if (!inputElement || !visualizeButton || !ecbContainer || !cbcContainer) {
            // console.warn("Block cipher visualization elements not found. Skipping init.");
            return;
        }

        const runVisualization = () => {
            const plaintext = inputElement.value;
            this._renderECB(plaintext, ecbContainer);
            this._renderCBC(plaintext, cbcContainer);
        };

        visualizeButton.addEventListener('click', runVisualization);

        // Initial visualization
        runVisualization();

        console.log("Block Cipher Visualizer UI Initialized.");
    }
}

export default BlockCipherVisualizer; 