// Define app state and constants
const QUESTION_STATUS = {
    UNANSWERED: 'unanswered',
    CORRECT: 'correct',
    INCORRECT: 'incorrect',
    SKIPPED: 'skipped'
  };
  
  // Main app state
  const state = {
    currentView: 'home', // 'home', 'exam', 'review', 'results'
    examData: null,
    userName: '',
    userEmail: '',
    currentQuestionIndex: 0,
    questions: [],
    startTime: 0,
    isSubmitted: false,
    examResult: null
  };
  
  // Initialize the app
  function initApp() {
    // Set exam data from our static data file
    state.examData = examData;
    
    // Initial render
    renderApp();
    
    // Add event listeners for navigation
    window.addEventListener('hashchange', handleRouteChange);
    
    // Check initial hash
    handleRouteChange();
  }
  
  // Handle route changes based on URL hash
  function handleRouteChange() {
    const hash = window.location.hash || '#home';
    
    if (hash === '#home') {
      state.currentView = 'home';
    } else if (hash.startsWith('#exam')) {
      state.currentView = 'exam';
      if (!state.questions.length) {
        initializeExam();
      }
    } else if (hash === '#results') {
      state.currentView = 'results';
      if (!state.isSubmitted) {
        submitExam();
      }
    } else if (hash === '#review') {
      state.currentView = 'review';
      if (!state.isSubmitted) {
        submitExam();
      }
    }
    
    renderApp();
  }
  
  // Initialize the exam with questions
  function initializeExam() {
    if (!state.userName || !state.userEmail) {
      window.location.hash = '#home';
      return;
    }
    
    state.questions = state.examData.questions.map(q => ({
      ...q,
      status: QUESTION_STATUS.UNANSWERED,
      selectedAnswerId: null
    }));
    
    state.currentQuestionIndex = 0;
    state.startTime = Date.now();
    state.isSubmitted = false;
    state.examResult = null;
  }
  
  // Submit the exam and calculate results
  function submitExam() {
    if (!state.questions.length) return;
    
    // Mark questions as correct/incorrect based on answers
    state.questions = state.questions.map(q => {
      let status = QUESTION_STATUS.SKIPPED;
      
      if (q.selectedAnswerId !== null) {
        const selectedAnswer = q.answers.find(a => a.id === q.selectedAnswerId);
        status = selectedAnswer?.isCorrect ? QUESTION_STATUS.CORRECT : QUESTION_STATUS.INCORRECT;
      }
      
      return { ...q, status };
    });
    
    state.isSubmitted = true;
    
    // Calculate summary
    const totalQuestions = state.questions.length;
    let correctAnswers = 0;
    let incorrectAnswers = 0;
    let skippedAnswers = 0;
    
    state.questions.forEach(q => {
      if (q.status === QUESTION_STATUS.CORRECT) correctAnswers++;
      else if (q.status === QUESTION_STATUS.INCORRECT) incorrectAnswers++;
      else skippedAnswers++;
    });
    
    const score = Math.round((correctAnswers / totalQuestions) * 100);
    const timeSpent = Math.round((Date.now() - state.startTime) / 1000);
    
    state.examResult = {
      totalQuestions,
      correctAnswers,
      incorrectAnswers,
      skippedAnswers,
      score,
      timeSpent
    };
  }
  
  // Handle answer selection
  function handleAnswerSelect(questionId, answerId) {
    if (state.isSubmitted) return;
    
    state.questions = state.questions.map(q => {
      if (q.id === questionId) {
        return { ...q, selectedAnswerId: answerId };
      }
      return q;
    });
    
    renderApp();
  }
  
  // Handle navigation between questions
  function handleNavigate(direction) {
    if (direction === 'prev' && state.currentQuestionIndex > 0) {
      state.currentQuestionIndex--;
    } else if (direction === 'next' && state.currentQuestionIndex < state.questions.length - 1) {
      state.currentQuestionIndex++;
    }
    
    renderApp();
  }
  
  // Handle skipping a question
  function handleSkip() {
    const questionId = state.questions[state.currentQuestionIndex].id;
    handleAnswerSelect(questionId, null);
    handleNavigate('next');
  }
  
  // Handle direct question selection
  function handleQuestionSelect(index) {
    state.currentQuestionIndex = index;
    renderApp();
  }
  
  // Format time (seconds) to minutes and seconds
  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }
  
  // Generate an Excel-like CSV file for download
  function generateExcelDownload() {
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Add headers
    csvContent += "Question,Correct Answer,Your Answer,Status\n";
    
    // Add data
    state.questions.forEach(q => {
      const correctAnswer = q.answers.find(a => a.isCorrect)?.text || 'N/A';
      const yourAnswer = q.selectedAnswerId !== null 
        ? q.answers.find(a => a.id === q.selectedAnswerId)?.text 
        : 'Skipped';
      csvContent += `"${q.text}","${correctAnswer}","${yourAnswer}","${q.status}"\n`;
    });
    
    // Add summary
    csvContent += "\nSummary\n";
    csvContent += `Total Questions,${state.examResult.totalQuestions}\n`;
    csvContent += `Correct Answers,${state.examResult.correctAnswers}\n`;
    csvContent += `Incorrect Answers,${state.examResult.incorrectAnswers}\n`;
    csvContent += `Skipped Answers,${state.examResult.skippedAnswers}\n`;
    csvContent += `Score,${state.examResult.score}%\n`;
    csvContent += `Time Spent,${formatTime(state.examResult.timeSpent)}\n`;
    
    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "exam_result.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  
  // Render home view
  function renderHomeView() {
    const appContainer = document.getElementById('app');
    
    appContainer.innerHTML = `
      <div class="max-w-4xl mx-auto">
        <div class="text-center mb-12">
          <h1 class="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            MCQ Exam Platform
          </h1>
          <p class="mt-3 text-xl text-gray-500">
            Test your knowledge with our interactive multiple-choice exams
          </p>
        </div>
  
        <div class="card">
          <h2 class="text-xl font-bold mb-4">Enter Your Information</h2>
          <p class="text-gray-600 mb-4">Please provide your name and email to start the exam</p>
          
          <div class="mb-4">
            <label for="name" class="block mb-1 font-medium">Name</label>
            <input id="name" type="text" class="w-full p-2 border rounded" placeholder="John Doe" value="${state.userName}">
            <div id="name-error" class="text-red-500 text-sm mt-1"></div>
          </div>
          
          <div class="mb-4">
            <label for="email" class="block mb-1 font-medium">Email</label>
            <input id="email" type="email" class="w-full p-2 border rounded" placeholder="john@example.com" value="${state.userEmail}">
            <div id="email-error" class="text-red-500 text-sm mt-1"></div>
          </div>
        </div>
  
        <h2 class="text-2xl font-bold text-gray-900 mb-6">Available Exams</h2>
        
        <div class="card">
          <h3 class="text-xl font-medium">${state.examData.title}</h3>
          <p class="text-gray-600 my-4">${state.examData.description}</p>
          <button id="start-exam-btn" class="btn btn-primary">Start Exam</button>
        </div>
      </div>
    `;
    
    // Add event listeners
    document.getElementById('name').addEventListener('input', e => {
      state.userName = e.target.value;
      document.getElementById('name-error').textContent = '';
    });
    
    document.getElementById('email').addEventListener('input', e => {
      state.userEmail = e.target.value;
      document.getElementById('email-error').textContent = '';
    });
    
    document.getElementById('start-exam-btn').addEventListener('click', () => {
      // Simple validation
      let isValid = true;
      
      if (!state.userName || state.userName.length < 2) {
        document.getElementById('name-error').textContent = 'Name must be at least 2 characters';
        isValid = false;
      }
      
      if (!state.userEmail || !state.userEmail.includes('@') || !state.userEmail.includes('.')) {
        document.getElementById('email-error').textContent = 'Please enter a valid email address';
        isValid = false;
      }
      
      if (isValid) {
        window.location.hash = '#exam';
      }
    });
  }
  
  // Render exam view
  function renderExamView() {
    const appContainer = document.getElementById('app');
    const question = state.questions[state.currentQuestionIndex];
    const isFirst = state.currentQuestionIndex === 0;
    const isLast = state.currentQuestionIndex === state.questions.length - 1;
    
    appContainer.innerHTML = `
      <div class="max-w-5xl mx-auto">
        <div class="mb-6">
          <h1 class="text-2xl font-bold text-gray-900">${state.examData.title}</h1>
          <p class="text-gray-600">${state.examData.description}</p>
        </div>
        
        <!-- Progress bar -->
        <div class="w-full mb-8">
          <div class="flex justify-between items-center mb-2">
            <h3 class="font-medium text-gray-700">Progress</h3>
            <span class="text-sm text-gray-500">
              Question ${state.currentQuestionIndex + 1} of ${state.questions.length}
            </span>
          </div>
          
          <div class="relative">
            <div class="h-2 bg-gray-200 rounded-full mb-4"></div>
            <div class="absolute top-0 left-0 h-2 bg-blue-500 rounded-full" style="width: ${((state.currentQuestionIndex + 1) / state.questions.length) * 100}%"></div>
          </div>
          
          <div class="progress-indicator">
            ${state.questions.map((q, index) => `
              <button 
                class="progress-step ${index === state.currentQuestionIndex ? 'active' : ''} ${q.status !== QUESTION_STATUS.UNANSWERED ? q.status : ''}"
                data-index="${index}"
              >
                ${index + 1}
              </button>
            `).join('')}
          </div>
        </div>
        
        <!-- Question card -->
        <div class="card fade-in">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-bold">Question ${state.currentQuestionIndex + 1} of ${state.questions.length}</h2>
            ${state.isSubmitted ? `
              <span class="result-badge ${question.status}">
                ${question.status.charAt(0).toUpperCase() + question.status.slice(1)}
              </span>
            ` : ''}
          </div>
          
          <p class="text-lg font-medium mb-4">${question.text}</p>
          
          <div class="space-y-3 mb-6">
            ${question.answers.map(answer => `
              <div 
                class="radio-container ${question.selectedAnswerId === answer.id ? 'selected' : ''} ${
                  state.isSubmitted ? (
                    answer.isCorrect ? 'correct' : 
                    (question.selectedAnswerId === answer.id ? 'incorrect' : '')
                  ) : ''
                }"
                data-question-id="${question.id}"
                data-answer-id="${answer.id}"
              >
                <input 
                  type="radio" 
                  id="answer-${answer.id}" 
                  name="question-${question.id}" 
                  value="${answer.id}"
                  ${question.selectedAnswerId === answer.id ? 'checked' : ''}
                  ${state.isSubmitted ? 'disabled' : ''}
                  style="margin-right: 10px;"
                >
                <label for="answer-${answer.id}" class="flex-grow cursor-pointer">
                  ${answer.text}
                </label>
              </div>
            `).join('')}
          </div>
          
          ${state.isSubmitted && question.explanation ? `
            <div class="p-4 bg-blue-50 border border-blue-200 rounded-md mb-4 fade-in">
              <h4 class="font-bold mb-1">Explanation:</h4>
              <p>${question.explanation}</p>
            </div>
          ` : ''}
          
          <div class="flex justify-between items-center">
            <button class="btn btn-outline" id="prev-btn" ${isFirst ? 'disabled' : ''}>
              Previous
            </button>
            
            <div class="space-x-2">
              ${!isLast && !state.isSubmitted ? `
                <button class="btn btn-outline" id="skip-btn">
                  Skip
                </button>
              ` : ''}
              
              ${!isLast ? `
                <button class="btn btn-primary" id="next-btn">
                  Next
                </button>
              ` : `
                <button class="btn btn-primary" id="finish-btn">
                  Finish
                </button>
              `}
            </div>
          </div>
        </div>
        
        <div class="mt-8 flex justify-between">
          <button class="btn btn-outline" id="exit-btn">
            Exit Exam
          </button>
          
          <button class="btn btn-primary" id="submit-exam-btn" ${state.isSubmitted ? 'disabled' : ''}>
            ${state.isSubmitted ? 'Submitted' : 'Submit Exam'}
          </button>
        </div>
        
        ${state.isSubmitted ? `
          <div class="text-center mt-6">
            <a href="#results" class="text-blue-500 hover:underline">View Results Summary</a>
          </div>
        ` : ''}
      </div>
    `;
    
    // Add event listeners
    document.querySelectorAll('.radio-container').forEach(container => {
      if (!state.isSubmitted) {
        container.addEventListener('click', () => {
          const questionId = parseInt(container.dataset.questionId);
          const answerId = parseInt(container.dataset.answerId);
          handleAnswerSelect(questionId, answerId);
        });
      }
    });
    
    document.querySelectorAll('.progress-step').forEach(step => {
      step.addEventListener('click', () => {
        const index = parseInt(step.dataset.index);
        handleQuestionSelect(index);
      });
    });
    
    const prevBtn = document.getElementById('prev-btn');
    if (prevBtn) prevBtn.addEventListener('click', () => handleNavigate('prev'));
    
    const nextBtn = document.getElementById('next-btn');
    if (nextBtn) nextBtn.addEventListener('click', () => handleNavigate('next'));
    
    const skipBtn = document.getElementById('skip-btn');
    if (skipBtn) skipBtn.addEventListener('click', handleSkip);
    
    const finishBtn = document.getElementById('finish-btn');
    if (finishBtn) finishBtn.addEventListener('click', () => {
      if (!state.isSubmitted) {
        window.location.hash = '#results';
      } else {
        window.location.hash = '#review';
      }
    });
    
    const exitBtn = document.getElementById('exit-btn');
    if (exitBtn) exitBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to exit? Your progress will be lost.')) {
        window.location.hash = '#home';
      }
    });
    
    const submitExamBtn = document.getElementById('submit-exam-btn');
    if (submitExamBtn) {
      submitExamBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to submit your exam? This cannot be undone.')) {
          window.location.hash = '#results';
        }
      });
    }
  }
  
  // Render results view
  function renderResultsView() {
    const appContainer = document.getElementById('app');
    const result = state.examResult;
    
    if (!result) {
      window.location.hash = '#home';
      return;
    }
    
    const chartData = [
      { name: "Correct", value: result.correctAnswers, color: "var(--correct)" },
      { name: "Incorrect", value: result.incorrectAnswers, color: "var(--incorrect)" },
      { name: "Skipped", value: result.skippedAnswers, color: "var(--skipped)" }
    ];
    
    // Get grade text and color based on score
    let gradeText = "";
    let gradeColor = "";
    
    if (result.score >= 90) {
      gradeText = "Excellent";
      gradeColor = "#065f46"; // dark green
    } else if (result.score >= 75) {
      gradeText = "Very Good";
      gradeColor = "#059669"; // green
    } else if (result.score >= 60) {
      gradeText = "Good";
      gradeColor = "#2563eb"; // blue
    } else if (result.score >= 50) {
      gradeText = "Satisfactory";
      gradeColor = "#d97706"; // yellow/orange
    } else {
      gradeText = "Needs Improvement";
      gradeColor = "#dc2626"; // red
    }
    
    appContainer.innerHTML = `
      <div class="max-w-4xl mx-auto fade-in">
        <div class="card text-center border-b pb-6">
          <h1 class="text-3xl font-bold text-blue-600">Exam Results</h1>
          <p class="text-base mt-1">${state.examData.title}</p>
        </div>
        
        <div class="card">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Score and summary -->
            <div class="space-y-6">
              <div class="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 class="text-sm uppercase text-gray-500 font-medium">Your Score</h3>
                <div class="text-6xl font-bold text-blue-600 mt-1">${result.score}%</div>
                <div class="text-center">
                  <h3 class="text-2xl font-bold" style="color: ${gradeColor}">${gradeText}</h3>
                </div>
              </div>
              
              <div class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                  <div class="p-4 bg-green-50 rounded-lg border border-green-100">
                    <h4 class="text-sm uppercase text-green-700 font-medium">Correct</h4>
                    <div class="text-2xl font-bold text-green-600 mt-1">${result.correctAnswers}</div>
                  </div>
                  <div class="p-4 bg-red-50 rounded-lg border border-red-100">
                    <h4 class="text-sm uppercase text-red-700 font-medium">Incorrect</h4>
                    <div class="text-2xl font-bold text-red-600 mt-1">${result.incorrectAnswers}</div>
                  </div>
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                  <div class="p-4 bg-yellow-50 rounded-lg border border-yellow-100">
                    <h4 class="text-sm uppercase text-yellow-700 font-medium">Skipped</h4>
                    <div class="text-2xl font-bold text-yellow-600 mt-1">${result.skippedAnswers}</div>
                  </div>
                  <div class="p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <h4 class="text-sm uppercase text-blue-700 font-medium">Time Spent</h4>
                    <div class="text-2xl font-bold text-blue-600 mt-1">${formatTime(result.timeSpent)}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Simple chart visualization -->
            <div class="flex flex-col items-center justify-center h-[300px]">
              <h3 class="text-base font-medium mb-4">Performance Breakdown</h3>
              <div class="w-full flex items-end h-48 space-x-4">
                ${chartData.map(item => `
                  <div class="flex-1 flex flex-col items-center">
                    <div class="w-full bg-gray-100 rounded-t flex-grow flex items-end">
                      <div 
                        class="w-full rounded-t" 
                        style="background-color: ${item.color}; height: ${(item.value / result.totalQuestions) * 100}%"
                      ></div>
                    </div>
                    <div class="w-full text-center mt-2">
                      <div class="font-medium">${item.name}</div>
                      <div class="text-sm text-gray-500">${Math.round((item.value / result.totalQuestions) * 100)}%</div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
          
          <hr class="my-6 border-gray-200">
          
          <div class="space-y-2">
            <h3 class="text-lg font-semibold mb-3">Question Summary</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              ${state.questions.map((question, index) => `
                <div 
                  class="p-3 rounded-md border ${
                    question.status === QUESTION_STATUS.CORRECT ? 'bg-green-50 border-green-200' :
                    question.status === QUESTION_STATUS.INCORRECT ? 'bg-red-50 border-red-200' :
                    'bg-yellow-50 border-yellow-200'
                  }"
                >
                  <div class="flex justify-between">
                    <span class="font-medium">Question ${index + 1}</span>
                    <span class="result-badge ${question.status}">
                      ${question.status}
                    </span>
                  </div>
                  <p class="text-sm mt-1 truncate">${question.text}</p>
                </div>
              `).join('')}
            </div>
          </div>
          
          <div class="mt-8 text-center">
            <button id="review-btn" class="text-blue-500 hover:text-blue-700 underline font-medium">
              Review Questions and Answers
            </button>
          </div>
          
          <div class="mt-6 text-center">
            <button id="export-btn" class="btn btn-outline flex mx-auto items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Export to CSV
            </button>
          </div>
        </div>
        
        <div class="mt-6 text-center">
          <button id="new-exam-btn" class="btn btn-primary">
            Take New Exam
          </button>
        </div>
      </div>
    `;
    
    // Add event listeners
    document.getElementById('review-btn').addEventListener('click', () => {
      window.location.hash = '#review';
    });
    
    document.getElementById('export-btn').addEventListener('click', generateExcelDownload);
    
    document.getElementById('new-exam-btn').addEventListener('click', () => {
      if (confirm('Start a new exam? Your current results will remain in memory until you close the page.')) {
        window.location.hash = '#home';
      }
    });
  }
  
  // Render review view
  function renderReviewView() {
    const appContainer = document.getElementById('app');
    
    appContainer.innerHTML = `
      <div class="max-w-5xl mx-auto fade-in">
        <motion.div class="flex justify-between items-center mb-6">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Exam Review</h1>
            <p class="text-gray-600">${state.examData.title}</p>
          </div>
          
          <div class="flex space-x-3">
            <button id="export-btn" class="btn btn-outline flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Export to CSV
            </button>
            <button id="home-btn" class="btn btn-outline">
              New Exam
            </button>
          </div>
        </motion.div>
        
        <div class="bg-white p-4 rounded-lg shadow-sm mb-6">
          <div class="flex space-x-4">
            <button id="summary-btn" class="btn btn-outline flex-1">
              Results Summary
            </button>
            <button id="review-btn" class="btn btn-primary flex-1">
              Review Questions
            </button>
          </div>
        </div>
        
        <!-- Progress bar -->
        <div class="w-full mb-8">
          <div class="flex justify-between items-center mb-2">
            <h3 class="font-medium text-gray-700">Progress</h3>
            <span class="text-sm text-gray-500">
              Question ${state.currentQuestionIndex + 1} of ${state.questions.length}
            </span>
          </div>
          
          <div class="relative">
            <div class="h-2 bg-gray-200 rounded-full mb-4"></div>
            <div class="absolute top-0 left-0 h-2 bg-blue-500 rounded-full" style="width: ${((state.currentQuestionIndex + 1) / state.questions.length) * 100}%"></div>
          </div>
          
          <div class="progress-indicator">
            ${state.questions.map((q, index) => `
              <button 
                class="progress-step ${index === state.currentQuestionIndex ? 'active' : ''} ${q.status}"
                data-index="${index}"
              >
                ${index + 1}
              </button>
            `).join('')}
          </div>
        </div>
        
        <!-- Question card for review -->
        ${renderQuestionForReview(state.questions[state.currentQuestionIndex], state.currentQuestionIndex)}
        
        <div class="mt-4 text-center">
          <button id="back-to-summary-btn" class="btn btn-outline">
            Back to Summary
          </button>
        </div>
      </div>
    `;
    
    // Add event listeners
    document.querySelectorAll('.progress-step').forEach(step => {
      step.addEventListener('click', () => {
        const index = parseInt(step.dataset.index);
        handleQuestionSelect(index);
      });
    });
    
    document.getElementById('prev-btn')?.addEventListener('click', () => handleNavigate('prev'));
    document.getElementById('next-btn')?.addEventListener('click', () => handleNavigate('next'));
    
    document.getElementById('back-to-summary-btn').addEventListener('click', () => {
      window.location.hash = '#results';
    });
    
    document.getElementById('summary-btn').addEventListener('click', () => {
      window.location.hash = '#results';
    });
    
    document.getElementById('export-btn').addEventListener('click', generateExcelDownload);
    
    document.getElementById('home-btn').addEventListener('click', () => {
      if (confirm('Return to home screen? You can start a new exam.')) {
        window.location.hash = '#home';
      }
    });
  }
  
  // Helper function to render a question for review
  function renderQuestionForReview(question, index) {
    const isFirst = index === 0;
    const isLast = index === state.questions.length - 1;
    const selectedAnswer = question.selectedAnswerId !== null 
      ? question.answers.find(a => a.id === question.selectedAnswerId) 
      : null;
    const correctAnswer = question.answers.find(a => a.isCorrect);
    
    return `
      <div class="card fade-in">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-bold">Question ${index + 1} of ${state.questions.length}</h2>
          <span class="result-badge ${question.status}">
            ${question.status.charAt(0).toUpperCase() + question.status.slice(1)}
          </span>
        </div>
        
        <p class="text-lg font-medium mb-4">${question.text}</p>
        
        <div class="space-y-3 mb-6">
          ${question.answers.map(answer => `
            <div 
              class="radio-container ${
                answer.isCorrect ? 'correct' : 
                (question.selectedAnswerId === answer.id && !answer.isCorrect ? 'incorrect' : '')
              }"
            >
              <input 
                type="radio" 
                id="review-answer-${answer.id}" 
                name="review-question-${question.id}" 
                value="${answer.id}"
                ${question.selectedAnswerId === answer.id ? 'checked' : ''}
                disabled
                style="margin-right: 10px;"
              >
              <label for="review-answer-${answer.id}" class="flex-grow">
                ${answer.text}
              </label>
            </div>
          `).join('')}
        </div>
        
        <div class="p-4 bg-blue-50 border border-blue-200 rounded-md mb-6">
          <h4 class="font-bold mb-1">Answer Details:</h4>
          <p class="mb-2">
            <span class="font-medium">You selected:</span> 
            ${selectedAnswer ? selectedAnswer.text : 'Skipped'}
          </p>
          <p class="mb-2">
            <span class="font-medium">Correct answer:</span> 
            ${correctAnswer ? correctAnswer.text : 'N/A'}
          </p>
          ${question.explanation ? `
            <h4 class="font-bold mt-3 mb-1">Explanation:</h4>
            <p>${question.explanation}</p>
          ` : ''}
        </div>
        
        <div class="flex justify-between">
          <button class="btn btn-outline" id="prev-btn" ${isFirst ? 'disabled' : ''}>
            Previous
          </button>
          
          <button class="btn btn-primary" id="next-btn">
            ${isLast ? 'Back to Summary' : 'Next'}
          </button>
        </div>
      </div>
    `;
  }
  
  // Main render function
  function renderApp() {
    switch (state.currentView) {
      case 'home':
        renderHomeView();
        break;
      case 'exam':
        renderExamView();
        break;
      case 'results':
        renderResultsView();
        break;
      case 'review':
        renderReviewView();
        break;
      default:
        renderHomeView();
    }
  }
  
  // Initialize the app when page loads
  document.addEventListener('DOMContentLoaded', initApp);