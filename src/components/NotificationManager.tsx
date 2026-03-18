'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSimulator } from '@/contexts/SimulatorContext';
import { toast } from 'sonner';

export default function NotificationManager() {
  const router = useRouter();
  const { setDemoRouteTrigger } = useSimulator();

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const handleMessage = (event: MessageEvent) => {
        if (event.data && event.data.type === 'TRIGGER_REROUTE') {
          console.log('[Sentinel] Reroute command received from Service Worker');
          toast.success('Rerouting Active', { 
            description: 'Sentinel Guard is calculating the safest Green Corridor.' 
          });
          setDemoRouteTrigger(true);
        }
      };

      navigator.serviceWorker.addEventListener('message', handleMessage);
      return () => navigator.serviceWorker.removeEventListener('message', handleMessage);
    }
  }, [setDemoRouteTrigger]);

  return null;
}
