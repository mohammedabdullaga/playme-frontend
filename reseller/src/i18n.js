const defaultLang = 'ar';

const strings = {
  ar: {
    panelTitle: 'لوحة الموزع',
    signInTitle: 'تسجيل الدخول',
    signInSubtitle: 'سجل دخولك لإنشاء الرموز ومراقبة النقاط',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    login: 'دخول',
    pointsBalance: 'رصيد النقاط',
    createTokens: 'إنشاء رموز',
    duration: 'المدة (أيام)',
    quantity: 'الكمية',
    costPerToken: 'تكلفة الرمز الواحد',
    totalCost: 'التكلفة الإجمالية',
    generate: 'إنشاء',
    recentHistory: 'سجل الإنشاءات',
    noHistory: 'لا توجد عمليات بعد',
    tokenDays: 'أيام',
    points: 'نقطة',
    copy: 'نسخ',
    copied: 'تم النسخ',
    newTokensTitle: 'الرموز الجديدة',
    switchLanguage: 'English',
    statusCreated: count => `تم إنشاء ${count} رمزًا`,
    failedCreate: 'فشل إنشاء الرموز',
    proxySectionTitle: 'بيع البروكسي',
    proxySectionSubtitle: 'أنشئ حساب بروكسي لعميلك مع تفاصيل الاتصال والانتهاء',
    whatsapp: 'واتساب العميل',
    expiry: 'تاريخ الانتهاء',
    proxyCreate: 'إنشاء بروكسي',
    proxyCreated: 'تم إنشاء الحساب بنجاح',
    proxyCreateFailed: 'فشل إنشاء الحساب',
    proxyConfigTitle: 'تفاصيل الإعداد',
    proxySubdomain: 'النطاق الفرعي',
    proxyServer: 'الخادم',
    proxyPort: 'المنفذ',
    proxyUsername: 'اسم المستخدم',
    proxyPassword: 'كلمة المرور',
    proxyUsersTitle: 'الحسابات المنشأة',
    noProxyUsers: 'لا توجد حسابات بعد',
    loading: 'جاري التحميل...',
    loginFailed: 'فشل تسجيل الدخول',
    invalidCredentials: 'بيانات غير صحيحة',
  },
  en: {
    panelTitle: 'Reseller Panel',
    signInTitle: 'Sign In',
    signInSubtitle: 'Sign in to create tokens and monitor points',
    email: 'Email',
    password: 'Password',
    login: 'Login',
    pointsBalance: 'Points Balance',
    createTokens: 'Create Tokens',
    duration: 'Duration (days)',
    quantity: 'Quantity',
    costPerToken: 'Cost per token',
    totalCost: 'Total cost',
    generate: 'Generate',
    recentHistory: 'Recent History',
    noHistory: 'No history yet',
    tokenDays: 'days',
    points: 'pts',
    copy: 'Copy',
    copied: 'Copied',
    switchLanguage: 'العربية',
    statusCreated: count => `Created ${count} token(s)`,
    failedCreate: 'Failed to create tokens',
    proxySectionTitle: 'Proxy Reselling',
    proxySectionSubtitle: 'Create a proxy account for your customer with contact and expiry details',
    whatsapp: 'Customer WhatsApp',
    expiry: 'Expiry date',
    proxyCreate: 'Create Proxy',
    proxyCreated: 'Proxy account created successfully',
    proxyCreateFailed: 'Failed to create proxy account',
    proxyConfigTitle: 'Setup details',
    proxySubdomain: 'Subdomain',
    proxyServer: 'Server',
    proxyPort: 'Port',
    proxyUsername: 'Username',
    proxyPassword: 'Password',
    proxyUsersTitle: 'Created accounts',
    noProxyUsers: 'No accounts yet',
    loading: 'Loading...',
    loginFailed: 'Login failed',
    invalidCredentials: 'Invalid credentials',
  },
};

export function getSavedLang() {
  if (typeof window === 'undefined') return defaultLang;
  return localStorage.getItem('reseller_lang') || defaultLang;
}

export function saveLang(lang) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('reseller_lang', lang);
}

export function getStrings(lang) {
  return strings[lang] || strings[defaultLang];
}
