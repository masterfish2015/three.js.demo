var ldc={step:0};

ldc.renderScene = function(){
    ldc.stats.update();

    ldc.cube.rotation.x += 0.02;
    ldc.cube.rotation.y += 0.02;
    ldc.cube.rotation.z += 0.02;

    ldc.step+=0.04;
    ldc.sphere.position.x = 20 +(10*(Math.cos(ldc.step)));
    ldc.sphere.position.y = 2  +(10*Math.abs(Math.sin(ldc.step)));

    requestAnimationFrame(ldc.renderScene);
    ldc.renderer.render(ldc.scene, ldc.camera);
}

ldc.initStats = function () {
    var stats = new Stats();
    stats.setMode(0);
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.left = '0px';
    stats.domElement.style.top = '0px';
    $('#stats-output').append( stats.domElement );
    return stats;
}

$(function () {
    ldc.stats = ldc.initStats();

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

    var planeGeometry = new THREE.PlaneGeometry(60, 20);
    var planeMaterial = new THREE.MeshLambertMaterial({color: 0xffffff});
    ldc.plane = new THREE.Mesh(planeGeometry, planeMaterial);
    ldc.plane.receiveShadow = true;

    ldc.plane.rotation.x = -0.5 * Math.PI ;
    ldc.plane.position.x = 15;
    ldc.plane.position.y = 0;
    ldc.plane.position.z = 0;    

    ldc.scene.add(ldc.plane);

    var cubeGeometry = new THREE.CubeGeometry(4,4,4);
    var cubeMaterial = new THREE.MeshLambertMaterial({color:0xff0000});
    ldc.cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
    ldc.cube.castShadow = true;

    ldc.cube.position.x = -4;
    ldc.cube.position.y = 3;
    ldc.cube.position.z = 0;

    ldc.scene.add(ldc.cube);

    var sphereGeometry = new THREE.SphereGeometry(4,20,20);
    var sphereMaterial = new THREE.MeshPhongMaterial({color:0x7777ff});
    ldc.sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    ldc.sphere.castShadow = true;

    ldc.sphere.position.x = 20;
    ldc.sphere.position.y = 4;
    ldc.sphere.position.z = 2;

    ldc.scene.add(ldc.sphere);

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