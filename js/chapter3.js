var ldc = { step: 0, angle: 0, mouse: { x: 0, y: 0 } };

function initStats() {
    var stats = new Stats();
    stats.setMode(0);
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.left = '0px';
    stats.domElement.style.top = '0px';
    $('#stats-output').append(stats.domElement);
    return stats;
}

function initControls() {
    ldc.controls = {
        cubeRotationSpeed: 0.02,

        addCube: function() {
            var cubeSize = Math.ceil((Math.random() * 3));
            var cubeGeometry = new THREE.CubeGeometry(cubeSize, cubeSize, cubeSize);
            var cubeMaterial = new THREE.MeshLambertMaterial({ color: Math.random() * 0xffffff });
            var cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
            cube.castShadow = true;
            cube.name = "cube-" + ldc.scene.children.length;
            cube.position.x = -30 + Math.round(Math.random() * 60);
            cube.position.y = Math.round(Math.random() * 5);
            cube.position.z = -20 + Math.round(Math.random() * 40);
            ldc.scene.add(cube);
            this.numberOfObjects = ldc.scene.children.length;
            //console.log(cube.position);
        },

        removeCube: function() {
            var allChildren = ldc.scene.children;
            var lastObject = allChildren[allChildren.length - 1];
            if (lastObject instanceof THREE.Mesh) {
                ldc.scene.remove(lastObject);
                this.numberOfObjects = ldc.scene.children.length;
            }
        }
    };
    var gui = new dat.GUI();
    gui.add(ldc.controls, 'cubeRotationSpeed', 0, 0.5);
    gui.add(ldc.controls, 'addCube');
    gui.add(ldc.controls, 'removeCube');
    return gui;
}

function update() {
    //Renderers use projectVector for translating 3D points to the 2D screen. 
    //unprojectVector is basically for doing the inverse, unprojecting 2D points into the 3D world. 
    //For both methods you pass the camera you're viewing the scene through.
    var vector = new THREE.Vector3(ldc.mouse.x, ldc.mouse.y, 0.015);
    ldc.projector.unprojectVector(vector, ldc.camera);
    var ray = new THREE.Raycaster(ldc.camera.position, vector.sub(ldc.camera.position).normalize());
    // create an array containing all objects in the scene with which the ray intersects
    var intersects = ray.intersectObjects(ldc.scene.children);

    // INTERSECTED = the object in the scene currently closest to the camera 
    //		and intersected by the Ray projected from the mouse position 	

    // if there is one (or more) intersections
    if (intersects.length > 0) {
        // if the closest object intersected is not the currently stored intersection object
        if (intersects[0].object != ldc.INTERSECTED) {
            // restore previous intersection object (if it exists) to its original color
            console.log(intersects[0].object.name);

            if (ldc.INTERSECTED)
                ldc.INTERSECTED.material.color.setHex(ldc.INTERSECTED.currentHex);
            // store reference to closest object as current intersection object
            ldc.INTERSECTED = intersects[0].object;
            // store color of closest object (for later restoration)
            ldc.INTERSECTED.currentHex = ldc.INTERSECTED.material.color.getHex();
            // set a new color for closest object
            ldc.INTERSECTED.material.color.setHex(0xffff00);
        }
    } else // there are no intersections
    {
        // restore previous intersection object (if it exists) to its original color
        if (ldc.INTERSECTED)
            ldc.INTERSECTED.material.color.setHex(ldc.INTERSECTED.currentHex);
        // remove previous intersection object reference
        //     by setting current intersection object to "nothing"
        ldc.INTERSECTED = null;
    }

    ldc.stats.update();
    ldc.orbit.update();
}

function renderScene() {
    /*ldc.scene.traverse(function(e) {
        if (e instanceof THREE.Mesh && e != ldc.plane) {
            e.rotation.x += ldc.controls.cubeRotationSpeed;
            e.rotation.y += ldc.controls.cubeRotationSpeed;
            e.rotation.z += ldc.controls.cubeRotationSpeed;

        }
    });*/

    requestAnimationFrame(renderScene);
    ldc.renderer.render(ldc.scene, ldc.camera);
    update();
}

$(function() {
    ldc.stats = initStats();
    ldc.gui = initControls();

    ldc.scene = new THREE.Scene();
    //ldc.scene.fog = new THREE.Fog(0xffffff, 0.015, 100);

    ldc.camera = new THREE.PerspectiveCamera(45,
        window.innerWidth / window.innerHeight,
        0.1,
        20000);
    ldc.renderer = new THREE.WebGLRenderer({ antialias: true });
    ldc.renderer.setClearColor(0xEEEEEE);
    ldc.renderer.setSize(window.innerWidth, window.innerHeight);
    ldc.renderer.shadowMapEnabled = true;

    var axes = new THREE.AxisHelper(20);
    ldc.scene.add(axes);

    var planeGeometry = new THREE.PlaneGeometry(60, 40, 1, 1);
    var planeMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
    ldc.plane = new THREE.Mesh(planeGeometry, planeMaterial);
    ldc.plane.receiveShadow = true;

    ldc.plane.rotation.x = -0.5 * Math.PI;
    //ldc.plane.position.x = 15;
    //ldc.plane.position.y = 0;
    //ldc.plane.position.z = 0;    

    ldc.scene.add(ldc.plane);

    ldc.ambientLight = new THREE.AmbientLight(0xff0000);
    ldc.scene.add(ldc.ambientLight);

    ldc.spotLight = new THREE.SpotLight(0xffffff);
    ldc.spotLight.position.set(-40, 60, -10);
    ldc.spotLight.castShadow = true;
    ldc.scene.add(ldc.spotLight);

    ldc.camera.position.set(0, 150, 400);
    ldc.camera.lookAt(ldc.scene.position);

    ldc.orbit = new THREE.OrbitControls(ldc.camera, ldc.renderer.domElement);

    $('#webgl-output').append(ldc.renderer.domElement);

    ldc.projector = new THREE.Projector();
    ldc.mouse = { x: 0, y: 0 }; //保存当前鼠标位置
    ldc.INTERSECTED = null; //是否相交

    // when the mouse moves, call the given function
    THREEx.WindowResize(ldc.renderer, ldc.camera);
    document.addEventListener('mousemove',
        function(event) {
            // update the mouse variable
            ldc.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            ldc.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
            ldc.mouse.z = 0.5;
        }, false);


    renderScene();
})
