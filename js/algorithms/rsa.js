// Helper function for modular exponentiation (base^exp % mod)
// Uses BigInt for intermediate calculations to prevent overflow
function power(base, exp, mod) {
    let res = 1n;
    base = BigInt(base) % BigInt(mod);
    exp = BigInt(exp);
    mod = BigInt(mod);
    while (exp > 0n) {
        if (exp % 2n === 1n) res = (res * base) % mod;
        base = (base * base) % mod;
        exp = exp / 2n;
    }
    return res;
}

// Helper function for Greatest Common Divisor using BigInt
function gcd(a, b) {
    a = BigInt(a);
    b = BigInt(b);
    while (b) {
        a = a % b;
        [a, b] = [b, a]; // Swap a and b
    }
    return a;
}


// Helper function for Extended Euclidean Algorithm to find modular inverse
// Returns [gcd, x, y] such that a*x + m*y = gcd(a, m)
function extendedGcd(a, m) {
    a = BigInt(a);
    m = BigInt(m);
    if (m === 0n) {
        return [a, 1n, 0n];
    }
    const [d, x1, y1] = extendedGcd(m, a % m);
    const x = y1;
    // Use BigInt division explicitly
    const y = x1 - (a / m) * y1; // Ensure BigInt division
    return [d, x, y];
}


// Helper function for Modular Multiplicative Inverse
// Returns d such that (a * d) % m = 1
function modInverse(a, m) {
    a = BigInt(a);
    m = BigInt(m);
    const [d, x] = extendedGcd(a, m);
    if (d !== 1n) {
        return null; // Inverse does not exist
    }
    // x might be negative, convert to positive modular equivalent
    return (x % m + m) % m;
}

/**
 * @class RSA
 * Implements RSA Key generation, Encryption, Decryption for demonstration.
 * WARNING: Uses small primes for demonstration purposes. NOT SECURE for real use.
 */
class RSA {
    constructor() {
        // List of small prime numbers for demonstration
        this.smallPrimes = [11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97];
        this.p = null;
        this.q = null;
        this.n = null;
        this.phi = null;
        this.e = null;
        this.d = null;
        // console.log("RSA component loaded."); // Keep console logs minimal
    }

    generateKeys() {
        // 1. Select two distinct primes p and q
        let pIndex = Math.floor(Math.random() * this.smallPrimes.length);
        let qIndex = Math.floor(Math.random() * this.smallPrimes.length);
        while (pIndex === qIndex) {
            qIndex = Math.floor(Math.random() * this.smallPrimes.length);
        }
        this.p = BigInt(this.smallPrimes[pIndex]);
        this.q = BigInt(this.smallPrimes[qIndex]);

        // 2. Calculate n = p * q
        this.n = this.p * this.q;

        // 3. Calculate phi(n) = (p - 1) * (q - 1)
        this.phi = (this.p - 1n) * (this.q - 1n);

        // 4. Choose e such that 1 < e < phi(n) and gcd(e, phi(n)) = 1
        this.e = 3n; // Try e = 3 first
        if (gcd(this.e, this.phi) !== 1n) {
             this.e = 5n; // Try 5
             if (gcd(this.e, this.phi) !== 1n) {
                 this.e = 7n;
                 while (gcd(this.e, this.phi) !== 1n && this.e < this.phi) { // Added check e < phi
                     this.e += 2n;
                 }
             }
        }
        if (this.e >= this.phi || gcd(this.e, this.phi) !== 1n) { // Check again after loop
             console.error("Could not find suitable e < phi. Regenerating keys.");
             this.generateKeys(); // Try again
             return;
         }

        // 5. Calculate d, the modular inverse of e mod phi(n)
        this.d = modInverse(this.e, this.phi);

        if (this.d === null) {
            console.error("Modular inverse could not be calculated. Regenerate keys.");
             this.generateKeys(); // Try again
             return;
        }
        // console.log("RSA Keys Generated:", {p: this.p, q: this.q, n: this.n, phi: this.phi, e: this.e, d: this.d });
    }

    encrypt(message) {
        if (!this.n || !this.e) {
            alert("Veuillez d'abord générer les clés RSA.");
            return null;
        }
        try {
            const m = BigInt(message);
            if (m >= this.n) {
                alert(`Le message (${m}) doit être un entier strictement inférieur à n (${this.n}).`);
                return null;
            }
             if (m < 0n) {
                 alert(`Le message (${m}) doit être un entier positif.`);
                 return null;
            }
            return power(m, this.e, this.n);
        } catch (error) {
            alert("Erreur lors du chiffrement. Le message est-il un nombre entier valide et positif ?");
            console.error("Encryption error:", error);
            return null;
        }
    }

    decrypt(ciphertext) {
        if (!this.n || !this.d) {
            alert("Veuillez d'abord générer les clés RSA.");
            return null;
        }
        try {
            const c = BigInt(ciphertext);
             if (c >= this.n || c < 0n) { // Ciphertext also must be in range [0, n-1]
                alert(`Le texte chiffré (${c}) est invalide (doit être entre 0 et n-1).`);
                return null;
            }
            return power(c, this.d, this.n);
        } catch (error) {
            alert("Erreur lors du déchiffrement. Le texte chiffré est-il valide ?");
            console.error("Decryption error:", error);
            return null;
        }
    }

    initUI() {
        const placeholderElement = document.getElementById('rsa-demo-placeholder');
        if (!placeholderElement) {
             console.warn("RSA demo placeholder element (#rsa-demo-placeholder) not found.");
             return;
        }

        // Create UI elements
        placeholderElement.innerHTML = `
            <h4>Démonstration RSA</h4>
            <p><small><strong>Note :</strong> Utilise de petits nombres premiers pour la démonstration. <strong>Non sécurisé en pratique !</strong> Les messages doivent être des entiers positifs inférieurs à n.</small></p>
            <div class="rsa-controls">
                <button id="rsa-generate-keys" class="btn btn-secondary">1. Générer les clés (p, q, n, φ(n), e, d)</button>
                <div class="key-display mt-4" id="rsa-key-display" style="display: none; border: 1px solid var(--border-color); padding: 1rem; border-radius: 4px; background: var(--code-bg);">
                    <p><small>p = <code id="rsa-p"></code>, q = <code id="rsa-q"></code></small></p>
                    <p><strong>Module (n) :</strong> <code id="rsa-n" class="code-inline"></code></p>
                    <p><small>φ(n) = <code id="rsa-phi"></code></small></p>
                    <p><strong>Exposant Public (e) :</strong> <code id="rsa-e" class="code-inline"></code></p>
                    <p><strong>Exposant Privé (d) :</strong> <code id="rsa-d" class="code-inline"></code></p>
                </div>

                <div class="mt-4">
                    <label for="rsa-message">2. Message à chiffrer (Entier M >= 0 et M < n) :</label>
                    <input type="number" id="rsa-message" placeholder="Entrez un nombre entier positif" min="0">
                    <button id="rsa-encrypt" class="btn btn-secondary">Chiffrer (M<sup>e</sup> mod n)</button>
                </div>
                <div class="mt-2">
                    <label>Texte Chiffré (C) :</label>
                    <code class="code-block" id="rsa-ciphertext" style="min-height: 30px; word-break: break-all;">...</code>
                </div>

                <div class="mt-4">
                     <button id="rsa-decrypt" class="btn btn-secondary">3. Déchiffrer (C<sup>d</sup> mod n)</button>
                </div>
                 <div class="mt-2">
                    <label>Message Déchiffré (M) :</label>
                    <code class="code-block" id="rsa-decrypted" style="min-height: 30px; word-break: break-all;">...</code>
                </div>
            </div>
        `;

        // Get references to newly created elements
        const generateBtn = document.getElementById('rsa-generate-keys');
        const keyDisplay = document.getElementById('rsa-key-display');
        const encryptBtn = document.getElementById('rsa-encrypt');
        const decryptBtn = document.getElementById('rsa-decrypt');
        const messageInput = document.getElementById('rsa-message');
        const ciphertextOutput = document.getElementById('rsa-ciphertext');
        const decryptedOutput = document.getElementById('rsa-decrypted');
        const pOut = document.getElementById('rsa-p');
        const qOut = document.getElementById('rsa-q');
        const nOut = document.getElementById('rsa-n');
        const phiOut = document.getElementById('rsa-phi');
        const eOut = document.getElementById('rsa-e');
        const dOut = document.getElementById('rsa-d');

        let currentCiphertext = null;

        // Add event listeners
        generateBtn.addEventListener('click', () => {
            this.generateKeys();
            if(!this.n) return; // Stop if key generation failed

            pOut.textContent = this.p.toString();
            qOut.textContent = this.q.toString();
            nOut.textContent = this.n.toString();
            phiOut.textContent = this.phi.toString();
            eOut.textContent = this.e.toString();
            dOut.textContent = this.d.toString();
            keyDisplay.style.display = 'block';
            // Update placeholder and max attribute for message input based on n
            messageInput.placeholder = `Entrez un nombre entier positif < ${this.n.toString()}`;
            messageInput.max = (this.n - 1n).toString(); // Set max for input validation
            // Clear previous results
            messageInput.value = '';
            ciphertextOutput.textContent = '...';
            decryptedOutput.textContent = '...';
            currentCiphertext = null;
        });

        encryptBtn.addEventListener('click', () => {
            const message = messageInput.value;
            if (message === '') { // Check only for empty, allow 0
                alert("Veuillez entrer un message (entier positif).");
                return;
            }
             try {
                 const messageBigInt = BigInt(message);
                 if (messageBigInt < 0n) {
                     alert("Veuillez entrer un entier positif.");
                     return;
                 }
                 // Check against current n if keys are generated
                 if (this.n && messageBigInt >= this.n) {
                     alert(`Le message (${message}) doit être strictement inférieur à n (${this.n}).`);
                     return;
                 }
             } catch (e) {
                 alert("Entrée invalide. Veuillez entrer un nombre entier.");
                 return;
             }

            const ciphertext = this.encrypt(message);
            if (ciphertext !== null) {
                currentCiphertext = ciphertext; // Store as BigInt
                ciphertextOutput.textContent = ciphertext.toString();
                decryptedOutput.textContent = '...'; // Clear decryption result
            }
        });

        decryptBtn.addEventListener('click', () => {
            // Use the stored BigInt ciphertext if available
            if (currentCiphertext === null) {
                 // Try reading from output if currentCiphertext is null (e.g., page reload?)
                 const cipherTextStr = ciphertextOutput.textContent;
                 if(cipherTextStr === '...') {
                    alert("Veuillez d'abord générer des clés et chiffrer un message.");
                    return;
                 }
                 try {
                    currentCiphertext = BigInt(cipherTextStr);
                 } catch (e) {
                     alert("Le texte chiffré affiché est invalide.");
                     return;
                 }
            }

            const decryptedMessage = this.decrypt(currentCiphertext);
            if (decryptedMessage !== null) {
                decryptedOutput.textContent = decryptedMessage.toString();
            }
        });

        // console.log("RSA UI Initialized.");
    }
}

export default RSA;