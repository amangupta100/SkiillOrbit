"use client";
import React, { useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  useGLTF,
  useAnimations,
  Environment,
  ContactShadows,
  Html,
} from "@react-three/drei";
import * as THREE from "three";

// ---------- Viseme Map (numbers from TTS output) ----------
const VISEME_MAP = {
  0: { jawOpen: 0.1, mouthClose: 0.9 }, // silence
  2: { jawOpen: 0.8, mouthClose: 0.1 }, // "ae"
  4: { jawOpen: 0.6, mouthClose: 0.2 }, // "eh"
  12: { jawOpen: 0.5, mouthClose: 0.2 }, // "hh"
  21: { mouthClose: 1 }, // "m", "n"
  // ⚡️ add more viseme numbers as needed for your TTS system
  neutral: { jawOpen: 0.1, mouthClose: 0.1 },
};

// ---------- Helper: Fit object into view ----------
function useFitCamera(objectRef) {
  const controls = useRef(null);
  useEffect(() => {
    if (!objectRef.current || !controls.current) return;
    const box = new THREE.Box3().setFromObject(objectRef.current);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const radius = Math.max(size.x, size.y, size.z) * 0.5;
    controls.current.object.position.set(
      center.x + radius,
      center.y + radius * 0.6,
      center.z + radius * 1.6
    );
    controls.current.target.copy(center);
    controls.current.update();
  }, [objectRef]);
  return { controls };
}

// ---------- GLB Model ----------
function GLBModel({ phonemeTimings, onSpeakComplete }) {
  const group = useRef();
  const { scene, animations } = useGLTF("/models/Untitled88.glb");
  const { actions } = useAnimations(animations, group);

  const morphTargets = useRef({});
  const startTime = useRef(null);
  const [debugInfo, setDebugInfo] = useState({
    currentViseme: null,
    elapsed: 0,
  });

  // Blink state
  const blinkState = useRef({
    value: 0,
    closing: false,
    nextBlink: Date.now() + 2000,
  });

  // Collect morph targets
  useEffect(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const center = box.getCenter(new THREE.Vector3());
    scene.position.sub(center);

    scene.traverse((child) => {
      if (child.isMesh && child.morphTargetDictionary) {
        const dict = child.morphTargetDictionary;
        for (let key in dict) {
          morphTargets.current[key] = morphTargets.current[key] || [];
          morphTargets.current[key].push({
            mesh: child,
            index: dict[key],
          });
        }
      }
    });
  }, [scene]);

  // Start speech timing
  useEffect(() => {
    if (phonemeTimings.length) {
      startTime.current = performance.now();
    }
  }, [phonemeTimings]);

  useEffect(() => {
    if (actions && Object.keys(actions).length > 0) {
      Object.values(actions).forEach((action) => {
        action.reset().fadeIn(0.5).play();
        action.loop = THREE.LoopRepeat;
      });
    }
  }, [actions]);

  // useFrame: update blink + lip sync
  useFrame(() => {
    const now = Date.now();

    // 👁 Blink logic
    const blink = blinkState.current;
    if (now > blink.nextBlink) {
      blink.closing = true;
      blink.nextBlink = now + 1000;
    }
    if (blink.closing) {
      blink.value += 0.25;
      if (blink.value >= 1) {
        blink.value = 1;
        blink.closing = false;
        blink.opening = true;
        blink.holdUntil = now + 140;
      }
    } else if (blink.opening) {
      if (now > blink.holdUntil) {
        blink.value -= 0.15;
        if (blink.value <= 0) {
          blink.value = 0;
          blink.opening = false;
          blink.nextBlink = now + 3000 + Math.random() * 2300;
        }
      }
    }
    ["eyeBlinkLeft", "eyeBlinkRight", "blink"].forEach((key) => {
      morphTargets.current[key]?.forEach(({ mesh, index }) => {
        mesh.morphTargetInfluences[index] = blink.value;
      });
    });

    // 👄 Lip sync
    if (phonemeTimings.length && startTime.current) {
      const elapsed = (performance.now() - startTime.current) / 1000;
      const current = phonemeTimings.find(
        (p) => elapsed >= p.startTime && elapsed <= p.endTime
      );

      const targetViseme =
        (current && VISEME_MAP[current.viseme]) || VISEME_MAP["neutral"];

      setDebugInfo({
        currentViseme: current ? current.viseme : "neutral",
        elapsed,
      });

      // 🔹 Smooth transition
      for (let key in VISEME_MAP["neutral"]) {
        const value = targetViseme[key] || 0;
        morphTargets.current[key]?.forEach(({ mesh, index }) => {
          mesh.morphTargetInfluences[index] = THREE.MathUtils.lerp(
            mesh.morphTargetInfluences[index] || 0,
            value,
            0.13
          );
        });
      }

      // End check
      if (
        elapsed > phonemeTimings[phonemeTimings.length - 1].endTime + 0.5 &&
        startTime.current
      ) {
        startTime.current = null;
        onSpeakComplete?.();
      }
    }
  });

  return (
    <group ref={group} dispose={null}>
      <primitive object={scene} />
    </group>
  );
}

// ---------- Wrapper ----------
export default function InterviewerAvatarWrapper({ phonemeTimings }) {
  const modelRef = useRef();
  const { controls } = useFitCamera(modelRef);

  return (
    <div className="relative w-full h-[calc(100vh-70px)]">
      <Canvas shadows dpr={[1, 2]} camera={{ fov: 22 }}>
        <ambientLight intensity={1.2} />
        <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
        <group ref={modelRef}>
          <React.Suspense
            fallback={
              <Html center>
                <div className="px-3 py-1 rounded bg-black/70 text-white text-sm">
                  Loading avatar…
                </div>
              </Html>
            }
          >
            <GLBModel phonemeTimings={phonemeTimings} />
          </React.Suspense>
        </group>
        <OrbitControls
          ref={controls}
          enableDamping
          enableZoom={false}
          minPolarAngle={Math.PI / 2}
          maxPolarAngle={Math.PI / 2}
        />

        <ContactShadows
          position={[0, -0.8, 0]}
          opacity={0.4}
          scale={10}
          blur={2.4}
          far={4}
        />
      </Canvas>
    </div>
  );
}

useGLTF.preload("/models/Untitled88.glb");
