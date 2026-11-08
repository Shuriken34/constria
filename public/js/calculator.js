/* Calculator materiale – estimări orientative */
(function () {
  'use strict';
  const form = document.getElementById('calc');
  if (!form) return;
  const $ = (s) => form.querySelector(s);
  const $$ = (s) => Array.from(form.querySelectorAll(s));
  const steps = $$('[data-step]');
  let step = 1;

  const details = {
    bca: { title: 'Ce grosime au blocurile?', help: 'Blocuri BCA standard de 60 × 25 cm (6,67 buc/mp).', unit: 'cm', options: [10, 15, 20, 25, 30, 37.5], def: 25 },
    caramida: { title: 'Ce tip de bloc ceramic?', help: 'Grosimea peretelui determină numărul de blocuri pe mp.', unit: 'cm', options: [10, 25, 30, 38], def: 25 },
    beton: { title: 'Ce grosime are turnarea?', help: 'Șapă 5–8 cm, placă 12–15 cm, radier 25–40 cm.', unit: 'cm', options: [5, 8, 10, 12, 15, 20, 30], def: 12 },
    tencuiala: { title: 'Ce grosime are tencuiala?', help: 'Interior de obicei 1–1,5 cm, exterior 2 cm.', unit: 'cm', options: [1, 1.5, 2, 2.5, 3], def: 1.5 },
    gresie: { title: 'Ce format au plăcile?', help: 'Formatele mari folosesc mai mult adeziv pe mp.', unit: '', options: ['30×30', '60×60', '60×120', 'Faianță 25×40'], def: '60×60' },
    vopsea: { title: 'Câte straturi aplici?', help: 'De regulă 2 straturi peste grund.', unit: 'straturi', options: [1, 2, 3], def: 2 },
    izolatie: { title: 'Ce grosime are polistirenul?', help: 'Pentru case noi se recomandă minimum 10 cm.', unit: 'cm', options: [5, 8, 10, 12, 15, 20], def: 10 },
  };
  const catFor = { bca: 'caramida-bca', caramida: 'caramida-bca', beton: 'ciment-betoane', tencuiala: 'ciment-betoane', gresie: 'gresie-faianta', vopsea: 'vopsele-finisaje', izolatie: 'izolatii' };
  const nf = (n, d = 0) => Number(n).toLocaleString('ro-RO', { maximumFractionDigits: d });
  const work = () => ($('input[name="work"]:checked') || {}).value || 'bca';
  const area = () => Math.max(1, Number($('#area-num').value) || 1);

  // sincronizare slider + câmp numeric
  const range = $('#area'), num = $('#area-num'), out = $('[data-area-val]');
  range.addEventListener('input', () => { num.value = range.value; out.textContent = nf(range.value); });
  num.addEventListener('input', () => { const v = Math.max(1, Number(num.value) || 1); range.value = Math.min(500, v); out.textContent = nf(v); });

  function renderDetail() {
    const d = details[work()];
    $('[data-detail-title]').textContent = d.title;
    $('[data-detail-help]').textContent = d.help;
    const box = $('[data-detail-options]');
    box.innerHTML = '';
    d.options.forEach((o) => {
      const l = document.createElement('label');
      l.className = 'choice';
      l.innerHTML = '<input type="radio" name="detail"><span></span>';
      const inp = l.querySelector('input');
      inp.value = o;
      inp.checked = String(o) === String(d.def);
      l.querySelector('span').textContent = (typeof o === 'number' ? nf(o, 1) : o) + (d.unit ? ' ' + d.unit : '');
      box.appendChild(l);
    });
  }

  function compute() {
    const w = work(), a = area();
    const det = ($('input[name="detail"]:checked') || {}).value;
    const r = [];
    if (w === 'bca') {
      const t = Number(det);
      r.push({ v: Math.ceil(a * 6.67 * 1.05), u: 'blocuri BCA', n: `${nf(t, 1)} cm, 60×25 cm` });
      r.push({ v: Math.ceil((a * t * 0.25) / 25 * 1.1), u: 'saci adeziv BCA (25 kg)', n: 'aprox. 2,5 kg/mp la 10 cm grosime' });
      r.push({ v: Math.ceil(a * 6.67 * 1.05 / (t >= 25 ? 40 : t >= 15 ? 64 : 96)), u: 'paleți (orientativ)', n: 'depinde de producător' });
    } else if (w === 'caramida') {
      const per = { 10: 10.5, 25: 16, 30: 16, 38: 16 }[det] || 16;
      r.push({ v: Math.ceil(a * per * 1.05), u: 'blocuri ceramice', n: `${det} cm, ~${per} buc/mp` });
      r.push({ v: Math.ceil(a * (Number(det) / 100) * 0.03 * 1000 / 25 * 1.6), u: 'saci mortar (25 kg)', n: 'mortar de zidărie M5–M10' });
    } else if (w === 'beton') {
      const vol = a * Number(det) / 100;
      r.push({ v: nf(vol * 1.05, 2), u: 'mc beton', n: `${nf(a)} mp × ${det} cm + 5%` });
      r.push({ v: Math.ceil(vol * 300 / 40), u: 'saci ciment (40 kg)', n: 'dacă îl prepari singur, ~300 kg/mc' });
      r.push({ v: nf(vol * 1.9, 1), u: 'tone agregate', n: 'nisip + pietriș sortat 0–31 mm' });
    } else if (w === 'tencuiala') {
      const kg = a * Number(det) * 14;
      r.push({ v: Math.ceil(kg / 25 * 1.05), u: 'saci tencuială (25 kg)', n: '~14 kg/mp/cm grosime' });
      r.push({ v: Math.ceil(a / 2.5), u: 'ml profil colț / șpriț', n: 'estimare pentru colțuri și glafuri' });
    } else if (w === 'gresie') {
      const adez = { '30×30': 4, '60×60': 5, '60×120': 6, 'Faianță 25×40': 3.5 }[det] || 5;
      r.push({ v: nf(a * 1.1, 1), u: 'mp plăci', n: 'cu 10% rezervă pentru tăieturi' });
      r.push({ v: Math.ceil(a * adez / 25), u: 'saci adeziv (25 kg)', n: `~${nf(adez, 1)} kg/mp` });
      r.push({ v: Math.ceil(a * 0.5 / 5), u: 'pungi chit rosturi (5 kg)', n: '~0,5 kg/mp' });
    } else if (w === 'vopsea') {
      const l = a * Number(det) / 10;
      r.push({ v: Math.ceil(l * 1.05), u: 'litri vopsea lavabilă', n: '~10 mp/litru/strat' });
      r.push({ v: Math.ceil(a / 8), u: 'litri amorsă / grund', n: '~8 mp/litru' });
    } else if (w === 'izolatie') {
      r.push({ v: Math.ceil(a * 2 * 1.05), u: 'plăci polistiren (0,5 mp)', n: `${det} cm, EPS 80/100` });
      r.push({ v: Math.ceil(a * 10 / 25 * 1.05), u: 'saci adeziv (25 kg)', n: 'lipire + armare, ~10 kg/mp' });
      r.push({ v: Math.ceil(a * 6), u: 'dibluri', n: '~6 buc/mp' });
      r.push({ v: nf(a * 1.1, 0), u: 'mp plasă fibră de sticlă', n: 'cu suprapuneri de 10 cm' });
    }
    return r;
  }

  function renderResults() {
    const box = $('[data-results]');
    box.innerHTML = '';
    compute().forEach((x) => {
      const d = document.createElement('div');
      d.className = 'result';
      d.innerHTML = '<strong class="tnum"></strong><span></span><small></small>';
      d.querySelector('strong').textContent = x.v;
      d.querySelector('span').textContent = x.u;
      d.querySelector('small').textContent = x.n;
      box.appendChild(d);
    });
    const county = $('#calc-county').value;
    const links = $('[data-result-links]');
    const q = new URLSearchParams();
    if (county) q.set('judet', county);
    links.innerHTML = '';
    const a1 = document.createElement('a');
    a1.className = 'btn btn--red';
    a1.href = '/categorie/' + catFor[work()] + (q.toString() ? '?' + q : '');
    a1.textContent = county ? 'Vezi oferte în ' + county : 'Vezi oferte în toată țara';
    const a2 = document.createElement('a');
    a2.className = 'btn btn--ghost';
    a2.href = '/adauga-anunt';
    a2.textContent = 'Ai surplus? Vinde-l';
    links.append(a1, a2);
  }

  function go(n) {
    step = Math.min(5, Math.max(1, n));
    if (step === 3) renderDetail();
    if (step === 5) renderResults();
    steps.forEach((s) => { s.hidden = Number(s.dataset.step) !== step; });
    form.querySelector('[data-step-num]').textContent = step;
    form.querySelector('[data-bar]').style.width = step * 20 + '%';
    $('[data-prev]').hidden = step === 1;
    $('[data-next]').hidden = step === 5;
    $('[data-restart]').hidden = step !== 5;
    const h = steps[step - 1].querySelector('h2');
    h.setAttribute('tabindex', '-1');
    h.focus({ preventScroll: true });
    form.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  }
  $('[data-next]').addEventListener('click', () => go(step + 1));
  $('[data-prev]').addEventListener('click', () => go(step - 1));
  $('[data-restart]').addEventListener('click', () => go(1));
  $$('input[name="work"]').forEach((r) => r.addEventListener('dblclick', () => go(2)));
}());
