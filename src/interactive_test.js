var $ = require("jquery");
var THREE = require('three');
THREE.OrbitControls = require('three-orbit-controls')(THREE);
// THREE.OutlineEffect = require('./lib/OutlineEffect.js')(THREE);
import dat from 'dat-gui'


// import { PolyhedralDiagram } from './PolyhedralDiagram'



(function() {
    'use strict'

    var canvas, renderer;

    var raycaster, mouseScene1, mouseScene2;
    var mousePositionDirty = false;
    var INTERSECTED, currentColor, highlightObjectColor, highlightObjectOpacity;
    var clicked = false, pickingClickSelected = false;

    var camera;
    var scene1, scene2;
    var scenes;

    var tmpVec3 = new THREE.Vector3();



    // var outlineEffect;

    var gui;
    var guiList = {
        loadJson: null,
        examples: null,

        vertex_face: false,

        visible: null,
        colors: null
    };

    var cfg = {
        highlightColors: {

            over: {
                form: 0xffffff,
                force: 0xffffff
            },
            

            click: {
                form: 0xff2a2a,
                force: 0xd46a6a
            }
        }
    };

    var polyhedralDiagram;

    var views = [
        {
            left: 0,
            bottom: 0,
            width: 0.5,
            height: 1.0,

            // updated in window resize
            window: {
                left: 0,
                bottom: 0,
                width: 0.5,
                height: 1.0
            },

            // background: new THREE.Color().setRGB( 0.5, 0.5, 0.7 )
            background: new THREE.Color().setRGB( 0.9, 0.9, 0.9 )
            // background: new THREE.Color().setRGB( 1, 1, 1 )
        },

        {
            left: 0.5,
            bottom: 0,
            width: 0.5,
            height: 1.0,

            // updated in window resize
            window: {
                left: 0,
                bottom: 0,
                width: 0.5,
                height: 1.0
            },

            // background: new THREE.Color().setRGB( 0.5, 0.5, 0.7 )
            background: new THREE.Color().setRGB( 0.9, 0.9, 0.9 )
            // background: new THREE.Color().setRGB( 1, 1, 1 )
        }
    ];








    function onWindowResize() {

        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        // backgroundCamera.aspect = window.innerWidth / window.innerHeight;
        // backgroundCamera.updateProjectionMatrix();

        renderer.setSize(window.innerWidth, window.innerHeight);

        var view;
        for ( var ii = 0; ii < views.length; ++ii ) {
            view = views[ii];

            view.window.left   = Math.floor( window.innerWidth  * view.left );
            view.window.bottom = Math.floor( window.innerHeight * view.bottom );
            view.window.width  = Math.floor( window.innerWidth  * view.width );
            view.window.height = Math.floor( window.innerHeight * view.height );
        }

    }

    function onMouseMove( event ) {

        event.preventDefault();

        // var tmp = ( event.clientX / window.innerWidth * 2 ) * 2;

        // mouseScene1.x = tmp - 1;
        mouseScene1.x = ( event.clientX / window.innerWidth * 2 ) * 2 - 1;
        mouseScene1.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

        mouseScene2.x = mouseScene1.x - 2;
        mouseScene2.y = mouseScene1.y;

        mousePositionDirty = true;

    }





    function onMouseClick( event ) {
        // console.log('clicked');
        clicked = true;


        // tmpVec3.set(
        //     ( event.clientX / window.innerWidth ) * 2 - 1,
        //     - ( event.clientY / window.innerHeight ) * 2 + 1,
        //     0.5 );
        tmpVec3.set( mouseScene1.x, mouseScene1.y, 0.5 )

        tmpVec3.unproject( camera );

        var dir = tmpVec3.sub( camera.position ).normalize();

        var distance = - camera.position.z / dir.z;

        var pos = camera.position.clone().add( dir.multiplyScalar( distance ) );

        var dis = pos.length();
        pos.normalize();


        var vertexShapeGeometry = new THREE.SphereBufferGeometry(0.25, 8, 6);
        var vertexMesh = new THREE.Mesh( vertexShapeGeometry );
        vertexMesh.translateOnAxis(pos, dis);
        

        scene1.add( vertexMesh );
    }


    // function pick() {

    //     if (clicked) {
    //         // try click select
    //         doRayCast(cfg.highlightColors.click, true);

    //         if (INTERSECTED) {
    //             pickingClickSelected = true;
    //         } else {
    //             // release
    //             pickingClickSelected = false;
    //         }

    //     } else if (!pickingClickSelected) {
    //         // mouse over highlight
    //         doRayCast(cfg.highlightColors.over, false);
    //     }


    //     clicked = false;
    // }











    function render () {
        requestAnimationFrame( render );


        // ray caster temp test
        // pick();


        var view;
        for ( var ii = 0; ii < views.length; ++ii ) {
            view = views[ii];

            renderer.setViewport( view.window.left, view.window.bottom, view.window.width, view.window.height );
            renderer.setScissor( view.window.left, view.window.bottom, view.window.width, view.window.height );
            renderer.setScissorTest( true );
            renderer.setClearColor( view.background );
            camera.aspect = view.window.width / view.window.height;
            camera.updateProjectionMatrix();

            renderer.render( view.scene, camera );
            // outlineEffect.render( view.scene, camera );
            
        }

        // renderer.autoClear = true;

    }



    window.onload = function() {



        canvas = document.getElementById( 'webgl-canvas' );

        

        raycaster = new THREE.Raycaster();
        raycaster.linePrecision = 0.1;
        // raycaster.params.Points.threshold = 0.1;

        mouseScene1 = new THREE.Vector2();
        mouseScene2 = new THREE.Vector2();
        
        renderer = new THREE.WebGLRenderer( { canvas: canvas, antialias: true } );
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        

        window.addEventListener('resize', onWindowResize, false);

        canvas.addEventListener('mousemove',  onMouseMove, false);
        canvas.addEventListener('click',  onMouseClick, false);



        camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 10000 );
        camera.position.z = 100;

        var orbit = new THREE.OrbitControls( camera, renderer.domElement );


        scene1 = new THREE.Scene();
        scene2 = new THREE.Scene();
        views[0].scene = scene1;
        views[1].scene = scene2;

        var ambient = new THREE.AmbientLight( 0x444444 );
        scene1.add( ambient );
        scene2.add( ambient.clone() );

        var light = new THREE.DirectionalLight( 0xffffff );
        // light.position.set( 1, 1, 1 ).normalize();
        light.position.set( 0, 30, 0 );
        light.shadow.camera.left = -30; // or whatever value works for the scale of your scene
        light.shadow.camera.right = 30;
        light.shadow.camera.top = 30;
        light.shadow.camera.bottom = -30;
        light.shadow.camera.near = 0.01;
        light.shadow.camera.far = 100;
        light.castShadow = true;
        
        scene1.add( light );
        scene2.add( light.clone() );

        var helper = new THREE.CameraHelper( light.shadow.camera );
        scene1.add( helper );


        // ground plane for shadow effects
        var FLOOR = - 23;
        var geometry = new THREE.PlaneBufferGeometry( 100, 100 );
        // var planeMaterial = new THREE.MeshLambertMaterial( { color: 0xdddddd } );
        var planeMaterial = new THREE.ShadowMaterial();
        planeMaterial.opacity = 0.05;
        var ground = new THREE.Mesh( geometry, planeMaterial );
        ground.position.set( 0, FLOOR, 0 );
        ground.rotation.x = - Math.PI / 2;
        ground.scale.set( 100, 100, 100 );
        ground.castShadow = false;
        ground.receiveShadow = true;
        scene1.add( ground );
        scene2.add( ground.clone() );
        

        onWindowResize();

        render();
    };
})();