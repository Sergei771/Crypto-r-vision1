// Helper function to convert text to binary string
function textToBinary(text) {
    return text.split('').map(char => {
        return char.charCodeAt(0).toString(2).padStart(8, '0');
    }).join('');
}

// Helper function to convert binary string to text
function binaryToText(binary) {
    // Ensure binary string length is a multiple of 8
    const paddedBinary = binary.padEnd(Math.ceil(binary.length / 8) * 8, '0');
    try {
        return paddedBinary.match(/.{1,8}/g).map(byte => {
            return String.fromCharCode(parseInt(byte, 2));
        }).join('');
    } catch (e) {
        console.error("Error converting binary to text:", e);
        // Return potentially partial or corrupted string if conversion fails mid-way
        return "[Erreur de décodage - données invalides]";
    }
}

/**
 * @class Steganography
 * Implements basic LSB Steganography for embedding/extracting text in images.
 */
class Steganography {
    constructor() {
        // Delimiter to signify end of message (e.g., 8 null bytes)
        // Using a slightly more complex sequence to reduce accidental collision chance
        this.delimiter = '00000000111111110000000011111111'; // Example delimiter
        this.bitsPerPixelChannel = 1; // How many LSBs to use per color channel (1 is standard LSB)
    }

    _getPixelData(canvas) {
        const ctx = canvas.getContext('2d');
        return ctx.getImageData(0, 0, canvas.width, canvas.height);
    }

    _setPixelData(canvas, imageData) {
         const ctx = canvas.getContext('2d');
         ctx.putImageData(imageData, 0, 0);
    }

    _embedMessage(imageData, message) {
        const messageBinary = textToBinary(message) + this.delimiter;
        const data = imageData.data; // Array of RGBA values
        let dataIndex = 0;
        let messageBitIndex = 0;

        // Calculate maximum bits storable
        const maxStorableBits = Math.floor((data.length / 4) * 3 * this.bitsPerPixelChannel);
        if (messageBinary.length > maxStorableBits) {
             throw new Error(`Message trop long (${messageBinary.length} bits requis, ${maxStorableBits} bits disponibles).`);
        }

        while (messageBitIndex < messageBinary.length) {
            // Check if we have enough pixel data left
            if(dataIndex >= data.length) {
                 console.error("Ran out of pixels unexpectedly during embedding.");
                 throw new Error("Erreur interne : Manque de pixels pour l'intégration.");
             }

            for (let i = 0; i < 3; i++) { // Iterate RGB channels (skip Alpha)
                if (messageBitIndex >= messageBinary.length) break;

                let currentValue = data[dataIndex + i];
                const messageBit = parseInt(messageBinary[messageBitIndex], 2);

                // Clear the LSB and set the new bit
                currentValue = (currentValue & ~1) | messageBit; // Only uses 1 LSB

                data[dataIndex + i] = currentValue;
                messageBitIndex++;
            }
            dataIndex += 4; // Move to the next pixel (RGBA)
        }
        return imageData;
    }

    _extractMessage(imageData) {
        const data = imageData.data;
        let binaryMessage = '';
        const delimiterCheckLength = this.delimiter.length;

        for (let i = 0; i < data.length; i += 4) {
            for (let j = 0; j < 3; j++) { // Iterate RGB channels
                const lsb = data[i + j] & 1; // Extract the least significant bit
                binaryMessage += lsb.toString();

                // Check for delimiter only when binaryMessage is long enough
                if (binaryMessage.length >= delimiterCheckLength) {
                    const potentialDelimiter = binaryMessage.slice(-delimiterCheckLength);
                    if (potentialDelimiter === this.delimiter) {
                        // Return text found before the delimiter
                        return binaryToText(binaryMessage.slice(0, -delimiterCheckLength));
                    }
                }
            }
             // Optimization: If binary message gets excessively long without finding delimiter, maybe stop?
             // e.g., if (binaryMessage.length > maxPossibleLengthBasedOnImage) return null;
        }
        // If delimiter not found after checking all pixels
        console.warn("Delimiter not found in image data after checking all pixels.");
        return null;
    }

    initUI() {
        const placeholderElement = document.getElementById('steganography-demo-placeholder');
        if (!placeholderElement) {
             console.warn("Steganography placeholder element not found.");
             return;
        }

        placeholderElement.innerHTML = `
            <h4>Démonstration Stéganographie (LSB sur PNG)</h4>
            <p><small>Choisissez une image (PNG sans perte recommandé) et entrez un court message texte. La capacité dépend de la taille de l'image.</small></p>
            <div class="steg-controls grid md:grid-cols-2 gap-6">
                <div>
                    <label for="steg-image-input">1. Charger l'image originale :</label>
                    <input type="file" id="steg-image-input" accept="image/png, image/bmp" class="mt-1">
                    <canvas id="steg-original-canvas" class="steg-canvas mt-2" style="max-width: 100%; height: auto; border: 1px solid var(--border-color); display: none;"></canvas>
                </div>
                <div>
                    <label for="steg-message">2. Message secret :</label>
                    <textarea id="steg-message" rows="4" placeholder="Entrez votre message ici..." class="mt-1"></textarea>
                    <button id="steg-embed-btn" class="btn btn-secondary mt-2">3. Cacher le message</button>
                </div>
            </div>
            <div class="steg-output mt-6">
                <h4>Résultat (Image Modifiée) :</h4>
                 <canvas id="steg-modified-canvas" class="steg-canvas" style="max-width: 100%; height: auto; border: 1px solid var(--border-color); display: none;"></canvas>
                 <a id="steg-download-link" class="btn btn-primary mt-2" style="display:none;">Télécharger l'image modifiée</a>
            </div>
            <hr class="mt-6 mb-6" style="border-color: var(--subtle-divider);">
             <div class="steg-extract-controls">
                <h4>Extraction :</h4>
                <label for="steg-extract-input">1. Charger une image (potentiellement modifiée) :</label>
                <input type="file" id="steg-extract-input" accept="image/png, image/bmp" class="mt-1">
                <canvas id="steg-extract-preview-canvas" class="steg-canvas mt-2" style="max-width: 100%; height: auto; border: 1px solid var(--border-color); display: none;"></canvas> <!-- Added preview for extraction image -->
                <button id="steg-extract-btn" class="btn btn-secondary mt-2">2. Extraire le message</button>
                 <div class="mt-4">
                    <label>Message extrait :</label>
                    <code class="code-block" id="steg-extracted-message" style="min-height: 50px; white-space: pre-wrap; word-break: break-all;">...</code>
                </div>
            </div>
        `;

        // Get references
        const imageInput = document.getElementById('steg-image-input');
        const originalCanvas = document.getElementById('steg-original-canvas');
        const messageInput = document.getElementById('steg-message');
        const embedBtn = document.getElementById('steg-embed-btn');
        const modifiedCanvas = document.getElementById('steg-modified-canvas');
        const downloadLink = document.getElementById('steg-download-link');
        const extractInput = document.getElementById('steg-extract-input');
        const extractPreviewCanvas = document.getElementById('steg-extract-preview-canvas'); // Ref for extract preview
        const extractBtn = document.getElementById('steg-extract-btn');
        const extractedMessageOutput = document.getElementById('steg-extracted-message');

        let originalImageData = null;
        let imageToExtractData = null; // Store ImageData for extraction

        const originalCtx = originalCanvas.getContext('2d');
        const modifiedCtx = modifiedCanvas.getContext('2d');
        const extractPreviewCtx = extractPreviewCanvas.getContext('2d');

        // --- Embedding Listeners ---
        imageInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    originalCanvas.width = img.naturalWidth; // Use naturalWidth for accuracy
                    originalCanvas.height = img.naturalHeight;
                    originalCtx.drawImage(img, 0, 0);
                    originalCanvas.style.display = 'block'; // Show canvas
                    try {
                        originalImageData = this._getPixelData(originalCanvas);
                    } catch (secError) {
                         alert(`Erreur de sécurité lors de la lecture des données de l'image. L'image provient-elle d'un autre domaine (cross-origin) ou est-elle corrompue ? Essayez une autre image. ${secError.message}`);
                         originalCanvas.style.display = 'none';
                         originalImageData = null;
                         return;
                    }
                    // Clear modified canvas and download link
                    modifiedCtx.clearRect(0, 0, modifiedCanvas.width, modifiedCanvas.height);
                    modifiedCanvas.width = 0;
                    modifiedCanvas.height = 0;
                    modifiedCanvas.style.display = 'none';
                    downloadLink.style.display = 'none';
                    downloadLink.href = '#';
                }
                img.onerror = () => {
                     alert("Impossible de charger le fichier image. Est-il corrompu ou dans un format non supporté ?");
                     originalImageData = null;
                     originalCanvas.style.display = 'none';
                }
                img.src = e.target.result;
            }
            reader.readAsDataURL(file);
        });

        embedBtn.addEventListener('click', () => {
            if (!originalImageData) {
                alert("Veuillez d'abord charger une image originale valide.");
                return;
            }
            const message = messageInput.value;
            if (!message) {
                alert("Veuillez entrer un message à cacher.");
                return;
            }

            try {
                 // Create a copy of original data to modify
                 const imageDataCopy = new ImageData(
                     new Uint8ClampedArray(originalImageData.data),
                     originalImageData.width,
                     originalImageData.height
                 );

                const modifiedImageData = this._embedMessage(imageDataCopy, message);

                modifiedCanvas.width = originalCanvas.width;
                modifiedCanvas.height = originalCanvas.height;
                this._setPixelData(modifiedCanvas, modifiedImageData);
                modifiedCanvas.style.display = 'block'; // Show modified canvas

                // Prepare download link
                downloadLink.href = modifiedCanvas.toDataURL('image/png'); // Force PNG for lossless saving
                downloadLink.download = 'stego_image.png';
                downloadLink.style.display = 'inline-block';
                alert("Message caché dans l'image affichée ci-dessous ! Téléchargez-la pour l'extraction.");

            } catch (error) {
                alert(`Erreur lors du masquage : ${error.message}`);
                console.error("Embedding error:", error);
            }
        });

        // --- Extraction Listeners ---
         extractInput.addEventListener('change', (event) => {
             const file = event.target.files[0];
             if (!file) return;
             const reader = new FileReader();
             reader.onload = (e) => {
                 const img = new Image();
                 img.onload = () => {
                     extractPreviewCanvas.width = img.naturalWidth;
                     extractPreviewCanvas.height = img.naturalHeight;
                     extractPreviewCtx.drawImage(img, 0, 0);
                     extractPreviewCanvas.style.display = 'block';
                     try {
                        // Directly store the ImageData for the extraction button
                        imageToExtractData = extractPreviewCtx.getImageData(0, 0, extractPreviewCanvas.width, extractPreviewCanvas.height);
                        extractedMessageOutput.textContent = 'Image chargée, prête pour extraction.';
                     } catch (secError) {
                         alert(`Erreur de sécurité lors de la lecture des données de l'image pour extraction. ${secError.message}`);
                         extractPreviewCanvas.style.display = 'none';
                         imageToExtractData = null;
                         extractedMessageOutput.textContent = 'Erreur chargement image.';
                         return;
                     }
                 }
                  img.onerror = () => {
                     alert("Impossible de charger le fichier image pour extraction.");
                     imageToExtractData = null;
                     extractPreviewCanvas.style.display = 'none';
                     extractedMessageOutput.textContent = 'Erreur chargement image.';
                 }
                 img.src = e.target.result;
             }
             reader.readAsDataURL(file);
        });

         extractBtn.addEventListener('click', () => {
            if (!imageToExtractData) {
                alert("Veuillez charger l'image contenant potentiellement un message caché.");
                return;
            }

            try {
                const extracted = this._extractMessage(imageToExtractData);

                if (extracted !== null) {
                    extractedMessageOutput.textContent = extracted;
                    alert("Message extrait !");
                } else {
                    extractedMessageOutput.textContent = "Aucun message trouvé (ou délimiteur manquant/données corrompues).";
                    alert("Aucun message trouvé.");
                }
            } catch (error) {
                 alert(`Erreur lors de l'extraction : ${error.message}`);
                 console.error("Extraction error:", error);
                 extractedMessageOutput.textContent = `Erreur : ${error.message}`;
            }
        });

        console.log("Steganography UI Initialized.");
    }
}

export default Steganography;