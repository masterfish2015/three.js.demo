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

    var axes = new THREE.AxisHelper( 20 );
    ldc.scene.add(axes);

    var planeGeometry = new THREE.PlaneGeometry(60, 20, 1, 1);
    var planeMaterial = new THREE.MeshBasicMaterial({color: 0xcccccc});
    var plane = new THREE.Mesh(planeGeometry, planeMaterial);

    plane.rotation.x = -0.5 * Math.PI ;
    plane.position.x = 15;
    plane.position.y = 0;
    plane.position.z = 0;

    ldc.scene.add(plane);

    ldc.camera.position.x = -30;
    ldc.camera.position.y = 40;
    ldc.camera.position.z = 30;
    ldc.camera.lookAt(ldc.scene.position);

    $('#webgl-output').append(ldc.renderer.domElement);
    ldc.renderer.render(ldc.scene, ldc.camera);
})