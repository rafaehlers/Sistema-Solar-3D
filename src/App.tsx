import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Sun, Play, Pause, FastForward, Info, X, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PlanetData {
  name: string;
  color: string;
  size: number;
  distance: number;
  speed: number;
  description: string;
  textureUrl?: string;
  hasRings?: boolean;
}

const PLANETS: PlanetData[] = [
  { 
    name: 'Mercúrio', 
    color: '#A5A5A5', 
    size: 0.8, 
    distance: 15, 
    speed: 0.04, 
    description: 'O menor planeta e o mais próximo do Sol.',
    textureUrl: 'https://picsum.photos/seed/mercury_surface/512/512'
  },
  { 
    name: 'Vênus', 
    color: '#E3BB76', 
    size: 1.2, 
    distance: 22, 
    speed: 0.015, 
    description: 'O planeta mais quente do sistema solar.',
    textureUrl: 'https://picsum.photos/seed/venus_clouds/512/512'
  },
  { 
    name: 'Terra', 
    color: '#2271B3', 
    size: 1.3, 
    distance: 30, 
    speed: 0.01, 
    description: 'Nosso lar, o único planeta conhecido com vida.',
    textureUrl: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg'
  },
  { 
    name: 'Marte', 
    color: '#E27B58', 
    size: 1.0, 
    distance: 38, 
    speed: 0.008, 
    description: 'O planeta vermelho, alvo de futuras explorações.',
    textureUrl: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/mars_1k_color.jpg'
  },
  { 
    name: 'Júpiter', 
    color: '#D39C7E', 
    size: 2.5, 
    distance: 55, 
    speed: 0.004, 
    description: 'O maior planeta, um gigante gasoso.',
    textureUrl: 'https://picsum.photos/seed/jupiter_gas/512/512'
  },
  { 
    name: 'Saturno', 
    color: '#C5AB6E', 
    size: 2.1, 
    distance: 75, 
    speed: 0.002, 
    description: 'Famoso por seus impressionantes anéis.',
    textureUrl: 'https://picsum.photos/seed/saturn_gas/512/512',
    hasRings: true
  },
  { 
    name: 'Urano', 
    color: '#B5E3E3', 
    size: 1.7, 
    distance: 95, 
    speed: 0.001, 
    description: 'Um gigante de gelo com rotação inclinada.',
    textureUrl: 'https://picsum.photos/seed/uranus_gas/512/512'
  },
  { 
    name: 'Netuno', 
    color: '#6081FF', 
    size: 1.7, 
    distance: 115, 
    speed: 0.0008, 
    description: 'O planeta mais distante e ventoso.',
    textureUrl: 'https://picsum.photos/seed/neptune_gas/512/512'
  },
];

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [timeSpeed, setTimeSpeed] = useState(1);
  const [gravity, setGravity] = useState(1);
  const [showStars, setShowStars] = useState(true);
  const [showOrbits, setShowOrbits] = useState(true);
  const [showGrid, setShowGrid] = useState(false);
  const [gridAlpha, setGridAlpha] = useState(0.2);
  const [gridDivisions, setGridDivisions] = useState(12);
  const [selectedPlanet, setSelectedPlanet] = useState<PlanetData | null>(null);
  
  const sceneRef = useRef<THREE.Scene | null>(null);
  const gridRef = useRef<THREE.LineSegments | null>(null);
  const gridMaterialRef = useRef<THREE.ShaderMaterial | null>(null);
  const timeSpeedRef = useRef(1);
  const gravityRef = useRef(1);
  const showStarsRef = useRef(true);
  const showOrbitsRef = useRef(true);
  const showGridRef = useRef(false);
  const gridAlphaRef = useRef(0.2);
  const currentDistancesRef = useRef<number[]>(PLANETS.map(p => p.distance));
  const anglesRef = useRef<number[]>(PLANETS.map(() => Math.random() * Math.PI * 2));

  useEffect(() => {
    timeSpeedRef.current = timeSpeed;
    gravityRef.current = gravity;
    showStarsRef.current = showStars;
    showOrbitsRef.current = showOrbits;
    showGridRef.current = showGrid;
    gridAlphaRef.current = gridAlpha;
  }, [timeSpeed, gravity, showStars, showOrbits, showGrid, gridAlpha]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x000000);
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 3000);
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: "high-performance"
    });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // Ensure the canvas is correctly positioned
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.zIndex = '0';
    renderer.domElement.style.pointerEvents = 'auto';
    
    containerRef.current.appendChild(renderer.domElement);

    // Controls - Attach to the renderer's domElement
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 10;
    controls.maxDistance = 1000;
    
    // Ensure the canvas can receive events
    renderer.domElement.style.touchAction = 'none';
    renderer.domElement.style.pointerEvents = 'auto';

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 3);
    scene.add(ambientLight);

    const sunLight = new THREE.PointLight(0xffffff, 2000, 1000);
    sunLight.position.set(0, 0, 0);
    scene.add(sunLight);

    // Stars background
    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.7, sizeAttenuation: true, transparent: true });
    const starVertices = [];
    for (let i = 0; i < 15000; i++) {
      const x = (Math.random() - 0.5) * 4000;
      const y = (Math.random() - 0.5) * 4000;
      const z = (Math.random() - 0.5) * 4000;
      starVertices.push(x, y, z);
    }
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    // Space-Time Grid Shader Material
    const gridVertexShader = `
      uniform vec3 uMassCenters[9];
      uniform float uMassRadii[9];
      uniform float uDistortionStrength;
      uniform float uGridAlpha;
      varying float vAlpha;

      void main() {
        vec3 pos = position;
        vec3 totalDisplacement = vec3(0.0);
        
        for(int i = 0; i < 9; i++) {
          vec3 massPos = uMassCenters[i];
          float radius = uMassRadii[i];
          vec3 dir = massPos - position;
          float dist = length(dir);
          
          if (dist > 0.1) {
            // Non-linear strength to make 5.0G feel much more powerful
            float strength = (i == 0) ? pow(uDistortionStrength, 1.8) : uDistortionStrength;
            
            // Enhanced gravitational pull for 3D volumetric effect
            float massFactor = (i == 0) ? 40.0 : 8.0;
            float force = strength * (radius * massFactor) / (pow(dist, 1.1) + 2.0);
            
            // Limit displacement to prevent vertices from crossing the mass center
            float maxPull = dist * 0.98; 
            float actualPull = min(force, maxPull);
            
            totalDisplacement += normalize(dir) * actualPull;
          }
        }
        
        vec3 finalPos = position + totalDisplacement;
        
        // Fade out based on distance from center to avoid noise at edges
        float distFromCenter = length(finalPos);
        vAlpha = uGridAlpha * (1.0 - smoothstep(150.0, 300.0, distFromCenter));

        gl_Position = projectionMatrix * modelViewMatrix * vec4(finalPos, 1.0);
      }
    `;

    const gridFragmentShader = `
      varying float vAlpha;
      void main() {
        gl_FragColor = vec4(0.0, 0.8, 1.0, vAlpha);
      }
    `;

    const gridMaterial = new THREE.ShaderMaterial({
      vertexShader: gridVertexShader,
      fragmentShader: gridFragmentShader,
      uniforms: {
        uMassCenters: { value: new Array(9).fill(new THREE.Vector3()) },
        uMassRadii: { value: new Array(9).fill(0) },
        uDistortionStrength: { value: 1.0 },
        uGridAlpha: { value: 0.2 }
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    gridMaterialRef.current = gridMaterial;

    // Create 3D Grid Geometry
    const createGridGeometry = (size: number, divisions: number, subs: number) => {
      const positions = [];
      const step = size / divisions;
      const halfSize = size / 2;

      const addLine = (start: THREE.Vector3, end: THREE.Vector3) => {
        for (let i = 0; i < subs; i++) {
          const t1 = i / subs;
          const t2 = (i + 1) / subs;
          const p1 = new THREE.Vector3().lerpVectors(start, end, t1);
          const p2 = new THREE.Vector3().lerpVectors(start, end, t2);
          positions.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
        }
      };

      for (let i = 0; i <= divisions; i++) {
        for (let j = 0; j <= divisions; j++) {
          const a = i * step - halfSize;
          const b = j * step - halfSize;
          
          // X-axis lines
          addLine(new THREE.Vector3(-halfSize, a, b), new THREE.Vector3(halfSize, a, b));
          // Y-axis lines
          addLine(new THREE.Vector3(a, -halfSize, b), new THREE.Vector3(a, halfSize, b));
          // Z-axis lines
          addLine(new THREE.Vector3(a, b, -halfSize), new THREE.Vector3(a, b, halfSize));
        }
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      return geometry;
    };

    const updateGrid = (divisions: number) => {
      if (gridRef.current) {
        scene.remove(gridRef.current);
        gridRef.current.geometry.dispose();
      }
      const gridGeometry = createGridGeometry(300, divisions, 40);
      const spaceTimeGrid = new THREE.LineSegments(gridGeometry, gridMaterial);
      gridRef.current = spaceTimeGrid;
      scene.add(spaceTimeGrid);
    };

    updateGrid(gridDivisions);

    // Texture Loader
    const textureLoader = new THREE.TextureLoader();

    // Sun
    const sunGeometry = new THREE.SphereGeometry(6, 64, 64);
    const sunTexture = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/sun.jpg');
    const sunMaterial = new THREE.MeshStandardMaterial({
      emissive: 0xffaa00,
      emissiveIntensity: 5,
      color: 0xffcc00,
      map: sunTexture
    });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    scene.add(sun);

    // Planets
    const planetMeshes: THREE.Mesh[] = [];
    const orbitLines: THREE.Line[] = [];

    PLANETS.forEach((data) => {
      // Planet
      const geometry = new THREE.SphereGeometry(data.size, 32, 32);
      const planetTexture = data.textureUrl ? textureLoader.load(data.textureUrl) : null;
      const material = new THREE.MeshStandardMaterial({ 
        color: data.color, 
        roughness: 0.8,
        metalness: 0.2,
        map: planetTexture
      });
      const mesh = new THREE.Mesh(geometry, material);
      
      // Saturn's Rings
      if (data.hasRings) {
        const ringGeometry = new THREE.RingGeometry(data.size * 1.4, data.size * 2.2, 64);
        const ringTexture = textureLoader.load('https://picsum.photos/seed/saturn_ring/512/512');
        const ringMaterial = new THREE.MeshStandardMaterial({
          color: data.color,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.7,
          map: ringTexture
        });
        const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
        ringMesh.rotation.x = Math.PI / 2;
        mesh.add(ringMesh);
      }
      
      // Initial position
      const angle = Math.random() * Math.PI * 2;
      mesh.position.x = Math.cos(angle) * data.distance;
      mesh.position.z = Math.sin(angle) * data.distance;
      
      scene.add(mesh);
      planetMeshes.push(mesh);

      // Orbit line
      const orbitGeometry = new THREE.BufferGeometry();
      const points = [];
      const segments = 128;
      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        points.push(new THREE.Vector3(Math.cos(theta) * data.distance, 0, Math.sin(theta) * data.distance));
      }
      orbitGeometry.setFromPoints(points);
      const orbitMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.15 });
      const orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);
      scene.add(orbitLine);
      orbitLines.push(orbitLine);
    });

    camera.position.set(0, 120, 180);
    controls.update();

    // Animation
    let frameId: number;

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      
      const speedMultiplier = timeSpeedRef.current;
      const gravityMultiplier = gravityRef.current;

      // Update visibility based on refs
      if (stars) {
        stars.visible = showStarsRef.current;
      }
      
      orbitLines.forEach(line => {
        line.visible = showOrbitsRef.current;
      });

      planetMeshes.forEach((mesh, i) => {
        const data = PLANETS[i];
        
        // Cumulative gravity effect: planets spiral in/out based on gravity setting
        // If gravity > 1, they spiral in. If gravity < 1, they drift out.
        const decayRate = (gravityMultiplier - 1) * 0.002 * speedMultiplier;
        currentDistancesRef.current[i] -= decayRate;
        
        // Ensure distance doesn't become negative
        if (currentDistancesRef.current[i] < 0) currentDistancesRef.current[i] = 0;
        
        const effectiveDistance = currentDistancesRef.current[i];

        // Merging logic: if planet enters the sun (radius 6), it gets consumed
        if (effectiveDistance < 6) {
          mesh.visible = false;
          // Stop updating position to save cycles, effectively "merged"
          mesh.position.set(0, 0, 0);
        } else {
          mesh.visible = true;
          // Adjust speed based on current distance and gravity (Kepler's laws approximation)
          // As they get closer and gravity is higher, they must move much faster
          const speedFactor = Math.sqrt(gravityMultiplier * (data.distance / Math.max(0.1, effectiveDistance)));
          const effectiveSpeed = data.speed * speedMultiplier * speedFactor;

          // Base speed halved as requested (0.25 instead of 0.5)
          anglesRef.current[i] += effectiveSpeed * 0.25;
          mesh.position.x = Math.cos(anglesRef.current[i]) * effectiveDistance;
          mesh.position.z = Math.sin(anglesRef.current[i]) * effectiveDistance;
          mesh.rotation.y += 0.01;
        }

        // Orbit lines remain fixed at their original positions to show deviation
        // Removed the scaling logic
      });

      // Update Space-Time Grid Uniforms
      if (gridRef.current && gridMaterialRef.current) {
        gridRef.current.visible = showGridRef.current;
        gridMaterialRef.current.uniforms.uGridAlpha.value = gridAlphaRef.current;
        gridMaterialRef.current.uniforms.uDistortionStrength.value = gravityMultiplier;
        
        const centers = [sun.position.clone()];
        const radii = [6.0]; // Sun radius
        
        planetMeshes.forEach((mesh, i) => {
          centers.push(mesh.position.clone());
          radii.push(PLANETS[i].size);
        });
        
        gridMaterialRef.current.uniforms.uMassCenters.value = centers;
        gridMaterialRef.current.uniforms.uMassRadii.value = radii;
      }

      sun.rotation.y += 0.001;
      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // Resize handler
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(frameId);
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      // Cleanup
      sunGeometry.dispose();
      sunMaterial.dispose();
      planetMeshes.forEach(m => {
        m.geometry.dispose();
        (m.material as THREE.Material).dispose();
      });
      orbitLines.forEach(l => {
        l.geometry.dispose();
        (l.material as THREE.Material).dispose();
      });
      starGeometry.dispose();
      starMaterial.dispose();
      if (gridRef.current) {
        gridRef.current.geometry.dispose();
      }
      if (gridMaterialRef.current) {
        gridMaterialRef.current.dispose();
      }
      renderer.dispose();
      controls.dispose();
    };
  }, []);

  useEffect(() => {
    if (!sceneRef.current || !gridMaterialRef.current) return;

    const createGridGeometry = (size: number, divisions: number, subs: number) => {
      const positions = [];
      const step = size / divisions;
      const halfSize = size / 2;

      const addLine = (start: THREE.Vector3, end: THREE.Vector3) => {
        for (let i = 0; i < subs; i++) {
          const t1 = i / subs;
          const t2 = (i + 1) / subs;
          const p1 = new THREE.Vector3().lerpVectors(start, end, t1);
          const p2 = new THREE.Vector3().lerpVectors(start, end, t2);
          positions.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
        }
      };

      for (let i = 0; i <= divisions; i++) {
        for (let j = 0; j <= divisions; j++) {
          const a = i * step - halfSize;
          const b = j * step - halfSize;
          addLine(new THREE.Vector3(-halfSize, a, b), new THREE.Vector3(halfSize, a, b));
          addLine(new THREE.Vector3(a, -halfSize, b), new THREE.Vector3(a, halfSize, b));
          addLine(new THREE.Vector3(a, b, -halfSize), new THREE.Vector3(a, b, halfSize));
        }
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      return geometry;
    };

    if (gridRef.current) {
      sceneRef.current.remove(gridRef.current);
      gridRef.current.geometry.dispose();
    }

    const newGeometry = createGridGeometry(300, gridDivisions, 40);
    const newGrid = new THREE.LineSegments(newGeometry, gridMaterialRef.current);
    gridRef.current = newGrid;
    sceneRef.current.add(newGrid);
  }, [gridDivisions]);

  const handleSpeedChange = (val: number) => {
    setTimeSpeed(val);
    timeSpeedRef.current = val;
  };

  return (
    <div className="relative w-full h-full font-sans text-white overflow-hidden bg-black">
      {/* Three.js Container - Bottom Layer */}
      <div 
        ref={containerRef} 
        className="absolute inset-0 z-0"
        style={{ pointerEvents: 'auto' }}
      />

      {/* UI Elements - Separate Absolute Containers */}
      
      {/* Top Left: Title */}
      <div className="absolute top-6 left-6 z-10 pointer-events-none">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-black/40 backdrop-blur-md border border-white/10 p-4 rounded-2xl pointer-events-auto"
        >
          <div className="flex items-center gap-3 mb-1">
            <Sun className="w-6 h-6 text-yellow-400 animate-pulse" />
            <h1 className="text-xl font-bold tracking-tight">Sistema Solar 3D</h1>
          </div>
          <p className="text-xs text-white/60">Simulação interativa com Three.js</p>
        </motion.div>
      </div>

      {/* Top Right: Planet Selection */}
      <div className="absolute top-6 right-6 z-10 pointer-events-none flex flex-col gap-2 items-end">
        {PLANETS.map((p) => (
          <button
            key={p.name}
            onClick={() => setSelectedPlanet(p)}
            className="pointer-events-auto px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-sm border border-white/5 text-xs hover:bg-white/10 transition-colors"
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* Center Bottom: Planet Details (Conditional) */}
      <div className="absolute bottom-40 left-1/2 -translate-x-1/2 z-20 pointer-events-none w-full max-w-sm px-6">
        <AnimatePresence>
          {selectedPlanet && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-black/60 backdrop-blur-xl border border-white/20 p-6 rounded-3xl pointer-events-auto relative"
            >
              <button 
                onClick={() => setSelectedPlanet(null)}
                className="absolute top-4 right-4 text-white/40 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: selectedPlanet.color }} />
                <h2 className="text-2xl font-bold">{selectedPlanet.name}</h2>
              </div>
              <p className="text-sm text-white/80 leading-relaxed mb-4">
                {selectedPlanet.description}
              </p>
              <div className="grid grid-cols-2 gap-4 text-[10px] uppercase tracking-widest text-white/40">
                <div>
                  <div className="mb-1">Tamanho Relativo</div>
                  <div className="text-white text-sm font-mono">{selectedPlanet.size}x</div>
                </div>
                <div>
                  <div className="mb-1">Distância Orbital</div>
                  <div className="text-white text-sm font-mono">{selectedPlanet.distance} UA</div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom: Controls Panel */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 pointer-events-none w-full max-w-2xl px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black/40 backdrop-blur-md border border-white/10 p-6 rounded-3xl pointer-events-auto grid grid-cols-1 md:grid-cols-2 gap-8"
        >
          {/* Time & Gravity Controls */}
          <div className="space-y-6">
            {/* Time Speed */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FastForward className="w-4 h-4 text-white/60" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Velocidade do Tempo</span>
                </div>
                <span className="text-xs font-mono bg-white/10 px-2 py-0.5 rounded-md">
                  {timeSpeed.toFixed(0)}x
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={timeSpeed}
                onInput={(e) => setTimeSpeed(parseFloat(e.currentTarget.value))}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-yellow-400"
              />
            </div>

            {/* Gravity */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sun className="w-4 h-4 text-orange-400" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Gravidade do Sol</span>
                </div>
                <span className="text-xs font-mono bg-white/10 px-2 py-0.5 rounded-md">
                  {gravity.toFixed(1)}G
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="5"
                step="0.1"
                value={gravity}
                onInput={(e) => setGravity(parseFloat(e.currentTarget.value))}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
            </div>
          </div>

          {/* Visibility Toggles */}
          <div className="flex flex-col justify-center gap-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Mostrar Estrelas</span>
              <button 
                onClick={() => setShowStars(!showStars)}
                className={`w-10 h-5 rounded-full transition-colors relative ${showStars ? 'bg-emerald-500' : 'bg-white/10'}`}
              >
                <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${showStars ? 'left-6' : 'left-1'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Mostrar Órbitas</span>
              <button 
                onClick={() => setShowOrbits(!showOrbits)}
                className={`w-10 h-5 rounded-full transition-colors relative ${showOrbits ? 'bg-emerald-500' : 'bg-white/10'}`}
              >
                <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${showOrbits ? 'left-6' : 'left-1'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Malha Espaço-Tempo</span>
              <button 
                onClick={() => setShowGrid(!showGrid)}
                className={`w-10 h-5 rounded-full transition-colors relative ${showGrid ? 'bg-cyan-500' : 'bg-white/10'}`}
              >
                <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${showGrid ? 'left-6' : 'left-1'}`} />
              </button>
            </div>

            {showGrid && (
              <div className="space-y-4 mt-2">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[8px] font-bold uppercase tracking-widest text-white/40">Alpha da Malha</span>
                    <span className="text-[8px] font-mono text-white/40">{gridAlpha.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.01"
                    max="0.8"
                    step="0.01"
                    value={gridAlpha}
                    onInput={(e) => setGridAlpha(parseFloat(e.currentTarget.value))}
                    className="w-full h-0.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[8px] font-bold uppercase tracking-widest text-white/40">Resolução (Divisões)</span>
                    <span className="text-[8px] font-mono text-white/40">{gridDivisions}x{gridDivisions}</span>
                  </div>
                  <input
                    type="range"
                    min="4"
                    max="32"
                    step="2"
                    value={gridDivisions}
                    onInput={(e) => setGridDivisions(parseInt(e.currentTarget.value))}
                    className="w-full h-0.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                </div>
              </div>
            )}
            
            <div className="flex justify-between mt-2">
              <button 
                onClick={() => setTimeSpeed(0)}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                title="Pausar"
              >
                <Pause className="w-4 h-4" />
              </button>
              <button 
                onClick={() => { 
                  setTimeSpeed(1); 
                  setGravity(1); 
                  setShowGrid(false);
                  setGridAlpha(0.2);
                  setGridDivisions(12);
                  setShowStars(true);
                  setShowOrbits(true);
                  setSelectedPlanet(null);
                  currentDistancesRef.current = PLANETS.map(p => p.distance);
                  anglesRef.current = PLANETS.map(() => Math.random() * Math.PI * 2);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-[10px] font-bold uppercase tracking-widest"
                title="Resetar Tudo"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Resetar Simulação</span>
              </button>
              <button 
                onClick={() => setTimeSpeed(100)}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                title="Máxima Velocidade"
              >
                <span className="text-[8px] font-black">MAX</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom Left: Info */}
      <div className="absolute bottom-6 left-6 z-10 pointer-events-none opacity-40 hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest">
          <Info className="w-3 h-3" />
          <span>Arraste para girar • Scroll para zoom</span>
        </div>
      </div>
    </div>
  );
}
