import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
            <h1 className="text-6xl mb-4">😵</h1>
            <h2 className="text-2xl font-bold mb-2">Aïe... J'ai crashé.</h2>
            <p className="opacity-50 mb-8">Même mon code n'arrive pas à gérer tes dépenses.</p>
            <button
                onClick={() => window.location.reload()}
                className="bg-neon-green text-black px-6 py-2 rounded-full font-bold"
            >
                Réessayer
            </button>
        </div>
      );
    }

    return this.props.children;
  }
}
