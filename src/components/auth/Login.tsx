import { useAuth } from '../../context/AuthContext';

export const Login = () => {
    const { login } = useAuth();

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
            <div className="mb-8">
                <h1 className="text-4xl font-black mb-2 text-neon-green">POTE.</h1>
                <p className="opacity-50">L'assistant qui te juge, mais avec amour.</p>
            </div>

            <button
                onClick={login}
                className="bg-white text-black px-8 py-4 rounded-full font-bold flex items-center gap-3 hover:bg-gray-200 transition-all active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.3)]"
            >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
                Se connecter avec Google
            </button>

            <div className="mt-12 text-[10px] opacity-30 max-w-xs uppercase tracking-widest">
                En te connectant, tu acceptes que tes données soient traitées par une IA sarcastique.
            </div>
        </div>
    );
};
