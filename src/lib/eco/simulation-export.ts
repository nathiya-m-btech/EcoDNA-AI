import { INDICATORS, simulationResources } from './simulation';
import type { SimulationRecord } from './simulation-history';

export async function exportSimulation(r: SimulationRecord, format: 'csv' | 'pdf') {
  const rows = INDICATORS.map(i => [i.label, String(Math.round(i.value(r.baseline))), String(Math.round(i.value(r.result)))]);
  const settings = Object.entries(r.settings).map(([k, v]) => [k, String(v), '']);
  const metadata = [['Scenario', r.name, ''], ['Model', r.model_version, ''], ['Saved', r.created_at, ''], ['Baseline date', r.baseline_date ?? 'unknown', ''], ['Target', r.target_name ?? '', '']];
  const disclaimer = 'Demonstration estimate, not a validated ecological prediction. All indicators 0-100; moisture and water are proxies. Resources are illustrative per hectare.';
  const resources = Object.entries(simulationResources(r.settings)).map(([k,v]) => [k, String(v), '']);
  if (format === 'pdf') {
    const { jsPDF } = await import('jspdf');
    const pdf = new jsPDF();
    pdf.setFontSize(18); pdf.text('EcoDNA AI - Simulation report', 16, 20);
    pdf.setFontSize(10);
    let y = 32;
    for (const row of [...metadata, ['Indicator', 'Before', 'After'], ...rows, ['Settings', '', ''], ...settings, ['Illustrative resources / ha', '', ''], ...resources]) {
      const lines = pdf.splitTextToSize(row.filter(Boolean).join('  |  '), 178);
      if (y + lines.length * 5 > 270) { pdf.addPage(); y = 20; }
      pdf.text(lines, 16, y); y += lines.length * 5 + 2;
    }
    if (y > 240) { pdf.addPage(); y = 20; }
    pdf.text(pdf.splitTextToSize(disclaimer, 178), 16, y + 4);
    pdf.save('ecodna-simulation.pdf');
    return;
  }
  const cell = (s: string) => `"${(/^[=+@\-]/.test(s) ? "'" : '') + s.replaceAll('"', '""')}"`;
  const csv = [...metadata, ['Indicator', 'Before', 'After'], ...rows, ...settings, ...resources, [disclaimer]].map(row => row.map(cell).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a'); a.href = url; a.download = 'ecodna-simulation.csv'; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}