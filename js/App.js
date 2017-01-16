// tmp

(function() {
    'use strict'

    var canvas, renderer;

    var camera;
    var scene1, scene2;



    var views = [
        {
            left: 0,
            bottom: 0,
            width: 0.5,
            height: 1.0,

            background: new THREE.Color().setRGB( 0.5, 0.5, 0.7 )
        },

        {
            left: 0.5,
            bottom: 0,
            width: 0.5,
            height: 1.0,

            // background: new THREE.Color().setRGB( 0.7, 0.7, 0.7 )
            background: new THREE.Color().setRGB( 0.5, 0.5, 0.7 )
        }
    ];


    function onWindowResize() {

        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        // backgroundCamera.aspect = window.innerWidth / window.innerHeight;
        // backgroundCamera.updateProjectionMatrix();

        renderer.setSize(window.innerWidth, window.innerHeight);

    }


    function render () {
        requestAnimationFrame( render );
        // renderer.render( scene1, camera );

        


        var view;
        for ( var ii = 0; ii < views.length; ++ii ) {
            view = views[ii];

            var left   = Math.floor( window.innerWidth  * view.left );
            var bottom = Math.floor( window.innerHeight * view.bottom );
            var width  = Math.floor( window.innerWidth  * view.width );
            var height = Math.floor( window.innerHeight * view.height );
            renderer.setViewport( left, bottom, width, height );
            renderer.setScissor( left, bottom, width, height );
            renderer.setScissorTest( true );
            renderer.setClearColor( view.background );
            camera.aspect = width / height;
            camera.updateProjectionMatrix();


            // tmp hard code
            if (ii === 0) {
                // renderer.clear();
                renderer.render( scene1, camera );
                // renderer.autoClear = false;
            } else {
                // renderer.clearDepth();
                renderer.render( scene2, camera );
                // renderer.autoClear = true;
            }
            
        }

        // renderer.autoClear = true;

    }



    window.onload = function() {
        canvas = document.getElementById( 'webgl-canvas' );
        
        renderer = new THREE.WebGLRenderer( { canvas: canvas, antialias: true } );
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);

        window.addEventListener('resize', onWindowResize, false);



        camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 10000 );
        camera.position.z = 10;

        var orbit = new THREE.OrbitControls( camera, renderer.domElement );


        scene1 = new THREE.Scene();
        scene2 = new THREE.Scene();

        var ambient = new THREE.AmbientLight( 0x444444 );
        scene1.add( ambient );

        scene2.add( ambient.clone() );

        var directionalLight = new THREE.DirectionalLight( 0xffeedd );
        directionalLight.position.set( 1, 1, 1 ).normalize();
        scene1.add( directionalLight );
        
        scene2.add( directionalLight.clone() );


        // test
        // var geometry  = new THREE.IcosahedronGeometry( 200, 1 );
        var geometry  = new THREE.SphereGeometry( 1.5, 6, 6 );
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


        var mesh2 = new THREE.Mesh( 
            new THREE.BoxGeometry( 2, 2, 2 ), 
            new THREE.MeshPhongMaterial( { color: 0x156289, shading: THREE.FlatShading } )
        );

        scene2.add( mesh2 );

        // renderer.render(scene1, camera);
        render();
    };
})();