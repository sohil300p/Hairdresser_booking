import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff } from 'lucide-react';
// Import the shared Screen type from App.tsx instead of redefining it locally.
import type { Screen } from '../App';

// Fix: Add necessary type definitions for the Web Speech API to resolve 'Cannot find name' errors.
// These types are not always included in default TypeScript DOM library versions.
interface SpeechRecognitionErrorEvent extends Event {
    readonly error: string;
    readonly message: string;
}

interface SpeechRecognitionAlternative {
    readonly transcript: string;
    readonly confidence: number;
}

interface SpeechRecognitionResult {
    readonly isFinal: boolean;
    readonly[index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList {
    readonly length: number;
    item(index: number): SpeechRecognitionResult;
    readonly[index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
    readonly resultIndex: number;
    readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    lang: string;
    interimResults: boolean;
    maxAlternatives: number;
    start(): void;
    stop(): void;
    onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
    onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
    onend: ((this: SpeechRecognition, ev: Event) => any) | null;
}

// Fix: The original type annotation 'typeof SpeechRecognition' created a circular reference.
// This correctly defines SpeechRecognition and webkitSpeechRecognition as constructors that return a SpeechRecognition instance.
declare global {
    interface Window {
        SpeechRecognition: new () => SpeechRecognition;
        webkitSpeechRecognition: new () => SpeechRecognition;
    }
}

// The Screen type is now imported from App.tsx above.

interface VoiceControlProps {
    setActiveScreen: (screen: Screen) => void;
}

const commandToScreen: { [key: string]: Screen } = {
    'خانه': 'home',
    'رزرو': 'reservations',
    'رزروها': 'reservations',
    'مشتری': 'customers',
    'مشتریان': 'customers',
    'پروفایل': 'profile',
    'چت': 'chat',
    'پیام': 'chat',
    'پیام ها': 'chat',
};

// Fix: Renamed constant to avoid shadowing the global 'SpeechRecognition' interface type.
const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
const isSpeechRecognitionSupported = !!SpeechRecognitionAPI;

const VoiceControl: React.FC<VoiceControlProps> = ({ setActiveScreen }) => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    // Fix: 'SpeechRecognition' now correctly refers to the instance interface type.
    const recognitionRef = useRef<SpeechRecognition | null>(null);

    useEffect(() => {
        if (!isSpeechRecognitionSupported) {
            console.warn("Speech recognition not supported by this browser.");
            return;
        }

        const recognition = new SpeechRecognitionAPI();
        recognition.continuous = false;
        recognition.lang = 'fa-IR';
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;
        recognitionRef.current = recognition;

        recognition.onresult = (event) => {
            const currentTranscript = event.results[event.resultIndex][0].transcript.trim();
            setTranscript(currentTranscript);
            
            if (event.results[event.resultIndex].isFinal) {
                console.log('Voice command received:', currentTranscript);
                
                for (const command in commandToScreen) {
                    if (currentTranscript.includes(command)) {
                        const screen = commandToScreen[command];
                        setActiveScreen(screen);
                        break;
                    }
                }
                 setTimeout(() => toggleListening(), 1000); // Stop listening after command
            }
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
             if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                 alert('برای استفاده از دستیار صوتی، باید به میکروفون دسترسی بدهید.');
            }
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
            setTranscript('');
        };

        return () => {
            if(recognitionRef.current) {
                recognitionRef.current.onresult = null;
                recognitionRef.current.onerror = null;
                recognitionRef.current.onend = null;
                recognitionRef.current.stop();
            }
        };
    }, [setActiveScreen]);

    const toggleListening = () => {
        if (!recognitionRef.current) return;

        if (isListening) {
            recognitionRef.current.stop();
        } else {
            try {
                recognitionRef.current.start();
                setIsListening(true);
            } catch(e) {
                console.error("Could not start recognition:", e);
                setIsListening(false);
            }
        }
    };
    
    if (!isSpeechRecognitionSupported) {
        return null;
    }

    if (isListening) {
        return (
            <div
                className="fixed inset-0 bg-surface-1/90 backdrop-blur-md z-[100] flex flex-col items-center justify-center p-8 text-center"
                onClick={toggleListening}
            >
                <div className="w-24 h-24 bg-primary-600/90 rounded-full flex items-center justify-center animate-pulse mb-6 shadow-lg">
                    <Mic size={48} className="text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">در حال شنیدن...</h2>
                <p className="text-gray-700 min-h-[2rem]">{transcript || 'دستور خود را بگویید'}</p>
                <div className="mt-8 text-gray-600 text-sm space-y-2">
                    <p>مثال:</p>
                    <p>"برو به صفحه پروفایل"</p>
                    <p>"رزروها رو نشون بده"</p>
                </div>
            </div>
        );
    }

    return (
        <div
            className="fixed bottom-24 left-6 z-50"
            style={{ bottom: 'calc(6rem + env(safe-area-inset-bottom))' }}
        >
            <button
                onClick={toggleListening}
                className={`w-16 h-16 rounded-full flex items-center justify-center shadow-xl transition-transform duration-300 ease-in-out hover:scale-110 bg-primary-600 text-white`}
                aria-label={"فعال‌سازی دستیار صوتی"}
            >
                <Mic size={28} />
            </button>
        </div>
    );
};

export default VoiceControl;