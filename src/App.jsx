import React, { useEffect, useRef, useLayoutEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import SceneManager from './components/SceneManager';
import './index.css';

gsap.registerPlugin(ScrollTrigger);

function App() {
  const overlayRef = useRef(null);

  useLayoutEffect(() => {
    // Setup fade-in/fade-out for text sections
    const sections = gsap.utils.toArray('.scene-section');

    sections.forEach((section, i) => {
      // Don't fade in the first section, it starts visible
      if (i > 0) {
        gsap.fromTo(section,
          { opacity: 0, y: 50 },
          {
            opacity: 1,
            y: 0,
            duration: 1,
            scrollTrigger: {
              trigger: section,
              start: "top 70%",
              end: "center center",
              scrub: 1,
            }
          }
        );
      }

      // Fade out when scrolling past
      if (i < sections.length - 1) {
        gsap.to(section, {
          opacity: 0,
          y: -50,
          scrollTrigger: {
            trigger: section,
            start: "bottom 60%",
            end: "bottom 20%",
            scrub: 1,
          }
        });
      }
    });

    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  return (
    <>
      {/* 3D Background - Fixed position */}
      <div className="canvas-container">
        <Canvas camera={{ position: [0, 0, 10], fov: 45 }} dpr={[1, 2]}>
          <SceneManager />
        </Canvas>
      </div>

      {/* Scrolling Content Overlay */}
      <div className="overlay-container" ref={overlayRef}>
        <section className="scene-section scene-1">
          <h2 className="scene-text">So... we said bye.</h2>
          <p className="sub-text">Scroll forward</p>
        </section>

        <section className="scene-section scene-2">
          <h2 className="scene-text">But what's the point of this silence?</h2>
          <h2 className="scene-text">What's the point of not planning our next move?</h2>
        </section>

        <section className="scene-section scene-3">
          <h2 className="scene-text">There is no point in not talking to you.</h2>
          <p className="sub-text">Not when I promised to love you and be there for you, no matter what.</p>
          <p className="sub-text">And promises aren't meant to be broken.</p>
        </section>

        <section className="scene-section scene-4">
          {/* Fallback button in HTML just in case 3D Html breaks */}
          <div className="action-button-container" id="truce-btn-container" style={{ opacity: 0, pointerEvents: 'none', transition: 'opacity 0.5s ease' }}>
            <button
              className="action-button"
              onClick={() => {
                alert("Redirecting to WhatsApp...");
                window.location.href = "https://wa.me/?text=Truce";
              }}
            >
              Truce?
            </button>
          </div>
        </section>
      </div>
    </>
  );
}

export default App;
