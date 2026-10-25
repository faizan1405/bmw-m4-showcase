import { ContactShadows, Environment, Lightformer, MeshReflectorMaterial } from "@react-three/drei";

/** Architectural photo studio: softbox lighting, reflective floor, contact shadows. */
export function Studio({ mobile }: { mobile: boolean }) {
  return (
    <>
      <color attach="background" args={["#08090b"]} />
      <fog attach="fog" args={["#08090b", 10, 26]} />
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={3} position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[10, 3, 1]} />
        <Lightformer form="rect" intensity={1.6} position={[0, 4, -6]} scale={[12, 1.2, 1]} />
        <Lightformer form="rect" intensity={2.2} position={[-7, 2, 0]} rotation-y={Math.PI / 2} scale={[14, 0.6, 1]} />
        <Lightformer form="rect" intensity={2.2} position={[7, 2, 0]} rotation-y={-Math.PI / 2} scale={[14, 0.6, 1]} />
        <Lightformer form="ring" color="#9fb8ff" intensity={0.8} position={[6, 3, 6]} scale={3} />
      </Environment>
      <spotLight position={[0, 9, 0]} angle={0.5} penumbra={1} intensity={60} castShadow={!mobile} shadow-mapSize={1024} />
      <directionalLight position={[6, 4, 5]} intensity={0.6} />
      <mesh rotation-x={-Math.PI / 2} position-y={0.001}>
        <planeGeometry args={[60, 60]} />
        {mobile ? (
          <meshStandardMaterial color="#0c0d10" metalness={0.4} roughness={0.55} />
        ) : (
          <MeshReflectorMaterial
            blur={[300, 80]}
            resolution={512}
            mixBlur={1}
            mixStrength={18}
            roughness={0.9}
            depthScale={1}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.4}
            color="#0b0c0f"
            metalness={0.6}
            mirror={0}
          />
        )}
      </mesh>
      <ContactShadows position={[0, 0.005, 0]} opacity={0.85} scale={12} blur={2.4} far={2} resolution={512} frames={1} />
    </>
  );
}
