"use client";
// @ts-nocheck

import React, { Suspense, useLayoutEffect, useMemo, useRef, useState, useEffect } from "react";
import Image from "next/image";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import {
    ContactShadows,
    Environment,
    Float,
    Html,
    MeshTransmissionMaterial,
} from "@react-three/drei";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const clamp01 = (value) => THREE.MathUtils.clamp(value, 0, 1);
const lerp = THREE.MathUtils.lerp;

function rangeProgress(value, start, end) {
    if (start === end) return 0;
    return clamp01((value - start) / (end - start));
}

function smoothStep(value, start, end) {
    const t = rangeProgress(value, start, end);
    return t * t * (3 - 2 * t);
}

function makeSeededRandom(seed = 42) {
    let state = seed % 2147483647;
    if (state <= 0) state += 2147483646;
    return () => {
        state = (state * 16807) % 2147483647;
        return (state - 1) / 2147483646;
    };
}

function buildPodSurface({
    startAngle = 0,
    endAngle = Math.PI,
    length = 5.4,
    radius = 0.46,
    lengthSegments = 96,
    radialSegments = 40,
}) {
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const uvs = [];
    const indices = [];

    const localRadius = (u) => {
        const base = Math.pow(Math.sin(Math.PI * u), 0.72);
        const bumps = 1 + 0.055 * Math.sin(u * Math.PI * 7.5) + 0.028 * Math.sin(u * Math.PI * 15.5 + 0.7);
        const tipTaper = 0.01 + radius * base * bumps;
        return Math.max(0.001, tipTaper);
    };

    const centerlineBow = (u) => {
        const arc = Math.sin(Math.PI * u);
        return {
            y: 0.015 * arc,
            z: -0.02 * arc,
        };
    };

    for (let i = 0; i <= lengthSegments; i += 1) {
        const u = i / lengthSegments;
        const x = (u - 0.5) * length;
        const r = localRadius(u);
        const bow = centerlineBow(u);

        for (let j = 0; j <= radialSegments; j += 1) {
            const v = j / radialSegments;
            const angle = lerp(startAngle, endAngle, v);
            const squashedY = Math.cos(angle) * r * 0.9;
            const squashedZ = Math.sin(angle) * r * 0.7;
            const seamPinch = Math.pow(Math.abs(Math.sin(angle)), 1.8);
            const y = bow.y + squashedY * (0.94 + seamPinch * 0.06);
            const z = bow.z + squashedZ;

            positions.push(x, y, z);
            uvs.push(u, v);
        }
    }

    const row = radialSegments + 1;
    for (let i = 0; i < lengthSegments; i += 1) {
        for (let j = 0; j < radialSegments; j += 1) {
            const a = i * row + j;
            const b = a + row;
            const c = b + 1;
            const d = a + 1;

            indices.push(a, b, d);
            indices.push(b, c, d);
        }
    }

    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    return geometry;
}

function buildSeamCurve(length = 5.15) {
    const points = [];
    for (let i = 0; i <= 18; i += 1) {
        const u = i / 18;
        const x = (u - 0.5) * length;
        const arc = Math.sin(Math.PI * u);
        const y = 0.39 * Math.pow(arc, 0.72) * 0.9 + 0.01 * arc;
        const z = -0.02 * arc;
        points.push(new THREE.Vector3(x, y, z));
    }
    return new THREE.CatmullRomCurve3(points);
}

function buildStemGeometry() {
    const geometry = new THREE.CylinderGeometry(0.045, 0.065, 0.65, 14, 1, false);
    geometry.rotateZ(-Math.PI / 2);
    return geometry;
}

function createSeedLayout(count = 20, seed = 7) {
    const rnd = makeSeededRandom(seed);
    return new Array(count).fill(null).map((_, index) => {
        const t = index / Math.max(1, count - 1);
        const x = lerp(-1.7, 1.7, t) + (rnd() - 0.5) * 0.06;
        const ring = (index % 3) - 1;
        const y = ring * 0.08 + (rnd() - 0.5) * 0.03;
        const z = (rnd() - 0.5) * 0.22;
        const scale = 0.11 + rnd() * 0.03;
        const spin = rnd() * Math.PI;
        const drift = 0.25 + rnd() * 0.9;
        const fallSpeed = 0.8 + rnd() * 1.2;

        return { x, y, z, scale, spin, drift, fallSpeed };
    });
}

function PodValve({ geometry, side = 1, open = 0, color = "#d8c08d" }) {
    const groupRef = useRef();
    const meshRef = useRef();

    useFrame(() => {
        if (!groupRef.current || !meshRef.current) return;

        const rotationAmount = open * 1.05 * side;
        groupRef.current.rotation.x = rotationAmount;
        groupRef.current.position.y = side * open * 0.18;
        groupRef.current.position.z = open * 0.1;

        meshRef.current.position.y = side * 0.005;
    });

    return (
        <group ref={groupRef}>
            <mesh ref={meshRef} geometry={geometry} castShadow receiveShadow>
                <meshStandardMaterial
                    color={color}
                    roughness={0.88}
                    metalness={0.02}
                    envMapIntensity={0.55}
                    side={THREE.DoubleSide}
                />
            </mesh>
        </group>
    );
}

function SeedCluster({ mode = "before", progress, count = 18 }) {
    const meshRef = useRef();
    const seeds = useMemo(() => createSeedLayout(count, mode === "before" ? 7 : 21), [count, mode]);
    const dummy = useMemo(() => new THREE.Object3D(), []);
    const geometry = useMemo(() => new THREE.SphereGeometry(1, 18, 12), []);

    useFrame((state) => {
        if (!meshRef.current) return;

        const elapsed = state.clock.getElapsedTime();
        const release = mode === "before" ? smoothStep(progress.current, 0.28, 0.62) : 0;
        const protectedTension = mode === "after" ? smoothStep(progress.current, 0.72, 1) : 0;

        seeds.forEach((seed, index) => {
            const wind = release * seed.drift * 1.2;
            const x = seed.x + wind * 0.4;
            const y = seed.y - release * (2.4 + seed.fallSpeed * 0.85);
            const z = seed.z + Math.sin(elapsed * 4 + seed.spin) * 0.025 + wind * 0.18;

            const protectedPulse = protectedTension * 0.03 * Math.sin(elapsed * 7 + seed.spin * 3);
            dummy.position.set(x, y + protectedPulse, z);
            dummy.rotation.set(seed.spin + elapsed * 1.5, elapsed * 0.6 + seed.spin * 0.6, seed.spin * 0.5);
            dummy.scale.set(seed.scale * 1.2, seed.scale * 0.88, seed.scale);
            dummy.updateMatrix();
            meshRef.current.setMatrixAt(index, dummy.matrix);
        });

        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={meshRef} args={[geometry, null, seeds.length]} castShadow receiveShadow>
            <meshStandardMaterial color="#121212" roughness={0.52} metalness={0.06} />
        </instancedMesh>
    );
}

function MembraneShell({ geometry, progress }) {
    const shellRef = useRef();
    const materialRef = useRef();

    useFrame((state) => {
        if (!shellRef.current || !materialRef.current) return;

        const membrane = smoothStep(progress.current, 0.58, 0.84);
        const pulse = 1 + membrane * 0.02 + Math.sin(state.clock.getElapsedTime() * 6) * membrane * 0.006;

        shellRef.current.scale.setScalar(pulse);
        materialRef.current.opacity = membrane * 0.6;
        materialRef.current.thickness = lerp(0.05, 0.38, membrane);
        materialRef.current.distortion = membrane * 0.32;
        materialRef.current.chromaticAberration = membrane * 0.025;
        materialRef.current.anisotropy = membrane * 0.8;
    });

    return (
        <mesh ref={shellRef} geometry={geometry} castShadow>
            <MeshTransmissionMaterial
                ref={materialRef}
                transparent
                opacity={0}
                backside
                samples={4}
                resolution={256}
                thickness={0.12}
                roughness={0.12}
                transmission={1}
                ior={1.18}
                color="#b4d57e"
                attenuationColor="#d9ffad"
                attenuationDistance={0.55}
            />
        </mesh>
    );
}

function WindLines({ progress }) {
    const groupRef = useRef();
    const lines = useMemo(() => {
        const rnd = makeSeededRandom(12);
        return new Array(7).fill(null).map((_, index) => ({
            y: (rnd() - 0.5) * 1.2,
            z: (rnd() - 0.5) * 0.8,
            speed: 0.8 + rnd() * 0.6,
            offset: rnd() * Math.PI * 2,
            scale: 0.85 + rnd() * 0.7,
            index,
        }));
    }, []);

    useFrame((state) => {
        if (!groupRef.current) return;

        const wind = smoothStep(progress.current, 0.72, 1);
        const elapsed = state.clock.getElapsedTime();

        groupRef.current.children.forEach((child, index) => {
            const item = lines[index];
            const flow = ((elapsed * item.speed + item.offset) % 2) - 1;
            child.position.x = -2.3 + flow * 4.7;
            child.position.y = item.y + Math.sin(elapsed * 4 + item.offset) * 0.04;
            child.position.z = item.z;
            child.scale.x = item.scale * (0.7 + wind * 1.1);
            child.visible = wind > 0.02;
            child.material.opacity = wind * 0.22;
        });
    });

    return (
        <group ref={groupRef}>
            {lines.map((item) => (
                <mesh key={item.index}>
                    <boxGeometry args={[1.15, 0.018, 0.018]} />
                    <meshBasicMaterial color="#dff4ff" transparent opacity={0} />
                </mesh>
            ))}
        </group>
    );
}

function PodUnit({ mode = "before", worldPosition = [0, 0, 0], progress }) {
    const groupRef = useRef();
    const stemRef = useRef();
    const seamRef = useRef();

    const fullGeometry = useMemo(
        () => buildPodSurface({ startAngle: 0, endAngle: Math.PI * 2, radius: 0.46 }),
        []
    );
    const upperValveGeometry = useMemo(
        () => buildPodSurface({ startAngle: 0, endAngle: Math.PI, radius: 0.46 }),
        []
    );
    const lowerValveGeometry = useMemo(
        () => buildPodSurface({ startAngle: Math.PI, endAngle: Math.PI * 2, radius: 0.46 }),
        []
    );
    const seamGeometry = useMemo(() => new THREE.TubeGeometry(buildSeamCurve(), 64, 0.02, 8, false), []);
    const stemGeometry = useMemo(() => buildStemGeometry(), []);

    useFrame((state) => {
        if (!groupRef.current || !stemRef.current || !seamRef.current) return;

        const p = progress.current;
        const open = mode === "before" ? smoothStep(p, 0.22, 0.46) : smoothStep(p, 0.92, 1) * 0.06;
        const wind = mode === "after" ? smoothStep(p, 0.72, 1) : smoothStep(p, 0.25, 0.62);
        const shakeStrength = mode === "after" ? wind * 0.04 : wind * 0.015;

        groupRef.current.position.set(worldPosition[0], worldPosition[1], worldPosition[2]);
        groupRef.current.rotation.set(0.22, mode === "before" ? -0.58 : 0.55, mode === "before" ? -0.08 : 0.08);
        groupRef.current.position.y += Math.sin(state.clock.getElapsedTime() * 3.2 + worldPosition[0]) * shakeStrength;
        groupRef.current.position.z += Math.cos(state.clock.getElapsedTime() * 4.4 + worldPosition[2]) * shakeStrength * 0.6;

        stemRef.current.position.set(-2.95, 0, 0);
        seamRef.current.visible = open < 0.6;
        seamRef.current.material.opacity = 1 - open * 0.7;
    });

    const open = mode === "before" ? smoothStep(progress.current, 0.22, 0.46) : smoothStep(progress.current, 0.92, 1) * 0.06;

    return (
        <group ref={groupRef}>
            <Float speed={1.4} rotationIntensity={0.08} floatIntensity={0.08}>
                <group>
                    <PodValve geometry={upperValveGeometry} side={1} open={open} color={mode === "before" ? "#d8bf89" : "#b8ce7f"} />
                    <PodValve geometry={lowerValveGeometry} side={-1} open={open} color={mode === "before" ? "#ceb37a" : "#acc46e"} />

                    <mesh ref={stemRef} geometry={stemGeometry} castShadow receiveShadow>
                        <meshStandardMaterial color={mode === "before" ? "#8f7144" : "#7fa067"} roughness={0.92} />
                    </mesh>

                    <mesh ref={seamRef} geometry={seamGeometry} castShadow>
                        <meshStandardMaterial color={mode === "before" ? "#8b6a3f" : "#7f9f5e"} roughness={1} transparent opacity={1} />
                    </mesh>

                    <SeedCluster mode={mode} progress={progress} count={mode === "before" ? 18 : 16} />

                    {mode === "after" ? <MembraneShell geometry={fullGeometry} progress={progress} /> : null}
                    {mode === "after" ? <WindLines progress={progress} /> : null}
                </group>
            </Float>
        </group>
    );
}

function CameraRig({ progress }) {
    useFrame((state) => {
        const p = progress.current;
        const closeup = smoothStep(p, 0, 0.18);
        const centerShift = smoothStep(p, 0.18, 0.55);
        const protectedShake = smoothStep(p, 0.72, 1);

        const basePosition = new THREE.Vector3(
            lerp(0, 0, closeup),
            lerp(0.7, 0.35, closeup),
            lerp(12.4, 9.8, closeup)
        );

        const laterPosition = new THREE.Vector3(
            lerp(basePosition.x, 0, centerShift),
            lerp(basePosition.y, 0.18, centerShift),
            lerp(basePosition.z, 9.8, centerShift)
        );

        const t = state.clock.getElapsedTime();
        laterPosition.x += Math.sin(t * 9.5) * protectedShake * 0.035;
        laterPosition.y += Math.cos(t * 8.5) * protectedShake * 0.02;

        state.camera.position.lerp(laterPosition, 0.08);
        state.camera.lookAt(0, 0.15, 0);
    });

    return null;
}

function Lighting() {
    return (
        <>
            <ambientLight intensity={0.35} />
            <directionalLight position={[4, 5, 5]} intensity={1.8} color="#fff6df" castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
            <directionalLight position={[-4, 2, -6]} intensity={1.2} color="#cfe8ff" />
            <spotLight position={[0, 2.8, -6]} intensity={2.4} angle={0.3} penumbra={1} color="#d7efff" />
            <spotLight position={[0, 1.4, 6]} intensity={1.4} angle={0.38} penumbra={1} color="#fff2d7" />
        </>
    );
}

function Scene({ progress }) {
    return (
        <>
            <CameraRig progress={progress} />
            <Lighting />
            <Suspense fallback={<Html center style={{ color: "white" }}>Loading scene…</Html>}>
                <Environment preset="warehouse" />
            </Suspense>

            <group position={[0, -0.1, 0]}>
                <PodUnit mode="before" worldPosition={[-3.35, 0.05, 0]} progress={progress} />
                <PodUnit mode="after" worldPosition={[3.35, -0.05, 0]} progress={progress} />
            </group>

            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.65, 0]} receiveShadow>
                <planeGeometry args={[30, 30]} />
                <shadowMaterial opacity={0.12} />
            </mesh>

            <ContactShadows position={[0, -1.6, 0]} scale={16} blur={2.8} opacity={0.24} far={8} />
        </>
    );
}

function WebGLFallback() {
    return (
        <section className="relative py-24 lg:py-40 bg-[#06080b] text-white overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(90,120,150,0.08),transparent_60%)]" />
            <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-14 relative z-10">
                <div className="flex flex-col items-center text-center mb-16">
                    <div className="mb-4 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-white/50 backdrop-blur">
                        Защита стручка
                    </div>
                    <h2 className="max-w-3xl text-3xl font-medium leading-tight text-white md:text-5xl md:leading-[1.05] mb-6">
                        До — стручок раскрывается и теряет семена. После — био-мембрана держит удар ветра.
                    </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="relative overflow-hidden rounded-sm border border-white/10 bg-white/5 p-8">
                        <div className="text-[11px] uppercase tracking-[0.22em] text-white/40 mb-3">Без ГРИПИЛ</div>
                        <div className="text-2xl font-medium text-red-400 mb-2">Риск осыпания</div>
                        <p className="text-white/60 text-sm leading-relaxed">Створки раскрываются при ударе ветра. Семена падают на землю до начала уборки. Потери 12–18% урожая.</p>
                    </div>
                    <div className="relative overflow-hidden rounded-sm border border-[#CDFF00]/20 bg-[#CDFF00]/5 p-8">
                        <div className="text-[11px] uppercase tracking-[0.22em] text-[#CDFF00]/60 mb-3">С ГРИПИЛ</div>
                        <div className="text-2xl font-medium text-[#CDFF00] mb-2">Мембрана защищает</div>
                        <p className="text-white/60 text-sm leading-relaxed">Дышащая биомембрана удерживает шов стручка. Ветер, дождь, температурный стресс — стручок остаётся целым.</p>
                    </div>
                </div>
                <p className="text-center text-white/20 text-xs mt-8 font-mono uppercase tracking-widest">3D-визуализация недоступна на этом устройстве</p>
            </div>
        </section>
    );
}

export default function SplitComparison() {
    const sectionRef = useRef(null);
    const progress = useRef(0);
    const [webglOk, setWebglOk] = useState(null);

    useEffect(() => {
        try {
            const canvas = document.createElement("canvas");
            const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
            setWebglOk(!!gl);
        } catch {
            setWebglOk(false);
        }
    }, []);

    useLayoutEffect(() => {
        if (!webglOk) return undefined;
        const section = sectionRef.current;
        if (!section) return undefined;

        const ctx = gsap.context(() => {
            ScrollTrigger.create({
                trigger: section,
                start: "top top",
                end: "bottom bottom",
                scrub: true,
                onUpdate: (self) => {
                    progress.current = self.progress;
                },
            });
        }, sectionRef);

        return () => ctx.revert();
    }, [webglOk]);

    // Ещё не определили — ничего не показываем
    if (webglOk === null) return null;

    // Нет WebGL — показываем статичный fallback
    if (!webglOk) return <WebGLFallback />;

    return (
        <section ref={sectionRef} className="relative h-[320vh] bg-[#06080b] text-white">
            <div className="sticky top-0 h-screen overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(90,120,150,0.14),transparent_36%),linear-gradient(180deg,#0a0d11_0%,#06080b_100%)]" />

                <div className="absolute left-0 right-0 top-0 z-20 mx-auto flex max-w-7xl items-start justify-between gap-6 px-6 pt-8 md:px-10 lg:px-14">
                    <div className="max-w-xl">
                        <h2 className="max-w-2xl text-3xl font-medium leading-tight text-white md:text-5xl md:leading-[1.02]">
                            До — стручок раскрывается и теряет семена. После — био-мембрана держит удар ветра.
                        </h2>
                    </div>

                    <div className="hidden rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur md:block">
                        <div className="grid gap-3 text-sm text-white/80">
                            <div>
                                <div className="text-[11px] uppercase tracking-[0.22em] text-white/40">Без ГРИПИЛ</div>
                                <div className="text-white/50">Створки раскрываются, семена осыпаются.</div>
                            </div>
                            <div className="h-px bg-white/10" />
                            <div>
                                <div className="text-[11px] uppercase tracking-[0.22em] text-white/40">С ГРИПИЛ</div>
                                <div className="text-white/50">Появляется мембрана, ветер не раскрывает стручок.</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="absolute inset-x-0 top-[22%] z-20 hidden px-8 lg:block">
                    <div className="mx-auto grid max-w-7xl grid-cols-2 gap-10 text-sm uppercase tracking-[0.22em] text-white/40">
                        <div className="pl-10">Без ГРИПИЛ</div>
                        <div className="pr-10 text-right">С ГРИПИЛ</div>
                    </div>
                </div>

                <Canvas
                    shadows
                    dpr={[1, 1.8]}
                    camera={{ position: [0, 0.7, 12.4], fov: 30 }}
                    gl={{ antialias: true, alpha: true }}
                    className="relative z-10"
                >
                    <Scene progress={progress} />
                </Canvas>

                <div className="absolute inset-x-0 bottom-7 z-20 px-6 md:px-10 lg:px-14">
                    <div className="mx-auto flex max-w-7xl items-center justify-between rounded-full border border-white/10 bg-white/5 px-5 py-3 text-xs text-white/55 backdrop-blur md:text-sm">
                        <span>Scroll ↓ — камера приближается, левый стручок раскрывается, мембрана защищает правый.</span>
                    </div>
                </div>
            </div>
        </section>
    );
}
