var ldc={step:0};

ldc.initStats = function () {
    var stats = new Stats();
    stats.setMode(0);
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.left = '0px';
    stats.domElement.style.top = '0px';
    $('#stats-output').append( stats.domElement );
    return stats;
}

ldc.initControls = function(){
    ldc.controls = {
        rotationSpeed : 0.02,
        addCube : function(){
            var cubeSize = Math.ceil((Math.random()*3));
            var cubeGeometry = new THREE.CubeGeometry(cubeSize, cubeSize, cubeSize);
            var cubeMaterial = new THREE.MeshLambertMaterial({color:Math.random()* 0xffffff});
            var cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
            cube.castShadow = true;
            cube.name = "cube-"+ldc.scene.children.length;
            cube.position.x = -30 + Math.round(Math.random()*60);
            cube.position.y = Math.round(Math.random()*5);
            cube.position.z = -20 + Math.round(Math.random()*40);
            ldc.scene.add(cube);
            this.numberOfObjects = ldc.scene.children.length;
        },
        removeCube : function(){
            var allChildren = ldc.scene.children;
            var lastObject = allChildren[allChildren.length - 1];
            if(lastObject instanceof THREE.Mesh){
                ldc.scene.remove(lastObject);
                this.numberOfObjects = ldc.scene.children.length;
            }
        }
    };
    var gui = new dat.GUI();
    gui.add(ldc.controls, 'rotationSpeed', 0, 0.5);
    gui.add(ldc.controls, 'addCube');
    gui.add(ldc.controls, 'removeCube');
    return gui;
}

ldc.renderScene = function(){
    ldc.stats.update();

    ldc.scene.traverse(function(e){
        if(e instanceof THREE.Mesh && e!= ldc.plane ){
            e.rotation.x += ldc.controls.rotationSpeed;
            e.rotation.y += ldc.controls.rotationSpeed;
            e.rotation.z += ldc.controls.rotationSpeed;
            //console.log(e.name);
        }
    })

    requestAnimationFrame(ldc.renderScene);
    ldc.renderer.render(ldc.scene, ldc.camera);
}

$(function () {
    ldc.stats = ldc.initStats();
    ldc.gui = ldc.initControls();

    ldc.scene = new THREE.Scene();
    ldc.camera = new THREE.PerspectiveCamera(45,
        window.innerWidth / window.innerHeight,
        0.1,
        1000);
    ldc.renderer = new THREE.WebGLRenderer();
    ldc.renderer.setClearColor(0xEEEEEE);
    ldc.renderer.setSize(window.innerWidth, window.innerHeight);
    ldc.renderer.shadowMapEnabled = true;

    var axes = new THREE.AxisHelper( 20 );
    ldc.scene.add(axes);

    var planeGeometry = new THREE.PlaneGeometry(60, 40, 1, 1);
    var planeMaterial = new THREE.MeshLambertMaterial({color: 0xffffff});
    ldc.plane = new THREE.Mesh(planeGeometry, planeMaterial);
    ldc.plane.receiveShadow = true;

    ldc.plane.rotation.x = -0.5 * Math.PI ;
    //ldc.plane.position.x = 15;
    //ldc.plane.position.y = 0;
    //ldc.plane.position.z = 0;    

    ldc.scene.add(ldc.plane);

    ldc.ambientLight = new THREE.AmbientLight(0x0c0c0c);
    ldc.scene.add(ldc.ambientLight);

    ldc.spotLight = new THREE.SpotLight(0xffffff);
    ldc.spotLight.position.set(-40, 60, -10);
    ldc.spotLight.castShadow = true;
    ldc.scene.add(ldc.spotLight);

    ldc.camera.position.x = -30;
    ldc.camera.position.y = 40;
    ldc.camera.position.z = 30;
    ldc.camera.lookAt(ldc.scene.position);

    $('#webgl-output').append(ldc.renderer.domElement);
    
    ldc.renderScene();
})