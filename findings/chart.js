/* Small SVG chart renderer for the finding pages.
   Palette sampled pixel-by-pixel from the DiaASQ paper's figures: pastel fill with a
   saturated stroke of the same hue (fig4), and the teal/purple line pair (fig5).
   The run's own matplotlib output is fine for a paper and ugly on a screen, so the
   numbers below are copied from the run record and drawn again here. Nothing is
   re-computed or smoothed: every value is the value the run printed. */

const PAL = [
  { fill: '#D0EECB', line: '#488C3E' },   // green
  { fill: '#CDE6F8', line: '#3C78AA' },   // blue
  { fill: '#FCD8DE', line: '#BE5064' },   // pink
  { fill: '#D6C7E6', line: '#8C5FB9' },   // purple
  { fill: '#B5E3DD', line: '#2DAFA0' },   // teal
];
const GRID = '#E3E6EA', AXIS = '#9AA3AD', TEXT = '#333333', MUTED = '#7C858F';
const NS = 'http://www.w3.org/2000/svg';

const el = (n, a = {}, kids = []) => {
  const e = document.createElementNS(NS, n);
  for (const k in a) e.setAttribute(k, a[k]);
  (Array.isArray(kids) ? kids : [kids]).forEach(c => e.appendChild(c));
  return e;
};
const txt = (s, a = {}) => {
  const t = el('text', Object.assign({ fill: TEXT, 'font-size': 12,
    'font-family': 'Noto Sans, system-ui, sans-serif' }, a));
  t.textContent = s;
  return t;
};

/* a hatch like the paper's, so bars stay legible without relying on colour alone */
function hatch(defs, i, colour) {
  const id = `h${i}`;
  if (defs.querySelector('#' + id)) return id;
  const p = el('pattern', { id, width: 6, height: 6, patternUnits: 'userSpaceOnUse',
                            patternTransform: 'rotate(45)' });
  p.appendChild(el('line', { x1: 0, y1: 0, x2: 0, y2: 6, stroke: colour,
                             'stroke-width': 1.6, opacity: .34 }));
  defs.appendChild(p);
  return id;
}

function frame(w, h, m, yMax, yTicks, yFmt, yLabel) {
  const svg = el('svg', { viewBox: `0 0 ${w} ${h}`, width: '100%',
                          role: 'img', 'font-family': 'Noto Sans, sans-serif' });
  const defs = el('defs');
  svg.appendChild(defs);
  const plot = { x0: m.l, x1: w - m.r, y0: h - m.b, y1: m.t };
  const Y = v => plot.y0 - (v / yMax) * (plot.y0 - plot.y1);
  yTicks.forEach(v => {
    svg.appendChild(el('line', { x1: plot.x0, x2: plot.x1, y1: Y(v), y2: Y(v),
      stroke: GRID, 'stroke-width': 1, 'stroke-dasharray': v === 0 ? '' : '4 4' }));
    svg.appendChild(txt(yFmt(v), { x: plot.x0 - 9, y: Y(v) + 4, 'text-anchor': 'end',
      'font-size': 11, fill: MUTED }));
  });
  svg.appendChild(el('line', { x1: plot.x0, x2: plot.x0, y1: plot.y0, y2: plot.y1,
    stroke: AXIS, 'stroke-width': 1 }));
  if (yLabel) svg.appendChild(txt(yLabel, { x: 13, y: (plot.y0 + plot.y1) / 2,
    'text-anchor': 'middle', 'font-size': 11.5, fill: MUTED,
    transform: `rotate(-90 13 ${(plot.y0 + plot.y1) / 2})` }));
  return { svg, defs, plot, Y };
}

function legend(svg, w, items, y) {
  let x = w / 2 - items.reduce((a, s) => a + s.label.length * 6.4 + 34, 0) / 2;
  items.forEach(s => {
    svg.appendChild(el('rect', { x, y: y - 9, width: 13, height: 11, rx: 2,
      fill: s.fill, stroke: s.line, 'stroke-width': 1.4 }));
    svg.appendChild(txt(s.label, { x: x + 19, y, 'font-size': 11.5, fill: TEXT }));
    x += s.label.length * 6.4 + 34;
  });
}

/* one bar per row, or grouped bars when a row carries several values */
function drawBars(host, cfg) {
  const w = cfg.w || 720, h = cfg.h || 300;
  const series = cfg.series || [{ key: 'v', label: '' }];
  const m = { l: 52, r: 14, t: cfg.series ? 34 : 16, b: cfg.tall ? 62 : 44 };
  const yMax = cfg.yMax, ticks = cfg.ticks;
  const { svg, defs, plot, Y } = frame(w, h, m, yMax, ticks, cfg.yFmt || (v => v), cfg.yLabel);

  const n = cfg.rows.length, band = (plot.x1 - plot.x0) / n;
  const bw = Math.min(cfg.maxBar || 54, (band * 0.68) / series.length);

  cfg.rows.forEach((row, i) => {
    const cx = plot.x0 + band * (i + 0.5);
    const total = bw * series.length + (series.length - 1) * 4;
    series.forEach((s, k) => {
      const v = row[s.key];
      if (v == null) return;
      const pal = PAL[(s.pal != null ? s.pal : (row.pal != null ? row.pal : k)) % PAL.length];
      const x = cx - total / 2 + k * (bw + 4);
      const y = Y(v), hh = plot.y0 - y;
      svg.appendChild(el('rect', { x, y, width: bw, height: Math.max(hh, 1), rx: 2.5,
        fill: pal.fill, stroke: pal.line, 'stroke-width': 1.5 }));
      svg.appendChild(el('rect', { x, y, width: bw, height: Math.max(hh, 1), rx: 2.5,
        fill: `url(#${hatch(defs, PAL.indexOf(pal), pal.line)})`, stroke: 'none' }));
      svg.appendChild(txt(cfg.fmt ? cfg.fmt(v) : v, { x: x + bw / 2, y: y - 6,
        'text-anchor': 'middle', 'font-size': 11.5, 'font-weight': 600, fill: pal.line }));
    });
    (row.label || '').split('\n').forEach((line, li) =>
      svg.appendChild(txt(line, { x: cx, y: plot.y0 + 17 + li * 13, 'text-anchor': 'middle',
        'font-size': 11.5, fill: TEXT })));
    if (row.sub) svg.appendChild(txt(row.sub, { x: cx, y: plot.y0 + 31, 'text-anchor': 'middle',
      'font-size': 10, fill: MUTED }));
  });

  if (cfg.ref != null) {
    svg.appendChild(el('line', { x1: plot.x0, x2: plot.x1, y1: Y(cfg.ref), y2: Y(cfg.ref),
      stroke: '#8A929B', 'stroke-width': 1.4, 'stroke-dasharray': '7 5' }));
    svg.appendChild(txt(cfg.refLabel || 'chance', { x: plot.x1 - 4, y: Y(cfg.ref) - 6,
      'text-anchor': 'end', 'font-size': 10.5, fill: '#8A929B' }));
  }
  if (cfg.series) legend(svg, w, series.map((s, k) =>
    Object.assign({ label: s.label }, PAL[(s.pal != null ? s.pal : k) % PAL.length])), 16);
  host.appendChild(svg);
}

/* multi-series line, markers and all, in the fig5 manner */
function drawLines(host, cfg) {
  const w = cfg.w || 720, h = cfg.h || 300;
  const m = { l: 54, r: 16, t: 34, b: 46 };
  const { svg, plot, Y } = frame(w, h, m, cfg.yMax, cfg.ticks, cfg.yFmt || (v => v), cfg.yLabel);
  const n = cfg.x.length;
  const X = i => plot.x0 + (n === 1 ? 0 : (i / (n - 1)) * (plot.x1 - plot.x0 - 16)) + 8;

  cfg.x.forEach((lab, i) => svg.appendChild(txt(lab, { x: X(i), y: plot.y0 + 18,
    'text-anchor': 'middle', 'font-size': 11.5, fill: TEXT })));

  cfg.series.forEach((s, k) => {
    const pal = PAL[(s.pal != null ? s.pal : k + 3) % PAL.length];
    const d = s.v.map((v, i) => `${i ? 'L' : 'M'}${X(i)},${Y(v)}`).join(' ');
    svg.appendChild(el('path', { d, fill: 'none', stroke: pal.line, 'stroke-width': 2.4,
      'stroke-linejoin': 'round', 'stroke-linecap': 'round' }));
    s.v.forEach((v, i) => {
      const c = el(k % 2 ? 'rect' : 'circle', k % 2
        ? { x: X(i) - 4.6, y: Y(v) - 4.6, width: 9.2, height: 9.2, rx: 1.5 }
        : { cx: X(i), cy: Y(v), r: 4.8 });
      c.setAttribute('fill', pal.fill);
      c.setAttribute('stroke', pal.line);
      c.setAttribute('stroke-width', 1.8);
      svg.appendChild(c);
    });
  });
  legend(svg, w, cfg.series.map((s, k) =>
    Object.assign({ label: s.label }, PAL[(s.pal != null ? s.pal : k + 3) % PAL.length])), 16);
  host.appendChild(svg);
}

/* a heatmap for the confusion matrix, in the blue of the palette */
function drawMatrix(host, cfg) {
  const w = cfg.w || 620, cell = 46, m = { l: 92, t: 58, r: 20, b: 20 };
  const N = cfg.labels.length, h = m.t + N * cell + m.b;
  const svg = el('svg', { viewBox: `0 0 ${w} ${h}`, width: '100%' });
  const max = Math.max(...cfg.rows.flat());
  cfg.labels.forEach((lab, r) => {
    svg.appendChild(txt(lab, { x: m.l - 10, y: m.t + r * cell + cell / 2 + 4,
      'text-anchor': 'end', 'font-size': 11, fill: TEXT }));
    svg.appendChild(txt(lab, { x: m.l + r * cell + cell / 2, y: m.t - 12,
      'text-anchor': 'middle', 'font-size': 11, fill: TEXT }));
    cfg.rows[r].forEach((v, c) => {
      const t = max ? Math.pow(v / max, 0.42) : 0;
      svg.appendChild(el('rect', { x: m.l + c * cell, y: m.t + r * cell,
        width: cell - 2, height: cell - 2, rx: 3,
        fill: `color-mix(in srgb, #3C78AA ${Math.round(t * 88)}%, #F3F7FB)`,
        stroke: '#DCE3EA', 'stroke-width': 1 }));
      if (v) svg.appendChild(txt(v, { x: m.l + c * cell + cell / 2 - 1,
        y: m.t + r * cell + cell / 2 + 4, 'text-anchor': 'middle', 'font-size': 11,
        'font-weight': v === max ? 700 : 400, fill: t > .55 ? '#fff' : TEXT }));
    });
  });
  svg.appendChild(txt(cfg.xTitle, { x: m.l + (N * cell) / 2, y: h - 2,
    'text-anchor': 'middle', 'font-size': 11, fill: MUTED }));
  host.appendChild(svg);
}

window.Charts = { drawBars, drawLines, drawMatrix, PAL };
