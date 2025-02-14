import dynamic from 'next/dynamic';

const EeveeNightBackground = dynamic(() => import('./eeveeNightBackground'))

export default function Room() 
{
  return (
    <div>
      <EeveeNightBackground/>
    </div>
  );
}