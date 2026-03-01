import React, { useRef, useLayoutEffect, useState, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Float, Environment, ContactShadows, MeshTransmissionMaterial } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Creates procedural fragments of glass that will form an envelope
function Fragments({ scrollProgressRef }) {
    const groupRef = useRef();

    // Create 50 random glass shards
    const fragments = useMemo(() => {
        return Array.from({ length: 50 }).map(() => ({
            position: [
                (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 20
            ],
            rotation: [
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            ],
            scale: Math.random() * 0.5 + 0.2,
            // Target position for forming the envelope (Scene 2)
            targetPos: [
                (Math.random() - 0.5) * 3, // Envelope width
                (Math.random() - 0.5) * 2, // Envelope height
                (Math.random() - 0.5) * 0.5 // Envelope depth (thin flat shape)
            ],
            targetRot: [0, 0, 0] // Align to form flat shape
        }));
    }, []);

    const meshRefs = useRef([]);

    useFrame((state) => {
        const progress = scrollProgressRef.current;

        // progress is 0 at the start (Scene 1)
        // progress is ~0.33 when approaching Scene 2
        // progress is ~0.66 at Scene 3 (Burst)
        // progress is 1 at Scene 4 (Button)

        // Scene 1 -> 2: Interpolate fragments towards their target envelope positions
        const envelopeProgress = Math.min(Math.max((progress - 0.1) * 3, 0), 1); // 0 to 1 between 10% and 43%

        // Scene 2 -> 3: Burst the fragments outward violently
        const burstProgress = Math.min(Math.max((progress - 0.6) * 4, 0), 1);

        meshRefs.current.forEach((mesh, index) => {
            if (!mesh) return;
            const data = fragments[index];

            // Floating offset
            const time = state.clock.getElapsedTime();
            const floatY = Math.sin(time + index * 10) * 0.5 * (1 - envelopeProgress);

            // Position calculation
            const currentPosX = THREE.MathUtils.lerp(data.position[0], data.targetPos[0], envelopeProgress);
            const currentPosY = THREE.MathUtils.lerp(data.position[1], data.targetPos[1], envelopeProgress) + floatY;
            const currentPosZ = THREE.MathUtils.lerp(data.position[2], data.targetPos[2], envelopeProgress);

            // Burst offset (explode outward)
            const burstFactor = burstProgress * 15;
            const dirX = data.position[0] > 0 ? 1 : -1;
            const dirY = data.position[1] > 0 ? 1 : -1;
            const dirZ = data.position[2] > 0 ? 1 : -1;

            mesh.position.set(
                currentPosX + dirX * burstFactor,
                currentPosY + dirY * burstFactor,
                currentPosZ + dirZ * burstFactor
            );

            // Rotation calculation
            mesh.rotation.x = THREE.MathUtils.lerp(data.rotation[0], data.targetRot[0], envelopeProgress);
            mesh.rotation.y = THREE.MathUtils.lerp(data.rotation[1], data.targetRot[1], envelopeProgress);
            mesh.rotation.z = THREE.MathUtils.lerp(data.rotation[2] + time * 0.5 * (1 - envelopeProgress), data.targetRot[2], envelopeProgress);

            // Add extra spin during burst
            if (burstProgress > 0) {
                mesh.rotation.x += time * 2;
                mesh.rotation.y += time * 2;
            }
        });

        // Fade out group based on burst progress
        if (groupRef.current) {
            // We can't easily fade MeshTransmissionMaterial, but we can scale it down to 0
            groupRef.current.scale.setScalar(1 - burstProgress);
        }
    });

    return (
        <group ref={groupRef}>
            {fragments.map((data, i) => (
                <mesh
                    key={i}
                    ref={(el) => (meshRefs.current[i] = el)}
                    castShadow
                    receiveShadow
                >
                    <tetrahedronGeometry args={[data.scale, 0]} />
                    {/* Using drei's awesome glass material */}
                    <MeshTransmissionMaterial
                        backside
                        samples={4}
                        thickness={2}
                        chromaticAberration={0.5}
                        anisotropy={0.1}
                        distortion={0.5}
                        distortionScale={0.5}
                        temporalDistortion={0.1}
                        iridescence={1}
                        iridescenceIOR={1}
                        iridescenceThicknessRange={[0, 1400]}
                        color="#a8d5e5"
                    />
                </mesh>
            ))}
        </group>
    );
}

// Creates the glowing core that forms in Scene 3
function GlowingCore({ scrollProgressRef }) {
    const coreRef = useRef();
    const materialRef = useRef();

    useFrame((state) => {
        if (!coreRef.current || !materialRef.current) return;

        const progress = scrollProgressRef.current;
        // Core starts appearing at ~0.6 (Scene 3)
        const appearProgress = Math.min(Math.max((progress - 0.55) * 4, 0), 1);

        coreRef.current.scale.setScalar(appearProgress * 2);

        // Rotate slowly
        coreRef.current.rotation.y = state.clock.getElapsedTime() * 0.5;
        coreRef.current.rotation.z = state.clock.getElapsedTime() * 0.2;

        // Pulse effect
        const pulse = Math.sin(state.clock.getElapsedTime() * 2) * 0.2 + 0.8;
        materialRef.current.emissiveIntensity = pulse * appearProgress * 2;
    });

    return (
        <mesh ref={coreRef}>
            <icosahedronGeometry args={[1, 2]} />
            <meshStandardMaterial
                ref={materialRef}
                color="#fff"
                emissive="#f39c12"
                emissiveIntensity={0}
                toneMapped={false}
            />
        </mesh>
    );
}

export default function SceneManager() {
    const { camera, scene } = useThree();
    const scrollProgressRef = useRef(0);
    const ambientLightRef = useRef();
    const spotlightRef = useRef();

    // Setup GSAP scroll trigger to update progress
    useLayoutEffect(() => {
        // We bind a timeline to the window scroll over the height of our overlay
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: ".overlay-container",
                start: "top top",
                end: "bottom bottom",
                scrub: 1, // Smooth scrubbing
                onUpdate: (self) => {
                    scrollProgressRef.current = self.progress;

                    // Toggle interactivity of the canvas for the button at the very end
                    const canvasContainer = document.querySelector('.canvas-container');
                    if (self.progress > 0.95) {
                        canvasContainer.classList.add('interactive');
                    } else {
                        canvasContainer.classList.remove('interactive');
                    }
                },
            }
        });

        // Camera animation path
        tl.to(camera.position, {
            z: 5,
            ease: "power2.inOut"
        }, 0)
            .to(camera.position, {
                z: 8,
                ease: "power2.inOut"
            }, 0.5)
            .to(camera.position, {
                z: 6,
                ease: "power2.inOut" // Final position
            }, 0.8);

        return () => tl.kill();
    }, [camera]);

    useFrame(() => {
        const progress = scrollProgressRef.current;

        // Lighting transition (Cool to Warm)
        if (ambientLightRef.current && spotlightRef.current) {
            // Cold start
            const coldColor = new THREE.Color("#1a2b4c");
            // Warm end
            const warmColor = new THREE.Color("#f39c12");

            // Let's transition lighting starting around Scene 3 (progress ~0.6)
            const lightTransition = Math.min(Math.max((progress - 0.5) * 2, 0), 1);

            const currentColor = new THREE.Color().lerpColors(coldColor, warmColor, lightTransition);

            ambientLightRef.current.color = currentColor;
            spotlightRef.current.color = currentColor;

            // Increase intensity dramatically at Scene 3 burst
            const burstPulse = Math.min(Math.max((progress - 0.55) * 5, 0), 1);
            const falloff = Math.max(1 - Math.max((progress - 0.7) * 5, 0), 0); // Fades back down a bit

            spotlightRef.current.intensity = 5 + (burstPulse * falloff * 50); // Massive flash then settles
        }
    });

    return (
        <>
            <color attach="background" args={['#05050a']} />

            {/* Lighting */}
            <ambientLight ref={ambientLightRef} intensity={1.5} color="#1a2b4c" />
            <spotLight
                ref={spotlightRef}
                position={[0, 5, 10]}
                angle={0.5}
                penumbra={1}
                intensity={5}
                color="#4a90e2"
                castShadow
            />

            <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
                <Fragments scrollProgressRef={scrollProgressRef} />
                <GlowingCore scrollProgressRef={scrollProgressRef} />
            </Float>

            {/* Button for final scene using Drei's HTML or 3D Text, but for now we'll do a simple React-based 3D mesh wrapper 
          Wait, Drei's 'Html' component is perfect for an interactive button that overlays exactly. */}
            {/* To implement, we will add an interactive button inside the canvas or in the HTML overlay later. */}

            {/* Environment maps make glass look stunning */}
            <Environment preset="city" />
            <ContactShadows position={[0, -3, 0]} opacity={0.4} scale={20} blur={2} />
        </>
    );
}
