'use client';

import { useState } from 'react';

export default function TestNotificationsPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<string[]>([]);

  const sendNotification = async (type: 'sale' | 'error' | 'info') => {
    try {
      setLoading(true);
      
      const messages = {
        sale: 'john@example.com upgraded to Pro - 30 Days',
        error: 'Adobe Stock API rate limit reached. Auto-switched to cache.',
        info: 'Cache database successfully synced. 756 assets updated.',
      };

      const titles = {
        sale: 'New Sale',
        error: 'API Error',
        info: 'System Update',
      };

      const response = await fetch('/api/admin/test-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          title: titles[type],
          message: messages[type],
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        const timestamp = new Date().toLocaleTimeString();
        setResults(prev => [
          ...prev,
          `✅ [${timestamp}] ${type.toUpperCase()} notification sent successfully`,
        ]);
      } else {
        setResults(prev => [
          ...prev,
          `❌ Error: ${data.error}`,
        ]);
      }
    } catch (error) {
      setResults(prev => [
        ...prev,
        `❌ Request failed: ${String(error)}`,
      ]);
    } finally {
      setLoading(false);
    }
  };

  const sendAll = async () => {
    setResults(['🚀 Starting all tests...']);
    
    for (const type of ['sale', 'error', 'info'] as const) {
      await sendNotification(type);
      // Wait 2 seconds between requests
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  };

  const clearResults = () => setResults([]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">
            🔔 Notification Testing
          </h1>
          <p className="text-slate-400">
            Send test notifications and verify email delivery
          </p>
        </div>

        {/* Test Buttons */}
        <div className="bg-slate-800 rounded-lg p-6 mb-6 border border-slate-700">
          <h2 className="text-xl font-semibold text-white mb-4">Send Test Notifications</h2>
          
          <div className="space-y-3">
            {/* Send All Button */}
            <button
              onClick={sendAll}
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 text-white font-semibold py-3 px-6 rounded-lg transition"
            >
              {loading ? '⏳ Sending...' : '🚀 Send All Tests (Sale + Error + Info)'}
            </button>

            {/* Individual Buttons */}
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => sendNotification('sale')}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded-lg transition text-sm"
              >
                🛍️ Sale
              </button>
              
              <button
                onClick={() => sendNotification('error')}
                disabled={loading}
                className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded-lg transition text-sm"
              >
                ⚠️ Error
              </button>
              
              <button
                onClick={() => sendNotification('info')}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded-lg transition text-sm"
              >
                ℹ️ Info
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Test Results</h2>
            {results.length > 0 && (
              <button
                onClick={clearResults}
                className="text-slate-400 hover:text-white text-sm"
              >
                Clear
              </button>
            )}
          </div>

          <div className="space-y-2 font-mono text-sm">
            {results.length === 0 ? (
              <p className="text-slate-400">Click a button to send a test notification...</p>
            ) : (
              results.map((result, idx) => (
                <div key={idx} className="text-slate-300 flex items-start gap-2">
                  <span className="flex-shrink-0">{result[0]}</span>
                  <span>{result.slice(1)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-slate-800 rounded-lg p-6 mt-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-3">ℹ️ What to Check</h3>
          
          <div className="space-y-3 text-sm text-slate-300">
            <div className="flex gap-3">
              <span className="text-green-400 flex-shrink-0">✓</span>
              <div>
                <strong className="text-white">Email Inbox:</strong> Check fikriade257@gmail.com
                <br />
                <span className="text-slate-400 text-xs">(Emails arrive in 1-2 minutes)</span>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="text-green-400 flex-shrink-0">✓</span>
              <div>
                <strong className="text-white">Dashboard:</strong> <a href="/admin/notifications" className="text-blue-400 hover:text-blue-300">View Notifications</a>
                <br />
                <span className="text-slate-400 text-xs">(Notifications appear immediately)</span>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="text-green-400 flex-shrink-0">✓</span>
              <div>
                <strong className="text-white">Database:</strong> Check Notification table
                <br />
                <span className="text-slate-400 text-xs">(3 new records should appear)</span>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="text-green-400 flex-shrink-0">✓</span>
              <div>
                <strong className="text-white">Email Content:</strong> Check with correct type theme
                <br />
                <span className="text-slate-400 text-xs">Sale=Green, Error=Red, Info=Blue</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="bg-slate-800 rounded-lg p-6 mt-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-3">💡 Tips</h3>
          <ul className="space-y-2 text-sm text-slate-300 list-disc list-inside">
            <li>Click "Send All Tests" to test 3 notifications at once</li>
            <li>Or use individual buttons to test one by one</li>
            <li>Each click = 1 new notification in database</li>
            <li>Toggle preferences in dashboard to enable/disable email</li>
            <li>Check Notification Preferences for email settings</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
