import React, { useRef, useLayoutEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Float, Environment, ContactShadows, MeshTransmissionMaterial } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Scene 1 & 2: Floating shards converging into an envelope
function Fragments({ scrollProgressRef }) {
    const groupRef = useRef();

    // Create 60 glass shards with random orientations
    const fragments = useMemo(() => {
        const items = [];
        for (let i = 0; i < 60; i++) {
            items.push({
                position: [
                    (Math.random() - 0.5) * 25, // Spread wide initially
                    (Math.random() - 0.5) * 20,
                    (Math.random() - 0.5) * 15
                ],
                rotation: [
                    Math.random() * Math.PI * 2,
                    Math.random() * Math.PI * 2,
                    Math.random() * Math.PI * 2
                ],
                scale: Math.random() * 0.6 + 0.2,
                // Target position: form a flat rectangle (envelope)
                targetPos: [
                    (Math.random() - 0.5) * 6, // width: 6
                    (Math.random() - 0.5) * 4, // height: 4
                    (Math.random() - 0.5) * 0.5 // thin depth: 0.5
                ],
                targetRot: [0, 0, 0] // Flatten out
            });
        }
        return items;
    }, []);

    const meshRefs = useRef([]);

    // Use a glass material built-in to Three to avoid Drei issues if they exist
    const glassMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transmission: 0.9,
        opacity: 1,
        metalness: 0,
        roughness: 0,
        ior: 1.5,
        thickness: 2,
        specularIntensity: 1,
        envMapIntensity: 1,
    }), []);

    useFrame((state) => {
        const progress = scrollProgressRef.current;

        // Convergence: progress 0.1 -> 0.4 
        const envelopeProgress = Math.min(Math.max((progress - 0.1) * 3.33, 0), 1);

        // Burst: progress 0.6 -> 0.75
        const burstProgress = Math.min(Math.max((progress - 0.6) * 6.66, 0), 1);

        meshRefs.current.forEach((mesh, index) => {
            if (!mesh) return;
            const data = fragments[index];

            const time = state.clock.getElapsedTime();
            const floatY = Math.sin(time + index * 10) * 0.3 * (1 - envelopeProgress); // Stop floating when formed

            // Interpolate position
            const currentPosX = THREE.MathUtils.lerp(data.position[0], data.targetPos[0], envelopeProgress);
            const currentPosY = THREE.MathUtils.lerp(data.position[1], data.targetPos[1], envelopeProgress) + floatY;
            const currentPosZ = THREE.MathUtils.lerp(data.position[2], data.targetPos[2], envelopeProgress);

            // Burst logic
            const burstFactor = burstProgress * 20;
            const dirX = data.position[0] > 0 ? 1 : -1;
            const dirY = data.position[1] > 0 ? 1 : -1;
            const dirZ = data.position[2] > 0 ? 1 : -1;

            mesh.position.set(
                currentPosX + dirX * burstFactor,
                currentPosY + dirY * burstFactor,
                currentPosZ + dirZ * burstFactor
            );

            // Interpolate rotation
            mesh.rotation.x = THREE.MathUtils.lerp(data.rotation[0], data.targetRot[0], envelopeProgress) + (burstProgress * time * 2);
            mesh.rotation.y = THREE.MathUtils.lerp(data.rotation[1], data.targetRot[1], envelopeProgress) + (burstProgress * time * 2);
            mesh.rotation.z = THREE.MathUtils.lerp(data.rotation[2] + time * 0.2 * (1 - envelopeProgress), data.targetRot[2], envelopeProgress);
        });

        if (groupRef.current) {
            groupRef.current.scale.setScalar(1 - Math.min(burstProgress * 1.5, 1)); // Shrink out of existence
        }
    });

    return (
        <group ref={groupRef}>
            {fragments.map((data, i) => (
                <mesh
                    key={i}
                    ref={(el) => (meshRefs.current[i] = el)}
                    material={glassMaterial}
                    castShadow
                    receiveShadow
                >
                    <tetrahedronGeometry args={[data.scale, 0]} />
                </mesh>
            ))}
        </group>
    );
}

// Scene 3: The glowing core
function GlowingCore({ scrollProgressRef }) {
    const coreRef = useRef();
    const materialRef = useRef();

    useFrame((state) => {
        if (!coreRef.current || !materialRef.current) return;

        const progress = scrollProgressRef.current;

        // Core appears at ~0.65 -> 0.75
        const appearProgress = Math.min(Math.max((progress - 0.65) * 10, 0), 1);

        // Core scales up wildly at first, then settles
        const scale = appearProgress * 3;

        coreRef.current.scale.setScalar(scale);

        // Core moves up slightly at the very end to make room for HTML button
        const endProgress = Math.min(Math.max((progress - 0.85) * 6.66, 0), 1);
        coreRef.current.position.y = endProgress * 2;

        coreRef.current.rotation.y = state.clock.getElapsedTime() * 0.5;
        coreRef.current.rotation.z = state.clock.getElapsedTime() * 0.2;

        const pulse = Math.sin(state.clock.getElapsedTime() * 3) * 0.1 + 0.9;
        materialRef.current.emissiveIntensity = pulse * appearProgress * 2;
        materialRef.current.opacity = appearProgress;
    });

    return (
        <mesh ref={coreRef}>
            <icosahedronGeometry args={[1, 2]} />
            <meshStandardMaterial
                ref={materialRef}
                color="#ffffff"
                emissive="#f39c12"
                emissiveIntensity={0}
                transparent
                opacity={0}
            />
        </mesh>
    );
}

// Main 3D Composition
export default function SceneManager() {
    const { camera } = useThree();
    const scrollProgressRef = useRef(0);
    const ambientLightRef = useRef();
    const spotlightRef = useRef();

    useLayoutEffect(() => {
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: ".overlay-container",
                start: "top top",
                end: "bottom bottom",
                scrub: 1,
                onUpdate: (self) => {
                    scrollProgressRef.current = self.progress;

                    // Fade in the HTML button at the end
                    const btnContainer = document.getElementById('truce-btn-container');
                    const canvasContainer = document.querySelector('.canvas-container');
                    if (btnContainer && canvasContainer) {
                        if (self.progress > 0.9) {
                            btnContainer.style.opacity = '1';
                            btnContainer.style.pointerEvents = 'auto';
                            canvasContainer.classList.add('interactive'); // allow clicks
                        } else {
                            btnContainer.style.opacity = '0';
                            btnContainer.style.pointerEvents = 'none';
                            canvasContainer.classList.remove('interactive');
                        }
                    }
                },
            }
        });

        // Animate camera swooping through the scene
        tl.to(camera.position, {
            z: 5,
            y: 1,
            ease: "power1.inOut"
        }, 0)
            .to(camera.position, {
                z: 12,
                y: 0,
                ease: "power1.inOut"
            }, 0.5) // Pull back before the explosion
            .to(camera.position, {
                z: 8,
                ease: "power1.inOut"
            }, 0.7);

        return () => tl.kill();
    }, [camera]);

    useFrame(() => {
        const progress = scrollProgressRef.current;

        if (ambientLightRef.current && spotlightRef.current) {
            const coldColor = new THREE.Color("#0a1526");
            const warmColor = new THREE.Color("#f39c12");

            // Transition lighting at Burst (0.6 -> 0.75)
            const lightTransition = Math.min(Math.max((progress - 0.6) * 6.66, 0), 1);
            const currentColor = new THREE.Color().lerpColors(coldColor, warmColor, lightTransition);

            ambientLightRef.current.color = currentColor;
            spotlightRef.current.color = currentColor;

            // Intensity flash
            const burstPulse = Math.sin(lightTransition * Math.PI); // 0 -> 1 -> 0
            spotlightRef.current.intensity = 10 + (burstPulse * 50);
        }
    });

    return (
        <>
            <color attach="background" args={['#030508']} />

            <ambientLight ref={ambientLightRef} intensity={2} color="#0a1526" />
            <spotLight
                ref={spotlightRef}
                position={[0, 10, 10]}
                angle={0.6}
                penumbra={1}
                intensity={10}
                color="#4a90e2"
                castShadow
            />

            <Float speed={1.5} rotationIntensity={0.5} floatIntensity={2}>
                <Fragments scrollProgressRef={scrollProgressRef} />
            </Float>

            <GlowingCore scrollProgressRef={scrollProgressRef} />

            <Environment preset="city" />
            <ContactShadows position={[0, -5, 0]} opacity={0.6} scale={30} blur={2.5} far={10} />
        </>
    );
}
