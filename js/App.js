// tmp

(function() {
    'use strict'

    var canvas, renderer;

    var camera;
    var scene;






    function onWindowResize() {

        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        // backgroundCamera.aspect = window.innerWidth / window.innerHeight;
        // backgroundCamera.updateProjectionMatrix();

        renderer.setSize(window.innerWidth, window.innerHeight);

    }




    window.onload = function() {
        canvas = document.getElementById( 'webgl-canvas' );
        
        renderer = new THREE.WebGLRenderer( { canvas: canvas, antialias: true } );
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);

        window.addEventListener('resize', onWindowResize, false);



        camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 10000 );
        camera.position.z = 100;


        scene = new THREE.Scene();

        var ambient = new THREE.AmbientLight( 0x444444 );
        scene.add( ambient );

        var directionalLight = new THREE.DirectionalLight( 0xffeedd );
        directionalLight.position.set( 1, 1, 1 ).normalize();
        scene.add( directionalLight );


        // test
        // var geometry  = new THREE.IcosahedronGeometry( 200, 1 );
        var geometry  = new THREE.SphereGeometry( 10, 6, 6 );
        var material = new THREE.MeshPhongMaterial( { color: 0xffaa00, shading: THREE.FlatShading } );
        // var material = new THREE.MeshBasicMaterial( {color: 0xffff00} );
        var mesh = new THREE.Mesh( geometry, material );
        scene.add(mesh);


        renderer.render(scene, camera);
    };
})();