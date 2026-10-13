// 印刷用パイロンマップ（A4縦）の HTML を作る。Chrome（ヘッドレス）で撮影して Pylon_Map.jpg／.pdf にする
// 座標・標高は TonboCup_2024.wpt（十進）／TonboCupGeo_2024.wpt（度分秒）を突き合わせたもの、名称・得点は pylon-data.html
const fs = require('fs'), path = require('path');
const SITE = path.join(__dirname, '..');
const OUT = process.argv[2];
const rd = f => fs.readFileSync(path.join(SITE, f), 'latin1');

const geo = rd('TonboCupGeo_2024.wpt').split(/\r?\n/).filter(l => /^\w+\s+N /.test(l)).map(l => {
  const m = l.match(/^(\S+)\s+N (\d+) (\d+) ([\d.]+)\s+E (\d+) (\d+) ([\d.]+)\s+(\d+)\s+(\S+)\s+(.*)$/);
  return { id: m[1], lat: +m[2] + m[3] / 60 + m[4] / 3600, lon: +m[5] + m[6] / 60 + m[7] / 3600, alt: +m[8], code: m[9],
           dlat: `${m[2]}° ${m[3]}' ${(+m[4]).toFixed(1).padStart(4, '0')}"`, dlon: `${m[5]}° ${m[6]}' ${(+m[7]).toFixed(1).padStart(4, '0')}"` };
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
const html = fs.readFileSync(path.join(SITE, 'pylon-data.html'), 'utf8');
const info = {};
for (const tr of html.match(/<tr[\s\S]*?<\/tr>/g)) {
  const c = [...tr.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map(m => m[1].replace(/<[^>]+>/g, '').trim());
  if (c.length >= 9 && /^(A|D|E|F|G|H|J|K|M|N|O|P|Q|R|TO|LD)$/.test(c[0])) info[c[0]] = { name: c[1], pts: c.slice(5, 9) };
}
const ORDER = ['A', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'M', 'N', 'O', 'P', 'Q', 'R', 'TO', 'LD'];
const P = ORDER.map(code => {
  const g = geo.find(x => x.code === code), i = info[code];
  if (!g || !i) throw new Error('データなし ' + code);
  return { c: code, n: i.name, lat: g.lat, lon: g.lon, alt: g.alt, dlat: g.dlat, dlon: g.dlon, pts: i.pts };
});

const color = c => c === 'TO' ? '#F97316' : c === 'LD' ? '#16A34A' : c === 'D' ? '#DC2626' : c === 'E' ? '#CA8A04' : '#0C4A6E';
const rows = P.map(p => `<tr><td style="padding:3px 6px;"><span style="display:inline-block;min-width:26px;padding:0 4px;box-sizing:border-box;border-radius:13px;background:${color(p.c)};color:#fff;font-weight:800;text-align:center;line-height:22px;font-size:13px;">${p.c}</span></td>` +
  `<td style="padding:3px 8px;white-space:nowrap;font-weight:700;">${p.n}</td>` +
  `<td style="padding:3px 6px;white-space:nowrap;">${p.dlat}</td><td style="padding:3px 6px;white-space:nowrap;">${p.dlon}</td>` +
  `<td style="padding:3px 6px;text-align:right;">${p.alt}</td>` + p.pts.map(x => `<td style="padding:3px 6px;text-align:right;">${x}</td>`).join('') + `</tr>`).join('');

const page = `<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css">
<style>@page{size:A4 portrait;margin:0}html,body{margin:0;padding:0}.leaflet-control-attribution{font-size:13px!important;background:rgba(255,255,255,.9)!important;margin:0 16px 10px 0!important;padding:2px 8px!important;border-radius:4px}</style>
</head><body style="font-family:'Yu Gothic UI','Meiryo',system-ui,sans-serif;">
<div style="position:relative;width:1240px;height:1754px;overflow:hidden;">
<div id="map" style="position:absolute;inset:0;"></div>
<div style="position:absolute;left:24px;top:24px;z-index:1000;background:rgba(255,255,255,0.92);border-radius:14px;padding:14px 22px;box-shadow:0 2px 10px rgba(0,0,0,0.25);">
<div style="font-size:15px;font-weight:700;letter-spacing:0.25em;color:#0891B2;">TOMBO CUP 2026</div>
<div style="font-size:34px;font-weight:900;color:#0C4A6E;line-height:1.2;">パイロンマップ</div>
<div style="font-size:14px;color:#334155;margin-top:4px;">円はシリンダー（半径200m）　座標・標高：公式ウェイポイントファイル</div></div>
<div style="position:absolute;right:20px;bottom:52px;z-index:1000;background:rgba(255,255,255,0.94);border-radius:12px;padding:10px 12px;box-shadow:0 2px 10px rgba(0,0,0,0.25);font-size:14px;color:#0F172A;">
<table style="border-collapse:collapse;">
<tr style="color:#64748B;font-size:12px;"><th></th><th style="text-align:left;padding:2px 8px;">パイロン</th><th style="padding:2px 6px;">北緯</th><th style="padding:2px 6px;">東経</th><th style="padding:2px 6px;">標高</th><th style="padding:2px 6px;">A・B</th><th style="padding:2px 6px;">C</th><th style="padding:2px 6px;">D</th><th style="padding:2px 6px;">S</th></tr>
${rows}</table></div>
</div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
<script>
var P = ${JSON.stringify(P.map(p => ({ c: p.c, lat: p.lat, lon: p.lon })))};
function color(c){return c==='TO'?'#F97316':c==='LD'?'#16A34A':c==='D'?'#DC2626':c==='E'?'#CA8A04':'#0C4A6E';}
var map = L.map('map', { zoomControl: false, zoomSnap: 0, fadeAnimation: false, zoomAnimation: false });
L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', { subdomains: 'abc', maxZoom: 17,
  attribution: 'Kartendaten: &copy; OpenStreetMap-Mitwirkende, SRTM | Kartendarstellung: &copy; OpenTopoMap (CC-BY-SA)' }).addTo(map);
map.attributionControl.setPrefix(false);
P.forEach(function (p) {
  L.circle([p.lat, p.lon], { radius: 200, color: color(p.c), weight: 3, fillOpacity: 0.12 }).addTo(map);
  var w = p.c.length > 1 ? 46 : 36;
  var badge = '<div style="width:' + w + 'px;height:36px;border-radius:18px;background:' + color(p.c) + ';color:#fff;font:900 19px/32px system-ui,sans-serif;text-align:center;border:2px solid #fff;box-shadow:0 1px 5px rgba(0,0,0,.5);box-sizing:border-box;">' + p.c + '</div>';
  if (p.c === 'J') {
    // J は D と約99mしか離れておらず記号が重なるので、記号を上にずらして線と点で実際の位置を示す
    L.marker([p.lat, p.lon], { icon: L.divIcon({ className: '', iconSize: [36, 92], iconAnchor: [18, 87],
      html: '<div style="position:relative;width:36px;height:92px;">' + badge +
        '<div style="position:absolute;left:17px;top:36px;width:2px;height:48px;background:' + color(p.c) + ';"></div>' +
        '<div style="position:absolute;left:12px;top:80px;width:12px;height:12px;border-radius:6px;background:' + color(p.c) + ';border:2px solid #fff;box-sizing:border-box;"></div></div>' }) }).addTo(map);
  } else {
    L.marker([p.lat, p.lon], { icon: L.divIcon({ className: '', iconSize: [w, 36], iconAnchor: [w / 2, 18], html: badge }) }).addTo(map);
  }
});
// 左上の題名と右下の表にパイロンが隠れないよう余白を取って全体を収める
map.fitBounds(L.latLngBounds(P.map(function (p) { return [p.lat, p.lon]; })), { paddingTopLeft: [60, 170], paddingBottomRight: [60, 80] });
</script></body></html>`;
fs.writeFileSync(OUT, page);
console.log('written', OUT);
