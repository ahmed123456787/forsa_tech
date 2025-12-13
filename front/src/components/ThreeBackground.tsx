import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export function ThreeBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animationIdRef = useRef<number>(0);
  const particlesRef = useRef<THREE.Points | null>(null);
  const geometryShapesRef = useRef<THREE.Mesh[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 30;
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true 
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Colors - AT brand colors
    const primaryColor = new THREE.Color(0x00a959); // AT Green
    const secondaryColor = new THREE.Color(0x2c5eaa); // AT Blue

    // Create floating particles
    const particleCount = 500;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 100;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 100;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 50;

      // Mix between green and blue
      const mixFactor = Math.random();
      const color = primaryColor.clone().lerp(secondaryColor, mixFactor);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.15,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);
    particlesRef.current = particles;

    // Create floating geometric shapes
    const shapes: THREE.Mesh[] = [];
    
    // Icosahedrons (gem-like shapes)
    for (let i = 0; i < 8; i++) {
      const geometry = new THREE.IcosahedronGeometry(Math.random() * 1.5 + 0.5, 0);
      const material = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? primaryColor : secondaryColor,
        wireframe: true,
        transparent: true,
        opacity: 0.3,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(
        (Math.random() - 0.5) * 60,
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 20
      );
      mesh.userData = {
        rotationSpeed: { 
          x: (Math.random() - 0.5) * 0.01, 
          y: (Math.random() - 0.5) * 0.01 
        },
        floatSpeed: Math.random() * 0.5 + 0.5,
        floatOffset: Math.random() * Math.PI * 2,
        originalY: mesh.position.y,
      };
      scene.add(mesh);
      shapes.push(mesh);
    }

    // Torus (ring shapes)
    for (let i = 0; i < 5; i++) {
      const geometry = new THREE.TorusGeometry(
        Math.random() * 2 + 1,
        0.1,
        16,
        100
      );
      const material = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? secondaryColor : primaryColor,
        wireframe: true,
        transparent: true,
        opacity: 0.25,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(
        (Math.random() - 0.5) * 70,
        (Math.random() - 0.5) * 50,
        (Math.random() - 0.5) * 30 - 10
      );
      mesh.userData = {
        rotationSpeed: { 
          x: (Math.random() - 0.5) * 0.008, 
          y: (Math.random() - 0.5) * 0.015 
        },
        floatSpeed: Math.random() * 0.3 + 0.3,
        floatOffset: Math.random() * Math.PI * 2,
        originalY: mesh.position.y,
      };
      scene.add(mesh);
      shapes.push(mesh);
    }

    // Octahedrons
    for (let i = 0; i < 6; i++) {
      const geometry = new THREE.OctahedronGeometry(Math.random() * 1 + 0.5);
      const material = new THREE.MeshBasicMaterial({
        color: primaryColor.clone().lerp(secondaryColor, Math.random()),
        wireframe: true,
        transparent: true,
        opacity: 0.35,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(
        (Math.random() - 0.5) * 50,
        (Math.random() - 0.5) * 35,
        (Math.random() - 0.5) * 25
      );
      mesh.userData = {
        rotationSpeed: { 
          x: (Math.random() - 0.5) * 0.012, 
          y: (Math.random() - 0.5) * 0.012 
        },
        floatSpeed: Math.random() * 0.4 + 0.4,
        floatOffset: Math.random() * Math.PI * 2,
        originalY: mesh.position.y,
      };
      scene.add(mesh);
      shapes.push(mesh);
    }

    geometryShapesRef.current = shapes;

    // Mouse move handler
    const handleMouseMove = (event: MouseEvent) => {
      mouseRef.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Animation loop
    const clock = new THREE.Clock();
    
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      
      const elapsedTime = clock.getElapsedTime();

      // Rotate and float particles
      if (particlesRef.current) {
        particlesRef.current.rotation.y = elapsedTime * 0.02;
        particlesRef.current.rotation.x = Math.sin(elapsedTime * 0.1) * 0.1;
      }

      // Animate geometric shapes
      geometryShapesRef.current.forEach((shape) => {
        const { rotationSpeed, floatSpeed, floatOffset, originalY } = shape.userData;
        
        // Rotation
        shape.rotation.x += rotationSpeed.x;
        shape.rotation.y += rotationSpeed.y;
        
        // Floating motion
        shape.position.y = originalY + Math.sin(elapsedTime * floatSpeed + floatOffset) * 2;
      });

      // Camera follows mouse slightly
      if (cameraRef.current) {
        cameraRef.current.position.x += (mouseRef.current.x * 3 - cameraRef.current.position.x) * 0.02;
        cameraRef.current.position.y += (mouseRef.current.y * 2 - cameraRef.current.position.y) * 0.02;
        cameraRef.current.lookAt(scene.position);
      }

      renderer.render(scene, camera);
    };
    
    animate();

    // Handle resize
    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current) return;
      
      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationIdRef.current);
      
      if (rendererRef.current && container) {
        container.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
      
      // Dispose geometries and materials
      particleGeometry.dispose();
      particleMaterial.dispose();
      geometryShapesRef.current.forEach((shape) => {
        shape.geometry.dispose();
        (shape.material as THREE.Material).dispose();
      });
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 z-0 pointer-events-none"
    />
  );
}
