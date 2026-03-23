import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';
import toast from 'react-hot-toast';
import { ErrorBoundary } from './components/ErrorBoundary';

const updateSW = registerSW({
  onNeedRefresh() {
    toast((t) => (
      <div className="flex flex-col gap-2">
        <span className="text-sm">New content available.</span>
        <div className="flex gap-2">
          <button
            className="px-3 py-1 bg-indigo-600 text-white rounded-md text-xs font-medium"
            onClick={() => {
              updateSW(true);
              toast.dismiss(t.id);
            }}
          >
            Reload
          </button>
          <button
            className="px-3 py-1 bg-slate-200 text-slate-800 rounded-md text-xs font-medium"
            onClick={() => toast.dismiss(t.id)}
          >
            Dismiss
          </button>
        </div>
      </div>
    ), { duration: Infinity });
  },
  onOfflineReady() {
    toast.success('App ready to work offline', {
      icon: '📶',
    });
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
