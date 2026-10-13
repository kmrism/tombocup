// pylon-map.html（OpenTopoMap + Leaflet のパイロンマップ）を生成する
// 座標は TonboCup_2024.wpt（十進）を正とし、TonboCupGeo_2024.wpt（度分秒）と突き合わせて一致を確認してから使う
const fs = require('fs'), path = require('path');
const SITE = path.join(__dirname, '..');
const rd = f => fs.readFileSync(path.join(SITE, f), 'latin1');

const geo = rd('TonboCupGeo_2024.wpt').split(/\r?\n/).filter(l => /^\w+\s+N /.test(l)).map(l => {
  const m = l.match(/^(\S+)\s+N (\d+) (\d+) ([\d.]+)\s+E (\d+) (\d+) ([\d.]+)\s+(\d+)\s+(\S+)\s+(.*)$/);
  return { id: m[1], lat: +m[2] + m[3] / 60 + m[4] / 3600, lon: +m[5] + m[6] / 60 + m[7] / 3600, alt: +m[8], code: m[9] };
});
const dec = rd('TonboCup_2024.wpt').split(/\r?\n/).filter(l => /^W /.test(l)).map(l => {
  const m = l.match(/^W\s+(\S+) A ([\d.]+)\S*N ([\d.]+)\S*E/);
  return { id: m[1], lat: +m[2], lon: +m[3] };
});
if (geo.length !== 16 || dec.length !== 16) throw new Error('パイロン数が16でない');
for (const g of geo) {
  const d = dec.find(x => x.id === g.id);
  if (!d || Math.hypot((g.lat - d.lat) * 111000, (g.lon - d.lon) * 91000) > 1) throw new Error('座標不一致 ' + g.id);
  g.lat = d.lat; g.lon = d.lon;
}

// 日本語名とクラス別得点は pylon-data.html の表から（座標・標高は wpt を正とする）
const html = fs.readFileSync(path.join(SITE, 'pylon-data.html'), 'utf8');
const info = {};
for (const r of html.split(/<tr/).slice(1)) {
  const c = r.replace(/<[^>]+>/g, '|').replace(/\|+/g, '|').split('|').map(s => s.trim()).filter(Boolean);
  if (c.length >= 10 && /^(A|D|E|F|G|H|J|K|M|N|O|P|Q|R|TO|LD)$/.test(c[1])) {
    info[c[1]] = { name: c[2], pts: c.slice(6, 10) };
  }
}
const dms = (v, h) => {
  const d = Math.floor(v), mf = (v - d) * 60, m = Math.floor(mf), s = (mf - m) * 60;
  let ss = s.toFixed(1), mm = m, dd = d;
  if (ss === '60.0') { ss = '0.0'; mm++; }
  if (mm === 60) { mm = 0; dd++; }
  return `${h}${dd}°${String(mm).padStart(2, '0')}'${ss.padStart(4, '0')}"`;
};
const ORDER = ['TO', 'D', 'E', 'J', 'LD', 'G', 'H', 'O', 'K', 'F', 'A', 'M', 'N', 'Q', 'P', 'R'];
const pylons = ORDER.map(code => {
  const g = geo.find(x => x.code === code), i = info[code];
  if (!g || !i) throw new Error('データなし ' + code);
  return { c: code, n: i.name, lat: +g.lat.toFixed(7), lon: +g.lon.toFixed(7), alt: g.alt,
           dms: dms(g.lat, 'N') + ' ' + dms(g.lon, 'E'), pts: i.pts };
});

const src = fs.readFileSync(path.join(SITE, 'taikai-yoko.html'), 'utf8');
const NAV = src.match(/<nav[\s\S]*?<\/nav>/)[0];
const FOOTER = src.match(/<footer[\s\S]*?<\/footer>/)[0];

const page = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>パイロンマップ | TOMBO CUP 2026</title>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css">
</head>
<body style="margin:0;padding:0;background:#F8FAFC;color:#0F172A;font-family:system-ui,-apple-system,sans-serif;">
${NAV}<div style="background:linear-gradient(135deg,#0C4A6E 0%,#164E63 40%,#0891B2 80%,#06B6D4 100%);padding:7rem 1.5rem 2.5rem;text-align:center;"><div style="display:inline-block;font-size:0.65rem;font-weight:700;letter-spacing:0.35em;text-transform:uppercase;color:rgba(255,255,255,0.55);border:1px solid rgba(255,255,255,0.2);border-radius:3px;padding:0.28rem 0.8rem;margin-bottom:1.1rem;">Pylon Map</div><h1 style="font-size:clamp(1.7rem,5vw,2.6rem);font-weight:900;color:#fff;margin:0 0 0.5rem;letter-spacing:-0.02em;line-height:1.2;">パイロンマップ</h1><p style="color:rgba(255,255,255,0.7);font-size:0.82rem;letter-spacing:0.06em;margin:0;">地形図（OpenTopoMap）・拡大／移動できます</p></div>
<div style="max-width:1100px;margin:0 auto;padding:1.25rem 1rem 3rem;">
<div style="display:flex;flex-wrap:wrap;gap:0.5rem;align-items:center;margin-bottom:0.75rem;">
<span style="font-size:0.8rem;font-weight:700;color:#334155;">得点表示クラス</span>
<span id="clsBtns" style="display:flex;gap:0.35rem;flex-wrap:wrap;"></span>
<button id="locBtn" type="button" style="margin-left:auto;border:1px solid #0891B2;background:#FFFFFF;color:#0891B2;font-weight:700;font-size:0.8rem;border-radius:8px;padding:0.45rem 0.9rem;cursor:pointer;font-family:inherit;">📍 現在地</button>
<button id="allBtn" type="button" style="border:1px solid #0891B2;background:#FFFFFF;color:#0891B2;font-weight:700;font-size:0.8rem;border-radius:8px;padding:0.45rem 0.9rem;cursor:pointer;font-family:inherit;">全体を表示</button>
</div>
<div id="map" style="height:min(72vh,680px);min-height:420px;border-radius:12px;border:1px solid #E2E8F0;box-shadow:0 1px 3px rgba(0,0,0,0.05);overflow:hidden;background:#E2E8F0;"></div>
<p style="font-size:0.76rem;color:#64748B;line-height:1.7;margin:0.6rem 0 1.25rem;">円は半径200mのシリンダー。マーカーをタップすると名称・標高・座標・得点を表示します。座標は公式ウェイポイントファイル（TonboCup_2024.wpt）による。</p>
<div id="chips" style="display:flex;flex-wrap:wrap;gap:0.4rem;"></div>
<div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:1.25rem 1.5rem;margin-top:1.5rem;"><div style="font-size:0.85rem;font-weight:700;color:#0F172A;margin-bottom:0.35rem;">&#128229; 印刷用パイロンマップ</div><p style="font-size:0.76rem;color:#64748B;line-height:1.7;margin:0 0 1rem;">OpenTopoMap の地形図に、公式ウェイポイントファイルのパイロンと得点表を載せた A4 縦の印刷用です。</p><div style="display:flex;flex-wrap:wrap;gap:0.75rem;"><a href="Pylon_Map.jpg" download style="display:inline-flex;align-items:center;gap:0.5rem;background:#FFFFFF;border:1.5px solid #E2E8F0;border-radius:8px;padding:0.7rem 1.4rem;text-decoration:none;color:#334155;font-size:0.85rem;font-weight:700;">&#128444;&#65039; Pylon Map.jpg <span style="font-size:0.68rem;background:#F1F5F9;border-radius:3px;padding:0.1rem 0.45rem;color:#64748B;">画像</span></a><a href="Pylon_Map.pdf" download style="display:inline-flex;align-items:center;gap:0.5rem;background:#FFFFFF;border:1.5px solid #E2E8F0;border-radius:8px;padding:0.7rem 1.4rem;text-decoration:none;color:#334155;font-size:0.85rem;font-weight:700;">&#128196; Pylon Map.pdf <span style="font-size:0.68rem;background:#F1F5F9;border-radius:3px;padding:0.1rem 0.45rem;color:#64748B;">PDF</span></a></div></div>
</div>
${FOOTER}
<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
<script>
// パイロン（TonboCup_2024.wpt と TonboCupGeo_2024.wpt を突き合わせて生成。手で書き換えない）
var PYLONS = ${JSON.stringify(pylons)};
var CLASSES = ['A・B', 'C', 'D', 'S'];
var cls = 0;
try { var c = Number(localStorage.getItem('otmClass')); if (c >= 0 && c < 4) cls = c; } catch (e) {}

var map = L.map('map', { zoomControl: true, scrollWheelZoom: true });
L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
  subdomains: 'abc', maxZoom: 17,
  attribution: 'Kartendaten: &copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>-Mitwirkende, SRTM | ' +
    'Kartendarstellung: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
}).addTo(map);

function color(p) { return p.c === 'TO' ? '#F97316' : p.c === 'LD' ? '#16A34A' : p.c === 'D' ? '#DC2626' : '#0C4A6E'; }
function icon(p) {
  var w = p.c.length > 1 ? 30 : 24;
  return L.divIcon({ className: '', iconSize: [w, 24], iconAnchor: [w / 2, 12],
    html: '<div style="width:' + w + 'px;height:24px;border-radius:12px;background:' + color(p) + ';color:#fff;font:800 12px/24px system-ui,sans-serif;text-align:center;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.45);box-sizing:border-box;">' + p.c + '</div>' });
}
function popup(p) {
  var pt = p.pts[cls];
  return '<div style="font-family:system-ui,sans-serif;min-width:170px;">' +
    '<div style="font-weight:800;font-size:15px;color:#0F172A;">' + p.c + '　' + p.n + '</div>' +
    '<div style="font-size:12px;color:#334155;margin-top:4px;">標高 ' + p.alt + ' m</div>' +
    '<div style="font-size:12px;color:#334155;">' + p.dms + '</div>' +
    '<div style="font-size:12px;color:#334155;margin-top:4px;">得点（' + CLASSES[cls] + '）：<b>' + (pt === '—' ? '—' : pt + ' 点') + '</b></div></div>';
}
var markers = {};
PYLONS.forEach(function (p) {
  L.circle([p.lat, p.lon], { radius: 200, color: color(p), weight: 1.5, fillOpacity: 0.08 }).addTo(map);
  markers[p.c] = L.marker([p.lat, p.lon], { icon: icon(p), title: p.c + ' ' + p.n }).addTo(map).bindPopup(function () { return popup(p); });
});
var bounds = L.latLngBounds(PYLONS.map(function (p) { return [p.lat, p.lon]; }));
map.fitBounds(bounds, { padding: [20, 20] });
document.getElementById('allBtn').onclick = function () { map.fitBounds(bounds, { padding: [20, 20] }); };

// 得点表示のクラス切替
function drawCls() {
  document.getElementById('clsBtns').innerHTML = CLASSES.map(function (c, i) {
    var on = i === cls;
    return '<button type="button" data-i="' + i + '" style="border:1px solid ' + (on ? '#0891B2' : '#E2E8F0') + ';background:' + (on ? '#0891B2' : '#F8FAFC') + ';color:' + (on ? '#fff' : '#334155') + ';font-weight:700;font-size:0.78rem;border-radius:999px;padding:0.3rem 0.8rem;cursor:pointer;font-family:inherit;">' + c + '</button>';
  }).join('');
  Array.prototype.forEach.call(document.querySelectorAll('#clsBtns button'), function (b) {
    b.onclick = function () { cls = Number(b.getAttribute('data-i')); try { localStorage.setItem('otmClass', cls); } catch (e) {} drawCls(); map.closePopup(); };
  });
}
drawCls();

// パイロン一覧（タップでその場所へ）
document.getElementById('chips').innerHTML = PYLONS.map(function (p) {
  return '<button type="button" data-c="' + p.c + '" style="display:inline-flex;align-items:center;gap:0.4rem;border:1px solid #E2E8F0;background:#fff;border-radius:999px;padding:0.3rem 0.75rem 0.3rem 0.3rem;cursor:pointer;font-family:inherit;font-size:0.8rem;color:#334155;white-space:nowrap;">' +
    '<span style="display:inline-block;min-width:22px;height:22px;padding:0 4px;box-sizing:border-box;border-radius:11px;background:' + color(p) + ';color:#fff;font-weight:800;font-size:11px;line-height:22px;text-align:center;">' + p.c + '</span>' + p.n + '</button>';
}).join('');
Array.prototype.forEach.call(document.querySelectorAll('#chips button'), function (b) {
  b.onclick = function () {
    var m = markers[b.getAttribute('data-c')];
    map.setView(m.getLatLng(), 15); m.openPopup();
    document.getElementById('map').scrollIntoView({ behavior: 'smooth', block: 'center' });
  };
});

// 現在地（端末の位置情報を使う。許可されなければ何もしない）
var me = null;
document.getElementById('locBtn').onclick = function () { map.locate({ setView: true, maxZoom: 15, enableHighAccuracy: true }); };
map.on('locationfound', function (e) {
  if (me) map.removeLayer(me);
  me = L.circleMarker(e.latlng, { radius: 7, color: '#fff', weight: 2, fillColor: '#2563EB', fillOpacity: 1 }).addTo(map).bindPopup('現在地');
});
map.on('locationerror', function () { alert('現在地を取得できませんでした（位置情報の許可を確認してください）'); });
</script>
</body>
</html>
`;
fs.writeFileSync(path.join(SITE, 'pylon-map.html'), page);
const o = (page.match(/<div[\s>]/g) || []).length, c = (page.match(/<\/div>/g) || []).length;
console.log('pylon-map.html div', o, c, o === c ? 'OK' : 'MISMATCH', '(script 内の文字列を含む)');
console.log(pylons.map(p => p.c + ' ' + p.n + ' ' + p.alt + ' ' + p.pts.join('/')).join('\n'));
