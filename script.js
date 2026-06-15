// البيانات - الأسئلة والإجابات
const quizData = [
    {
        question: "ما هي عاصمة فرنسا؟",
        options: ["لندن", "برلين", "باريس", "روما"],
        correct: 2
    },
    {
        question: "كم عدد قارات العالم؟",
        options: ["5", "6", "7", "8"],
        correct: 2
    },
    {
        question: "من كتب رواية '1984'؟",
        options: ["جورج أورويل", "مارك توين", "تشارلز ديكنز", "جين أوستن"],
        correct: 0
    },
    {
        question: "ما أكبر كوكب في المجموعة الشمسية؟",
        options: ["زحل", "المريخ", "المشتري", "أورانوس"],
        correct: 2
    },
    {
        question: "في أي سنة اخترع الهاتف؟",
        options: ["1876", "1886", "1896", "1906"],
        correct: 0
    }
];

let currentQuestion = 0;
let studentName = "";
let userAnswers = new Array(quizData.length).fill(null);
let timeRemaining = 30 * 60; // 30 دقيقة بالثواني

// تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('nameForm').addEventListener('submit', startQuiz);
    document.getElementById('nextBtn').addEventListener('click', nextQuestion);
    document.getElementById('prevBtn').addEventListener('click', previousQuestion);
    document.getElementById('submitBtn').addEventListener('click', submitQuiz);
    
    startTimer();
});

// بدء الاختبار
function startQuiz(e) {
    e.preventDefault();
    
    studentName = document.getElementById('studentName').value.trim();
    
    if (studentName === '') {
        alert('من فضلك أدخل اسمك');
        return;
    }
    
    document.getElementById('nameScreen').classList.remove('active');
    document.getElementById('quizScreen').classList.add('active');
    document.getElementById('displayName').textContent = studentName;
    
    displayQuestion();
}

// عرض السؤال
function displayQuestion() {
    const question = quizData[currentQuestion];
    const quizContent = document.getElementById('quizContent');
    
    let optionsHTML = '';
    question.options.forEach((option, index) => {
        const isChecked = userAnswers[currentQuestion] === index ? 'checked' : '';
        optionsHTML += `
            <div class="option">
                <input type="radio" name="answer" value="${index}" id="option${index}" ${isChecked} 
                       onchange="userAnswers[${currentQuestion}] = ${index}">
                <label for="option${index}">${option}</label>
            </div>
        `;
    });
    
    quizContent.innerHTML = `
        <div class="question">
            <h3 class="question-title">السؤال ${currentQuestion + 1}</h3>
            <p style="font-size: 1.1em; color: #2d3748; margin-bottom: 20px;">${question.question}</p>
            <div class="options">
                ${optionsHTML}
            </div>
        </div>
    `;
    
    // تحديث شريط التقدم
    const progress = ((currentQuestion + 1) / quizData.length) * 100;
    document.getElementById('progressFill').style.width = progress + '%';
    document.getElementById('progressText').textContent = `السؤال ${currentQuestion + 1} من ${quizData.length}`;
    
    // تحديث ظهور الأزرار
    updateButtons();
}

// تحديث الأزرار
function updateButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');
    
    if (currentQuestion === 0) {
        prevBtn.style.display = 'none';
    } else {
        prevBtn.style.display = 'block';
    }
    
    if (currentQuestion === quizData.length - 1) {
        nextBtn.style.display = 'none';
        submitBtn.style.display = 'block';
    } else {
        nextBtn.style.display = 'block';
        submitBtn.style.display = 'none';
    }
}

// السؤال التالي
function nextQuestion() {
    if (currentQuestion < quizData.length - 1) {
        currentQuestion++;
        displayQuestion();
        window.scrollTo(0, 0);
    }
}

// السؤال السابق
function previousQuestion() {
    if (currentQuestion > 0) {
        currentQuestion--;
        displayQuestion();
        window.scrollTo(0, 0);
    }
}

// إرسال الاختبار
function submitQuiz() {
    // حساب النتيجة
    let correctCount = 0;
    userAnswers.forEach((answer, index) => {
        if (answer === quizData[index].correct) {
            correctCount++;
        }
    });
    
    const percentage = Math.round((correctCount / quizData.length) * 100);
    const score = correctCount + '/' + quizData.length;
    
    // عرض النتائج
    document.getElementById('quizScreen').classList.remove('active');
    document.getElementById('resultScreen').classList.add('active');
    
    document.getElementById('finalName').textContent = studentName;
    document.getElementById('finalScore').textContent = score;
    document.getElementById('correctAnswers').textContent = correctCount;
    document.getElementById('percentage').textContent = percentage + '%';
    
    stopTimer();
}

// المؤقت
function startTimer() {
    const timerInterval = setInterval(function() {
        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            if (document.getElementById('quizScreen').classList.contains('active')) {
                alert('انتهى الوقت!');
                submitQuiz();
            }
            return;
        }
        
        timeRemaining--;
        
        const minutes = Math.floor(timeRemaining / 60);
        const seconds = timeRemaining % 60;
        
        const timerDisplay = 
            String(minutes).padStart(2, '0') + ':' + 
            String(seconds).padStart(2, '0');
        
        const timerElement = document.getElementById('timer');
        if (timerElement) {
            timerElement.textContent = timerDisplay;
        }
    }, 1000);
}

function stopTimer() {
    // يتم إيقاف المؤقت عند الانتهاء
}