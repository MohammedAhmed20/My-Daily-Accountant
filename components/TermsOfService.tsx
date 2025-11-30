import React from 'react';
import { Language, Theme } from '../types';
import { FileText, ArrowLeft, CheckCircle, AlertCircle, Scale } from 'lucide-react';

interface TermsOfServiceProps {
  lang: Language;
  theme: Theme;
  onBack: () => void;
}

export const TermsOfService: React.FC<TermsOfServiceProps> = ({ lang, theme, onBack }) => {
  const content = {
    en: {
      title: "Terms of Service",
      lastUpdated: "Last updated: November 2024",
      intro: "Welcome to My Daily Accountant. By using this application, you agree to these terms of service.",
      sections: [
        {
          icon: <CheckCircle size={24} />,
          title: "Acceptance of Terms",
          content: "By accessing and using My Daily Accountant, you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the application."
        },
        {
          icon: <FileText size={24} />,
          title: "Use of Service",
          content: "My Daily Accountant is provided free of charge for personal and commercial financial tracking. You may use the application to track your income, expenses, and generate financial reports."
        },
        {
          icon: <Scale size={24} />,
          title: "User Responsibilities",
          content: "You are responsible for maintaining the accuracy of your financial data. The application stores all data locally on your device, and you are responsible for backing up your data regularly."
        },
        {
          icon: <AlertCircle size={24} />,
          title: "Disclaimer",
          content: "My Daily Accountant is provided 'as is' without warranty of any kind. We do not provide financial advice. The application is a tool for tracking and organizing your financial data only."
        }
      ],
      contact: "For questions about these terms, contact us via Facebook: Mohammed Ahmed"
    },
    ar: {
      title: "شروط الخدمة",
      lastUpdated: "آخر تحديث: نوفمبر 2024",
      intro: "مرحبًا بك في محاسبي اليومي. باستخدام هذا التطبيق، فإنك توافق على شروط الخدمة هذه.",
      sections: [
        {
          icon: <CheckCircle size={24} />,
          title: "قبول الشروط",
          content: "من خلال الوصول إلى واستخدام محاسبي اليومي، فإنك تقبل وتوافق على الالتزام بشروط الخدمة هذه. إذا كنت لا توافق على هذه الشروط، يرجى عدم استخدام التطبيق."
        },
        {
          icon: <FileText size={24} />,
          title: "استخدام الخدمة",
          content: "يتم توفير محاسبي اليومي مجانًا لتتبع الأمور المالية الشخصية والتجارية. يمكنك استخدام التطبيق لتتبع دخلك ونفقاتك وإنشاء تقارير مالية."
        },
        {
          icon: <Scale size={24} />,
          title: "مسؤوليات المستخدم",
          content: "أنت مسؤول عن الحفاظ على دقة بياناتك المالية. يخزن التطبيق جميع البيانات محليًا على جهازك، وأنت مسؤول عن عمل نسخة احتياطية من بياناتك بانتظام."
        },
        {
          icon: <AlertCircle size={24} />,
          title: "إخلاء المسؤولية",
          content: "يتم توفير محاسبي اليومي 'كما هو' دون أي ضمان من أي نوع. نحن لا نقدم المشورة المالية. التطبيق هو أداة لتتبع وتنظيم بياناتك المالية فقط."
        }
      ],
      contact: "للأسئلة حول هذه الشروط، اتصل بنا عبر فيسبوك: محمد أحمد"
    }
  };

  const t = content[lang];

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'mesh-bg' : 'light-mesh-bg'} py-12 px-4`}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-blue-600 dark:text-cyan-400 hover:gap-3 transition-all mb-6 font-medium"
          >
            <ArrowLeft size={20} className={lang === 'ar' ? 'rotate-180' : ''} />
            {lang === 'ar' ? 'العودة' : 'Back'}
          </button>
          
          <div className="glass-panel p-8 rounded-3xl border border-white/10">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
                <Scale size={32} />
              </div>
              <div>
                <h1 className="text-4xl font-black text-gradient">{t.title}</h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{t.lastUpdated}</p>
              </div>
            </div>
            <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
              {t.intro}
            </p>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-6">
          {t.sections.map((section, index) => (
            <div key={index} className="glass-panel p-6 rounded-2xl border border-white/10 hover:scale-102 transition-all">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-purple-500 to-pink-600 flex items-center justify-center text-white shadow-lg flex-shrink-0">
                  {section.icon}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                    {section.title}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {section.content}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Contact */}
        <div className="mt-8 glass-panel p-6 rounded-2xl border border-white/10 text-center">
          <p className="text-gray-700 dark:text-gray-300">
            {t.contact}
          </p>
          <a
            href="https://www.facebook.com/Dark.Storm.X.Blak/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-4 text-[#1877F2] hover:scale-110 transition-transform font-bold"
          >
            Facebook
          </a>
        </div>
      </div>
    </div>
  );
};
