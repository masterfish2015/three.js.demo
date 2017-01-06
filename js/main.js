var ldc={};

$(function () {
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
    var plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.receiveShadow = true;

    plane.rotation.x = -0.5 * Math.PI ;
    plane.position.x = 15;
    plane.position.y = 0;
    plane.position.z = 0;    

    ldc.scene.add(plane);

    var cubeGeometry = new THREE.CubeGeometry(4,4,4);
    var cubeMaterial = new THREE.MeshLambertMaterial({color:0xff0000});
    var cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
    cube.castShadow = true;

    cube.position.x = -4;
    cube.position.y = 3;
    cube.position.z = 0;

    ldc.scene.add(cube);

    var sphereGeometry = new THREE.SphereGeometry(4,20,20);
    var sphereMaterial = new THREE.MeshPhongMaterial({color:0x7777ff});
    var sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphere.castShadow = true;

    sphere.position.x = 20;
    sphere.position.y = 4;
    sphere.position.z = 2;

    ldc.scene.add(sphere);

    var spotLight = new THREE.SpotLight(0xffffff);
    spotLight.position.set(-40, 60, -10);
    spotLight.castShadow = true;
    ldc.scene.add(spotLight);

    ldc.camera.position.x = -30;
    ldc.camera.position.y = 40;
    ldc.camera.position.z = 30;
    ldc.camera.lookAt(ldc.scene.position);

    $('#webgl-output').append(ldc.renderer.domElement);
    ldc.renderer.render(ldc.scene, ldc.camera);
})