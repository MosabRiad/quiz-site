// ============================================
// ملف الإعدادات - Configuration File
// ============================================

const CONFIG = {
    // إعدادات الاختبار
    quiz: {
        // الوقت المتاح للاختبار بالدقائق
        timeLimit: 30,
        
        // الأسئلة الافتراضية
        defaultQuestions: [
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
        ]
    },

    // إعدادات لوحة الإدارة
    admin: {
        // عدد الأسئلة الافتراضي
        defaultQuestionCount: 5,
        
        // الحد الأقصى للأسئلة
        maxQuestions: 50,
        
        // أنواع الأسئلة المتاحة
        questionTypes: [
            { value: 'multiple', label: 'اختيار من متعدد' },
            { value: 'true_false', label: 'صح/خطأ' },
            { value: 'short_answer', label: 'إجابة قصيرة' },
            { value: 'mixed', label: 'مختلط' }
        ],
        
        // مستويات الصعوبة
        difficulties: [
            { value: 'easy', label: 'سهل' },
            { value: 'medium', label: 'متوسط' },
            { value: 'hard', label: 'صعب' }
        ],
        
        // إعدادات Gemini API
        gemini: {
            model: 'gemini-pro',
            temperature: 0.7,
            maxOutputTokens: 4096
        }
    },

    // إعدادات التخزين
    storage: {
        // مفاتيح localStorage
        keys: {
            quizQuestions: 'quizQuestions',
            studentResults: 'studentResults',
            currentQuiz: 'currentQuiz',
            geminiKey: 'geminiKey'
        }
    },

    // إعدادات التنسيق
    ui: {
        // اللغة
        language: 'ar',
        
        // الاتجاه
        direction: 'rtl',
        
        // الألوان (يمكن تخصيصها)
        colors: {
            primary: '#667eea',
            secondary: '#764ba2',
            success: '#48bb78',
            danger: '#f56565',
            warning: '#ed8936',
            light: '#f7fafc',
            dark: '#2d3748',
            border: '#e2e8f0'
        },
        
        // الرسائل
        messages: {
            success: {
                quizStarted: 'تم بدء الاختبار بنجاح',
                questionsSaved: 'تم حفظ الأسئلة بنجاح',
                quizSubmitted: 'تم إرسال إجاباتك بنجاح',
                quizActivated: 'تم تفعيل مجموعة الأسئلة'
            },
            error: {
                noName: 'من فضلك أدخل اسمك',
                noFile: 'الرجاء اختيار ملف PowerPoint',
                invalidFile: 'الرجاء اختيار ملف PowerPoint صحيح',
                noApiKey: 'الرجاء إدخال مفتاح Gemini API',
                apiError: 'حدث خطأ في الاتصال بـ Gemini API',
                generationFailed: 'فشل في توليد الأسئلة'
            },
            info: {
                processing: 'جاري معالجة الملف...',
                generating: 'جاري توليد الأسئلة باستخدام AI...',
                timeUp: 'انتهى الوقت!'
            }
        }
    },

    // إعدادات التحقق من البيانات
    validation: {
        // الحد الأدنى والأقصى لطول اسم الطالب
        studentName: {
            minLength: 2,
            maxLength: 50
        },
        
        // حجم الملف الأقصى بـ MB
        maxFileSize: 50,
        
        // صيغ الملفات المقبولة
        acceptedFormats: ['.pptx', '.ppt']
    },

    // إعدادات الأداء
    performance: {
        // تأخير عرض الإشعارات بـ ميلي ثانية
        notificationDuration: 3000,
        
        // تأخير الانتقال بين الأسئلة
        transitionDelay: 300,
        
        // عدد النتائج المعروضة في كل صفحة
        resultsPerPage: 10
    },

    // إعدادات متقدمة
    advanced: {
        // تفعيل وضع التطوير
        debugMode: false,
        
        // حفظ ملف النصوص المستخرجة من PowerPoint
        savePPTText: false,
        
        // السماح بتعديل الأسئلة بعد الحفظ
        allowEditAfterSave: true,
        
        // السماح بحذف المجموعات المحفوظة
        allowDelete: true
    }
};

// ============================================
// دوال مساعدة للوصول إلى الإعدادات
// ============================================

/**
 * الحصول على إعداد معين
 * @param {string} path - مسار الإعداد (مثل: quiz.timeLimit)
 * @returns {*} قيمة الإعداد
 */
function getConfig(path) {
    const keys = path.split('.');
    let value = CONFIG;
    
    for (const key of keys) {
        value = value[key];
        if (value === undefined) return null;
    }
    
    return value;
}

/**
 * تعيين إعداد معين
 * @param {string} path - مسار الإعداد
 * @param {*} value - القيمة الجديدة
 */
function setConfig(path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    let obj = CONFIG;
    
    for (const key of keys) {
        if (!(key in obj)) {
            obj[key] = {};
        }
        obj = obj[key];
    }
    
    obj[lastKey] = value;
}

/**
 * الحصول على رسالة معينة
 * @param {string} type - نوع الرسالة (success, error, info)
 * @param {string} key - مفتاح الرسالة
 * @returns {string} نص الرسالة
 */
function getMessage(type, key) {
    return getConfig(`ui.messages.${type}.${key}`) || 'رسالة غير محددة';
}

/**
 * الحصول على لون معين
 * @param {string} colorName - اسم اللون
 * @returns {string} قيمة اللون
 */
function getColor(colorName) {
    return getConfig(`ui.colors.${colorName}`) || '#000000';
}

/**
 * تطبيق إعدادات مخصصة
 * @param {object} customConfig - الإعدادات المخصصة
 */
function applyCustomConfig(customConfig) {
    Object.assign(CONFIG, customConfig);
    console.log('تم تطبيق الإعدادات المخصصة');
}

/**
 * طباعة جميع الإعدادات الحالية (للتطوير فقط)
 */
function printAllConfig() {
    console.table(CONFIG);
}

// ============================================
// اختبار التأكد من تحميل الملف
// ============================================

console.log('✅ تم تحميل ملف الإعدادات بنجاح');
console.log(`⏱️  وقت الاختبار: ${getConfig('quiz.timeLimit')} دقيقة`);
console.log(`📝 عدد الأسئلة الافتراضي: ${getConfig('admin.defaultQuestionCount')}`);
