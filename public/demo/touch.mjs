/** Independent pointer ownership keeps simultaneous touches and keyboard input intact. */
export class TouchControls {
  constructor({pad,buttons,surfaces=[],releaseTarget=null,enabled=()=>true,onGesture=()=>{}}){
    this.pad=pad;this.buttons=Array.from(buttons);this.enabled=enabled;this.onGesture=onGesture;
    this.pointers=new Map();this.pulses=new Set();this.moveId=null;this.direction=0;this.bindings=[];
    this.bind(pad,'pointerdown',e=>this.beginMove(e));this.bind(pad,'pointermove',e=>this.move(e));
    for(const el of [pad,...this.buttons]){
      if(el!==pad)this.bind(el,'pointerdown',e=>this.beginAction(e,el));
      for(const type of ['pointerup','pointercancel','lostpointercapture'])this.bind(el,type,e=>this.end(e.pointerId,type!=='pointerup'));
      this.bind(el,'contextmenu',e=>e.preventDefault());
    }
    // Safari's native Touch/Gesture defaults are separate from pointer ownership.
    // Keep these guards on gameplay surfaces, leaving menus and toolbar clicks alone.
    this.nativeTouches=new Set();
    for(const el of new Set(surfaces.length?surfaces:[pad,...this.buttons])){
      for(const type of ['touchstart','touchmove','touchend','touchcancel'])this.bind(el,type,e=>{
        const changed=Array.from(e.changedTouches||[]),active=this.enabled();
        const owned=changed.some(t=>this.nativeTouches.has(t.identifier));
        if(type==='touchstart'&&active)for(const t of changed)this.nativeTouches.add(t.identifier);
        if((active||owned)&&e.cancelable)e.preventDefault();
        if(type==='touchend'||type==='touchcancel')for(const t of changed)this.nativeTouches.delete(t.identifier);
      });
      for(const type of ['gesturestart','gesturechange','gestureend','dblclick'])this.bind(el,type,e=>{if((this.enabled()||this.nativeTouches.size)&&e.cancelable)e.preventDefault()});
    }
    if(releaseTarget)for(const type of ['pointerup','pointercancel'])this.bind(releaseTarget,type,e=>this.end(e.pointerId,type==='pointercancel'));
  }
  bind(el,type,fn){el.addEventListener(type,fn,{passive:false});this.bindings.push([el,type,fn])}
  accept(e){return this.enabled()&&!(e.pointerType==='mouse'&&e.button!==0)}
  capture(el,e,action){e.preventDefault();this.pointers.set(e.pointerId,{el,action});try{el.setPointerCapture(e.pointerId)}catch{}this.onGesture();this.paint()}
  beginMove(e){if(!this.accept(e))return;e.preventDefault();if(this.moveId!==null)return;this.moveId=e.pointerId;this.capture(this.pad,e,'move');this.move(e)}
  move(e){if(e.pointerId!==this.moveId)return;e.preventDefault();const box=this.pad.getBoundingClientRect(),delta=e.clientX-(box.left+box.width/2);this.direction=Math.abs(delta)<box.width*.075?0:delta<0?-1:1;this.paint()}
  beginAction(e,el){if(!this.accept(e))return;const action=el.dataset.action;if(!['jump','attack','magic','dash','potion'].includes(action))return;this.capture(el,e,action);if(action!=='attack')this.pulses.add(action)}
  held(action){return [...this.pointers.values()].some(p=>p.action===action)}
  sample(){const value={left:this.direction<0,right:this.direction>0,attack:this.held('attack'),jump:this.pulses.has('jump'),magic:this.pulses.has('magic'),dash:this.pulses.has('dash'),potion:this.pulses.has('potion')};this.pulses.clear();return value}
  end(id,cancelled=false){const p=this.pointers.get(id);if(!p)return;this.pointers.delete(id);if(cancelled&&!this.held(p.action))this.pulses.delete(p.action);if(id===this.moveId){this.moveId=null;this.direction=0}try{if(p.el.hasPointerCapture?.(id))p.el.releasePointerCapture(id)}catch{}this.paint()}
  paint(){this.pad.classList.toggle('press-left',this.direction<0);this.pad.classList.toggle('press-right',this.direction>0);for(const button of this.buttons)button.classList.toggle('pressed',this.held(button.dataset.action))}
  clear(){const old=[...this.pointers.entries()];this.pointers.clear();this.moveId=null;this.direction=0;this.pulses.clear();for(const[id,p]of old)try{if(p.el.hasPointerCapture?.(id))p.el.releasePointerCapture(id)}catch{}this.paint()}
  dispose(){this.clear();this.nativeTouches.clear();for(const[el,type,fn]of this.bindings)el.removeEventListener(type,fn);this.bindings=[]}
}
