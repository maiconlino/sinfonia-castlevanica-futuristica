import {Game} from './engine.mjs';
import {Renderer} from './render.mjs';
import {RetroAudio} from './audio.js';
import {TouchControls} from './touch.mjs';

const $=id=>document.getElementById(id),canvas=$('game');
const screens={start:$('start-screen'),pause:$('pause-screen'),end:$('end-screen')};
const keys=new Set(),taps=new Set();let toastTimer,muted=false,last=0,touch=null;
const touchMedia=window.matchMedia('(any-pointer: coarse)');
let touchMode=touchMedia.matches||navigator.maxTouchPoints>0;
const audio=new RetroAudio();
const renderer=new Renderer(canvas);
function toast(message){if(touchMode)message=message.replace('Segure J','Segure ESPADA').replace('Pressione E','Toque em POÇÃO');$('toast').textContent=message;$('toast').classList.remove('hidden');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.add('hidden'),4300)}
function clearInput(){keys.clear();taps.clear();touch?.clear()}
function showScreen(name){document.body.classList.toggle('game-active',name===null);Object.entries(screens).forEach(([key,el])=>el.classList.toggle('hidden',key!==name))}
const game=new Game((type,value)=>{
 if(type==='sfx'){try{audio.sfx(value)}catch{}}
 if(type==='scene'){try{audio.setScene(value)}catch{}}
 if(type==='toast')toast(value);
 if(type==='pause'){clearInput();if(value){showScreen('pause');audio.pause();$('pause-btn').textContent='▶';$('pause-btn').setAttribute('aria-label','Continuar o jogo');$('resume-btn').focus({preventScroll:true})}else{showScreen(null);audio.resume();$('pause-btn').textContent='Ⅱ';$('pause-btn').setAttribute('aria-label','Pausar o jogo');canvas.focus({preventScroll:true})}}
 if(type==='end'){clearInput();showScreen('end');const won=value==='won';$('end-eyebrow').textContent=won?'O SILÊNCIO VOLTOU AO CASTELO':'ATÉ AS SOMBRAS PODEM CAIR';$('end-title').textContent=won?'A última nota.':'Seu eco permanece.';$('end-copy').textContent=won?'O Oráculo aprendeu a criar mitos, mas não a compreender a liberdade. Alucard rompeu o ciclo. Pela primeira vez em mil anos, o amanhã não está escrito.':game.checkpoint?'Seu eco foi preservado no santuário. Recupere a espada e enfrente o Oráculo outra vez.':'A noite ainda não terminou. Retorne ao pórtico e reconquiste os selos antigos.';const seconds=Math.floor(game.time);$('end-stats').innerHTML=`<span><strong>${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}</strong>TEMPO</span><span><strong>${game.kills}</strong>INIMIGOS</span><span><strong>${game.relics}/3</strong>SELOS</span>`;$('again-btn').textContent=won?'JOGAR NOVAMENTE':game.checkpoint?'RETORNAR AO SANTUÁRIO':'TENTAR NOVAMENTE';$('again-btn').focus()}
});
function setTouchMode(value){touchMode=Boolean(value);game.touchMode=touchMode;document.body.classList.toggle('has-touch',touchMode);canvas.setAttribute('aria-label',touchMode?'Área do jogo. Use o direcional e os botões de toque para jogar.':'Área do jogo. Use A e D ou setas para andar, espaço para pular, J para atacar, K para magia e Shift para esquivar.')}
setTouchMode(touchMode);
touchMedia.addEventListener?.('change',e=>{setTouchMode(e.matches||navigator.maxTouchPoints>0);clearInput()});
touch=new TouchControls({pad:$('move-pad'),buttons:document.querySelectorAll('[data-action]'),surfaces:[$('touch-controls'),canvas],releaseTarget:window,enabled:()=>game.state==='playing',onGesture:()=>{if(!audio.started||audio.context?.state!=='running')unlockAudio()}});
window.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'&&!touchMode)setTouchMode(true)},{passive:true});
async function unlockAudio(){try{const ready=await audio.start();if(ready===false)throw new Error('Audio unavailable');audio.setMuted(muted)}catch{$('audio-notice').textContent='Áudio indisponível neste navegador. Você pode continuar jogando.';$('audio-notice').classList.remove('hidden');setTimeout(()=>$('audio-notice').classList.add('hidden'),6000)}}
function start(){clearInput();showScreen(null);document.body.classList.add('is-playing');game.start();unlockAudio();canvas.focus({preventScroll:true});$('pause-btn').textContent='Ⅱ'}
function retry(){if(game.state==='won')start();else{clearInput();showScreen(null);game.retry();unlockAudio();audio.resume();canvas.focus({preventScroll:true})}}
function togglePause(){if(game.state==='playing')game.pause();else if(game.state==='paused')game.resume()}
function toggleSound(){muted=!muted;audio.setMuted(muted);for(const id of ['sound-btn','touch-sound-btn']){$(id).textContent=muted?'SOM OFF':'SOM ON';$(id).setAttribute('aria-label',muted?'Ligar áudio':'Desligar áudio');$(id).setAttribute('aria-pressed',String(muted))}if(!muted&&game.state==='playing')unlockAudio()}
async function fullscreen(){const app=$('app');clearInput();try{if(document.fullscreenElement){await document.exitFullscreen();app.classList.remove('immersive')}else if(app.classList.contains('immersive'))app.classList.remove('immersive');else{app.classList.add('immersive');if(app.requestFullscreen)try{await app.requestFullscreen()}catch{}}}catch{}canvas.focus({preventScroll:true})}
$('start-btn').addEventListener('click',start);$('resume-btn').addEventListener('click',()=>game.resume());$('restart-btn').addEventListener('click',start);$('again-btn').addEventListener('click',retry);$('pause-btn').addEventListener('click',togglePause);$('sound-btn').addEventListener('click',toggleSound);$('fullscreen-btn').addEventListener('click',fullscreen);
$('touch-pause-btn').addEventListener('click',togglePause);$('touch-sound-btn').addEventListener('click',toggleSound);$('touch-fullscreen-btn').addEventListener('click',fullscreen);
$('terms-btn').addEventListener('click',()=>{$('terms-dialog').showModal()});$('terms-close-btn').addEventListener('click',()=>{$('terms-dialog').close();$('start-btn').focus({preventScroll:true})});
document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement)$('app').classList.remove('immersive');clearInput()});
window.matchMedia('(orientation: portrait)').addEventListener?.('change',()=>{clearInput();last=0;game.pause()});
const handled=new Set(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space','KeyA','KeyD','KeyW','KeyJ','KeyK','KeyE','KeyM','KeyF','ShiftLeft','ShiftRight','Escape','Enter']);
window.addEventListener('keydown',e=>{if($('terms-dialog').open||!handled.has(e.code))return;if(e.code==='Enter'){if(e.target instanceof HTMLButtonElement)return;e.preventDefault();if(e.repeat)return;if(game.state==='title')start();else if(game.state==='paused')game.resume();else if(game.state==='won'||game.state==='dead')retry();return}e.preventDefault();if(e.code==='Escape'){if(!e.repeat)togglePause();return}if(e.code==='KeyM'){if(!e.repeat)toggleSound();return}if(e.code==='KeyF'){if(!e.repeat)fullscreen();return}if(game.state!=='playing')return;if(!keys.has(e.code))taps.add(e.code);keys.add(e.code)});
window.addEventListener('keyup',e=>keys.delete(e.code));
window.addEventListener('blur',()=>{clearInput();game.pause()});
document.addEventListener('visibilitychange',()=>{if(document.hidden){clearInput();game.pause()}});
canvas.addEventListener('pointerdown',()=>{canvas.focus({preventScroll:true});if(game.state==='playing'&&audio.context?.state!=='running')unlockAudio()});
function loop(time){const dt=last?Math.min((time-last)/1000,.0334):1/60;last=time;const finger=touch.sample();game.update(dt,{left:keys.has('ArrowLeft')||keys.has('KeyA')||finger.left,right:keys.has('ArrowRight')||keys.has('KeyD')||finger.right,jump:taps.has('Space')||taps.has('ArrowUp')||taps.has('KeyW')||finger.jump,attack:keys.has('KeyJ')||finger.attack,magic:taps.has('KeyK')||finger.magic,dash:taps.has('ShiftLeft')||taps.has('ShiftRight')||finger.dash,potion:taps.has('KeyE')||finger.potion});taps.clear();renderer.render(game);requestAnimationFrame(loop)}
requestAnimationFrame(loop);

// Optional browser agent access uses the same actions as the visible controls.
const context=document.modelContext,lifecycle=new AbortController();
if(context?.registerTool){const register=tool=>{try{Promise.resolve(context.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{})}catch{}};register({name:'read_game_status',title:'Ler o estado da demo',description:'Retorna a sala, vida, éter, selos e situação do chefe sem alterar a partida.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute(input){if(!input||typeof input!=='object'||Object.keys(input).length)throw new Error('Use um objeto vazio.');return game.snapshot()}});register({name:'set_game_paused',title:'Pausar ou continuar a demo',description:'Pausa ou continua uma partida existente, usando os mesmos controles da interface.',inputSchema:{type:'object',properties:{paused:{type:'boolean'}},required:['paused'],additionalProperties:false},annotations:{readOnlyHint:false},execute(input){if(!input||typeof input.paused!=='boolean'||Object.keys(input).some(k=>k!=='paused'))throw new Error('Informe apenas paused como booleano.');if(!['playing','paused'].includes(game.state))throw new Error('Inicie uma partida pela tela do jogo.');input.paused?game.pause():game.resume();return game.snapshot()}})}
window.addEventListener('pagehide',e=>{clearInput();game.pause();if(!e.persisted){lifecycle.abort();touch.dispose();audio.dispose()}});
