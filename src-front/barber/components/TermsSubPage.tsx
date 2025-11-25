

import React from 'react';
import { ArrowRight } from 'lucide-react';

interface TermsSubPageProps {
  onBack: () => void;
}

const TermsSubPage: React.FC<TermsSubPageProps> = ({ onBack }) => {
  return (
    <div className="absolute inset-0 bg-surface-1 z-50 flex flex-col">
      <header className="sticky top-0 bg-surface-1/80 backdrop-blur-sm p-4 z-50 flex items-center gap-4 border-b border-gray-200">
        <button onClick={onBack} aria-label="بازگشت"><ArrowRight /></button>
        <h1 className="text-2xl font-bold">قوانین و مقررات</h1>
      </header>
      <main className="flex-grow p-6 overflow-y-auto">
        <div className="prose prose-sm max-w-none text-justify">
          <h2 className="font-bold">مقدمه</h2>
          <p>
            به اپلیکیشن پنل آرایشگر کات‌چی خوش آمدید. استفاده شما از این اپلیکیشن به منزله پذیرش کامل شرایط و قوانین زیر است. لطفاً این موارد را با دقت مطالعه فرمایید.
          </p>

          <h2 className="font-bold">۱. تعاریف</h2>
          <ul>
            <li><strong>اپلیکیشن:</strong> منظور از اپلیکیشن، نرم‌افزار "کات‌چی - پنل آرایشگر" است.</li>
            <li><strong>کاربر:</strong> هر شخص حقیقی یا حقوقی که از خدمات اپلیکیشن استفاده می‌کند.</li>
            <li><strong>خدمات:</strong> شامل مدیریت رزرو، مشتریان، درآمد و سایر امکانات ارائه شده در اپلیکیشن.</li>
          </ul>

          <h2 className="font-bold">۲. شرایط استفاده</h2>
          <p>
            کاربر متعهد می‌شود که از اپلیکیشن برای اهداف قانونی و مطابق با قوانین جمهوری اسلامی ایران استفاده نماید. هرگونه استفاده غیرقانونی، از جمله ارسال اطلاعات نادرست یا نقض حریم خصوصی دیگران، ممنوع است.
          </p>

          <h2 className="font-bold">۳. حریم خصوصی</h2>
          <p>
            ما به حریم خصوصی شما احترام می‌گذاریم. اطلاعات شما نزد ما محفوظ است و تنها برای بهبود خدمات و ارتباط با شما استفاده خواهد شد. ما اطلاعات شما را بدون رضایت شما در اختیار شخص ثالث قرار نخواهیم داد، مگر به حکم قانون.
          </p>
          
          <h2 className="font-bold">۴. مسئولیت‌ها</h2>
          <p>
            مسئولیت صحت اطلاعات وارد شده توسط کاربر (مانند اطلاعات مشتریان، رزروها و...) بر عهده خود کاربر است. اپلیکیشن مسئولیتی در قبال خسارات ناشی از اطلاعات نادرست یا ناقص ندارد.
          </p>
          
          <h2 className="font-bold">۵. تغییرات در قوانین</h2>
          <p>
            اپلیکیشن این حق را برای خود محفوظ می‌دارد که در هر زمان قوانین و مقررات را تغییر دهد. نسخه به‌روز شده قوانین همیشه از طریق همین صفحه در دسترس خواهد بود و ادامه استفاده شما از اپلیکیشن به منزله پذیرش تغییرات است.
          </p>
        </div>
      </main>
    </div>
  );
};

export default TermsSubPage;
