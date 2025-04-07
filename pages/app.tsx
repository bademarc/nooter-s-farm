import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Dynamically import the App component with no SSR
const AppPage = dynamic(() => import('../app/page'), { 
  ssr: false,
  loading: () => (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      background: 'black',
      color: 'white'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ marginBottom: '20px' }}>Nooter's Farm</h1>
        <p>Loading game...</p>
      </div>
    </div>
  )
});

export default function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AppPage />
    </Suspense>
  );
} 