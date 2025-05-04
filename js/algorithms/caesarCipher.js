/**
 * @class CaesarCipher
 * Provides methods for encrypting and decrypting text using the Caesar cipher.
 */
class CaesarCipher {
    /**
     * Applies the Caesar cipher algorithm.
     * @param {string} text - The input text.
     * @param {number} key - The shift key (integer).
     * @param {boolean} [decrypt=false] - If true, decrypts the text; otherwise, encrypts.
     * @returns {string} The resulting encrypted or decrypted text.
     * @private
     */
    _cipher(text, key, decrypt = false) {
        if (typeof text !== 'string') {
            console.error("Caesar Cipher: Input text must be a string.");
            return text; // Return original input on error
        }
        const shift = decrypt ? (26 - (key % 26)) % 26 : key % 26;
        if (isNaN(shift)) {
             console.error("Caesar Cipher: Invalid key.");
             return text; // Return original input on error
        }

        return text.split('').map(char => {
            const code = char.charCodeAt(0);

            // Uppercase letters (A-Z: 65-90)
            if (code >= 65 && code <= 90) {
                return String.fromCharCode(((code - 65 + shift) % 26) + 65);
            }
            // Lowercase letters (a-z: 97-122)
            else if (code >= 97 && code <= 122) {
                return String.fromCharCode(((code - 97 + shift) % 26) + 97);
            }
            // Non-alphabetic characters remain unchanged
            else {
                return char;
            }
        }).join('');
    }

    /**
     * Encrypts text using the Caesar cipher.
     * @param {string} plaintext - The text to encrypt.
     * @param {number} key - The shift key.
     * @returns {string} The encrypted ciphertext.
     */
    encrypt(plaintext, key) {
        return this._cipher(plaintext, key, false);
    }

    /**
     * Decrypts text encrypted with the Caesar cipher.
     * @param {string} ciphertext - The text to decrypt.
     * @param {number} key - The shift key used for encryption.
     * @returns {string} The decrypted plaintext.
     */
    decrypt(ciphertext, key) {
        return this._cipher(ciphertext, key, true);
    }

    /**
     * Updates the alphabet visualization based on the current key.
     * @param {number} key - The current shift key.
     * @private
     */
    _updateVisualization(key) {
        const plainAlphabetDiv = document.querySelector('.plain-alphabet');
        const shiftedAlphabetDiv = document.querySelector('.shifted-alphabet');

        if (!plainAlphabetDiv || !shiftedAlphabetDiv) {
            // Visualization elements not present on the page
            return;
        }

        const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const shift = key % 26;
        const validShift = (shift >= 0 && shift <= 25);

        let plainHtml = '';
        let shiftedHtml = '';

        for (let i = 0; i < alphabet.length; i++) {
            const plainChar = alphabet[i];
            plainHtml += `<span class="alphabet-char">${plainChar}</span>`;

            if (validShift) {
                const shiftedChar = alphabet[(i + shift) % 26];
                shiftedHtml += `<span class="alphabet-char">${shiftedChar}</span>`;
            } else {
                 shiftedHtml += `<span class="alphabet-char">?</span>`; // Indicate invalid shift
            }
        }

        plainAlphabetDiv.innerHTML = plainHtml;
        shiftedAlphabetDiv.innerHTML = shiftedHtml;
    }

    /**
     * Initializes the Caesar cipher simulator UI elements if they exist.
     * Binds event listeners for encryption and decryption buttons.
     * Includes initialization and update for the alphabet visualization.
     */
    initSimulatorUI() {
        const inputElement = document.getElementById('caesarInput');
        const keyElement = document.getElementById('caesarKey');
        const outputElement = document.getElementById('caesarOutput');
        const encryptButton = document.getElementById('caesarEncrypt');
        const decryptButton = document.getElementById('caesarDecrypt');

        if (!inputElement || !keyElement || !outputElement || !encryptButton || !decryptButton) {
            return; // Exit if the simulator isn't on the current page
        }

        // Initial visualization update
        const initialKey = parseInt(keyElement.value, 10);
        this._updateVisualization(isNaN(initialKey) ? 0 : initialKey);

        // Update visualization when key changes
        keyElement.addEventListener('input', () => {
            const currentKey = parseInt(keyElement.value, 10);
            this._updateVisualization(isNaN(currentKey) ? 0 : currentKey);
        });

        encryptButton.addEventListener('click', () => {
            const text = inputElement.value;
            const key = parseInt(keyElement.value, 10);
            if (!isNaN(key)) {
                 outputElement.value = this.encrypt(text, key);
                 // Optional: Update visualization again if key could have changed
                 // this._updateVisualization(key);
            } else {
                 outputElement.value = "Clé invalide";
            }
        });

        decryptButton.addEventListener('click', () => {
            const text = inputElement.value;
            const key = parseInt(keyElement.value, 10);
             if (!isNaN(key)) {
                 outputElement.value = this.decrypt(text, key);
                 // this._updateVisualization(key);
            } else {
                 outputElement.value = "Clé invalide";
            }
        });

        console.log("Caesar Cipher Simulator UI Initialized (with Visualization)");
    }
}

// Export the class for use in other modules
export default CaesarCipher; 