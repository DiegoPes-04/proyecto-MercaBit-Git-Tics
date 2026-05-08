const { Resvg } = require('@resvg/resvg-js');
const fs = require('fs');
const path = require('path');

const SVG = fs.readFileSync(path.resolve(__dirname, 'public/img/favicon.svg'), 'utf8');

const targets = [
  { dir: 'android/app/src/main/res/mipmap-mdpi',    icon: 48,  fg: 108 },
  { dir: 'android/app/src/main/res/mipmap-hdpi',    icon: 72,  fg: 162 },
  { dir: 'android/app/src/main/res/mipmap-xhdpi',   icon: 96,  fg: 216 },
  { dir: 'android/app/src/main/res/mipmap-xxhdpi',  icon: 144, fg: 324 },
  { dir: 'android/app/src/main/res/mipmap-xxxhdpi', icon: 192, fg: 432 },
];

function renderPng(size) {
  const resvg = new Resvg(SVG, { fitTo: { mode: 'width', value: size } });
  return resvg.render().asPng();
}

for (const { dir, icon, fg } of targets) {
  const out = path.resolve(__dirname, dir);
  const iconPng = renderPng(icon);
  fs.writeFileSync(`${out}/ic_launcher.png`, iconPng);
  fs.writeFileSync(`${out}/ic_launcher_round.png`, iconPng);
  fs.writeFileSync(`${out}/ic_launcher_foreground.png`, renderPng(fg));
  console.log(`✓ ${dir}`);
}

console.log('Iconos generados.');
