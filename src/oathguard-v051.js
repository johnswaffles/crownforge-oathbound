import {loadOathguard as loadPrevious} from './oathguard-v046.js';
import {animateCandidate,DEFAULTS} from './run-motion-v051.js';
export const RELEASE_RUN=DEFAULTS;
export const loadOathguard=(asset='assets/oathguard-natural-hands-v050.glb')=>loadPrevious(asset);
export function animateOathguard(model,time,speed,attack=0,guard=false,strikeVariant=null){
 return animateCandidate(model,time,model.userData.locomotionVelocity??speed*4.4,RELEASE_RUN,attack,guard,strikeVariant);
}
