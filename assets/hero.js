/* ============================================================================
   The title-slide hero.

   Left: real records out of assets/hero, one per modality slot, drifting and
   quietly swapping for another discipline of the same kind. Middle: the five
   stages the engine runs, as the paper draws them. Right: the five findings the
   deck goes on to show, arriving as sheets and read out underneath.

   One clock drives all of it. The comet going round the ring is the same number
   that lights a stage, picks a record up when it passes Perceive and pushes a
   sheet out when it passes Report, so the page shows one run rather than three
   loops that happen to be on screen together. It only advances while the title
   slide is the one being looked at.

   The stack on the right opens: with the pointer on it, it deals out
   the papers it has written. Every number on them is one the deck states further
   down; nothing here is invented.
   ========================================================================== */
(function () {
  const hero = document.getElementById('hero');
  if (!hero) return;
  const wires = document.getElementById('heroWires');
  const wiresTop = document.getElementById('heroWiresTop');
  const evField = document.getElementById('evField');
  const outField = document.getElementById('outField');
  const cyBox = document.getElementById('cycle');
  const slide = hero.closest('.slide');
  const NS = 'http://www.w3.org/2000/svg';
  const slow = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rad = d => d * Math.PI / 180;
  const el = (n, at) => { const e = document.createElementNS(NS, n);
    for (const k in (at || {})) e.setAttribute(k, at[k]); return e; };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* the five stages in the order the engine runs them, each carrying one of the
     wordmark's own colours: O m n i Sci, read anticlockwise round the ring */
  const STAGES = [
    { n: 1, k: 'Perceive',   c: '#ef476f', a:  198 },
    { n: 2, k: 'Hypothesis', c: '#f28e2b', a:  126 },
    { n: 3, k: 'Experiment', c: '#00a890', a:   54 },
    { n: 4, k: 'Report',     c: '#934bed', a:  -18 },
    { n: 5, k: 'Feedback',   c: '#184878', a:  -90 },
  ];
  // where each word sits relative to its node, in pixels, so a smaller ring
  // never means smaller type
  const LAB = {
    Perceive:   { dx: -18, dy:  34, ax: 1,  ay: 0  },
    Hypothesis: { dx: -10, dy:  30, ax: 1,  ay: 0  },
    Experiment: { dx:  10, dy:  30, ax: 0,  ay: 0  },
    Report:     { dx:  18, dy:  34, ax: 0,  ay: 0  },
    Feedback:   { dx:   0, dy: -18, ax: .5, ay: 1  },
  };
  // one glyph per stage, drawn on a 24x24 box and scaled onto the node
  const ICON = {
    Perceive:   ['M1.8 12C5.3 6.5 8.6 4.6 12 4.6s6.7 1.9 10.2 7.4c-3.5 5.5-6.8 7.4-10.2 7.4S5.3 17.5 1.8 12Z',
                 'M12 8.7a3.3 3.3 0 1 0 0 6.6 3.3 3.3 0 0 0 0-6.6Z'],
    Hypothesis: ['M12 3.4a5.6 5.6 0 0 0-3.3 10.1v2.3h6.6v-2.3A5.6 5.6 0 0 0 12 3.4Z',
                 'M9.4 18.3h5.2', 'M10.4 20.8h3.2'],
    Experiment: ['M9.7 3.4v6.4L5 18.3a2 2 0 0 0 1.7 3h10.6a2 2 0 0 0 1.7-3l-4.7-8.5V3.4',
                 'M8.2 3.4h7.6', 'M7 14.8h10'],
    Report:     ['M4 20.2l3.2-.9L19.3 7.2a1.95 1.95 0 0 0-2.8-2.8L4.4 16.5 4 20.2Z',
                 'M15.5 5.9l2.8 2.8'],
    Feedback:   ['M4.7 12a7.3 7.3 0 0 1 12.4-5.2', 'M13.6 6.7h3.9V2.8',
                 'M19.3 12a7.3 7.3 0 0 1-12.4 5.2', 'M10.4 17.3H6.5v3.9'],
  };
  const MOD = {
    image:    ['#3f7fb3', ['M2.5 3.6h11v8.8h-11z', 'M2.5 10.2l3.2-3.2 2.6 2.6 2.2-2.2 3 3']],
    signal:   ['#2f8a86', ['M1.6 8h2.2l1.6-4.4 2.2 8.8 1.6-4.4h3.2']],
    audio:    ['#934bed', ['M4 6.2v3.6', 'M7 3.4v9.2', 'M10 5.2v5.6', 'M13 6.8v2.4']],
    '3d':     ['#cf8b3a', ['M8 2.2l5 2.8v6L8 13.8 3 11V5z', 'M3 5l5 2.8L13 5', 'M8 7.8v6']],
    video:    ['#c0584e', ['M2.5 3.6h11v8.8h-11z', 'M6.6 6.3l3.9 2.3-3.9 2.3z']],
    trace:    ['#4c8a5c', ['M1.8 12.6c2.4-6.6 4.8-1 6.6-4.8', 'M8.6 8.2c1.4-3 3.4-1.2 5.6-4.6']],
    table:    ['#74838f', ['M2.5 3.6h11v8.8h-11z', 'M2.5 7h11', 'M6.7 3.6v8.8']],
    formula:  ['#184878', ['M11.6 3.4H5l4.2 4.6L5 12.6h6.6']],
    sequence: ['#e0447a', ['M4.6 2.8c4 2.8 4 7.6 0 10.4', 'M11.4 2.8c-4 2.8-4 7.6 0 10.4',
                           'M5.8 5.8h4.4', 'M5.8 10.2h4.4']],
  };
  /* The tiles are square and their content fills them; a card far from square
     crops a spectrogram down to a corner of itself. So the cards stay close to
     square and the whole record is always in the frame. */
  const ASPECT = { image: 1, video: 1, '3d': 1, signal: 1, audio: 1,
                   trace: 1.12, table: 1.3, formula: 1.3, sequence: 1.25 };
  /* Read by hand off the contact sheet, one rule: a dense record can stand a big
     enlargement; a sparse or low-resolution one gets less, or gets its middle
     brought closer instead (crop > 1 magnifies the content inside the card). */
  const TUNE = {
    'eurosat_demo_00.webp': { big: 1.6 }, 'eurosat_demo_02.webp': { big: 1.6 },
    'eurosat_demo_03.webp': { big: 1.6 }, 'eurosat_demo_05.webp': { big: 1.6 },
    'cell_video_01.webp': { big: 1.7, crop: 1.6 },
    'cell_video_02.webp': { big: 1.7, crop: 1.5 },
    'storm_radar_video_00.webp': { big: 1.8, crop: 1.45 },
    'storm_radar_video_01.webp': { big: 1.8, crop: 1.45 },
    'storm_radar_video_02.webp': { big: 1.8, crop: 1.35 },
    'gwosc_gw_00.webp': { big: 2, crop: 1.3 }, 'gwosc_gw_01.webp': { big: 2, crop: 1.3 },
    'gwosc_gw_02.webp': { big: 2, crop: 1.3 }, 'gwosc_gw_03.webp': { big: 2, crop: 1.3 },
    'rruff_raman_00.webp': { big: 1.9 }, 'rruff_raman_02.webp': { big: 1.9 },
    'sleepedf_00.webp': { big: 2 }, 'sleepedf_02.webp': { big: 2 },
    'dna_00.webp': { big: 1.7 },
    'plant_pheno3d_00.webp': { big: 1.9, crop: 1.15 },
    'plant_pheno3d_01.webp': { big: 1.9, crop: 1.15 },
    'plant_pheno3d_02.webp': { big: 1.9, crop: 1.15 },
    'semantickitti_00.webp': { big: 1.7, crop: 1.3 },
    'storm_track_01.webp': { big: 1.8 }, 'storm_track_02.webp': { big: 1.8 },
    'vehicle_track_00.webp': { big: 1.8 },
    'animal_track_01.webp': { big: 1.8 }, 'animal_track_02.webp': { big: 1.8 },
    'feynman_01.webp': { big: 1.9, crop: 1.3 }, 'feynman_02.webp': { big: 1.9, crop: 1.3 },
    'plantvillage_05.webp': { crop: 1.35 },
    't_galaxy.webp': { big: 1.8 }, 't_cad.webp': { big: 2 }, 't_plant.webp': { big: 2 },
    't_lidar.webp': { big: 1.9 }, 't_storm.webp': { big: 2 }, 't_cyclone.webp': { big: 2 },
    't_birdmig.webp': { big: 2 }, 't_vehicle.webp': { big: 2 },
  };

  /* Records on staggered courses, like brickwork, each jittered inside whatever
     slack its own size leaves it. Courses rather than rows means no two columns line
     up; the jitter, the tilt and the varying sizes do the rest. Computing the slack
     from the tile is what guarantees none of them can land on top of another.

     How many courses there are is decided at layout: a laptop has half the floor a
     desktop does, and thirty-three records on it come out as postage stamps. So the
     elements are all built, and the ones the grid has no cell for are put away. */
  const MAXTILE = 23, CELL = 80;
  /* Only the records that read well at fifty pixels: the vivid spectrograms, the
     stained tissue, the radar and point clouds. The grey mice, the near-blank
     tables and the black rock scans are left in the folder. Chosen by looking at
     all 128, not by trusting the manifest to be photogenic. */
  const PICK = new Set([
    /* the teaser's own artwork, cropped out of fig_teaser: the same datasets,
       drawn the way the paper draws them. The plain one-line plots that stood
       for these cases before are retired. */
    't_galaxy.webp', 't_pathology.webp', 't_satellite.webp', 't_seismic.webp',
    't_raman.webp', 't_birdsong.webp', 't_heart.webp', 't_machine.webp',
    't_cad.webp', 't_plant.webp', 't_lidar.webp', 't_storm.webp',
    't_cyclone.webp', 't_birdmig.webp', 't_vehicle.webp',
    /* and the records that already read well small */
    'birdaudio_00.webp', 'birdaudio_01.webp', 'birdaudio_02.webp', 'birdaudio_03.webp',
    'cell_video_01.webp', 'cell_video_02.webp',
    'chestxray_02.webp', 'chestxray_03.webp',
    'dna_00.webp',
    'eurosat_demo_00.webp', 'eurosat_demo_02.webp', 'eurosat_demo_03.webp', 'eurosat_demo_05.webp',
    'feynman_01.webp', 'feynman_02.webp',
    'heartsound_00.webp', 'heartsound_01.webp', 'heartsound_02.webp', 'heartsound_03.webp',
    'histopath_00.webp', 'histopath_01.webp', 'histopath_02.webp', 'histopath_03.webp',
    'histopath_04.webp', 'histopath_05.webp',
    'hyperspectral_00.webp', 'hyperspectral_02.webp',
    'machine_sound_01.webp', 'machine_sound_02.webp',
    'nffa_sem_03.webp', 'nffa_sem_04.webp',
    'plant_pheno3d_00.webp',
    'plantvillage_05.webp',
    'semantickitti_00.webp',
    'storm_radar_video_00.webp', 'storm_radar_video_01.webp', 'storm_radar_video_02.webp',
    'whale_audio_00.webp', 'whale_audio_01.webp', 'whale_audio_02.webp',
  ]);
  function rng(seed) {
    let a = seed >>> 0;
    return () => ((a = (a * 1664525 + 1013904223) >>> 0) / 4294967296);
  }
  const SLOTS = (() => {
    const rand = rng(20260816), out = [];
    for (let i = 0; i < MAXTILE; i++)
      out.push({ jx: rand() - .5, jy: rand() - .5,
                 s: 0.84 + rand() * 0.16, rot: (rand() - .5) * 8.5 });
    return out;
  })();
  const NTILE = MAXTILE;
  // which cell each record sits in, for a grid of this shape
  function courses(cols, rows) {
    const cells = [];
    for (let r = 0; r < rows; r++) {
      const odd = r % 2, n = cols - odd;      // short courses set half a cell over
      for (let c = 0; c < n; c++)
        cells.push([(c + 0.5 + odd * 0.5) / cols, (r + 0.5) / rows, r]);
    }
    return cells;
  }
  // one of each kind, dealt round the heap, so no corner of it is all photographs.
  // Each count is the number of distinct cases that kind has after the cull, so
  // no two records on screen can ever be the same experiment.
  const SLOTMOD = (() => {
    const bag = [], mix = { image: 6, signal: 3, audio: 4, '3d': 3,
                            trace: 3, video: 2, formula: 1, sequence: 1 };
    for (const k in mix) for (let i = 0; i < mix[k]; i++) bag.push(k);
    const rand = rng(4242);
    for (let i = bag.length - 1; i > 0; i--) {  // a fixed shuffle, not a random one
      const j = Math.floor(rand() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
    while (bag.length < NTILE) bag.push('image');
    return bag.slice(0, NTILE);
  })();
  /* ---------- the five findings, and the numbers the deck gives for them --- */
  const OUT = [
    { d: 'Seismology', c: '#2f8a86', n: '21.7%', ch: 'spec',
      title: 'A fifth of the discard pile was never noise',
      cap: '163 of 750 noise-labelled traces carry a coherent transient',
      eq: 'p(false alarm) = 0.0107',
      bars: [.22, .41, 1, .58, .3, .17],
      panels: [
        { h: 'How much', lead: '21.7% of the discard pile', kind: 'bars', unit: '%', max: 25,
          rows: [['Flagged as signal', 21.7], ['Amplitude-only detector', 2.0], ['False alarms measured', 1.07]],
          note: 'The detector never sees the label. Its threshold is calibrated on IAAFT surrogates of the noise itself at a 1% false-alarm rate, and measures back at 1.07%.' },
        { h: 'How stable', lead: 'It holds across a fifty-fold threshold range', kind: 'pair', unit: '%',
          rows: [['Lowest / highest rate', 19, 25]],
          note: 'Three null models, one conclusion: the rate moves a few points while the threshold moves fifty-fold.' },
        { h: 'The record', kind: 'table',
          rows: [['Traces filed as noise', '750'], ['Carrying a transient', '163'],
                 ['Share of the pile', '21.7%'], ['False-alarm budget / measured', '1.0% / 1.07%']],
          note: 'An amplitude-only detector at the same budget flags 2.0%. Polarization and cross-channel coincidence are what carry the finding.' } ] },

    { d: 'Cardiology', c: '#934bed', n: '0.60 → 0.35', ch: 'bars',
      title: 'The metadata predicted the patient until the hospital changed',
      cap: 'Metadata-only AUC, pooled and then leave-one-cohort-out',
      eq: '\u0394AUC = 0.248',
      bars: [1, .84, .62, .58, .35, .3],
      panels: [
        { h: 'What collapsed', lead: 'Below chance once the cohort is held out', kind: 'pair', unit: '',
          rows: [['Metadata-only AUC', 0.60, 0.35], ['Murmur-band acoustic', 0.701, 0.656]],
          note: 'The shortcut flips sign across sites: a drop of 0.248, p < 0.0001. The acoustic feature barely moves, and that move is not significant.' },
        { h: 'Against chance', lead: 'A metadata model that is worse than a coin', kind: 'bars', unit: 'AUC', max: .8,
          rows: [['Pooled', 0.60], ['Chance', 0.50], ['Leave-one-cohort-out', 0.35]],
          note: 'What sounded like a model of the heart was partly a model of the recording booth.' },
        { h: 'The record', kind: 'table',
          rows: [['Recordings', 'heart sound, normal / abnormal'], ['Grouped by', 'the cohort that recorded them'],
                 ['Drop when held out', '0.248'], ['Significance', 'p < 0.0001']],
          note: 'Grouping by cohort is the whole experiment: pooled, the metadata looks informative.' } ] },

    { d: 'Astronomy', c: '#184878', n: '83.8%', ch: 'scat',
      title: 'Change the telescope and its reading of the galaxy stays put',
      cap: 'Agreement on the same galaxies across two independent surveys',
      eq: '\u03ba = 0.75, CI 0.64 \u2013 0.85',
      bars: [.3, .55, .8, 1, .74, .46],
      panels: [
        { h: 'Agreement', lead: '83.8% on the same galaxies, twice imaged', kind: 'bars', unit: '%', max: 100,
          rows: [['Observed agreement', 83.8], ['Chance for this label mix', 35.0]],
          note: '105 galaxies, each imaged once by SDSS and once by DECaLS. The labels are the catalogue morphology.' },
        { h: 'Effect size', lead: "Cohen's kappa 0.75", kind: 'pair', unit: '',
          rows: [['95% confidence interval', 0.64, 0.85]],
          note: 'A permutation test over the pairing gives p = 0.0002.' },
        { h: 'The record', kind: 'table',
          rows: [['Galaxies imaged twice', '105'], ['Surveys', 'SDSS / DECaLS'],
                 ["Cohen's kappa", '0.75'], ['Permutation test', 'p = 0.0002']],
          note: 'Same objects, different instruments. What survives the swap is what the reading was actually made of.' } ] },

    { d: 'Materials informatics', c: '#cf8b3a', n: '3.1 – 7.0×', ch: 'gap',
      title: 'The usual split flattered the model by a factor of seven',
      cap: 'Error gap between a random split and leave-one-family-out',
      eq: 'RMSE ratio = 3.1 \u2013 7.0',
      bars: [.26, .3, .28, 1, .93, .88],
      panels: [
        { h: 'The gap', lead: 'Three families, three different lies', kind: 'bars', unit: '×', max: 8,
          rows: [['Other families', 7.0], ['Cuprates', 4.3], ['Iron-based', 3.1]],
          note: 'Same data, same model. Only the question changed, from interpolating inside a family to predicting one it had never seen.' },
        { h: 'Where it went', lead: 'RMSE in kelvin, random split then held out', kind: 'pair', unit: ' K',
          rows: [['Cuprates', 12.1, 51.6], ['Iron-based', 6.6, 20.5], ['Other families', 4.3, 30.3]],
          note: 'The figure this rests on was produced by the run itself.' },
        { h: 'The record', kind: 'table',
          rows: [['Random split RMSE', '12.1 / 6.6 / 4.3 K'], ['Leave-one-family-out', '51.6 / 20.5 / 30.3 K'],
                 ['Error gap', '3.1 to 7.0×']],
          note: 'A benchmark number that only holds inside the family it was fitted on is not a benchmark number.' } ] },

    { d: 'Remote sensing', c: '#ef476f', n: '62.0 → 50.7%', ch: 'bars',
      title: 'Rotate the patches and the benchmark falls apart',
      cap: 'An orientation-only classifier, upright and then rotated',
      eq: '\u0394accuracy = 11.3 points',
      bars: [.95, .9, .52, .48, .3, .27],
      panels: [
        { h: 'The cue', lead: 'Orientation alone gets three times chance', kind: 'bars', unit: '%', max: 70,
          rows: [['Upright', 62.0], ['Rotated', 50.7], ['Chance', 20.0]],
          note: 'The features carry no colour and no raw pixels, only orientation histograms, angular FFT and coherence.' },
        { h: 'Per class', lead: 'The collapse is uneven', kind: 'pair', unit: '',
          rows: [['Forest recall', 0.68, 0.27], ['Residential recall', 0.91, 0.62]],
          note: 'Annual crop does not move at all. A frame-locked cue was doing part of the work that looked like land-cover understanding.' },
        { h: 'The record', kind: 'table',
          rows: [['Patches', 'Sentinel-2 land cover, six classes'], ['Features', 'orientation only'],
                 ['Upright / rotated', '62.0% / 50.7%'], ['Chance', '20%']],
          note: 'Six of the benchmark classes, nothing else changed but the angle.' } ] },
  ];

  /* ---------- the line under the title -------------------------------------
     The old line took two lines to say the same thing and said neither half of it:
     nothing in "for every discipline and the entire research lifecycle" is modal or
     disciplinary. This is the claim as an equation, with the two words that carry it
     turning over: one sentence, plus a record of whatever kind, gives a paper in
     whatever field that record belongs to. Both lists are the real ones, read off
     the same manifest the field is drawn from. */
  const MODWORD = {
    image: 'micrographs', signal: 'spectra', audio: 'recordings', '3d': 'point clouds',
    video: 'time-lapses', trace: 'trajectories', table: 'tables', formula: 'formulae',
    sequence: 'sequences',
  };
  // one small glyph per discipline the slot actually shows
  const DISCIC = {
    Astronomy:  ['M8 2.6a5.4 5.4 0 1 0 .01 0', 'M2.2 10c3.6 1.9 8 1.9 11.6 0'],
    Cardiology: ['M8 13.4S2.4 9.9 2.4 6.4a3 3 0 0 1 5.6-1.5 3 3 0 0 1 5.6 1.5c0 3.5-5.6 7-5.6 7Z'],
    Seismology: ['M1.4 8h2.2l1.4-4.8 2.2 9.6 1.6-6.2 1.2 3.6h2.6'],
    Pathology:  ['M6.4 2.6h3.2v4.2H6.4z', 'M8 6.8v3', 'M4.2 13.4h7.6',
                 'M5.4 13.4a2.6 2.6 0 0 1 5.2 0'],
    Radiology:  ['M8 2.4v11.2', 'M4.6 4.6c2.2 1 4.6 1 6.8 0', 'M4 7.4c2.6 1.1 5.4 1.1 8 0',
                 'M4.6 10.2c2.2 1 4.6 1 6.8 0'],
    Mineralogy: ['M8 2.2 13 6l-1.9 7.4H4.9L3 6z', 'M3 6h10', 'M8 2.2 6.4 13.4', 'M8 2.2l1.6 11.2'],
    Ethology:   ['M4.7 8.6a1.6 1.6 0 1 0 .01 0', 'M11.3 8.6a1.6 1.6 0 1 0 .01 0',
                 'M8 13.6c2.3 0 3.5-1.3 3.5-2.7S10.1 8.6 8 8.6 4.5 9.5 4.5 10.9 5.7 13.6 8 13.6'],
    Genomics:   ['M4.6 2.8c4 2.8 4 7.6 0 10.4', 'M11.4 2.8c-4 2.8-4 7.6 0 10.4',
                 'M5.8 5.8h4.4', 'M5.8 10.2h4.4'],
    Fisheries:  ['M2 8c2.6-3.4 6.6-3.4 9.2 0-2.6 3.4-6.6 3.4-9.2 0Z', 'M11.2 8 14.4 5.4v5.2z'],
    Materials:  ['M8 2.2 13 5v6L8 13.8 3 11V5z', 'M3 5l5 2.8L13 5', 'M8 7.8v6'],
    Plant: ['M8 13.6C8 8.6 10.3 4.6 13.4 3c.4 4.4-1.2 9.3-5.4 10.6Z',
            'M8 13.6C8 10 6.3 7 2.8 5.6c-.2 3.7 1.5 7.2 5.2 8Z'],
    Wave:  ['M1.5 8c1.7-4.4 3.5-4.4 5.2 0c1.7 4.4 3.5 4.4 5.2 0'],
    Globe: ['M8 2.6a5.4 5.4 0 1 0 .01 0', 'M2.6 8h10.8',
            'M8 2.6c-4.2 3.2-4.2 7.6 0 10.8', 'M8 2.6c4.2 3.2 4.2 7.6 0 10.8'],
    Cell:  ['M8 2.7a5.3 5.3 0 1 0 .01 0', 'M8.6 6a2.1 2.1 0 1 0 .01 0'],
    Formula: ['M11.6 3.4H5l4.2 4.6L5 12.6h6.6'],
  };
  // which of those a record's own discipline maps onto
  const DALIAS = {
    'Materials science': 'Materials', 'Materials informatics': 'Materials',
    'Digital rock physics': 'Mineralogy', 'Medical imaging': 'Radiology',
    'Regulatory genomics': 'Genomics', 'Marine ecology': 'Fisheries',
    'Movement ecology': 'Ethology', 'Plant pathology': 'Plant',
    'Plant phenotyping': 'Plant', 'Cell biology': 'Cell',
    'Gravitational waves': 'Wave', 'Hyperspectral sensing': 'Wave',
    'Sleep medicine': 'Wave', 'Machine diagnostics': 'Wave',
    'Bioacoustics': 'Wave', 'Marine bioacoustics': 'Wave',
    'Atmospheric science': 'Globe', 'Tropical cyclones': 'Globe',
    'Remote sensing': 'Globe', 'Autonomous driving': 'Globe',
    'LiDAR perception': 'Globe', 'Transportation': 'Globe',
    'Symbolic physics': 'Formula',
  };
  const icoOf = d => DISCIC[d] || DISCIC[DALIAS[d]] || DISCIC.Materials;
  const glyph = paths => `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor"
    stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">`
    + paths.map(d => `<path d="${d}"/>`).join('') + `</svg>`;

  let eqShow = null;                           // bound once the line is built
  function equation() {
    const hand = slide.querySelector('.hand');
    if (!hand || hand.dataset.eq) return;
    hand.dataset.eq = '1';
    hand.innerHTML = `<span class="eq"><b>One prompt</b><i class="op">+</i>`
      + `<span class="slot mod"></span>`
      + `<i class="arr"><svg viewBox="0 0 40 14" aria-hidden="true"><path fill="currentColor"
           d="M0 5.1h26.4V0.9L40 7l-13.6 6.1V8.9H0z"/></svg></i>`
      + `<b class="art">a scientific paper in</b><span class="slot disc"></span></span>`;
    const mSlot = hand.querySelector('.slot.mod'), dSlot = hand.querySelector('.slot.disc');
    const mods = Object.keys(MODWORD).filter(k => byMod[k] && byMod[k].length);
    if (!mods.length || !DISCS.length) return;
    /* Each slot is a box wide enough for the longest thing it will ever hold, and the
       word is centred in it. Sized to the content instead, every turn would shove the
       words either side of it a few pixels left and right for ever. */
    const gauge = (el, list, ic) => {
      let w = 0;
      list.forEach((t, i) => {
        el.innerHTML = `<u>${glyph(ic[i])}${esc(t)}</u>`;
        w = Math.max(w, el.scrollWidth);
      });
      el.style.width = (w + 4) + 'px';
    };
    gauge(mSlot, mods.map(m => MODWORD[m]), mods.map(m => (MOD[m] || MOD.image)[1]));
    gauge(dSlot, DISCS, DISCS.map(icoOf));
    /* the line answers to the field: whichever record lights up below is the
       pair of words that appears up here, on the same beat */
    eqShow = (mod, disc) => {
      mSlot.innerHTML = `<u>${glyph((MOD[mod] || MOD.image)[1])}${esc(MODWORD[mod] || mod)}</u>`;
      dSlot.innerHTML = `<u>${glyph(icoOf(disc))}${esc(disc)}</u>`;
    };
    // the field may already be reading something by the time the line is built
    const t0 = litKey != null ? tiles[litKey] : null;
    if (t0 && t0.disc) eqShow(t0.pmod || t0.mod, t0.disc);
    else eqShow(mods[0], DISCS[0]);
  }

  /* ---------- the evidence field ------------------------------------------ */
  let byCase = {}, byMod = {}, DISCS = [], tiles = [], dressed = 0;
  SLOTS.forEach((s, i) => {
    const d = document.createElement('div');
    d.className = 'ev';
    d.style.setProperty('--r', s.rot + 'deg');
    // the name lives under the card, not written over the picture
    d.innerHTML = '<div class="evcard"><img alt=""><img alt="" class="out"></div>'
                + '<i class="evtag"></i>';
    const c = d.querySelector('.evcard');
    c.style.setProperty('--dur', (9.5 + (i % 5) * 1.35).toFixed(2) + 's');
    c.style.setProperty('--del', (-(i * 0.83).toFixed(2)) + 's');
    evField.appendChild(d);
    const t = { el: d, i, mod: SLOTMOD[i], imgs: [...d.querySelectorAll('img')],
                tag: d.querySelector('.evtag'),
                front: 0, cs: null, asp: ASPECT[SLOTMOD[i]] || 1,
                ox: 0, oy: 0, vx: 0, vy: 0, hx: 0, hy: 0 };
    d.addEventListener('pointerdown', e => grab(t, e));
    d.addEventListener('pointermove', e => drag(t, e));
    d.addEventListener('pointerup', () => drop(t));
    d.addEventListener('pointercancel', () => drop(t));
    tiles.push(t);
  });

  /* Nothing on a card changes until the new record has arrived: swapping the
     badge first leaves a formula glyph sitting on a point cloud for as long as
     the download takes, which is the frame anyone screenshotting will catch. */
  function dress(t, cs) {
    const files = byCase[cs];
    if (!files) return;
    // never swap the record that is being read: the crossfade under a card blown
    // up to double size is exactly the double exposure it looks like
    if (t.up && t.el.classList.contains('read')) return;
    if (t.up && cs === t.cs && files.length < 2) return;   // nothing new to show
    const pick = files[Math.floor(Math.random() * files.length)];
    const back = t.imgs[1 - t.front];
    const show = () => {
      t.cs = cs;
      t.asp = ASPECT[pick.mod] || 1;
      back.classList.remove('out');
      t.imgs[t.front].classList.add('out');
      t.front = 1 - t.front;
      t.tag.textContent = pick.disc;
      t.pmod = pick.mod; t.disc = pick.disc;
      const tn = TUNE[pick.f] || {};
      t.big = tn.big || RK;
      back.style.transform = (tn.crop || 1) > 1 ? `scale(${tn.crop})` : '';
      place(t);
      restring();                              // a new aspect moves the tie-on point
      // the wires are anchored to card edges, which only have a size once one lands
      if (!t.up) { t.up = 1; if (++dressed === tiles.length) drawWires(); }
    };
    back.onload = show;
    back.onerror = show;
    back.src = 'assets/hero/tiles/' + pick.f;
  }
  /* A swap stays inside the slot's own modality, and it NEVER lands on a case
     another slot is already showing: falling back to "any other case" is how the
     floor ended up with the same experiment on it three times. With nothing
     unseen to take, the slot swaps to another picture of its own case instead. */
  function nextCase(t) {
    const pool = byMod[t.mod] || [];
    const on = new Set(tiles.map(x => x.cs));
    const free = pool.filter(c => c !== t.cs && !on.has(c));
    return free.length ? free[Math.floor(Math.random() * free.length)] : t.cs;
  }

  function waitForType() {
    const hand = slide.querySelector('.hand');
    if (!hand) return;
    if (hand.classList.contains('done')) return equation();
    new MutationObserver((m, o) => {
      if (hand.classList.contains('done')) { o.disconnect(); equation(); }
    }).observe(hand, { attributes: true, attributeFilter: ['class'] });
  }

  fetch('assets/hero/manifest.json').then(r => r.json()).then(man => {
    man = man.filter(m => PICK.has(m.f));
    DISCS = [...new Set(man.map(m => m.disc))];
    man.forEach(m => (byCase[m.case] = byCase[m.case] || []).push(m));
    Object.keys(byCase).forEach(c => {
      const m = byCase[c][0].mod;
      (byMod[m] = byMod[m] || []).push(c);
    });
    const used = {};
    tiles.forEach(t => {
      const pool = byMod[t.mod] || byMod.image;
      const k = (used[t.mod] = (used[t.mod] || 0));
      used[t.mod]++;
      dress(t, pool[k % pool.length]);
    });
    waitForType();
    setTimeout(drawWires, 2400);          // a net in case a record never arrives
  }).catch(() => {});

  /* ---------- drawing a page of a paper ------------------------------------
     Every page is 100 by 132 units, so one routine serves the stack, where it is
     170 pixels wide, and the opened grid, where it is 230. */
  function rules(x, y, n, w, step, op) {
    let s = '';
    for (let i = 0; i < n; i++)
      s += `<rect x="${x}" y="${(y + i * step).toFixed(2)}" width="${(w * (i % 4 === 3 ? .62 : i % 3 === 1 ? .93 : 1)).toFixed(2)}"
            height="1.1" rx=".55" fill="#4a5764" opacity="${op || .2}"/>`;
    return s;
  }
  function bars(x, y, w, h, hs, cols) {
    const bw = w / (hs.length * 1.62), gap = bw * .62;
    return hs.map((v, i) => `<rect x="${(x + i * (bw + gap)).toFixed(2)}" y="${(y + h - h * v).toFixed(2)}"
      width="${bw.toFixed(2)}" height="${(h * v).toFixed(2)}" rx=".8"
      fill="${cols[i % cols.length]}" opacity=".85"/>`).join('');
  }
  function chart(kind, x, y, w, h, c) {
    if (kind === 'spec') {
      let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="1.5" fill="#2b2140"/>`;
      const n = Math.round(w / 1.5);
      for (let i = 0; i < n; i++) {
        const hot = i > n * .42 && i < n * .66;
        const bh = (h * .12) + (h * .74) * Math.abs(Math.sin(i * 1.9)) * (hot ? 1 : .42);
        s += `<rect x="${(x + .8 + i * 1.5).toFixed(2)}" y="${(y + h - .8 - bh).toFixed(2)}"
              width="1.05" height="${bh.toFixed(2)}" rx=".4"
              fill="${hot ? '#f7b32b' : '#8c4fd0'}" opacity="${hot ? .95 : .6}"/>`;
      }
      return s;
    }
    if (kind === 'bars') return bars(x, y, w, h, [.66, .38, .92, .24], ['#934bed', '#c0584e', '#3f7fb3', '#4c8a5c']);
    if (kind === 'gap')  return bars(x, y, w, h, [.3, 1, .22, .78], ['#cf8b3a', '#184878', '#cf8b3a', '#184878']);
    if (kind === 'scat') {
      let s = '';
      for (let i = 0; i < 52; i++) {
        const a = i * 0.68, r = .05 + (i % 13) * .028;
        s += `<circle cx="${(x + w * (.5 + Math.cos(a) * r * 1.2)).toFixed(2)}"
              cy="${(y + h * (.5 + Math.sin(a) * r * 1.1)).toFixed(2)}" r=".9"
              fill="${i % 3 ? c : '#934bed'}" opacity=".68"/>`;
      }
      return s;
    }
    if (kind === 'line') {
      let d = '';
      for (let i = 0; i <= 28; i++)
        d += (i ? 'L' : 'M') + (x + w * i / 28).toFixed(2) + ' '
          + (y + h * (.62 - .42 * Math.sin(i * .42) * Math.exp(-i / 22))).toFixed(2) + ' ';
      return `<path d="${d}" fill="none" stroke="${c}" stroke-width="1.1" stroke-linejoin="round"/>`;
    }
    return '';
  }
  function grid(x, y, w, rowsN, colsN, c) {
    let s = `<line x1="${x}" y1="${y}" x2="${x + w}" y2="${y}" stroke="${c}" stroke-width=".7"/>`;
    const rh = 4.4, cw = w / colsN;
    for (let r = 0; r < rowsN; r++) {
      for (let i = 0; i < colsN; i++)
        s += `<rect x="${(x + i * cw + 1).toFixed(2)}" y="${(y + 2 + r * rh).toFixed(2)}"
              width="${(cw * (i ? .48 : .74)).toFixed(2)}" height="1.1" rx=".5"
              fill="#4a5764" opacity="${r ? .22 : .42}"/>`;
      if (!r) s += `<line x1="${x}" y1="${(y + rh).toFixed(2)}" x2="${x + w}" y2="${(y + rh).toFixed(2)}"
                    stroke="#4a5764" stroke-opacity=".26" stroke-width=".5"/>`;
    }
    return s + `<line x1="${x}" y1="${(y + 2 + rowsN * rh).toFixed(2)}" x2="${x + w}"
                y2="${(y + 2 + rowsN * rh).toFixed(2)}" stroke="${c}" stroke-width=".7"/>`;
  }
  // page 0 is the one the stack shows; the other eight only appear when it opens
  function page(f, i) {
    const head = `<rect x="0" y="0" width="100" height="132" fill="#fff"/>`;
    const foot = `<text x="50" y="127" text-anchor="middle" font-family="Noto Serif, Georgia, serif"
                   font-size="3.2" fill="#9aa6b1">${i + 1}</text>`;
    const sect = (y, w) => `<rect x="11" y="${y}" width="${w}" height="1.9" rx=".9" fill="${f.c}" opacity=".9"/>`;
    if (i === 0) return `<svg viewBox="0 0 100 132" xmlns="http://www.w3.org/2000/svg">${head}
      <rect x="11" y="10" width="46" height="2.6" rx="1.3" fill="${f.c}"/>
      <rect x="11" y="15.2" width="30" height="2.1" rx="1" fill="#2b3540" opacity=".5"/>
      <image href="assets/omni-logo.svg" x="79" y="9" width="11" height="11" opacity=".92"/>
      ${rules(11, 21.5, 2, 60, 2.6, .3)}
      <line x1="11" y1="29" x2="89" y2="29" stroke="#4a5764" stroke-opacity=".22" stroke-width=".7"/>
      ${chart(f.ch, 11, 33, 46, 28, f.c)}
      ${rules(62, 33, 9, 27, 3.1)}
      <text x="11" y="76" font-family="Noto Serif, Georgia, serif" font-size="10.5"
            font-weight="700" fill="${f.c}">${esc(f.n)}</text>
      ${rules(11, 82, 5, 33, 3.1)}
      ${rules(62, 64, 4, 27, 3.1)}
      <line x1="62" y1="79" x2="89" y2="79" stroke="${f.c}" stroke-opacity=".5" stroke-width=".7"/>
      ${rules(62, 83, 12, 27, 3.1)}
      ${rules(11, 101, 8, 33, 3.1)}
      <text x="11" y="123" font-family="Noto Sans, sans-serif" font-size="3.2"
            letter-spacing=".3" fill="#74838f">${esc(f.d.toUpperCase())}</text>${foot}</svg>`;
    if (i === 3) return `<svg viewBox="0 0 100 132" xmlns="http://www.w3.org/2000/svg">${head}
      ${sect(11, 30)}${rules(11, 16, 4, 78, 3.1)}
      <rect x="11" y="31" width="78" height="42" rx="1.5" fill="#fbfcfd" stroke="#4a5764" stroke-opacity=".14"/>
      ${chart(f.ch, 14, 34, 72, 36, f.c)}
      ${rules(11, 78, 2, 78, 3, .32)}
      ${rules(11, 88, 6, 37, 3.1)}${rules(52, 88, 6, 37, 3.1)}
      ${rules(11, 110, 3, 78, 3.1)}${foot}</svg>`;
    if (i === 4) return `<svg viewBox="0 0 100 132" xmlns="http://www.w3.org/2000/svg">${head}
      ${sect(11, 24)}${rules(11, 16, 3, 78, 3.1)}
      ${grid(11, 28, 78, 7, 4, f.c)}
      ${rules(11, 68, 2, 78, 3, .32)}
      ${rules(11, 78, 8, 37, 3.1)}${rules(52, 78, 8, 37, 3.1)}
      ${rules(11, 106, 5, 37, 3.1)}${rules(52, 106, 5, 37, 3.1)}${foot}</svg>`;
    if (i === 6) return `<svg viewBox="0 0 100 132" xmlns="http://www.w3.org/2000/svg">${head}
      ${sect(11, 34)}${rules(11, 16, 3, 78, 3.1)}
      <rect x="11" y="27" width="37" height="26" rx="1.5" fill="#fbfcfd" stroke="#4a5764" stroke-opacity=".14"/>
      ${bars(14, 30, 31, 20, [.5, .82, .34, 1], ['#cf8b3a', '#184878', '#2f8a86', '#934bed'])}
      <rect x="52" y="27" width="37" height="26" rx="1.5" fill="#fbfcfd" stroke="#4a5764" stroke-opacity=".14"/>
      ${chart('line', 55, 30, 31, 20, f.c)}
      ${rules(11, 57, 2, 78, 3, .32)}
      ${rules(11, 67, 11, 37, 3.1)}${rules(52, 67, 11, 37, 3.1)}
      ${rules(11, 105, 6, 78, 3.1)}${foot}</svg>`;
    if (i === 8) return `<svg viewBox="0 0 100 132" xmlns="http://www.w3.org/2000/svg">${head}
      ${sect(11, 26)}
      ${[0, 1].map(c => Array.from({ length: 13 }, (_, r) =>
        `<rect x="${11 + c * 41}" y="${(18 + r * 7.6).toFixed(1)}" width="${(37 * (r % 3 ? .96 : .7)).toFixed(1)}"
          height="1.05" rx=".5" fill="#4a5764" opacity=".3"/>
         <rect x="${11 + c * 41}" y="${(21.4 + r * 7.6).toFixed(1)}" width="${(37 * (r % 2 ? .62 : .84)).toFixed(1)}"
          height="1.05" rx=".5" fill="#4a5764" opacity=".18"/>`).join('')).join('')}${foot}</svg>`;
    // the ordinary body page, varied a little by where it falls in the paper
    const eq = i === 5 ? `<rect x="24" y="62" width="52" height="9" rx="1.5" fill="#f5f7f9"/>
      <text x="50" y="68.6" text-anchor="middle" font-family="Noto Serif, Georgia, serif"
            font-style="italic" font-size="4.6" fill="#2b3540">${esc(f.eq)}</text>` : '';
    const nTop = i === 5 ? 10 : 14;
    return `<svg viewBox="0 0 100 132" xmlns="http://www.w3.org/2000/svg">${head}
      ${sect(11, 22 + (i * 7) % 20)}${rules(11, 16, 3, 78, 3.1)}
      ${rules(11, 28, nTop, 37, 3.1)}${rules(52, 28, nTop, 37, 3.1)}
      ${eq}
      ${rules(11, 76, 14, 37, 3.1)}${rules(52, 76, 14, 37, 3.1)}${foot}</svg>`;
  }

  /* ---------- the stack ----------------------------------------------------
     One hand of papers, seven of them, standing in the middle of its own half of
     the band. With the pointer on it they deal out from where they stand, half to
     the left and half to the right, one after another. No panel, no click. */
  const stackWrap = document.createElement('div');
  stackWrap.className = 'stackwrap';
  outField.appendChild(stackWrap);

  const N = 6;
  const SHUT = [], FAN = [];
  for (let i = 0; i < N; i++) {
    const k = i - (N - 1) / 2;                 // -3 .. 3, the middle one is 0
    // closed it still has to read as a pile of seven, not as one sheet
    SHUT.push({ x: (i - (N - 1) / 2) * 9, y: -i * 3.5, r: -5 + i * 1.7,
                s: 1 - i * 0.014, o: 1 - i * 0.055 });
    // dealt along a level line: the arc had them climbing off the top of the page
    FAN.push({ x: k, y: 0, r: k * 3.6, s: 1 - Math.abs(k) * 0.006, o: 1 });
  }
  let stack = [], outAt = 0, front = OUT[0], fanned = false, pending = 0;

  function seat(sh, i, snap) {
    const k = G.sk, p = fanned ? FAN[i] : SHUT[i];
    const dx = fanned ? p.x * G.fdx : p.x * k;
    if (snap) sh.style.transition = 'none';
    // dealt one at a time, left to right, or it is not a deal, it is a jump
    else sh.style.transitionDelay = ((fanned ? i : N - 1 - i) * 0.105).toFixed(3) + 's';
    sh.style.zIndex = String(fanned ? i : 9 - i);
    sh.style.opacity = p.o;
    sh.style.transform = `translate(${dx.toFixed(1)}px, ${(p.y * k).toFixed(1)}px)`
                       + ` rotate(${p.r}deg) scale(${p.s})`;
    if (snap) { void sh.offsetWidth; sh.style.transition = ''; }
  }
  function sizeSheet(sh) {
    sh.style.width = G.sw + 'px';
    sh.style.height = G.sh + 'px';
    sh.style.left = ((G.side - G.sw) / 2).toFixed(1) + 'px';
    sh.style.top = (24 * G.sk).toFixed(1) + 'px';
  }
  function reseat(snap) { stack.forEach((s, i) => { if (i < N) seat(s, i, snap); }); }

  function press(snap) {                       // one more paper comes off the press
    if (fanned && !snap) { pending++; return; } // not while the hand is open
    const f = OUT[outAt++ % OUT.length];
    front = f;
    const sh = document.createElement('div');
    sh.className = 'psheet';
    sh.innerHTML = page(f, 0);
    sizeSheet(sh);
    sh.style.transition = 'none';
    sh.style.opacity = '0';
    sh.style.transform = `translate(${-G.sw * 1.1}px, ${G.sh * .34}px) rotate(-15deg) scale(.66)`;
    stackWrap.appendChild(sh);
    stack.unshift(sh);
    void sh.offsetWidth;
    sh.style.transition = '';
    stack.forEach((s, i) => { if (i < N) seat(s, i, snap); });
    while (stack.length > N) {
      const old = stack.pop();
      old.style.opacity = '0';
      old.style.transform = old.style.transform.replace(/scale\([\d.]+\)/, 'scale(.86)');
      setTimeout(() => old.remove(), 1000);
    }
  }

  stackWrap.addEventListener('pointerenter', () => { fanned = true; reseat(false); });
  stackWrap.addEventListener('pointerleave', () => {
    fanned = false; reseat(false);
    if (pending) { pending = 0; setTimeout(() => press(false), 320); }
  });
  if (!matchMedia('(hover: hover)').matches)   // a tap, for a finger
    stackWrap.addEventListener('click', () => { fanned = !fanned; reseat(false); });

  /* ---------- the loop ----------------------------------------------------- */
  const VB = 118;                              // the ring's radius in its own units
  const P = a => [118 + VB * Math.cos(rad(a)), 118 + VB * Math.sin(rad(a))];
  let cyNodes = [], cyLabs = [], comet = null;

  function buildCycle() {
    const s = el('svg', { viewBox: '0 0 236 236' });
    const defs = el('defs');
    defs.innerHTML = `<radialGradient id="cyPool">
        <stop offset="0" stop-color="#fff" stop-opacity=".95"/>
        <stop offset=".72" stop-color="#fff" stop-opacity=".78"/>
        <stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>` +
      STAGES.map((st, i) => {
        const [x1, y1] = P(st.a), [x2, y2] = P(STAGES[(i + 1) % 5].a);
        return `<linearGradient id="cyArc${i}" gradientUnits="userSpaceOnUse"
          x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}">
          <stop offset="0" stop-color="${st.c}"/>
          <stop offset="1" stop-color="${STAGES[(i + 1) % 5].c}"/></linearGradient>`;
      }).join('');
    s.appendChild(defs);
    s.appendChild(el('circle', { cx: 118, cy: 118, r: VB * 1.3, fill: 'url(#cyPool)' }));

    const ticks = el('g', { class: 'cy-spin' });
    for (let i = 0; i < 120; i++) {
      const a = rad(i * 3), long = i % 5 === 0;
      const r1 = VB - 22, r2 = VB - (long ? 12 : 16);
      ticks.appendChild(el('line', {
        x1: 118 + r1 * Math.cos(a), y1: 118 + r1 * Math.sin(a),
        x2: 118 + r2 * Math.cos(a), y2: 118 + r2 * Math.sin(a),
        class: 'cy-tick', 'stroke-opacity': long ? .5 : .26 }));
    }
    s.appendChild(ticks);

    STAGES.forEach((st, i) => {
      const [x1, y1] = P(st.a), [x2, y2] = P(STAGES[(i + 1) % 5].a);
      s.appendChild(el('path', {
        d: `M${x1.toFixed(2)} ${y1.toFixed(2)}A${VB} ${VB} 0 0 0 ${x2.toFixed(2)} ${y2.toFixed(2)}`,
        class: 'cy-arc', stroke: `url(#cyArc${i})`, 'stroke-width': 7 }));
    });

    comet = el('g', { class: 'cy-comet' });
    const [hx, hy] = P(0), [tx, ty] = P(22);
    comet.appendChild(el('path', { d: `M${tx.toFixed(2)} ${ty.toFixed(2)}A${VB} ${VB} 0 0 0 ${hx} ${hy}`,
      fill: 'none', stroke: 'currentColor', 'stroke-width': 7, 'stroke-linecap': 'round', opacity: .6 }));
    comet.appendChild(el('circle', { cx: hx, cy: hy, r: 5.4, fill: '#fff' }));
    comet.appendChild(el('circle', { cx: hx, cy: hy, r: 3.4, fill: 'currentColor' }));
    s.appendChild(comet);

    // the mark, turning the other way. Eight-fold symmetry, so it never looks tilted
    s.appendChild(el('image', { href: 'assets/omni-logo.svg', x: 118 - 25, y: 118 - 66,
      width: 50, height: 50, class: 'cy-mark' }));

    STAGES.forEach(st => {
      const [x, y] = P(st.a), g = el('g', { class: 'cy-node' });
      g.appendChild(el('circle', { cx: x, cy: y, r: 30, fill: st.c, class: 'glow' }));
      g.appendChild(el('circle', { cx: x, cy: y, r: 19.5, fill: '#fff' }));
      g.appendChild(el('circle', { cx: x, cy: y, r: 17, fill: st.c, class: 'disc' }));
      const ic = el('g', { transform: `translate(${(x - 11).toFixed(2)} ${(y - 11).toFixed(2)}) scale(${22 / 24})`,
        fill: 'none', stroke: '#fff', 'stroke-width': 1.9,
        'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
      ICON[st.k].forEach(d => ic.appendChild(el('path', { d })));
      g.appendChild(ic);
      s.appendChild(g);
      cyNodes.push(g);
    });
    cyBox.appendChild(s);

    // the words live in HTML on top, so the type stays put when the circle shrinks
    STAGES.forEach(st => {
      const b = document.createElement('div');
      b.className = 'cy-lab';
      b.style.setProperty('--sc', st.c);
      b.innerHTML = `<b>${st.n}</b>${st.k}`;
      cyBox.appendChild(b);
      cyLabs.push(b);
    });
    const name = document.createElement('div');
    name.className = 'cy-name';
    name.innerHTML = '<i style="color:#ef476f">O</i><i style="color:#f28e2b">m</i>'
                   + '<i style="color:#00a890">n</i><i style="color:#934bed">i</i>'
                   + '<i style="color:#184878">Scientist</i>';
    cyBox.appendChild(name);
    const said = document.createElement('div');
    said.className = 'cy-said';
    said.textContent = 'One engine. Many domains.';
    cyBox.appendChild(said);
    cyBox._name = name;
    cyBox._said = said;
  }
  buildCycle();

  /* ---------- geometry: measured, never assumed ---------------------------- */
  const G = { w: 0, h: 0, sk: 1 };
  /* The field behaves like a mobile: every record hangs off its own place, drifts on
     its own, and can be taken hold of and thrown. Let go, it swings back and settles.
     Pull one and its neighbours lean toward it, which is what makes the whole field
     read as one thing rather than twenty-four stickers. */
  /* A force graph, the way one is meant to behave: every record is tied to its three
     nearest neighbours by a spring at its resting length, and every record is tied
     weakly to its own place. Pull one and the pull travels along the ties, so the
     ones near it follow and the far side of the field barely stirs. */
  let held = null, restless = 0;
  const HOME = 0.028, LINK = 0.075, DAMP = 0.9;
  function relink() {
    const on = tiles.filter(t => t.w);
    on.forEach(t => { t.link = []; });
    on.forEach(t => {
      on.filter(o => o !== t)
        .map(o => ({ o, d: Math.hypot(o.hx - t.hx, o.hy - t.hy) }))
        .sort((a, b) => a.d - b.d).slice(0, 3)
        .forEach(L => {
          t.link.push(L);
          if (!L.o.link.some(x => x.o === t)) L.o.link.push({ o: t, d: L.d });
        });
    });
  }
  function grab(t, e) {
    held = t;
    t.px = e.clientX; t.py = e.clientY;
    t.el.classList.add('drag');
    t.el.setPointerCapture(e.pointerId);
    restless = 1;
  }
  function drag(t, e) {
    if (held !== t) return;
    t.ox += e.clientX - t.px; t.oy += e.clientY - t.py;
    t.vx = (e.clientX - t.px) * 0.62; t.vy = (e.clientY - t.py) * 0.62;
    t.px = e.clientX; t.py = e.clientY;
    e.preventDefault();
  }
  function drop(t) { if (held === t) { held = null; t.el.classList.remove('drag'); } }
  function physics() {
    if (!restless) return;
    let moving = false;
    for (const t of tiles) {
      if (!t.w) continue;
      if (t === held) { moving = true; }
      else {
        let fx = -t.ox * HOME, fy = -t.oy * HOME;
        for (const L of (t.link || [])) {
          const dx = (L.o.hx + L.o.ox) - (t.hx + t.ox);
          const dy = (L.o.hy + L.o.oy) - (t.hy + t.oy);
          const d = Math.sqrt(dx * dx + dy * dy) || 1e-3;
          const f = (d - L.d) * LINK / d;
          fx += dx * f; fy += dy * f;
        }
        t.vx = (t.vx + fx) * DAMP;
        t.vy = (t.vy + fy) * DAMP;
        t.ox += t.vx; t.oy += t.vy;
        if (Math.abs(t.ox) + Math.abs(t.oy) + Math.abs(t.vx) + Math.abs(t.vy) < 0.3)
          { t.ox = t.oy = t.vx = t.vy = 0; }
        else moving = true;
      }
      t.el.style.setProperty('--ox', t.ox.toFixed(1) + 'px');
      t.el.style.setProperty('--oy', t.oy.toFixed(1) + 'px');
    }
    restless = moving ? 1 : 0;
    restring();                                // the strings follow what they are tied to
  }

  function place(t) {
    const cell = G.cells && G.cells[t.i];
    if (!cell) { t.el.style.display = 'none'; t.w = 0; return; }
    t.el.style.display = '';
    const s = SLOTS[t.i], w = G.tw * s.s, h = w / t.asp;
    t.w = w; t.h = h; t.row = cell[2];
    // 1.14 is the room a card of this size needs once it is turned a few degrees
    const sx = Math.max(0, G.cw - w * 1.14), sy = Math.max(0, G.ch - h * 1.14);
    t.hx = G.ex + cell[0] * G.ew - w / 2 + s.jx * sx;
    t.hy = G.ey + cell[1] * G.eh - h / 2 + s.jy * sy - (1 - cell[0]) * G.lift;
    restyle(t);
  }
  /* Reading a record more than doubles it in real layout units, so the picture
     and the name under it are re-rendered sharp instead of scaled up soft, and
     its shadow stays its own size instead of becoming a big grey frame behind
     it. The top course grows downward only, so it can never reach the line of
     type above the field. */
  const RK = 2.3;
  function restyle(t) {
    const k = t.el.classList.contains('read') ? (t.big || RK) : 1;
    const w = t.w * k, h = t.h * k;
    t.el.style.width = w.toFixed(1) + 'px';
    t.el.style.height = h.toFixed(1) + 'px';
    t.el.style.left = (t.hx - (w - t.w) / 2).toFixed(1) + 'px';
    t.el.style.top = (t.row === 0 ? t.hy : t.hy - (h - t.h) / 2).toFixed(1) + 'px';
  }
  function tipOf(t) {                          // where its string is tied on
    const k = t.el.classList.contains('read') ? (t.big || RK) : 1;
    const w = t.w * k, h = t.h * k;
    return [t.hx - (w - t.w) / 2 + t.ox + w - 3,
            (t.row === 0 ? t.hy : t.hy - (h - t.h) / 2) + t.oy + h * .58];
  }
  function layout() {
    const W = G.w = hero.clientWidth, H = G.h = hero.clientHeight;
    if (!W || !H) return;

    /* The band is whatever the type leaves, measured off the title block rather
       than guessed at as a fraction of the viewport: the block is a fixed stack of
       lines at a fixed size, so on a short screen it takes a much larger share of
       one. It then runs the width of the page. The field and the press are given
       the same width, which is the only way equal outer margins and equal gaps on
       either side of the ring can both be true. */
    const tb = slide.querySelector('.title-block');
    const hr = hero.getBoundingClientRect();
    const top = tb ? tb.getBoundingClientRect().bottom - hr.top + 10 : H * 0.56;
    /* The ring gets to stand in the footer strip: its lower two words sit in the
       middle of the page and the footer only has type at its two ends. That is
       forty pixels of radius on a laptop, which is the difference between a ring
       and a badge. */
    const botRing = H - 64;
    const bandH = Math.max(140, botRing - top);
    const edge = Math.max(18, W * 0.02);
    const cx = W / 2;
    G.sk = Math.min(1.25, Math.max(.62, (W - 2 * edge) / 1480));

    /* The ring keeps the middle of the page and sits low in the band; the two sides
       ride above it. The whole thing reads as an arc rather than three things in a
       row, which is what "floating up at the edges" comes to in geometry. */
    /* Solved off the words, not guessed: the ring's centre hangs 1.229R above
       botRing, so the top of the word over it sits at botRing - 2.229R - 45.
       Requiring that to clear the type above is the whole constraint. */
    const R = Math.max(56, Math.min((botRing - top - 48) / 2.229,
                                    (W - 2 * edge) * 0.088, 152));
    const half = R + 106;                       // the ring plus the room its words take
    const cy = botRing - 1.229 * R - 4;         // low, in the empty middle of the footer
    /* What has to be equal is the gap either side of the ring, not the width of the
       two groups: a wide screen with fixed-width groups is three things thrown down
       apart from each other with a thread stretched between them. So the gap is set
       first, and each group then takes what its own contents come to, which for both
       of them is set by the height of the band. They come out close to the same size
       on their own, and the margins land close to equal without being made to. */
    const gap = Math.min(66, Math.max(28, (W - 2 * edge) * 0.028));
    const avail = Math.max(150, cx - half - gap - edge);
    cyBox.style.left = (cx - R) + 'px';
    cyBox.style.top = (cy - R) + 'px';
    cyBox.style.width = cyBox.style.height = (R * 2) + 'px';
    G.cx = cx; G.cy = cy; G.r = R;
    STAGES.forEach((st, i) => {
      const L = LAB[st.k], b = cyLabs[i];
      const x = cx + R * Math.cos(rad(st.a)), y = cy + R * Math.sin(rad(st.a));
      b.style.left = (x - cx + R + L.dx) + 'px';
      b.style.top = (y - cy + R + L.dy) + 'px';
      b.style.transform = `translate(${-L.ax * 100}%, ${-L.ay * 100}%)`;
    });
    const name = cyBox._name, said = cyBox._said;
    name.style.left = R + 'px';
    name.style.top = (R + R * 0.04) + 'px';
    name.style.fontSize = Math.max(14, R * 0.215).toFixed(1) + 'px';
    said.style.left = R + 'px';
    said.style.top = (R + R * 0.44) + 'px';
    said.style.fontSize = Math.max(8.5, R * 0.088).toFixed(1) + 'px';
    said.style.opacity = R > 104 ? '' : '0';

    /* Both groups get the same width, so the margins come out equal, and it is the
       width the field needs for four records across at the size the band's height
       allows. The press then deals into that same width. */
    /* Both sides get the same width, so the margins match, and it is set by the room
       there is rather than by how tall the records can be: tying it to the height is
       what made a 900-pixel-tall window come out as a narrow strip in a wide page. */
    const groupW = Math.min(avail, 640);
    G.ew = groupW;
    G.ex = cx - half - gap - groupW;

    /* And they float up past the band into the space either side of the button, which
       is much narrower than the sign above it. Only if they actually clear it: on a
       narrow page they stay under the type where they belong. */
    /* Measured off the button and the two links themselves, not off the box they sit
       in: that box is as wide as the title block, so testing against it says the sides
       never clear and they never float at all. */
    const bits = [...slide.querySelectorAll('.cta .go, .cta .read')].map(e => e.getBoundingClientRect());
    const hand = slide.querySelector('.hand'), hb = hand && hand.getBoundingClientRect();
    const cl = bits.length ? Math.min.apply(null, bits.map(r => r.left)) - hr.left : 0;
    const cR = bits.length ? Math.max.apply(null, bits.map(r => r.right)) - hr.left : W;
    const rx = cx + half + gap;
    const clear = bits.length && hb && (G.ex + groupW < cl - 18) && (rx > cR + 18);
    const sideTop = clear ? Math.max(hb.bottom - hr.top - 12, H * 0.25) : top;

    G.lift = 0;                                 // both sides sit level
    /* Both sides finish on the same line, and the line is half a background cell
       above the bottom of the circle: the mesh is on a 42-pixel pitch, so both
       groups sit 21 pixels proud of the ring, which reads as balanced rather
       than as either level or floating. */
    G.floor = cy + R - 6;
    G.ey = G.floor;                             // set properly once the grid is known
    G.eh = Math.max(120, Math.min(G.floor - sideTop, 440));
    // sized off the typical spacing, not the tightest pair: a couple may touch,
    // which is what a heap looks like, and none of them are stamps
    /* An oval heap, not a slab: lay a staggered grid one course larger than the
       room strictly needs, then keep only the cells nearest the middle of an
       ellipse. The corners fall away on their own, and the outline comes out
       roundish and a little ragged, the way a heap should be. */
    const cols = Math.max(5, Math.min(7, Math.ceil(G.ew / CELL)));
    const rows = Math.max(4, Math.min(6, Math.ceil(G.eh / CELL)));
    const oval = c => Math.pow((c[0] - .5) / .6, 2) + Math.pow((c[1] - .5) / .62, 2);
    G.cells = courses(cols, rows).sort((a, b) => oval(a) - oval(b)).slice(0, NTILE);
    G.cw = G.ew / cols; G.ch = G.eh / rows;
    G.tw = Math.min(G.cw, G.ch) * 0.87;        // and it still fits once it is turned
    // the lowest course lands on the floor, so both sides finish on one line
    G.ey = G.floor - G.eh + (G.ch - G.tw) / 2;
    tiles.forEach(place);
    relink();

    /* the press, one gap off the ring, standing in the middle of its own half so
       that dealing left and right from there stays inside the page. Its height is
       what the room between the field's top and the caption's arc allows. */
    const maxSw = Math.max(128, (H - 137 - sideTop - 48 * G.sk) / 1.32);
    G.sw = Math.min(252, Math.max(104, Math.min(groupW * 0.52, maxSw)));
    G.sh = G.sw * 1.32;
    const side = groupW;
    // the hand may spread a little past its own half when it opens; at rest it is
    // centred there, so the space either side of it matches
    G.fdx = Math.min(G.sw * 0.46, (side - G.sw) / 5.0);   // the hand stays on the page
    G.side = side;
    G.sx = rx + (side - G.sw) / 2;              // the sheet itself, not its room
    /* The pile stands lower than the field, astride the level line out of
       Report, and its caption's arc sits under it just clear of the footer.
       The sheets sit 24-scaled below G.sy inside their wrap and the back ones
       are turned a few degrees, so the room under them is measured from the
       true bottom corner, not from the box. */
    G.sy = (H - 103) - 40 - 24 * G.sk - G.sh;
    stackWrap.style.left = rx + 'px';
    stackWrap.style.top = (G.sy - 24 * G.sk) + 'px';
    stackWrap.style.width = side + 'px';
    stackWrap.style.height = (G.sh + 24 * G.sk + 26) + 'px';
    stack.forEach(sh => sizeSheet(sh));
    reseat(true);

    drawWires();
  }

  /* ---------- the wires, and the paper the corners sit on ------------------- */
  const GREY = '#2b3540';                      // ink at rest, red when carrying
  /* Every string is the same smooth bézier, out of the record and level into the
     node: at rest it is only just there, and being read only turns it red and
     heavy. Same track either way, which is what makes the lighting read as one
     string waking up rather than a different line appearing. */
  function cleanPath(x1, y1, x2, y2) {
    const l = Math.max(60, Math.abs(x2 - x1) * .42);
    return `M${x1.toFixed(1)} ${y1.toFixed(1)}C${(x1 + l * .6).toFixed(1)} ${y1.toFixed(1)},`
         + `${(x2 - l).toFixed(1)} ${y2.toFixed(1)},${x2.toFixed(1)} ${y2.toFixed(1)}`;
  }
  let wireOf = {}, outWires = [];
  function drawWires() {
    if (!G.w) return;
    wires.setAttribute('viewBox', `0 0 ${G.w} ${G.h}`);
    wiresTop.setAttribute('viewBox', `0 0 ${G.w} ${G.h}`);
    wires.innerHTML = '';
    wiresTop.innerHTML = '';
    wireOf = {}; outWires = [];
    const nx = G.cx + G.r * Math.cos(rad(198)), ny = G.cy + G.r * Math.sin(rad(198));
    const px = G.cx + G.r * Math.cos(rad(-18)), py = G.cy + G.r * Math.sin(rad(-18));
    const defs = el('defs');
    let dd = `<filter id="hsoft" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="20"/></filter>`;
    const ty = G.sy + 24 * G.sk + G.sh + 40;
    const t0 = G.sx - G.sw * 0.42, t1 = G.sx + G.sw * 1.42;

    /* Both lower corners go back to plain paper first: a blurred sheet of the
       page's own white, square to the page, under everything else in this svg.
       The mesh stops, the records sit on white, and being inside the svg it can
       never sit on top of the caption or the strings the way the old pools did. */
    const sheet = (x, y, w2, h2) => wires.appendChild(el('rect', { x: x.toFixed(1),
      y: y.toFixed(1), width: w2.toFixed(1), height: h2.toFixed(1), rx: 26,
      fill: '#fbfbfc', 'fill-opacity': .97, filter: 'url(#hsoft)' }));
    sheet(-70, G.ey - 46, 70 + G.ex + G.ew + 54, G.h - G.ey + 140);
    const rLeft = Math.min(G.sx - 56, t0 - 30), rTop = G.sy - 24 * G.sk - 38;
    sheet(rLeft, rTop, G.w - rLeft + 70, G.h - rTop + 90);

    /* One string per record, held at its own point on the node the way a handful
       of balloon strings is held in one hand, each with its own slack. The far
       end may be dragged about; the end on the ring never moves. */
    const lay = (d, key, cls) => {
      const base = el('path', { d, class: 'wire base' + (cls ? ' ' + cls : ''), stroke: GREY });
      const pair = { base };
      if (key != null) wireOf[key] = pair; else outWires.push(pair);
      return pair;
    };
    const pairs = [];
    const nr = 19.5 * (G.r / 118) + 2;
    const inx = nx - nr, outx = px + nr;
    /* every record on the floor gets its string: any of them can be the one
       being read, and a record lighting up with no line under it is a glitch */
    const src = tiles.map((t, si) => ({ si, t }))
      .filter(o => o.t.w)
      .map(({ si, t }) => { const p = tipOf(t); return { si, x: p[0], y: p[1] }; })
      .sort((a, b) => a.y - b.y);
    src.forEach(o => {
      const pr = lay(cleanPath(o.x, o.y, inx, ny), o.si);
      pr.end = [inx, ny];
      pairs.push(pr);
    });
    /* Report to the pile: one short heavy arrow floating in the gap, touching
       neither the ring nor the paper. It flashes red for a beat every time
       another paper comes off the press. */
    const span = (G.sx - 30) - outx;
    const a1 = outx + span * .22, a2 = outx + span * .64;
    pairs.push(lay(`M${a1.toFixed(1)} ${py.toFixed(1)}L${a2.toFixed(1)} ${py.toFixed(1)}`,
      null, 'spine'));
    // a solid arrowhead where each run finishes, so the way round is never in doubt
    const head = (x, y, c, o, s) => {
      const L = 13 * (s || 1), W2 = 6.4 * (s || 1);
      const a = el('path', { d: `M${(x - L).toFixed(1)} ${(y - W2).toFixed(1)}L${x.toFixed(1)} ${y.toFixed(1)}`
        + `L${(x - L).toFixed(1)} ${(y + W2).toFixed(1)}Z`, fill: c, 'fill-opacity': o });
      wires.appendChild(a);
      return a;
    };
    // and the thing the papers are, said once, level under the pile
    dd += `<linearGradient id="scG" gradientUnits="userSpaceOnUse" x1="${t0}" y1="0" x2="${t1}" y2="0">
             <stop offset="0" stop-color="#ef476f"/><stop offset=".28" stop-color="#f28e2b"/>
             <stop offset=".55" stop-color="#00a890"/><stop offset=".78" stop-color="#934bed"/>
             <stop offset="1" stop-color="#184878"/></linearGradient>`;
    defs.innerHTML = dd;
    wires.appendChild(defs);
    const cap = el('text', { 'font-family': 'Noto Serif, Georgia, serif',
      'font-size': Math.max(12, G.sw * 0.082).toFixed(1), 'font-weight': 700,
      'letter-spacing': '.05em', fill: 'url(#scG)',
      x: (G.sx + G.sw / 2).toFixed(1), y: ty.toFixed(1), 'text-anchor': 'middle' });
    cap.textContent = 'Scientific discovery';
    wires.appendChild(cap);
    pairs.forEach(p => wires.appendChild(p.base));
    head(inx + 2, ny, '#ef476f', .92);
    if (outWires[0]) outWires[0].head = head(a2 + 30, py, GREY, .92, 2.3);
    if (litKey != null) light(litKey);
  }
  /* Worked out from where the record is known to be, not measured off the page:
     asking for a bounding box forces a synchronous layout, and doing that ten times
     a frame while something is being dragged is exactly how a drag feels sticky. */
  function restring() {                        // same strings, new ends
    for (const si in wireOf) {
      const p = wireOf[si], t = tiles[si];
      if (!p.end || !t || !t.w) continue;
      const tp = tipOf(t);
      p.base.setAttribute('d', cleanPath(tp[0], tp[1], p.end[0], p.end[1]));
    }
  }

  // one string at a time is the one carrying something, and it is the one whose
  // record is being read. Lit is a class: the stroke turns red and heavy in CSS.
  let litKey = null;
  function light(key) {
    const wasT = litKey != null ? tiles[litKey] : null;
    const wasW = wireOf[litKey];
    if (wasW && key !== litKey) { wasW.base.classList.remove('lit'); wires.appendChild(wasW.base); }
    litKey = key;
    const now = wireOf[key];
    /* the carrying string rides in the overlay layer, over every resting record;
       only the record it belongs to and the ring stand above it */
    if (now) { now.base.classList.add('lit'); wiresTop.appendChild(now.base); }
    tiles.forEach((t, j) => t.el.classList.toggle('read', j === key));
    if (wasT) restyle(wasT);
    const t = tiles[key];
    if (t && t.w) {
      restyle(t);
      // the line above answers to the record being read below, on the same beat
      if (eqShow && t.disc) eqShow(t.pmod || t.mod, t.disc);
    }
    restring();                                // the lit string drops its slack
  }
  let flashTimer = 0;
  function flashOut() {                        // one beat of red as a paper lands
    const w = outWires[0];
    if (!w) return;
    w.base.classList.add('lit');
    if (w.head) w.head.setAttribute('fill', '#ef476f');
    clearTimeout(flashTimer);
    flashTimer = setTimeout(() => {
      w.base.classList.remove('lit');
      if (w.head) w.head.setAttribute('fill', GREY);
    }, 900);
  }

  /* ---------- one clock for all of it -------------------------------------- */
  const PER = 3000;                            // milliseconds a stage holds the loop
  let clock = 0, last = 0, raf = 0, at = -1, litAt = -1, live = true;

  function stageChange(i) {
    cyNodes.forEach((g, k) => g.classList.toggle('on', k === i));
    cyLabs.forEach((b, k) => b.classList.toggle('on', k === i));
    comet.style.color = STAGES[i].c;
    if (i === 0) {                             // Perceive picks a record up
      const j = Math.floor(Math.random() * tiles.length);
      setTimeout(() => dress(tiles[j], nextCase(tiles[j])), 900);
    }
    if (i === 3) { press(false); flashOut(); }  // Report: another paper is finished
  }
  function frame(now) {
    if (last) clock += Math.min(80, now - last);
    last = now;
    const p = (clock % (PER * 5)) / (PER * 5);
    comet.setAttribute('transform', `rotate(${(198 - p * 360).toFixed(2)} 118 118)`);
    physics();
    const i = Math.floor(p * 5) % 5;
    if (i !== at) { at = i; stageChange(i); }
    const li = Math.floor(clock / 2600);       // a different record every 2.6 seconds
    if (li !== litAt) {
      // drawn at random from the whole floor, never the same one twice running.
      // An empty draw does not use the turn up: the first record to land gets lit
      // on the next frame rather than after a full beat of nothing.
      const cand = [];
      tiles.forEach((t, j) => { if (t.w && t.up && j !== litKey) cand.push(j); });
      if (cand.length) { litAt = li; light(cand[Math.floor(Math.random() * cand.length)]); }
    }
    raf = requestAnimationFrame(frame);
  }
  function start() { if (raf || slow || !live) return; last = 0; raf = requestAnimationFrame(frame); }
  function stop() { cancelAnimationFrame(raf); raf = 0; }
  function hold(on) { hero.classList.toggle('hold', on); on ? stop() : start(); }

  // the deck says which slide is being looked at; off the title, nothing moves
  window.__heroLive = on => { if (on === live) return; live = on; hold(!on); };

  /* ---------- go ----------------------------------------------------------- */
  addEventListener('resize', layout);
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(layout, layout);
  layout();
  for (let i = 0; i < 7; i++) press(true);      // open with a hand already dealt
  layout();                                    // the readout has a height now
  if (slow) { stageChange(0); comet.setAttribute('transform', 'rotate(198 118 118)'); }
  else start();
})();
