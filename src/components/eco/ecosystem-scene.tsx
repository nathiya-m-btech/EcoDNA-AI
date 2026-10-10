import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { EcosystemState } from '@/lib/eco/simulation';

/** Browser-only renderer: this module is loaded lazily by the simulator. */
export default function EcosystemScene({ before, after }: { before: EcosystemState; after: EcosystemState }) {
  const host = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); }
    catch { setFailed(true); return; }
    const css = getComputedStyle(document.documentElement);
    const color = (token: string) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return new THREE.Color();
      ctx.fillStyle = css.getPropertyValue(token).trim(); ctx.fillRect(0, 0, 1, 1);
      const p = ctx.getImageData(0, 0, 1, 1).data;
      return new THREE.Color(`rgb(${p[0]},${p[1]},${p[2]})`);
    };
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    el.appendChild(renderer.domElement);
    renderer.domElement.setAttribute('aria-label', 'Interactive baseline and projected ecosystem terrain');
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(1, 13, 20);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0, 0); controls.enableDamping = true;
    controls.minDistance = 12; controls.maxDistance = 32; controls.maxPolarAngle = Math.PI / 2.1;
    scene.add(new THREE.HemisphereLight(color('--foreground'), color('--eco-forest'), 2.8));
    const sun = new THREE.DirectionalLight(color('--eco-mist'), 2); sun.position.set(3, 10, 7); scene.add(sun);
    const geometries: THREE.BufferGeometry[] = [];
    const materials: THREE.Material[] = [];
    function mesh(geometry: THREE.BufferGeometry, token: string, group: THREE.Group, x: number, y: number, z: number) {
      const material = new THREE.MeshStandardMaterial({ color: color(token), roughness: 0.85 });
      geometries.push(geometry); materials.push(material);
      const obj = new THREE.Mesh(geometry, material); obj.position.set(x, y, z); group.add(obj); return obj;
    }
    [before, after].forEach((state, side) => {
      const group = new THREE.Group(); group.position.x = side === 0 ? -4.7 : 4.7; scene.add(group);
      const terrain = new THREE.PlaneGeometry(8, 8, 20, 20);
      terrain.rotateX(-Math.PI / 2);
      const pos = terrain.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i), z = pos.getZ(i);
        pos.setY(i, 0.12 + Math.sin(x * 0.8) * Math.cos(z * 0.6) * 0.22);
      }
      terrain.computeVertexNormals();
      mesh(terrain, state.soilMoisture > 55 ? '--eco-forest' : '--secondary', group, 0, 0, 0);
      mesh(new THREE.BoxGeometry(8, 0.5, 8), '--secondary', group, 0, -0.22, 0);
      const lake = mesh(new THREE.CircleGeometry(0.6 + state.waterAvailability / 75, 40), '--eco-teal', group, -1.6, 0.38, 1.5);
      lake.rotation.x = -Math.PI / 2; lake.scale.y = 0.68;
      const count = Math.round(state.factors.greenCover * 0.65);
      for (let i = 0; i < count; i++) {
        const x = ((i * 2.37) % 7) - 3.5, z = ((i * 3.71) % 7) - 3.5;
        if (Math.hypot(x + 1.6, z - 1.5) < 1.9) continue;
        const h = 0.6 + ((i * 0.31) % 0.7);
        mesh(new THREE.CylinderGeometry(0.06, 0.09, h, 6), '--muted-foreground', group, x, h / 2 + 0.25, z);
        mesh(new THREE.ConeGeometry(0.36 + h * 0.1, h * 1.2, 7), i % 3 ? '--eco-emerald' : '--eco-lime', group, x, h + 0.35, z);
      }
      const pollution = Math.round((100 - state.factors.air + state.factors.waste) / 20);
      for (let i = 0; i < pollution; i++) {
        const x = 2.5 - (i % 3) * 0.8, z = 2.5 - Math.floor(i / 3) * 0.7;
        mesh(new THREE.BoxGeometry(0.36, 0.45, 0.36), '--risk-high', group, x, 0.5, z);
        const cloud = mesh(new THREE.SphereGeometry(0.18, 8, 6), '--muted-foreground', group, x, 1 + i % 2 * 0.3, z);
        cloud.scale.y = 1.4;
      }
      const species = Math.round(state.factors.biodiversity / 12);
      for (let i = 0; i < species; i++) mesh(new THREE.SphereGeometry(0.07, 8, 5), '--chart-4', group, -3 + i * 0.7, 0.4, -2.2);
    });
    const resize = () => {
      const w = el.clientWidth, h = el.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix();
      camera.position.set(1, w < 600 ? 20 : 13, w < 600 ? 29 : 20);
    };
    const observer = new ResizeObserver(resize); observer.observe(el); resize();
    let frame = 0;
    const draw = () => { controls.update(); renderer.render(scene, camera); frame = requestAnimationFrame(draw); };
    draw();
    return () => {
      cancelAnimationFrame(frame); observer.disconnect(); controls.dispose();
      geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); renderer.dispose(); renderer.domElement.remove();
    };
  }, [before, after]);
  return <div ref={host} className="relative h-[360px] w-full sm:h-[460px]" role="img" aria-label="Before and after interactive ecosystems">{failed && <p className="py-20 text-center text-sm text-muted-foreground">3D is unavailable in this browser. Before-and-after indicators remain available below.</p>}</div>;
}