import { Environment, useGLTF, useTexture } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import React, { useRef, useMemo } from "react";
import { AvatarModel } from "./avatars/AvatarModel";

interface AvatarProps {
  volume: number; // 0 - 255
  isActive: boolean;
}

// const AvatarModel: React.FC<AvatarProps> = ({ volume, isActive }) => {
//   const { scene } = useGLTF("/assets/avatar.glb");

//   // Cari index morph target hanya sekali
//   const jawIndex = useMemo(() => {
//     let index: number | null = null;
//     scene.traverse((obj: any) => {
//       if (obj.morphTargetDictionary && index === null) {
//         index = obj.morphTargetDictionary["jawOpen"];
//       }
//     });
//     return index;
//   }, [scene]);

//   // animasi mulut realtime
//   let current = 0;




//   useFrame(() => {
//     if (!jawIndex) return;
    
//     const target = isActive ? (volume / 255) * 0.6 : 0; // Mulut buka berdasarkan volume
    
//     scene.traverse((obj: any) => {
//       if (obj.morphTargetInfluences) {
//         current += (target - current) * 0.2; // smoothing
//         obj.morphTargetInfluences[jawIndex] = current;
//       }
//     });
//   });

//   return <primitive object={scene} scale={3}
//     position={[0, -5, 0]} />;
// };
const Scene: React.FC<AvatarProps> = ({ volume, isActive }) => {
    const texture = useTexture('/assets/avatar-bg.jpg');
    const viewport = useThree((state) => state.viewport);

    return (
      <>
        <ambientLight intensity={0.8} />
        <directionalLight position={[2, 2, 2]} intensity={0.5} />

        <AvatarModel volume={volume} isActive={isActive} />
        <Environment preset="lobby" />

        <mesh>
          <planeGeometry args={[viewport.width, viewport.height]} />
          <meshBasicMaterial map={texture} toneMapped={false} />
        </mesh>
        <OrbitControls enableZoom={false} enableRotate={false} />
      </>
    );
  };

const Avatar: React.FC<AvatarProps> = ({ volume, isActive }) => {

  return (
    <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
      <Canvas camera={{ position: [0, 0, 2.2], fov: 35 }}>
        <Scene volume={volume} isActive={isActive} />
      </Canvas>
    </div>
  );
};

// const Avatar: React.FC<AudioVisualizerProps> = ({ volume, isActive }) => {
//   const containerRef = useRef<HTMLDivElement>(null);

//   const { scene } = useGLTF("../assets/avatar.glb")
//     return <primitive object={scene} />

//   useEffect(() => {
//     // nanti load three.js viewer di sini
//     // containerRef.current adalah target DOM-nya

//     // contoh init (pseudo):
//     // const renderer = new THREE.WebGLRenderer();
//     // containerRef.current.appendChild(renderer.domElement);

//   }, []);

//   return (
//     <div
//       ref={containerRef}
//       className="w-full h-full flex items-center justify-center text-slate-400 text-sm"
//     >
//       {/* sementara text placeholder */}
//       <span className="opacity-50">Memuat Avatar AI...</span>
//     </div>
//   );
// };

export default Avatar;
