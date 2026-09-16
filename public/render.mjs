import{W,H,FLOOR,WORLD,ROOMS,clamp}from'./engine.mjs';
const C={stone:'#171528',line:'#373046',gold:'#b29159',cyan:'#8df8ec',purple:'#ad7bf6',white:'#fff2dd'};
export class Renderer{
 constructor(canvas){this.canvas=canvas;this.c=canvas.getContext('2d',{alpha:false});this.c.imageSmoothingEnabled=false;this.bg=new Image();this.loaded=false;this.bg.onload=()=>{this.loaded=true};this.bg.src='assets/castle.webp';this.sprites=this.makeSprites();this.vignette=this.c.createRadialGradient(480,270,160,480,270,590);this.vignette.addColorStop(0,'#00000000');this.vignette.addColorStop(1,'#03030bbe');}
 rect(x,y,w,h,color){const c=this.c;c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.ceil(w),Math.ceil(h))}
 line(x1,y1,x2,y2,color,width=1){const c=this.c;c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(Math.round(x1),Math.round(y1));c.lineTo(Math.round(x2),Math.round(y2));c.stroke()}
 poly(points,fill,stroke){const c=this.c;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();if(fill){c.fillStyle=fill;c.fill()}if(stroke){c.strokeStyle=stroke;c.lineWidth=1;c.stroke()}}
 text(text,x,y,size=12,color='#ece0d4',align='left',font='monospace'){const c=this.c;c.font=size+'px '+font;c.textAlign=align;c.textBaseline='alphabetic';c.fillStyle='#04030acc';c.fillText(text,x+1,y+1);c.fillStyle=color;c.fillText(text,x,y)}
 glow(x,y,r,color){const c=this.c;const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'#00000000');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2)}
 makeSprites(){
  const canvases=[];
  for(let frame=0;frame<6;frame++){const a=document.createElement('canvas');a.width=44;a.height=48;const c=a.getContext('2d');const r=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(x,y,w,h)};const p=(pts,col)=>{c.fillStyle=col;c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill()};const step=frame<4?Math.round(Math.sin(frame*Math.PI/2)*4):0;
   // A small original pixel sprite: silver hair, plum-lined cloak, engraved coat.
   p([[15,12],[10,17],[6,32],[2+(frame%3),39],[14,38],[22,29],[24,15]],'#20152f');
   p([[14,15],[11,22],[8,32],[5,36],[13,33],[19,22]],'#7f275c');
   p([[11,21],[8,34],[3,38],[10,37],[16,27]],'#b23c7c');r(9,29,2,7,'#d25896');
   r(17-step,33,5,11,'#131325');r(16-step,43,7,3,'#8d86a3');r(20+step,33,4,10,'#292538');r(20+step,42,8,3,'#c3b1b5');r(17-step,35,1,7,'#4e4565');
   p([[16,15],[23,14],[26,22],[23,30],[25,36],[19,38],[13,35],[15,27]],'#e1dbcd');r(15,19,4,13,'#888da6');r(16,20,1,10,'#e5e0d5');r(21,19,3,12,'#171827');r(20,18,1,14,'#bc9152');r(13,29,13,3,'#211528');r(17,30,6,1,'#c1a467');r(15,33,3,3,'#b7b2c3');
   p([[14,13],[16,10],[24,11],[27,17],[22,16],[19,15],[17,20]],'#211b32');r(16,13,3,2,'#b5a6c7');r(23,14,2,2,'#d4bb81');
   if(frame===4){r(24,17,8,4,'#9b98b2');r(30,18,6,3,'#e2d1bf');r(36,16,2,8,'#c8a066');r(38,18,6,2,'#d5f9f5')}
   else{r(24,19,3,9,'#9896ae');r(25,26,3,5,'#e6d9c7');r(26,30,3,3,'#8d7156');p([[28,29],[30,30],[36,39],[35,41]],'#c3dfe2');r(29,33,1,4,'#f4ffff')}
   r(19,5,7,7,'#dbc8bc');r(21,8,6,2,'#ebd9cd');r(25,7,2,1,'#1c1732');r(26,9,2,2,'#d6bab5');r(19,10,3,4,'#e1cbb7');
   p([[17,3],[22,1],[26,3],[27,6],[22,5],[21,9],[19,11],[18,18],[14,20],[16,12],[15,7]],'#aaaac4');
   p([[17,4],[21,2],[25,3],[24,4],[20,4],[19,10],[17,15],[16,15]],'#f0e7e7');r(15,9,2,9,'#d2c9db');r(14,17,2,5,'#88829d');r(17,4,1,5,'#eee5e0');r(23,4,3,1,'#eee7e7');
   canvases.push(a)
  }return canvases;
 }
 hero(p,alpha=1,tint=false){const c=this.c;const idx=p.attack>0?4:!p.grounded?5:Math.abs(p.vx||0)>0?Math.floor(p.walk)%4:0;c.save();c.globalAlpha=alpha;if(p.inv>0&&Math.floor(p.inv*20)%2)c.globalAlpha*=.42;c.translate(Math.round(p.x+14),Math.round(p.y-6));c.scale(p.face,1);if(tint)c.filter='brightness(1.5) sepia(1) hue-rotate(130deg)';c.drawImage(this.sprites[idx],-26,0,59,65);c.restore()}
 render(g){const c=this.c,t=g.ambient;this.rect(0,0,W,H,'#090b1b');let cam=g.state==='title'?200:g.cam;
  this.backdrop(cam,t,g.room,g.state==='title');
  c.save();if(g.shake>0)c.translate((Math.random()-.5)*g.shake,(Math.random()-.5)*g.shake*.65);c.translate(-Math.round(cam),0);
  this.architecture(g,cam,t);
  for(const p of g.platforms){if(p.x+p.w<cam-50||p.x>cam+W+50)continue;this.platform(p)}
  this.decorations(g,cam,t);
  for(const item of g.items){if(item.taken||item.x<cam-60||item.x>cam+W+60)continue;this.item(item,t)}
  for(const e of g.enemies)if(!e.dead&&e.x>cam-100&&e.x<cam+W+100)this.enemy(e,t);
  if(g.bossTriggered||cam>4000)this.boss(g.boss,t);
  for(const ghost of g.ghosts)this.hero({...ghost,attack:0,grounded:false},ghost.life/.24*.35,true);
  if(g.state!=='title')this.hero(g.player);
  for(const s of g.shots){this.glow(s.x,s.y,s.r*4,s.color+'80');c.fillStyle=s.color;c.beginPath();c.arc(s.x,s.y,s.r,0,Math.PI*2);c.fill();this.rect(s.x-2,s.y-2,4,4,'#fff');if(s.type==='wave'){this.poly([[s.x-12,s.y+8],[s.x-5,s.y-26],[s.x+3,s.y-13],[s.x+8,s.y-35],[s.x+15,s.y+8]],'#ccaff9');}}
  this.effects(g);
  for(const f of g.floaters){c.globalAlpha=Math.min(1,f.life*2);this.text(f.text,f.x,f.y,12,f.color,'center')}c.globalAlpha=1;
  this.foreground(cam,t);c.restore();
  c.fillStyle=this.vignette;c.fillRect(0,0,W,H);
  if(g.state!=='title'){this.hud(g);if(g.roomTime>0&&!(g.touchMode&&g.boss.active)){c.globalAlpha=Math.min(1,g.roomTime, (4-g.roomTime)*1.4);this.text(ROOMS[g.room].name,480,129,23,'#efdbb7','center','Georgia');this.text(ROOMS[g.room].sub,480,150,11,'#c9b9d6','center');this.line(340,163,620,163,'#b5996c70');c.globalAlpha=1}
   if(g.boss.active){this.bossHud(g)}else this.contextHint(g);
  }
  if(g.flash>0){c.globalAlpha=Math.min(.36,g.flash*1.7);this.rect(0,0,W,H,g.boss.dead?'#d7fff7':'#dc8dd8');c.globalAlpha=1}
 }
 backdrop(cam,t,room,title){const c=this.c;
  if(this.loaded){const scale=W/this.bg.width,w=W,h=this.bg.height*scale;const offset=(cam*.12)%w;for(let i=-1;i<3;i++)c.drawImage(this.bg,i*w-offset,0,w+1,h);this.rect(0,0,W,H,room===1?'#140a2b40':room===2?'#07192145':'#090a1b20');}
  else{const grad=c.createLinearGradient(0,0,0,H);grad.addColorStop(0,'#121631');grad.addColorStop(.65,'#352a4c');grad.addColorStop(1,'#171528');c.fillStyle=grad;c.fillRect(0,0,W,H);this.glow(660-cam*.03,155,230,'#68a5ca35');c.fillStyle='#a2aac6';c.beginPath();c.arc(680-cam*.03,150,70,0,Math.PI*2);c.fill();}
  for(let i=0;i<38;i++){const x=((i*173.17-cam*.22+t*(i%3+1)*2)%1000+1000)%1000,y=90+((i*97.31+t*(i%2?3:-2))%420+420)%420;const flicker=.2+Math.sin(t*1.3+i)*.16;c.globalAlpha=flicker;this.rect(x,y,i%4===0?2:1,2,i%3?'#82d4df':'#cea7fb')}c.globalAlpha=1;
  if(title){this.rect(0,0,W,H,'#0a071424')}
 }
 architecture(g,cam,t){
  const c=this.c,start=Math.floor(cam/360)*360;
  for(let x=start-360;x<cam+W+360;x+=360){const area=x>4380?3:x>3050?2:x>1560?1:0;
   c.globalAlpha=this.loaded?.28:1;
   this.rect(x+5,64,24,402,'#121220');this.rect(x+7,64,3,398,'#6d52684a');this.rect(x+24,64,9,402,'#080b18');this.rect(x,397,36,15,'#292337');this.rect(x-3,449,43,17,'#383044');this.rect(x+3,441,31,8,'#171625');
   this.poly([[x+22,185],[x+57,98],[x+180,16],[x+303,98],[x+337,185],[x+324,162],[x+292,111],[x+180,42],[x+68,111],[x+35,190]],'#211d30','#61506e65');
   this.line(x+180,42,x+180,164,'#69506650');c.globalAlpha=1;
   if(area===1){for(let sy=244;sy<430;sy+=34){this.rect(x+58,sy,234,5,'#53445b');for(let j=0;j<22;j++){const h=13+(j*7+sy)%15;this.rect(x+62+j*10,sy-h,7,h,['#453356','#70514f','#263957','#665078','#54716e'][j%5]);this.rect(x+64+j*10,sy-h+3,2,1,'#c7ac8260')}}this.rect(x+74,164,208,38,'#131a2a');this.line(x+80,167,x+260,167,'#589bab');for(let j=0;j<10;j++)this.rect(x+85+j*18,177,8,2,'#548d9e');}
   if(area===2||area===3){this.machine(x+70,312,area===3?'#a877c5':'#64c8c9',t);this.machine(x+271,356,'#9373b7',t+.7)}
   if(area!==1&&x%720===0){this.rect(x+145,125,72,125,'#221326');this.poly([[x+145,125],[x+217,125],[x+217,256],[x+181,237],[x+145,256]],'#48203a');this.line(x+155,133,x+155,238,'#9b597350');this.line(x+208,133,x+208,238,'#9b597350');this.poly([[x+181,153],[x+199,187],[x+181,220],[x+163,187]],null,'#b79a6765');this.line(x+181,145,x+181,227,'#b79a6765')}
   if(x%720===0){this.torch(x+28,277,t);this.torch(x+330,277,t+2)}
  }
  // Lit paths are also a readable guide to the three elevated relics.
  for(const item of g.items)if(item.type==='seal'&&!item.taken&&Math.abs(item.x-(cam+W/2))<700){this.line(item.x,80,item.x,item.y-30,'#cfb87918');this.glow(item.x,item.y,95,'#a1853421')}
 }
 machine(x,y,color,t){const c=this.c;this.rect(x,y,35,FLOOR-y,'#0e1422');this.rect(x+2,y+4,31,3,'#6f648260');this.line(x+3,y+11,x+3,FLOOR-10,color+'80');this.line(x+31,y+11,x+31,FLOOR-10,color+'80');for(let j=0;j<4;j++){this.rect(x+9,y+15+j*21,16,12,'#1b2a36');this.rect(x+11,y+17+j*21,12,2,color+(Math.floor(t*2+j)%3?'90':'ff'))}this.glow(x+17,y+30,46,color+'23')}
 torch(x,y,t){this.rect(x-4,y+4,8,20,'#4e3e44');this.rect(x-8,y+8,16,4,'#8c7150');this.glow(x,y-5,72,'#72d8f32c');const d=Math.sin(t*12+x)*3;this.poly([[x-7,y],[x-5,y-10],[x-1,y-19+d],[x+1,y-7],[x+6,y-15-d],[x+7,y],[x,y+5]],'#77c9f6');this.poly([[x-3,y],[x,y-12],[x+3,y],[x,y+3]],'#e0ffff')}
 platform(p){const c=this.c;this.rect(p.x,p.y,p.w,p.h,'#191726');this.rect(p.x,p.y,p.w,4,'#777083');this.rect(p.x,p.y+4,p.w,3,'#3d354b');this.rect(p.x,p.y+7,p.w,2,'#0b0c19');if(p.ground){for(let y=p.y+10;y<H;y+=19){this.line(p.x,y,p.x+p.w,y,'#393047');for(let x=p.x+(y%2)*24;x<p.x+p.w;x+=53)this.line(x,y,x,y+17,'#3f324b')}for(let x=p.x+16;x<p.x+p.w;x+=95){this.rect(x,p.y+8,33,2,'#8d62783c');this.rect(x+6,p.y+25,19,1,'#88808a22')}}else{for(let x=p.x+7;x<p.x+p.w-7;x+=25){this.rect(x,p.y+12,17,6,'#514159');this.rect(x+3,p.y+14,11,2,'#928067')}this.poly([[p.x+8,p.y+p.h],[p.x+25,p.y+p.h+17],[p.x+45,p.y+p.h]],'#30283d');this.poly([[p.x+p.w-45,p.y+p.h],[p.x+p.w-25,p.y+p.h+17],[p.x+p.w-8,p.y+p.h]],'#30283d');this.rect(p.x+12,p.y+2,p.w-24,1,'#b5a3b9')}
 }
 decorations(g,cam,t){
  // Entrance and a sanctuary whose light changes after activation.
  if(cam<450){this.rect(62,291,65,175,'#080e18');this.poly([[62,301],[62,238],[94,195],[127,238],[127,301]],'#191b2b','#625570');for(let i=0;i<6;i++)this.line(68+i*10,260,68+i*10,465,'#413c50');this.text('MDCLXVI',94,280,9,'#9c829e','center');}
  if(cam>3150&&cam<4500){this.glow(4080,390,120,g.checkpoint?'#60ffdf45':'#bd91fc35');this.rect(4048,449,66,17,'#53445c');this.rect(4055,440,52,10,'#837392');this.poly([[4066,440],[4066,384],[4080,365],[4094,384],[4094,440]],'#19283a','#7193ac');const col=g.checkpoint?'#b9ffe6':'#bca0f6';this.poly([[4080,369],[4091,390],[4080,411],[4069,390]],col);this.line(4080,354,4080,341,col);this.text('SANTUÁRIO',4080,330,10,'#b7b3d5','center');}
  if(cam>3400&&cam<4550){const open=g.relics===3||g.bossTriggered;this.rect(4370,200,24,266,'#262031');this.rect(4358,192,49,18,'#6a5767');if(!open){this.glow(4380,342,100,'#9274eb28');for(let i=0;i<6;i++)this.rect(4372+i*3,212,1,254,i%2?'#9374ca':'#432e5d');for(let i=0;i<3;i++){this.poly([[4382,253+i*60],[4393,267+i*60],[4382,281+i*60],[4371,267+i*60]],i<g.relics?'#e2c281':'#51435c','#c6ae82')}}else if(g.boss.active){this.rect(4398,120,7,346,'#ad82f170');this.glow(4400,340,65,'#ad82f120')}}
  for(let x=Math.floor(cam/420)*420;x<cam+W;x+=420){if(x>100){this.rect(x+49,449,24,17,'#342235');this.rect(x+52,445,18,4,'#886986');this.rect(x+56,440,10,5,'#a989a5');}}
 }
 item(item,t){const c=this.c,y=item.y+Math.sin(t*2.7+item.x)*4,x=item.x;if(item.type==='seal'){this.glow(x,y,50,'#e5b86845');this.poly([[x,y-17],[x+13,y],[x,y+17],[x-13,y]],'#8d713e','#ffdf91');this.poly([[x,y-11],[x+8,y],[x,y+11],[x-8,y]],'#e8c27b');this.line(x-3,y-5,x+3,y+5,'#fff9cd',2);c.strokeStyle='#b7a26980';c.beginPath();c.ellipse(x,y,23,8,t,0,Math.PI*2);c.stroke();this.text('SELO',x,y-29,9,'#e4caa0','center')}else if(item.type==='potion'){this.glow(x,y,29,'#f74f9140');this.rect(x-5,y-13,10,5,'#ddc096');this.rect(x-4,y-8,8,5,'#9896b3');this.poly([[x-4,y-4],[x-8,y+1],[x-7,y+10],[x+7,y+10],[x+8,y+1],[x+4,y-4]],'#a2275e','#e992b4');this.rect(x-4,y+1,3,6,'#fa87b1')}else{const color=item.type==='power'?'#c5a3ff':'#89e9f2';this.glow(x,y,36,color+'50');this.poly([[x,y-13],[x+8,y],[x,y+13],[x-8,y]],color);this.rect(x-1,y-7,2,12,'#efffff');}}
 enemy(e,t){const c=this.c;c.save();c.translate(Math.round(e.x+e.w/2),Math.round(e.y));if(e.hit>0)c.filter='brightness(2.6)';c.scale(e.face,1);
  if(e.type==='guard'){const step=Math.sin(e.phase*7)*3;this.rect(-9+step,34,6,18,'#424255');this.rect(4-step,34,6,18,'#5e5970');this.rect(-12+step,49,10,4,'#91859b');this.rect(3-step,49,10,4,'#b1a2ad');this.poly([[-12,17],[9,17],[13,31],[8,41],[-9,37],[-14,28]],'#666176','#9e8c9b');this.rect(-7,21,16,2,'#b3a4b3');this.rect(-7,28,16,2,'#2d3043');this.rect(-3,18,3,18,'#383245');this.poly([[-9,5],[-6,0],[5,0],[11,6],[8,14],[-7,14]],'#b6a7b0');this.rect(-6,5,13,4,'#222037');this.rect(3,6,4,2,'#9cf6ee');this.rect(-4,14,9,3,'#473a4f');this.poly([[-10,16],[-18,21],[-15,37],[-8,33]],'#2f3345','#93839b');const angle=e.windup>0?-16:4;this.rect(10,19,5,15,'#9891a5');this.line(16,31,26+angle,-7,'#b7d4db',3);this.line(10,28,23,34,'#b59870',2);if(e.windup>0){this.glow(7,-8,25,'#f6a38f60');this.text('!',2,-10,17,'#ffd3a4','center')}}
  else if(e.type==='bat'){const flap=Math.sin(t*14+e.id)*11;this.poly([[-2,10],[-18,1+flap],[-33,6+flap],[-19,17],[-12,27],[-1,18]],'#6e4d9b','#b790d4');this.poly([[2,10],[18,1+flap],[33,6+flap],[19,17],[12,27],[1,18]],'#61478a','#9877c0');this.poly([[-7,5],[-3,0],[0,7],[5,0],[8,11],[5,23],[-5,23]],'#332a56');this.rect(0,9,5,3,'#bdfff4');this.rect(-4,9,2,2,'#d1a5ff')}
  else{this.glow(0,15,40,'#9adbef27');this.poly([[0,-3],[16,12],[9,30],[-9,30],[-16,12]],'#39455e','#8fa9cb');this.poly([[0,2],[11,13],[0,24],[-11,13]],'#baacf0');this.rect(-7,11,14,4,'#1c213d');this.rect(-3,11,6,4,'#dcffff');for(let i=0;i<3;i++)this.line(-8+i*8,27,-10+i*10+Math.sin(t*5+i)*4,43,'#8f73be80',2)}
  c.restore();if(e.hp<e.maxHp){this.rect(e.x-3,e.y-11,e.w+6,3,'#201329');this.rect(e.x-3,e.y-11,(e.w+6)*Math.max(0,e.hp/e.maxHp),3,'#ac7b9f')}
 }
 boss(b,t){if(b.dead)return;const c=this.c,x=b.x+43,y=b.y;c.save();c.translate(x,y);if(b.hit>0)c.filter='brightness(2.4)';const pulse=Math.sin(t*2)*4;
  this.glow(0,48,125,b.phase===2?'#ec66c433':'#7cbce82c');
  // Orbital machine halo, bronze reliquary and synthetic stained-glass wings.
  c.strokeStyle=b.phase===2?'#d799cd':'#8babc9';c.lineWidth=2;c.beginPath();c.arc(0,27,54,0,Math.PI*2);c.stroke();for(let i=0;i<8;i++){const a=i*Math.PI/4+t*.3;this.poly([[Math.cos(a)*54,27+Math.sin(a)*54-4],[Math.cos(a)*54+4,27+Math.sin(a)*54],[Math.cos(a)*54,27+Math.sin(a)*54+4],[Math.cos(a)*54-4,27+Math.sin(a)*54]],'#cfc093')}
  for(const sign of [-1,1]){this.poly([[sign*19,28],[sign*65,5+pulse],[sign*84,31],[sign*47,25],[sign*85,61],[sign*43,49],[sign*75,88],[sign*28,68]],'#25233c','#785f90');this.line(sign*25,37,sign*68,27,'#9b79c3',2);this.line(sign*29,45,sign*69,62,'#8adbe4',2);this.poly([[sign*20,50],[sign*42,60],[sign*50,105],[sign*36,100],[sign*30,68]],'#7a687b','#bd9e9d')}
  this.poly([[-23,47],[22,47],[29,91],[38,133],[14,124],[0,138],[-16,125],[-38,133],[-28,94]],'#2b1c39','#9a7295');this.poly([[-11,57],[11,57],[9,93],[19,126],[0,115],[-17,127],[-9,93]],'#684061');this.line(0,73,0,116,'#b68b8e',2);this.poly([[-23,42],[0,32],[23,42],[19,74],[0,89],[-19,74]],'#8c7a8c','#d0b9b2');this.poly([[0,45],[11,61],[0,77],[-11,61]],b.phase===2?'#fda9ec':'#a2ffff');this.glow(0,61,35,'#89ffff70');
  this.poly([[-12,2],[0,-10],[13,2],[11,23],[0,33],[-11,23]],'#b8b2bf','#ead5b6');this.rect(-9,9,18,5,'#211933');this.rect(-7,10,14,2,b.phase===2?'#ff8ae7':'#a3ffff');this.poly([[-15,4],[-19,-11],[-7,-4],[0,-18],[7,-4],[19,-11],[15,4]],'#a68a61','#f1d398');
  if(b.mode.startsWith('wind')){const col=b.mode==='windwave'?'#edbd8a':'#e3a3f4';this.glow(0,62,70,col+'50');this.text(b.mode==='windwave'?'SALTE':b.mode==='winddash'?'ESQUIVE':'DISPERSÃO',0,-44,11,col,'center');if(b.mode==='windwave')this.line(-170,138,170,138,'#ffa48b80',3);}
  if(b.shield){c.strokeStyle='#98dff7';c.lineWidth=2;c.beginPath();c.ellipse(0,63,70,95,0,0,Math.PI*2);c.stroke()}
  c.restore();
 }
 effects(g){const c=this.c;for(const s of g.slashes){const progress=1-s.life/s.max,alpha=Math.min(1,s.life/s.max*1.8);c.save();c.translate(s.x,s.y);c.rotate(s.angle);c.globalAlpha=alpha;c.globalCompositeOperation='lighter';if(s.power===2){c.strokeStyle='#b896f4';c.lineWidth=4*(1-progress)+1;c.beginPath();c.ellipse(0,0,s.r*(.4+progress),s.r*.72*(.4+progress),0,0,Math.PI*2);c.stroke();for(let i=0;i<8;i++){const a=i*Math.PI/4+progress*2;this.line(Math.cos(a)*50,Math.sin(a)*50,Math.cos(a)*s.r,Math.sin(a)*s.r,'#b99cff90',2)}}else if(s.power===0){c.strokeStyle='#b9a2f0';c.lineWidth=2;c.beginPath();c.ellipse(0,0,s.r*(1+progress),8+progress*6,0,0,Math.PI*2);c.stroke()}else{c.scale(s.face,1);const col=s.power<0?'#fbadbd':'#8ce8fa';c.strokeStyle=col;c.lineWidth=9*(1-progress)+1;c.beginPath();c.ellipse(-s.r*.35,0,s.r*(.5+progress*.5),s.r*.48,-.3,-1.4,1.4);c.stroke();c.strokeStyle='#f3ffff';c.lineWidth=3*(1-progress)+.5;c.beginPath();c.ellipse(-s.r*.35+4,-1,s.r*(.5+progress*.5),s.r*.44,-.3,-1.2,1.1);c.stroke();this.line(-40,9,43,-9,'#9dedff90',1)}c.restore()}
  for(const p of g.particles){c.globalAlpha=Math.min(1,p.life*2);this.rect(p.x,p.y,p.size,p.size,p.color)}c.globalAlpha=1;
 }
 foreground(cam,t){const c=this.c;for(let i=0;i<3;i++){const x=cam+(i*400-(cam*.19)%400);const grad=c.createRadialGradient(x,503,0,x,503,230);grad.addColorStop(0,'#8d83aa10');grad.addColorStop(1,'#00000000');c.fillStyle=grad;c.fillRect(x-230,450,460,90)}for(let i=0;i<12;i++){const x=cam+(i*97+t*6)%960,y=485+Math.sin(t*.6+i)*16;c.globalAlpha=.3;this.rect(x,y,2,1,'#a292c9')}c.globalAlpha=1;}
 hud(g){if(g.touchMode){this.mobileHud(g);return}const p=g.player,c=this.c;this.rect(16,15,284,75,'#090c1ddd');this.line(16,15,300,15,'#756080');this.line(16,90,300,90,'#554461');this.poly([[17,16],[74,16],[74,73],[45,88],[17,73]],'#211b30','#b19a73');c.save();c.beginPath();c.rect(21,18,50,61);c.clip();c.drawImage(this.sprites[0],10,-8,89,97);c.restore();this.text('ALUCARD',89,32,12,'#e8d5ba');this.text('ECO DO CREPÚSCULO',89,45,8,'#a091b8');
  this.rect(89,52,192,10,'#3a233d');this.rect(90,53,190*p.hp/p.maxHp,8,'#b94d7f');this.rect(90,53,190*p.hp/p.maxHp,2,'#f4a2bb');this.text(Math.ceil(p.hp)+' / '+p.maxHp,278,47,9,'#e8b8ce','right');this.rect(89,68,192,6,'#20243b');this.rect(90,69,190*p.mp/p.maxMp,4,'#669adf');this.rect(90,69,190*p.mp/p.maxMp,1,'#adddfa');this.text('ÉTER',89,85,8,'#8d8caf');this.text(Math.floor(p.mp)+' / 100',279,85,8,'#9fbfdd','right');
  this.rect(704,15,240,75,'#090c1ddd');this.line(704,15,944,15,'#756080');this.line(704,90,944,90,'#554461');this.text('SELOS ANTIGOS',720,33,10,'#c7b4cf');for(let i=0;i<3;i++)this.poly([[728+i*25,43],[735+i*25,53],[728+i*25,63],[721+i*25,53]],i<g.relics?'#e2c584':'#413648',i<g.relics?'#ffebbc':'#7e668b');this.text(g.relics+'/3',805,57,12,'#d1bea0');this.line(826,29,826,76,'#564562');this.text('POÇÕES',837,33,9,'#c7b4cf');this.text('× '+p.potions,883,61,20,'#eea2bf','center','Georgia');this.text('CRISSAEGRIM',720,79,8,'#94d7df');this.text(p.damage>17?'PODER +':'EQUIPADA',926,79,8,p.damage>17?'#d9c28b':'#8e7f9f','right');
  // Compact map preserves orientation and shows the locations of the three seals.
  const mx=375,my=26,mw=210;this.rect(mx,my,mw,4,'#46374e');for(let i=0;i<4;i++)this.rect(mx+ROOMS[i].x/WORLD*mw,my-2,2,8,'#967b9b');for(const i of g.items.filter(i=>i.type==='seal'))this.rect(mx+i.x/WORLD*mw-2,my-2,4,8,i.taken?'#e9c689':'#836b49');this.rect(mx+p.x/WORLD*mw-2,my-3,4,10,'#b7fff1');this.text(ROOMS[g.room].name,480,47,9,'#afa1bd','center');
 }
 mobileHud(g){const p=g.player;this.rect(16,14,285,77,'#090c1de3');this.line(16,14,301,14,'#a59079');this.text('ALUCARD',29,36,17,'#e8d5ba');this.text(Math.ceil(p.hp)+' / '+p.maxHp,287,36,16,'#f4c8d5','right');this.rect(29,47,258,12,'#3a233d');this.rect(30,48,256*p.hp/p.maxHp,10,'#bb517f');this.rect(30,48,256*p.hp/p.maxHp,2,'#f3abc1');this.text('ÉTER',29,80,12,'#b8c6e8');this.rect(77,69,157,8,'#20243b');this.rect(78,70,155*p.mp/p.maxMp,6,'#79b5ee');this.text(Math.floor(p.mp),287,80,14,'#b8d6f2','right');this.rect(714,14,230,77,'#090c1de3');this.line(714,14,944,14,'#a59079');this.text('SELOS '+g.relics+'/3',730,38,17,'#e3ca9c');for(let i=0;i<3;i++)this.poly([[740+i*30,50],[748+i*30,62],[740+i*30,74],[732+i*30,62]],i<g.relics?'#f1ce8a':'#48394f','#a88e69');this.text('POÇÕES',925,38,12,'#ddb4ce','right');this.text('× '+p.potions,913,73,23,'#f0abc9','right');this.rect(373,30,213,6,'#473953');for(const item of g.items.filter(i=>i.type==='seal'))this.rect(373+item.x/WORLD*213,27,5,12,item.taken?'#eac683':'#907441');this.rect(373+p.x/WORLD*213,26,5,14,'#b5ffeb');this.text(ROOMS[g.room].name,480,64,11,'#d5c3dc','center')}
 bossHud(g){const b=g.boss,w=432,x=(W-w)/2,y=g.touchMode?102:488;this.rect(x-12,y,w+24,43,'#0a0b17df');this.text('ORÁCULO Ω',480,y+13,g.touchMode?14:10,'#e8b9d4','center');this.rect(x,y+21,w,9,'#352135');this.rect(x+1,y+22,(w-2)*b.hp/b.maxHp,7,b.phase===2?'#dd72b8':'#9864bb');this.rect(x+1,y+22,(w-2)*b.hp/b.maxHp,2,'#f0b7de');this.text(b.phase===2?'A CONSCIÊNCIA DESPERTA':'A MÁQUINA DOS MITOS',480,y+41,g.touchMode?9:7,'#a48bb4','center')}
 contextHint(g){const p=g.player;let hint=g.relics<3?'REÚNA OS TRÊS SELOS E ALCANCE O ORÁCULO':'OS SELOS RESPONDEM. SIGA ATÉ O PORTÃO.';if(g.time<12)hint=g.touchMode?'SEGURE ESPADA PARA ATACAR · TOQUE EM PULAR DUAS VEZES':'SEGURE J PARA ATACAR  ·  ESPAÇO DUAS VEZES PARA SALTO DUPLO';else if(p.x>1410&&p.x<1800)hint='USE O SALTO DUPLO PARA ATRAVESSAR O ABISMO';else if(p.x>3980&&p.x<4300)hint='SANTUÁRIO: SUA VIDA E SEU ÉTER FORAM RESTAURADOS';if(!g.touchMode||g.roomTime<=0)this.text(hint,480,g.touchMode?111:521,g.touchMode?12:9,'#b0a0bb','center')}
}
