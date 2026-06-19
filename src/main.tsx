import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import './styles.css';

registerSW({ immediate: true });

function App() {
  return (
    <main className="shell">
      <h1>어떻게 결제할까?</h1>
      <p>일본 결제비용을 한눈에 비교해요</p>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
