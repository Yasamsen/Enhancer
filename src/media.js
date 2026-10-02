import { esc, icon, refreshIcons, copyText } from './utils.js';

/* ---------- Deteksi media dari JSON apa pun ---------- */
const BY_EXT = {
  image: /\.(png|jpe?g|webp|gif|avif|bmp|svg)$/i,
  video: /\.(mp4|webm|mov|m4v|mkv)$/i,
  audio: /\.(mp3|m4a|aac|wav|ogg|opus|flac)$/i,
  file: /\.(zip|rar|7z|pdf|apk|docx?|xlsx?|pptx?)$/i
};
const BY_KEY = {
  image: /(image|img|thumb|cover|avatar|photo|picture|poster|banner|icon|pic)/i,
  video: /(video|mp4|playaddr|nowm|reel)/i,
  audio: /(audio|mp3|music|sound|voice|speech)/i
};
const GENERIC_KEY = /^(url|link|src|href)$/i;
const MEDIAISH_PATH = /(download|media|cdn|file|stream|output|result|play|dl)/i;
const SKIP_KEY = /(source|profile_url|page|permalink|share|canonical|referer|redirect|webpage|embed|author_url|channel_url|homepage)/i;
const PAGE_HOST = /^https?:\/\/(?:[^/]*\.)?(wikipedia\.org|instagram\.com|youtube\.com\/(?:watch|@|channel)|youtu\.be|tiktok\.com\/@|x\.com|twitter\.com|facebook\.com|open\.spotify\.com)/i;
const MAX_ITEMS = 24;
const MAX_PROBES = 6;

const kindOfExt = (url) => {
  const path = url.split(/[?#]/)[0];
  return Object.keys(BY_EXT).find((k) => BY_EXT[k].test(path)) || null;
};

export function kindOfMime(mime = '') {
  const m = mime.toLowerCase();
  if (m.startsWith('image/')) return 'image';
  if (m.startsWith('video/')) return 'video';
  if (m.startsWith('audio/')) return 'audio';
  if (/^text\/|json|xml|html/.test(m)) return null;
  return 'file';
}

/** Telusuri seluruh JSON, kembalikan daftar kandidat media (berlaku untuk semua endpoint). */
export function extractMedia(data) {
  const seen = new Set();
  const items = [];
  const walk = (node, path) => {
    if (items.length >= MAX_ITEMS || node == null) return;
    if (Array.isArray(node)) return node.forEach((v, i) => walk(v, [...path, i]));
    if (typeof node === 'object') return Object.entries(node).forEach(([k, v]) => walk(v, [...path, k]));
    if (typeof node !== 'string') return;
    const isData = /^data:(image|audio|video)\//i.test(node);
    if (!isData && !/^https?:\/\//i.test(node)) return;
    if (seen.has(node)) return;

    const keys = path.filter((p) => typeof p === 'string');
    const last = keys[keys.length - 1] || '';
    let kind = isData ? kindOfMime(node.slice(5, node.indexOf(';'))) : kindOfExt(node);
    let confirmed = Boolean(kind);
    if (!kind) {
      if (SKIP_KEY.test(last) || PAGE_HOST.test(node)) return;
      const hit = Object.keys(BY_KEY).find((k) => BY_KEY[k].test(last));
      if (hit) { kind = hit; }
      else if (/download|dl|cdn|file|output|result/i.test(last) || (GENERIC_KEY.test(last) && MEDIAISH_PATH.test(keys.join('.')))) kind = 'unknown';
      else return;
    }
    seen.add(node);
    const label = last.replace(/[_-]+/g, ' ') || 'media';
    items.push({ id: `m${items.length}`, url: node, kind, label, confirmed, key: last || 'media' });
  };
  walk(data, []);
  return items;
}

/* ---------- Nama file & URL proxy ---------- */
const BLOB_EXT = { image: 'jpg', video: 'mp4', audio: 'mp3' };
const MIME_EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'image/avif': 'avif', 'image/svg+xml': 'svg', 'video/mp4': 'mp4', 'video/webm': 'webm', 'video/quicktime': 'mov', 'audio/mpeg': 'mp3', 'audio/mp4': 'm4a', 'audio/aac': 'aac', 'audio/wav': 'wav', 'audio/ogg': 'ogg', 'application/pdf': 'pdf', 'application/zip': 'zip' };

export function fileNameFor(item, slug = 'samapi') {
  const fromUrl = item.url.startsWith('data:') ? '' : item.url.split(/[?#]/)[0].split('/').pop() || '';
  // Tanpa ekstensi yang pasti -> biarkan proxy menambahkannya dari content-type asli.
  const ext = MIME_EXT[item.mime] || fromUrl.match(/\.([a-z0-9]{2,5})$/i)?.[1] || (item.blob ? BLOB_EXT[item.kind] : '');
  const base = (item.key === slug ? slug : `${slug}-${item.key}`).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return ext ? `${base}.${ext}` : base;
}

export const proxyUrl = (url, name = '', mode = '') =>
  `/api/download?url=${encodeURIComponent(url)}${name ? `&filename=${encodeURIComponent(name)}` : ''}${mode ? `&mode=${mode}` : ''}`;

/* ---------- Download: sekali klik, langsung tersimpan, tidak pernah buka tab ---------- */
function saveBlob(blob, name) {
  const href = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = href; a.download = name; a.rel = 'noopener'; a.style.display = 'none';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(href), 5000);
}

// Fallback untuk file sangat besar: proxy mengirim Content-Disposition: attachment,
// jadi browser tetap mengunduh di tempat (halaman tidak berpindah).
function nativeDownload(url, name) {
  const a = document.createElement('a');
  a.href = proxyUrl(url, name); a.download = name; a.style.display = 'none';
  document.body.appendChild(a); a.click(); a.remove();
}

export async function downloadMedia({ url, name, blob }, onProgress = () => {}) {
  if (blob) return saveBlob(blob, name);
  if (url.startsWith('data:')) return saveBlob(await (await fetch(url)).blob(), name);

  const res = await fetch(proxyUrl(url, name));
  if (!res.ok) {
    let msg = `Server membalas ${res.status}`;
    try { msg = (await res.json()).message || msg; } catch { /* body bukan JSON */ }
    throw new Error(msg);
  }
  const total = Number(res.headers.get('content-length')) || 0;
  if (total > 250 * 1024 * 1024 || !res.body) { res.body?.cancel(); return nativeDownload(url, name); }

  const reader = res.body.getReader();
  const chunks = [];
  let loaded = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value); loaded += value.length;
    if (total) onProgress(Math.round((loaded / total) * 100));
  }
  const cd = res.headers.get('content-disposition') || '';
  const star = cd.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  const finalName = star ? decodeURIComponent(star) : name;
  saveBlob(new Blob(chunks, { type: res.headers.get('content-type') || 'application/octet-stream' }), finalName);
}

/* ---------- Kirim request & baca hasilnya ---------- */
export async function runRequest(url, options = {}) {
  const t0 = performance.now();
  const response = await fetch(url, options);
  const contentType = (response.headers.get('content-type') || '').toLowerCase();
  const out = { status: response.status, ok: response.ok, contentType, ms: Math.round(performance.now() - t0) };
  if (/^(image|audio|video)\//.test(contentType)) {
    out.blob = await response.blob();
    out.size = out.blob.size;
  } else {
    const text = await response.text();
    out.size = new Blob([text]).size;
    try { out.json = JSON.parse(text); } catch { out.text = text; }
  }
  return out;
}

/* ---------- Tampilan ---------- */
export function toast(message, tone = 'ok') {
  const el = document.createElement('div');
  el.className = `toast ${tone === 'error' ? 'toast-error' : ''}`;
  el.setAttribute('role', 'status');
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.classList.add('toast-out'), 3200);
  setTimeout(() => el.remove(), 3700);
}

function previewHtml(item) {
  const src = esc(item.url);
  if (item.kind === 'image') return `<img src="${src}" alt="${esc(item.label)}" loading="lazy" referrerpolicy="no-referrer" class="media-fit">`;
  if (item.kind === 'video') return `<video src="${src}" controls playsinline preload="metadata" class="media-fit"></video>`;
  if (item.kind === 'audio') return `<div class="flex h-full w-full flex-col items-center justify-center gap-4 p-5">${icon('Music', 'h-8 w-8 text-cyan-500')}<audio src="${src}" controls preload="none" class="w-full"></audio></div>`;
  const checking = item.kind === 'unknown';
  return `<div class="flex h-full w-full flex-col items-center justify-center gap-3 p-5 text-slate-400">${icon(checking ? 'LoaderCircle' : 'FileDown', `h-8 w-8 ${checking ? 'animate-spin' : 'text-cyan-500'}`)}<span class="text-xs">${checking ? 'Checking file type…' : 'Ready to download'}</span></div>`;
}

function cardHtml(item, index) {
  const kindLabel = item.kind === 'unknown' ? 'file' : item.kind;
  return `<article class="media-card reveal" data-media="${item.id}" style="--i:${index}"><div class="media-frame">${previewHtml(item)}</div><div class="flex items-center justify-between gap-3 p-3"><div class="min-w-0"><div class="truncate text-sm font-semibold text-slate-900 dark:text-white">${esc(item.label)}</div><div class="text-xs text-slate-500 dark:text-slate-400">${esc(kindLabel)}</div></div><button type="button" data-dl="${item.id}" class="btn-gold shrink-0" ${item.kind === 'unknown' ? 'disabled' : ''}>${icon('Download', 'h-4 w-4')}<span>Download</span></button></div></article>`;
}

const jsonView = (text) => `<div class="overflow-hidden rounded-xl border border-slate-800 bg-slate-950"><div class="flex items-center justify-between border-b border-slate-800 px-4 py-2.5"><span class="font-mono text-xs text-slate-500">json</span><button type="button" data-copy-json class="flex items-center gap-1.5 text-xs font-semibold text-slate-400 transition-colors hover:text-white">${icon('Copy', 'h-3.5 w-3.5')} Copy</button></div><pre class="max-h-[28rem] overflow-auto p-4 font-mono text-xs leading-5 text-slate-300"><code>${esc(text)}</code></pre></div>`;

/** Tampilkan respon dalam dua tab: JSON dan Media. Dipakai semua endpoint. */
export function showResponse(box, result, api) {
  let items = result.blob
    ? [{ id: 'm0', url: URL.createObjectURL(result.blob), kind: kindOfMime(result.contentType), label: api.slug, key: api.slug, confirmed: true, blob: result.blob, mime: result.contentType.split(';')[0] }]
    : extractMedia(result.json ?? {});
  const jsonText = result.blob
    ? JSON.stringify({ contentType: result.contentType, size: result.size, note: 'Endpoint ini mengirim file langsung. Lihat tab Media.' }, null, 2)
    : result.json !== undefined ? JSON.stringify(result.json, null, 2) : String(result.text ?? '');

  let probeCount = 0;
  items.forEach((i) => { if (i.kind === 'unknown' && ++probeCount > MAX_PROBES) i.kind = 'file'; });

  let tab = items.length ? 'media' : 'json';
  const render = () => {
    const tabBtn = (id, label, count) => `<button type="button" role="tab" aria-selected="${tab === id}" data-tab="${id}" class="tab ${tab === id ? 'tab-on' : ''}">${label}${count ? `<span class="tab-count">${count}</span>` : ''}</button>`;
    const grid = items.length
      ? `<div class="grid gap-4 sm:grid-cols-2">${items.map(cardHtml).join('')}</div>`
      : `<div class="rounded-xl border border-dashed border-slate-300 py-10 text-center dark:border-slate-700">${icon('ImageOff', 'mx-auto h-7 w-7 text-slate-400')}<p class="mt-3 text-sm font-medium text-slate-600 dark:text-slate-300">No media in this response</p><p class="mt-1 text-xs text-slate-400">Check the JSON tab for the full data.</p></div>`;
    box.innerHTML = `<div class="response-shell reveal"><div class="mb-4 flex flex-wrap items-center gap-2"><span class="pill ${result.ok ? 'pill-ok' : 'pill-bad'}">${result.status}</span><span class="text-xs text-slate-500 dark:text-slate-400">${result.ms} ms · ${(result.size / 1024).toFixed(1)} KB</span><div role="tablist" class="tabs ml-auto">${tabBtn('media', 'Media', items.length)}${tabBtn('json', 'JSON')}</div></div><div ${tab === 'media' ? '' : 'hidden'} data-panel="media">${grid}</div><div ${tab === 'json' ? '' : 'hidden'} data-panel="json">${jsonView(jsonText)}</div></div>`;
    refreshIcons();
  };
  render();
  box.classList.remove('hidden');

  const find = (id) => items.find((i) => i.id === id);
  box.onclick = async (e) => {
    const tabEl = e.target.closest('[data-tab]');
    if (tabEl) { tab = tabEl.dataset.tab; return render(); }
    if (e.target.closest('[data-copy-json]')) { await copyText(jsonText); return toast('JSON copied'); }
    const btn = e.target.closest('[data-dl]');
    if (!btn || btn.disabled) return;
    const item = find(btn.dataset.dl);
    const label = btn.querySelector('span');
    btn.disabled = true;
    try {
      await downloadMedia({ url: item.url, blob: item.blob, name: fileNameFor(item, api.slug) }, (p) => { label.textContent = `${p}%`; });
      label.textContent = 'Saved'; toast('Download started');
    } catch (err) {
      label.textContent = 'Retry'; toast(err.message || 'Download failed', 'error');
    } finally {
      setTimeout(() => { btn.disabled = false; if (label.textContent !== 'Retry') label.textContent = 'Download'; }, 1800);
    }
  };

  // Jika CDN memblokir hotlink, muat ulang preview lewat proxy (sekali saja).
  if (box._onError) box.removeEventListener('error', box._onError, true);
  box._onError = (e) => {
    const el = e.target;
    if (!['IMG', 'VIDEO', 'AUDIO'].includes(el.tagName) || el.dataset.retried) return;
    const item = items.find((i) => el.closest('[data-media]')?.dataset.media === i.id);
    if (!item || item.blob || item.url.startsWith('data:')) return;
    el.dataset.retried = '1';
    el.src = proxyUrl(item.url, '', 'inline');
  };
  box.addEventListener('error', box._onError, true);

  // Link tanpa ekstensi: cek tipe aslinya lewat proxy, lalu perbarui kartunya.
  items.filter((i) => i.kind === 'unknown').forEach(async (item) => {
    let kind = null;
    try {
      const info = await (await fetch(proxyUrl(item.url, '', 'probe'))).json();
      kind = info.status ? kindOfMime(info.contentType) : null;
      if (kind) item.mime = info.contentType;
    } catch { kind = null; }
    if (!box.isConnected) return;
    if (kind) item.kind = kind; else items = items.filter((i) => i !== item);
    render();
  });
}
