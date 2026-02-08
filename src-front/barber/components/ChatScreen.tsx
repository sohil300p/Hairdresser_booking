import React from 'react';
import { MessageSquare } from 'lucide-react';

const ChatScreen: React.FC = () => (
    <div className="flex flex-col h-full">
        <header className="sticky top-0 bg-surface-1 backdrop-blur-sm p-4 z-40 border-b border-gray-200">
            <h1 className="text-2xl font-bold">پیام‌ها</h1>
        </header>
        <main className="flex-grow flex flex-col items-center justify-center p-6 text-center">
            <MessageSquare size={56} className="text-gray-300 mb-4" />
            <p className="text-xl font-bold text-gray-800">گفت‌وگو با مشتریان به زودی در دسترس خواهد بود</p>
            <p className="text-gray-600 mt-2">قابلیت گفتگو با مشتریان به زودی اضافه می‌شود.</p>
        </main>
    </div>
);

export default ChatScreen;
