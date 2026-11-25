import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import LoadingOverlay from '../components/ui/LoadingOverlay';
import ScreenShell from '../components/ui/ScreenShell';
import { useStore } from '../store';

export default function EntryGateScreen() {
  const router = useRouter();
  const checked = useRef(false);
  const [hydrated, setHydrated] = useState(useStore.persist?.hasHydrated?.() ?? true);
  const checkStartupConnection = useStore((s) => s.connection.checkStartupConnection);

  useEffect(() => {
    if (useStore.persist?.onFinishHydration) {
      const unsub = useStore.persist.onFinishHydration(() => setHydrated(true));
      if (useStore.persist.hasHydrated()) setHydrated(true);
      return unsub;
    }
  }, []);

  useEffect(() => {
    if (!hydrated || checked.current) return;
    checked.current = true;

    checkStartupConnection()
      .then((target) => {
        router.replace(target === 'chat' ? '/chat' : '/connect');
      })
      .catch(() => {
        router.replace('/connect');
      });
  }, [hydrated, checkStartupConnection, router]);

  return (
    <ScreenShell>
      <LoadingOverlay visible />
    </ScreenShell>
  );
}
