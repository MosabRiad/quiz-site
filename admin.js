// ============================================
// لوحة تحكم الإدارة - Admin Panel JavaScript
// ============================================

// متغيرات عامة
let generatedQuestions = [];
let savedQuestions = JSON.parse(localStorage.getItem('quizQuestions')) || [];
let studentResults = JSON.parse(localStorage.getItem('studentResults')) || [];
let geminiApiKey = localStorage.getItem('geminiKey') || '';

// تهيئة الصفحة عند التحميل
document.addEventListener('DOMContentLoaded', function() {
    initializeAdmin();
});

function initializeAdmin() {
    // إضافة مستمعات الأحداث
    setupTabNavigation();
    setupFileUpload();
    setupFormListeners();
    loadSavedData();
    
    // التحقق من المفتاح المحفوظ
    const savedKey = localStorage.getItem('geminiKey');
    if (savedKey) {
        document.getElementById('geminiKey').value = '••••••••••••••••';
    }
}

// ============================================
// إدارة التابات
// ============================================

function setupTabNavigation() {
    const menuLinks = document.querySelectorAll('.menu-link');
    
    menuLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // إزالة class active من جميع الروابط
            menuLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            // إخفاء جميع التابات
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // عرض التاب المختار
            const tabId = this.getAttribute('data-tab') + '-tab';
            document.getElementById(tabId).classList.add('active');
            
            // تحديث المحتوى
            if (tabId === 'manage-tab') {
                displayQuestions();
            } else if (tabId === 'results-tab') {
                displayResults();
            }
        });
    });
}

// ============================================
// رفع الملفات
// ============================================

function setupFileUpload() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('pptFile');
    
    // فتح منتقي الملفات عند النقر
    uploadArea.addEventListener('click', () => fileInput.click());
    
    // السحب والإفلات
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileUpload(files[0]);
        }
    });
    
    // اختيار الملف من منتقي الملفات
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileUpload(e.target.files[0]);
        }
    });
}

async function handleFileUpload(file) {
    // التحقق من نوع الملف
    if (!file.name.match(/\.(pptx?|ppt)$/i)) {
        showNotification('الرجاء اختيار ملف PowerPoint صحيح', 'error');
        return;
    }
    
    showNotification('جاري معالجة الملف...', 'info');
    
    try {
        const text = await extractTextFromPPT(file);
        if (text.trim()) {
            await generateQuestionsFromText(text);
        } else {
            showNotification('لم يتم استخراج نصوص من الملف', 'error');
        }
    } catch (error) {
        console.error('خطأ في معالجة الملف:', error);
        showNotification('حدث خطأ في معالجة الملف: ' + error.message, 'error');
    }
}

async function extractTextFromPPT(file) {
    // استخدام JSZip لفك ضغط ملف PowerPoint
    const JSZip = window.JSZip;
    if (!JSZip) {
        showNotification('خطأ في تحميل مكتبة معالجة الملفات', 'error');
        return '';
    }
    
    const zip = new JSZip();
    const zipContent = await zip.loadAsync(file);
    
    let extractedText = '';
    
    // البحث عن ملفات الشرائح
    const slideFiles = Object.keys(zipContent.files).filter(name => 
        name.includes('slide') && name.endsWith('.xml') && !name.includes('_rels')
    );
    
    for (const slideFile of slideFiles) {
        const slideContent = await zipContent.files[slideFile].async('text');
        // استخراج النصوص من XML
        const textMatches = slideContent.match(/<a:t>([^<]+)<\/a:t>/g);
        if (textMatches) {
            textMatches.forEach(match => {
                const text = match.replace(/<a:t>|<\/a:t>/g, '');
                if (text.trim()) {
                    extractedText += text + '\n';
                }
            });
        }
    }
    
    return extractedText;
}

// ============================================
// توليد الأسئلة باستخدام Gemini API
// ============================================

async function generateQuestionsFromText(text) {
    const questionCount = parseInt(document.getElementById('questionCount').value) || 5;
    const questionType = document.getElementById('questionType').value;
    const difficulty = document.getElementById('difficulty').value;
    
    if (!text.trim()) {
        showNotification('لم يتم استخراج نصوص من الملف', 'error');
        return;
    }
    
    // الحصول على مفتاح API
    let apiKey = localStorage.getItem('geminiKey');
    const inputValue = document.getElementById('geminiKey').value;
    
    if (!inputValue || inputValue === '••••••••••••••••') {
        showNotification('الرجاء إدخال مفتاح Gemini API', 'error');
        return;
    }
    
    // حفظ المفتاح إذا تم إدخاله جديداً
    if (inputValue && inputValue !== '••••••••••••••••') {
        apiKey = inputValue;
        localStorage.setItem('geminiKey', apiKey);
        document.getElementById('geminiKey').value = '••••••••••••••••';
    }
    
    showNotification('جاري توليد الأسئلة باستخدام AI...', 'info');
    
    const prompt = buildPrompt(text, questionCount, questionType, difficulty);
    
    try {
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + apiKey, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 4096,
                }
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error('خطأ في API: ' + (errorData.error?.message || response.status));
        }
        
        const data = await response.json();
        const generatedText = data.candidates[0].content.parts[0].text;
        
        // معالجة النصوص المولدة
        generatedQuestions = parseGeneratedQuestions(generatedText);
        
        if (generatedQuestions.length > 0) {
            displayGeneratedPreview();
            showNotification(`تم توليد ${generatedQuestions.length} أسئلة بنجاح!`, 'success');
        } else {
            showNotification('فشل في توليد الأسئلة - تحقق من صيغة الإجابة', 'error');
        }
    } catch (error) {
        console.error('خطأ في توليد الأسئلة:', error);
        showNotification('خطأ: ' + error.message, 'error');
    }
}

function buildPrompt(text, count, type, difficulty) {
    const typeInstructions = {
        multiple: 'اختيار من 4 خيارات',
        true_false: 'صح أو خطأ',
        short_answer: 'إجابة قصيرة',
        mixed: 'مختلط (بعضها اختيار من متعدد وبعضها صح/خطأ)'
    };
    
    return `أنت معلم ذو خبرة. الرجاء إنشاء ${count} أسئلة تعليمية من النص التالي.

المحتوى:
${text.substring(0, 2000)}

المتطلبات:
1. نوع الأسئلة: ${typeInstructions[type]}
2. مستوى الصعوبة: ${difficulty}
3. الأسئلة يجب أن تكون بصيغة عربية فصحى واضحة
4. يجب تجنب الأسئلة البديهية جداً
5. صيغة الإخراج بالضبط:

لكل سؤال، استخدم هذا الشكل:
**السؤال 1:** [نص السؤال]
**الخيارات:**
أ) [الخيار الأول]
ب) [الخيار الثاني]
ج) [الخيار الثالث]
د) [الخيار الرابع]
**الإجابة الصحيحة:** أ
**التبرير:** [شرح موجز للإجابة]

ابدأ الآن بإنشاء الأسئلة:`;
}

function parseGeneratedQuestions(text) {
    const questions = [];
    const questionBlocks = text.split(/\*\*السؤال \d+:\*\*/);
    
    questionBlocks.forEach((block, index) => {
        if (index === 0 || !block.trim()) return;
        
        const questionMatch = block.match(/^([^\*]+?)(?=\*\*|$)/);
        const optionsMatch = block.match(/\*\*الخيارات:\*\*([\s\S]*?)\*\*الإجابة/);
        const answerMatch = block.match(/\*\*الإجابة الصحيحة:\*\*\s*([أبجد])/);
        const justificationMatch = block.match(/\*\*التبرير:\*\*\s*([\s\S]+?)(?=\*\*|$)/);
        
        if (questionMatch && optionsMatch && answerMatch) {
            const optionsText = optionsMatch[1].trim();
            const options = optionsText.split(/\n/).filter(o => o.trim()).map(o => {
                return o.replace(/^[أبجد]\)\s*/, '').trim();
            }).filter(o => o);
            
            if (options.length >= 3) {
                const question = {
                    question: questionMatch[1].trim(),
                    options: options.length === 4 ? options : [...options, 'خيار إضافي'],
                    correct: getAnswerIndex(answerMatch[1]),
                    justification: justificationMatch ? justificationMatch[1].trim() : ''
                };
                
                questions.push(question);
            }
        }
    });
    
    return questions;
}

function getAnswerIndex(answer) {
    const answerMap = { 'أ': 0, 'ب': 1, 'ج': 2, 'د': 3 };
    return answerMap[answer.charAt(0)] || 0;
}

function displayGeneratedPreview() {
    const preview = document.getElementById('generatedPreview');
    const previewContent = document.getElementById('previewContent');
    
    previewContent.innerHTML = generatedQuestions.map((q, index) => `
        <div class="question-item">
            <strong>السؤال ${index + 1}: ${q.question}</strong>
            <ol>
                ${q.options.map((opt, i) => `<li>${opt} ${i === q.correct ? '✓' : ''}</li>`).join('')}
            </ol>
            ${q.justification ? `<small><strong>التبرير:</strong> ${q.justification}</small>` : ''}
        </div>
    `).join('');
    
    preview.style.display = 'block';
}

// ============================================
// حفظ الأسئلة
// ============================================

function setupFormListeners() {
    document.getElementById('generateBtn').addEventListener('click', generateQuestions);
    document.getElementById('confirmBtn').addEventListener('click', saveQuestions);
    document.getElementById('regenerateBtn').addEventListener('click', () => {
        document.getElementById('generateBtn').click();
    });
    document.getElementById('logoutBtn').addEventListener('click', logout);
}

function generateQuestions() {
    const fileInput = document.getElementById('pptFile');
    if (!fileInput.files.length) {
        showNotification('الرجاء اختيار ملف PowerPoint أولاً', 'error');
        return;
    }
    
    const generateBtn = document.getElementById('generateBtn');
    generateBtn.disabled = true;
    generateBtn.textContent = '⏳ جاري التوليد...';
    
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const text = await extractTextFromPPT(fileInput.files[0]);
            if (text.trim()) {
                await generateQuestionsFromText(text);
            }
        } finally {
            generateBtn.disabled = false;
            generateBtn.textContent = '🤖 توليد الأسئلة';
        }
    };
    reader.readAsArrayBuffer(fileInput.files[0]);
}

function saveQuestions() {
    const quizName = prompt('ما اسم هذه المجموعة من الأسئلة؟');
    if (!quizName) return;
    
    const newQuiz = {
        id: Date.now(),
        name: quizName,
        date: new Date().toLocaleString('ar-SA'),
        questions: generatedQuestions
    };
    
    savedQuestions.push(newQuiz);
    localStorage.setItem('quizQuestions', JSON.stringify(savedQuestions));
    
    // استبدال الأسئلة في script.js
    updateMainQuiz(generatedQuestions);
    
    generatedQuestions = [];
    document.getElementById('generatedPreview').style.display = 'none';
    document.getElementById('pptFile').value = '';
    
    showNotification('تم حفظ الأسئلة بنجاح!', 'success');
}

function updateMainQuiz(questions) {
    // يتم تحديث الأسئلة في الصفحة الرئيسية عن طريق localStorage
    localStorage.setItem('currentQuiz', JSON.stringify(questions));
}

// ============================================
// عرض الأسئلة المحفوظة
// ============================================

function displayQuestions() {
    const list = document.getElementById('questionsList');
    
    if (savedQuestions.length === 0) {
        list.innerHTML = '<p style="text-align: center; color: #718096;">لا توجد أسئلة محفوظة بعد</p>';
        return;
    }
    
    list.innerHTML = savedQuestions.map(quiz => `
        <div class="question-row">
            <div>
                <strong>${quiz.name}</strong>
                <small>تم الإنشاء: ${quiz.date} | عدد الأسئلة: ${quiz.questions.length}</small>
            </div>
            <div class="question-actions">
                <button class="btn btn-icon btn-primary" onclick="editQuiz(${quiz.id})">✏️ تعديل</button>
                <button class="btn btn-icon btn-danger" onclick="deleteQuiz(${quiz.id})">🗑️ حذف</button>
                <button class="btn btn-icon btn-success" onclick="activateQuiz(${quiz.id})">✓ تفعيل</button>
            </div>
        </div>
    `).join('');
}

function editQuiz(id) {
    const quiz = savedQuestions.find(q => q.id === id);
    if (!quiz) return;
    
    // في مشروع متقدم، يمكن فتح محرر للأسئلة
    showNotification('ميزة التعديل قيد الإعداد', 'info');
}

function deleteQuiz(id) {
    if (!confirm('هل أنت متأكد من حذف هذه المجموعة؟')) return;
    
    savedQuestions = savedQuestions.filter(q => q.id !== id);
    localStorage.setItem('quizQuestions', JSON.stringify(savedQuestions));
    displayQuestions();
    showNotification('تم حذف المجموعة', 'success');
}

function activateQuiz(id) {
    const quiz = savedQuestions.find(q => q.id === id);
    if (!quiz) return;
    
    localStorage.setItem('currentQuiz', JSON.stringify(quiz.questions));
    showNotification(`تم تفعيل مجموعة "${quiz.name}"`, 'success');
}

// ============================================
// عرض النتائج
// ============================================

function displayResults() {
    const list = document.getElementById('resultsList');
    
    if (studentResults.length === 0) {
        list.innerHTML = '<p style="text-align: center; color: #718096;">لا توجد نتائج بعد</p>';
        return;
    }
    
    list.innerHTML = studentResults.map(result => `
        <div class="result-row">
            <div class="result-stat">
                <label>اسم الطالب</label>
                <strong>${result.name}</strong>
            </div>
            <div class="result-stat">
                <label>النتيجة</label>
                <strong>${result.score}/${result.total}</strong>
            </div>
            <div class="result-stat">
                <label>النسبة المئوية</label>
                <strong style="color: ${result.percentage >= 60 ? '#48bb78' : '#f56565'}">${result.percentage}%</strong>
            </div>
            <div class="result-stat">
                <label>التاريخ</label>
                <strong>${result.date}</strong>
            </div>
        </div>
    `).join('');
}

function loadSavedData() {
    const currentQuiz = localStorage.getItem('currentQuiz');
    if (currentQuiz) {
        // الأسئلة الحالية محملة بالفعل
    }
    
    // الاستماع لأي تحديثات من الصفحة الرئيسية
    window.addEventListener('storage', function(e) {
        if (e.key === 'studentResults') {
            studentResults = JSON.parse(e.newValue) || [];
        } else if (e.key === 'quizQuestions') {
            savedQuestions = JSON.parse(e.newValue) || [];
        }
    });
}

// ============================================
// دوال مساعدة
// ============================================

function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = 'notification show ' + type;
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

function logout() {
    if (confirm('هل أنت متأكد من الخروج؟')) {
        // في مشروع متقدم، يتم مسح الجلسة هنا
        window.location.href = 'index.html';
    }
}
