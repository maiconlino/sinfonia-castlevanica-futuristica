export const W=960,H=540,FLOOR=466,WORLD=5700;
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
export const ROOMS=[{x:0,name:'O PÓRTICO DA LUA',sub:'I · A memória da pedra'},{x:1560,name:'BIBLIOTECA SINTÉTICA',sub:'II · Os mitos foram reescritos'},{x:3050,name:'SANTUÁRIO DE PROMETEU',sub:'III · O fogo aprendeu a pensar'},{x:4380,name:'O CORAÇÃO DO ORÁCULO',sub:'IV · A última criação'}];
export class Game {
  constructor(emit=()=>{}){this.emit=emit;this.state='title';this.time=0;this.ambient=0;this.reset();this.state='title'}
  reset(){
    this.state='playing';this.time=0;this.cam=0;this.shake=0;this.flash=0;this.room=0;this.roomTime=4;this.kills=0;this.relics=0;this.particles=[];this.slashes=[];this.shots=[];this.floaters=[];this.ghosts=[];this.hitstop=0;this.hint=0;this.checkpoint=false;this.checkpointX=140;this.bossTriggered=false;this.victoryTimer=0;this.gateHint=0;
    this.player={x:140,y:FLOOR-58,w:27,h:58,vx:0,vy:0,face:1,hp:180,maxHp:180,mp:100,maxMp:100,potions:3,jumps:0,grounded:true,inv:0,attack:0,attackCd:0,magicCd:0,dash:0,dashCd:0,walk:0,safeX:140,damage:17};
    this.platforms=[{x:0,y:FLOOR,w:1560,h:74,ground:true},{x:1770,y:FLOOR,w:1410,h:74,ground:true},{x:3370,y:FLOOR,w:2330,h:74,ground:true},{x:510,y:376,w:160,h:22},{x:840,y:351,w:170,h:22},{x:1120,y:310,w:200,h:26},{x:1500,y:382,w:120,h:22},{x:1710,y:360,w:100,h:22},{x:1930,y:378,w:150,h:22},{x:2210,y:348,w:150,h:22},{x:2450,y:306,w:180,h:26},{x:2870,y:361,w:160,h:22},{x:3150,y:375,w:130,h:22},{x:3380,y:365,w:160,h:22},{x:3620,y:302,w:200,h:26},{x:4610,y:353,w:130,h:22},{x:5340,y:353,w:140,h:22}];
    this.enemies=[['guard',680,FLOOR-53],['bat',980,275],['guard',1400,FLOOR-53],['wisp',1950,313],['guard',2140,FLOOR-53],['bat',2390,246],['guard',2710,FLOOR-53],['wisp',2940,305],['guard',3470,FLOOR-53],['bat',3670,250],['guard',3890,FLOOR-53]].map(([type,x,y],i)=>({id:i,type,x,y,startX:x,startY:y,w:type==='bat'?32:30,h:type==='guard'?53:32,hp:type==='guard'?90:52,maxHp:type==='guard'?90:52,face:-1,cd:1+i*.13,hit:0,hitCd:0,dead:false,phase:i,windup:0}));
    this.items=[{type:'seal',name:'Selo de Mnemosine',x:1220,y:274,taken:false},{type:'seal',name:'Selo de Hermes',x:2540,y:270,taken:false},{type:'seal',name:'Selo de Prometeu',x:3720,y:266,taken:false},{type:'potion',name:'Poção de sangue',x:580,y:346,taken:false},{type:'mana',name:'Fragmento de éter',x:2030,y:341,taken:false},{type:'potion',name:'Poção de sangue',x:2910,y:326,taken:false},{type:'power',name:'Runa da tempestade',x:3480,y:331,taken:false}];
    this.boss={x:5240,y:FLOOR-138,w:86,h:138,hp:1650,maxHp:1650,active:false,dead:false,phase:1,mode:'sleep',timer:0,hit:0,hitCd:0,face:-1,cycle:0,shield:false,warning:0};
  }
  start(){this.reset();this.emit('scene','explore');this.emit('toast','Encontre os três selos antigos. Segure J para liberar a Crissaegrim.');}
  pause(){if(this.state==='playing'){this.state='paused';this.emit('pause',true)}}
  resume(){if(this.state==='paused'){this.state='playing';this.emit('pause',false)}}
  sound(name){this.emit('sfx',name)}
  toast(text){this.emit('toast',text)}
  burst(x,y,color,n=18,speed=160){for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,v=(.3+Math.random())*speed;this.particles.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:.25+Math.random()*.55,max:.8,color,size:1+Math.random()*3})}}
  text(x,y,text,color='#f8ead3'){this.floaters.push({x,y,text,color,life:1})}
  slash(x,y,face,power=1){this.slashes.push({x,y,face,life:.24,max:.24,angle:(Math.random()-.5)*1.4,r:45+Math.random()*38,power})}
  damagePlayer(n,fromX){const p=this.player;if(p.inv>0||this.state!=='playing')return;p.hp=Math.max(0,p.hp-n);p.inv=1.15;p.vx=(p.x<fromX?-1:1)*230;p.vy=-170;this.shake=7;this.flash=.14;this.sound('hurt');this.burst(p.x+14,p.y+26,'#ef739f',12,110);this.text(p.x,p.y-12,'−'+n,'#ff819a');if(p.hp<=0){this.state='dead';this.sound('death');this.emit('end','dead')}}
  hitEnemy(e,damage,face){if(e.dead||e.hitCd>0)return;e.hp-=damage;e.hit=.12;e.hitCd=.115;this.burst(e.x+e.w/2,e.y+e.h/2,e.type==='guard'?'#dac99b':'#a9f8ef',8,120);this.text(e.x+5,e.y-8,String(damage));e.x+=face*5;this.sound('hit');this.shake=Math.max(this.shake,2.5);if(e.hp<=0){e.dead=true;this.kills++;this.burst(e.x+e.w/2,e.y+20,'#a482dc',24,190);this.player.mp=Math.min(100,this.player.mp+8);if(this.kills%3===0){this.player.hp=Math.min(this.player.maxHp,this.player.hp+12);this.text(e.x,e.y,'+12 PV','#93e8c8')}}}
  hitBoss(damage){const b=this.boss;if(!b.active||b.dead||b.hitCd>0)return;if(b.shield){this.text(b.x+20,b.y-8,'ESCUDO','#8dcaec');b.hitCd=.22;return}b.hp=Math.max(0,b.hp-damage);b.hit=.1;b.hitCd=.105;this.burst(b.x+b.w/2,b.y+66,'#acffff',10,140);this.text(b.x+20,b.y-8,String(damage),'#ecdfa2');this.sound('hit');this.shake=3;if(b.hp<=0){b.dead=true;b.active=false;this.shots=[];this.shake=18;this.flash=.6;this.victoryTimer=3;this.sound('boss');this.emit('scene','victory');this.burst(b.x+45,b.y+70,'#9effef',120,300);this.toast('O Oráculo silenciou. Os mitos voltaram a pertencer aos vivos.')}}
  update(dt,input={}){
    dt=Math.min(dt,.0334);this.ambient+=dt;if(this.state!=='playing')return;this.time+=dt;const p=this.player;
    for(const k of ['inv','attack','attackCd','magicCd','dash','dashCd'])p[k]=Math.max(0,p[k]-dt);
    this.roomTime=Math.max(0,this.roomTime-dt);this.shake=Math.max(0,this.shake-dt*28);this.flash=Math.max(0,this.flash-dt);this.gateHint=Math.max(0,this.gateHint-dt);
    if(this.victoryTimer>0){this.victoryTimer-=dt;if(this.victoryTimer<=0){this.state='won';this.emit('end','won')}}
    if(input.potion){if(p.hp<p.maxHp&&p.potions>0){p.potions--;p.hp=Math.min(p.maxHp,p.hp+85);this.sound('pickup');this.burst(p.x+14,p.y+30,'#fa799e',30,140);this.text(p.x,p.y-16,'+85 PV','#fdadc5')}else this.toast(p.potions?'Sua vida já está completa.':'Nenhuma poção restante.')}
    let move=(input.right?1:0)-(input.left?1:0);
    if(p.dash<=0){p.vx=move*238;if(move)p.face=move}
    if(input.jump&&p.jumps<2){p.vy=-560;p.grounded=false;p.jumps++;this.sound('jump');this.burst(p.x+13,p.y+p.h,p.jumps===2?'#ac8af9':'#aaa0b6',p.jumps===2?17:7,100);if(p.jumps===2){this.slashes.push({x:p.x+12,y:p.y+p.h-5,face:1,life:.45,max:.45,angle:0,r:27,power:0})}}
    if(input.dash&&p.dashCd<=0){p.dash=.19;p.dashCd=.65;p.inv=Math.max(p.inv,.26);p.vx=p.face*790;p.vy=Math.min(p.vy,0);this.sound('dash')}
    if(p.dash>0){p.vx=p.face*790;this.ghosts.push({x:p.x,y:p.y,face:p.face,life:.24,walk:p.walk})}
    const prevY=p.y;p.vy=Math.min(830,p.vy+1510*dt);p.x+=p.vx*dt;p.y+=p.vy*dt;p.grounded=false;
    p.x=clamp(p.x,this.bossTriggered&&!this.boss.dead?4410:20,WORLD-p.w-30);
    for(const plat of this.platforms)if(p.vy>=0&&p.x+p.w>plat.x&&p.x<plat.x+plat.w&&prevY+p.h<=plat.y+3&&p.y+p.h>=plat.y){p.y=plat.y-p.h;p.vy=0;p.grounded=true;p.jumps=0;if(plat.ground)p.safeX=p.x}
    if(p.y>H+100){p.x=clamp(p.safeX,50,4350);p.y=FLOOR-p.h-5;p.vy=0;p.inv=0;this.damagePlayer(22,p.x-20);this.toast('O abismo devolveu seu eco, mas cobrou parte da sua vida.')}
    if(move&&p.grounded)p.walk+=dt*12;else p.walk+=dt*3;
    p.mp=Math.min(p.maxMp,p.mp+dt*4.7);
    if(input.attack&&p.attackCd<=0){p.attack=.22;p.attackCd=.125;this.sound('slash');for(let i=0;i<3;i++)this.slash(p.x+14+p.face*(36+i*17),p.y+24+(i-1)*13,p.face);const box={x:p.face>0?p.x+7:p.x-111,y:p.y-12,w:130,h:p.h+30};for(const e of this.enemies)if(!e.dead&&overlap(box,e))this.hitEnemy(e,p.damage+Math.floor(Math.random()*6),p.face);if(overlap(box,this.boss))this.hitBoss(p.damage+5)}
    if(input.magic&&p.magicCd<=0){if(p.mp>=30){p.mp-=30;p.magicCd=.8;this.sound('magic');this.shake=6;this.flash=.13;this.slashes.push({x:p.x+14,y:p.y+27,face:p.face,life:.55,max:.55,angle:0,r:210,power:2});this.burst(p.x+14,p.y+28,'#a995ff',55,360);for(const e of this.enemies)if(!e.dead&&Math.abs(e.x-p.x)<300){e.hitCd=0;this.hitEnemy(e,72,p.face)}if(this.boss.active&&Math.abs(this.boss.x-p.x)<320){this.boss.hitCd=0;this.hitBoss(90)}this.shots=this.shots.filter(s=>Math.abs(s.x-p.x)>290)}else{p.magicCd=.45;this.toast('Éter insuficiente. Ele se regenera com o tempo.')}}
    for(const item of this.items){if(item.taken)continue;if(Math.abs(p.x+14-item.x)<35&&Math.abs(p.y+28-item.y)<48){item.taken=true;this.sound('pickup');this.burst(item.x,item.y,item.type==='seal'?'#edca85':'#8de9e4',32,180);if(item.type==='seal'){this.relics++;this.toast(item.name+' · '+this.relics+'/3 selos reunidos');p.mp=100;}else if(item.type==='potion'){p.potions++;this.toast('Poção encontrada. Pressione E para recuperar 85 PV.')}else if(item.type==='mana'){p.mp=100;this.toast('Fragmento de éter · magia restaurada')}else{p.damage=23;this.toast('Runa da tempestade · poder da Crissaegrim aumentado!')}}}
    if(!this.checkpoint&&p.x>4010&&p.x<4160){this.checkpoint=true;this.checkpointX=4070;p.hp=p.maxHp;p.mp=p.maxMp;p.potions=Math.max(p.potions,2);this.sound('checkpoint');this.burst(4080,420,'#8cf0df',65,150);this.toast('Santuário ativado · vida, éter e poções restaurados')}
    if(p.x>4350&&!this.bossTriggered){if(this.relics<3){p.x=4350;if(this.gateHint<=0){this.gateHint=4;this.toast('O portão exige os três selos. Procure as relíquias douradas nas plataformas.')}}else{this.bossTriggered=true;this.boss.active=true;this.boss.mode='intro';this.boss.timer=2.8;p.x=4430;this.roomTime=4;this.toast('ORÁCULO Ω · A inteligência que sonhou ser um deus');this.emit('scene','boss');this.sound('boss')}}
    for(const e of this.enemies){if(e.dead)continue;e.hit=Math.max(0,e.hit-dt);e.hitCd=Math.max(0,e.hitCd-dt);if(Math.abs(e.x-p.x)>650)continue;e.phase+=dt;e.cd-=dt;e.face=p.x<e.x?-1:1;
      if(e.type==='guard'){const dist=Math.abs(p.x-e.x);if(dist>44&&dist<340){e.x+=e.face*48*dt;const floor=this.platforms.find(q=>q.ground&&e.x>q.x&&e.x+e.w<q.x+q.w);if(!floor)e.x=e.startX}if(dist<105&&e.cd<=0&&e.windup<=0){e.windup=.55;e.cd=1.65}if(e.windup>0){e.windup-=dt;if(e.windup<=0){this.slash(e.x+e.w/2+e.face*25,e.y+30,e.face,-1);if(dist<94&&Math.abs(p.y-e.y)<65)this.damagePlayer(14,e.x)}}}
      else if(e.type==='bat'){e.y=e.startY+Math.sin(e.phase*3)*29;if(Math.abs(p.x-e.x)<350){e.x+=e.face*70*dt;e.y+=(p.y+20-e.y)*dt*.7}}
      else {e.y=e.startY+Math.sin(e.phase*2)*22;if(e.cd<=0){const dx=p.x-e.x,dy=p.y+25-e.y,len=Math.hypot(dx,dy);this.shots.push({x:e.x+14,y:e.y+12,vx:dx/len*155,vy:dy/len*155,r:7,life:4,color:'#c987fb',type:'orb'});e.cd=2.4}}
      if(overlap(p,e))this.damagePlayer(e.type==='guard'?12:10,e.x);
    }
    this.updateBoss(dt);
    for(const s of this.shots){s.life-=dt;s.x+=s.vx*dt;s.y+=s.vy*dt;if(s.type==='wave')s.y=FLOOR-9;if(s.life>0&&overlap(p,{x:s.x-s.r,y:s.y-s.r,w:s.r*2,h:s.r*2})){this.damagePlayer(s.type==='wave'?19:15,s.x);s.life=0}}
    this.shots=this.shots.filter(s=>s.life>0&&s.x>-50&&s.x<WORLD+50);
    for(const z of this.particles){z.life-=dt;z.x+=z.vx*dt;z.y+=z.vy*dt;z.vy+=190*dt;z.vx*=.98}this.particles=this.particles.filter(z=>z.life>0);
    for(const z of this.slashes)z.life-=dt;this.slashes=this.slashes.filter(z=>z.life>0);
    for(const z of this.floaters){z.life-=dt;z.y-=30*dt}this.floaters=this.floaters.filter(z=>z.life>0);
    for(const z of this.ghosts)z.life-=dt;this.ghosts=this.ghosts.filter(z=>z.life>0);
    let newRoom=0;ROOMS.forEach((r,i)=>{if(p.x>=r.x)newRoom=i});if(newRoom!==this.room){this.room=newRoom;this.roomTime=3.5;this.emit('room',ROOMS[newRoom].name)}
    const target=clamp(p.x-W*.36,0,WORLD-W);this.cam+=(target-this.cam)*Math.min(1,dt*7);
  }
  updateBoss(dt){const b=this.boss,p=this.player;b.hit=Math.max(0,b.hit-dt);b.hitCd=Math.max(0,b.hitCd-dt);if(!b.active||b.dead)return;b.face=p.x<b.x?-1:1;b.timer-=dt;
    if(b.mode==='intro'){if(b.timer<=0){b.mode='idle';b.timer=.6}return}
    if(b.hp<b.maxHp*.5&&b.phase===1){b.phase=2;b.mode='ascend';b.timer=1.7;b.shield=true;this.toast('Fase II · O Oráculo reescreve a própria alma');this.burst(b.x+43,b.y+40,'#f090dc',75,230);this.shake=9;}
    if(b.mode==='ascend'){if(b.timer<=0){b.shield=false;b.mode='idle';b.timer=.3}return}
    if(b.mode==='idle'){const distance=Math.abs(p.x-b.x);if(distance>135)b.x+=b.face*(b.phase===1?63:85)*dt;if(b.timer<=0){b.cycle++;const attack=b.cycle%3;b.mode=attack===0?'windwave':attack===1?'windorb':'winddash';b.timer=b.phase===1?1.05:.8;b.warning=1;}}
    else if(b.mode.startsWith('wind')){b.warning=b.timer;if(b.timer<=0){b.warning=0;if(b.mode==='windwave'){for(const face of [-1,1])this.shots.push({x:b.x+43,y:FLOOR-9,vx:face*(b.phase===1?210:275),vy:0,r:14,life:4,type:'wave',color:'#cba1fa'});if(b.phase===2)this.shots.push({x:p.x+10,y:70,vx:0,vy:240,r:15,life:2,color:'#ff80c9',type:'orb'});this.shake=8;b.mode='recover';b.timer=1.55;this.sound('magic')}else if(b.mode==='windorb'){let aim=Math.atan2(p.y+22-(b.y+50),p.x+14-(b.x+43));for(let i=-2;i<=2;i++)this.shots.push({x:b.x+43,y:b.y+50,vx:Math.cos(aim+i*.25)*(b.phase===1?175:220),vy:Math.sin(aim+i*.25)*(b.phase===1?175:220),r:8,life:4,type:'orb',color:'#d597f7'});b.mode='recover';b.timer=1.55;this.sound('magic')}else{b.mode='dash';b.timer=.55;b.dashFace=b.face;this.sound('dash')}}}
    else if(b.mode==='dash'){b.x+=b.dashFace*460*dt;b.x=clamp(b.x,4470,5520);if(b.timer<=0){b.mode='recover';b.timer=1.7}}
    else if(b.mode==='recover'&&b.timer<=0){b.mode='idle';b.timer=.5}
    if(overlap(p,{x:b.x+12,y:b.y+28,w:b.w-24,h:b.h-28}))this.damagePlayer(b.mode==='dash'?23:14,b.x);
  }
  retry(){if(this.checkpoint){const relics=this.items.filter(i=>i.type==='seal').map(i=>i.taken),power=this.player.damage;this.reset();this.items.forEach(i=>{if(i.type==='seal')i.taken=true});this.relics=relics.filter(Boolean).length;this.items.filter(i=>i.type==='seal').forEach((i,j)=>i.taken=relics[j]);this.enemies.forEach(e=>e.dead=true);this.player.x=4070;this.player.safeX=4070;this.player.damage=power;this.cam=3700;this.checkpoint=true;this.checkpointX=4070;this.room=2;this.emit('scene','explore');this.toast('O santuário guardou seu eco. Tente outra vez.')}else this.start()}
  snapshot(){const p=this.player;return{state:this.state,room:ROOMS[this.room].name,health:Math.round(p.hp),mana:Math.round(p.mp),seals:this.relics,potions:p.potions,checkpoint:this.checkpoint,bossHealth:Math.round(this.boss.hp),bossActive:this.boss.active,elapsedSeconds:Math.floor(this.time)}}
}
