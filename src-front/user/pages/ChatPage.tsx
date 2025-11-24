import React, { useState, useRef, useEffect } from 'react';
import type { UserContextType } from '../types';
import { Icon } from '../../shared/components/Icon';
import { Button } from '../../shared/components/Button';

interface Message {
    id: number;
    text: string;
    sender: 'user' | 'barber';
    status?: 'sent' | 'pending';
}

const QUICK_REPLIES = [
    'سلام وقت بخیر. می‌خوام برای کراتینه وقت بگیرم.',
    'می‌تونم عکس مو بفرستم برای بررسی؟',
    'Hi — I want to book Keratin. Available slots this week?'
];

export const ChatPage: React.FC<{ context: UserContextType }> = ({ context }) => {
  const { selectedBarber: barber } = context;
  const [messages, setMessages] = useState<Message[]>([
    { id: 2, text: 'سلام، وقتتون بخیر. میخواستم در مورد سرویس کراتینه سوال بپرسم.', sender: 'user', status: 'sent' },
  ]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!barber) {
    return <div>آرایشگاه انتخاب نشده است.</div>;
  }

  const handleDeleteChat = () => {
    context.showModal(
      <div className="text-right p-2">
        <h3 className="text-xl font-bold mb-4 text-center">حذف گفتگو</h3>
        <p className="text-gray-600 mb-6 text-center">آیا از حذف این گفتگو مطمئن هستید؟ این عمل قابل بازگشت نیست.</p>
        <div className="flex gap-3 mt-4">
          <Button variant="secondary" onClick={context.hideModal}>انصراف</Button>
          <Button variant="danger" onClick={() => {
            context.hideModal();
            context.showToast('گفتگو با موفقیت حذف شد.', 'success');
            context.setCurrentPage('support-center'); // As per request
          }}>
            حذف
          </Button>
        </div>
      </div>,
      'bottom'
    );
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const pendingMessage: Message = { 
          id: Date.now(), 
          text: newMessage, 
          sender: 'user',
          status: 'pending',
      };
      setMessages([...messages, pendingMessage]);
      setNewMessage('');

      // Simulate sending message to backend
      setTimeout(() => {
          setMessages(prev => prev.map(m => m.id === pendingMessage.id ? { ...m, status: 'sent' } : m));
      }, 1000);
    }
  };
  
  const QuickReplyButton: React.FC<{text: string}> = ({text}) => (
      <button 
        onClick={() => setNewMessage(text)}
        className="text-sm border border-gray-300 rounded-full px-3 py-1.5 text-gray-700 bg-white hover:bg-gray-100"
       >
        {text}
      </button>
  );

  return (
    <div className="flex flex-col h-screen bg-gray-100" dir="rtl">
      <header className="sticky top-0 bg-white z-10 flex items-center p-3 shadow-md justify-between">
        <div className="flex items-center">
            <button onClick={() => context.setCurrentPage('barber', { barber })} className="ml-3">
            <Icon name="chevronRight" className="w-6 h-6 text-[#0B1730]" />
            </button>
            <img src={barber.avatarUrl} alt={barber.name} className="w-10 h-10 rounded-full object-cover" />
            <div className="mr-3 text-right">
                <h1 className="text-md font-bold text-[#0B1730]">{barber.name}</h1>
                <p className="text-xs text-green-500">آنلاین</p>
            </div>
        </div>
        <button onClick={handleDeleteChat} className="p-2 text-gray-500 hover:text-[var(--danger)]">
            <Icon name="trash" className="w-6 h-6"/>
        </button>
      </header>
      
      <div className="p-2 text-center bg-yellow-100 text-yellow-800 text-xs border-b border-yellow-200">
         پاسخ آرایشگر در این نسخه در دسترس نیست.
      </div>
      
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${msg.sender === 'user' ? 'bg-[var(--primary)] text-white rounded-br-lg' : 'bg-white text-gray-800 rounded-bl-lg'}`}>
              <p className="text-right whitespace-pre-wrap">{msg.text}</p>
              {msg.sender === 'user' && (
                <div className="text-xs text-white/70 text-left mt-1">
                    {msg.status === 'sent' ? 'ارسال شد' : 'در حال ارسال...'}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </main>

      <footer className="sticky bottom-0 bg-white p-2 border-t">
        <div className="p-2 flex flex-wrap gap-2 justify-end">
            {QUICK_REPLIES.map(text => <QuickReplyButton key={text} text={text} />)}
        </div>
        <div className="flex items-center p-2">
          <button className="p-2 text-gray-500 hover:text-[var(--primary)]">
              <Icon name="paperclip" className="w-6 h-6"/>
          </button>
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }}}
            placeholder="پیام خود را اینجا بنویسید…"
            className="flex-1 bg-gray-100 border-transparent focus:border-transparent focus:ring-0 rounded-lg px-4 py-2 resize-none h-[48px] max-h-28"
            rows={1}
            maxLength={1000}
          />
          <button onClick={handleSendMessage} className="mr-2 p-3 rounded-full bg-[#1666A9] text-white disabled:opacity-50 disabled:cursor-not-allowed transition-opacity" disabled={!newMessage.trim()}>
            <Icon name="paperAirplane" className="w-6 h-6" />
          </button>
        </div>
      </footer>
    </div>
  );
};