/**
 * @class HashFunctions
 * Provides methods for demonstrating cryptographic hash functions.
 */
class HashFunctions {

    /**
     * Calculates the SHA-256 hash of a given text string.
     * Uses the browser's built-in Web Crypto API.
     * @param {string} text - The input text to hash.
     * @returns {Promise<string>} A promise that resolves with the hexadecimal representation of the hash.
     * @private
     */
    async _sha256(text) {
        if (typeof text !== 'string') {
            throw new Error("Input must be a string.");
        }
        try {
            const encoder = new TextEncoder();
            const data = encoder.encode(text);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            // Convert buffer to byte array
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            // Convert bytes to hex string
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            return hashHex;
        } catch (error) {
            console.error("SHA-256 Hashing Error:", error);
            throw error;
        }
    }

    /**
     * Public method to get the SHA-256 hash.
     * @param {string} text - The input text.
     * @returns {Promise<string>} Hex representation of the hash.
     */
    async getSHA256(text) {
        return this._sha256(text);
    }

    /**
     * Initializes the Hash demonstration UI elements if they exist.
     * Binds event listeners for hashing input text.
     * Should be called after the relevant HTML content is loaded.
     */
    initDemoUI() {
        const inputElement = document.getElementById('hashInput');
        const outputElement = document.getElementById('hashOutputSHA256');
        const hashButton = document.getElementById('hashButton');

        if (!inputElement || !outputElement || !hashButton) {
            // console.warn("Hash demo elements not found. Skipping UI init.");
            return;
        }

        hashButton.addEventListener('click', async () => {
            const inputText = inputElement.value;
            outputElement.textContent = 'Calcul en cours...'; // Provide feedback
            try {
                const hashHex = await this.getSHA256(inputText);
                outputElement.textContent = hashHex;
                // Demonstrate avalanche effect (optional)
                this._demonstrateAvalanche(inputElement, '#hashOutputSHA256Avalanche');
            } catch (error) {
                outputElement.textContent = 'Erreur de hachage.';
            }
        });

         // Optional: Trigger hash on input change for immediate feedback
         inputElement.addEventListener('input', async () => {
             const inputText = inputElement.value;
             outputElement.textContent = '...'; // Indicate recalculation
             try {
                 const hashHex = await this.getSHA256(inputText);
                 outputElement.textContent = hashHex;
                 this._demonstrateAvalanche(inputElement, '#hashOutputSHA256Avalanche');
             } catch (error) {
                 outputElement.textContent = '...'; // Clear on error during input
             }
         });

        console.log("Hash Functions Demo UI Initialized");
    }

    /**
     * Helper to demonstrate the avalanche effect by hashing a slightly modified input.
     * @param {HTMLInputElement} inputElement - The original input element.
     * @param {string} outputSelector - CSS selector for the avalanche output element.
     * @private
     */
     async _demonstrateAvalanche(inputElement, outputSelector) {
        const avalancheOutputElement = document.querySelector(outputSelector);
        if (!avalancheOutputElement) return;

        const originalText = inputElement.value;
        if (originalText.length === 0) {
            avalancheOutputElement.textContent = '' // Clear if input is empty
            return;
        }
        // Modify the input slightly (e.g., flip the case of the first char or add a space)
        let modifiedText;
        const firstChar = originalText[0];
        if (firstChar >= 'a' && firstChar <= 'z') {
            modifiedText = firstChar.toUpperCase() + originalText.slice(1);
        } else if (firstChar >= 'A' && firstChar <= 'Z') {
            modifiedText = firstChar.toLowerCase() + originalText.slice(1);
        } else {
            modifiedText = originalText + ' '; // Add a space if first char isn't a letter
        }

        try {
            const hashHex = await this.getSHA256(modifiedText);
            avalancheOutputElement.textContent = hashHex;
        } catch (error) {
            avalancheOutputElement.textContent = 'Erreur';
        }
    }
}

// Export the class
export default HashFunctions; 