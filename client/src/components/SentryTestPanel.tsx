/**
 * SentryTestPanel — Error Testing Component
 * 
 * This component provides buttons to test different error scenarios
 * and verify that Sentry is capturing them correctly.
 * 
 * Remove this component from production or hide it behind an admin check.
 */

import { useState } from 'react';
import { AlertTriangle, Send, Bug } from 'lucide-react';
import { captureException, captureMessage } from '@/lib/sentry';

export default function SentryTestPanel() {
  const [isVisible, setIsVisible] = useState(false);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 p-3 bg-cyan-500 border border-cyan-400 rounded-full hover:bg-cyan-600 transition-colors z-50 shadow-lg"
        title="Open Sentry Test Panel (dev only)"
      >
        <Bug className="w-6 h-6 text-white" />
      </button>
    );
  }

  const triggerJSError = () => {
    throw new Error('🧪 Test Error: This is a manual JavaScript error for Sentry testing');
  };

  const triggerTypeError = () => {
    // @ts-ignore - Intentional error for testing
    const result = null.nonexistentMethod();
  };

  const triggerAsyncError = async () => {
    setTimeout(() => {
      throw new Error('🧪 Test Error: Async error thrown in setTimeout');
    }, 100);
  };

  const triggerPromiseRejection = () => {
    Promise.reject(new Error('🧪 Test Error: Unhandled Promise rejection'));
  };

  const triggerCustomMessage = () => {
    captureMessage('🧪 Test Message: Custom Sentry message', 'info');
  };

  const triggerCustomException = () => {
    try {
      throw new Error('🧪 Test Error: Custom exception captured via captureException');
    } catch (error) {
      captureException(error as Error, {
        severity: 'warning',
        testType: 'custom_exception',
        timestamp: new Date().toISOString(),
      });
    }
  };

  return (
    <div className="fixed bottom-4 right-4 w-80 bg-[#0A0E1A] border border-cyan-500/50 rounded-lg p-4 shadow-2xl z-50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-400" />
          <h3 className="text-sm font-bold text-cyan-400">Sentry Test Panel</h3>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="text-slate-400 hover:text-slate-300 text-lg"
        >
          ✕
        </button>
      </div>

      <p className="text-xs text-slate-400 mb-3">
        Click a button below to trigger an error and verify Sentry captures it:
      </p>

      <div className="space-y-2">
        <button
          onClick={triggerJSError}
          className="w-full px-3 py-2 bg-red-500/20 border border-red-500/50 rounded text-xs text-red-300 hover:bg-red-500/30 transition-colors font-mono"
        >
          Throw JS Error
        </button>

        <button
          onClick={triggerTypeError}
          className="w-full px-3 py-2 bg-red-500/20 border border-red-500/50 rounded text-xs text-red-300 hover:bg-red-500/30 transition-colors font-mono"
        >
          Null Reference Error
        </button>

        <button
          onClick={triggerAsyncError}
          className="w-full px-3 py-2 bg-red-500/20 border border-red-500/50 rounded text-xs text-red-300 hover:bg-red-500/30 transition-colors font-mono"
        >
          Async Error
        </button>

        <button
          onClick={triggerPromiseRejection}
          className="w-full px-3 py-2 bg-orange-500/20 border border-orange-500/50 rounded text-xs text-orange-300 hover:bg-orange-500/30 transition-colors font-mono"
        >
          Promise Rejection
        </button>

        <button
          onClick={triggerCustomMessage}
          className="w-full px-3 py-2 bg-blue-500/20 border border-blue-500/50 rounded text-xs text-blue-300 hover:bg-blue-500/30 transition-colors font-mono flex items-center justify-center gap-2"
        >
          <Send className="w-3 h-3" />
          Send Message
        </button>

        <button
          onClick={triggerCustomException}
          className="w-full px-3 py-2 bg-cyan-500/20 border border-cyan-500/50 rounded text-xs text-cyan-300 hover:bg-cyan-500/30 transition-colors font-mono"
        >
          Custom Exception
        </button>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-700">
        <p className="text-xs text-slate-500 text-center">
          Check your Sentry dashboard at{' '}
          <a
            href="https://sentry.io"
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-400 hover:underline"
          >
            sentry.io
          </a>
        </p>
      </div>
    </div>
  );
}
