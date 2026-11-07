/* WebFT8 core: FT8 message packing (77 bits), CRC-14, LDPC (174,91) encoder and decoder (belief
   propagation + ordered-statistics), GFSK synthesis, and a multi-pass decoder with signal subtraction.
   No DOM, no dependencies. Runs in a page, a Web Worker, or Node.js.
   The LDPC matrices are the public FT8 code (WSJT-X); table layout as in ft8_lib (MIT, Karlis Goba). */
(function (root) {
  'use strict';
  const TWO_PI = 6.283185307179586;
  const COSTAS = [3, 1, 4, 0, 6, 5, 2];
  const GRAY = [0, 1, 3, 2, 5, 6, 4, 7];
  const NN = 79, ND = 58, NSYNC = 7;
  const SYM_T = 0.16, TONE_DF = 6.25, SLOT = 15;
  const FS = 12800, NSPS = 2048;           // internal decoder rate: 2048 samples per symbol
  const MAX22 = 4194304, NTOKENS = 2063592, MAXGRID4 = 32400;

  const GEN = ['8329ce11bf31eaf509f27fc0','761c264e25c2593354931320','dc265902fb277c6410a1bdc0','1b3f417858cd2dd33ec7f620','09fda4fee04195fd034783a0','077cccc11b8873ed5c3d48a0','29b62afe3ca036f4fe1a9da0','6054faf5f35d96d3b0c8c3e0','e20798e4310eed27884ae900','775c9c08e80e26ddae563180','b0b811028c2bf997213487c0','18a0c9231fc60adf5c5ea320','76471e8302a0721e01b12b80','ffbccb80ca8341fafb47b2e0','66a72a158f9325a2bf671700','c4243689fe85b1c51363a180','0dff739414d1a1b34b1c2700','15b48830636c8b99894972e0','29a89c0d3de81d665489b0e0','4f126f37fa51cbe61bd6b940','99c47239d0d97d3c84e09400','1919b75119765621bb4f1e80','09db12d731faee0b86df6b80','488fc33df43fbdeea4eafb40','827423ee40b675f756eb5fe0','abe197c484cb74757144a9a0','2b500e4bc0ec5a6d2bdbdd00','c474aa53d702187616693600','8eba1a13db3390bd6718cec0','753844673a27782cc42012e0','06ff83a145c37035a5c12680','3b37417858cc2dd33ec3f620','9a4a5a28ee17ca9c324842c0','bc29f465309c977e89610a40','2663ae6ddf8b5ce2bb294880','46f231efe457034c18144180','3fb2ce85abe9b0c72e06fbe0','de87481f282c153971a0a2e0','fcd7ccf23c69fa99bba14120','f0261447e9490ca8e474cec0','4410115818196f95cdd70120','088fc31df4bfbde2a4eafb40','b8fef1b6307729fb0a078c00','5afea7acccb77bbc9d99a900','49a7016ac653f65ecdc90760','1944d085be4e7da8d6cc7d00','251f62adc4032f0ee7140020','56471f8702a0721e00b12b80','2b8e4923f2dd51e2d537fa00','6b550a40a66f4755de95c260','a18ad28d4e27fe92a4f6c840','10c2e586388cb82a3d807580','ef34a41817ee02133db2eb00','7e9c0c54325a9c15836e0000','3693e572d1fde4cdf079e860','bfb2cec5abe1b0c72e07fbe0','7ee18230c583cccc57d4b080','a066cb2fedafc9f526641260','bb23725abc47cc5f4cc4cd20','ded9dba3bee40c59b5609b40','d9a7016ac653e6decdc90360','9ad46aed5f707f280ab5fc40','e5921c77822587316d7d3c20','4f14da8242a8b86dca733520','8b8b507ad467d4441df770e0','22831c9cf1169467ad04b680','213b838fe2ae54c38ee71800','5d926b6dd71f085181a4e120','66ab79d4b29ee6e69509e560','958148682d748a38dd68baa0','b8ce020cf069c32a723ab140','f4331d6d461607e957527460','6da23ba424b9596133cf9c80','a636bcbc7b30c5fbeae67fe0','5cb0d86a07df654a9089a200','f11f106848780fc9ecdd80a0','1fbb5364fb8d2c9d730d5ba0','fcb86bc70a50c9d02a5d0340','a534433029eac15f322e34c0','c989d9c7c3d3b8c55d751300','7bb38b2f0186d46643ae9620','2644ebadeb44b9467d1f42c0','608cc857594bfbb55d696000'];
  const NM = [[3,30,58,90,91,95,152],[4,31,59,92,114,145],[5,23,60,93,121,150],[6,32,61,94,95,142],[7,24,62,82,92,95,147],[5,31,63,96,125,137],[4,33,64,77,97,106,153],[8,34,65,98,138,145],[9,35,66,99,106,125],[10,36,66,86,100,138,157],[11,37,67,101,104,154],[12,38,68,102,148,161],[7,39,69,81,103,113,144],[13,40,70,87,101,122,155],[14,41,58,105,122,158],[0,32,71,105,106,156],[15,42,72,107,140,159],[16,36,73,80,108,130,153],[10,43,74,109,120,165],[44,54,63,110,129,160,172],[7,45,70,111,118,165],[17,35,75,88,112,113,142],[18,37,76,103,115,162],[19,46,69,91,137,164],[1,47,73,112,127,159],[20,44,77,82,116,120,150],[21,46,57,117,126,163],[15,38,61,111,133,157],[22,42,78,119,130,144],[18,34,58,72,109,124,160],[19,35,62,93,135,160],[13,30,78,97,131,163],[2,43,79,123,126,168],[18,45,80,116,134,166],[6,48,57,89,99,104,167],[11,49,60,117,118,143],[12,50,63,113,117,156],[23,51,75,128,147,148],[24,52,68,89,100,129,155],[19,45,64,79,119,139,169],[20,53,76,99,139,170],[34,81,132,141,170,173],[13,29,82,112,124,169],[3,28,67,119,133,172],[0,3,51,56,85,135,151],[25,50,55,90,121,136,167],[51,83,109,114,144,167],[6,49,80,98,131,172],[22,54,66,94,171,173],[25,40,76,108,140,147],[1,26,40,60,61,114,132],[26,39,55,123,124,125],[17,48,54,123,140,166],[5,32,84,107,115,155],[27,47,69,84,104,128,157],[8,53,62,130,146,154],[21,52,67,108,120,173],[2,12,47,77,94,122],[30,68,132,149,154,168],[11,42,65,88,96,134,158],[4,38,74,101,135,166],[1,53,85,100,134,163],[14,55,86,107,118,170],[9,43,81,90,110,143,148],[22,33,70,93,126,152],[10,48,87,91,141,156],[28,33,86,96,146,161],[29,49,59,85,136,141,161],[9,52,65,83,111,127,164],[21,56,84,92,139,158],[27,31,71,102,131,165],[27,28,83,87,116,142,149],[0,25,44,79,127,146],[16,26,88,102,115,152],[50,56,97,162,164,171],[20,36,72,137,151,168],[15,46,75,129,136,153],[2,23,29,71,103,138],[8,39,89,105,133,150],[14,57,59,73,110,149,162],[17,41,78,143,145,151],[24,37,64,98,121,159],[16,41,74,128,169,171]];
  const MN = [[15,44,72],[24,50,61],[32,57,77],[0,43,44],[1,6,60],[2,5,53],[3,34,47],[4,12,20],[7,55,78],[8,63,68],[9,18,65],[10,35,59],[11,36,57],[13,31,42],[14,62,79],[16,27,76],[17,73,82],[21,52,80],[22,29,33],[23,30,39],[25,40,75],[26,56,69],[28,48,64],[2,37,77],[4,38,81],[45,49,72],[50,51,73],[54,70,71],[43,66,71],[42,67,77],[0,31,58],[1,5,70],[3,15,53],[6,64,66],[7,29,41],[8,21,30],[9,17,75],[10,22,81],[11,27,60],[12,51,78],[13,49,50],[14,80,82],[16,28,59],[18,32,63],[19,25,72],[20,33,39],[23,26,76],[24,54,57],[34,52,65],[35,47,67],[36,45,74],[37,44,46],[38,56,68],[40,55,61],[19,48,52],[45,51,62],[44,69,74],[26,34,79],[0,14,29],[1,67,79],[2,35,50],[3,27,50],[4,30,55],[5,19,36],[6,39,81],[7,59,68],[8,9,48],[10,43,56],[11,38,58],[12,23,54],[13,20,64],[15,70,77],[16,29,75],[17,24,79],[18,60,82],[21,37,76],[22,40,49],[6,25,57],[28,31,80],[32,39,72],[17,33,47],[12,41,63],[4,25,42],[46,68,71],[53,54,69],[44,61,67],[9,62,66],[13,65,71],[21,59,73],[34,38,78],[0,45,63],[0,23,65],[1,4,69],[2,30,64],[3,48,57],[0,3,4],[5,59,66],[6,31,74],[7,47,81],[8,34,40],[9,38,61],[10,13,60],[11,70,73],[12,22,77],[10,34,54],[14,15,78],[6,8,15],[16,53,62],[17,49,56],[18,29,46],[19,63,79],[20,27,68],[21,24,42],[12,21,36],[1,46,50],[22,53,73],[25,33,71],[26,35,36],[20,35,62],[28,39,43],[18,25,56],[2,45,81],[13,14,57],[32,51,52],[29,42,51],[5,8,51],[26,32,64],[24,68,72],[37,54,82],[19,38,76],[17,28,55],[31,47,70],[41,50,58],[27,43,78],[33,59,61],[30,44,60],[45,67,76],[5,23,75],[7,9,77],[39,40,69],[16,49,52],[41,65,67],[3,21,71],[35,63,80],[12,28,46],[1,7,80],[55,66,72],[4,37,49],[11,37,63],[58,71,79],[2,25,78],[44,75,80],[0,64,73],[6,17,76],[10,55,58],[13,38,53],[15,36,65],[9,27,54],[14,59,69],[16,24,81],[19,29,30],[11,66,67],[22,74,79],[26,31,61],[23,68,74],[18,20,70],[33,52,60],[34,45,46],[32,58,75],[39,42,82],[40,41,62],[48,74,82],[19,43,47],[41,48,56]];

  /* ---------------- LDPC tables ---------------- */
  const GENB = GEN.map(h => { const r = new Uint8Array(91); for (let j = 0; j < 91; j++) r[j] = (parseInt(h[j >> 2], 16) >> (3 - (j & 3))) & 1; return r; });
  const GEN_IDX = GENB.map(r => { const a = []; for (let j = 0; j < 91; j++) if (r[j]) a.push(j); return Int16Array.from(a); });
  // edges: check m has NM[m].length vars; var n has 3 checks
  const NCHK = 83, NVAR = 174;
  const CHK_START = new Int32Array(NCHK + 1);
  for (let m = 0; m < NCHK; m++) CHK_START[m + 1] = CHK_START[m] + NM[m].length;
  const NEDGE = CHK_START[NCHK];
  const EDGE_VAR = new Int16Array(NEDGE);
  for (let m = 0; m < NCHK; m++) NM[m].forEach((n, k) => { EDGE_VAR[CHK_START[m] + k] = n; });
  const VAR_EDGE = new Int32Array(NVAR * 3);
  { const cnt = new Uint8Array(NVAR); for (let e = 0; e < NEDGE; e++) { const n = EDGE_VAR[e]; VAR_EDGE[n * 3 + cnt[n]++] = e; } }

  /* ---------------- CRC-14 ---------------- */
  function crc14(bits, n) { // bits: 0/1 array, MSB first; n bits processed (77 message bits + 5 zero bits = 82)
    let r = 0;
    for (let i = 0; i < n; i++) {
      const b = i < bits.length ? bits[i] : 0;
      r ^= b << 13;
      r = (r & 0x2000) ? ((r << 1) ^ 0x2757) : (r << 1);
    }
    return r & 0x3fff;
  }
  function crcOk(cw) { // cw: >= 91 bits; 77 msg + 14 crc
    let r = 0;
    for (let i = 0; i < 82; i++) { const b = i < 77 ? cw[i] : 0; r ^= b << 13; r = (r & 0x2000) ? ((r << 1) ^ 0x2757) : (r << 1); }
    r &= 0x3fff;
    let c = 0; for (let i = 77; i < 91; i++) c = (c << 1) | cw[i];
    return r === c;
  }

  /* ---------------- LDPC encode ---------------- */
  function ldpcEncode(a91) {
    const cw = new Uint8Array(174);
    cw.set(a91.subarray ? a91.subarray(0, 91) : a91.slice(0, 91));
    for (let i = 0; i < 83; i++) { let s = 0; const ix = GEN_IDX[i]; for (let k = 0; k < ix.length; k++) s ^= a91[ix[k]]; cw[91 + i] = s; }
    return cw;
  }
  function bits77ToTones(b77) {
    const a91 = new Uint8Array(91); a91.set(b77);
    const c = crc14(a91, 82); for (let i = 0; i < 14; i++) a91[77 + i] = (c >> (13 - i)) & 1;
    const cw = ldpcEncode(a91);
    const tones = new Uint8Array(NN);
    for (let i = 0; i < 7; i++) { tones[i] = COSTAS[i]; tones[36 + i] = COSTAS[i]; tones[72 + i] = COSTAS[i]; }
    for (let d = 0; d < ND; d++) {
      const v = (cw[3 * d] << 2) | (cw[3 * d + 1] << 1) | cw[3 * d + 2];
      tones[d < 29 ? 7 + d : 14 + d] = GRAY[v];
    }
    return tones;
  }

  /* ---------------- LDPC decode: belief propagation ---------------- */
  const bpTov = new Float64Array(NEDGE), bpToc = new Float64Array(NEDGE), bpZn = new Float64Array(NVAR), bpT = new Float64Array(8);
  function bpDecode(llr, maxIter = 30) {
    const tov = bpTov, toc = bpToc, zn = bpZn; tov.fill(0);
    const cw = new Uint8Array(NVAR);
    let ncLast = 999, ncnt = 0;
    for (let it = 0; it <= maxIter; it++) {
      for (let n = 0; n < NVAR; n++) zn[n] = llr[n] + tov[VAR_EDGE[n * 3]] + tov[VAR_EDGE[n * 3 + 1]] + tov[VAR_EDGE[n * 3 + 2]];
      for (let n = 0; n < NVAR; n++) cw[n] = zn[n] > 0 ? 1 : 0;
      let ncheck = 0;
      for (let m = 0; m < NCHK; m++) { let s = 0; for (let e = CHK_START[m]; e < CHK_START[m + 1]; e++) s ^= cw[EDGE_VAR[e]]; ncheck += s; }
      if (ncheck === 0) {
        if (crcOk(cw)) { let nh = 0; for (let n = 0; n < NVAR; n++) if (cw[n] !== (llr[n] > 0 ? 1 : 0)) nh++; return { cw, iter: it, nhard: nh }; }
        return null;
      }
      if (it > 0) { const nd = ncheck - ncLast; ncnt = nd < 0 ? 0 : ncnt + 1; if (ncnt >= 5 && it >= 10 && ncheck > 15) return null; }
      ncLast = ncheck;
      for (let e = 0; e < NEDGE; e++) toc[e] = zn[EDGE_VAR[e]] - tov[e];
      for (let m = 0; m < NCHK; m++) {
        const a = CHK_START[m], b = CHK_START[m + 1], k = b - a;
        for (let i = 0; i < k; i++) bpT[i] = Math.tanh(-toc[a + i] / 2);
        for (let i = 0; i < k; i++) {
          let p = 1; for (let j = 0; j < k; j++) if (j !== i) p *= bpT[j];
          let x = -p; if (x > 0.999999) x = 0.999999; else if (x < -0.999999) x = -0.999999;
          tov[a + i] = 2 * Math.atanh(x);
        }
      }
    }
    return null;
  }

  /* ---------------- LDPC decode: ordered statistics (OSD) ---------------- */
  const W = 6; // 32-bit words per 174-bit row
  const GROWS = (() => { // systematic generator: row k = message bit k
    const g = [];
    for (let k = 0; k < 91; k++) {
      const r = new Uint32Array(W); r[k >> 5] |= 1 << (k & 31);
      for (let i = 0; i < 83; i++) if (GENB[i][k]) { const c = 91 + i; r[c >> 5] |= 1 << (c & 31); }
      g.push(r);
    }
    return g;
  })();
  const getb = (r, c) => (r[c >> 5] >>> (c & 31)) & 1;
  function rowCrcOk(r) { const cw = new Uint8Array(91); for (let i = 0; i < 91; i++) cw[i] = getb(r, i); return crcOk(cw); }
  function osdDecode(llr, order2 = 0) {
    const hard = new Uint32Array(W), rel = new Float64Array(NVAR);
    for (let n = 0; n < NVAR; n++) { rel[n] = Math.abs(llr[n]); if (llr[n] > 0) hard[n >> 5] |= 1 << (n & 31); }
    const perm = Array.from({ length: NVAR }, (_, i) => i).sort((a, b) => rel[b] - rel[a]);
    const M = GROWS.map(r => r.slice());
    const piv = []; let np = 0;
    for (let pi = 0; pi < NVAR && np < 91; pi++) {
      const c = perm[pi], w = c >> 5, bit = 1 << (c & 31);
      let r = -1; for (let i = np; i < 91; i++) if (M[i][w] & bit) { r = i; break; }
      if (r < 0) continue;
      if (r !== np) { const t = M[r]; M[r] = M[np]; M[np] = t; }
      const P = M[np];
      for (let i = 0; i < 91; i++) if (i !== np && (M[i][w] & bit)) { const R = M[i]; for (let q = 0; q < W; q++) R[q] ^= P[q]; }
      piv.push(c); np++;
    }
    if (np < 91) return null;
    const c0 = new Uint32Array(W);
    for (let k = 0; k < 91; k++) if (getb(hard, piv[k])) for (let q = 0; q < W; q++) c0[q] ^= M[k][q];
    const cost = cw => { let s = 0; for (let n = 0; n < NVAR; n++) if (((cw[n >> 5] ^ hard[n >> 5]) >>> (n & 31)) & 1) s += rel[n]; return s; };
    let best = null, bestCost = Infinity, nTest = 0;
    const tryCw = cw => { nTest++; const cst = cost(cw); if (cst < bestCost && rowCrcOk(cw)) { bestCost = cst; best = cw.slice(); } };
    tryCw(c0);
    const t = new Uint32Array(W);
    for (let k = 0; k < 91; k++) { for (let q = 0; q < W; q++) t[q] = c0[q] ^ M[k][q]; tryCw(t); }
    if (order2 > 0) { // pairs among the least reliable bits of the most reliable basis
      const lo = Math.max(0, 91 - order2);
      for (let a = lo; a < 91; a++) for (let b = a + 1; b < 91; b++) { for (let q = 0; q < W; q++) t[q] = c0[q] ^ M[a][q] ^ M[b][q]; tryCw(t); }
    }
    if (!best) return null;
    const cw = new Uint8Array(NVAR); let nh = 0;
    for (let n = 0; n < NVAR; n++) { cw[n] = getb(best, n); if (cw[n] !== (llr[n] > 0 ? 1 : 0)) nh++; }
    return { cw, nhard: nh, dist: bestCost, nTest };
  }

  /* ---------------- message packing (77 bits) ---------------- */
  const A37 = ' 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', A36 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', A10 = '0123456789', A27 = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const A38 = ' 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ/', A42 = ' 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ+-./?';
  const isDigit = c => c >= '0' && c <= '9', isLetter = c => c >= 'A' && c <= 'Z';

  class CallHash { // remembers callsigns so hashed (<...>) fields can be shown in full
    constructor() { this.h22 = new Map(); this.h12 = new Map(); this.h10 = new Map(); }
    static hash(call, m) {
      let n = 0n; const c = (call + '           ').slice(0, 11);
      for (let i = 0; i < 11; i++) { const j = A38.indexOf(c[i]); if (j < 0) return -1; n = n * 38n + BigInt(j); }
      return Number(((47055833459n * n) & 0xffffffffffffffffn) >> BigInt(64 - m));
    }
    add(call) {
      call = String(call || '').trim().toUpperCase().replace(/^<|>$/g, '');
      if (call.length < 3 || call.length > 11 || call === '...') return;
      const h = CallHash.hash(call, 22); if (h < 0) return;
      this.h22.set(h, call); this.h12.set(h >> 10, call); this.h10.set(h >> 12, call);
    }
    get(bits, h) { const m = bits === 22 ? this.h22 : bits === 12 ? this.h12 : this.h10; return m.get(h); }
  }

  function packBasecall(c) {
    const L = c.length; if (L < 3) return -1;
    let c6 = null;
    if (c.startsWith('3DA0') && L > 4 && L <= 7) c6 = '3D0' + c.slice(4);
    else if (c.startsWith('3X') && isLetter(c[2]) && L <= 7) c6 = 'Q' + c.slice(2);
    else if (isDigit(c[2]) && L <= 6) c6 = c;
    else if (isDigit(c[1]) && L <= 5) c6 = ' ' + c;
    if (!c6) return -1;
    c6 = (c6 + '      ').slice(0, 6);
    const i0 = A37.indexOf(c6[0]), i1 = A36.indexOf(c6[1]), i2 = A10.indexOf(c6[2]), i3 = A27.indexOf(c6[3]), i4 = A27.indexOf(c6[4]), i5 = A27.indexOf(c6[5]);
    if (i0 < 0 || i1 < 0 || i2 < 0 || i3 < 0 || i4 < 0 || i5 < 0) return -1;
    return ((((i0 * 36 + i1) * 10 + i2) * 27 + i3) * 27 + i4) * 27 + i5;
  }
  function isStdCall(c) { c = c.replace(/\/[PR]$/, ''); return packBasecall(c) >= 0 && /^[A-Z0-9]+$/.test(c) && /[A-Z]/.test(c) && /\d[A-Z]{0,3}$/.test(c); }
  function cqMod(s) { // "CQ DX" / "CQ 123" -> value, else -1
    const m = /^CQ ([A-Z]{1,4}|\d{3})$/.exec(s); if (!m) return -1;
    if (/^\d{3}$/.test(m[1])) return +m[1];
    let v = 0; for (const ch of m[1]) v = 27 * v + (ch.charCodeAt(0) - 64);
    return 1000 + v;
  }
  function pack28(tok, hash) { // -> [n28, ip] or null
    if (tok === 'DE') return [0, 0]; if (tok === 'QRZ') return [1, 0]; if (tok === 'CQ') return [2, 0];
    if (tok.startsWith('CQ ')) { const v = cqMod(tok); return v < 0 ? null : [3 + v, 0]; }
    let ip = 0, base = tok;
    if (/^<.+>$/.test(tok)) { const c = tok.slice(1, -1); const h = CallHash.hash(c, 22); if (h < 0) return null; if (hash) hash.add(c); return [NTOKENS + h, 0]; }
    if (/\/[PR]$/.test(tok)) { ip = 1; base = tok.slice(0, -2); }
    const n = isStdCall(base) ? packBasecall(base) : -1;
    if (n >= 0) { if (hash) hash.add(tok); return [NTOKENS + MAX22 + n, ip]; }
    return null;
  }
  function packGrid(x) { // -> [g15, ir] or null
    if (x === '' || x == null) return [MAXGRID4 + 1, 0];
    if (x === 'RRR') return [MAXGRID4 + 2, 0]; if (x === 'RR73') return [MAXGRID4 + 3, 0]; if (x === '73') return [MAXGRID4 + 4, 0];
    let ir = 0;
    if (/^R [A-R]{2}\d{2}$/.test(x)) { ir = 1; x = x.slice(2); }
    if (/^[A-R]{2}\d{2}$/.test(x)) return [(((x.charCodeAt(0) - 65) * 18 + (x.charCodeAt(1) - 65)) * 10 + +x[2]) * 10 + +x[3], ir];
    const m = /^(R?)([+-]\d{1,2})$/.exec(x);
    if (m) { let d = +m[2]; if (d < -30 || d > 49) return null; return [MAXGRID4 + 35 + d, m[1] ? 1 : 0]; }
    return null;
  }
  function putBits(b, pos, v, n) { for (let i = n - 1; i >= 0; i--) b[pos++] = (v / 2 ** i) % 2 >= 1 ? 1 : 0; return pos; }
  function putBig(b, pos, v, n) { for (let i = n - 1; i >= 0; i--) b[pos++] = Number((v >> BigInt(i)) & 1n); return pos; }
  function getBits(b, pos, n) { let v = 0; for (let i = 0; i < n; i++) v = v * 2 + b[pos + i]; return v; }
  function getBig(b, pos, n) { let v = 0n; for (let i = 0; i < n; i++) v = (v << 1n) | BigInt(b[pos + i]); return v; }

  function normalize(text) { return String(text).toUpperCase().replace(/\s+/g, ' ').trim(); }
  function packStd(t1, t2, x, hash) {
    const a = pack28(t1, hash), b = pack28(t2, hash); if (!a || !b) return null;
    let i3 = 1;
    if (/\/P$/.test(t1) || /\/P$/.test(t2)) { if (/\/R$/.test(t1) || /\/R$/.test(t2)) return null; i3 = 2; }
    const g = packGrid(x); if (!g) return null;
    if (t1.startsWith('CQ') && g[1]) return null;
    const bits = new Uint8Array(77); let p = 0;
    p = putBits(bits, p, a[0], 28); bits[p++] = a[1]; p = putBits(bits, p, b[0], 28); bits[p++] = b[1];
    bits[p++] = g[1]; p = putBits(bits, p, g[0], 15); putBits(bits, p, i3, 3);
    return bits;
  }
  function packNonstd(t1, t2, x, hash) { // type 4: one hashed call (12 bits) + one plain call up to 11 chars
    const icq = t1 === 'CQ' ? 1 : 0;
    if (t1.startsWith('CQ ') && !icq) return null;
    let nrpt = 0;
    if (!icq) { if (x === 'RRR') nrpt = 1; else if (x === 'RR73') nrpt = 2; else if (x === '73') nrpt = 3; else if (x) return null; }
    else if (x) return null;
    const strip = s => s.replace(/^<|>$/g, '');
    let iflip = 0, h12 = 0, c58;
    if (icq) c58 = strip(t2);
    else {
      // the call in <brackets> is hashed; otherwise hash the standard one and send the other in full
      if (/^<.+>$/.test(t2) || (!/^<.+>$/.test(t1) && isStdCall(strip(t2)) && !isStdCall(strip(t1)))) { iflip = 1; c58 = strip(t1); h12 = CallHash.hash(strip(t2), 12); hash && hash.add(strip(t2)); }
      else { c58 = strip(t2); h12 = CallHash.hash(strip(t1), 12); hash && hash.add(strip(t1)); }
      if (h12 < 0) return null;
    }
    if (c58.length < 3 || c58.length > 11) return null;
    let n58 = 0n; for (const ch of (c58 + '           ').slice(0, 11)) { const j = A38.indexOf(ch); if (j < 0) return null; n58 = n58 * 38n + BigInt(j); }
    hash && hash.add(c58);
    const bits = new Uint8Array(77); let p = 0;
    p = putBits(bits, p, h12, 12); p = putBig(bits, p, n58, 58); bits[p++] = iflip; p = putBits(bits, p, nrpt, 2); bits[p++] = icq; putBits(bits, p, 4, 3);
    return bits;
  }
  function packFree(text) {
    if (text.length > 13) return null;
    let n = 0n; for (const ch of (text + '             ').slice(0, 13)) { const j = A42.indexOf(ch); if (j < 0) return null; n = n * 42n + BigInt(j); }
    const bits = new Uint8Array(77); putBig(bits, 0, n, 71); // i3 = 0, n3 = 0
    return bits;
  }
  /* pack(text) -> { bits, type } or null. type: 'std' | 'nonstd' | 'free'
     Rules as WSJT-X: a non-standard call (e.g. PJ4/K1ABC) goes in full in a type-4 message for CQ, a
     bare answer, RRR, RR73 or 73; with a grid or a report it is sent as a 22-bit hash in a standard message. */
  function pack(text, hash) {
    const msg = normalize(text);
    let toks = msg.split(' ');
    if (toks[0] === 'CQ' && toks.length >= 3 && toks.length <= 4 && cqMod('CQ ' + toks[1]) >= 0 && !isStdCall(toks[1])) toks = ['CQ ' + toks[1]].concat(toks.slice(2));
    const isTok = t => t === 'CQ' || t === 'DE' || t === 'QRZ' || t.startsWith('CQ ');
    const plain = t => !isTok(t) && !/^<.+>$/.test(t) && !isStdCall(t);
    if (toks.length >= 2 && toks.length <= 4) {
      let x = toks.slice(2).join(' ');
      if (toks.length === 4 && !(toks[2] === 'R' && /^[A-R]{2}\d{2}$/.test(toks[3]))) x = null;
      if (x != null && toks.slice(0, 2).every(t => isTok(t) || /^<?[A-Z0-9/]{3,11}>?$/.test(t)) && !isTok(toks[1])) {
        const ns = [plain(toks[0]), plain(toks[1])];
        if (!ns[0] && !ns[1]) { const b = packStd(toks[0], toks[1], x, hash); if (b) return { bits: b, type: 'std' }; }
        else if (!(ns[0] && ns[1])) {
          if (toks.length <= 3 && (toks[0] === 'CQ' || ['', 'RRR', 'RR73', '73'].includes(x))) { const b = packNonstd(toks[0], toks[1], x, hash); if (b) return { bits: b, type: 'nonstd' }; }
          if (toks[0] !== 'CQ' && !toks[0].startsWith('CQ ')) {
            const t1 = ns[0] ? '<' + toks[0] + '>' : toks[0], t2 = ns[1] ? '<' + toks[1] + '>' : toks[1];
            const b = packStd(t1, t2, x, hash); if (b) return { bits: b, type: 'std' };
          }
        }
      }
    }
    const b = packFree(msg); if (b) return { bits: b, type: 'free' };
    return null;
  }

  function unpack28(n, ip, i3, hash) {
    if (n < NTOKENS) {
      if (n === 0) return 'DE'; if (n === 1) return 'QRZ'; if (n === 2) return 'CQ';
      if (n <= 1002) return 'CQ ' + String(n - 3).padStart(3, '0');
      if (n <= 532443) { let v = n - 1003, s = ''; for (let i = 0; i < 4; i++) { s = A27[v % 27] + s; v = Math.floor(v / 27); } return 'CQ ' + s.trim(); }
      return null;
    }
    n -= NTOKENS;
    if (n < MAX22) { const c = hash && hash.get(22, n); return c ? '<' + c + '>' : '<...>'; }
    n -= MAX22;
    let c = '';
    c = A27[n % 27] + c; n = Math.floor(n / 27); c = A27[n % 27] + c; n = Math.floor(n / 27); c = A27[n % 27] + c; n = Math.floor(n / 27);
    c = A10[n % 10] + c; n = Math.floor(n / 10); c = A36[n % 36] + c; n = Math.floor(n / 36);
    if (n >= 37) return null;
    c = A37[n] + c;
    let call;
    if (c.startsWith('3D0') && c[3] !== ' ') call = '3DA0' + c.slice(3).trim();
    else if (c[0] === 'Q' && isLetter(c[1])) call = '3X' + c.slice(1).trim();
    else call = c.trim();
    if (call.length < 3 || /\s/.test(call)) return null;
    if (ip) { if (i3 === 1) call += '/R'; else if (i3 === 2) call += '/P'; else return null; }
    if (hash) hash.add(call);
    return call;
  }
  /* unpack(bits77) -> { text, i3, n3, call1, call2, extra } or null */
  function unpack(b, hash) {
    const i3 = getBits(b, 74, 3), n3 = getBits(b, 71, 3);
    if (i3 === 1 || i3 === 2) {
      const n1 = getBits(b, 0, 28), ip1 = b[28], n2 = getBits(b, 29, 28), ip2 = b[57], ir = b[58], g = getBits(b, 59, 15);
      const c1 = unpack28(n1, ip1, i3, hash), c2 = unpack28(n2, ip2, i3, hash);
      if (!c1 || !c2) return null;
      if (c2.startsWith('CQ') || c2 === 'DE' || c2 === 'QRZ') return null;
      let x;
      if (g <= MAXGRID4) {
        if (g === MAXGRID4) return null;
        const v = g; const d3 = v % 10, d2 = Math.floor(v / 10) % 10, l2 = Math.floor(v / 100) % 18, l1 = Math.floor(v / 1800);
        if (l1 >= 18) return null;
        x = (ir ? 'R ' : '') + String.fromCharCode(65 + l1, 65 + l2) + d2 + d3;
      } else {
        const irpt = g - MAXGRID4;
        if (irpt === 1) x = ''; else if (irpt === 2) x = 'RRR'; else if (irpt === 3) x = 'RR73'; else if (irpt === 4) x = '73';
        else { let s = irpt - 35; if (s > 50) s -= 101; x = (ir ? 'R' : '') + (s < 0 ? '-' : '+') + String(Math.abs(s)).padStart(2, '0'); }
        if (ir && irpt >= 1 && irpt <= 4) return null;
      }
      if (c1.startsWith('CQ') && ir) return null;
      return { text: (c1 + ' ' + c2 + (x ? ' ' + x : '')), i3, n3, call1: c1, call2: c2, extra: x };
    }
    if (i3 === 4) {
      const h12 = getBits(b, 0, 12), n58 = getBig(b, 12, 58), iflip = b[70], nrpt = getBits(b, 71, 2), icq = b[73];
      let v = n58, s = ''; for (let i = 0; i < 11; i++) { s = A38[Number(v % 38n)] + s; v /= 38n; }
      const c58 = s.trim(); if (c58.length < 3 || /\s/.test(c58)) return null;
      if (hash) hash.add(c58);
      const hc = hash && hash.get(12, h12), c12 = hc ? '<' + hc + '>' : '<...>';
      let c1, c2, x = '';
      if (icq) { c1 = 'CQ'; c2 = c58; } else { c1 = iflip ? c58 : c12; c2 = iflip ? c12 : c58; x = ['', 'RRR', 'RR73', '73'][nrpt]; }
      return { text: c1 + ' ' + c2 + (x ? ' ' + x : ''), i3, n3, call1: c1, call2: c2, extra: x };
    }
    if (i3 === 0 && n3 === 0) {
      let v = getBig(b, 0, 71), s = ''; for (let i = 0; i < 13; i++) { s = A42[Number(v % 42n)] + s; v /= 42n; }
      if (v !== 0n) return null;
      const t = s.trim(); if (!t) return null;
      return { text: t, i3, n3, free: true };
    }
    if (i3 === 0 && n3 === 5) { // telemetry: 71 bits as hex
      let v = getBig(b, 0, 71); const t = v.toString(16).toUpperCase().replace(/^0+/, '') || '0';
      return { text: t, i3, n3, telemetry: true };
    }
    if (i3 === 0 && n3 === 1) { // DXpedition: "K1ABC RR73; W9XYZ <KH1/KH7Z> -08"
      const c1 = unpack28(getBits(b, 0, 28), 0, 1, hash), c2 = unpack28(getBits(b, 28, 28), 0, 1, hash);
      const h10 = getBits(b, 56, 10), r5 = getBits(b, 66, 5);
      if (!c1 || !c2 || c1.startsWith('CQ') || c2.startsWith('CQ')) return null;
      const hc = hash && hash.get(10, h10), cd = hc ? '<' + hc + '>' : '<...>';
      const r = 2 * r5 - 30, rs = (r < 0 ? '-' : '+') + String(Math.abs(r)).padStart(2, '0');
      return { text: `${c1} RR73; ${c2} ${cd} ${rs}`, i3, n3, call1: c2, call2: cd, extra: rs, dxped: c1 };
    }
    return null; // contest formats (field day, RTTY roundup, EU VHF) are not shown
  }
  function textToTones(text, hash) { const p = pack(text, hash); return p ? bits77ToTones(p.bits) : null; }

  /* ---------------- GFSK synthesis (as WSJT-X: BT = 2, h = 1, raised-cosine ramps) ---------------- */
  function erf(x) { // Abramowitz & Stegun 7.1.26, |err| < 1.5e-7
    const s = x < 0 ? -1 : 1; x = Math.abs(x);
    const t = 1 / (1 + 0.3275911 * x);
    const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
    return s * y;
  }
  const pulseCache = new Map();
  function gfskPulse(nsps) {
    if (pulseCache.has(nsps)) return pulseCache.get(nsps);
    const p = new Float64Array(3 * nsps), c = Math.PI * Math.sqrt(2 / Math.LN2), bt = 2;
    for (let i = 0; i < 3 * nsps; i++) { const tt = (i - 1.5 * nsps) / nsps; p[i] = 0.5 * (erf(c * bt * (tt + 0.5)) - erf(c * bt * (tt - 0.5))); }
    pulseCache.set(nsps, p); return p;
  }
  /* phase increments per sample (rad), length nsym*nsps, for tones (without the carrier term) */
  function gfskDphi(tones, nsps) {
    const nsym = tones.length, p = gfskPulse(nsps), pk = TWO_PI / nsps;
    const d = new Float64Array((nsym + 2) * nsps);
    for (let j = 0; j < nsym; j++) { const ib = j * nsps, a = pk * tones[j]; for (let i = 0; i < 3 * nsps; i++) d[ib + i] += a * p[i]; }
    for (let i = 0; i < 2 * nsps; i++) { d[i] += pk * tones[0] * p[nsps + i]; d[nsym * nsps + i] += pk * tones[nsym - 1] * p[i]; }
    return d.subarray(nsps, nsps + nsym * nsps);
  }
  /* synth(tones, {sampleRate, f0, amplitude, out, offset, phase}) -> Float32Array (real waveform, ramps included) */
  function synth(tones, o) {
    const fs = o.sampleRate, nsps = Math.round(SYM_T * fs), n = tones.length * nsps;
    const out = o.out || new Float32Array(n), off = o.offset | 0, amp = o.amplitude ?? 1;
    const d = gfskDphi(tones, nsps), w0 = TWO_PI * o.f0 / fs, nr = Math.round(nsps / 8);
    const fade = o.fade; // optional function(sampleIndex) -> gain
    let ph = o.phase || 0;
    for (let i = 0; i < n; i++) {
      const k = off + i;
      if (k >= 0 && k < out.length) {
        let a = amp;
        if (i < nr) a *= (1 - Math.cos(Math.PI * i / nr)) / 2; else if (i >= n - nr) a *= (1 - Math.cos(Math.PI * (n - i) / nr)) / 2;
        if (fade) a *= fade(i);
        out[k] += a * Math.sin(ph);
      }
      ph += d[i] + w0; if (ph > TWO_PI) ph -= TWO_PI;
    }
    return out;
  }

  /* ---------------- FFT (radix-2, in place) ---------------- */
  const fftCache = new Map();
  function fftPlan(n) {
    if (fftCache.has(n)) return fftCache.get(n);
    const rev = new Uint32Array(n), bits = Math.log2(n) | 0;
    for (let i = 0; i < n; i++) { let r = 0, x = i; for (let b = 0; b < bits; b++) { r = (r << 1) | (x & 1); x >>= 1; } rev[i] = r; }
    const cs = new Float64Array(n / 2), sn = new Float64Array(n / 2);
    for (let i = 0; i < n / 2; i++) { cs[i] = Math.cos(TWO_PI * i / n); sn[i] = -Math.sin(TWO_PI * i / n); }
    const p = { n, rev, cs, sn }; fftCache.set(n, p); return p;
  }
  function fft(re, im, inverse) { // forward: X[k] = sum x[n] e^{-j2πkn/N}; inverse without 1/N scaling
    const n = re.length, { rev, cs, sn } = fftPlan(n);
    for (let i = 0; i < n; i++) { const j = rev[i]; if (j > i) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; } }
    const sg = inverse ? -1 : 1;
    for (let size = 2; size <= n; size <<= 1) {
      const half = size >> 1, step = n / size;
      for (let i = 0; i < n; i += size) {
        for (let j = 0, k = 0; j < half; j++, k += step) {
          const wr = cs[k], wi = sg * sn[k], a = i + j, b = a + half;
          const tr = re[b] * wr - im[b] * wi, ti = re[b] * wi + im[b] * wr;
          re[b] = re[a] - tr; im[b] = im[a] - ti; re[a] += tr; im[a] += ti;
        }
      }
    }
  }

  /* ---------------- resampler (windowed sinc) ---------------- */
  function resample(x, fsIn, fsOut) {
    if (fsIn === fsOut) return Float32Array.from(x);
    const ratio = fsIn / fsOut, nOut = Math.floor(x.length / ratio), y = new Float32Array(nOut);
    const fc = 0.45 * Math.min(1, 1 / ratio) * 2; // normalized to input Nyquist... cutoff = 0.45*fsOut
    const K = 16 * Math.max(1, Math.ceil(ratio)), PH = 512;
    const tab = new Float32Array((2 * K + 1) * PH + 1);
    for (let i = 0; i < tab.length; i++) {
      const t = i / PH - K; const s = t === 0 ? 1 : Math.sin(Math.PI * fc * t) / (Math.PI * fc * t);
      const w = 0.42 + 0.5 * Math.cos(Math.PI * t / K) + 0.08 * Math.cos(2 * Math.PI * t / K);
      tab[i] = Math.abs(t) <= K ? s * w * fc : 0;
    }
    for (let n = 0; n < nOut; n++) {
      const p = n * ratio, i0 = Math.floor(p), fr = p - i0;
      let s = 0;
      for (let k = -K + 1; k <= K; k++) {
        const idx = i0 + k; if (idx < 0 || idx >= x.length) continue;
        const t = k - fr; const ti = (t + K) * PH, a = ti | 0;
        s += x[idx] * (tab[a] + (tab[a + 1] - tab[a]) * (ti - a));
      }
      y[n] = s;
    }
    return y;
  }

  /* ---------------- decoder ---------------- */
  const NFFT1 = 4096, NSTEP = 512, NHSYM_MAX = Math.floor(SLOT * FS / NSTEP);
  const NBIG = 262144, NDOWN = 4096, DS = NBIG / NDOWN, FS2 = FS / DS, NSPS2 = NSPS / DS; // 200 Hz, 32 samples/symbol
  const KDF = 14, DFSTEP = 0.25; // fine frequency grid: -3.5 .. +3.5 Hz in 0.25 Hz steps
  const ROT = (() => { const a = []; for (let k = -KDF; k <= KDF; k++) { const w = TWO_PI * k * DFSTEP / FS2, r = new Float64Array(NDOWN), i = new Float64Array(NDOWN); for (let n = 0; n < NDOWN; n++) { r[n] = Math.cos(-w * n); i[n] = Math.sin(-w * n); } a.push([r, i]); } return a; })();
  const rotOf = dfr => ROT[Math.max(0, Math.min(2 * KDF, Math.round(dfr / DFSTEP) + KDF))];
  const SINLUT = (() => { const t = new Float64Array(4097); for (let i = 0; i <= 4096; i++) t[i] = Math.sin(TWO_PI * i / 4096); return t; })();
  const fsin = ph => { let u = ph / TWO_PI; u -= Math.floor(u); const v = u * 4096, i = v | 0; return SINLUT[i] + (SINLUT[i + 1] - SINLUT[i]) * (v - i); };
  const fcos = ph => fsin(ph + 1.5707963267948966);
  const CSYNC = (() => { const a = []; for (let t = 0; t < 8; t++) { const r = new Float64Array(NSPS2), i = new Float64Array(NSPS2); for (let k = 0; k < NSPS2; k++) { r[k] = Math.cos(TWO_PI * t * k / NSPS2); i[k] = Math.sin(TWO_PI * t * k / NSPS2); } a.push([r, i]); } return a; })();

  function spectrogram(x) {
    const nh = Math.min(NHSYM_MAX, Math.floor((x.length - NSPS) / NSTEP) + 1), nb = NFFT1 / 2;
    const s = new Float32Array(nh * nb), re = new Float64Array(NFFT1), im = new Float64Array(NFFT1);
    for (let j = 0; j < nh; j += 2) { // two real frames in one complex FFT
      re.fill(0); im.fill(0);
      const a = j * NSTEP, b = (j + 1) * NSTEP, two = j + 1 < nh;
      for (let k = 0; k < NSPS; k++) { re[k] = x[a + k] || 0; if (two) im[k] = x[b + k] || 0; }
      fft(re, im, false);
      for (let i = 0; i < nb; i++) {
        const i2 = (NFFT1 - i) % NFFT1;
        const ar = (re[i] + re[i2]) / 2, ai = (im[i] - im[i2]) / 2, br = (im[i] + im[i2]) / 2, bi = (re[i2] - re[i]) / 2;
        s[j * nb + i] = ar * ar + ai * ai;
        if (two) s[(j + 1) * nb + i] = br * br + bi * bi;
      }
    }
    return { s, nh, nb };
  }
  /* noise power per spectrogram bin (mean), from a low percentile over time, smoothed in frequency */
  function noiseBase(sp) {
    const { s, nh, nb } = sp, q = new Float64Array(nb), col = new Float32Array(nh);
    for (let i = 0; i < nb; i++) { for (let m = 0; m < nh; m++) col[m] = s[m * nb + i]; col.sort(); q[i] = col[Math.floor(0.2 * nh)] / 0.223; }
    const out = new Float64Array(nb), w = 100, tmp = [];
    for (let i = 0; i < nb; i++) { tmp.length = 0; for (let k = Math.max(0, i - w); k <= Math.min(nb - 1, i + w); k++) tmp.push(q[k]); tmp.sort((a, b) => a - b); out[i] = tmp[Math.floor(tmp.length * 0.3)]; }
    return out;
  }
  function findCandidates(sp, fmin, fmax, maxCand, syncMin) {
    const { s, nh, nb } = sp, df = FS / NFFT1, ia = Math.max(1, Math.round(fmin / df)), ib = Math.min(nb - 16, Math.round(fmax / df));
    const JZ = 62, J0 = Math.round(0.5 * FS / NSTEP); // lags in quarter symbols; 0.5 s nominal start
    const nf = ib - ia + 1, red = new Float64Array(nf), jpk = new Int32Array(nf), red2 = new Float64Array(nf), jpk2 = new Int32Array(nf);
    // P[m][i] = power summed over the 7 tone bins i, i+2, ... i+12 (for the noise reference)
    const P = new Float32Array(nh * nb);
    for (let m = 0; m < nh; m++) for (let i = ia; i <= ib; i++) { let a = 0; for (let k = 0; k < 7; k++) a += s[m * nb + i + 2 * k]; P[m * nb + i] = a; }
    for (let i = ia; i <= ib; i++) {
      let best = -1, bj = 0, best2 = -1, bj2 = 0;
      for (let j = -JZ; j <= JZ; j++) {
        let ta = 0, tb = 0, tc = 0, t0a = 0, t0b = 0, t0c = 0;
        for (let n = 0; n < 7; n++) {
          const m = j + J0 + 4 * n, ic = i + 2 * COSTAS[n];
          if (m >= 0 && m < nh) { ta += s[m * nb + ic]; t0a += P[m * nb + i]; }
          const mb = m + 144; if (mb >= 0 && mb < nh) { tb += s[mb * nb + ic]; t0b += P[mb * nb + i]; }
          const mc = m + 288; if (mc >= 0 && mc < nh) { tc += s[mc * nb + ic]; t0c += P[mc * nb + i]; }
        }
        const t = ta + tb + tc, t0 = (t0a + t0b + t0c - t) / 6;
        const sabc = t0 > 0 ? t / t0 : 0;
        const tbc = tb + tc, t0bc = (t0b + t0c - tbc) / 6, sbc = t0bc > 0 ? tbc / t0bc : 0;
        const v = Math.max(sabc, sbc);
        if (v > best) { best = v; bj = j; }
        if (Math.abs(j) <= 10 && v > best2) { best2 = v; bj2 = j; }
      }
      red[i - ia] = best; jpk[i - ia] = bj; red2[i - ia] = best2; jpk2[i - ia] = bj2;
    }
    const base = a => { const t = Array.from(a).sort((x, y) => x - y); return t[Math.floor(0.4 * t.length)] || 1; };
    const b1 = base(red), b2 = base(red2);
    const cands = [];
    for (let k = 0; k < nf; k++) {
      const f = (ia + k) * df;
      const v1 = red[k] / b1, v2 = red2[k] / b2;
      if (v1 >= syncMin) cands.push({ f, sync: v1, t: (jpk[k] + J0) * NSTEP / FS });
      if (v2 >= syncMin && jpk2[k] !== jpk[k]) cands.push({ f, sync: v2, t: (jpk2[k] + J0) * NSTEP / FS });
    }
    cands.sort((a, b) => b.sync - a.sync);
    const out = [];
    for (const c of cands) {
      if (out.some(o => Math.abs(o.f - c.f) < 4 && Math.abs(o.t - c.t) < 0.04)) continue;
      out.push(c); if (out.length >= maxCand) break;
    }
    return { cands: out, base: b1 };
  }

  class Ft8Decoder {
    constructor() { this.hash = new CallHash(); }
    /* x: Float32Array at 12800 Hz, sample 0 = start of the 15 s slot.
       opts: {fmin, fmax, depth: 1|2|3, maxCand, timeBudgetMs}
       returns [{freq, dt, snr, text, msg, tones, sync, pass, osd}] */
    decode(xIn, opts = {}) {
      const fmin = opts.fmin ?? 200, fmax = opts.fmax ?? 3000, depth = opts.depth ?? 3;
      const t0 = Date.now(), budget = opts.timeBudgetMs ?? 4000;
      const x = new Float32Array(SLOT * FS); x.set(xIn.subarray(0, Math.min(xIn.length, x.length)));
      const results = [], seen = new Set();
      this.apList = buildAp(opts.ap);
      const npass = depth >= 3 ? 3 : depth;
      for (let pass = 1; pass <= npass; pass++) {
        const sp = spectrogram(x);
        if (pass === 1) this.nbase = noiseBase(sp);
        this.sp = sp;
        const { cands } = findCandidates(sp, fmin, fmax, opts.maxCand ?? (depth >= 2 ? 300 : 120), pass === 1 ? 1.6 : 1.4);
        // full-slot spectrum for down-conversion
        const re = new Float64Array(NBIG), im = new Float64Array(NBIG);
        for (let i = 0; i < x.length; i++) re[i] = x[i];
        fft(re, im, false);
        const found = [];
        for (const c of cands) {
          if (Date.now() - t0 > budget) break;
          if (results.some(r => Math.abs(r.freq - c.f) < 3 && Math.abs(r.dt + 0.5 - c.t) < 0.08)) continue;
          const r = this.decodeCand(re, im, c, depth, pass);
          if (!r) continue;
          const key = r.bits.join('');
          if (seen.has(key)) continue;
          seen.add(key); r.pass = pass; results.push(r); found.push(r);
        }
        if (!found.length || pass === npass || Date.now() - t0 > budget) break;
        for (const r of found) subtract(x, r.tones, r.freq, r.dt);
      }
      // second chance for hashed calls now that the table has more entries
      for (const r of results) if (r.text.includes('<...>')) { const u = unpack(r.bits, this.hash); if (u) { r.text = u.text; r.msg = u; } }
      results.sort((a, b) => a.freq - b.freq);
      return results;
    }
    decodeCand(RE, IM, c, depth, pass) {
      // 1. down-convert: f0 (tone 0) -> DC, 200 Hz complex
      const cd = downsample(RE, IM, c.f);
      // 2. fine time / frequency sync on the Costas arrays
      let i0 = Math.round((c.t) * FS2), best = -1, ibest = i0, fbest = 0;
      for (let i = i0 - 10; i <= i0 + 10; i++) { const v = sync8d(cd, i, 0); if (v > best) { best = v; ibest = i; } }
      best = -1;
      for (let k = -12; k <= 12; k++) { const df = k * DFSTEP, v = sync8d(cd, ibest, df); if (v > best) { best = v; fbest = df; } }
      best = -1; let i2 = ibest;
      for (let i = ibest - 4; i <= ibest + 4; i++) { const v = sync8d(cd, i, fbest); if (v > best) { best = v; i2 = i; } }
      ibest = i2;
      // sub-sample refinement (parabolic) for time and frequency, used for subtraction
      const ym = sync8d(cd, ibest - 1, fbest), y0 = best, yp = sync8d(cd, ibest + 1, fbest);
      const dti = (ym - yp) / (2 * (ym - 2 * y0 + yp) || 1e-30);
      const fm = sync8d(cd, ibest, fbest - 0.25), fp = sync8d(cd, ibest, fbest + 0.25);
      const dfi = (fm - fp) / (2 * (fm - 2 * y0 + fp) || 1e-30);
      // 3. symbol spectra
      const cs = symbolSpectra(cd, ibest, fbest);
      const s8 = new Float64Array(8 * NN);
      for (let k = 0; k < NN; k++) for (let t = 0; t < 8; t++) { const a = cs.re[k * 8 + t], b = cs.im[k * 8 + t]; s8[k * 8 + t] = Math.sqrt(a * a + b * b); }
      let nsync = 0;
      for (let k = 0; k < 7; k++) for (const o of [0, 36, 72]) {
        let mx = 0, am = 0; for (let t = 0; t < 8; t++) if (s8[(o + k) * 8 + t] > mx) { mx = s8[(o + k) * 8 + t]; am = t; }
        if (am === COSTAS[k]) nsync++;
      }
      if (nsync <= 6) return null;
      // 4. bit metrics, 1/2/3-symbol coherent combining
      const metrics = [1, 2, 3].map(ns => bitMetrics(cs, ns));
      let dec = null, usedOsd = false;
      for (const llr of metrics) { dec = bpDecode(llr); if (dec) break; }
      if (!dec && depth >= 2 && nsync >= 9 && c.sync >= 1.8) {
        for (const llr of (depth >= 3 ? [metrics[0], metrics[2]] : [metrics[0]])) {
          const o = osdDecode(llr, depth >= 3 ? 12 : 0);
          if (o && o.nhard <= 40 && o.dist <= 32) { dec = o; usedOsd = true; break; }
        }
      }
      let ap = '';
      if (!dec && this.apList && nsync >= 8) {
        for (const a of this.apList) {
          for (const base of [metrics[0], metrics[2]]) {
            const llr = base.slice(); let mx = 0; for (let i = 0; i < 174; i++) mx = Math.max(mx, Math.abs(llr[i]));
            for (let i = 0; i < a.bits.length; i++) if (a.mask[i]) llr[i] = (a.bits[i] ? 1 : -1) * mx * 1.01;
            dec = bpDecode(llr);
            if (!dec && depth >= 3 && a.osd) { const o = osdDecode(llr, 0); if (o && o.nhard <= 30 && o.dist <= 24) dec = o; }
            if (dec) { ap = a.name; break; }
          }
          if (dec) break;
        }
      }
      if (!dec) return null;
      const bits = dec.cw.slice(0, 77);
      if (bits.every(v => v === 0)) return null;
      const msg = unpack(bits, this.hash);
      if (!msg) return null;
      if ((usedOsd || ap) && (msg.free || msg.telemetry || /<\.\.\.>/.test(msg.text))) return null;
      const tones = bits77ToTones(bits);
      // 5. SNR in 2500 Hz: decoded-tone power in the spectrogram vs the noise floor at that frequency
      const freq0 = c.f + fbest, dt0 = ibest / FS2 - 0.5;
      const snr = this.snrOf(tones, freq0, dt0);
      const freq = c.f + fbest + Math.max(-0.25, Math.min(0.25, dfi * 0.25));
      const dt = (ibest + Math.max(-1, Math.min(1, dti))) / FS2 - 0.5;
      return { freq, dt, snr, text: msg.text, msg, tones, bits, sync: c.sync, nsync, osd: usedOsd, ap, nhard: dec.nhard };
    }
  }
  /* a-priori patterns: known leading bits of messages we expect (as WSJT-X "AP" decoding).
     cfg: {cq: bool, mycall, dxcall} */
  function buildAp(cfg) {
    if (!cfg) return null;
    const list = [], mk = (name, toks, osd) => {
      const bits = new Uint8Array(77), mask = new Uint8Array(77); let p = 0;
      for (const t of toks) { const v = pack28(t, null); if (!v) return; p = putBits(bits, p, v[0], 28); bits[p++] = v[1]; }
      for (let i = 0; i < p; i++) mask[i] = 1;
      mask[74] = mask[75] = mask[76] = 1; bits[74] = 0; bits[75] = 0; bits[76] = 1; // i3 = 1
      list.push({ name, bits, mask, osd });
    };
    const my = cfg.mycall && String(cfg.mycall).toUpperCase(), dx = cfg.dxcall && String(cfg.dxcall).toUpperCase();
    if (my && dx) mk('a3', [my, dx], true);
    if (my) mk('a2', [my], true);
    if (cfg.cq) mk('a1', ['CQ'], false);
    return list.length ? list : null;
  }
  Ft8Decoder.prototype.snrOf = function (tones, f0, dt) {
    const { s, nh, nb } = this.sp, df = FS / NFFT1, m0 = Math.round((0.5 + dt) * FS / NSTEP);
    let ps = 0, pn = 0, n = 0;
    for (let k = 0; k < NN; k++) {
      const m = m0 + 4 * k; if (m < 0 || m >= nh) continue;
      const i = Math.round((f0 + tones[k] * TONE_DF) / df); if (i < 0 || i >= nb) continue;
      ps += s[m * nb + i]; pn += this.nbase[i]; n++;
    }
    if (!n || pn <= 0) return -24;
    const r = ps / pn - 1;
    return Math.max(-24, Math.min(40, Math.round(10 * Math.log10(Math.max(r, 1e-3)) - 26)));
  };
  function downsample(RE, IM, f0) {
    const df = FS / NBIG, ft = f0 + 8.5 * TONE_DF, fb = f0 - 1.5 * TONE_DF;
    const i0 = Math.round(f0 / df), it = Math.min(Math.round(ft / df), NBIG / 2), ibb = Math.max(1, Math.round(fb / df));
    const re = new Float64Array(NDOWN), im = new Float64Array(NDOWN);
    const nTap = 101, len = it - ibb + 1;
    for (let i = ibb; i <= it; i++) {
      const k = i - ibb; let w = 1;
      if (k < nTap) w = 0.5 * (1 - Math.cos(Math.PI * k / (nTap - 1))); else if (k > len - 1 - nTap) w = 0.5 * (1 - Math.cos(Math.PI * (len - 1 - k) / (nTap - 1)));
      const j = ((i - i0) % NDOWN + NDOWN) % NDOWN;
      re[j] = RE[i] * w; im[j] = IM[i] * w;
    }
    fft(re, im, true);
    const sc = 1 / Math.sqrt(NBIG * NDOWN) * 64;
    for (let i = 0; i < NDOWN; i++) { re[i] *= sc; im[i] *= sc; }
    return { re, im };
  }
  function sync8d(cd, i0, dfr) {
    let sync = 0; const { re, im } = cd, [pr, pi] = rotOf(dfr);
    for (let blk = 0; blk < 3; blk++) for (let n = 0; n < 7; n++) {
      const a = i0 + (blk * 36 + n) * NSPS2; if (a < 0 || a + NSPS2 > NDOWN) continue;
      const [cr, ci] = CSYNC[COSTAS[n]];
      let zr = 0, zi = 0;
      for (let k = 0; k < NSPS2; k++) {
        const j = a + k, xr = re[j] * pr[j] - im[j] * pi[j], xi = re[j] * pi[j] + im[j] * pr[j];
        zr += xr * cr[k] + xi * ci[k]; zi += xi * cr[k] - xr * ci[k];
      }
      sync += zr * zr + zi * zi;
    }
    return sync;
  }
  function symbolSpectra(cd, i0, dfr) {
    const out = { re: new Float64Array(NN * 8), im: new Float64Array(NN * 8) }, [pr, pi] = rotOf(dfr);
    const xr = new Float64Array(NSPS2), xi = new Float64Array(NSPS2);
    for (let k = 0; k < NN; k++) {
      const a = i0 + k * NSPS2;
      for (let j = 0; j < NSPS2; j++) {
        const idx = a + j; if (idx < 0 || idx >= NDOWN) { xr[j] = 0; xi[j] = 0; continue; }
        xr[j] = cd.re[idx] * pr[idx] - cd.im[idx] * pi[idx]; xi[j] = cd.re[idx] * pi[idx] + cd.im[idx] * pr[idx];
      }
      for (let t = 0; t < 8; t++) {
        const [cr, ci] = CSYNC[t]; let zr = 0, zi = 0;
        for (let j = 0; j < NSPS2; j++) { zr += xr[j] * cr[j] + xi[j] * ci[j]; zi += xi[j] * cr[j] - xr[j] * ci[j]; }
        out.re[k * 8 + t] = zr; out.im[k * 8 + t] = zi;
      }
    }
    return out;
  }
  function bitMetrics(cs, nsym) {
    const llr = new Float64Array(174);
    for (const [s0, d0] of [[7, 0], [43, 29]]) {
      for (let ks = 0; ks < 29; ks += nsym) {
        const ns = Math.min(nsym, 29 - ks), nt = 1 << (3 * ns), nb = 3 * ns;
        const s2 = new Float64Array(nt);
        for (let i = 0; i < nt; i++) {
          let zr = 0, zi = 0;
          for (let m = 0; m < ns; m++) {
            const v = (i >> (3 * (ns - 1 - m))) & 7, t = GRAY[v], k = s0 + ks + m;
            zr += cs.re[k * 8 + t]; zi += cs.im[k * 8 + t];
          }
          s2[i] = Math.sqrt(zr * zr + zi * zi);
        }
        for (let ib = 0; ib < nb; ib++) {
          let m1 = -1e30, m0 = -1e30; const bit = nb - 1 - ib;
          for (let i = 0; i < nt; i++) { if ((i >> bit) & 1) { if (s2[i] > m1) m1 = s2[i]; } else if (s2[i] > m0) m0 = s2[i]; }
          llr[3 * (d0 + ks) + ib] = m1 - m0;
        }
      }
    }
    let s = 0, s2 = 0; for (let i = 0; i < 174; i++) { s += llr[i]; s2 += llr[i] * llr[i]; }
    const sd = Math.sqrt(Math.max(1e-30, s2 / 174 - (s / 174) ** 2));
    for (let i = 0; i < 174; i++) llr[i] = 2.83 * llr[i] / sd;
    return llr;
  }
  /* subtract a decoded signal from x (12800 Hz) */
  function subtract(x, tones, f0, dt) {
    const n0 = Math.round((0.5 + dt) * FS), N = NN * NSPS;
    const d = gfskDphi(tones, NSPS), w0 = TWO_PI * f0 / FS;
    const rr = new Float64Array(N), ri = new Float64Array(N), zr = new Float64Array(N), zi = new Float64Array(N), msk = new Float64Array(N);
    let ph = 0;
    for (let i = 0; i < N; i++) {
      rr[i] = fcos(ph); ri[i] = fsin(ph);
      const k = n0 + i;
      if (k >= 0 && k < x.length) { zr[i] = x[k] * rr[i]; zi[i] = -x[k] * ri[i]; msk[i] = 1; }
      ph += d[i] + w0;
    }
    const L = 2048, box = a => { const o = new Float64Array(N); let s = 0; for (let i = 0; i < N + L / 2; i++) { if (i < N) s += a[i]; if (i - L >= 0) s -= a[i - L]; const j = i - L / 2; if (j >= 0 && j < N) o[j] = s; } return o; };
    const ar = box(box(zr)), ai = box(box(zi)), am = box(box(msk));
    for (let i = 0; i < N; i++) {
      const k = n0 + i; if (k < 0 || k >= x.length || am[i] <= 0) continue;
      const cr = 2 * ar[i] / am[i], ci = 2 * ai[i] / am[i];
      x[k] -= cr * rr[i] - ci * ri[i];
    }
  }

  /* convenience: decode a slot recorded at any rate */
  function decodeSlot(samples, sampleRate, opts, decoder) {
    const x = resample(samples, sampleRate, FS);
    return (decoder || new Ft8Decoder()).decode(x, opts);
  }

  const api = { pack, unpack, textToTones, bits77ToTones, synth, resample, Ft8Decoder, CallHash, decodeSlot, crc14, ldpcEncode, bpDecode, osdDecode,
    normalize, isStdCall, COSTAS, GRAY, FS, NN, SYM_T, TONE_DF, SLOT, fft, _subtract: subtract };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.FT8 = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
