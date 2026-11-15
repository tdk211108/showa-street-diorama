import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

/**
 * Phase 3: Makoto Shinkai "Katawaredoki" (Twilight / Magical Hour) Post-Processing
 * Tuned bloom threshold and strength so emissive windows, vending machine, and signs
 * retain crisp typography and details while casting a warm atmospheric glow.
 */
export function initPostprocessing(renderer, scene, camera) {
  const composer = new EffectComposer(renderer);

  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.15, // Refined halation strength preserving crisp sign/vending typography
    0.38, // Soft glow radius
    0.90  // High threshold so only incandescent bulbs & highlights bloom
  );
  composer.addPass(bloomPass);

  const outputPass = new OutputPass();
  composer.addPass(outputPass);

  window.addEventListener('resize', () => {
    composer.setSize(window.innerWidth, window.innerHeight);
  });

  return {
    composer,
    bloomPass,
    render() {
      composer.render();
    }
  };
}
