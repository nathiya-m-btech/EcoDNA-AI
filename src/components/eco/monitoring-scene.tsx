import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { EcosystemState } from '@/lib/eco/simulation';
import type { VirtualPlaceId } from '@/lib/eco/virtual-model';

export default function MonitoringScene({ state, place, running }: { state: EcosystemState; place: VirtualPlaceId; running: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const latest = useRef({ state, running });
  latest.current = { state, running };
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true }); } catch { setFailed(true); return; }
    const css = getComputedStyle(document.documentElement);
    const color = (token: string) => {
      const context = document.createElement('canvas').getContext('2d');
      if (!context) return new THREE.Color();
      context.fillStyle = css.getPropertyValue(token).trim(); context.fillRect(0, 0, 1, 1);
      const data = context.getImageData(0, 0, 1, 1).data;
      return new THREE.Color(data[0] / 255, data[1] / 255, data[2] / 255);
    };
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene(); scene.background = color('--background');
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0.5, 0); controls.enableDamping = true;
    controls.minDistance = 10; controls.maxDistance = 30; controls.maxPolarAngle = Math.PI / 2.2;
    scene.add(new THREE.HemisphereLight(color('--eco-mist'), color('--eco-forest'), 3));
    const sun = new THREE.DirectionalLight(color('--foreground'), 3); sun.position.set(4, 12, 5); scene.add(sun);
    const geometries: THREE.BufferGeometry[] = [], materials: THREE.Material[] = [];
    function mesh(geometry: THREE.BufferGeometry, token: string, x: number, y: number, z: number) {
      const material = new THREE.MeshStandardMaterial({ color: color(token), roughness: 0.7 });
      const object = new THREE.Mesh(geometry, material); object.position.set(x, y, z); scene.add(object);
      geometries.push(geometry); materials.push(material); return object;
    }
    mesh(new THREE.BoxGeometry(14, 0.5, 10), '--eco-forest', 0, -0.2, 0);
    const ground = mesh(new THREE.PlaneGeometry(14, 10, 32, 24), '--eco-emerald', 0, 0.07, 0); ground.rotation.x = -Math.PI / 2;
    const lake = mesh(new THREE.PlaneGeometry(place === 'river' ? 2.5 : 3.2, place === 'river' ? 10 : 3), '--eco-teal', -3.5, 0.09, 0); lake.rotation.x = -Math.PI / 2;
    const trees: THREE.Mesh[] = [];
    for (let i = 0; i < 65; i++) {
      const x = (i * 2.37 % 13) - 6.5, z = (i * 3.71 % 9) - 4.5;
      if (Math.abs(x + 3.5) < 1.9 || Math.hypot(x - 1, z - 1.6) < 2 || (place === 'industrial' && z < -2)) continue;
      const tree = mesh(new THREE.ConeGeometry(0.4, 1.4, 8), i % 3 ? '--eco-emerald' : '--eco-lime', x, 0.9, z);
      trees.push(tree); mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.6, 8), '--muted-foreground', x, 0.35, z);
    }
    if (place === 'industrial') for (let i = 0; i < 3; i++) {
      mesh(new THREE.BoxGeometry(2, 1.2, 1.8), '--muted-foreground', i * 2.5 - 0.5, 0.7, -3.1);
      mesh(new THREE.CylinderGeometry(0.22, 0.3, 2.4, 12), '--secondary', i * 2.5, 1.6, -3.1);
    }
    // Fixed sensor board: its geometry never morphs as the environment changes.
    mesh(new THREE.BoxGeometry(2, 0.16, 1.4), '--background', 1, 0.35, 1.6);
    for (let i = 0; i < 7; i++) mesh(new THREE.BoxGeometry(0.15, 0.05, 0.8), '--eco-teal', 0.25 + i * 0.25, 0.46, 1.6);
    mesh(new THREE.BoxGeometry(0.7, 0.2, 0.6), '--secondary', 0.8, 0.52, 1.5);
    mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.5, 20), '--eco-mist', 1.5, 0.65, 1.8);
    mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.4, 10), '--foreground', 1.8, 1.1, 1.2);
    const signal = mesh(new THREE.TorusGeometry(0.4, 0.025, 8, 48), '--eco-teal', 1.8, 1.8, 1.2); signal.rotation.x = Math.PI / 2;
    const scan = mesh(new THREE.TorusGeometry(1, 0.035, 8, 64), '--eco-lime', 1, 0.13, 1.6); scan.rotation.x = Math.PI / 2;
    const clouds = Array.from({ length: 12 }, (_, i) => mesh(new THREE.SphereGeometry(0.3, 12, 8), '--muted-foreground', (i % 3) * 2.5, 2.3 + i * 0.08, -3));
    const resize = () => {
      const w = el.clientWidth, h = el.clientHeight; if (!w || !h) return;
      renderer.setSize(w, h); camera.aspect = w / h;
      camera.position.set(10, w < 600 ? 18 : 12, w < 600 ? 23 : 16); camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize); observer.observe(el); resize();
    let frame = 0, time = 0;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const draw = () => {
      const { state: s, running: active } = latest.current;
      if (active && !reduced) time += 0.012;
      scan.scale.setScalar(1 + (time % 2) * 2); signal.scale.setScalar(1 + (time % 1));
      trees.forEach((tree, i) => { const size = Math.max(0.18, s.factors.greenCover / 100); tree.scale.set(size, size, size); tree.rotation.z = reduced ? 0 : Math.sin(time + i) * 0.025; });
      clouds.forEach((cloud, i) => { cloud.visible = i < (100 - s.factors.air) / 5; cloud.position.y = 2.3 + ((time + i * 0.3) % 2); });
      const lakeMaterial = lake.material as THREE.MeshStandardMaterial;
      lakeMaterial.color.copy(color('--eco-teal')).lerp(color('--risk-medium'), (100 - s.factors.water) / 120);
      controls.update(); renderer.render(scene, camera); frame = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(frame); observer.disconnect(); controls.dispose(); geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); renderer.dispose(); renderer.domElement.remove(); };
  }, [place]);
  return <div ref={host} className="h-[390px] w-full sm:h-[480px]" role="img" aria-label="Animated green landscape with a fixed monitoring sensor, trees, water and changing pollution">{failed && <p className="py-24 text-center text-muted-foreground">3D is unavailable. The simulation readings continue below.</p>}</div>;
}