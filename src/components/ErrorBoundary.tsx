import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[POS Fatal Runtime Exception Caught by ErrorBoundary]:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleHardReset = () => {
    try {
      sessionStorage.clear();
      // Keep persistent data if possible, but clear active session
      localStorage.removeItem('paperpress_pos_v2_active_session');
    } catch (e) {
      console.warn('Could not clear storage:', e);
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-2xl text-center space-y-5">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-neutral-100">Workstation Interrupted</h2>
              <p className="text-xs text-neutral-400 mt-1.5 leading-relaxed">
                An unexpected exception was caught. The register safely halted to protect your records from corruption.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800/80 text-left font-mono text-[11px] text-amber-300/90 break-words max-h-32 overflow-y-auto">
                {this.state.error.message || 'Unknown runtime error'}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-neutral-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/10 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Application</span>
              </button>

              <button
                type="button"
                onClick={this.handleHardReset}
                className="py-3 px-4 bg-neutral-800 hover:bg-neutral-750 text-neutral-300 font-semibold text-xs rounded-xl border border-neutral-700 transition-colors flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                title="Clears active temporary session state and reloads"
              >
                <RotateCcw className="w-4 h-4 text-neutral-400" />
                <span>Reset Session</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
