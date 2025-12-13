import { Environment, useGLTF, useTexture } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import React, { useRef, useMemo } from "react";
import { AvatarModel } from "./avatars/AvatarModel";

interface AvatarProps {
  volume: number; // 0 - 255
  isActive: boolean;
  onLoaded?: () => void;
}


const Scene: React.FC<AvatarProps> = ({ volume, isActive, onLoaded }) => {
    const texture = useTexture('/assets/avatar-bg.jpg');
    const viewport = useThree((state) => state.viewport);

    return (
      <>
        <ambientLight intensity={0.8} />
        <directionalLight position={[2, 2, 2]} intensity={0.5} />

        <AvatarModel volume={volume} isActive={isActive} onLoaded={onLoaded} />
        <Environment preset="lobby" />

        <mesh>
          <planeGeometry args={[viewport.width, viewport.height]} />
          <meshBasicMaterial map={texture} toneMapped={false} />
        </mesh>
        <OrbitControls enableZoom={false} enableRotate={false} />

      </>
    );
  };

const Avatar: React.FC<AvatarProps> = ({ volume, isActive, onLoaded }) => {

  return (
    <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
      <Canvas camera={{ position: [0, 0, 2.2], fov: 35 }}>
        <Scene volume={volume} isActive={isActive} onLoaded={onLoaded} />
      </Canvas>
    </div>
  );
};



export default Avatar;
