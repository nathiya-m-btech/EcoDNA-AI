import { useEffect, useRef, useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Play, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EcoLogo } from '@/components/eco/logo';
import referenceVideo from '@/assets/videos/monitoring-reference.mp4.asset.json';

export const Route = createFileRoute('/_authenticated/welcome')({
  head: () => ({ meta: [
    { title: 'Monitoring introduction — EcoDNA AI' },
    { name: 'description', content: 'Watch the EcoDNA monitoring introduction before entering the virtual environmental simulation dashboard.' },
    { property: 'og:title', content: 'Monitoring introduction — EcoDNA AI' },
    { property: 'og:description', content: 'Virtual monitoring, environmental change detection and recovery simulation.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' },
  ] }), component: Welcome,
});
function Welcome() {
  const navigate = useNavigate();
  const video = useRef<HTMLVideoElement>(null);
  const [blocked, setBlocked] = useState(false);
  const [failed, setFailed] = useState(false);
  const finish = () => { void navigate({ to: '/dashboard', replace: true }); };
  useEffect(() => { const el = video.current; if (el) void el.play().catch(() => setBlocked(true)); }, []);
  return <main className="flex min-h-screen flex-col bg-background px-4 py-6 sm:px-8"><header className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3"><EcoLogo /><span className="text-xs text-muted-foreground">Virtual monitoring introduction</span></header><div className="mx-auto my-auto w-full max-w-6xl py-8"><h1 className="mb-2 font-display text-2xl font-semibold">EcoDNA AI monitoring workflow</h1><p className="mb-5 text-sm text-muted-foreground">Original reference video · Green-background replacement is awaiting video credits.</p><video ref={video} src={referenceVideo.url} autoPlay muted playsInline controls preload="auto" className="aspect-video w-full bg-secondary object-contain" onEnded={finish} onError={() => { setFailed(true); setBlocked(false); }} aria-label="EcoDNA monitoring introduction" />{blocked && <Button className="mt-4" onClick={() => { void video.current?.play().then(() => setBlocked(false)).catch(() => setBlocked(true)); }}><Play className="h-4 w-4" />Play introduction</Button>}{failed && <p role="alert" className="mt-4 text-sm text-risk-medium">The video could not load. You can continue to the dashboard.</p>}<div className="mt-5 flex flex-wrap items-center justify-between gap-4"><p className="text-sm text-muted-foreground">The dashboard opens automatically when the video ends.</p><Button variant="outline" onClick={finish}>Continue to dashboard<ArrowRight className="h-4 w-4" /></Button></div></div></main>;
}