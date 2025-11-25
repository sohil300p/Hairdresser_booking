

import React, { useState, useEffect, useRef } from 'react';
import { Search, ArrowRight, Paperclip, Send, LoaderCircle, MessageSquare } from 'lucide-react';

interface Chat {
    id: number;
    name: string;
    avatar: string;
    lastMessage: string;
    time: string;
    unread: number;
    online: boolean;
}

const chats: Chat[] = [
    { id: 1, name: 'علی احمدی', avatar: 'https://picsum.photos/id/1015/100/100', lastMessage: 'سلام، ساعت ۳ وقت دارید؟', time: '14:30', unread: 1, online: true },
    { id: 2, name: 'سارا نادری', avatar: 'https://picsum.photos/id/1012/100/100', lastMessage: 'ممنون از خدمات خوبتون', time: '11:05', unread: 0, online: false },
    { id: 3, name: 'حسن محمدی', avatar: 'https://picsum.photos/id/1006/100/100', lastMessage: 'اوکیه پس مزاحم میشم.', time: 'دیروز', unread: 0, online: true },
];

const ChatScreen: React.FC = () => {
    const [selectedChat, setSelectedChat] = useState<Chat | null>(null);

    if (selectedChat) {
        return <ChatDetail chat={selectedChat} onBack={() => setSelectedChat(null)} />;
    }

    return <ChatList onSelectChat={setSelectedChat} />;
};

const ChatList: React.FC<{ onSelectChat: (chat: Chat) => void }> = ({ onSelectChat }) => (
    <div className="flex flex-col h-full">
        <header className="sticky top-0 bg-surface-1 backdrop-blur-sm p-4 z-40 border-b border-gray-200">
            <h1 className="text-2xl font-bold mb-4">پیام‌ها</h1>
            <div className="relative">
                <input type="text" placeholder="جستجوی مشتری..." className="w-full h-12 p-3 pr-12 bg-surface-2 border border-surface-2 text-gray-900 rounded-lg focus:outline-none focus:border-primary-600 focus:ring-0 transition" />
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
            </div>
        </header>
        <main className="flex-grow p-4 space-y-2">
            {chats.length > 0 ? chats.map(chat => (
                <button key={chat.id} type="button" onClick={() => onSelectChat(chat)} className="w-full text-right flex items-center gap-3 p-3 bg-white rounded-lg cursor-pointer border shadow-xs hover:bg-gray-50 transition">
                    <div className="relative">
                        <img src={chat.avatar} alt={chat.name} className="w-14 h-14 rounded-full" />
                        {chat.online && <span className="absolute bottom-0 right-0 block w-3.5 h-3.5 bg-success-500 rounded-full ring-2 ring-white"></span>}
                    </div>
                    <div className="flex-grow">
                        <div className="flex justify-between items-center">
                            <p className="font-bold">{chat.name}</p>
                            <p className="text-xs text-gray-600">{chat.time}</p>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                            <p className="text-sm text-gray-700 truncate">{chat.lastMessage}</p>
                            {chat.unread > 0 && <span className="bg-primary-600 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">{chat.unread}</span>}
                        </div>
                    </div>
                </button>
            )) : (
                 <div className="text-center py-16 flex flex-col items-center">
                    <MessageSquare size={48} className="text-gray-300 mb-4" />
                    <p className="font-bold text-lg text-gray-700">هیچ پیامی یافت نشد</p>
                    <p className="text-gray-600 mt-1">هنوز هیچ گفتگویی برای نمایش وجود ندارد.</p>
                </div>
            )}
        </main>
    </div>
);


const ChatDetail: React.FC<{ chat: Chat; onBack: () => void }> = ({ chat, onBack }) => {
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView();
    }, []);
    
    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setMessage(e.target.value);
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            const scrollHeight = textarea.scrollHeight;
            const maxHeight = 96; 
            textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
        }
    };

    const handleSend = (textToSend: string) => {
        if (textToSend.trim() === '' || isSending) return;
        setIsSending(true);
        console.log("Sending:", textToSend);
        
        setTimeout(() => {
            setMessage('');
            setIsSending(false);
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
                textareaRef.current.focus();
            }
        }, 1000);
    };
    
    const handleQuickReply = (text: string) => {
        handleSend(text);
    };

    return (
        <div className="absolute inset-0 bg-surface-1 z-40 flex flex-col">
            <header 
                className="sticky top-0 flex-shrink-0 bg-white/80 backdrop-blur-sm p-3 z-40 flex items-center gap-3 border-b border-gray-200"
                style={{paddingTop: 'calc(0.75rem + env(safe-area-inset-top))'}}
            >
                <button type="button" onClick={onBack} aria-label="بازگشت" className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"><ArrowRight /></button>
                <img src={chat.avatar} alt={chat.name} className="w-10 h-10 rounded-full" />
                <div className="flex-grow">
                    <p className="font-bold text-gray-900">{chat.name}</p>
                    {chat.online && <p className="text-xs text-success-600">آنلاین</p>}
                </div>
            </header>

            <main className="flex-grow p-4 space-y-4 overflow-y-auto">
                <MessageBubble text="سلام، وقت بخیر" time="14:28" isSender={false} />
                <MessageBubble text="سلام، ساعت ۳ وقت دارید؟" time="14:30" isSender={false} />
                <MessageBubble text="سلام، بله مشکلی نیست." time="14:32" isSender={true} />
                <MessageBubble text="فقط ممکنه چند دقیقه دیرتر برسم." time="14:33" isSender={false} />
                <MessageBubble text="خواهش میکنم، منتظرتون هستم." time="14:35" isSender={true} />
                <MessageBubble text="ممنون از شما" time="14:36" isSender={false} />
                <div ref={messagesEndRef} />
            </main>

            <footer 
                className="flex-shrink-0 bg-white p-2 border-t border-gray-200 space-y-2"
                style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom))' }}
            >
                 <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
                    {['🙏 ممنون', '✓ تایید شد', '⏰ در راهم'].map(text => (
                        <button 
                            key={text}
                            type="button"
                            onClick={() => handleQuickReply(text)}
                            className="bg-gray-100 border rounded-full px-3 py-1.5 text-sm text-gray-800 whitespace-nowrap hover:bg-gray-200 transition"
                        >
                            {text}
                        </button>
                    ))}
                </div>
                <div className="flex items-end gap-2">
                    <div className="flex-grow bg-surface-2 border-b-2 border-gray-300 rounded-t-lg focus-within:border-primary-600 transition-all flex items-end">
                        <textarea 
                            ref={textareaRef}
                            rows={1}
                            value={message}
                            onChange={handleInputChange}
                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(message); } }}
                            placeholder="پیام خود را بنویسید..." 
                            className="flex-grow bg-transparent text-gray-900 outline-none resize-none overflow-y-auto max-h-24 leading-snug w-full p-3 hide-scrollbar"
                        />
                    </div>
                    <button 
                        type="button"
                        onClick={() => handleSend(message)}
                        disabled={message.trim() === '' || isSending}
                        className="bg-primary-600 text-white rounded-full w-11 h-11 flex-shrink-0 flex items-center justify-center transition-all duration-200 ease-in-out disabled:bg-gray-300 disabled:cursor-not-allowed disabled:scale-95 scale-100" 
                        aria-label="ارسال پیام"
                    >
                        {isSending ? <LoaderCircle size={20} className="animate-spin" /> : <Send size={20} />}
                    </button>
                </div>
            </footer>
        </div>
    );
};


const MessageBubble: React.FC<{ text: string; time: string; isSender: boolean }> = ({ text, time, isSender }) => (
    <div className={`flex items-end gap-2 ${isSender ? 'flex-row-reverse animate-slide-in-right' : 'flex-row animate-slide-in-left'}`}>
        <div className={`max-w-[70%] p-3 rounded-2xl ${isSender ? 'bg-primary-600 text-white rounded-br-lg' : 'bg-white text-gray-900 rounded-bl-lg shadow-sm border'}`}>
            <p className="leading-relaxed">{text}</p>
        </div>
        <span className="text-xs text-gray-600 pb-1 whitespace-nowrap">{time}</span>
    </div>
);

export default ChatScreen;