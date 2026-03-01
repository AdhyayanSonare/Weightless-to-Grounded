import { useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import SceneManager from './components/SceneManager';
import './index.css';

gsap.registerPlugin(ScrollTrigger);

function App() {
  const overlayRef = useRef(null);

  useEffect(() => {
    // Basic setup for fade-in animations of text as we scroll
    const sections = gsap.utils.toArray('.scene-section');
    
    sections.forEach((section) => {
      gsap.to(section, {
        opacity: 1,
        scrollTrigger: {
          trigger: section,
          start: "top center",
          end: "bottom center",
          scrub: true,
        }
      });
    });

    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  return (
    <>
      <div className="canvas-container interactive">
        <Canvas camera={{ position: [0, 0, 10], fov: 45 }}>
          <SceneManager />
        </Canvas>
      </div>

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
          {/* We will leave this section empty of text and render the 3D button in the Canvas,
              or we can render a HTML button here depending on requirements.
              The prompt says: "A single, floating, highly interactive 3D button appears in the center."
              We'll try to do it in Three.js for max immersion, but a HTML button is a solid fallback.
          */}
        </section>
      </div>
    </>
  );
}

export default App;
