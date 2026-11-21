import React from "react";
import Icon from "./AppIcon";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
          <div className="card max-w-md w-full p-8 text-center border border-border shadow-xl">
            <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-100">
              <Icon name="AlertTriangle" size={28} />
            </div>
            
            <h1 className="text-xl font-bold text-text-primary tracking-tight">
              Something went wrong
            </h1>
            <p className="text-text-secondary text-sm mt-2 mb-6 leading-relaxed">
              An unexpected error occurred while rendering this page. You can recover by refreshing or returning to the dashboard.
            </p>

            {this.state.error && (
              <div className="bg-surface-hover p-3 rounded-lg text-left text-xs font-mono text-text-tertiary mb-6 max-h-28 overflow-y-auto border border-border">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={this.handleReset}
                className="w-full sm:w-auto px-4 py-2 border border-border rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-hover text-sm font-medium transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => {
                  window.location.href = "/sales-dashboard";
                }}
                className="w-full sm:w-auto btn-primary text-sm font-medium flex items-center justify-center space-x-2"
              >
                <Icon name="Home" size={16} />
                <span>Return to Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
