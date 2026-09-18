(() => {
  const consoleElement = document.querySelector('[data-toolkit-console]');
  const canvas = consoleElement?.querySelector('[data-toolkit-canvas]');
  if (!consoleElement || !canvas) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let initialized = false;
  let visible = false;
  let frame = 0;

  const start = async () => {
    if (initialized) return;
    initialized = true;

    try {
      const THREE = await import('https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js');
      const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.08;

      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x0d0e10, 0.055);
      const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
      camera.position.set(0, 0, 4.8);

      const makeStudioEnvironment = () => {
        const environmentCanvas = document.createElement('canvas');
        environmentCanvas.width = 512;
        environmentCanvas.height = 256;
        const context = environmentCanvas.getContext('2d');
        if (!context) return;

        const baseGradient = context.createLinearGradient(0, 0, 0, environmentCanvas.height);
        baseGradient.addColorStop(0, '#061011');
        baseGradient.addColorStop(0.46, '#151d1e');
        baseGradient.addColorStop(0.54, '#0c1415');
        baseGradient.addColorStop(1, '#020506');
        context.fillStyle = baseGradient;
        context.fillRect(0, 0, environmentCanvas.width, environmentCanvas.height);

        const addSoftbox = (x, width, color, alpha) => {
          const gradient = context.createLinearGradient(x - width / 2, 0, x + width / 2, 0);
          gradient.addColorStop(0, `rgba(${color}, 0)`);
          gradient.addColorStop(0.5, `rgba(${color}, ${alpha})`);
          gradient.addColorStop(1, `rgba(${color}, 0)`);
          context.fillStyle = gradient;
          context.fillRect(x - width / 2, 0, width, environmentCanvas.height);
        };

        addSoftbox(72, 120, '126, 235, 214', 0.19);
        addSoftbox(250, 54, '240, 255, 250', 0.11);
        addSoftbox(442, 130, '93, 206, 187', 0.16);

        const environmentTexture = new THREE.CanvasTexture(environmentCanvas);
        environmentTexture.mapping = THREE.EquirectangularReflectionMapping;
        environmentTexture.colorSpace = THREE.SRGBColorSpace;
        const pmremGenerator = new THREE.PMREMGenerator(renderer);
        scene.environment = pmremGenerator.fromEquirectangular(environmentTexture).texture;
        environmentTexture.dispose();
        pmremGenerator.dispose();
      };

      const engine = new THREE.Group();
      scene.add(engine);
      scene.add(new THREE.HemisphereLight(0xd9fff6, 0x060809, 1.35));

      const keyLight = new THREE.PointLight(0x9bffe8, 4.5, 7);
      keyLight.position.set(1.7, 1.8, 3.1);
      scene.add(keyLight);
      const rimLight = new THREE.PointLight(0x1ebf9f, 2.6, 6);
      rimLight.position.set(-2.2, -1.2, 1.4);
      scene.add(rimLight);
      const edgeLight = new THREE.PointLight(0x6ff0d6, 1.15, 4.5);
      edgeLight.position.set(0.2, -0.6, -2.4);
      scene.add(edgeLight);

      const cameraRig = new THREE.Group();
      cameraRig.rotation.set(-0.08, 0.2, 0.02);
      engine.add(cameraRig);

      const roundedBoxShape = (width, height, radius) => {
        const shape = new THREE.Shape();
        const halfWidth = width / 2;
        const halfHeight = height / 2;
        shape.moveTo(-halfWidth + radius, -halfHeight);
        shape.lineTo(halfWidth - radius, -halfHeight);
        shape.quadraticCurveTo(halfWidth, -halfHeight, halfWidth, -halfHeight + radius);
        shape.lineTo(halfWidth, halfHeight - radius);
        shape.quadraticCurveTo(halfWidth, halfHeight, halfWidth - radius, halfHeight);
        shape.lineTo(-halfWidth + radius, halfHeight);
        shape.quadraticCurveTo(-halfWidth, halfHeight, -halfWidth, halfHeight - radius);
        shape.lineTo(-halfWidth, -halfHeight + radius);
        shape.quadraticCurveTo(-halfWidth, -halfHeight, -halfWidth + radius, -halfHeight);
        return shape;
      };

      const makeMicroTexture = (size = 128) => {
        const textureCanvas = document.createElement('canvas');
        textureCanvas.width = size;
        textureCanvas.height = size;
        const context = textureCanvas.getContext('2d');
        if (!context) return null;

        const imageData = context.createImageData(size, size);
        for (let y = 0; y < size; y += 1) {
          for (let x = 0; x < size; x += 1) {
            const index = (y * size + x) * 4;
            const grain = Math.sin(x * 1.73 + y * 0.71) * 10 + Math.sin(x * 0.37 - y * 1.31) * 6;
            const value = Math.max(75, Math.min(210, 142 + grain + (Math.random() - 0.5) * 22));
            imageData.data[index] = value;
            imageData.data[index + 1] = value;
            imageData.data[index + 2] = value;
            imageData.data[index + 3] = 255;
          }
        }
        context.putImageData(imageData, 0, 0);

        const texture = new THREE.CanvasTexture(textureCanvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(4, 4);
        texture.colorSpace = THREE.NoColorSpace;
        return texture;
      };

      makeStudioEnvironment();
      const microTexture = makeMicroTexture();

      const bodyWidth = 2.5;
      const bodyHeight = 1.42;
      const bodyDepth = 0.78;
      const cameraBodyGeometry = new THREE.ExtrudeGeometry(roundedBoxShape(bodyWidth, bodyHeight, 0.16), {
        depth: bodyDepth,
        bevelEnabled: true,
        bevelSegments: 5,
        bevelSize: 0.09,
        bevelThickness: 0.08,
        steps: 2,
      });
      cameraBodyGeometry.translate(0, 0, -bodyDepth / 2);

      const bodyMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x151a1b,
        emissive: 0x020606,
        emissiveIntensity: 0.22,
        metalness: 0.28,
        roughness: 0.42,
        roughnessMap: microTexture,
        bumpMap: microTexture,
        bumpScale: 0.014,
        clearcoat: 0.28,
        clearcoatRoughness: 0.3,
      });
      const cameraBody = new THREE.Mesh(cameraBodyGeometry, bodyMaterial);
      cameraRig.add(cameraBody);

      const bodyPanel = new THREE.Mesh(new THREE.BoxGeometry(bodyWidth - 0.2, bodyHeight - 0.2, 0.055), new THREE.MeshPhysicalMaterial({
        color: 0x0b0f10,
        emissive: 0x010303,
        emissiveIntensity: 0.16,
        metalness: 0.2,
        roughness: 0.54,
        roughnessMap: microTexture,
        bumpMap: microTexture,
        bumpScale: 0.01,
        clearcoat: 0.14,
        clearcoatRoughness: 0.42,
      }));
      bodyPanel.position.z = bodyDepth / 2 + 0.025;
      cameraRig.add(bodyPanel);

      const rubberMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x080d0e,
        emissive: 0x010303,
        metalness: 0.18,
        roughness: 0.72,
        roughnessMap: microTexture,
        bumpMap: microTexture,
        bumpScale: 0.036,
      });
      const accentMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x1f7164,
        emissive: 0x0b5b4e,
        emissiveIntensity: 0.16,
        metalness: 0.74,
        roughness: 0.28,
        clearcoat: 0.3,
        clearcoatRoughness: 0.22,
      });
      const lensTrimMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x202929,
        emissive: 0x010606,
        emissiveIntensity: 0.08,
        metalness: 0.78,
        roughness: 0.3,
        clearcoat: 0.24,
        clearcoatRoughness: 0.24,
      });
      const metalMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x7f9995,
        emissive: 0x0a4038,
        emissiveIntensity: 0.16,
        metalness: 0.82,
        roughness: 0.2,
        clearcoat: 0.38,
        clearcoatRoughness: 0.2,
      });
      const lensGlassMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x0c3b42,
        emissive: 0x041a20,
        emissiveIntensity: 0.34,
        metalness: 0.14,
        roughness: 0.1,
        clearcoat: 1,
        clearcoatRoughness: 0.06,
        reflectivity: 0.92,
      });

      const lensX = -0.2;
      const lensY = -0.06;
      const lensMount = new THREE.Mesh(new THREE.CylinderGeometry(0.57, 0.57, 0.2, 64), rubberMaterial);
      lensMount.rotation.x = Math.PI / 2;
      lensMount.position.set(lensX, lensY, 0.48);
      cameraRig.add(lensMount);

      const lensMountRing = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.032, 10, 64), lensTrimMaterial);
      lensMountRing.position.set(lensX, lensY, 0.61);
      cameraRig.add(lensMountRing);

      const lensBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.49, 0.34, 64), rubberMaterial);
      lensBarrel.rotation.x = Math.PI / 2;
      lensBarrel.position.set(lensX, lensY, 0.64);
      cameraRig.add(lensBarrel);

      for (let index = 0; index < 8; index += 1) {
        const focusRib = new THREE.Mesh(new THREE.TorusGeometry(0.456, 0.008, 6, 64), rubberMaterial);
        focusRib.position.set(lensX, lensY, 0.51 + index * 0.035);
        cameraRig.add(focusRib);
      }

      const lensBarrelRing = new THREE.Mesh(new THREE.TorusGeometry(0.44, 0.035, 10, 64), lensTrimMaterial);
      lensBarrelRing.position.set(lensX, lensY, 0.8);
      cameraRig.add(lensBarrelRing);

      const lensGlass = new THREE.Mesh(new THREE.CylinderGeometry(0.39, 0.39, 0.1, 64), lensGlassMaterial);
      lensGlass.rotation.x = Math.PI / 2;
      lensGlass.position.set(lensX, lensY, 0.84);
      cameraRig.add(lensGlass);

      const aperture = new THREE.Mesh(new THREE.CylinderGeometry(0.205, 0.205, 0.018, 48), new THREE.MeshPhysicalMaterial({
        color: 0x010405,
        metalness: 0.08,
        roughness: 0.22,
        clearcoat: 0.74,
        clearcoatRoughness: 0.18,
      }));
      aperture.rotation.x = Math.PI / 2;
      aperture.position.set(lensX, lensY, 0.907);
      cameraRig.add(aperture);

      const frontGlass = new THREE.Mesh(new THREE.CylinderGeometry(0.366, 0.366, 0.026, 64), new THREE.MeshPhysicalMaterial({
        color: 0x123a42,
        transparent: true,
        opacity: 0.76,
        metalness: 0.1,
        roughness: 0.08,
        transmission: 0.12,
        thickness: 0.04,
        ior: 1.46,
        clearcoat: 1,
        clearcoatRoughness: 0.04,
      }));
      frontGlass.rotation.x = Math.PI / 2;
      frontGlass.position.set(lensX, lensY, 0.927);
      cameraRig.add(frontGlass);

      const focusRing = new THREE.Mesh(new THREE.TorusGeometry(0.53, 0.012, 8, 64), new THREE.MeshBasicMaterial({
        color: 0x8ff6db,
        transparent: true,
        opacity: 0.42,
      }));
      focusRing.position.set(lensX, lensY, 0.89);
      cameraRig.add(focusRing);

      const lensInner = new THREE.Mesh(new THREE.TorusGeometry(0.245, 0.018, 8, 48), lensTrimMaterial);
      lensInner.position.set(lensX, lensY, 0.91);
      cameraRig.add(lensInner);

      const lensHighlight = new THREE.Mesh(new THREE.CircleGeometry(0.13, 32), new THREE.MeshBasicMaterial({
        color: 0xb8f0df,
        transparent: true,
        opacity: 0.42,
      }));
      lensHighlight.position.set(lensX - 0.12, lensY + 0.12, 0.915);
      cameraRig.add(lensHighlight);

      const lensHighlightSecondary = new THREE.Mesh(new THREE.CircleGeometry(0.07, 24), new THREE.MeshBasicMaterial({
        color: 0x5cbfe9,
        transparent: true,
        opacity: 0.22,
      }));
      lensHighlightSecondary.position.set(lensX + 0.15, lensY - 0.13, 0.944);
      cameraRig.add(lensHighlightSecondary);

      const topPlate = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.1, 0.46), rubberMaterial);
      topPlate.position.set(-0.02, 0.76, 0);
      cameraRig.add(topPlate);

      const prismShape = new THREE.Shape();
      prismShape.moveTo(-0.58, -0.18);
      prismShape.lineTo(0.42, -0.18);
      prismShape.lineTo(0.56, 0.03);
      prismShape.lineTo(0.35, 0.2);
      prismShape.lineTo(-0.34, 0.2);
      prismShape.lineTo(-0.56, 0.04);
      prismShape.closePath();
      const prismGeometry = new THREE.ExtrudeGeometry(prismShape, {
        depth: 0.5,
        bevelEnabled: true,
        bevelSegments: 4,
        bevelSize: 0.04,
        bevelThickness: 0.04,
        steps: 1,
      });
      prismGeometry.translate(0, 0, -0.25);
      const prism = new THREE.Mesh(prismGeometry, bodyMaterial);
      prism.position.set(-0.02, 0.78, 0.02);
      cameraRig.add(prism);

      const hotShoe = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.055, 0.24), metalMaterial);
      hotShoe.position.set(-0.04, 0.99, 0.01);
      cameraRig.add(hotShoe);
      const hotShoeRail = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.026, 0.14), rubberMaterial);
      hotShoeRail.position.set(-0.04, 1.025, 0.06);
      cameraRig.add(hotShoeRail);

      const viewfinder = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.23, 0.34), rubberMaterial);
      viewfinder.position.set(-0.24, 0.9, -0.01);
      cameraRig.add(viewfinder);

      const viewfinderGlass = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.11, 0.02), lensGlassMaterial);
      viewfinderGlass.position.set(-0.24, 0.94, 0.17);
      cameraRig.add(viewfinderGlass);

      const flash = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.18, 0.38), metalMaterial);
      flash.position.set(0.48, 0.82, 0);
      cameraRig.add(flash);

      const shutterDial = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 24), metalMaterial);
      shutterDial.position.set(0.9, 0.82, 0);
      cameraRig.add(shutterDial);

      const shutterButton = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.05, 24), accentMaterial);
      shutterButton.position.set(1, 0.88, 0.02);
      cameraRig.add(shutterButton);

      const gripGeometry = new THREE.ExtrudeGeometry(roundedBoxShape(0.3, 0.9, 0.09), {
        depth: 0.58,
        bevelEnabled: true,
        bevelSegments: 3,
        bevelSize: 0.05,
        bevelThickness: 0.05,
        steps: 1,
      });
      gripGeometry.translate(0, 0, -0.29);
      const grip = new THREE.Mesh(gripGeometry, rubberMaterial);
      grip.position.set(1.2, -0.04, -0.01);
      grip.rotation.z = -0.04;
      cameraRig.add(grip);

      const gripFace = new THREE.Mesh(new THREE.BoxGeometry(0.23, 0.66, 0.035), rubberMaterial);
      gripFace.position.set(1.19, -0.07, 0.31);
      gripFace.rotation.z = -0.04;
      cameraRig.add(gripFace);

      for (let index = 0; index < 7; index += 1) {
        const gripRidge = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.014, 0.012), lensTrimMaterial);
        gripRidge.position.set(1.19, -0.31 + index * 0.082, 0.337);
        gripRidge.rotation.z = -0.04;
        cameraRig.add(gripRidge);
      }

      const screwMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x5d6b68,
        metalness: 0.86,
        roughness: 0.26,
        clearcoat: 0.32,
        clearcoatRoughness: 0.18,
      });
      for (const position of [[-0.88, 0.44], [0.55, 0.48], [0.72, -0.34]]) {
        const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.012, 16), screwMaterial);
        screw.rotation.x = Math.PI / 2;
        screw.position.set(position[0], position[1], 0.43);
        cameraRig.add(screw);
      }

      const makeTextTexture = (draw) => {
        const labelCanvas = document.createElement('canvas');
        labelCanvas.width = 512;
        labelCanvas.height = 128;
        const context = labelCanvas.getContext('2d');
        if (!context) return null;
        context.clearRect(0, 0, labelCanvas.width, labelCanvas.height);
        draw(context, labelCanvas.width, labelCanvas.height);
        const texture = new THREE.CanvasTexture(labelCanvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.needsUpdate = true;
        return texture;
      };

      const canonTexture = makeTextTexture((context, width, height) => {
        context.fillStyle = '#f4f3ea';
        context.font = '700 78px Georgia, serif';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText('Canon', width / 2, height / 2 + 3);
      });
      if (canonTexture) {
        const canonMark = new THREE.Mesh(new THREE.PlaneGeometry(0.78, 0.195), new THREE.MeshBasicMaterial({ map: canonTexture, transparent: true, depthTest: false }));
        canonMark.position.set(-0.04, 0.72, 0.3);
        canonMark.renderOrder = 2;
        cameraRig.add(canonMark);
      }

      const eosTexture = makeTextTexture((context, width, height) => {
        context.fillStyle = '#f4f3ea';
        context.font = '700 66px Arial, sans-serif';
        context.textAlign = 'left';
        context.textBaseline = 'alphabetic';
        context.fillText('EOS', 18, 58);
        context.fillStyle = '#dd4052';
        context.font = '700 31px Arial, sans-serif';
        context.fillText('Rebel T7', 20, 105);
      });
      if (eosTexture) {
        const eosMark = new THREE.Mesh(new THREE.PlaneGeometry(0.38, 0.19), new THREE.MeshBasicMaterial({ map: eosTexture, transparent: true, depthTest: false }));
        eosMark.position.set(0.86, 0.23, 0.42);
        eosMark.renderOrder = 2;
        cameraRig.add(eosMark);
      }

      const lensSpecTexture = makeTextTexture((context, width, height) => {
        context.fillStyle = '#d8e0db';
        context.font = '600 24px Arial, sans-serif';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText('CANON ZOOM LENS  EF-S 18-55mm', width / 2, height / 2 - 12);
        context.font = '500 18px Arial, sans-serif';
        context.fillText('1:3.5-5.6  IS  II', width / 2, height / 2 + 20);
      });
      if (lensSpecTexture) {
        const lensSpecMark = new THREE.Mesh(new THREE.PlaneGeometry(0.53, 0.095), new THREE.MeshBasicMaterial({ map: lensSpecTexture, transparent: true, depthTest: false }));
        lensSpecMark.position.set(lensX, lensY - 0.31, 0.948);
        lensSpecMark.renderOrder = 2;
        cameraRig.add(lensSpecMark);
      }

      const recordLight = new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 10), new THREE.MeshBasicMaterial({ color: 0x77f2d1 }));
      recordLight.position.set(-0.76, -0.4, 0.38);
      cameraRig.add(recordLight);

      const lowerTrim = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.018, 0.022), accentMaterial);
      lowerTrim.position.set(-0.15, -0.44, 0.39);
      cameraRig.add(lowerTrim);

      const ringMaterial = new THREE.MeshBasicMaterial({ color: 0x35d5b5, transparent: true, opacity: 0.25 });
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.12, 0.009, 8, 128), ringMaterial);
      ring.rotation.set(0.88, 0.18, 0.2);
      engine.add(ring);

      const ringSecondary = new THREE.Mesh(new THREE.TorusGeometry(1.42, 0.005, 6, 128), new THREE.MeshBasicMaterial({ color: 0xb8f0df, transparent: true, opacity: 0.14 }));
      ringSecondary.rotation.set(-0.38, 0.72, -0.28);
      engine.add(ringSecondary);

      const nodeGroup = new THREE.Group();
      const nodeGeometry = new THREE.SphereGeometry(0.038, 8, 8);
      const nodeMaterial = new THREE.MeshBasicMaterial({ color: 0xb8f0df });
      const nodePositions = [];
      for (let index = 0; index < 12; index += 1) {
        const angle = (index / 12) * Math.PI * 2;
        const position = new THREE.Vector3(Math.cos(angle) * 1.28, Math.sin(angle) * 1.28, Math.sin(angle * 2) * 0.16);
        const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
        node.position.copy(position);
        nodeGroup.add(node);
        nodePositions.push(position);
      }
      engine.add(nodeGroup);

      const linePositions = [];
      for (let index = 0; index < nodePositions.length; index += 1) {
        const next = nodePositions[(index + 1) % nodePositions.length];
        linePositions.push(nodePositions[index].x, nodePositions[index].y, nodePositions[index].z, next.x, next.y, next.z);
      }
      const lines = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0x35d5b5, transparent: true, opacity: 0.2 }));
      lines.geometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
      engine.add(lines);

      const frameGeometry = new THREE.EdgesGeometry(new THREE.BoxGeometry(2.75, 1.82, 0.76));
      const frameMesh = new THREE.LineSegments(frameGeometry, new THREE.LineBasicMaterial({ color: 0xb8f0df, transparent: true, opacity: 0.13 }));
      frameMesh.rotation.set(0.1, -0.22, 0.08);
      engine.add(frameMesh);

      const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
      const updatePointer = (event) => {
        const bounds = canvas.getBoundingClientRect();
        pointer.targetX = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
        pointer.targetY = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
      };
      const resetPointer = () => { pointer.targetX = 0; pointer.targetY = 0; };
      consoleElement.addEventListener('pointermove', updatePointer, { passive: true });
      consoleElement.addEventListener('pointerleave', resetPointer, { passive: true });

      const resize = () => {
        const bounds = consoleElement.getBoundingClientRect();
        const width = Math.max(1, bounds.width);
        const height = Math.max(1, bounds.height);
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.render(scene, camera);
      };
      resize();
      window.addEventListener('resize', resize, { passive: true });
      if ('ResizeObserver' in window) new ResizeObserver(resize).observe(consoleElement);

      consoleElement.classList.add('is-3d-ready');

      const render = (time) => {
        frame = 0;
        if (!visible || document.hidden) return;
        pointer.x += (pointer.targetX - pointer.x) * 0.055;
        pointer.y += (pointer.targetY - pointer.y) * 0.055;
        const motion = reduceMotion.matches ? 0 : 1;
        engine.position.x += (pointer.x * 0.045 - engine.position.x) * 0.045;
        engine.position.y += (-pointer.y * 0.035 - engine.position.y) * 0.045;
        engine.rotation.y = pointer.x * 0.18 + Math.sin(time * 0.00035) * motion * 0.018;
        engine.rotation.x = -pointer.y * 0.12 + Math.sin(time * 0.00035) * motion * 0.018;
        cameraRig.rotation.y = 0.28 + pointer.x * 0.24 + Math.sin(time * 0.00045) * motion * 0.12;
        cameraRig.rotation.x = -0.08 - pointer.y * 0.14;
        cameraRig.rotation.z = 0.02 + Math.sin(time * 0.00045) * motion * 0.012;
        cameraRig.position.z += (pointer.y * 0.035 - cameraRig.position.z) * 0.045;
        lensGlassMaterial.emissiveIntensity = 0.75 + Math.abs(pointer.x) * 0.12;
        focusRing.material.opacity = 0.32 + Math.abs(pointer.x) * 0.14;
        ring.rotation.z = time * 0.00014 * motion;
        ringSecondary.rotation.x = time * -0.0001 * motion;
        nodeGroup.rotation.z = time * 0.00008 * motion;
        renderer.render(scene, camera);
        if (!reduceMotion.matches) frame = window.requestAnimationFrame(render);
      };
      const paint = () => {
        renderer.render(scene, camera);
        if (visible && !reduceMotion.matches && !frame) frame = window.requestAnimationFrame(render);
      };
      const visibilityObserver = new IntersectionObserver((entries) => {
        visible = entries[0]?.isIntersecting === true;
        if (visible) paint();
      }, { threshold: 0.1, rootMargin: '120px 0px' });
      visibilityObserver.observe(consoleElement);
      document.addEventListener('visibilitychange', paint);
      reduceMotion.addEventListener?.('change', paint);
    } catch {
      consoleElement.classList.add('is-3d-fallback');
    }
  };

  if ('IntersectionObserver' in window) {
    const loader = new IntersectionObserver((entries, observer) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      start();
    }, { rootMargin: '240px 0px' });
    loader.observe(consoleElement);
  } else {
    start();
  }
})();
