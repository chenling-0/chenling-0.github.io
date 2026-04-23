const quiz = window.QUIZ_DATA;

const EGG_STAGES = [
  "./assets/egg-progress-1-cut.png",
  "./assets/egg-progress-1-cut.png",
  "./assets/egg-progress-2-cut.png",
  "./assets/egg-progress-3-cut.png",
  "./assets/egg-progress-4-cut.png"
];

const RESULT_TRAITS = {
  guanghualou: { ft: 0.65 },
  benbei: { ft: 0.95 },
  sanjiao: { ft: -0.1 },
  foiegras: { ft: -0.7 },
  photinia: { ft: 0.25 },
  sjtuer: { ft: -0.05 },
  academy13: { ft: 0.92 },
  cafeteria: { ft: -0.88 },
  campuscat: { ft: -0.35 },
  yogurt: { ft: -0.82 },
  qiubu: { ft: 0.58 },
  catphoto: { ft: -0.92 },
  helmet: { ft: 0.96 },
  charger: { ft: -0.48 },
  elevator: { ft: 0.12 },
  varsity: { ft: -0.72 }
};

const FT_KEYWORDS = {
  feeling: [
    "关系",
    "信任",
    "感受",
    "情绪",
    "温柔",
    "共情",
    "浪漫",
    "分享",
    "温暖",
    "柔软",
    "烟火",
    "人情",
    "亲近",
    "氛围",
    "小美好",
    "可怜",
    "留恋",
    "季节"
  ],
  thinking: [
    "规则",
    "秩序",
    "效率",
    "掌控",
    "稳定",
    "规划",
    "结果",
    "筛选",
    "条件",
    "分析",
    "安全",
    "风险",
    "实际",
    "治理",
    "分工",
    "确定性",
    "高效",
    "执行",
    "控制",
    "合规",
    "成本",
    "排障"
  ]
};

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

const scoringProfile = buildScoringProfile();

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

function buildScoringProfile() {
  const profile = {};

  quiz.results.forEach((result) => {
    profile[result.id] = {
      totalPossible: 0,
      supportedQuestions: 0,
      strongPossible: 0
    };
  });

  quiz.questions.forEach((question) => {
    quiz.results.forEach((result) => {
      const values = question.options.map((option) => option.effects[result.id] || 0);
      const maxValue = Math.max(...values);

      if (maxValue > 0) {
        profile[result.id].totalPossible += maxValue;
        profile[result.id].supportedQuestions += 1;
        profile[result.id].strongPossible += 1;
      }
    });
  });

  return profile;
}

function getScoreBoard() {
  const scoreBoard = {};

  quiz.results.forEach((result) => {
    scoreBoard[result.id] = {
      raw: 0,
      hitQuestions: 0,
      strongHits: 0
    };
  });

  state.answers.forEach((selectedIndex, questionIndex) => {
    const question = quiz.questions[questionIndex];
    const option = question?.options[selectedIndex];

    if (!option) {
      return;
    }

    quiz.results.forEach((result) => {
      const value = option.effects[result.id] || 0;
      const maxForQuestion = Math.max(...question.options.map((candidate) => candidate.effects[result.id] || 0));

      if (value > 0) {
        scoreBoard[result.id].raw += value;
        scoreBoard[result.id].hitQuestions += 1;

        if (value === maxForQuestion) {
          scoreBoard[result.id].strongHits += 1;
        }
      }
    });
  });

  return scoreBoard;
}

function getFtVector() {
  let feelingHits = 0;
  let thinkingHits = 0;

  state.answers.forEach((selectedIndex, questionIndex) => {
    const question = quiz.questions[questionIndex];
    const option = question?.options[selectedIndex];

    if (!option) {
      return;
    }

    const text = [question.text, option.text, option.note].join(" ");

    FT_KEYWORDS.feeling.forEach((keyword) => {
      if (text.includes(keyword)) {
        feelingHits += 1;
      }
    });

    FT_KEYWORDS.thinking.forEach((keyword) => {
      if (text.includes(keyword)) {
        thinkingHits += 1;
      }
    });
  });

  const totalHits = feelingHits + thinkingHits;
  const ftScore = totalHits ? (thinkingHits - feelingHits) / totalHits : 0;

  return {
    feelingHits,
    thinkingHits,
    ftScore
  };
}

function rankResults(scoreBoard) {
  const ftVector = getFtVector();

  return [...quiz.results]
    .map((result) => {
      const score = scoreBoard[result.id];
      const profile = scoringProfile[result.id];
      const normalizedScore = profile.totalPossible ? score.raw / profile.totalPossible : 0;
      const hitRate = profile.supportedQuestions ? score.hitQuestions / profile.supportedQuestions : 0;
      const strongRate = profile.strongPossible ? score.strongHits / profile.strongPossible : 0;
      const ftPreference = RESULT_TRAITS[result.id]?.ft || 0;
      const ftAlignment = 1 - Math.abs(ftVector.ftScore - ftPreference) / 2;
      const compositeScore = normalizedScore * 0.72 + ftAlignment * 0.28;

      return {
        ...result,
        score: score.raw,
        normalizedScore,
        hitRate,
        strongRate,
        ftAlignment,
        compositeScore
      };
    })
    .sort((a, b) => {
      if (b.compositeScore !== a.compositeScore) {
        return b.compositeScore - a.compositeScore;
      }
      if (b.normalizedScore !== a.normalizedScore) {
        return b.normalizedScore - a.normalizedScore;
      }
      if (b.strongRate !== a.strongRate) {
        return b.strongRate - a.strongRate;
      }
      if (b.hitRate !== a.hitRate) {
        return b.hitRate - a.hitRate;
      }
      return b.score - a.score;
    });
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
