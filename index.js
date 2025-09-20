// Game variables
let scene, camera, renderer, player;
let obstacles = [];
let collectibles = [];
let gameStarted = false;
let gameOver = false;
let score = 0;
let gameSpeed = 0.1;

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
    scene.fog = new THREE.Fog(0x000033, 50, 200);

    // Create camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 10, 20);
    camera.lookAt(0, 0, 0);

    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000033);
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

    // Set up event listeners
    setupEventListeners();

    // Start render loop
    animate();
}

function createGround() {
    const groundGeometry = new THREE.PlaneGeometry(100, 200);
    const groundMaterial = new THREE.MeshLambertMaterial({ 
        color: 0x333333,
        transparent: true,
        opacity: 0.8
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Add grid lines for visual effect
    const gridHelper = new THREE.GridHelper(100, 50, 0x666666, 0x444444);
    scene.add(gridHelper);
}

function createPlayer() {
    const geometry = new THREE.BoxGeometry(2, 2, 2);
    const material = new THREE.MeshLambertMaterial({ color: 0x00ff88 });
    player = new THREE.Mesh(geometry, material);
    player.position.set(0, 1, 10);
    player.castShadow = true;
    scene.add(player);
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
    player.position.set(0, 1, 10);
    
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
    const boundary = 15;
    
    // Horizontal movement
    if ((keys.a || keys.ArrowLeft) && player.position.x > -boundary) {
        player.position.x -= moveSpeed;
    }
    if ((keys.d || keys.ArrowRight) && player.position.x < boundary) {
        player.position.x += moveSpeed;
    }
    
    // Vertical movement (optional - for 3D movement)
    if ((keys.w || keys.ArrowUp) && player.position.z > 5) {
        player.position.z -= moveSpeed;
    }
    if ((keys.s || keys.ArrowDown) && player.position.z < 15) {
        player.position.z += moveSpeed;
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
            endGame();
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

function endGame() {
    gameOver = true;
    gameStarted = false;
    
    document.getElementById('finalScore').textContent = score;
    document.getElementById('gameOver').style.display = 'block';
}

function updateCamera() {
    if (!gameStarted) return;
    
    // Follow the player with a smooth camera
    const targetX = player.position.x * 0.3;
    const targetZ = player.position.z + 15;
    
    camera.position.x += (targetX - camera.position.x) * 0.05;
    camera.position.z += (targetZ - camera.position.z) * 0.05;
    
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
    checkCollisions();
    updateCamera();
    
    renderer.render(scene, camera);
}

// Initialize the game when the page loads
window.addEventListener('load', init);
