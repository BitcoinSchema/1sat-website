"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function GlitchCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Setup Scene
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const renderer = new THREE.WebGLRenderer({ 
      alpha: true, 
      antialias: true,
      powerPreference: "high-performance"
    });
    
    const container = containerRef.current;
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for performance
    container.appendChild(renderer.domElement);

    // Geometry
    const geometry = new THREE.PlaneGeometry(2, 2);

    // Load Texture
    const loader = new THREE.TextureLoader();
    const texture = loader.load("/assets/404.jpeg", (tex) => {
      material.uniforms.uImageResolution.value.set(tex.image.width, tex.image.height);
    });
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;

    // Custom Glitch Shader
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uTexture: { value: texture },
        uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        uImageResolution: { value: new THREE.Vector2(1920, 1080) }, // Default assumption
        uMouse: { value: new THREE.Vector2(0.5, 0.5) },
        uGlitchIntensity: { value: 0.0 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform sampler2D uTexture;
        uniform vec2 uResolution;
        uniform vec2 uImageResolution;
        uniform vec2 uMouse;
        uniform float uGlitchIntensity;
        varying vec2 vUv;

        float rand(vec2 co){
            return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
        }

        void main() {
          // Aspect Ratio Fix
          float screenAspect = uResolution.x / uResolution.y;
          float imageAspect = uImageResolution.x / uImageResolution.y;
          vec2 scale = vec2(1.0);
          if (screenAspect > imageAspect) {
            scale.y = imageAspect / screenAspect;
          } else {
            scale.x = screenAspect / imageAspect;
          }
          vec2 uv = (vUv - 0.5) * scale + 0.5;

          // Time variables
          float t = uTime;
          
          // --- 1. Random "Uncommon" Glitch Spikes ---
          // Base intensity + spikes
          float glitchState = uGlitchIntensity;
          
          // Create random large spikes
          float spike = step(0.98, rand(vec2(floor(t * 10.0), 0.0))); // 2% chance per 0.1s
          glitchState += spike * 0.5; // Big jump

          // --- 2. Block Noise (Digital Tearing) ---
          float blockNoise = 0.0;
          if (glitchState > 0.1) {
             vec2 blockUV = floor(uv * 20.0); // 20x20 grid
             blockNoise = (rand(blockUV + t) - 0.5) * 2.0; // -1 to 1
             blockNoise *= step(0.8, abs(blockNoise)); // Only extreme values
          }

          // --- 3. Vertical Sync Loss (Y-Displacement) ---
          float yShift = 0.0;
          if (spike > 0.5) {
             yShift = (rand(vec2(t, 0.0)) - 0.5) * 0.2;
          }
          
          // --- 4. Horizontal RGB Split (Chromatic Aberration) ---
          // Split depends on glitch intensity + y-position noise
          float splitStrength = 0.005 + glitchState * 0.05;
          float xShift = (rand(vec2(uv.y * 100.0, t)) - 0.5) * splitStrength;
          
          // Apply displacements
          vec2 rUV = uv + vec2(xShift + blockNoise * 0.02, yShift);
          vec2 gUV = uv + vec2(-xShift, yShift);
          vec2 bUV = uv + vec2(0.0, yShift); // Blue often stays anchored

          // Texture lookup
          float r = texture2D(uTexture, rUV).r;
          float g = texture2D(uTexture, gUV).g;
          float b = texture2D(uTexture, bUV).b;

          // --- 5. Scanlines & Vignette ---
          float scanline = sin(uv.y * 800.0 + t * 5.0) * 0.05;
          float dist = distance(vUv, vec2(0.5));
          float vignette = smoothstep(0.8, 0.2, dist * (1.0 + glitchState * 0.2));

          // --- 6. Color Grading / Noise Overlay ---
          vec3 color = vec3(r, g, b);
          
          // Static noise
          float staticNoise = rand(uv * t) * 0.1 * glitchState;
          color += staticNoise;

          // Desaturate significantly on heavy glitches
          if (spike > 0.5) {
             float gray = dot(color, vec3(0.299, 0.587, 0.114));
             color = mix(color, vec3(gray), 0.8);
             color *= vec3(1.2, 0.9, 0.9); // Tint slightly red
          }

          gl_FragColor = vec4(color * vignette + scanline, 1.0);
        }
      `
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Animation Loop
    const clock = new THREE.Clock();
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();
      
      material.uniforms.uTime.value = elapsedTime;
      
      // Slowly decay intensity, allow mouse to boost it
      material.uniforms.uGlitchIntensity.value *= 0.92;
      if (material.uniforms.uGlitchIntensity.value < 0.001) material.uniforms.uGlitchIntensity.value = 0.0;

      renderer.render(scene, camera);
    };

    animate();

    // Event Listeners
    const handleResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      material.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
    };

    const handleMouseMove = (e: MouseEvent) => {
      material.uniforms.uMouse.value.set(
        e.clientX / window.innerWidth,
        1.0 - e.clientY / window.innerHeight
      );
      // Add slight glitch on fast movement?
      material.uniforms.uGlitchIntensity.value += 0.05;
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={containerRef} className="fixed inset-0 z-0" />;
}
