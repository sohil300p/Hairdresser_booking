
import React, { useState } from 'react';
import { 
    ArrowRight, Gift, Settings, Users, Plus, 
    TrendingUp, Award, Zap, Search, ChevronLeft, 
    MoreVertical, Check, X, History, Edit3, Trash2,
    Save, Crown, Coins
} from 'lucide-react';
import type { Screen } from '../App';
import BottomSheet from './BottomSheet';
import MaterialInput from './MaterialInput';
import MaterialSelect from './MaterialSelect';
import ConfirmationDialog from './ConfirmationDialog';

// --- Types & Mock Data ---

type Tab = 'overview' | 'rewards' | 'members' | 'settings';
type RewardType = 'discount' | 'free_service' | 'cashback';

interface Reward {
    id: number;
    title: string;
    cost: number;
    type: RewardType;
    isActive: boolean;
    description: string;
}

interface Member {
    id: number;
    name: string;
    phone: string;
    avatar: string;
    points: number;
    tier: 'bronze' | 'silver' | 'gold';
    joinedDate: string;
}

interface PointTransaction {
    id: number;
    type: 'earn' | 'redeem' | 'manual';
    amount: number;
    description: string;
    date: string;
}

const initialRewards: Reward[] = [
    { id: 1, title: '۲۰٪ تخفیف اصلاح سر', cost: 1000, type: 'discount', isActive: true, description: 'قابل استفاده برای تمام خدمات اصلاح' },
    { id: 2, title: 'سشوار رایگان', cost: 500, type: 'free_service', isActive: true, description: 'فقط همراه با خدمات دیگر' },
    { id: 3, title: '۵۰ هزار تومان اعتبار', cost: 2000, type: 'cashback', isActive: false, description: 'شارژ کیف پول' },
];

const initialMembers: Member[] = [
    { id: 1, name: 'احمد رضایی', phone: '09123456789', avatar: 'https://picsum.photos/id/1005/100/100', points: 2450, tier: 'gold', joinedDate: '1402/01/10' },
    { id: 2, name: 'حسن محمدی', phone: '09121112233', avatar: 'https://picsum.photos/id/1006/100/100', points: 850, tier: 'bronze', joinedDate: '1402/05/20' },
    { id: 3, name: 'علی اکبری', phone: '09355554433', avatar: 'https://picsum.photos/id/1008/100/100', points: 1600, tier: 'silver', joinedDate: '1402/03/15' },
];

const mockHistory: PointTransaction[] = [
    { id: 1, type: 'earn', amount: 150, description: 'خدمات اصلاح مو', date: '1403/05/10' },
    { id: 2, type: 'redeem', amount: -500, description: 'دریافت سشوار رایگان', date: '1403/05/01' },
    { id: 3, type: 'manual', amount: 50, description: 'هدیه تولد', date: '1403/04/20' },
];

// --- Components ---

const CustomerClubScreen: React.FC<{ setActiveScreen: (screen: Screen) => void }> = ({ setActiveScreen }) => {
    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const [rewards, setRewards] = useState<Reward[]>(initialRewards);
    const [members, setMembers] = useState<Member[]>(initialMembers);
    
    // Sheet States
    const [isRewardSheetOpen, setRewardSheetOpen] = useState(false);
    const [editingReward, setEditingReward] = useState<Reward | null>(null);
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);
    const [isManualPointSheetOpen, setManualPointSheetOpen] = useState(false);
    
    // Settings State
    const [settings, setSettings] = useState({
        pointsPerAmount: '10000', // Toman per 1 point
        joiningBonus: '50',
        referralBonus: '100',
        silverThreshold: '1000',
        goldThreshold: '2000'
    });

    // Handlers
    const handleSaveReward = (reward: Reward) => {
        if (editingReward) {
            setRewards(rewards.map(r => r.id === reward.id ? reward : r));
            window.showToast('جایزه با موفقیت ویرایش شد.', 'success');
        } else {
            setRewards([...rewards, { ...reward, id: Date.now() }]);
            window.showToast('جایزه جدید ایجاد شد.', 'success');
        }
        setRewardSheetOpen(false);
        setEditingReward(null);
    };

    const handleDeleteReward = (id: number) => {
        setRewards(rewards.filter(r => r.id !== id));
        window.showToast('جایزه حذف شد.', 'info');
    };

    const handleToggleReward = (id: number) => {
        setRewards(rewards.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r));
    };

    const handleManualPointSubmit = (amount: number, reason: string) => {
        if (!selectedMember) return;
        // In a real app, API call here
        const updatedMember = { ...selectedMember, points: selectedMember.points + amount };
        setMembers(members.map(m => m.id === selectedMember.id ? updatedMember : m));
        window.showToast(`مبلغ ${amount} امتیاز برای ${selectedMember.name} ثبت شد.`, 'success');
        setManualPointSheetOpen(false);
    };

    return (
        <div className="flex flex-col h-full bg-surface-1">
            {/* Header */}
            <header className="sticky top-0 bg-white/80 backdrop-blur-md z-30 border-b border-gray-200">
                <div className="flex items-center gap-4 p-4">
                    <button onClick={() => setActiveScreen('profile')} className="p-2 rounded-full hover:bg-gray-100 transition text-gray-600">
                        <ArrowRight size={24} />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">باشگاه مشتریان</h1>
                        <p className="text-xs text-gray-500">مدیریت وفاداری و جوایز</p>
                    </div>
                </div>
                
                {/* Tabs */}
                <div className="flex px-4 gap-6 overflow-x-auto hide-scrollbar">
                    <TabButton id="overview" label="نمای کلی" icon={TrendingUp} active={activeTab} onClick={setActiveTab} />
                    <TabButton id="rewards" label="جوایز" icon={Gift} active={activeTab} onClick={setActiveTab} />
                    <TabButton id="members" label="اعضا" icon={Users} active={activeTab} onClick={setActiveTab} />
                    <TabButton id="settings" label="تنظیمات" icon={Settings} active={activeTab} onClick={setActiveTab} />
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-grow overflow-y-auto p-4 pb-24 space-y-6">
                {activeTab === 'overview' && <OverviewTab members={members} rewards={rewards} onChangeTab={setActiveTab} />}
                {activeTab === 'rewards' && (
                    <RewardsTab 
                        rewards={rewards} 
                        onEdit={(r) => { setEditingReward(r); setRewardSheetOpen(true); }} 
                        onDelete={handleDeleteReward}
                        onToggle={handleToggleReward}
                        onAdd={() => { setEditingReward(null); setRewardSheetOpen(true); }}
                    />
                )}
                {activeTab === 'members' && (
                    <MembersTab 
                        members={members} 
                        onSelect={(m) => { setSelectedMember(m); }} 
                    />
                )}
                {activeTab === 'settings' && (
                    <SettingsTab settings={settings} onUpdate={setSettings} />
                )}
            </main>

            {/* Sheets */}
            <BottomSheet 
                isOpen={isRewardSheetOpen} 
                onClose={() => { setRewardSheetOpen(false); setEditingReward(null); }} 
                title={editingReward ? 'ویرایش جایزه' : 'تعریف جایزه جدید'}
            >
                <RewardForm 
                    initialData={editingReward} 
                    onSave={handleSaveReward} 
                    onCancel={() => { setRewardSheetOpen(false); setEditingReward(null); }} 
                />
            </BottomSheet>

            <BottomSheet
                isOpen={!!selectedMember}
                onClose={() => setSelectedMember(null)}
                title="جزئیات عضویت"
            >
                {selectedMember && (
                    <MemberDetailView 
                        member={selectedMember} 
                        history={mockHistory}
                        onAddPoints={() => setManualPointSheetOpen(true)}
                    />
                )}
            </BottomSheet>

            <BottomSheet
                isOpen={isManualPointSheetOpen}
                onClose={() => setManualPointSheetOpen(false)}
                title="اعطای امتیاز دستی"
            >
                <ManualPointForm 
                    member={selectedMember} 
                    onSubmit={handleManualPointSubmit} 
                    onCancel={() => setManualPointSheetOpen(false)}
                />
            </BottomSheet>
        </div>
    );
};

// --- Tab Components ---

const OverviewTab: React.FC<{ members: Member[], rewards: Reward[], onChangeTab: (t: Tab) => void }> = ({ members, rewards, onChangeTab }) => {
    const totalPoints = members.reduce((acc, m) => acc + m.points, 0);
    
    return (
        <div className="space-y-6 animate-fade-in">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
                <StatCard title="کل اعضا" value={members.length} subtext="نفر" icon={Users} color="bg-blue-100 text-blue-700" />
                <StatCard title="امتیازات توزیع شده" value={totalPoints.toLocaleString()} subtext="امتیاز" icon={Coins} color="bg-yellow-100 text-yellow-700" />
                <StatCard title="جوایز فعال" value={rewards.filter(r => r.isActive).length} subtext="عدد" icon={Gift} color="bg-purple-100 text-purple-700" />
                <StatCard title="نرخ بازگشت" value="68%" subtext="ماه اخیر" icon={TrendingUp} color="bg-green-100 text-green-700" />
            </div>

            {/* Quick Actions */}
            <div>
                <h3 className="text-lg font-bold text-gray-800 mb-3">دسترسی سریع</h3>
                <div className="flex gap-4 overflow-x-auto pb-2 hide-scrollbar">
                    <QuickAction 
                        icon={Plus} 
                        label="جایزه جدید" 
                        onClick={() => onChangeTab('rewards')} 
                        color="bg-primary-600 text-white" 
                    />
                    <QuickAction 
                        icon={Zap} 
                        label="امتیاز دستی" 
                        onClick={() => onChangeTab('members')} 
                        color="bg-orange-500 text-white" 
                    />
                    <QuickAction 
                        icon={Settings} 
                        label="تنظیمات" 
                        onClick={() => onChangeTab('settings')} 
                        color="bg-gray-600 text-white" 
                    />
                </div>
            </div>

            {/* Top Customers */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-800">مشتریان وفادار برتر</h3>
                    <button onClick={() => onChangeTab('members')} className="text-sm text-primary-600 font-semibold">مشاهده همه</button>
                </div>
                <div className="space-y-4">
                    {members.sort((a, b) => b.points - a.points).slice(0, 3).map((member, index) => (
                        <div key={member.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <img src={member.avatar} alt={member.name} className="w-10 h-10 rounded-full" />
                                    {index === 0 && <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-0.5"><Crown size={10} className="text-white" /></div>}
                                </div>
                                <div>
                                    <p className="font-semibold text-sm">{member.name}</p>
                                    <p className="text-xs text-gray-500">{member.tier === 'gold' ? 'سطح طلایی' : member.tier === 'silver' ? 'سطح نقره‌ای' : 'سطح برنزی'}</p>
                                </div>
                            </div>
                            <div className="text-left">
                                <p className="font-bold text-sm text-gray-900">{member.points}</p>
                                <p className="text-[10px] text-gray-500">امتیاز</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const RewardsTab: React.FC<{ 
    rewards: Reward[], 
    onEdit: (r: Reward) => void, 
    onDelete: (id: number) => void, 
    onToggle: (id: number) => void,
    onAdd: () => void
}> = ({ rewards, onEdit, onDelete, onToggle, onAdd }) => {
    return (
        <div className="space-y-4 animate-slide-up">
            <button 
                onClick={onAdd}
                className="w-full h-12 border-2 border-dashed border-primary-300 bg-primary-50 text-primary-700 rounded-xl flex items-center justify-center gap-2 font-bold hover:bg-primary-100 transition"
            >
                <Plus size={20} />
                تعریف جایزه جدید
            </button>

            {rewards.map(reward => (
                <div key={reward.id} className={`bg-white p-4 rounded-xl border shadow-sm transition-all ${!reward.isActive ? 'opacity-70 grayscale-[0.5]' : ''}`}>
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${reward.type === 'discount' ? 'bg-red-100 text-red-600' : reward.type === 'free_service' ? 'bg-purple-100 text-purple-600' : 'bg-green-100 text-green-600'}`}>
                                {reward.type === 'discount' ? <Award size={20} /> : reward.type === 'free_service' ? <Gift size={20} /> : <Coins size={20} />}
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900">{reward.title}</h4>
                                <p className="text-xs text-gray-500">{reward.cost} امتیاز</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                             <button onClick={() => onToggle(reward.id)} className={`w-8 h-5 rounded-full relative transition-colors ${reward.isActive ? 'bg-primary-600' : 'bg-gray-300'}`}>
                                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-transform ${reward.isActive ? 'left-1' : 'right-1'}`}></div>
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); /* Open menu */ }} className="p-1 text-gray-400">
                                <MoreVertical size={18} />
                            </button>
                        </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-3 bg-gray-50 p-2 rounded-md">{reward.description}</p>
                    <div className="flex gap-2 pt-2 border-t border-gray-100">
                        <button onClick={() => onEdit(reward)} className="flex-1 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md flex items-center justify-center gap-1">
                            <Edit3 size={16} /> ویرایش
                        </button>
                        <button onClick={() => onDelete(reward.id)} className="flex-1 py-1.5 text-sm font-medium text-error-600 hover:bg-error-50 rounded-md flex items-center justify-center gap-1">
                            <Trash2 size={16} /> حذف
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

const MembersTab: React.FC<{ members: Member[], onSelect: (m: Member) => void }> = ({ members, onSelect }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const filteredMembers = members.filter(m => m.name.includes(searchTerm) || m.phone.includes(searchTerm));

    return (
        <div className="space-y-4 animate-slide-up">
            <div className="relative">
                <input 
                    type="text" 
                    placeholder="جستجوی عضو..." 
                    className="w-full h-12 bg-white border border-gray-200 rounded-xl pr-10 pl-4 focus:outline-none focus:border-primary-500 transition"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            </div>

            <div className="space-y-2">
                {filteredMembers.map(member => (
                    <div key={member.id} onClick={() => onSelect(member)} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between cursor-pointer hover:border-primary-200 transition">
                        <div className="flex items-center gap-3">
                            <img src={member.avatar} alt={member.name} className="w-12 h-12 rounded-full" />
                            <div>
                                <div className="flex items-center gap-2">
                                    <p className="font-bold text-gray-900">{member.name}</p>
                                    <span className={`px-1.5 py-0.5 text-[10px] rounded-full font-bold ${member.tier === 'gold' ? 'bg-yellow-100 text-yellow-700' : member.tier === 'silver' ? 'bg-gray-100 text-gray-700' : 'bg-orange-100 text-orange-700'}`}>
                                        {member.tier === 'gold' ? 'طلایی' : member.tier === 'silver' ? 'نقره‌ای' : 'برنزی'}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500" dir="ltr">{member.phone}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                             <div className="text-left">
                                <p className="font-bold text-primary-700">{member.points}</p>
                                <p className="text-[10px] text-gray-400">امتیاز</p>
                            </div>
                            <ChevronLeft size={18} className="text-gray-400" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const SettingsTab: React.FC<{ settings: any, onUpdate: (s: any) => void }> = ({ settings, onUpdate }) => {
    const handleChange = (key: string, value: string) => {
        onUpdate({ ...settings, [key]: value });
    };

    return (
        <div className="space-y-6 animate-slide-up pb-10">
            <div className="bg-white p-4 rounded-xl border shadow-sm space-y-4">
                <h3 className="font-bold text-gray-800 border-b pb-2">قوانین امتیازدهی</h3>
                <MaterialInput 
                    id="pointsPerAmount" 
                    label="مبلغ خرید به ازای ۱ امتیاز (تومان)" 
                    value={settings.pointsPerAmount} 
                    onChange={e => handleChange('pointsPerAmount', e.target.value)} 
                    type="number"
                />
                <div className="grid grid-cols-2 gap-4">
                    <MaterialInput id="joiningBonus" label="پاداش عضویت" value={settings.joiningBonus} onChange={e => handleChange('joiningBonus', e.target.value)} type="number" />
                    <MaterialInput id="referralBonus" label="پاداش معرفی" value={settings.referralBonus} onChange={e => handleChange('referralBonus', e.target.value)} type="number" />
                </div>
            </div>

            <div className="bg-white p-4 rounded-xl border shadow-sm space-y-4">
                <h3 className="font-bold text-gray-800 border-b pb-2">سطوح وفاداری</h3>
                <p className="text-xs text-gray-500">حداقل امتیاز لازم برای ارتقای سطح مشتری</p>
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 font-bold text-gray-600">S</div>
                        <MaterialInput id="silverThreshold" label="شروع سطح نقره‌ای" value={settings.silverThreshold} onChange={e => handleChange('silverThreshold', e.target.value)} type="number" />
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0 font-bold text-yellow-600">G</div>
                        <MaterialInput id="goldThreshold" label="شروع سطح طلایی" value={settings.goldThreshold} onChange={e => handleChange('goldThreshold', e.target.value)} type="number" />
                    </div>
                </div>
            </div>
            
            <button onClick={() => window.showToast('تنظیمات ذخیره شد', 'success')} className="w-full h-12 bg-primary-600 text-white font-bold rounded-xl shadow-lg hover:bg-primary-700 transition">
                ذخیره تغییرات
            </button>
        </div>
    );
};

// --- Sub Components & Forms ---

const TabButton: React.FC<{ id: Tab, label: string, icon: React.ElementType, active: Tab, onClick: (t: Tab) => void }> = ({ id, label, icon: Icon, active, onClick }) => (
    <button 
        onClick={() => onClick(id)}
        className={`flex flex-col items-center gap-1 min-w-[60px] transition-colors pb-2 border-b-2 ${active === id ? 'text-primary-600 border-primary-600' : 'text-gray-500 border-transparent hover:text-gray-700'}`}
    >
        <Icon size={24} strokeWidth={active === id ? 2.5 : 2} />
        <span className="text-xs font-medium whitespace-nowrap">{label}</span>
    </button>
);

const StatCard: React.FC<{ title: string, value: string | number, subtext: string, icon: React.ElementType, color: string }> = ({ title, value, subtext, icon: Icon, color }) => (
    <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between h-28">
        <div className="flex justify-between items-start">
            <span className="text-xs text-gray-500 font-medium">{title}</span>
            <div className={`p-1.5 rounded-lg ${color} bg-opacity-20`}>
                <Icon size={16} />
            </div>
        </div>
        <div>
            <span className="text-2xl font-bold text-gray-900">{value}</span>
            <span className="text-xs text-gray-400 mr-1">{subtext}</span>
        </div>
    </div>
);

const QuickAction: React.FC<{ icon: React.ElementType, label: string, onClick: () => void, color: string }> = ({ icon: Icon, label, onClick, color }) => (
    <button onClick={onClick} className="flex flex-col items-center gap-2 group">
        <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-md transition-transform group-hover:scale-105 ${color}`}>
            <Icon size={24} />
        </div>
        <span className="text-xs font-medium text-gray-700">{label}</span>
    </button>
);

const RewardForm: React.FC<{ initialData: Reward | null, onSave: (r: Reward) => void, onCancel: () => void }> = ({ initialData, onSave, onCancel }) => {
    const [formData, setFormData] = useState<Partial<Reward>>(initialData || { title: '', cost: 0, type: 'discount', description: '', isActive: true });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.cost) return;
        onSave(formData as Reward);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <MaterialInput 
                id="rewardTitle" 
                label="عنوان جایزه" 
                value={formData.title} 
                onChange={e => setFormData({...formData, title: e.target.value})} 
                required 
            />
            <div className="grid grid-cols-2 gap-4">
                <MaterialInput 
                    id="rewardCost" 
                    label="هزینه (امتیاز)" 
                    type="number"
                    value={formData.cost} 
                    onChange={e => setFormData({...formData, cost: parseInt(e.target.value)})} 
                    required 
                />
                <MaterialSelect 
                    id="rewardType" 
                    label="نوع پاداش" 
                    value={formData.type} 
                    onChange={e => setFormData({...formData, type: e.target.value as RewardType})}
                >
                    <option value="discount">تخفیف درصدی</option>
                    <option value="free_service">خدمت رایگان</option>
                    <option value="cashback">اعتبار کیف پول</option>
                </MaterialSelect>
            </div>
            <MaterialInput 
                id="rewardDesc" 
                label="توضیحات" 
                multiline
                value={formData.description} 
                onChange={e => setFormData({...formData, description: e.target.value})} 
            />
            <div className="flex gap-3 pt-4">
                <button type="button" onClick={onCancel} className="flex-1 h-12 bg-gray-100 text-gray-800 font-bold rounded-xl">لغو</button>
                <button type="submit" className="flex-1 h-12 bg-primary-600 text-white font-bold rounded-xl shadow-lg">ذخیره</button>
            </div>
        </form>
    );
};

const MemberDetailView: React.FC<{ member: Member, history: PointTransaction[], onAddPoints: () => void }> = ({ member, history, onAddPoints }) => (
    <div className="space-y-6">
        {/* Header Card */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-xl p-5 text-white shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
            <div className="relative z-10 flex items-center gap-4">
                <img src={member.avatar} alt={member.name} className="w-16 h-16 rounded-full border-2 border-white/30" />
                <div>
                    <h3 className="text-xl font-bold">{member.name}</h3>
                    <div className="flex items-center gap-2 mt-1 opacity-90">
                        <span className="text-sm">{member.tier === 'gold' ? 'عضو طلایی' : member.tier === 'silver' ? 'عضو نقره‌ای' : 'عضو برنزی'}</span>
                        <span>•</span>
                        <span className="text-sm" dir="ltr">{member.phone}</span>
                    </div>
                </div>
            </div>
            <div className="mt-6 flex justify-between items-end">
                <div>
                    <p className="text-xs opacity-80 mb-1">مجموع امتیازات</p>
                    <p className="text-3xl font-bold">{member.points.toLocaleString()}</p>
                </div>
                <button onClick={onAddPoints} className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 px-4 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2">
                    <Plus size={16} /> مدیریت امتیاز
                </button>
            </div>
        </div>

        {/* History */}
        <div>
            <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <History size={18} /> تاریخچه فعالیت
            </h4>
            <div className="space-y-3 max-h-60 overflow-y-auto">
                {history.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${item.type === 'earn' || item.type === 'manual' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                {item.type === 'redeem' ? <Award size={16} /> : <TrendingUp size={16} />}
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900">{item.description}</p>
                                <p className="text-xs text-gray-500">{item.date}</p>
                            </div>
                        </div>
                        <span className={`font-bold ${item.type === 'redeem' ? 'text-red-600' : 'text-green-600'}`}>
                            {item.type === 'redeem' ? '-' : '+'}{item.amount}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

const ManualPointForm: React.FC<{ member: Member | null, onSubmit: (amount: number, reason: string) => void, onCancel: () => void }> = ({ member, onSubmit, onCancel }) => {
    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('');
    const [type, setType] = useState<'add' | 'deduct'>('add');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalAmount = type === 'add' ? parseInt(amount) : -parseInt(amount);
        onSubmit(finalAmount, reason);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-3 bg-blue-50 text-blue-800 rounded-lg text-sm mb-4">
                در حال ثبت امتیاز برای <strong>{member?.name}</strong>
            </div>
            
            <div className="flex bg-gray-100 p-1 rounded-lg mb-4">
                <button type="button" onClick={() => setType('add')} className={`flex-1 py-2 rounded-md text-sm font-bold transition ${type === 'add' ? 'bg-white shadow-sm text-green-600' : 'text-gray-600'}`}>
                    افزایش امتیاز (+)
                </button>
                <button type="button" onClick={() => setType('deduct')} className={`flex-1 py-2 rounded-md text-sm font-bold transition ${type === 'deduct' ? 'bg-white shadow-sm text-red-600' : 'text-gray-600'}`}>
                    کسر امتیاز (-)
                </button>
            </div>

            <MaterialInput 
                id="manualAmount" 
                label="مقدار امتیاز" 
                type="number" 
                value={amount} 
                onChange={e => setAmount(e.target.value)} 
                required 
            />
            <MaterialInput 
                id="manualReason" 
                label="بابت (توضیحات)" 
                value={reason} 
                onChange={e => setReason(e.target.value)} 
                required 
            />

            <div className="flex gap-3 pt-4">
                <button type="button" onClick={onCancel} className="flex-1 h-12 bg-gray-100 text-gray-800 font-bold rounded-xl">لغو</button>
                <button type="submit" className={`flex-1 h-12 text-white font-bold rounded-xl shadow-lg ${type === 'add' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
                    {type === 'add' ? 'افزودن' : 'کسر کردن'}
                </button>
            </div>
        </form>
    )
}

export default CustomerClubScreen;
