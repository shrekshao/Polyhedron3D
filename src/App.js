var $ = require("jquery");
var THREE = require('three');
THREE.OrbitControls = require('three-orbit-controls')(THREE);
// THREE.OutlineEffect = require('./lib/OutlineEffect.js')(THREE);
import dat from 'dat-gui'


import { PolyhedralDiagram } from './PolyhedralDiagram'

// const CylinderEdgeHelper = require('./utils/CylinderEdgeHelper');
// const PolyhedralDiagram = require('./PolyhedralDiagram');

// new PolyhedralDiagram.default();


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


    function onloadJsonDiagram(diagramJson) {
        // files is a FileList of File objects. List some properties.
        console.log('json file loaded');

        // guiList.vertex_face = false;
        if (INTERSECTED) {
            releaseHighlighted( INTERSECTED );
        }

        if ( guiList.view ) {
            gui.remove( guiList.view );
        }

        if ( guiList.visible ) {
            gui.removeFolder( 'toggle-visibility' );
        }

        if ( guiList.colors ) {
            gui.removeFolder( 'highlightColors' );
        }

        if (polyhedralDiagram) {
            scene1.remove(polyhedralDiagram.diagram.form.objects.root);
            scene2.remove(polyhedralDiagram.diagram.force.objects.root);
        }

        polyhedralDiagram = new PolyhedralDiagram(diagramJson);

        scene1.add( polyhedralDiagram.diagram.form.objects.root );
        scene2.add( polyhedralDiagram.diagram.force.objects.root );


        var view = guiList.view = gui.add(polyhedralDiagram, 'view', [ 'all', 'interior', 'exterior' ] );
        view.onChange(function (value) {
            polyhedralDiagram.onChangeView(value);
        });


        var visible = guiList.visible = gui.addFolder( 'toggle-visibility' );

        visible.add( polyhedralDiagram.diagram.form.objects.vertices, 'visible' ).name('form-vertices');
        visible.add( polyhedralDiagram.diagram.form.objects.edges, 'visible' ).name('form-edges');
        visible.add( polyhedralDiagram.diagram.form.objects.exEdges, 'visible' ).name('form-ex-edges');
        visible.add( polyhedralDiagram.diagram.form.objects.exForceArrows, 'visible' ).name('form-ex-forces');

        visible.add( polyhedralDiagram.diagram.force.objects.edges, 'visible' ).name('force-edges');
        visible.add( polyhedralDiagram.diagram.force.objects.exEdges, 'visible' ).name('force-ex-edges');
        visible.add( polyhedralDiagram.diagram.force.objects.faces, 'visible' ).name('force-faces');
        visible.add( polyhedralDiagram.diagram.force.objects.exFaces, 'visible' ).name('force-ex-faces');

        // var materials = gui.addFolder( 'materials' );
        // materials.add( polyhedralDiagram.diagram.materials.forceFace, 'opacity', 0.0, 1.0 );

        var colors = guiList.colors = gui.addFolder( 'highlightColors' );
        colors.addColor( cfg.highlightColors.over, 'form' ).name( 'form-mouseover' );
        colors.addColor( cfg.highlightColors.over, 'force' ).name( 'force-mouseover' );
        colors.addColor( cfg.highlightColors.click, 'form' ).name( 'form-click' );
        colors.addColor( cfg.highlightColors.click, 'force' ).name( 'force-click' );


        if (guiList.vertex_face) {
            scaleAllFaces(guiList.vertex_face);
        }
        
    }

    function onloadJsonDiagramFileReader(e) {
        onloadJsonDiagram( JSON.parse( e.target.result ) );
    }


    function handleFileSelect(e) {
        var files = e.target.files; // FileList object

        // files is a FileList of File objects. List some properties.
        // console.log('load json file');
        var reader = new FileReader();


        var f = files[0];

        // for (var i = 0, f; f = files[i]; i++) {
            reader.readAsText(f, "UTF-8");
            reader.onload = onloadJsonDiagramFileReader;
        // }
    }

    



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
    }


    
    function releaseHighlightedFace( formEdge ) {
        formEdge.material.color.setHex( currentColor );
        // var e = formEdge.diagramId;
        var f = formEdge.diagramForceFaceId;
        if (f) {
            var forceFace = polyhedralDiagram.diagram.force.maps.faceId2Object[f];
            // forceFace.material.color.setHex( highlightObjectColor );
            forceFace.material.color.setHex( forceFace.color.getHex() );
            forceFace.material.opacity = highlightObjectOpacity;
        }
    }

    function releaseHighlightedFaceArray( formVertex ) {
        // formVertex.material.color.setHex( currentColor );
        formVertex.material.uniforms.color.value.setHex( currentColor );


        // var e = formEdge.diagramId;
        var farray = formVertex.digramForceFaceIdArray;
        if (farray) {
            var f, forceFace;
            for (f in farray) {
                forceFace = polyhedralDiagram.diagram.force.maps.faceId2Object[ farray[f] ];
                if (forceFace) {
                    // forceFace.material.color.setHex( highlightObjectColor );
                    forceFace.material.color.setHex( forceFace.color.getHex() );
                    // console.log( forceFace.material.opacity );
                    forceFace.material.opacity = highlightObjectOpacity;
                }
            }
            
        }
    }

    function releaseHighlighted( mesh ) {
        if (mesh.diagramType !== 'form_vertex') {
            releaseHighlightedFace( mesh );
        } else {
            releaseHighlightedFaceArray ( mesh );
        }
    }



    function doRayCast( highlightColor, clicked ) {
        if ( mousePositionDirty ) {

            mousePositionDirty = false;
        
            var intersects;

            // if ( mouseScene2.x > -1 ) {
            //     raycaster.setFromCamera( mouseScene2, camera );
            // }

            if ( mouseScene1.x < 1 ) {
                raycaster.setFromCamera( mouseScene1, camera );
            }

            if ( polyhedralDiagram ) {
                // intersects = raycaster.intersectObjects( scene2.children, true );
                intersects = raycaster.intersectObjects( polyhedralDiagram.diagram.form.objects.root.children, true );
                
                if ( intersects.length > 0 ) {
                    if ( INTERSECTED != intersects[0].object || clicked ) {
                        if (INTERSECTED) {
                            // release last highlighted object
                            // INTERSECTED.material.color.setHex( currentColor );
                            releaseHighlighted( INTERSECTED );
                        }

                        INTERSECTED = intersects[0].object;

                        // currentColor = INTERSECTED.material.color.getHex();
                        // INTERSECTED.material.color.setHex( highlightColor.form );
                        

                        if (INTERSECTED.diagramType !== 'form_vertex') {
                            // console.log(INTERSECTED.diagramId, INTERSECTED.diagramForceFaceId);
                            currentColor = INTERSECTED.material.color.getHex();
                            INTERSECTED.material.color.setHex( highlightColor.form );

                            // highlight corresponding force face in scene1
                            var e = INTERSECTED.diagramId;
                            var f = INTERSECTED.diagramForceFaceId;
                            if (e && f) {
                                var forceFace = polyhedralDiagram.diagram.force.maps.faceId2Object[f];
                                highlightObjectColor = forceFace.material.color.getHex();
                                highlightObjectOpacity = forceFace.material.opacity;
                                forceFace.material.color.setHex( highlightColor.force );
                                forceFace.material.opacity = 1.0;
                            }
                        } else {
                            // console.log(INTERSECTED.diagramId, INTERSECTED.digramForceFaceIdArray);
                            currentColor = INTERSECTED.material.uniforms.color.value.getHex();
                            INTERSECTED.material.uniforms.color.value.setHex( highlightColor.form );

                            var e = INTERSECTED.diagramId;
                            var farray = INTERSECTED.digramForceFaceIdArray;
                            if (e && farray) {
                                var f, forceFace;
                                for (f in farray) {
                                    forceFace = polyhedralDiagram.diagram.force.maps.faceId2Object[ farray[f] ];
                                    if (forceFace) {
                                        highlightObjectColor = forceFace.material.color.getHex();
                                        highlightObjectOpacity = forceFace.material.opacity;
                                        forceFace.material.color.setHex( highlightColor.force );
                                        forceFace.material.opacity = 1.0;
                                    }
                                }
                            }
                        }
                        

                    }
                    
                } else {
                    if (INTERSECTED) {
                        // INTERSECTED.material.color.setHex( currentColor );
                        releaseHighlighted( INTERSECTED );
                    }
                    INTERSECTED = null;
                }
            }
        }

    }




    function pick() {

        if (clicked) {
            // try click select
            doRayCast(cfg.highlightColors.click, true);

            if (INTERSECTED) {
                pickingClickSelected = true;
            } else {
                // release
                pickingClickSelected = false;
            }

        } else if (!pickingClickSelected) {
            // mouse over highlight
            doRayCast(cfg.highlightColors.over, false);
        }


        clicked = false;
    }

    function scaleAllFaces(isVertexFace) {
        var s = isVertexFace ? 0.8 : 1.25 ;

        var m = polyhedralDiagram.diagram.force.maps.faceId2Object;
        var face_mesh;
        for (var k in m) {
            face_mesh = m[k];

            face_mesh.geometry.translate( -face_mesh.direction.x, -face_mesh.direction.y, -face_mesh.direction.z );
            face_mesh.geometry.scale( s, s, s );
            face_mesh.geometry.translate( face_mesh.direction.x, face_mesh.direction.y, face_mesh.direction.z );
        }
    }











    function render () {
        requestAnimationFrame( render );


        // ray caster temp test
        pick();


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
        dat.GUI.prototype.removeFolder = function(name) {
            var folder = this.__folders[name];
            if (!folder) {
                return;
            }
            folder.close();
            this.__ul.removeChild(folder.domElement.parentNode);
            delete this.__folders[name];
            this.onResize();
        };

        document.getElementById('files').addEventListener('change', handleFileSelect, false);

        gui = new dat.GUI();
        guiList.loadJson = {
            load_json_file: function () {
                // console.log('load json file');
                document.getElementById("files").click()
            }
        };

        gui.add(guiList.loadJson, 'load_json_file');



        guiList.examples = {
            diagram01: function() {
                $.getJSON('assets/models/test/example_01/diagram.json', onloadJsonDiagram);
            },
            diagram02: function() {
                $.getJSON('assets/models/test/example_02/diagram.json', onloadJsonDiagram);
            },
            diagram03: function() {
                $.getJSON('assets/models/test/example_03/diagram.json', onloadJsonDiagram);
            }
        };

        var exampleDiagramFolder = gui.addFolder('example-diagrams');
        exampleDiagramFolder.add(guiList.examples, 'diagram01');
        exampleDiagramFolder.add(guiList.examples, 'diagram02');
        exampleDiagramFolder.add(guiList.examples, 'diagram03');

        var vfbutton = gui.add(guiList, 'vertex_face');
        vfbutton.onChange(scaleAllFaces);
        // vfbutton.listen();



        // load an example diagram at start
        $.getJSON('assets/models/test/example_03/diagram.json', onloadJsonDiagram);


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

        // var helper = new THREE.CameraHelper( light.shadow.camera );
        // scene1.add( helper );


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