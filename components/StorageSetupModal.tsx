import React from 'react';
import { HardDrive, Save, AlertCircle, FolderOpen } from 'lucide-react';
import { fileSystemService } from '../services/fileSystem';
import { Language } from '../types';

interface Props {
  lang: Language;
  onComplete: (type: 'local' | 'file', handle?: any) => void;
  onCancel: () => void;
}

export const StorageSetupModal: React.FC<Props> = ({ lang, onComplete, onCancel }) => {
  const isAr = lang === 'ar';

  const t = {
    title: isAr ? 'اختر مكان التخزين' : 'Choose Storage Location',
    subtitle: isAr ? 'أين تريد حفظ بياناتك المالية؟' : 'Where would you like to save your financial data?',
    browser: {
      title: isAr ? 'تخزين المتصفح' : 'Browser Storage',
      desc: isAr ? 'سريع وبسيط. تبقى البيانات في هذا المتصفح.' : 'Fast & Simple. Data stays in this browser.'
    },
    file: {
      title: isAr ? 'إنشاء ملف جديد' : 'Create New File',
      desc: isAr ? 'إنشاء ملف جديد لحفظ البيانات.' : 'Create a new file to save data.'
    },
    open: {
      title: isAr ? 'فتح ملف موجود' : 'Open Existing File',
      desc: isAr ? 'استعادة البيانات من ملف سابق.' : 'Restore data from a previous file.'
    },
    unsupported: isAr ? 'الوصول لنظام الملفات غير مدعوم في هذا المتصفح.' : 'File system access is not supported in this browser.'
  };

  const handleLocal = () => {
    onComplete('local');
  };

  const handleFile = async () => {
    try {
      if (!fileSystemService.isSupported()) {
        alert(t.unsupported);
        return;
      }
      const handle = await fileSystemService.createFile();
      onComplete('file', handle);
    } catch (err) {
      console.error('File selection cancelled', err);
    }
  };

  const handleOpenFile = async () => {
    try {
      if (!fileSystemService.isSupported()) {
        alert(t.unsupported);
        return;
      }
      const handle = await fileSystemService.openFile();
      onComplete('file', handle);
    } catch (err) {
      console.error('File selection cancelled', err);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl animate-zoom-in border border-gray-100 dark:border-white/10">
        <h2 className="text-2xl font-bold mb-2 dark:text-white text-center">{t.title}</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8 text-center text-sm">
          {t.subtitle}
        </p>

        <div className="space-y-4">
          <button
            onClick={handleLocal}
            className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-blue-100 dark:border-blue-500/20 hover:border-blue-500 dark:hover:border-blue-400 bg-blue-50/50 dark:bg-blue-500/5 transition-all group active:scale-[0.98]"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
              <HardDrive size={24} />
            </div>
            <div className={`text-${isAr ? 'right' : 'left'}`}>
              <h3 className="font-bold text-gray-800 dark:text-white">{t.browser.title}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t.browser.desc}</p>
            </div>
          </button>

          <button
            onClick={handleFile}
            className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-purple-100 dark:border-purple-500/20 hover:border-purple-500 dark:hover:border-purple-400 bg-purple-50/50 dark:bg-purple-500/5 transition-all group active:scale-[0.98]"
          >
            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
              <Save size={24} />
            </div>
            <div className={`text-${isAr ? 'right' : 'left'}`}>
              <h3 className="font-bold text-gray-800 dark:text-white">{t.file.title}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t.file.desc}</p>
            </div>
          </button>

          <button
            onClick={handleOpenFile}
            className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-green-100 dark:border-green-500/20 hover:border-green-500 dark:hover:border-green-400 bg-green-50/50 dark:bg-green-500/5 transition-all group active:scale-[0.98]"
          >
            <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-500/20 flex items-center justify-center text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform">
              <FolderOpen size={24} />
            </div>
            <div className={`text-${isAr ? 'right' : 'left'}`}>
              <h3 className="font-bold text-gray-800 dark:text-white">{t.open.title}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t.open.desc}</p>
            </div>
          </button>
        </div>

        {!fileSystemService.isSupported() && (
          <div className="mt-6 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl flex items-center gap-2 text-xs text-yellow-700 dark:text-yellow-400 justify-center">
            <AlertCircle size={16} />
            <span>{t.unsupported}</span>
          </div>
        )}
      </div>
    </div>
  );
};
