/**
 * @class QuizManager
 * Manages the loading, display, interaction, and scoring of quizzes.
 */
class QuizManager {
    /**
     * @param {string} quizDataPath - Path to the quiz data JSON file.
     * @param {string} containerId - ID of the HTML element to contain the quiz.
     */
    constructor(quizDataPath = 'assets/data/quiz.json', containerId = 'quiz-container') {
        this.quizDataPath = quizDataPath;
        this.containerId = containerId;
        this.container = null;
        this.questionsArea = null;
        this.resultsArea = null;
        this.submitButton = null;
        this.prevButton = null;
        this.nextButton = null;
        this.progressIndicator = null;
        this.restartButton = null;
        this.quizData = null;
        this.originalQuestions = [];
        this.currentQuestions = [];
        this.userAnswers = {};
        this.isSubmitted = false;
        this.currentQuestionIndex = 0;
        this.quizQuestions = [];
        this.listenersAttached = false;
    }

    /**
     * Initializes the quiz: fetches data, renders questions, and sets up listeners.
     */
    async initQuiz() {
        this.container = document.getElementById(this.containerId);
        if (!this.container) {
             console.error(`QuizManager Error: CONTAINER #${this.containerId} NOT FOUND. Aborting.`);
             return;
        }

        // Find elements
        this.questionsArea = this.container.querySelector('#quiz-questions-area');
        this.resultsArea = this.container.querySelector('#quiz-results');
        this.submitButton = this.container.querySelector('#quiz-submit');
        this.prevButton = this.container.querySelector('#quiz-prev');
        this.nextButton = this.container.querySelector('#quiz-next');
        this.progressIndicator = this.container.querySelector('#quiz-progress');
        this.restartButton = this.container.querySelector('#quiz-restart');

        if (!this.questionsArea || !this.resultsArea || !this.submitButton || !this.prevButton || !this.nextButton || !this.progressIndicator || !this.restartButton) {
            if (this.questionsArea) this.questionsArea.innerHTML = '<p class="error">Erreur critique : Structure HTML du quiz incomplète.</p>';
             else console.error("QuizManager Critical Error: Missing one or more required elements (questions, results, submit, prev, next, progress, restart).");
            return;
        }

        // Reset state
        this.isSubmitted = false;
        this.currentQuestionIndex = 0;
        this.userAnswers = {};
        this.resultsArea.innerHTML = '';
        this.resultsArea.style.display = 'none';
        this.restartButton.style.display = 'none';
        this.progressIndicator.style.display = 'inline-block';

        try {
            // Load data if not already loaded (or force reload if needed)
            if (!this.originalQuestions.length) {
                 await this._loadQuizData();
            }

            if (this.originalQuestions && this.originalQuestions.length > 0) {
                // Shuffle questions for this instance
                this.currentQuestions = this._shuffleArray([...this.originalQuestions]);

                this._renderQuizStructure();
                this._setupQuizListeners();
                this._showQuestion(this.currentQuestionIndex);
            } else {
                throw new Error("Quiz data is invalid or empty.");
            }
        } catch (error) {
            console.error("Failed to initialize quiz:", error);
            this.questionsArea.innerHTML = `<p class="error">Impossible de charger les données du quiz. (${error.message}).</p>`;
            this._updateNavButtonStates();
            this.progressIndicator.style.display = 'none';
        }
    }

    /** Fetches quiz data and stores it */
    async _loadQuizData() {
        try {
            const response = await fetch(this.quizDataPath);
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            const data = await response.json();
            if (!data || !Array.isArray(data.questions)) {
                throw new Error("Invalid quiz data format.");
            }
            this.originalQuestions = data.questions; // Store the original questions
        } catch (error) {
            console.error(`Error loading quiz data:`, error);
            this.originalQuestions = []; // Ensure it's empty on error
            throw error;
        }
    }

    /** Fisher-Yates Shuffle Algorithm */
    _shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    /** Renders the HTML structure based on this.currentQuestions */
    _renderQuizStructure() {
        if (!this.currentQuestions || !this.questionsArea) return;

        let html = '';
        this.currentQuestions.forEach((q, index) => {
            const optionsArray = Object.entries(q.options);
            const shuffledOptions = this._shuffleArray(optionsArray);

            html += `
                <div class="quiz-question" data-question-id="${q.id}" style="display: none;">
                    <h4>${index + 1}. ${q.question}</h4>
                    <div class="quiz-options">
            `;
            shuffledOptions.forEach(([key, value]) => {
                html += `<div class="quiz-option" data-value="${key}">${value}</div>`;
            });
            html += `
                    </div>
                    <div class="quiz-feedback"></div>
                </div>
            `;
        });

        this.questionsArea.innerHTML = html;
        // Store references to the question elements
        this.quizQuestions = Array.from(this.questionsArea.querySelectorAll('.quiz-question'));
    }

    /** Shows a specific question by index */
    _showQuestion(index) {
        if (index < 0 || !this.quizQuestions || index >= this.quizQuestions.length) {
             return;
        }

        // Update question number in heading
        const currentQuestionElement = this.quizQuestions[index];
        const heading = currentQuestionElement.querySelector('h4');
        if(heading){
            // Ensure the question text from the current (shuffled) question data is used
            heading.textContent = `${index + 1}. ${this.currentQuestions[index].question}`;
        }

        this.quizQuestions.forEach((q, i) => {
            q.style.display = (i === index) ? 'block' : 'none';
        });
        this.currentQuestionIndex = index;
        this._updateNavButtonStates();
        this._updateProgressIndicator();
    }

    /** Updates nav buttons state */
    _updateNavButtonStates() {
        // Added check for restartButton
        if (!this.currentQuestions || !this.prevButton || !this.nextButton || !this.submitButton || !this.restartButton) return;

        const isLastQuestion = this.currentQuestionIndex === this.currentQuestions.length - 1;

        this.prevButton.style.display = (this.currentQuestionIndex > 0 && !this.isSubmitted) ? 'inline-block' : 'none';
        this.nextButton.style.display = (!isLastQuestion && !this.isSubmitted) ? 'inline-block' : 'none';
        this.submitButton.style.display = (isLastQuestion && !this.isSubmitted) ? 'inline-block' : 'none';
        this.restartButton.style.display = this.isSubmitted ? 'inline-block' : 'none'; // Show only after submit

        // Disable buttons if quiz submitted
        this.prevButton.disabled = this.isSubmitted;
        this.nextButton.disabled = this.isSubmitted;
        this.submitButton.disabled = this.isSubmitted;
        // Restart button is always enabled when visible
    }

    /** Updates progress text */
    _updateProgressIndicator() {
        if (!this.progressIndicator || !this.currentQuestions) return;
        if(this.isSubmitted){
            this.progressIndicator.style.display = 'none';
        } else {
            this.progressIndicator.style.display = 'inline-block';
            this.progressIndicator.textContent = `Question ${this.currentQuestionIndex + 1} sur ${this.currentQuestions.length}`;
        }
    }

    /** Sets up event listeners ONCE (or managed carefully) */
    _setupQuizListeners() {
        // Ensure listeners are not added multiple times if initQuiz is called again
        // A simple flag or removing/re-adding might be needed for robust re-initialization
        if (this.listenersAttached) return; // Simple flag approach

        // Option selection
        this.questionsArea.addEventListener('click', (event) => {
            if (this.isSubmitted) return;
            const targetOption = event.target.closest('.quiz-option');
            if (targetOption) {
                const questionElement = targetOption.closest('.quiz-question');
                if (!questionElement) return;
                const questionId = questionElement.dataset.questionId;
                const selectedValue = targetOption.dataset.value;
                this.userAnswers[questionId] = selectedValue;

                const options = questionElement.querySelectorAll('.quiz-option');
                options.forEach(opt => opt.classList.remove('selected'));
                targetOption.classList.add('selected');
            }
        });

        // Prev button
        this.prevButton.addEventListener('click', () => {
            if (!this.isSubmitted && this.currentQuestionIndex > 0) {
                this._showQuestion(this.currentQuestionIndex - 1);
            }
        });

        // Next button
        this.nextButton.addEventListener('click', () => {
            if (!this.isSubmitted && this.currentQuestionIndex < this.quizQuestions.length - 1) {
                this._showQuestion(this.currentQuestionIndex + 1);
            }
        });

        // Submit button
        this.submitButton.addEventListener('click', () => {
            if (!this.isSubmitted) {
                this._submitQuiz();
            }
        });

        // Restart button
        this.restartButton.addEventListener('click', () => {
             // No need for console.log here
             this.initQuiz(); // Re-initialize the quiz
        });

        this.listenersAttached = true; // Set flag
    }

    /** Handles quiz submission */
    _submitQuiz() {
        if (this.isSubmitted || !this.currentQuestions) return;
        this.isSubmitted = true;
        let score = 0;
        let totalQuestions = this.currentQuestions.length;

        // Show all questions now that it's submitted
        this.quizQuestions.forEach(qElement => {
            qElement.style.display = 'block';
            // Update heading numbering to final state
            const heading = qElement.querySelector('h4');
            // Find the original index based on question ID if needed, or use loop index
            const qDataIndex = this.currentQuestions.findIndex(q => q.id === qElement.dataset.questionId);
             if(heading && qDataIndex !== -1){
                 heading.textContent = `${qDataIndex + 1}. ${this.currentQuestions[qDataIndex].question}`;
             }
        });

        this.currentQuestions.forEach((q, index) => { // Iterate through shuffled questions data
            const questionElement = this.questionsArea.querySelector(`.quiz-question[data-question-id="${q.id}"]`); // Find element by ID
            if (!questionElement) return;

            const options = questionElement.querySelectorAll('.quiz-option');
            const feedbackElement = questionElement.querySelector('.quiz-feedback');
            const userAnswer = this.userAnswers[q.id];
            const correctAnswer = q.correctAnswer;

            // Scoring logic
            if (userAnswer === correctAnswer) {
                score++;
            }

            // Styling options logic
            options.forEach(opt => {
                const optionValue = opt.dataset.value;
                opt.classList.add('submitted');
                opt.style.cursor = 'default';
                opt.classList.remove('selected');

                if (optionValue === correctAnswer) {
                    opt.classList.add('correct');
                    opt.classList.remove('incorrect');
                }
                if (optionValue === userAnswer && userAnswer !== correctAnswer) {
                    opt.classList.add('incorrect');
                    opt.classList.remove('correct');
                }
            });

            // Feedback logic
            feedbackElement.classList.remove('correct', 'incorrect');
            const correctAnswerText = q.options[correctAnswer] || '[Option texte manquante]';
            if (userAnswer === correctAnswer) {
                feedbackElement.innerHTML = `<span class="correct">Correct !</span> ${q.explanation || ''}`;
                feedbackElement.classList.add('correct');
            } else if (userAnswer) {
                 feedbackElement.innerHTML = `<span class="incorrect">Incorrect.</span> La bonne réponse était : ${correctAnswerText}. ${q.explanation || ''}`;
                 feedbackElement.classList.add('incorrect');
             } else {
                 feedbackElement.innerHTML = `<span class="incorrect">Non répondu.</span> La bonne réponse était : ${correctAnswerText}. ${q.explanation || ''}`;
                 feedbackElement.classList.add('incorrect');
            }
            feedbackElement.style.display = 'block';
        });

        // Display final score
        const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
        this.resultsArea.innerHTML = `
            <h3>Résultats du Quiz</h3>
            <p>Votre score : <strong>${score} / ${totalQuestions} (${percentage}%)</strong></p>
        `;
        this.resultsArea.style.display = 'block';

        // Update nav buttons (hides prev/next/submit, shows restart)
        this._updateNavButtonStates();
        this._updateProgressIndicator(); // Hides progress
    }
}

export default QuizManager; 