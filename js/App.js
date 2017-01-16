// tmp

(function() {
    'use strict'

    var canvas, renderer;

    var camera;
    var scene1, scene2;






    function onWindowResize() {

        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        // backgroundCamera.aspect = window.innerWidth / window.innerHeight;
        // backgroundCamera.updateProjectionMatrix();

        renderer.setSize(window.innerWidth, window.innerHeight);

    }


    function render () {
        requestAnimationFrame( render );

        renderer.render( scene1, camera );
    }



    window.onload = function() {
        canvas = document.getElementById( 'webgl-canvas' );
        
        renderer = new THREE.WebGLRenderer( { canvas: canvas, antialias: true } );
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);

        window.addEventListener('resize', onWindowResize, false);



        camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 10000 );
        camera.position.z = 100;

        var orbit = new THREE.OrbitControls( camera, renderer.domElement );


        scene1 = new THREE.Scene();

        var ambient = new THREE.AmbientLight( 0x444444 );
        scene1.add( ambient );

        var directionalLight = new THREE.DirectionalLight( 0xffeedd );
        directionalLight.position.set( 1, 1, 1 ).normalize();
        scene1.add( directionalLight );


        // test
        // var geometry  = new THREE.IcosahedronGeometry( 200, 1 );
        var geometry  = new THREE.SphereGeometry( 10, 6, 6 );
        var material = new THREE.MeshPhongMaterial( { color: 0xffaa00, shading: THREE.FlatShading } );
        // var material = new THREE.MeshBasicMaterial( {color: 0xffff00} );


        var mesh = new THREE.Object3D();

        // mesh.add( new THREE.LineSegments(

        //     geometry,

        //     new THREE.LineBasicMaterial( {
        //         color: 0xffffff,
        //         transparent: true,
        //         opacity: 0.5
        //     } )

        // ) );

        // mesh.add( new THREE.Mesh(

        //     geometry,

        //     new THREE.MeshPhongMaterial( {
        //         color: 0x156289,
        //         emissive: 0x072534,
        //         side: THREE.DoubleSide,
        //         shading: THREE.FlatShading
        //     } )

        // ) );

        var mesh = new THREE.Mesh( geometry, material );
        scene1.add(mesh);


        // renderer.render(scene1, camera);
        render();
    };
})();