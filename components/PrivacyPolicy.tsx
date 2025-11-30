import React from 'react';
import { Language, Theme } from '../types';
import { TRANSLATIONS } from '../constants';
import { Shield, ArrowLeft, Lock, Eye, Server, FileText } from 'lucide-react';

interface PrivacyPolicyProps {
  lang: Language;
  theme: Theme;
  onBack: () => void;
}

export const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ lang, theme, onBack }) => {
  const content = {
    en: {
      title: "Privacy Policy",
      lastUpdated: "Last updated: November 2024",
      intro: "At My Daily Accountant, we take your privacy seriously. This privacy policy explains how we handle your financial data.",
      sections: [
        {
          icon: <Lock size={24} />,
          title: "Data Storage",
          content: "All your financial data is stored locally on your device using browser storage (IndexedDB/LocalStorage). We do not upload, transmit, or store your data on any external servers."
        },
        {
          icon: <Server size={24} />,
          title: "No Server-Side Processing",
          content: "My Daily Accountant is a Progressive Web App (PWA) that runs entirely in your browser. There are no backend servers collecting or processing your financial information."
        },
        {
          icon: <Eye size={24} />,
          title: "No Tracking",
          content: "We do not use cookies, analytics, or tracking pixels to monitor your activity. Your financial habits and transaction details remain completely private."
        },
        {
          icon: <FileText size={24} />,
          title: "Data Export & Control",
          content: "You have full control over your data. You can export your data as JSON or PDF at any time, and you can delete all data by clearing your browser storage."
        }
      ],
      contact: "If you have any questions about our privacy policy, please contact us via Facebook: Mohammed Ahmed"
    },
    ar: {
      title: "سياسة الخصوصية",
      lastUpdated: "آخر تحديث: نوفمبر 2024",
      intro: "في محاسبي اليومي، نأخذ خصوصيتك على محمل الجد. توضح سياسة الخصوصية هذه كيفية تعاملنا مع بياناتك المالية.",
      sections: [
        {
          icon: <Lock size={24} />,
          title: "تخزين البيانات",
          content: "يتم تخزين جميع بياناتك المالية محليًا على جهازك باستخدام تخزين المتصفح (IndexedDB/LocalStorage). لا نقوم برفع أو نقل أو تخزين بياناتك على أي خوادم خارجية."
        },
        {
          icon: <Server size={24} />,
          title: "لا معالجة من جانب الخادم",
          content: "محاسبي اليومي هو تطبيق ويب تقدمي (PWA) يعمل بالكامل في متصفحك. لا توجد خوادم خلفية تجمع أو تعالج معلوماتك المالية."
        },
        {
          icon: <Eye size={24} />,
          title: "لا تتبع",
          content: "لا نستخدم ملفات تعريف الارتباط أو التحليلات أو بكسلات التتبع لمراقبة نشاطك. تظل عادات الإنفاق وتفاصيل المعاملات الخاصة بك خاصة تمامًا."
        },
        {
          icon: <FileText size={24} />,
          title: "تصدير البيانات والتحكم",
          content: "لديك سيطرة كاملة على بياناتك. يمكنك تصدير بياناتك بصيغة JSON أو PDF في أي وقت، ويمكنك حذف جميع البيانات بمسح تخزين المتصفح."
        }
      ],
      contact: "إذا كان لديك أي أسئلة حول سياسة الخصوصية، يرجى الاتصال بنا عبر فيسبوك: محمد أحمد"
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
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-green-500 to-emerald-500 flex items-center justify-center text-white shadow-lg">
                <Shield size={32} />
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
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center text-white shadow-lg flex-shrink-0">
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
