// tmp

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

    var gui;
    var cfg = {
        highlightColors: {

            over: {
                form: 0xffffff,
                force: 0xffffff
            },
            

            click: {
                form: 0xd46a6a,
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



    function handleFileSelect(e) {
        var files = e.target.files; // FileList object

        // files is a FileList of File objects. List some properties.
        console.log('load json file');
        var reader = new FileReader();


        for (var i = 0, f; f = files[i]; i++) {
            reader.readAsText(f, "UTF-8");
            reader.onload = function (e) {
                // console.log( e.target.result );
                var diagramJson = JSON.parse( e.target.result );
                // console.log(diagramJson);

                polyhedralDiagram = new PolyhedralDiagram(diagramJson);


                // scene2.add( polyhedralDiagram.diagram.form.meshEdges );
                // scene2.add( polyhedralDiagram.diagram.form.meshExEdges );
                // scene2.add( polyhedralDiagram.diagram.form.exForceArrows );
                scene2.add( polyhedralDiagram.diagram.form.objects.edges );
                scene2.add( polyhedralDiagram.diagram.form.objects.exEdges );
                scene2.add( polyhedralDiagram.diagram.form.objects.exForceArrows );
                scene2.add( polyhedralDiagram.diagram.form.objects.vertices );

                scene1.add( polyhedralDiagram.diagram.force.meshEdges );
                // scene1.add( polyhedralDiagram.diagram.force.meshFaces );
                scene1.add( polyhedralDiagram.diagram.force.objects.faces );


                var visible = gui.addFolder( 'toggle-visibility' );

                visible.add( polyhedralDiagram.diagram.form.objects.vertices, 'visible' ).name('form-vertices');
                visible.add( polyhedralDiagram.diagram.form.objects.edges, 'visible' ).name('form-edges');
                visible.add( polyhedralDiagram.diagram.form.objects.exEdges, 'visible' ).name('form-ex-edges');
                visible.add( polyhedralDiagram.diagram.form.objects.exForceArrows, 'visible' ).name('form-ex-forces');

                visible.add( polyhedralDiagram.diagram.force.meshEdges, 'visible' ).name('force-edges');
                // visible.add( polyhedralDiagram.diagram.force.meshFaces, 'visible' ).name('force-faces');
                visible.add( polyhedralDiagram.diagram.force.objects.faces, 'visible' ).name('force-faces');

                // var materials = gui.addFolder( 'materials' );
                // materials.add( polyhedralDiagram.diagram.materials.forceFace, 'opacity', 0.0, 1.0 );

                var colors = gui.addFolder( 'highlightColors' );
                colors.addColor( cfg.highlightColors.over, 'form' ).name( 'form-mouseover' );
                colors.addColor( cfg.highlightColors.over, 'force' ).name( 'force-mouseover' );
                colors.addColor( cfg.highlightColors.click, 'form' ).name( 'form-click' );
                colors.addColor( cfg.highlightColors.click, 'force' ).name( 'force-click' );;
            };
        }
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
        console.log('clicked');
        clicked = true;
    }


    
    function releaseHighlightedFace( formEdge ) {
        formEdge.material.color.setHex( currentColor );
        // var e = formEdge.diagramId;
        var f = formEdge.diagramForceFaceId;
        if (f) {
            var forceFace = polyhedralDiagram.diagram.force.maps.faceId2Object[f];
            forceFace.material.color.setHex( highlightObjectColor );
            // console.log( forceFace.material.opacity );
            forceFace.material.opacity = highlightObjectOpacity;
        }
    }

    function releaseHighlightedFaceArray( formVertex ) {
        formVertex.material.color.setHex( currentColor );
        // var e = formEdge.diagramId;
        var farray = formVertex.digramForceFaceIdArray;
        if (farray) {
            var f, forceFace;
            for (f in farray) {
                forceFace = polyhedralDiagram.diagram.force.maps.faceId2Object[ farray[f] ];
                if (forceFace) {
                    forceFace.material.color.setHex( highlightObjectColor );
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

            if ( mouseScene2.x > -1 ) {
                raycaster.setFromCamera( mouseScene2, camera );
            }

            if ( polyhedralDiagram ) {
                // intersects = raycaster.intersectObjects( polyhedralDiagram.diagram.form.objects.edges.children );
                intersects = raycaster.intersectObjects( scene2.children, true );
                
                // var intersects = raycaster.intersectObjects( polyhedralDiagram.diagram.force.objects.faces );
                // var intersects = raycaster.intersectObjects( scene1.children );
                if ( intersects.length > 0 ) {
                    if ( INTERSECTED != intersects[0].object || clicked ) {
                        if (INTERSECTED) {
                            // release last highlighted object
                            // INTERSECTED.material.color.setHex( currentColor );
                            releaseHighlighted( INTERSECTED );
                        }

                        INTERSECTED = intersects[0].object;

                        currentColor = INTERSECTED.material.color.getHex();
                        INTERSECTED.material.color.setHex( highlightColor.form );
                        

                        if (INTERSECTED.diagramType !== 'form_vertex') {
                            console.log(INTERSECTED.diagramId, INTERSECTED.diagramForceFaceId);

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
                            console.log(INTERSECTED.diagramId, INTERSECTED.digramForceFaceIdArray);

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
            
        }

        // renderer.autoClear = true;

    }



    window.onload = function() {

        document.getElementById('files').addEventListener('change', handleFileSelect, false);

        gui = new dat.GUI();
        var tmpList = {
            load_json: function () {
                // console.log('load json file');
                document.getElementById("files").click()
            }
        }

        gui.add(tmpList, 'load_json');

        canvas = document.getElementById( 'webgl-canvas' );

        

        raycaster = new THREE.Raycaster();
        raycaster.linePrecision = 0.1;
        // raycaster.params.Points.threshold = 0.1;

        mouseScene1 = new THREE.Vector2();
        mouseScene2 = new THREE.Vector2();
        
        renderer = new THREE.WebGLRenderer( { canvas: canvas, antialias: true } );
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        // console.log(renderer.sortObjects);

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

        var directionalLight = new THREE.DirectionalLight( 0xffeedd );
        directionalLight.position.set( 1, 1, 1 ).normalize();
        scene1.add( directionalLight );
        
        scene2.add( directionalLight.clone() );


        // test
        var geometry  = new THREE.IcosahedronGeometry( 15, 0 );
        var material = new THREE.MeshPhongMaterial( { color: 0xffaa00, shading: THREE.FlatShading } );
        // var material = new THREE.MeshBasicMaterial( {color: 0xffff00} );


        var mesh = new THREE.Object3D();

        var mesh = new THREE.Mesh( geometry, material );
        // scene1.add(mesh);

        onWindowResize();


        // var mesh2 = new THREE.Mesh( 
        //     // new THREE.BoxGeometry( 2, 2, 2 ), 
        //     new THREE.IcosahedronGeometry(1.5, 0), 
        //     new THREE.MeshPhongMaterial( { color: 0x156289, shading: THREE.FlatShading } )
        // );

        // scene2.add( mesh2 );

        // renderer.render(scene1, camera);
        render();
    };
})();