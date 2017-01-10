var ldc = { step: 0, angle: 0 };

ldc.initStats = function() {
    var stats = new Stats();
    stats.setMode(0);
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.left = '0px';
    stats.domElement.style.top = '0px';
    $('#stats-output').append(stats.domElement);
    return stats;
}

function cubeClick_handler(event){
    var cube = event.target;
    ldc.old_color = cube.material.color;
    cube.material.color.setHex(0xff0000);
}

ldc.initControls = function() {
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
            ldc.domEvent.addEventListener(cube, 'click', cubeClick_handler);
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

ldc.renderScene = function() {
    ldc.stats.update();
    ldc.orbit.update();

    ldc.scene.traverse(function(e) {
        if (e instanceof THREE.Mesh && e != ldc.plane) {
            e.rotation.x += ldc.controls.cubeRotationSpeed;
            e.rotation.y += ldc.controls.cubeRotationSpeed;
            e.rotation.z += ldc.controls.cubeRotationSpeed;

        }
    });

    requestAnimationFrame(ldc.renderScene);
    ldc.renderer.render(ldc.scene, ldc.camera);
}

$(function() {
    ldc.stats = ldc.initStats();
    ldc.gui = ldc.initControls();

    ldc.scene = new THREE.Scene();
    ldc.scene.fog = new THREE.Fog(0xffffff, 0.015, 100);

    ldc.camera = new THREE.PerspectiveCamera(45,
        window.innerWidth / window.innerHeight,
        0.1,
        1000);
    ldc.renderer = new THREE.WebGLRenderer({antialias:true});
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

    ldc.camera.position.x = -30;
    ldc.camera.position.y = 40;
    ldc.camera.position.z = 30;
    ldc.camera.lookAt(ldc.scene.position);

    ldc.orbit = new THREE.OrbitControls(ldc.camera, ldc.renderer.domElement);

    $('#webgl-output').append(ldc.renderer.domElement);

    ldc.domEvent = new THREEx.DomEvents(ldc.camera, ldc.renderer.domElement);
    /*
    ldc.domEvent.addEventListener(ldc.plane, 'click', function(event){
        //console.log(event);
        var plane = event.target;
        plane.material.color.setHex(0xff0000);
    })
    */
    THREEx.WindowResize(ldc.renderer, ldc.camera)

    ldc.renderScene();
})