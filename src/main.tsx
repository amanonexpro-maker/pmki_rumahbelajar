import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { storage } from './services/storage.ts';
import { ThemeProvider } from './theme/ThemeProvider.tsx';

const root = createRoot(document.getElementById('root')!);

async function startApplication() {
  root.render(
    <main className="min-h-screen grid place-items-center p-8 text-slate-700">
      <p>Menghubungkan aplikasi ke database...</p>
    </main>,
  );

  try {
    await storage.connectDatabase();
    root.render(
      <ThemeProvider>
        <App />
      </ThemeProvider>,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Kesalahan koneksi tidak diketahui';
    console.error('Application startup failed:', error);
    root.render(
      <main className="min-h-screen grid place-items-center p-8 text-slate-700">
        <section className="max-w-lg text-center">
          <h1 className="mb-3 text-xl font-semibold">Database belum terhubung</h1>
          <p className="mb-5 text-sm">{message}. Pastikan PostgreSQL dan API berjalan.</p>
          <button
            className="rounded-lg bg-blue-700 px-4 py-2 text-white"
            onClick={() => void startApplication()}
          >
            Coba lagi
          </button>
        </section>
      </main>,
    );
  }
}

void startApplication();
