import React, { useRef } from 'react';
import { cn } from '../../lib/utils';
import { Mic, Camera, Send, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '../../context/AppContext';

// --- Types ---
export interface Transaction {
  amount: number;
  category: string;
  is_expense: boolean;
  date: string;
  currency: string;
  type?: 'need' | 'want' | 'income'; 
}

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  metadata?: {
    transaction?: Transaction;
    sentiment?: 'neutral' | 'sarcastic' | 'praise' | 'warning';
    image?: string;
  };
}

// --- Components ---

export const ChatBubble = ({ message }: { message: Message }) => {
  const isAi = message.sender === 'ai';
  const { formatPrice, theme } = useApp();
  const isLight = theme === 'light';
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={cn(
        "flex w-full mb-4",
        isAi ? "justify-start" : "justify-end"
      )}
    >
      <div className={cn(
        "max-w-[85%] rounded-2xl p-4 text-sm relative overflow-hidden",
        isAi 
          ? isLight 
            ? "bg-white border border-gray-200 shadow-sm rounded-tl-none text-gray-800 border-l-2 border-l-purple-400" 
            : "bg-glass-card rounded-tl-none text-gray-200 border-l-2 border-neon-purple/50"
          : isLight
            ? "bg-green-50 text-gray-800 rounded-tr-none border border-green-200"
            : "bg-neon-green/10 text-white rounded-tr-none border border-neon-green/20"
      )}>
        {/* Decorative flair for AI messages */}
        {isAi && !isLight && (
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-neon-purple via-neon-blue to-transparent opacity-50" />
        )}

        <p className="leading-relaxed whitespace-pre-wrap relative z-10">{message.text}</p>
        
        {/* Image Attachment */}
        {message.metadata?.image && (
          <div className="mt-2 mb-1">
            <img src={message.metadata.image} alt="Attachment" className={cn(
              "rounded-lg max-h-48 object-cover border",
              isLight ? "border-gray-200" : "border-white/10"
            )} />
          </div>
        )}
        
        {/* Transaction Metadata Badge */}
        {message.metadata?.transaction && (
           <div className={cn(
             "mt-2 inline-flex items-center gap-2 px-2 py-1 rounded-md text-xs font-mono",
             isLight 
               ? "bg-gray-100 border border-gray-200 text-gray-600"
               : "bg-black/30 border border-white/5 text-neon-green"
           )}>
             <span>{message.metadata.transaction.category || 'Dépense'}</span>
             <span className="font-bold">-{formatPrice(message.metadata.transaction.amount)}</span>
           </div>
        )}

        <span className={cn(
          "text-[10px] block mt-2 text-right",
          isLight ? "text-gray-400" : "text-white/20"
        )}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </motion.div>
  );
};

export interface ChatInputProps {
  onSend: (text: string, imageBase64?: string) => void;
  isLoading?: boolean;
}

export const ChatInput = ({ onSend, isLoading }: ChatInputProps) => {
  const [input, setInput] = React.useState('');
  const [isListening, setIsListening] = React.useState(false);
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  const { theme } = useApp();
  const isLight = theme === 'light';
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Voice Recognition Logic
  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    // @ts-ignore - Web Speech API
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Ton navigateur ne supporte pas la reconnaissance vocale. Désolé reuf.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'fr-FR';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setIsListening(true);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(prev => prev + (prev ? ' ' : '') + transcript);
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech error", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  // Image Logic
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((input.trim() || imagePreview) && !isLoading) {
      onSend(input, imagePreview || undefined);
      setInput('');
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const autoResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const target = e.target;
    target.style.height = 'auto';
    target.style.height = `${target.scrollHeight}px`;
    setInput(target.value);
  };

  return (
    <div className={cn(
      "p-4 pb-24 w-full z-40",
      isLight 
        ? "bg-gradient-to-t from-[#faf9f7] via-[#faf9f7] to-transparent" 
        : "bg-gradient-to-t from-background via-background to-transparent"
    )}>
      
      {/* Image Preview */}
      {imagePreview && (
        <div className="mb-4 relative inline-block">
          <img src={imagePreview} alt="Preview" className={cn(
            "h-20 w-20 object-cover rounded-xl border",
            isLight ? "border-green-300" : "border-neon-green/30"
          )} />
          <button 
            onClick={removeImage}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:scale-110 transition-transform"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex gap-4 mb-3 justify-center">
         <button 
           onClick={toggleListening}
           className={cn(
             "flex items-center justify-center w-12 h-12 rounded-full active:scale-95 transition-all group relative",
             isLight 
               ? "bg-white border border-gray-200 shadow-sm text-blue-600 hover:bg-blue-50"
               : "glass-card hover:bg-white/10 text-neon-blue",
             isListening && (isLight ? "bg-blue-100 animate-pulse" : "animate-pulse bg-neon-blue/20")
           )}
         >
            <Mic size={20} className={!isLight ? "group-hover:drop-shadow-[0_0_8px_rgba(0,243,255,0.5)]" : ""} />
            {isListening && <span className={cn("absolute -bottom-1 w-1 h-1 rounded-full", isLight ? "bg-blue-600" : "bg-neon-blue")} />}
         </button>
         
         <input 
           type="file" 
           ref={fileInputRef} 
           className="hidden" 
           accept="image/*" 
           onChange={handleImageSelect} 
         />
         
         <button 
           onClick={() => fileInputRef.current?.click()}
           className={cn(
             "flex items-center justify-center w-12 h-12 rounded-full active:scale-95 transition-all group",
             isLight 
               ? "bg-white border border-gray-200 shadow-sm text-green-600 hover:bg-green-50"
               : "glass-card hover:bg-white/10 text-neon-green"
           )}
         >
            <Camera size={20} className={!isLight ? "group-hover:drop-shadow-[0_0_8px_rgba(57,255,20,0.5)]" : ""} />
         </button>
      </div>

      <form onSubmit={handleSubmit} className="relative flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={autoResize}
          onKeyDown={handleKeyDown}
          placeholder={imagePreview ? "Ajoute une légende..." : "J'ai payé 15 balles..."}
          className={cn(
            "w-full rounded-2xl px-4 py-3 min-h-[50px] max-h-[120px] text-sm focus:outline-none transition-all resize-none scrollbar-hide",
            isLight 
              ? "bg-white border border-gray-200 text-gray-800 focus:border-green-400 focus:ring-2 focus:ring-green-100 placeholder:text-gray-400"
              : "bg-white/5 border border-white/10 text-white focus:border-neon-green/50 focus:bg-white/10 placeholder:text-gray-600"
          )}
          rows={1}
        />
        <button 
          type="submit"
          disabled={(!input.trim() && !imagePreview) || isLoading}
          className={cn(
            "h-[50px] w-[50px] rounded-2xl flex items-center justify-center transition-all duration-300",
            (input.trim() || imagePreview)
              ? isLight 
                ? "bg-green-500 text-white hover:bg-green-600 shadow-md" 
                : "bg-neon-green/20 text-neon-green hover:bg-neon-green hover:text-black shadow-[0_0_15px_rgba(57,255,20,0.2)]"
              : isLight
                ? "bg-gray-100 text-gray-400"
                : "bg-white/5 text-gray-500"
          )}
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};
