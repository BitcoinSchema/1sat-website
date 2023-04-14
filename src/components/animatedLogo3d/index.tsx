import { useEffect, useRef } from "react";
import * as THREE from "three";

interface Props {
  hover: boolean;
  boost: boolean;
}

const AnimatedLogo3D: React.FC<Props> = ({ boost, hover }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  // Create a scene and a camera
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);

  useEffect(() => {
    // Create a WebGLRenderer and append it to the container
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(400, 400);
    containerRef.current?.appendChild(renderer.domElement);

    // Create a cylinder geometry
    const geometry = new THREE.CylinderGeometry(5, 5, 1, 128);
    const geometry2 = new THREE.CylinderGeometry(4.5, 4.5, 1.1, 128);
    const geometry3 = new THREE.CylinderGeometry(3.5, 3.5, 1.2, 128);
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const material2 = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const material3 = new THREE.MeshBasicMaterial({ color: 0xf0bb00 });
    const cylinder = new THREE.Mesh(geometry, material);
    const cylinder2 = new THREE.Mesh(geometry2, material2);
    const cylinder3 = new THREE.Mesh(geometry3, material3);
    cylinder.position.y = 0;
    cylinder.rotation.x = 1;
    cylinder.rotation.z = 0;
    cylinder2.position.y = 0;
    cylinder2.rotation.x = 1;
    cylinder2.rotation.z = 0;
    cylinder3.position.y = 0;
    cylinder3.rotation.x = 1;
    cylinder3.rotation.z = 0;

    scene.add(cylinder);
    scene.add(cylinder2);
    scene.add(cylinder3);

    // Position the camera
    camera.position.set(0, 10, 15);

    // Point the camera to the center of the scene
    camera.lookAt(new THREE.Vector3(0, 0, 0));

    // Create an animation loop
    const animate = () => {
      requestAnimationFrame(animate);

      // Rotate the cylinder
      if (hover) {
        cylinder.rotation.z += boost ? 0.05 : 0.01;
        cylinder2.rotation.z += boost ? 0.05 : 0.01;
        cylinder3.rotation.z += boost ? 0.05 : 0.01;
      } else {
        cylinder.rotation.z += boost ? 0.05 : 0;
        cylinder2.rotation.z += boost ? 0.05 : 0;
        cylinder3.rotation.z += boost ? 0.05 : 0;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Clean up on unmount
    return () => {
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, [hover, boost]);

  return <div ref={containerRef}></div>;
};

export default AnimatedLogo3D;
