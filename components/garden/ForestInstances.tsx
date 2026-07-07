"use client";

import { useMemo, useRef, useLayoutEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Plant, PlantKind } from "../../lib/forest";
import { GrowthAnim, growthOfPlant } from "./growth";

// Every plant is assembled from four instanced primitives, so the whole
// forest renders in at most 4 draw calls no matter how big it gets.
type Prim = "cyl" | "cone" | "blob" | "ball";

interface Part {
  prim: Prim;
  plantIndex: number;
  pos: [number, number, number];
  rot: [number, number, number];
  scale: [number, number, number];
  color: THREE.Color;
}

const tmpMat = new THREE.Matrix4();
const tmpPlantMat = new THREE.Matrix4();
const tmpPartMat = new THREE.Matrix4();
const tmpQuat = new THREE.Quaternion();
const tmpEuler = new THREE.Euler();
const tmpPos = new THREE.Vector3();
const tmpScale = new THREE.Vector3();

function color(hex: string, lightnessJitter = 0, seed = 0.5): THREE.Color {
  const c = new THREE.Color(hex);
  if (lightnessJitter !== 0) {
    const hsl = { h: 0, s: 0, l: 0 };
    c.getHSL(hsl);
    c.setHSL(
      hsl.h + (seed - 0.5) * 0.03,
      hsl.s,
      THREE.MathUtils.clamp(hsl.l + (seed - 0.5) * lightnessJitter, 0, 1)
    );
  }
  return c;
}

const FLOWER_COLORS = ["#f79ac0", "#ffd166", "#fdf6ec", "#c9a9f5", "#ff8fa3", "#8ecae6"];

function partsForPlant(plant: Plant): Part[] {
  const s = plant.seed;
  const parts: Part[] = [];
  const add = (
    prim: Prim,
    pos: [number, number, number],
    scale: [number, number, number],
    c: THREE.Color,
    rot: [number, number, number] = [0, 0, 0]
  ) => parts.push({ prim, plantIndex: plant.index, pos, rot, scale, color: c });

  const trunk = color("#8a5a3b", 0.14, s);
  const pineGreen = color("#3e7d4f", 0.16, s);
  const leafGreen = color("#63a85c", 0.2, s);
  const lightGreen = color("#84bf6b", 0.2, s);

  switch (plant.kind as PlantKind) {
    case "pine":
      add("cyl", [0, 0.25, 0], [0.15, 0.5, 0.15], trunk);
      add("cone", [0, 0.95, 0], [0.78, 1.15, 0.78], pineGreen);
      add("cone", [0, 1.6, 0], [0.6, 0.95, 0.6], color("#4a8a58", 0.16, s));
      add("cone", [0, 2.18, 0], [0.42, 0.8, 0.42], color("#5a9a60", 0.16, s));
      break;
    case "oak":
      add("cyl", [0, 0.45, 0], [0.17, 0.9, 0.17], trunk);
      add("blob", [0, 1.3, 0], [0.88, 0.8, 0.88], leafGreen, [0, s * 3, 0]);
      add("blob", [0.48, 1.0, 0.2], [0.52, 0.48, 0.52], lightGreen, [0, s * 5, 0.2]);
      add("blob", [-0.42, 1.08, -0.18], [0.56, 0.5, 0.56], color("#55974f", 0.2, s), [0.15, s, 0]);
      break;
    case "birch":
      add("cyl", [0, 0.7, 0], [0.09, 1.4, 0.09], color("#e9e2d2", 0.08, s));
      add("blob", [0, 1.62, 0], [0.5, 0.62, 0.5], color("#a4c964", 0.18, s), [0, s * 4, 0]);
      add("blob", [0.18, 1.28, 0.12], [0.34, 0.34, 0.34], color("#b7d377", 0.18, s));
      break;
    case "bush":
      add("blob", [0, 0.26, 0], [0.5, 0.4, 0.5], leafGreen, [0, s * 6, 0]);
      if (s > 0.4) add("blob", [0.32, 0.18, 0.12], [0.3, 0.24, 0.3], lightGreen);
      if (s > 0.75) add("ball", [-0.25, 0.32, -0.05], [0.08, 0.08, 0.08], new THREE.Color(FLOWER_COLORS[Math.floor(s * 17) % FLOWER_COLORS.length]));
      break;
    case "flower": {
      const head = new THREE.Color(FLOWER_COLORS[Math.floor(s * 31) % FLOWER_COLORS.length]);
      add("cyl", [0, 0.19, 0], [0.028, 0.38, 0.028], color("#5d9c50", 0.1, s));
      add("ball", [0, 0.44, 0], [0.13, 0.13, 0.13], head);
      add("blob", [0.1, 0.1, 0.02], [0.1, 0.05, 0.1], lightGreen, [0, s * 4, 0]);
      break;
    }
    case "mushroom":
      add("cyl", [0, 0.13, 0], [0.08, 0.26, 0.08], color("#f0e6d4", 0.08, s));
      add("cone", [0, 0.34, 0], [0.27, 0.22, 0.27], color(s > 0.5 ? "#e05c4f" : "#e8a04c", 0.12, s));
      break;
    case "rock":
      add("blob", [0, 0.13, 0], [0.4, 0.24, 0.4], color("#9aa0a8", 0.18, s), [s, s * 7, s * 3]);
      if (s > 0.6) add("blob", [0.3, 0.08, 0.15], [0.18, 0.12, 0.18], color("#8b929b", 0.18, s));
      break;
  }
  return parts;
}

const GEOMETRY: Record<Prim, () => THREE.BufferGeometry> = {
  cyl: () => new THREE.CylinderGeometry(0.75, 1, 1, 6),
  cone: () => new THREE.ConeGeometry(1, 1, 7),
  blob: () => new THREE.IcosahedronGeometry(1, 0),
  ball: () => new THREE.IcosahedronGeometry(1, 1),
};

interface Props {
  plants: Plant[];
  anim: GrowthAnim | null;
}

export default function ForestInstances({ plants, anim }: Props) {
  const meshRefs = useRef<Partial<Record<Prim, THREE.InstancedMesh>>>({});

  const { partsByPrim, plantWorld } = useMemo(() => {
    const byPrim: Record<Prim, Part[]> = { cyl: [], cone: [], blob: [], ball: [] };
    for (const plant of plants) {
      for (const part of partsForPlant(plant)) byPrim[part.prim].push(part);
    }
    // Pre-compute each plant's world transform (position + yaw, growth applied per-frame)
    const world = plants.map((p) => ({
      pos: new THREE.Vector3(p.x, 0, p.z),
      quat: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, p.rotY, 0)),
      scale: p.scale,
    }));
    return { partsByPrim: byPrim, plantWorld: world };
  }, [plants]);

  const growth = useRef<Float32Array>(new Float32Array(0));
  useMemo(() => {
    growth.current = new Float32Array(plants.length).fill(-1); // -1 = needs write
  }, [plants]);

  const writeMatrices = (force: boolean, now: number) => {
    const g = growth.current;
    let anyDirty = false;

    for (let i = 0; i < plants.length; i++) {
      const target = growthOfPlant(plants[i].index, anim, now);
      if (force || Math.abs(target - g[i]) > 1e-4) {
        g[i] = target;
        anyDirty = true;
      }
    }
    if (!anyDirty && !force) return;

    for (const prim of Object.keys(partsByPrim) as Prim[]) {
      const mesh = meshRefs.current[prim];
      if (!mesh) continue;
      const parts = partsByPrim[prim];
      for (let j = 0; j < parts.length; j++) {
        const part = parts[j];
        const w = plantWorld[part.plantIndex];
        const grow = Math.max(0.0001, g[part.plantIndex]) * w.scale;
        tmpScale.setScalar(grow);
        tmpPlantMat.compose(w.pos, w.quat, tmpScale);
        tmpQuat.setFromEuler(tmpEuler.set(part.rot[0], part.rot[1], part.rot[2]));
        tmpPos.set(part.pos[0], part.pos[1], part.pos[2]);
        tmpPartMat.compose(tmpPos, tmpQuat, tmpScale.set(part.scale[0], part.scale[1], part.scale[2]));
        tmpMat.multiplyMatrices(tmpPlantMat, tmpPartMat);
        mesh.setMatrixAt(j, tmpMat);
      }
      mesh.instanceMatrix.needsUpdate = true;
      mesh.count = parts.length;
    }
  };

  // Set colors + initial matrices whenever the forest is rebuilt
  useLayoutEffect(() => {
    for (const prim of Object.keys(partsByPrim) as Prim[]) {
      const mesh = meshRefs.current[prim];
      if (!mesh) continue;
      const parts = partsByPrim[prim];
      for (let j = 0; j < parts.length; j++) mesh.setColorAt(j, parts[j].color);
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
    writeMatrices(true, performance.now());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partsByPrim]);

  useFrame(() => {
    if (anim) writeMatrices(false, performance.now());
  });

  const geometries = useMemo(
    () => ({
      cyl: GEOMETRY.cyl(),
      cone: GEOMETRY.cone(),
      blob: GEOMETRY.blob(),
      ball: GEOMETRY.ball(),
    }),
    []
  );

  return (
    <group>
      {(Object.keys(partsByPrim) as Prim[]).map((prim) => (
        <instancedMesh
          key={`${prim}-${plants.length}`}
          ref={(m) => {
            meshRefs.current[prim] = m ?? undefined;
          }}
          args={[geometries[prim], undefined, Math.max(1, partsByPrim[prim].length)]}
          castShadow
          receiveShadow
          frustumCulled={false}
        >
          <meshStandardMaterial flatShading roughness={0.9} metalness={0} />
        </instancedMesh>
      ))}
    </group>
  );
}
