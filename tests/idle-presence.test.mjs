import test from 'node:test';
import assert from 'node:assert/strict';
import {sampleIdlePresence,shouldChainAutoAttack} from '../src/idle-presence-v041.js';
test('idle breath and sigh are bounded, varied and continuous through the cycle wrap',()=>{
 let peak=0,low=1;
 for(let t=0;t<40;t+=.01){const a=sampleIdlePresence(t),b=sampleIdlePresence(t+.001);peak=Math.max(peak,a.expand);low=Math.min(low,a.expand);for(const k of Object.keys(a)){assert.ok(Number.isFinite(a[k]));assert.ok(Math.abs(a[k]-b[k])<.002);}assert.ok(a.expand>=0&&a.expand<=.038);assert.ok(Math.abs(a.weightX)<=.01);}
 assert.ok(peak-low>.025);
});
test('continuous attack visuals stop when the target, range or player state disallows combat',()=>{
 const active={auto:true,paused:false,dead:false,targetDead:false,hasTarget:true,distance:2,jumping:false};assert.equal(shouldChainAutoAttack(active),true);
 for(const patch of [{auto:false},{paused:true},{dead:true},{targetDead:true},{hasTarget:false},{distance:3.2},{jumping:true}])assert.equal(shouldChainAutoAttack({...active,...patch}),false);
});
