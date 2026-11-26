// Align: the matching, as pure functions. No LUNA here.
//
// Both tracks arrive as envelopes on the same even grid (`ms` per point, linear peaks, null where
// no clip plays). We compare their shapes, not their sound: each envelope becomes a dB curve,
// normalised to its own loudness, plus how fast it rises (onsets weigh most: they are what the
// ear hears as timing). Dynamic time warping inside a band (the double is never more than
// `maxShift` ms away from the lead) finds, for every moment of the double, the moment of the lead
// it belongs to. From that path we cut the double into pieces at its onsets (and at least every
// `maxPiece` ms) and give each piece its target span on the lead's timeline.

(function (root) {
  const FLOOR = -60;
  const toDb = (x) => (x == null ? null : x > 1e-6 ? Math.max(FLOOR, 20 * Math.log10(x)) : FLOOR);

  /** dB curve, lightly smoothed, normalised so its loud parts sit near 1 and silence near 0. */
  function features(peaks) {
    const n = peaks.length, db = new Float32Array(n);
    let top = FLOOR;
    for (let i = 0; i < n; i++) { const d = toDb(peaks[i]); db[i] = d == null ? FLOOR : d; if (db[i] > top) top = db[i]; }
    // Smooth over ~3 points; the overview's peak per point is jumpy.
    const sm = new Float32Array(n);
    for (let i = 0; i < n; i++) { let s = 0, c = 0; for (let k = -1; k <= 1; k++) { const j = i + k; if (j >= 0 && j < n) { s += db[j]; c++; } } sm[i] = s / c; }
    const span = Math.max(12, top - FLOOR);
    const lv = new Float32Array(n), rise = new Float32Array(n);
    for (let i = 0; i < n; i++) lv[i] = Math.max(0, (sm[i] - (top - span)) / span);
    for (let i = 0; i < n; i++) rise[i] = Math.max(0, lv[i] - (i ? lv[i - 1] : lv[i])) * 4;
    return { lv, rise };
  }

  /**
   * Banded DTW. Returns map[j] = the lead point for double point j (monotonic, fractional).
   * band in points. Steps allowed: diagonal, and one-sided steps with a small penalty so the path
   * does not wander in silence.
   */
  function warp(lead, dbl, band) {
    const n = dbl.lv.length, m = lead.lv.length, W = 2 * band + 1, INF = 1e30;
    const D = new Float64Array(n * W).fill(INF), from = new Int8Array(n * W);
    const cost = (j, i) => Math.abs(dbl.lv[j] - lead.lv[i]) + Math.abs(dbl.rise[j] - lead.rise[i]);
    const idx = (j, i) => j * W + (i - j + band);
    const ok = (j, i) => i >= 0 && i < m && Math.abs(i - j) <= band;
    const PEN = 0.05;
    for (let j = 0; j < n; j++) {
      for (let i = Math.max(0, j - band); i <= Math.min(m - 1, j + band); i++) {
        const c = cost(j, i);
        if (j === 0 && i <= band) { D[idx(j, i)] = c + i * PEN; from[idx(j, i)] = 0; continue; }
        let best = INF, f = 0;
        if (j > 0 && i > 0 && ok(j - 1, i - 1)) { const v = D[idx(j - 1, i - 1)]; if (v < best) { best = v; f = 0; } }
        if (j > 0 && ok(j - 1, i)) { const v = D[idx(j - 1, i)] + PEN; if (v < best) { best = v; f = 1; } }
        if (i > 0 && ok(j, i - 1)) { const v = D[idx(j, i - 1)] + PEN; if (v < best) { best = v; f = 2; } }
        D[idx(j, i)] = best + c; from[idx(j, i)] = f;
      }
    }
    // End anywhere in the band on the last double point.
    let i = Math.min(m - 1, n - 1 + band), bi = i, bv = INF;
    for (let k = Math.max(0, n - 1 - band); k <= Math.min(m - 1, n - 1 + band); k++) { const v = D[idx(n - 1, k)] + Math.abs(k - (n - 1)) * PEN; if (v < bv) { bv = v; bi = k; } }
    // Walk back; for each double point average the lead points it was matched to.
    const sum = new Float64Array(n), cnt = new Float64Array(n);
    let j = n - 1; i = bi;
    while (j >= 0 && i >= 0) {
      sum[j] += i; cnt[j]++;
      const f = from[idx(j, i)];
      if (j === 0 && f === 0) break;
      if (f === 0) { j--; i--; } else if (f === 1) j--; else i--;
      if (i < 0) break;
    }
    const map = new Float64Array(n);
    for (let k = 0; k < n; k++) map[k] = cnt[k] ? sum[k] / cnt[k] : (k ? map[k - 1] + 1 : 0);
    for (let k = 1; k < n; k++) if (map[k] < map[k - 1]) map[k] = map[k - 1];
    return map;
  }

  /** Light smoothing of the shift (map[j] - j) so single-point jitter does not make cuts. */
  function smoothShift(map, r) {
    const n = map.length, out = new Float64Array(n);
    for (let j = 0; j < n; j++) { let s = 0, c = 0; for (let k = Math.max(0, j - r); k <= Math.min(n - 1, j + r); k++) { s += map[k] - k; c++; } out[j] = j + s / c; }
    for (let k = 1; k < n; k++) if (out[k] < out[k - 1] + 0.05) out[k] = out[k - 1] + 0.05;
    return out;
  }

  /**
   * Pieces of the double: [{a, b, ta, tb}] in points: the double span [a, b) goes to [ta, tb) on
   * the lead's grid. Cuts at the double's onsets and silences, at most every maxPiece points;
   * neighbouring pieces whose shift differs by less than `still` points merge (a plain move).
   */
  function pieces(dblPeaks, dblF, map, o) {
    const n = map.length, strength = o.strength ?? 1;
    const tgt = (j) => j + strength * ((j < n ? map[j] : map[n - 1] + (j - n + 1)) - j);
    // Where the double plays at all.
    const cuts = new Set([0, n]);
    let last = 0;
    for (let j = 1; j < n; j++) {
      const on = dblPeaks[j] != null, was = dblPeaks[j - 1] != null;
      if (on !== was) { cuts.add(j); last = j; continue; }
      const onset = dblF.rise[j] > 0.5 && dblF.rise[j] >= dblF.rise[j - 1] && (j + 1 >= n || dblF.rise[j] >= dblF.rise[j + 1]);
      if ((onset && j - last >= o.minPiece) || j - last >= o.maxPiece) { cuts.add(j); last = j; }
    }
    const cs = [...cuts].sort((a, b) => a - b);
    let out = [];
    for (let k = 0; k + 1 < cs.length; k++) {
      const a = cs[k], b = cs[k + 1];
      if (dblPeaks[a] == null) continue;                    // no clip here: nothing to move
      out.push({ a, b, ta: tgt(a), tb: tgt(b) });
    }
    // Make targets contiguous where the pieces are (rounding), and merge near-equal shifts.
    const merged = [];
    for (const p of out) {
      const q = merged[merged.length - 1];
      if (q && q.b === p.a && Math.abs((p.ta - p.a) - (q.ta - q.a)) < o.still && Math.abs((p.tb - p.b) - (q.tb - q.b)) < o.still && Math.abs((q.tb - q.b) - (q.ta - q.a)) < o.still) { q.b = p.b; q.tb = p.tb; }
      else merged.push({ ...p });
    }
    out = merged;
    return out;
  }


  /**
   * Fewer, smarter pieces: the shift (target − source) of each stretch of clip is approximated by
   * straight lines, and only split where a line would miss what is sung by more than `tol` points.
   * A straight shift is one move plus one even stretch, so each line is one piece. Splits land on
   * the quietest point nearby (between syllables), never closer than `minLen` to another cut.
   */
  function linePieces(dblPeaks, dblF, map, o) {
    const n = map.length, strength = o.strength ?? 1;
    const sh = (j) => strength * ((j < n ? map[j] : map[n - 1] + (j - n + 1)) - j);
    const out = [];
    const quietest = (lo, hi, at) => { let best = at, bv = Infinity; for (let j = Math.max(lo, at - o.snap); j <= Math.min(hi, at + o.snap); j++) { const v = dblF.lv[j] ?? 1; if (v < bv) { bv = v; best = j; } } return best; };
    const split = (a, b) => {
      const sa = sh(a), sb = sh(b);
      let worst = -1, wv = o.tol;
      for (let j = a + 1; j < b; j++) {
        if (dblF.lv[j] < 0.12) continue;                    // silence: where it lands does not matter
        const line = sa + ((sb - sa) * (j - a)) / (b - a), d = Math.abs(sh(j) - line);
        if (d > wv) { wv = d; worst = j; }
      }
      if (worst < 0 || b - a < 2 * o.minLen) { out.push({ a, b, ta: a + sa, tb: b + sb }); return; }
      const c = quietest(a + o.minLen, b - o.minLen, Math.min(b - o.minLen, Math.max(a + o.minLen, worst)));
      split(a, c); split(c, b);
    };
    for (let j = 0; j < n;) {
      if (dblPeaks[j] == null) { j++; continue; }
      let k = j; while (k < n && dblPeaks[k] != null) k++;
      const first = out.length;
      split(j, k);
      // The first and last piece of a stretch of clip only move: the match is least sure at a
      // clip's edges, and those edges have no neighbour to join, so no stretch is needed there.
      const f = out[first], l = out[out.length - 1];
      if (out.length - first > 1) {
        f.ta = f.tb - (f.b - f.a);
        l.tb = l.ta + (l.b - l.a);
      } else { const m = (f.ta - f.a + f.tb - f.b) / 2; f.ta = f.a + m; f.tb = f.b + m; }
      j = k;
    }
    return out;
  }

  /** How far apart the onsets of two envelopes are, on average, in points (for the before/after readout). */
  function onsetGap(leadF, dblF, map) {
    let s = 0, c = 0;
    for (let j = 1; j < dblF.rise.length; j++) {
      if (dblF.rise[j] > 0.5 && dblF.rise[j] >= dblF.rise[j - 1]) { s += Math.abs(map[j] - j); c++; }
    }
    return c ? s / c : 0;
  }

  /** The double's envelope as it will sound after the pieces move: for drawing. */
  function warped(dblPeaks, ps, n) {
    const out = new Array(n).fill(null);
    for (const p of ps) {
      const len = p.b - p.a, tl = p.tb - p.ta;
      if (tl <= 0) continue;
      for (let t = Math.max(0, Math.floor(p.ta)); t < Math.min(n, Math.ceil(p.tb)); t++) {
        const src = p.a + ((t - p.ta) / tl) * len;
        const v = dblPeaks[Math.min(p.b - 1, Math.max(p.a, Math.round(src)))];
        if (v != null) out[t] = Math.max(out[t] ?? 0, v);
      }
    }
    return out;
  }

  function align(leadPeaks, dblPeaks, ms, o) {
    const lead = features(leadPeaks), dbl = features(dblPeaks);
    const band = Math.max(2, Math.round(o.maxShift / ms));
    const raw = warp(lead, dbl, band);
    const map = smoothShift(raw, Math.max(1, Math.round(15 / ms)));
    const ps = linePieces(dblPeaks, dbl, map, { strength: o.strength, tol: (o.tol ?? 5) / ms, minLen: Math.round((o.minPiece ?? 60) / ms), snap: Math.round(40 / ms) });
    const before = onsetGap(lead, dbl, map) * ms;
    // What is left: for every sung point of the double, how far its piece puts it from where the
    // match says it belongs.
    let ae = 0, ac = 0;
    for (const p of ps) for (let j = p.a; j < p.b; j++) {
      if (dbl.lv[j] < 0.12 || dbl.rise[j] <= 0.5) continue;
      const to = p.ta + ((j - p.a) * (p.tb - p.ta)) / Math.max(1, p.b - p.a);
      ae += Math.abs(to - map[j]); ac++;
    }
    const after = ac ? (ae / ac) * ms : 0;
    return { map, pieces: ps, before, after, moved: ps.filter((p) => Math.abs(p.ta - p.a) > 0.25 || Math.abs(p.tb - p.b) > 0.25).length };
  }

  root.AlignCore = { features, warp, smoothShift, pieces, linePieces, warped, align, toDb };
})(typeof window !== 'undefined' ? window : globalThis);
