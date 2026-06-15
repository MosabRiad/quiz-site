// البيانات - الأسئلة والإجابات
let quizData = [
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
let timerInterval = null;

// تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    // تحميل الأسئلة من localStorage إذا كانت موجودة
    const currentQuiz = localStorage.getItem('currentQuiz');
    if (currentQuiz) {
        try {
            quizData = JSON.parse(currentQuiz);
            userAnswers = new Array(quizData.length).fill(null);
        } catch (e) {
            console.log('استخدام الأسئلة الافتراضية');
        }
    }
    
    // إعداد مستمعات الأحداث
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
    
    // حفظ النتيجة
    const result = {
        name: studentName,
        score: correctCount,
        total: quizData.length,
        percentage: percentage,
        date: new Date().toLocaleString('ar-SA')
    };
    
    let studentResults = JSON.parse(localStorage.getItem('studentResults')) || [];
    studentResults.push(result);
    localStorage.setItem('studentResults', JSON.stringify(studentResults));
    
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
    timerInterval = setInterval(function() {
        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            if (document.getElementById('quizScreen').classList.contains('active')) {
                alert('انتهى الوقت!');
                submitQuiz();
            }
            return;
        }
        
        timeRemaining--;
        updateTimerDisplay();
    }, 1000);
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    
    const timerDisplay = 
        String(minutes).padStart(2, '0') + ':' + 
        String(seconds).padStart(2, '0');
    
    const timerElement = document.getElementById('timer');
    if (timerElement) {
        timerElement.textContent = timerDisplay;
        
        // تغيير اللون عندما يتبقى أقل من 5 دقائق
        if (timeRemaining < 300) {
            timerElement.style.color = '#f56565';
        }
    }
}

function stopTimer() {
    clearInterval(timerInterval);
}
