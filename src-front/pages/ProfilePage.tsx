import React, { useEffect, useState } from 'react';
import type { AppContextType } from '../types';
import { Icon, IconName } from '../components/Icon';
import { Button } from '../components/Button';
import { profileService } from '../src/services/profile.service';

interface ProfilePageProps {
  context: AppContextType;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ context }) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const result = await profileService.getProfile();
        if (result.success && result.data) {
          const profileData = result.data;
          context.updateUser({
            name: profileData.firstName && profileData.lastName
              ? `${profileData.firstName} ${profileData.lastName}`
              : profileData.firstName || profileData.lastName || profileData.phone,
            phone: profileData.phone,
            avatarUrl: profileData.profileImage || undefined,
          });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    if (context.user) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, []);
    
  const ProfileMenuItem: React.FC<{ icon: IconName; label: string; onClick: () => void; }> = ({ icon, label, onClick }) => (
    <button onClick={onClick} className="flex items-center justify-between w-full p-4 bg-white rounded-xl border border-gray-200 mb-3 text-right transition-transform transform active:scale-95 hover:bg-gray-50">
      <div className="flex items-center">
          <div className="p-2 bg-[var(--md-sys-color-primary-container)] rounded-md ml-4">
            <Icon name={icon} className="w-5 h-5 text-[var(--md-sys-color-primary)]" />
          </div>
          <span className="font-semibold text-gray-800">{label}</span>
      </div>
      <Icon name="chevronLeft" className="w-5 h-5 text-gray-400" />
    </button>
  );

  const handleLogout = () => {
    context.showModal(
      <div className="text-right p-2">
        <h3 className="text-xl font-bold mb-4 text-center">خروج از حساب</h3>
        <p className="text-gray-600 mb-6 text-center">آیا مطمئن هستید که می‌خواهید خارج شوید؟</p>
        <div className="flex gap-3 mt-4">
          <Button variant="secondary" onClick={context.hideModal}>انصراف</Button>
          <Button variant="danger" onClick={() => { context.hideModal(); context.logout(); }}>خروج</Button>
        </div>
      </div>,
      'bottom'
    );
  };

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center" dir="rtl">
        <div className="text-center">در حال بارگذاری...</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen" dir="rtl">
      <header className="sticky top-0 bg-gray-50 z-10 text-center py-4 mb-4">
        <div className="w-24 h-24 rounded-full bg-gray-300 mx-auto mb-4 flex items-center justify-center overflow-hidden">
            {context.user?.avatarUrl ? (
                <img src={context.user.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
            ) : (
                <Icon name="user" className="w-12 h-12 text-gray-500" />
            )}
        </div>
        <h1 className="text-2xl font-bold text-[var(--md-sys-color-on-surface)]">{context.user?.name}</h1>
        <p className="text-[var(--md-sys-color-on-surface-variant)] font-mono">{context.user?.phone}</p>
      </header>
      
      <div className="p-4 pt-0">
        <ProfileMenuItem icon="user" label="ویرایش پروفایل" onClick={() => context.setCurrentPage('edit-profile')} />
        <ProfileMenuItem icon="wallet" label="کیف پول" onClick={() => context.setCurrentPage('wallet')} />
        <ProfileMenuItem icon="save" label="ذخیره شده‌ها" onClick={() => context.setCurrentPage('favorites')} />
        <ProfileMenuItem icon="tag" label="تخفیف‌های من" onClick={() => context.setCurrentPage('discounts')} />
        <ProfileMenuItem icon="creditCard" label="تاریخچه پرداخت‌ها" onClick={() => context.setCurrentPage('payment-history')} />
        <ProfileMenuItem icon="lifeBuoy" label="پشتیبانی" onClick={() => context.setCurrentPage('support-center')} />
      
        <div className="mt-8">
           <Button variant="danger-ghost" onClick={handleLogout}>
              خروج از حساب
          </Button>
        </div>
      </div>
    </div>
  );
};
