// Game variables
let scene, camera, renderer, player;
let obstacles = [];
let collectibles = [];
let gameStarted = false;
let gameOver = false;
let score = 0;
let gameSpeed = 0.1;
let stick = null;
let stickAnimation = { active: false, progress: 0 };
let cameraShake = { active: false, intensity: 0, duration: 0 };
let particles = [];

// Input handling
const keys = {
    w: false,
    a: false,
    s: false,
    d: false,
    ArrowUp: false,
    ArrowLeft: false,
    ArrowDown: false,
    ArrowRight: false
};

// Initialize the game
function init() {
    // Create scene
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x87CEEB, 30, 150); // Sky blue fog for city atmosphere

    // Create camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 10, 20);
    camera.lookAt(0, 0, 0);

    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x87CEEB); // Sky blue background
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('gameContainer').appendChild(renderer.domElement);

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Create ground
    createGround();

    // Create player
    createPlayer();

    // Create stick
    createStick();

    // Set up event listeners
    setupEventListeners();

    // Start render loop
    animate();
}

function createGround() {
    // Create main road surface
    const roadGeometry = new THREE.PlaneGeometry(20, 200);
    const roadMaterial = new THREE.MeshLambertMaterial({ 
        color: 0x333333
    });
    const road = new THREE.Mesh(roadGeometry, roadMaterial);
    road.rotation.x = -Math.PI / 2;
    road.receiveShadow = true;
    scene.add(road);

    // Create sidewalks on both sides
    const sidewalkGeometry = new THREE.PlaneGeometry(8, 200);
    const sidewalkMaterial = new THREE.MeshLambertMaterial({ 
        color: 0x666666
    });
    
    // Left sidewalk
    const leftSidewalk = new THREE.Mesh(sidewalkGeometry, sidewalkMaterial);
    leftSidewalk.rotation.x = -Math.PI / 2;
    leftSidewalk.position.x = -14;
    leftSidewalk.receiveShadow = true;
    scene.add(leftSidewalk);
    
    // Right sidewalk
    const rightSidewalk = new THREE.Mesh(sidewalkGeometry, sidewalkMaterial);
    rightSidewalk.rotation.x = -Math.PI / 2;
    rightSidewalk.position.x = 14;
    rightSidewalk.receiveShadow = true;
    scene.add(rightSidewalk);

    // Create road markings (white lines)
    createRoadMarkings();
    
    // Create street elements
    createStreetElements();
}

function createRoadMarkings() {
    // Center line (continuous)
    const centerLineGeometry = new THREE.PlaneGeometry(0.3, 200);
    const centerLineMaterial = new THREE.MeshLambertMaterial({ 
        color: 0xffffff
    });
    const centerLine = new THREE.Mesh(centerLineGeometry, centerLineMaterial);
    centerLine.rotation.x = -Math.PI / 2;
    centerLine.position.y = 0.01; // Slightly above road
    scene.add(centerLine);

    // Dashed lines for lanes
    for (let z = -100; z < 100; z += 8) {
        // Left lane marking
        const leftMarkGeometry = new THREE.PlaneGeometry(0.2, 3);
        const leftMark = new THREE.Mesh(leftMarkGeometry, centerLineMaterial);
        leftMark.rotation.x = -Math.PI / 2;
        leftMark.position.set(-5, 0.01, z);
        scene.add(leftMark);

        // Right lane marking
        const rightMark = new THREE.Mesh(leftMarkGeometry, centerLineMaterial);
        rightMark.rotation.x = -Math.PI / 2;
        rightMark.position.set(5, 0.01, z);
        scene.add(rightMark);
    }

    // Road edges (solid white lines)
    const edgeGeometry = new THREE.PlaneGeometry(0.2, 200);
    
    // Left edge
    const leftEdge = new THREE.Mesh(edgeGeometry, centerLineMaterial);
    leftEdge.rotation.x = -Math.PI / 2;
    leftEdge.position.set(-10, 0.01, 0);
    scene.add(leftEdge);
    
    // Right edge
    const rightEdge = new THREE.Mesh(edgeGeometry, centerLineMaterial);
    rightEdge.rotation.x = -Math.PI / 2;
    rightEdge.position.set(10, 0.01, 0);
    scene.add(rightEdge);
}

function createStreetElements() {
    // Create street lamps
    for (let z = -80; z < 100; z += 40) {
        createStreetLamp(-18, z);
        createStreetLamp(18, z);
    }
    
    // Create buildings in the background
    createBuildings();
}

function createStreetLamp(x, z) {
    // Lamp post
    const postGeometry = new THREE.CylinderGeometry(0.1, 0.1, 8, 8);
    const postMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
    const post = new THREE.Mesh(postGeometry, postMaterial);
    post.position.set(x, 4, z);
    post.castShadow = true;
    scene.add(post);

    // Lamp head
    const lampGeometry = new THREE.SphereGeometry(0.5, 8, 8);
    const lampMaterial = new THREE.MeshLambertMaterial({ 
        color: 0xffffaa,
        emissive: 0x222200
    });
    const lamp = new THREE.Mesh(lampGeometry, lampMaterial);
    lamp.position.set(x, 8.5, z);
    scene.add(lamp);

    // Add point light
    const light = new THREE.PointLight(0xffffaa, 0.3, 20);
    light.position.set(x, 8.5, z);
    scene.add(light);
}

function createBuildings() {
    // Create simple building silhouettes
    for (let i = 0; i < 10; i++) {
        const height = Math.random() * 15 + 10;
        const width = Math.random() * 8 + 4;
        const depth = Math.random() * 8 + 4;
        
        const buildingGeometry = new THREE.BoxGeometry(width, height, depth);
        const buildingMaterial = new THREE.MeshLambertMaterial({ 
            color: new THREE.Color().setHSL(0.6, 0.1, Math.random() * 0.3 + 0.2)
        });
        const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
        
        // Position buildings on sides
        const side = Math.random() > 0.5 ? 1 : -1;
        building.position.set(
            side * (25 + Math.random() * 10), 
            height / 2, 
            (Math.random() - 0.5) * 150
        );
        building.castShadow = true;
        scene.add(building);
    }
}

function createPlayer() {
    // Create car group
    player = new THREE.Group();
    
    // Car body (main part)
    const bodyGeometry = new THREE.BoxGeometry(1.8, 0.8, 3.5);
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x00ff88 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.8;
    body.castShadow = true;
    player.add(body);
    
    // Car roof/cabin
    const roofGeometry = new THREE.BoxGeometry(1.6, 0.6, 2);
    const roofMaterial = new THREE.MeshLambertMaterial({ color: 0x00cc66 });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = 1.5;
    roof.position.z = -0.3;
    roof.castShadow = true;
    player.add(roof);
    
    // Windshield (front)
    const windshieldGeometry = new THREE.PlaneGeometry(1.4, 0.5);
    const windshieldMaterial = new THREE.MeshLambertMaterial({ 
        color: 0x87CEEB, 
        transparent: true, 
        opacity: 0.7 
    });
    const windshield = new THREE.Mesh(windshieldGeometry, windshieldMaterial);
    windshield.position.set(0, 1.6, 0.8);
    windshield.rotation.x = -Math.PI / 6;
    player.add(windshield);
    
    // Rear window
    const rearWindow = new THREE.Mesh(windshieldGeometry, windshieldMaterial);
    rearWindow.position.set(0, 1.6, -1.4);
    rearWindow.rotation.x = Math.PI / 6;
    player.add(rearWindow);
    
    // Wheels
    const wheelGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 8);
    const wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x222222 });
    
    // Front wheels
    const frontLeftWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    frontLeftWheel.position.set(-1, 0.3, 1.2);
    frontLeftWheel.rotation.z = Math.PI / 2;
    frontLeftWheel.castShadow = true;
    player.add(frontLeftWheel);
    
    const frontRightWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    frontRightWheel.position.set(1, 0.3, 1.2);
    frontRightWheel.rotation.z = Math.PI / 2;
    frontRightWheel.castShadow = true;
    player.add(frontRightWheel);
    
    // Rear wheels
    const rearLeftWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    rearLeftWheel.position.set(-1, 0.3, -1.2);
    rearLeftWheel.rotation.z = Math.PI / 2;
    rearLeftWheel.castShadow = true;
    player.add(rearLeftWheel);
    
    const rearRightWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    rearRightWheel.position.set(1, 0.3, -1.2);
    rearRightWheel.rotation.z = Math.PI / 2;
    rearRightWheel.castShadow = true;
    player.add(rearRightWheel);
    
    // Headlights
    const headlightGeometry = new THREE.SphereGeometry(0.15, 8, 8);
    const headlightMaterial = new THREE.MeshLambertMaterial({ 
        color: 0xffffcc,
        emissive: 0x444400
    });
    
    const leftHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
    leftHeadlight.position.set(-0.6, 0.9, 1.8);
    player.add(leftHeadlight);
    
    const rightHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
    rightHeadlight.position.set(0.6, 0.9, 1.8);
    player.add(rightHeadlight);
    
    // Taillights
    const taillightMaterial = new THREE.MeshLambertMaterial({ 
        color: 0xff3333,
        emissive: 0x220000
    });
    
    const leftTaillight = new THREE.Mesh(headlightGeometry, taillightMaterial);
    leftTaillight.position.set(-0.6, 0.9, -1.8);
    player.add(leftTaillight);
    
    const rightTaillight = new THREE.Mesh(headlightGeometry, taillightMaterial);
    rightTaillight.position.set(0.6, 0.9, -1.8);
    player.add(rightTaillight);
    
    // Position the car
    player.position.set(0, 0.5, 10);
    player.castShadow = true;
    scene.add(player);
    
    // Store wheel references for animation
    player.userData.wheels = [frontLeftWheel, frontRightWheel, rearLeftWheel, rearRightWheel];
}

function createStick() {
    // Create a stick/club shape using a cylinder
    const handleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 3, 8);
    const handleMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 }); // Brown color
    const handle = new THREE.Mesh(handleGeometry, handleMaterial);
    
    // Create the club head (larger part)
    const headGeometry = new THREE.CylinderGeometry(0.3, 0.15, 1, 8);
    const headMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 }); // Darker brown
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 2; // Position at the top of the handle
    
    // Group the stick parts together
    stick = new THREE.Group();
    stick.add(handle);
    stick.add(head);
    
    // Position the stick above and behind the scene (hidden initially)
    stick.position.set(0, 15, 5);
    stick.rotation.z = Math.PI / 4; // Slight angle
    stick.visible = false; // Hidden by default
    stick.castShadow = true;
    
    scene.add(stick);
}

function createObstacle(x, z) {
    const geometry = new THREE.BoxGeometry(2, 3, 2);
    const material = new THREE.MeshLambertMaterial({ color: 0xff4444 });
    const obstacle = new THREE.Mesh(geometry, material);
    obstacle.position.set(x, 1.5, z);
    obstacle.castShadow = true;
    scene.add(obstacle);
    obstacles.push(obstacle);
}

function createCollectible(x, z) {
    const geometry = new THREE.SphereGeometry(0.8, 16, 16);
    const material = new THREE.MeshLambertMaterial({ color: 0xffff00 });
    const collectible = new THREE.Mesh(geometry, material);
    collectible.position.set(x, 1, z);
    collectible.castShadow = true;
    
    // Add rotation animation
    collectible.userData = { rotationSpeed: 0.05 };
    
    scene.add(collectible);
    collectibles.push(collectible);
}

function setupEventListeners() {
    // Keyboard input
    document.addEventListener('keydown', (event) => {
        if (keys.hasOwnProperty(event.code.replace('Key', '').toLowerCase()) || 
            keys.hasOwnProperty(event.code)) {
            keys[event.code.replace('Key', '').toLowerCase()] = true;
            keys[event.code] = true;
        }
    });

    document.addEventListener('keyup', (event) => {
        if (keys.hasOwnProperty(event.code.replace('Key', '').toLowerCase()) || 
            keys.hasOwnProperty(event.code)) {
            keys[event.code.replace('Key', '').toLowerCase()] = false;
            keys[event.code] = false;
        }
    });

    // UI buttons
    document.getElementById('startBtn').addEventListener('click', startGame);
    document.getElementById('restartBtn').addEventListener('click', restartGame);

    // Handle window resize
    window.addEventListener('resize', onWindowResize);
}

function startGame() {
    gameStarted = true;
    gameOver = false;
    score = 0;
    gameSpeed = 0.1;
    
    document.getElementById('instructions').style.display = 'none';
    document.getElementById('gameOver').style.display = 'none';
    
    // Clear existing obstacles and collectibles
    clearGameObjects();
    
    // Reset player position
    player.position.set(0, 0.5, 10);
    
    // Generate initial objects
    generateGameObjects();
    
    updateScore();
}

function restartGame() {
    startGame();
}

function clearGameObjects() {
    // Remove obstacles
    obstacles.forEach(obstacle => {
        scene.remove(obstacle);
    });
    obstacles = [];
    
    // Remove collectibles
    collectibles.forEach(collectible => {
        scene.remove(collectible);
    });
    collectibles = [];
}

function generateGameObjects() {
    // Generate obstacles and collectibles ahead of the player
    for (let z = -10; z > -200; z -= 10) {
        if (Math.random() < 0.7) { // 70% chance to spawn something
            const x = (Math.random() - 0.5) * 20; // Random x position
            
            if (Math.random() < 0.6) { // 60% chance for obstacle, 40% for collectible
                createObstacle(x, z);
            } else {
                createCollectible(x, z);
            }
        }
    }
}

function updatePlayerMovement() {
    if (!gameStarted || gameOver) return;
    
    const moveSpeed = 0.3;
    const boundary = 8; // Adjusted for road width
    let isMoving = false;
    
    // Horizontal movement
    if ((keys.a || keys.ArrowLeft) && player.position.x > -boundary) {
        player.position.x -= moveSpeed;
        isMoving = true;
    }
    if ((keys.d || keys.ArrowRight) && player.position.x < boundary) {
        player.position.x += moveSpeed;
        isMoving = true;
    }
    
    // Vertical movement (optional - for 3D movement)
    if ((keys.w || keys.ArrowUp) && player.position.z > 5) {
        player.position.z -= moveSpeed;
        isMoving = true;
    }
    if ((keys.s || keys.ArrowDown) && player.position.z < 15) {
        player.position.z += moveSpeed;
        isMoving = true;
    }
    
    // Animate wheels when moving
    if (isMoving && player.userData.wheels) {
        player.userData.wheels.forEach(wheel => {
            wheel.rotation.x += 0.2;
        });
    }
}

function updateGameObjects() {
    if (!gameStarted || gameOver) return;
    
    // Move obstacles towards player
    obstacles.forEach((obstacle, index) => {
        obstacle.position.z += gameSpeed;
        
        // Remove obstacles that are behind the player
        if (obstacle.position.z > 20) {
            scene.remove(obstacle);
            obstacles.splice(index, 1);
        }
    });
    
    // Move and animate collectibles
    collectibles.forEach((collectible, index) => {
        collectible.position.z += gameSpeed;
        collectible.rotation.y += collectible.userData.rotationSpeed;
        
        // Remove collectibles that are behind the player
        if (collectible.position.z > 20) {
            scene.remove(collectible);
            collectibles.splice(index, 1);
        }
    });
    
    // Generate new objects
    if (Math.random() < 0.02) { // 2% chance per frame
        const x = (Math.random() - 0.5) * 30;
        const z = -50 - Math.random() * 50;
        
        if (Math.random() < 0.6) {
            createObstacle(x, z);
        } else {
            createCollectible(x, z);
        }
    }
    
    // Increase game speed gradually
    gameSpeed += 0.0005;
}

function checkCollisions() {
    if (!gameStarted || gameOver) return;
    
    const playerPos = player.position;
    
    // Check obstacle collisions
    obstacles.forEach(obstacle => {
        const distance = playerPos.distanceTo(obstacle.position);
        if (distance < 2) {
            // Start the stick hitting animation before ending game
            startStickAnimation();
            
            // Delay game over to show the animation (longer delay for slower animation)
            setTimeout(() => {
                endGame();
            }, 2400); // Wait for animation to complete
        }
    });
    
    // Check collectible collisions
    collectibles.forEach((collectible, index) => {
        const distance = playerPos.distanceTo(collectible.position);
        if (distance < 2) {
            // Collect the item
            scene.remove(collectible);
            collectibles.splice(index, 1);
            score += 10;
            updateScore();
        }
    });
}

function updateScore() {
    document.getElementById('score').textContent = `Score: ${score}`;
}

function startStickAnimation() {
    if (stickAnimation.active) return; // Don't start if already active
    
    stickAnimation.active = true;
    stickAnimation.progress = 0;
    stick.visible = true;
    
    // Position stick above the player
    stick.position.x = player.position.x;
    stick.position.y = 15;
    stick.position.z = player.position.z;
    stick.rotation.z = Math.PI / 4; // Starting angle
}

function startCameraShake(intensity = 0.5, duration = 0.3) {
    cameraShake.active = true;
    cameraShake.intensity = intensity;
    cameraShake.duration = duration;
    cameraShake.timer = 0;
}

function createImpactParticles(position) {
    const particleCount = 15;
    for (let i = 0; i < particleCount; i++) {
        const geometry = new THREE.SphereGeometry(0.1, 4, 4);
        const material = new THREE.MeshLambertMaterial({ 
            color: new THREE.Color().setHSL(Math.random() * 0.1 + 0.05, 1, 0.5) // Orange/red colors
        });
        const particle = new THREE.Mesh(geometry, material);
        
        particle.position.copy(position);
        particle.position.y += 2; // Start above player's head
        
        // Random velocity
        particle.userData = {
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 8,
                Math.random() * 5 + 2,
                (Math.random() - 0.5) * 8
            ),
            life: 1.0,
            decay: 0.02
        };
        
        scene.add(particle);
        particles.push(particle);
    }
}

function updateParticles() {
    particles.forEach((particle, index) => {
        // Update position
        particle.position.add(particle.userData.velocity);
        
        // Apply gravity
        particle.userData.velocity.y -= 0.2;
        
        // Fade out
        particle.userData.life -= particle.userData.decay;
        particle.material.opacity = particle.userData.life;
        
        // Remove when faded
        if (particle.userData.life <= 0) {
            scene.remove(particle);
            particles.splice(index, 1);
        }
    });
}

function updateStickAnimation() {
    if (!stickAnimation.active) return;
    
    // Animation duration and speed (slower for more dramatic effect)
    const animationSpeed = 0.04;
    stickAnimation.progress += animationSpeed;
    
    if (stickAnimation.progress <= 1) {
        // Phase 1: Stick swings down to hit the player
        const t = stickAnimation.progress;
        
        // Smooth easing function (ease-in-out)
        const easedT = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        
        // Move stick down towards player's head
        stick.position.y = 15 - (10 * easedT); // From y=15 to y=5
        stick.rotation.z = (Math.PI / 4) - (Math.PI / 2 * easedT); // Rotate to hit
        
        // At impact point, make player "react" and add effects
        if (t > 0.7 && t < 0.9) {
            // Make car shake/bounce slightly
            player.position.y = 0.5 + Math.sin(t * 50) * 0.1;
            player.rotation.x = Math.sin(t * 40) * 0.1;
            player.rotation.z = Math.sin(t * 30) * 0.1;
            
            // Trigger impact effects at the peak of impact (once)
            if (t > 0.78 && t < 0.82 && !stickAnimation.impactTriggered) {
                startCameraShake(0.8, 0.4);
                createImpactParticles(player.position);
                stickAnimation.impactTriggered = true;
            }
        }
        
    } else if (stickAnimation.progress <= 1.5) {
        // Phase 2: Stick moves away
        const t = (stickAnimation.progress - 1) * 2; // 0 to 1
        stick.position.y = 5 + (15 * t); // Move back up
        stick.position.x += t * 2; // Move to the side
        stick.rotation.z = -Math.PI / 4 + (Math.PI * t); // Continue rotation
        
        // Reset player position
        player.position.y = 0.5;
        player.rotation.x = 0;
        player.rotation.z = 0;
        
    } else {
        // Animation complete
        stickAnimation.active = false;
        stickAnimation.impactTriggered = false; // Reset for next time
        stick.visible = false;
        
        // Reset player completely
        player.position.y = 0.5;
        player.rotation.x = 0;
        player.rotation.z = 0;
    }
}

function endGame() {
    gameOver = true;
    gameStarted = false;
    
    document.getElementById('finalScore').textContent = score;
    document.getElementById('gameOver').style.display = 'block';
}

function updateCamera() {
    if (!gameStarted) return;
    
    // Follow the player with a smooth camera
    let targetX = player.position.x * 0.3;
    let targetZ = player.position.z + 15;
    let targetY = camera.position.y;
    
    // Add camera shake effect
    if (cameraShake.active) {
        cameraShake.timer += 0.016; // Approximate frame time
        
        if (cameraShake.timer < cameraShake.duration) {
            const shakeAmount = cameraShake.intensity * (1 - cameraShake.timer / cameraShake.duration);
            targetX += (Math.random() - 0.5) * shakeAmount;
            targetY += (Math.random() - 0.5) * shakeAmount;
            targetZ += (Math.random() - 0.5) * shakeAmount;
        } else {
            cameraShake.active = false;
        }
    }
    
    camera.position.x += (targetX - camera.position.x) * 0.05;
    camera.position.z += (targetZ - camera.position.z) * 0.05;
    camera.position.y += (targetY - camera.position.y) * 0.05;
    
    camera.lookAt(player.position.x, 0, player.position.z - 5);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    
    updatePlayerMovement();
    updateGameObjects();
    updateStickAnimation();
    updateParticles();
    checkCollisions();
    updateCamera();
    
    renderer.render(scene, camera);
}

// Initialize the game when the page loads
window.addEventListener('load', init);
