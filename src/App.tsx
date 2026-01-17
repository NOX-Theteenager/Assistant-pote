import { useState, useEffect, useRef } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AppShell, BottomNav } from './components/layout/Shell';
import { Header } from './components/layout/Header';
import { ChatInput, ChatBubble } from './components/chat/ChatInterfaces';
import { StatsView } from './components/features/Stats';
import { SettingsView } from './components/features/Savings';

const MainView = () => {
  const { messages, sendMessage, isLoading } = useApp();
  const [activeTab, setActiveTab] = useState('journal');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  return (
    <AppShell>
      {/* Header is always visible but compact on scroll? Keeping it simple for now */}
      <div className="flex-none bg-background/50 backdrop-blur-md z-30">
        <Header />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto relative scrollbar-hide pb-0">
        {activeTab === 'journal' && (
          <div className="px-4 pb-4 min-h-full flex flex-col justify-end">
            {/* Spacer for top content */}
            <div className="h-4" /> 
            
            {messages.map((msg) => (
              <ChatBubble key={msg.id} message={msg} />
            ))}
            
            {isLoading && (
               <div className="flex items-center gap-2 opacity-50 text-xs ml-4 mb-4">
                 <div className="w-2 h-2 bg-neon-green rounded-full animate-bounce" />
                 <div className="w-2 h-2 bg-neon-green rounded-full animate-bounce delay-100" />
                 <div className="w-2 h-2 bg-neon-green rounded-full animate-bounce delay-200" />
                 <span>En train de juger tes choix de vie...</span>
               </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        {activeTab === 'stats' && (
          <StatsView />
        )}
         {activeTab === 'profile' && (
          <SettingsView />
        )}
      </div>

      {/* Input Area - Only visible on Journal */}
      {activeTab === 'journal' && (
        <div className="flex-none z-40">
          <ChatInput onSend={sendMessage} isLoading={isLoading} />
        </div>
      )}

      {/* Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      
    </AppShell>
  );
};

import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
        <AppProvider>
            <MainView />
        </AppProvider>
    </AuthProvider>
  );
}

export default App;
