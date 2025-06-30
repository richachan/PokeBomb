import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

// Dynamically import the background components
const EeveeNightBackground = dynamic(() => import('./eeveeNightBackground'));
const GlaceonWinterBackground = dynamic(() => import('./glaceonWinterBackground'));

export default function Room() {
  const [backgroundNumber, setBackgroundNumber] = useState<number | null>(null);

  useEffect(() => {
    // Generate the random number only on the client
    setBackgroundNumber(Math.floor(Math.random() * 2) + 1);
  }, []);

  // Render a placeholder or nothing during SSR and initial client render
  if (backgroundNumber === null) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {backgroundNumber === 1 ? <GlaceonWinterBackground /> : <GlaceonWinterBackground />}
    </div>
  );
}