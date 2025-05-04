/**
 * @class VigenereCipher
 * Provides methods for encrypting and decrypting text using the Vigenere cipher.
 */
class VigenereCipher {

    /**
     * Normalizes the key by converting to uppercase and removing non-alphabetic characters.
     * @param {string} key - The raw key string.
     * @returns {string} The normalized key.
     * @private
     */
    _normalizeKey(key) {
        if (typeof key !== 'string' || key.length === 0) {
            return '';
        }
        return key.toUpperCase().replace(/[^A-Z]/g, '');
    }

    /**
     * Applies the Vigenere cipher algorithm.
     * @param {string} text - The input text.
     * @param {string} key - The cipher key.
     * @param {boolean} [decrypt=false] - If true, decrypts; otherwise, encrypts.
     * @returns {string} The resulting encrypted or decrypted text.
     * @private
     */
    _cipher(text, key, decrypt = false) {
        const normalizedKey = this._normalizeKey(key);
        if (normalizedKey.length === 0) {
            console.error("Vigenere Cipher: Invalid or empty key provided.");
            return text; // Return original text if key is invalid
        }

        let result = '';
        let keyIndex = 0;

        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            const charCode = char.charCodeAt(0);
            let base = 0;

            // Determine if it's an uppercase or lowercase letter
            if (charCode >= 65 && charCode <= 90) {
                base = 65; // Uppercase 'A'
            } else if (charCode >= 97 && charCode <= 122) {
                base = 97; // Lowercase 'a'
            } else {
                result += char; // Append non-alphabetic characters directly
                continue; // Skip Vigenere logic for this character
            }

            // Get the current key character code (A=0, B=1, ...)
            const keyChar = normalizedKey[keyIndex % normalizedKey.length];
            const keyShift = keyChar.charCodeAt(0) - 65; // Key is always uppercase A=0

            // Calculate the shift amount
            const shift = decrypt ? (26 - keyShift) % 26 : keyShift;

            // Apply the shift
            const originalCharPos = charCode - base;
            const newCharPos = (originalCharPos + shift) % 26;
            result += String.fromCharCode(base + newCharPos);

            // Move to the next key character only if we processed an alphabet char
            keyIndex++;
        }

        return result;
    }

    /**
     * Encrypts text using the Vigenere cipher.
     * @param {string} plaintext - The text to encrypt.
     * @param {string} key - The cipher key.
     * @returns {string} The encrypted ciphertext.
     */
    encrypt(plaintext, key) {
        return this._cipher(plaintext, key, false);
    }

    /**
     * Decrypts text encrypted with the Vigenere cipher.
     * @param {string} ciphertext - The text to decrypt.
     * @param {string} key - The cipher key used for encryption.
     * @returns {string} The decrypted plaintext.
     */
    decrypt(ciphertext, key) {
        return this._cipher(ciphertext, key, true);
    }

    /**
     * Initializes the Vigenere cipher simulator UI elements.
     */
    initSimulatorUI() {
        const inputElement = document.getElementById('vigenereInput');
        const keyElement = document.getElementById('vigenereKey');
        const outputElement = document.getElementById('vigenereOutput');
        const encryptButton = document.getElementById('vigenereEncrypt');
        const decryptButton = document.getElementById('vigenereDecrypt');

        if (!inputElement || !keyElement || !outputElement || !encryptButton || !decryptButton) {
            // console.warn("Vigenere simulator elements not found. Skipping UI init.");
            return; // Exit if the simulator isn't on the current page
        }

        encryptButton.addEventListener('click', () => {
            const text = inputElement.value;
            const key = keyElement.value;
            const normalizedKey = this._normalizeKey(key);
            if (normalizedKey.length > 0) {
                 outputElement.value = this.encrypt(text, key);
            } else {
                 outputElement.value = "Clé invalide (doit contenir des lettres).";
            }
        });

        decryptButton.addEventListener('click', () => {
            // Usually decrypt the input field in these demos
            const text = inputElement.value;
            const key = keyElement.value;
             const normalizedKey = this._normalizeKey(key);
            if (normalizedKey.length > 0) {
                 outputElement.value = this.decrypt(text, key);
            } else {
                 outputElement.value = "Clé invalide (doit contenir des lettres).";
            }
        });

        console.log("Vigenere Cipher Simulator UI Initialized");
    }
}

// Export the class
export default VigenereCipher; 