'use client';

import { useEffect } from 'react';

export default function Home() {
  useEffect(() => {
    window.location.href = '/game.html';
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-lg">跳转中...</p>
    </div>
  );
}
