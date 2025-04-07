import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function StaticIndexPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to the app page
    router.push('/app');
  }, [router]);
  
  return (
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
  );
} 