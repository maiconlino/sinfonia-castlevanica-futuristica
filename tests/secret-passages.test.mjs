import test from 'node:test';
import assert from 'node:assert/strict';
import {Campaign, DATA, ROOM, FLOOR} from '../public/campaign-engine.mjs';

// Synthetic fixtures only. No account, token, production API or player save is accessed.
function gameAt(id){
 const g=new Campaign();g.start();g.enterRoom(id,null,true);g.transitionCd=0;return g;
}
function nextTo(g,to){
 const door=g.doors.find(d=>d.to===to);assert.ok(door);
 g.player.x=door.x+5;g.player.y=FLOOR-g.player.h;g.transitionCd=0;return door;
}
function legacyOrchardSave(){
 const g=gameAt('G05');
 for(const id of ['relic_wolf','relic_double_jump','sword_frost','accessory_rose','spell_frost'])g.obtain(id,false);
 g.level=7;g.gold=764;g.xp=125;g.time=1234;g.kills=37;g.deaths=1;
 g.sets[0]={sword:'sword_frost',spell:'spell_frost'};
 g.defeated=new Set(['boss_sacristan','boss_abbess']);
 g.chests=new Set(['G05:sword_frost','G05:accessory_rose','G05:spell_frost']);
 g.checkpointRoom='G03';g.visitedShrines.add('G03');g.recalculate();
 g.player.x=125;g.player.hp=172;g.player.mp=9;
 const s=structuredClone(g.exportSave());
 // The pre-fix game only stored G03:G05 after breaking the outside wall.
 s.discovered=['G03:G05'];return s;
}

test('unopened orchard entrance remains hidden from the outside',()=>{
 const g=gameAt('G03');
 assert.equal(g.doors.find(d=>d.to==='G05').revealed,false);
 assert.equal(g.discovered.has('G03:G05'),false);
 assert.equal(g.discovered.has('G05:G03'),false);
 assert.ok(g.breakables.find(w=>w.door.to==='G05'&&w.hp>0));
});

test('breaking the entrance wall opens both sides and allows a round trip',()=>{
 const g=gameAt('G03');g.obtain('relic_wolf',false);
 const d=nextTo(g,'G05');g.player.x=d.x-45;g.player.face=1;
 for(let i=0;i<3;i++){g.player.attackCd=0;g.attack()}
 assert.equal(d.revealed,true);
 assert.ok(g.discovered.has('G03:G05'));
 assert.ok(g.discovered.has('G05:G03'));
 nextTo(g,'G05');assert.equal(g.transform('wolf'),true);g.interact();
 assert.equal(g.roomId,'G05');assert.equal(g.doors[0].revealed,true);
 assert.equal(g.breakables.filter(w=>w.hp>0).length,0);
 nextTo(g,'G03');assert.equal(g.transform('wolf'),true);g.interact();
 assert.equal(g.roomId,'G03');assert.equal(g.doors.find(d=>d.to==='G05').revealed,true);
});

test('a legacy save inside G05 repairs the exit without resetting progress',()=>{
 const s=legacyOrchardSave(), original=structuredClone(s),g=new Campaign();
 g.importSave(s);const restored=g.exportSave();
 assert.equal(g.roomId,'G05');assert.equal(g.doors[0].revealed,true);
 assert.equal(g.breakables.filter(w=>w.hp>0).length,0);
 for(const key of Object.keys(s).filter(k=>k!=='discovered'))assert.deepEqual(restored[key],s[key],key);
 assert.deepEqual(s,original,'import must not mutate its input payload');
 assert.deepEqual([...g.discovered].sort(),['G03:G05','G05:G03']);
 nextTo(g,'G03');assert.equal(g.transform('wolf'),true);g.interact();
 assert.equal(g.roomId,'G03');
});

test('a legacy dead-end save lacking discovery flags still has a visible return',()=>{
 const s=legacyOrchardSave();s.discovered=[];
 const g=new Campaign();g.importSave(s);
 assert.equal(g.doors[0].to,'G03');assert.equal(g.doors[0].revealed,true);
 assert.deepEqual([...g.discovered].sort(),['G03:G05','G05:G03']);
 assert.equal(g.discovered.has('L03:L07'),false);
 assert.equal(g.acquired.has('relic_mist'),false);
});

test('a known return still enforces the wolf relic and transformation',()=>{
 const g=gameAt('G05');nextTo(g,'G03');g.interact();assert.equal(g.roomId,'G05');
 g.obtain('relic_wolf',false);g.interact();assert.equal(g.roomId,'G05');
 assert.equal(g.transform('wolf'),true);g.interact();assert.equal(g.roomId,'G03');
});

test('zero-mana legacy saves can regenerate and leave without a reset',()=>{
 const s=legacyOrchardSave();s.player.x=60;s.player.mp=0;
 const g=new Campaign();g.importSave(s);g.transitionCd=0;
 assert.equal(g.doors[0].revealed,true);assert.equal(g.transform('wolf'),false);
 for(let i=0;i<125;i++)g.update(1/60,{});
 assert.ok(g.player.mp>=8);assert.equal(g.transform('wolf'),true);g.interact();
 assert.equal(g.roomId,'G03');
});

const secretRooms=DATA.rooms.filter(r=>r.exits.length===1&&r.exits[0].secret);
for(const room of secretRooms){
 test(`secret dead-end ${room.id} keeps its return on entry and save reload`,()=>{
  const ex=room.exits[0],g=gameAt(ex.to);g.discovered.add(`${ex.to}:${room.id}`);
  g.enterRoom(room.id,ex.to);
  assert.equal(g.doors[0].revealed,true);
  assert.equal(g.breakables.some(w=>w.hp>0&&w.door.to===ex.to),false);
  const s=structuredClone(g.exportSave());s.discovered=[`${ex.to}:${room.id}`];
  const h=new Campaign();h.importSave(s);assert.equal(h.doors[0].revealed,true);
  assert.deepEqual(h.doors[0].requires,ex.requires,'do not waive item gates');
 });
}

test('reciprocal recovery never treats a one-way connection as two-way',()=>{
 const g=gameAt('G03');const r=ROOM.get('G03');
 const ex=r.exits.find(e=>e.to==='G05');const previous=ex.oneWay;
 try{
  ex.oneWay=true;g.revealSecretPassage('G03','G05');
  assert.ok(g.discovered.has('G03:G05'));assert.equal(g.discovered.has('G05:G03'),false);
  g.enterRoom('G05','G03');assert.equal(g.doors[0].revealed,false);
 }finally{ex.oneWay=previous}
});

test('a boss arena still blocks escape despite a revealed secret passage',()=>{
 const g=gameAt('O04');for(const id of g.doors[0].requires)g.obtain(id,false);
 nextTo(g,'O03');g.transform('mist');g.interact();
 assert.equal(g.roomId,'O04');assert.equal(g.boss.active,true);
});

test('save round-trip is idempotent and keeps the existing version 1 schema',()=>{
 const g=new Campaign();g.importSave(legacyOrchardSave());const a=structuredClone(g.exportSave());
 const h=new Campaign();h.importSave(a);const b=structuredClone(h.exportSave());
 assert.equal(a.version,1);assert.deepEqual(a,b);
});

test('all 60 rooms retain the same exit destinations and requirements',()=>{
 for(const r of DATA.rooms){
  const g=gameAt(r.id);
  assert.deepEqual(g.doors.map(d=>({to:d.to,requires:d.requires,oneWay:d.oneWay})),r.exits.map(d=>({to:d.to,requires:d.requires,oneWay:d.oneWay})),r.id);
  assert.ok(g.doors.some(d=>d.revealed),`${r.id} must have a visible passage`);
 }
});
