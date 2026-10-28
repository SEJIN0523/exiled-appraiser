import test from 'node:test';
import assert from 'node:assert/strict';
import {materialPixel} from '../portraits.js';
import {APPEARANCE_VARIANTS,createAppearance} from '../character.js';
import {compactNumber} from '../display.js';
import {freshState,serialize,restore} from '../engine.js';
import {RECRUITS} from '../data.js';

test('every fixed variation preserves warm skin pixels anywhere on the body',()=>{
 const skin=[[245,213,188,255],[225,170,124,255],[161,110,77,255],[89,60,43,128],[252,234,220,255]];
 for(const preset of APPEARANCE_VARIANTS)for(const rgba of skin)for(const y of [.1,.4,.65,.9])assert.deepEqual(materialPixel(...rgba,y,preset.id),rgba);
});
test('head, eyes, neutral metal and transparent pixels never receive a tint',()=>{
 for(const preset of APPEARANCE_VARIANTS){
  assert.deepEqual(materialPixel(70,150,170,255,.2,preset.id),[70,150,170,255]);
  assert.deepEqual(materialPixel(180,180,180,255,.7,preset.id),[180,180,180,255]);
  assert.deepEqual(materialPixel(60,180,90,0,.7,preset.id),[60,180,90,0]);
 }
});
test('cloth changes between fixed variants while shading and alpha remain intact',()=>{
 const cloth=[55,120,160,200];const navy=materialPixel(...cloth,.65,'navy'),wine=materialPixel(...cloth,.65,'wine');
 assert.notDeepEqual(navy,wine);assert.notDeepEqual(wine,cloth);assert.equal(wine[3],200);
 const dark=materialPixel(24,60,80,200,.65,'wine');assert.ok(dark[0]+dark[1]+dark[2]<wine[0]+wine[1]+wine[2]);
 assert.deepEqual(materialPixel(...cloth,.65,'original'),cloth);
});
test('old blue-skin custom appearance migrates to a fixed look without losing progress',()=>{
 const s=freshState(100000);s.gold=5432;s.heroes[0].level=16;s.heroes[0].mastery.sword=123;
 s.heroes[0].appearance={palette:'custom',hue:220,saturation:120,brightness:103};
 const c=restore(serialize(s,100000),100000).state;
 assert.equal(c.gold,5432);assert.equal(c.heroes[0].level,16);assert.equal(c.heroes[0].mastery.sword,123);assert.deepEqual(c.heroes[0].appearance,createAppearance('elina'));
});
test('same source-image recruits have different immutable material variants',()=>{
 const mage=RECRUITS[4];assert.equal(mage.job,'mage');assert.equal(mage.variant,3);
 assert.notEqual(createAppearance('rune').variant,createAppearance('recruit4').variant);
 assert.equal(RECRUITS[8].variant,4);assert.equal(RECRUITS[9].variant,4);
});
test('compact numeric labels fit small screens without dropping full numeric state',()=>{
 assert.equal(compactNumber(9999),'9,999');assert.equal(compactNumber(12345),'1.2만');assert.equal(compactNumber(100000000),'1억');assert.ok(compactNumber(999999999999).length<12);assert.equal(compactNumber(NaN),'—');
});
test('portrait shell and all runtime dependencies are included for Android PWA',async()=>{
 const {readFile}=await import('node:fs/promises');const manifest=JSON.parse(await readFile(new URL('../manifest.webmanifest',import.meta.url)));
 assert.equal(manifest.orientation,'portrait');
 const html=await readFile(new URL('../index.html',import.meta.url),'utf8'),workflow=await readFile(new URL('../docs/github-pages-actions.example.yml',import.meta.url),'utf8'),sw=await readFile(new URL('../sw.js',import.meta.url),'utf8'),app=await readFile(new URL('../app.js',import.meta.url),'utf8');
 for(const file of ['mobile.css','portraits.js','display.js']){assert.ok(workflow.includes(file));assert.ok(sw.includes(file));}
 assert.ok(html.includes('./mobile.css'));assert.equal(app.includes('data-action="palette"'),false);assert.equal(app.includes('data-change="appearance"'),false);
 const mobile=await readFile(new URL('../mobile.css',import.meta.url),'utf8'),character=await readFile(new URL('../character.css',import.meta.url),'utf8');
 assert.ok(mobile.includes('max-width:480px'));assert.ok(mobile.includes('safe-area-inset-bottom'));assert.equal(character.includes('hue-rotate'),false);
});
