const quiz = window.QUIZ_DATA;

const EGG_STAGES = [
  "./assets/egg-progress-1-cut.png",
  "./assets/egg-progress-1-cut.png",
  "./assets/egg-progress-2-cut.png",
  "./assets/egg-progress-3-cut.png",
  "./assets/egg-progress-4-cut.png"
];

const state = {
  currentQuestion: 0,
  answers: []
};

const screens = {
  intro: document.getElementById("intro-screen"),
  quiz: document.getElementById("quiz-screen"),
  result: document.getElementById("result-screen")
};

const elements = {
  startBtn: document.getElementById("start-btn"),
  prevBtn: document.getElementById("prev-btn"),
  restartBtn: document.getElementById("restart-btn"),
  copyBtn: document.getElementById("copy-btn"),
  questionIndex: document.getElementById("question-index"),
  questionText: document.getElementById("question-text"),
  optionsList: document.getElementById("options-list"),
  progressText: document.getElementById("progress-text"),
  progressFill: document.getElementById("progress-fill"),
  eggVisual: document.getElementById("egg-visual"),
  eggImage: document.getElementById("egg-image"),
  resultImage: document.getElementById("result-image"),
  resultName: document.getElementById("result-name"),
  resultSummary: document.getElementById("result-summary"),
  resultDescription: document.getElementById("result-description"),
  hatchingOverlay: document.getElementById("hatching-overlay"),
  hatchingEggImage: document.getElementById("hatching-egg-image")
};

function showScreen(target) {
  Object.values(screens).forEach((screen) => {
    screen.classList.toggle("active", screen === target);
  });
}

function resetState() {
  state.currentQuestion = 0;
  state.answers = [];
  elements.eggVisual.className = "egg-inline stage-1";
  elements.eggImage.src = EGG_STAGES[0];
  elements.hatchingEggImage.src = EGG_STAGES[4];
  elements.hatchingOverlay.classList.remove("active");
  elements.hatchingOverlay.setAttribute("aria-hidden", "true");
}

function getAnsweredCount() {
  return state.answers.filter((value) => value !== undefined).length;
}

function getEggStageIndex() {
  const ratio = getAnsweredCount() / quiz.questions.length;

  if (ratio === 0) {
    return 1;
  }
  if (ratio <= 0.35) {
    return 2;
  }
  if (ratio <= 0.7) {
    return 3;
  }
  return 4;
}

function updateEggVisual() {
  const stageIndex = getEggStageIndex();
  elements.eggVisual.className = `egg-inline stage-${stageIndex}`;
  elements.eggImage.src = EGG_STAGES[stageIndex - 1];
}

function updateProgress() {
  const answered = getAnsweredCount();
  const total = quiz.questions.length;
  elements.progressText.textContent = `${answered} / ${total}`;
  elements.progressFill.style.width = `${(answered / total) * 100}%`;
  updateEggVisual();
}

function renderQuestion() {
  const question = quiz.questions[state.currentQuestion];
  const savedAnswer = state.answers[state.currentQuestion];

  elements.questionIndex.textContent = "";
  elements.questionText.textContent = question.text;
  elements.optionsList.innerHTML = "";

  question.options.forEach((option, index) => {
    const button = document.createElement("button");
    button.className = "option-btn";

    if (savedAnswer === index) {
      button.classList.add("selected");
    }

    button.innerHTML = `<span>${String.fromCharCode(65 + index)}</span>${option.text}`;
    button.addEventListener("click", () => selectOption(index));
    elements.optionsList.appendChild(button);
  });

  elements.prevBtn.disabled = state.currentQuestion === 0;
  updateProgress();
}

function selectOption(optionIndex) {
  state.answers[state.currentQuestion] = optionIndex;
  updateProgress();

  if (state.currentQuestion === quiz.questions.length - 1) {
    hatchAndShowResult();
    return;
  }

  window.setTimeout(() => {
    state.currentQuestion += 1;
    renderQuestion();
  }, 120);
}

function getScoreBoard() {
  const scoreBoard = {};

  quiz.results.forEach((result) => {
    scoreBoard[result.id] = 0;
  });

  state.answers.forEach((selectedIndex, questionIndex) => {
    const option = quiz.questions[questionIndex]?.options[selectedIndex];

    if (!option) {
      return;
    }

    Object.entries(option.effects).forEach(([resultId, value]) => {
      scoreBoard[resultId] += value;
    });
  });

  return scoreBoard;
}

function rankResults(scoreBoard) {
  return [...quiz.results]
    .map((result) => ({ ...result, score: scoreBoard[result.id] || 0 }))
    .sort((a, b) => b.score - a.score);
}

function showResult() {
  const rankedResults = rankResults(getScoreBoard());
  const winner = rankedResults[0];

  elements.resultImage.src = winner.image;
  elements.resultImage.alt = winner.name;
  elements.resultName.textContent = winner.name;
  elements.resultSummary.textContent = winner.summary;
  elements.resultDescription.textContent = winner.description;

  showScreen(screens.result);
}

function hatchAndShowResult() {
  elements.hatchingOverlay.classList.add("active");
  elements.hatchingOverlay.setAttribute("aria-hidden", "false");
  elements.eggVisual.className = "egg-inline stage-5 hatching";
  elements.eggImage.src = EGG_STAGES[4];
  elements.hatchingEggImage.src = EGG_STAGES[4];

  window.setTimeout(() => {
    elements.hatchingOverlay.classList.remove("active");
    elements.hatchingOverlay.setAttribute("aria-hidden", "true");
    showResult();
  }, 1100);
}

function startQuiz() {
  resetState();
  showScreen(screens.quiz);
  renderQuestion();
}

function showPreviousQuestion() {
  if (state.currentQuestion === 0) {
    return;
  }

  state.currentQuestion -= 1;
  renderQuestion();
}

async function copyResult() {
  const text = `我测出来是 ${elements.resultName.textContent}：${elements.resultSummary.textContent}`;

  try {
    await navigator.clipboard.writeText(text);
    elements.copyBtn.textContent = "已复制";
    window.setTimeout(() => {
      elements.copyBtn.textContent = "复制结果";
    }, 1600);
  } catch (error) {
    elements.copyBtn.textContent = "复制失败";
    window.setTimeout(() => {
      elements.copyBtn.textContent = "复制结果";
    }, 1600);
  }
}

elements.startBtn.addEventListener("click", startQuiz);
elements.prevBtn.addEventListener("click", showPreviousQuestion);
elements.restartBtn.addEventListener("click", startQuiz);
elements.copyBtn.addEventListener("click", copyResult);

resetState();
