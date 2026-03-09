import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 py-10 px-6">
          <div className="max-w-3xl mx-auto rounded-2xl border border-red-200 bg-white p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-2">La messagerie a rencontré une erreur</h2>
            <p className="text-slate-600 mb-4">
              Un message semble provoquer une erreur d affichage. Rechargez la conversation.
            </p>
            <button
              type="button"
              onClick={this.handleRetry}
              className="h-10 px-4 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700"
            >
              Reessayer
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
