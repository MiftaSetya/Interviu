/*
  Avatar GLB + Idle FBX (retargeted) + Viseme Mouth (random)
  - Idle animation is retargeted from idle_anim.fbx to avatarViseme.glb
  - Mouth: random viseme when isActive && volume >= 10
  - Silent when !isActive or volume < 10
*/

import * as THREE from "three";
import React, { JSX, useEffect, useMemo, useRef } from "react";
import { useGLTF, useFBX, useAnimations } from "@react-three/drei";
import { useGraph } from "@react-three/fiber";
import { SkeletonUtils } from "three-stdlib";

interface AvatarProps {
  volume: number; // 0 - 255
  isActive: boolean;
}

const VISEMES = [
  "viseme_CH", "viseme_DD", "viseme_E", "viseme_FF", "viseme_I",
  "viseme_O", "viseme_PP", "viseme_RR", "viseme_SS", "viseme_TH",
  "viseme_U", "viseme_aa", "viseme_kk", "viseme_nn", "viseme_sil"
];

type GLTFResult = any; // we only use it for initial useGLTF typing; nodes from clone are obtained via useGraph

export function AvatarModel({
  isActive,
  volume,
  ...props
}: JSX.IntrinsicElements["group"] & AvatarProps) {
  const wrapperGroup = useRef<THREE.Group | null>(null);

  // 1) Load GLB and clone the scene (preserve skeleton)
  const gltf = useGLTF("/assets/avatarViseme.glb") as GLTFResult;
  const sceneClone = useMemo(() => SkeletonUtils.clone(gltf.scene), [gltf.scene]);

  // 2) Grab nodes/materials from cloned scene (useGraph on the cloned object)
  //    useGraph returns maps of nodes and materials for that object hierarchy
  const { nodes, materials } = useGraph(sceneClone) as any;

  // 3) Load FBX animations (source)
  const idleFbx = useFBX("/assets/idle_anim.fbx") as THREE.Object3D & { animations?: THREE.AnimationClip[] };
  const sourceAnimations = idleFbx?.animations ?? [];

  // If no animations provided, we skip playing idle gracefully
  // 4) Retarget FBX clip -> to sceneClone skeleton (if possible)
  const retargetedClips = useMemo(() => {
    if (!sourceAnimations || !sourceAnimations.length) return [];

    const srcClip = sourceAnimations[0];
    // ensure it has a name
    if (!srcClip.name) srcClip.name = "Idle";

    try {
      // SkeletonUtils.retargetClip expects (sourceRoot, targetRoot, clip)
      // Source root: idleFbx (or a child that contains bones), target root: sceneClone
      // Some FBX loaders store the skinned mesh inside children[0], so we try that first
      // const sourceRoot = (idleFbx && (idleFbx.children && idleFbx.children.length ? idleFbx.children[0] : idleFbx)) as THREE.Object3D;
      // const targetRoot = sceneClone as THREE.Object3D;

      // const ret = SkeletonUtils.retargetClip(sourceRoot, targetRoot, srcClip);
      // ret.name = srcClip.name || "Idle";
      // return [ret];
      return [srcClip];
    } catch (err) {
      // If retargeting fails, we fallback to using the original clip (best-effort)
      console.warn("Retarget failed, falling back to original clip. Error:", err);
      return [srcClip];
    }
    // dependencies: sceneClone and idleFbx
  }, [sceneClone, idleFbx, sourceAnimations]);

  // 5) Hook up animations to the cloned scene (so mixer searches bones within sceneClone)
  const { actions } = useAnimations(retargetedClips, sceneClone as any);

  // Play idle when actions ready
  useEffect(() => {
    const idle = actions?.["Idle"] ?? actions?.[retargetedClips[0]?.name];
    if (!idle) return;
    idle.reset().fadeIn(0.4).play();
    return () => {
      idle.fadeOut(0.3);
    };
  }, [actions, retargetedClips]);

  // ---------- VISIME (MOUTH) LOGIC ----------
  const mouthTimerRef = useRef<number | null>(null);

  // helpers: safe access to head & teeth morphs
  const safeSetViseme = (name: string, intensity = 1) => {
    if (!nodes) return;
    const head = nodes["Wolf3D_Head"];
    const teeth = nodes["Wolf3D_Teeth"];
    if (!head || !teeth) return;

    // reset all first
    VISEMES.forEach((v) => {
      const hi = head?.morphTargetDictionary?.[v];
      const ti = teeth?.morphTargetDictionary?.[v];
      if (hi !== undefined && head.morphTargetInfluences) head.morphTargetInfluences[hi] = 0;
      if (ti !== undefined && teeth.morphTargetInfluences) teeth.morphTargetInfluences[ti] = 0;
    });

    const hi = head?.morphTargetDictionary?.[name];
    const ti = teeth?.morphTargetDictionary?.[name];
    if (hi !== undefined && head.morphTargetInfluences) head.morphTargetInfluences[hi] = intensity;
    if (ti !== undefined && teeth.morphTargetInfluences) teeth.morphTargetInfluences[ti] = intensity;
  };

  // pick random non-sil viseme
  const randomNonSil = () => {
    const list = VISEMES.filter((v) => v !== "viseme_sil");
    return list[Math.floor(Math.random() * list.length)];
  };

  // start loop with random interval each tick
  const startMouthLoop = () => {
    if (!nodes) return;

    const tick = () => {
      // stop if not active anymore
      if (!isActive || volume < 10) {
        safeSetViseme("viseme_sil");
        mouthTimerRef.current = null;
        return;
      }

      // choose viseme (could use volume to bias selection if desired)
      const chosen = randomNonSil();

      // intensity driven by normalized volume (0..1) with min 0.1
      const intensity = Math.min(1, Math.max(0.3, volume / 255));
      safeSetViseme(chosen, intensity);

      // schedule next tick with random delay (80 - 150 ms)
      const delay = Math.floor(Math.random() * 250) + 500; // 80..150
      mouthTimerRef.current = window.setTimeout(tick, delay) as unknown as number;
    };

    if (mouthTimerRef.current == null) {
      tick();
    }
  };

  const stopMouthLoop = () => {
    if (mouthTimerRef.current != null) {
      clearTimeout(mouthTimerRef.current);
      mouthTimerRef.current = null;
    }
    safeSetViseme("viseme_sil");
  };

  // Start/stop based on isActive and volume
  useEffect(() => {
    // nodes may not be ready yet
    if (!nodes) return;

    if (!isActive || volume < 10) {
      stopMouthLoop();
    } else {
      startMouthLoop();
    }

    return () => {
      stopMouthLoop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, volume, nodes]);

  // ensure silent initially until checks run
  useEffect(() => {
    if (!nodes) return;
    safeSetViseme("viseme_sil");
  }, [nodes]);

  // cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (mouthTimerRef.current != null) clearTimeout(mouthTimerRef.current);
    };
  }, []);

  // ---------- RENDER ----------
  // We render the entire cloned scene so skeleton + skinned meshes + morphs remain intact.
  return (
    <group ref={wrapperGroup} {...props} dispose={null} scale={3} position={[0, -5, 0]}>
      <primitive object={sceneClone} />
    </group>
  );
}

useGLTF.preload("/assets/avatarViseme.glb");






// export function AvatarModel(props: JSX.IntrinsicElements['group'] & AvatarProps) {
//   const { scene } = useGLTF('/assets/avatarViseme.glb')
//   const clone = React.useMemo(() => SkeletonUtils.clone(scene), [scene])
//   const { nodes, materials } = useGraph(clone) as unknown as GLTFResult

//   const isActive = props.isActive;
//   const volume = props.volume;

//   const idleFbx = useFBX("/assets/idle_anim.fbx");
//   const idleAnimation = idleFbx?.animations ?? [];
//   console.log(idleAnimation);
//   if (idleAnimation[0] && !idleAnimation[0].name) {
//     idleAnimation[0].name = "Idle";
//   }

//   // animation state not needed; we'll start idle once

//   const group = useRef<any>(null);
//   const { actions } = useAnimations(idleAnimation.length ? [idleAnimation[0]] : [], group);
//   const mixerRef = useRef<THREE.AnimationMixer | null>(null);

//   const currentActionRef = useRef<string | null>(null);
//   const idleStartedRef = useRef(false);

//   // keep latest props in refs so the viseme loop can read them without recreating timers
//   const isActiveRef = useRef(isActive);
//   const volumeRef = useRef(volume);
//   isActiveRef.current = isActive;
//   volumeRef.current = volume;

  

//   useEffect(() => {
//     // debug info
//     // eslint-disable-next-line no-console
//     console.debug('idleAnimation clips:', idleAnimation.length, idleAnimation[0]?.name);
//     // eslint-disable-next-line no-console
//     console.debug('actions keys:', actions ? Object.keys(actions) : actions, 'group ready:', !!group.current);

//     // Start the idle action exactly once when actions become available.
//     if (!actions || idleStartedRef.current) return;

//     const act = actions['Idle'] ?? Object.values(actions ?? {})[0];
//     if (!act) return;

//     act.reset().fadeIn(0.5).play();
//     idleStartedRef.current = true;

//     return () => {
//       try { act.fadeOut(0.5); } catch (e) {}
//       idleStartedRef.current = false;
//     };
//   }, [actions]);

//   // Fallback: if useAnimations didn't create actions, create a mixer manually
//   useEffect(() => {
//     if (!idleAnimation[0] || !group.current) return;
//     const hasActions = actions && Object.keys(actions).length > 0;
//     if (hasActions) return; // Drei is handling animations

//     const mixer = new THREE.AnimationMixer(group.current);
//     mixerRef.current = mixer;
//     const clip = idleAnimation[0];
//     const action = mixer.clipAction(clip as any, group.current);
//     action.reset().fadeIn(0.5).play();

//     return () => {
//       try {
//         action.fadeOut(0.5);
//       } catch (e) {}
//       mixer.stopAllAction();
//       mixerRef.current = null;
//     };
//   }, [idleAnimation, actions]);

//   let currentVolume = 0;

//   // Viseme list (includes silent)
//   const VISIMES = [
//     'viseme_CH','viseme_DD','viseme_E','viseme_FF','viseme_I','viseme_O','viseme_PP','viseme_RR','viseme_SS','viseme_TH','viseme_U','viseme_aa','viseme_kk','viseme_nn','viseme_sil'
//   ];

//   const currentVisemeRef = useRef<string | null>(null);

//   useEffect(() => {
//     // function to set viseme influences safely
//     const setViseme = (name: string | null) => {
//       try {
//         const head = nodes?.Wolf3D_Head;
//         const teeth = nodes?.Wolf3D_Teeth;
//         if (!head || !teeth) return;

//         const headDict = head.morphTargetDictionary ?? {};
//         const teethDict = teeth.morphTargetDictionary ?? {};
//         const headInf = head.morphTargetInfluences;
//         const teethInf = teeth.morphTargetInfluences;

//         // clear previous
//         const prev = currentVisemeRef.current;
//         if (prev) {
//           const pH = headDict[prev];
//           if (typeof pH === 'number' && headInf) headInf[pH] = 0;
//           const pT = teethDict[prev];
//           if (typeof pT === 'number' && teethInf) teethInf[pT] = 0;
//         }

//         if (!name) {
//           currentVisemeRef.current = null;
//           return;
//         }

//         const idxH = headDict[name];
//         if (typeof idxH === 'number' && headInf) headInf[idxH] = 1;
//         const idxT = teethDict[name];
//         if (typeof idxT === 'number' && teethInf) teethInf[idxT] = 1;

//         currentVisemeRef.current = name;
//       } catch (e) {
//         // ignore errors
//       }
//     };

//     let mounted = true;
//     let timer = 0 as number;

//     const scheduleNext = () => {
//       if (!mounted) return;
//       // choose interval 150-700ms
//       const interval = 150 + Math.random() * 550;
//       timer = window.setTimeout(tick, interval);
//     };

//     const tick = () => {
//       if (!mounted) return;

//       // update smoothed volume reading from refs
//       const target = isActiveRef.current ? volumeRef.current : 0;
//       currentVolume += (target - currentVolume) * 0.15;

//       // determine viseme: silent when not active or low volume
//       if (!isActiveRef.current || currentVolume <= 10) {
//         setViseme('viseme_sil');
//       } else {
//         // small chance to insert silence to simulate pauses
//         const silentChance = 0.12;
//         if (Math.random() < silentChance) {
//           setViseme('viseme_sil');
//         } else {
//           // pick random viseme excluding 'viseme_sil'
//           const choices = VISIMES.filter(v => v !== 'viseme_sil');
//           const pick = choices[Math.floor(Math.random() * choices.length)];
//           setViseme(pick);
//         }
//       }

//       scheduleNext();
//     };

//     // start only when nodes are available
//     if (nodes && nodes.Wolf3D_Head && nodes.Wolf3D_Teeth) {
//       scheduleNext();
//     }

//     return () => {
//       mounted = false;
//       if (timer) clearTimeout(timer);
//       // clear any viseme on unmount
//       setViseme(null);
//     };
//   }, [nodes]);

//   // Drive the fallback mixer on each frame
//   useFrame((_, delta) => {
//     if (mixerRef.current) mixerRef.current.update(delta);
//   });

//   return (
//     <group ref={group} {...props} dispose={null}>
//       {/* Render the full cloned scene so useAnimations can traverse bones/skinned meshes */}
//       <primitive object={clone} scale={3} position={[0, -5, 0]} />
//     </group>
//   )
// }



