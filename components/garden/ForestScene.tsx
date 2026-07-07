"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Plant, islandRadius } from "../../lib/forest";
import { GrowthAnim } from "./growth";
import ForestInstances from "./ForestInstances";

// ---------- Sky ----------

const skyVertex = /* glsl */ `
  varying vec3 vWorldPosition;
  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const skyFragment = /* glsl */ `
  varying vec3 vWorldPosition;
  void main() {
    float h = normalize(vWorldPosition).y;
    vec3 top = vec3(0.47, 0.76, 0.94);      // soft blue
    vec3 mid = vec3(0.78, 0.91, 0.96);      // hazy pale blue
    vec3 horizon = vec3(1.0, 0.89, 0.76);   // warm peach glow
    vec3 color = h > 0.25
      ? mix(mid, top, smoothstep(0.25, 0.9, h))
      : mix(horizon, mid, smoothstep(-0.05, 0.25, h));
    gl_FragColor = vec4(color, 1.0);
  }
`;

function SkyDome() {
  return (
    <mesh>
      <sphereGeometry args={[220, 24, 12]} />
      <shaderMaterial
        vertexShader={skyVertex}
        fragmentShader={skyFragment}
        side={THREE.BackSide}
        depthWrite={false}
        fog={false}
      />
    </mesh>
  );
}

// ---------- Island + water ----------

function Island({ radius }: { radius: number }) {
  const grassGeo = useMemo(() => {
    const geo = new THREE.CylinderGeometry(radius, radius * 1.04, 0.7, 40, 1);
    // Nudge rim vertices so the island edge is organic rather than a perfect circle
    const pos = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const d = Math.sqrt(x * x + z * z);
      if (d > radius * 0.8) {
        const angle = Math.atan2(z, x);
        const wobble = 1 + Math.sin(angle * 7.3) * 0.035 + Math.sin(angle * 3.1 + 1.7) * 0.045;
        pos.setX(i, x * wobble);
        pos.setZ(i, z * wobble);
      }
    }
    geo.computeVertexNormals();
    return geo;
  }, [radius]);

  return (
    <group>
      <mesh geometry={grassGeo} position={[0, -0.35, 0]} receiveShadow>
        <meshStandardMaterial color="#7cbb62" flatShading roughness={1} />
      </mesh>
      {/* soil skirt */}
      <mesh position={[0, -1.45, 0]}>
        <cylinderGeometry args={[radius * 1.02, radius * 0.82, 1.7, 40]} />
        <meshStandardMaterial color="#8a6a4d" flatShading roughness={1} />
      </mesh>
      {/* water */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.9, 0]}>
        <circleGeometry args={[210, 48]} />
        <meshStandardMaterial color="#8fcfdd" roughness={0.6} />
      </mesh>
    </group>
  );
}

// ---------- Clouds ----------

function Clouds({ radius }: { radius: number }) {
  const group = useRef<THREE.Group>(null);
  const clouds = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => ({
        angle: (i / 6) * Math.PI * 2 + i * 0.7,
        dist: radius * (0.7 + (i % 3) * 0.35),
        y: radius * 1.15 + 5 + ((i * 2.3) % 4),
        speed: 0.012 + (i % 3) * 0.005,
        scale: 0.8 + ((i * 1.7) % 0.7),
      })),
    [radius]
  );

  useFrame((_, dt) => {
    if (!group.current) return;
    group.current.children.forEach((cloud, i) => {
      const c = clouds[i];
      c.angle += dt * c.speed;
      cloud.position.set(Math.cos(c.angle) * c.dist, c.y, Math.sin(c.angle) * c.dist);
    });
  });

  return (
    <group ref={group}>
      {clouds.map((c, i) => (
        <group key={i} scale={c.scale}>
          <mesh>
            <sphereGeometry args={[1.4, 7, 5]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.55} flatShading roughness={1} />
          </mesh>
          <mesh position={[1.3, -0.2, 0.3]}>
            <sphereGeometry args={[1.0, 7, 5]} />
            <meshStandardMaterial color="#f4f9ff" emissive="#f4f9ff" emissiveIntensity={0.55} flatShading roughness={1} />
          </mesh>
          <mesh position={[-1.2, -0.25, -0.2]}>
            <sphereGeometry args={[0.9, 7, 5]} />
            <meshStandardMaterial color="#f4f9ff" emissive="#f4f9ff" emissiveIntensity={0.55} flatShading roughness={1} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ---------- Fireflies / floating pollen ----------

function Fireflies({ radius }: { radius: number }) {
  const points = useRef<THREE.Points>(null);
  const mat = useRef<THREE.PointsMaterial>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(50 * 3);
    for (let i = 0; i < 50; i++) {
      const r = Math.sqrt(Math.random()) * radius * 0.9;
      const a = Math.random() * Math.PI * 2;
      arr[i * 3] = Math.cos(a) * r;
      arr[i * 3 + 1] = 0.4 + Math.random() * 2.6;
      arr[i * 3 + 2] = Math.sin(a) * r;
    }
    return arr;
  }, [radius]);

  useFrame(({ clock }) => {
    if (points.current) points.current.rotation.y = clock.elapsedTime * 0.02;
    if (mat.current) mat.current.opacity = 0.55 + Math.sin(clock.elapsedTime * 1.4) * 0.3;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        ref={mat}
        size={0.14}
        color="#fff3b0"
        transparent
        opacity={0.7}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// ---------- Camera ----------

function CameraRig({ radius, animating }: { radius: number; animating: boolean }) {
  const { camera } = useThree();
  const angle = useRef(0.6);
  const dist = useRef(radius * 2.3);
  const height = useRef(radius * 1.15);

  useFrame((_, dt) => {
    const clamped = Math.min(dt, 0.05);
    angle.current += clamped * (animating ? 0.11 : 0.055);
    dist.current = THREE.MathUtils.lerp(dist.current, radius * 2.3, clamped * 0.8);
    height.current = THREE.MathUtils.lerp(height.current, radius * 1.15, clamped * 0.8);
    camera.position.set(
      Math.cos(angle.current) * dist.current,
      height.current,
      Math.sin(angle.current) * dist.current
    );
    camera.lookAt(0, 0.8, 0);
  });

  return null;
}

// ---------- Lights ----------

function Lights({ radius }: { radius: number }) {
  const shadowSize = radius + 5;
  return (
    <>
      <hemisphereLight args={["#d6ecff", "#b08a62", 0.75]} />
      <directionalLight
        color="#ffe0b0"
        intensity={2.1}
        position={[radius * 1.2, radius * 1.8, radius * 0.8]}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-camera-left={-shadowSize}
        shadow-camera-right={shadowSize}
        shadow-camera-top={shadowSize}
        shadow-camera-bottom={-shadowSize}
        shadow-camera-near={1}
        shadow-camera-far={radius * 6}
      />
    </>
  );
}

// ---------- Scene ----------

interface Props {
  plants: Plant[];
  anim: GrowthAnim | null;
}

export default function ForestScene({ plants, anim }: Props) {
  const radius = islandRadius(plants.length);

  return (
    <Canvas
      shadows
      camera={{ position: [radius * 1.8, radius * 1.2, radius * 1.8], fov: 42, near: 0.1, far: 500 }}
      dpr={[1, 2]}
      gl={{ antialias: true, powerPreference: "high-performance", stencil: false }}
    >
      <fog attach="fog" args={["#ffe3c2", radius * 3.5, 190]} />
      <SkyDome />
      <Lights radius={radius} />
      <Island radius={radius} />
      <ForestInstances plants={plants} anim={anim} />
      <Clouds radius={radius} />
      <Fireflies radius={radius} />
      <CameraRig radius={radius} animating={anim !== null} />
    </Canvas>
  );
}
