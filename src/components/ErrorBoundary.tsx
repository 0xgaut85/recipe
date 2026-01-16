"use client";

import { Component, ReactNode } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: string | null;
}

/**
 * Error Boundary Component
 * Catches JavaScript errors in child components and displays a fallback UI
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error Boundary caught an error:", error, errorInfo);

    this.setState({
      errorInfo: errorInfo.componentStack || null,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="min-h-[400px] flex items-center justify-center p-8"
        >
          <div className="text-center max-w-md">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 15 }}
              className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center"
            >
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </motion.div>

            <h2 className="font-display text-2xl text-ink mb-3">
              Something Went Wrong
            </h2>

            <p className="text-ink/60 mb-6 text-sm">
              An unexpected error occurred. You can try refreshing the page or
              going back to the home page.
            </p>

            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="mb-6 text-left">
                <summary className="cursor-pointer text-sm text-ink/40 hover:text-ink/60">
                  Error details (dev only)
                </summary>
                <pre className="mt-2 p-3 bg-ink/5 rounded-lg text-xs overflow-auto max-h-40 text-red-600">
                  {this.state.error.message}
                  {this.state.errorInfo && (
                    <>
                      {"\n\n"}Stack:{"\n"}
                      {this.state.errorInfo}
                    </>
                  )}
                </pre>
              </details>
            )}

            <div className="flex gap-3 justify-center">
              <motion.button
                onClick={this.handleReset}
                className="flex items-center gap-2 px-4 py-2 bg-ink text-white rounded-lg text-sm font-medium hover:bg-ink/90 transition-colors"
                whileTap={{ scale: 0.95 }}
              >
                <RefreshCw size={16} />
                Try Again
              </motion.button>

              <Link href="/">
                <motion.button
                  className="flex items-center gap-2 px-4 py-2 bg-ink/10 text-ink rounded-lg text-sm font-medium hover:bg-ink/20 transition-colors"
                  whileTap={{ scale: 0.95 }}
                >
                  <Home size={16} />
                  Go Home
                </motion.button>
              </Link>
            </div>
          </div>
        </motion.div>
      );
    }

    return this.props.children;
  }
}

/**
 * App-specific error boundary with dark theme for the terminal
 */
export class AppErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("App Error Boundary caught an error:", error, errorInfo);
    this.setState({
      errorInfo: errorInfo.componentStack || null,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="min-h-screen bg-white flex items-center justify-center p-8"
        >
          <div className="text-center max-w-md">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 15 }}
              className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center"
            >
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </motion.div>

            <h2 className="font-display text-2xl text-ink mb-3">
              Terminal Error
            </h2>

            <p className="text-ink/60 mb-6 text-sm">
              The trading terminal encountered an error. Your funds are safe.
              Try refreshing or return to the landing page.
            </p>

            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="mb-6 text-left">
                <summary className="cursor-pointer text-sm text-ink/40 hover:text-ink/60">
                  Error details (dev only)
                </summary>
                <pre className="mt-2 p-3 bg-ink/5 rounded-lg text-xs overflow-auto max-h-40 text-red-500 font-mono">
                  {this.state.error.message}
                  {this.state.errorInfo && (
                    <>
                      {"\n\n"}Stack:{"\n"}
                      {this.state.errorInfo}
                    </>
                  )}
                </pre>
              </details>
            )}

            <div className="flex gap-3 justify-center">
              <motion.button
                onClick={this.handleReset}
                className="flex items-center gap-2 px-4 py-2 bg-ink text-white rounded-lg text-sm font-medium hover:bg-ink/90 transition-colors"
                whileTap={{ scale: 0.95 }}
              >
                <RefreshCw size={16} />
                Try Again
              </motion.button>

              <Link href="/">
                <motion.button
                  className="flex items-center gap-2 px-4 py-2 bg-ink/10 text-ink rounded-lg text-sm font-medium hover:bg-ink/20 transition-colors"
                  whileTap={{ scale: 0.95 }}
                >
                  <Home size={16} />
                  Exit Terminal
                </motion.button>
              </Link>
            </div>
          </div>
        </motion.div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
