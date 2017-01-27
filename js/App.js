// tmp

(function() {
    'use strict'

    var canvas, renderer;

    var raycaster, mouseScene1, mouseScene2;
    var mousePositionDirty = false;
    var INTERSECTED, currentColor, highlightObjectColor, highlightObjectOpacity;

    var camera;
    var scene1, scene2;

    var gui;
    var cfg = {
        highlightColors: {
            vertex: 0xffffff,
            edge: 0xffffff,
            face: 0xffffff,
        }
    };

    var polyhedralDiagram;

    var views = [
        {
            left: 0,
            bottom: 0,
            width: 0.5,
            height: 1.0,

            // background: new THREE.Color().setRGB( 0.5, 0.5, 0.7 )
            background: new THREE.Color().setRGB( 0.9, 0.9, 0.9 )
            // background: new THREE.Color().setRGB( 1, 1, 1 )
        },

        {
            left: 0.5,
            bottom: 0,
            width: 0.5,
            height: 1.0,

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

                // var material = new THREE.LineBasicMaterial( { 
                //     color: 0xffffff, 
                //     opacity: 1, 
                //     linewidth: 3
                // } );

                // var mesh = new THREE.LineSegments( 
                //     polyhedralDiagram.formGeometry, 
                //     material
                // );

                // scene2.add(mesh);

                // var materialExEdges = new THREE.LineBasicMaterial( { 
                //     color: 0xff0000, 
                //     opacity: 1, 
                //     linewidth: 3
                // } );

                // var meshExEdges = new THREE.LineSegments( 
                //     polyhedralDiagram.formExEdges, 
                //     materialExEdges
                // );
                
                // scene2.add(meshExEdges);

                // scene2.add(polyhedralDiagram.formExForces);
                
                // // var mesh2 = new THREE.Mesh( 
                // //     // new THREE.BoxGeometry( 2, 2, 2 ), 
                // //     new THREE.IcosahedronGeometry(1.5, 0), 
                // //     new THREE.MeshPhongMaterial( { color: 0x156289, shading: THREE.FlatShading } )
                // // );
                // // scene2.add(mesh2);


                // var materialForceFace = new THREE.MeshPhongMaterial( { 
                //         color: 0xffaa00, 
                //         shading: THREE.FlatShading,
                //         opacity: 0.3,
                //         transparent: true,
                //         side: THREE.DoubleSide
                // });

                // var meshForceFace = new THREE.Mesh( polyhedralDiagram.forceGeometry, materialForceFace );
                // scene1.add( meshForceFace );


                // var meshForceEdge = new THREE.LineSegments( polyhedralDiagram.forceEdgeGeometry, material );
                // scene1.add( meshForceEdge );





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
                colors.addColor( cfg.highlightColors, 'vertex' );
                colors.addColor( cfg.highlightColors, 'edge' );
                colors.addColor( cfg.highlightColors, 'face' );
            };
        }
    }

    














    function onWindowResize() {

        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        // backgroundCamera.aspect = window.innerWidth / window.innerHeight;
        // backgroundCamera.updateProjectionMatrix();

        renderer.setSize(window.innerWidth, window.innerHeight);

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


    
    function releaseHighlighted( formEdge ) {
        formEdge.material.color.setHex( currentColor );
        // var e = formEdge.diagramId;
        var f = formEdge.diagramForceFaceId;
        if (f) {
            var forceFace = polyhedralDiagram.diagram.force.maps.faceId2Object[f];
            forceFace.material.color.setHex( highlightObjectColor );
            forceFace.material.opacity = highlightObjectOpacity;
        }
    }



    function render () {
        requestAnimationFrame( render );


        // ray caster temp test


        if (mousePositionDirty) {

            mousePositionDirty = false;
        
            var intersects;

            // raycaster.setFromCamera( mouseScene1, camera );
            // if ( polyhedralDiagram ) {
            //     intersects = raycaster.intersectObjects( polyhedralDiagram.diagram.force.objects.faces.children );
            //     // var intersects = raycaster.intersectObjects( polyhedralDiagram.diagram.force.objects.faces );
            //     // var intersects = raycaster.intersectObjects( scene1.children );
            //     if ( intersects.length > 0 ) {
            //         if ( INTERSECTED != intersects[ 0 ].object ) {
            //             if (INTERSECTED) INTERSECTED.material.opacity = 0.05;

            //             INTERSECTED = intersects[0].object;
            //             INTERSECTED.material.opacity = 1.0;
            //             console.log(intersects[0].object.diagramId);
            //         }
                    
            //     } else {
            //         if (INTERSECTED) INTERSECTED.material.opacity = 0.05;
            //         INTERSECTED = null;
            //     }
            // }

            if ( mouseScene2.x > -1 ) {
                raycaster.setFromCamera( mouseScene2, camera );
            }
            
            
            
            if ( polyhedralDiagram ) {
                // intersects = raycaster.intersectObjects( polyhedralDiagram.diagram.form.objects.edges.children );
                intersects = raycaster.intersectObjects( scene2.children, true );
                
                // var intersects = raycaster.intersectObjects( polyhedralDiagram.diagram.force.objects.faces );
                // var intersects = raycaster.intersectObjects( scene1.children );
                if ( intersects.length > 0 ) {
                    if ( INTERSECTED != intersects[0].object ) {
                        if (INTERSECTED) {
                            // release last highlighted object
                            // INTERSECTED.material.color.setHex( currentColor );
                            releaseHighlighted( INTERSECTED );
                        }

                        INTERSECTED = intersects[0].object;

                        currentColor = INTERSECTED.material.color.getHex();
                        INTERSECTED.material.color.setHex( cfg.highlightColors.edge );
                        // INTERSECTED.material.needsUpdate = true;
                        console.log(intersects[0].object.diagramId, intersects[0].object.diagramForceFaceId);


                        // highlight corresponding force face in scene1
                        var e = INTERSECTED.diagramId;
                        var f = INTERSECTED.diagramForceFaceId;
                        if (e && f) {
                            var forceFace = polyhedralDiagram.diagram.force.maps.faceId2Object[f];
                            highlightObjectColor = forceFace.material.color.getHex();
                            highlightObjectOpacity = forceFace.material.opacity;
                            forceFace.material.color.setHex( cfg.highlightColors.face );
                            forceFace.material.opacity = 1.0;
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
        raycaster.params.Points.threshold = 0.1;

        mouseScene1 = new THREE.Vector2();
        mouseScene2 = new THREE.Vector2();
        
        renderer = new THREE.WebGLRenderer( { canvas: canvas, antialias: true } );
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        // console.log(renderer.sortObjects);

        window.addEventListener('resize', onWindowResize, false);

        canvas.addEventListener('mousemove',  onMouseMove, false);



        camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 10000 );
        camera.position.z = 100;

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
        var geometry  = new THREE.IcosahedronGeometry( 15, 0 );
        var material = new THREE.MeshPhongMaterial( { color: 0xffaa00, shading: THREE.FlatShading } );
        // var material = new THREE.MeshBasicMaterial( {color: 0xffff00} );


        var mesh = new THREE.Object3D();

        var mesh = new THREE.Mesh( geometry, material );
        // scene1.add(mesh);

        


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