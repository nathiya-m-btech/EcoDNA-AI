import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EcoLogo } from '@/components/eco/logo';
import { INTRO_DURATION, INTRO_PHASES, introductionState } from '@/lib/eco/introduction';

// Three.js must never be evaluated during SSR; the scene loads only in the browser.
const MonitoringScene = lazy(() => import('@/components/eco/monitoring-scene'));

export const Route = createFileRoute('/_authenticated/welcome')({
  head: () => ({ meta: [
    { title: 'Monitoring introduction — EcoDNA AI' },
    { name: 'description', content: 'An interactive full-screen monitoring simulation plays before entering the EcoDNA dashboard.' },
    { property: 'og:title', content: 'Monitoring introduction — EcoDNA AI' },
    { property: 'og:description', content: 'Virtual monitoring, environmental change detection and recovery simulation.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' },
  ] }), component: Welcome,
});

function Welcome() {
  const navigate = useNavigate();
  const done = useRef(false);
  const [elapsed, setElapsed] = useState(0);
  const finish = () => {
    if (done.current) return;
    done.current = true;
    void navigate({ to: '/dashboard', replace: true });
  };
  // The introduction runs on the clock, so the dashboard always opens on time.
  useEffect(() => {
    const started = performance.now();
    const t = setInterval(() => {
      const next = Math.min(INTRO_DURATION, (performance.now() - started) / 1000);
      setElapsed(next);
      if (next >= INTRO_DURATION) { clearInterval(t); finish(); }
    }, 200);
    return () => clearInterval(t);
  }, []);
  const intro = introductionState('river', elapsed);
  const phase = INTRO_PHASES[intro.phase] ?? 'Monitor';
  return (
    <main className="fixed inset-0 z-50 overflow-hidden bg-background">
      <Suspense fallback={<div className="grid h-full place-items-center"><EcoLogo /></div>}>
        <MonitoringScene state={intro.current} place="river" running className="absolute inset-0 h-full w-full" />
      </Suspense>
      <div className="pointer-events-none absolute inset-0 flex flex-col p-5 sm:p-8">
        <header className="flex items-center justify-between">
          <EcoLogo />
          <Button variant="outline" size="sm" className="pointer-events-auto bg-background/70 backdrop-blur" onClick={finish}>
            Skip <ArrowRight className="h-4 w-4" />
          </Button>
        </header>
        <div className="mt-auto max-w-xl">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Step {intro.phase + 1} of {INTRO_PHASES.length}
          </p>
          <h1 className="font-display text-2xl font-semibold sm:text-3xl">{phase}</h1>
          <p className="mt-1 text-sm tabular-nums text-muted-foreground">
            DNA score {intro.current.score} · drift {intro.drift >= 0 ? '+' : ''}{intro.drift} · risk {intro.risk}/100 · recovery {intro.recovery}%
          </p>
          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full bg-primary transition-[width] duration-200" style={{ width: `${(elapsed / INTRO_DURATION) * 100}%` }} />
          </div>
        </div>
      </div>
    </main>
  );
}
