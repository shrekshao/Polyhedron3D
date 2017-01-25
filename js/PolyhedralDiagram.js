var PolyhedralDiagram = function (json) {
    if (json === null) {
        console.log( ' no json object to init the polydral digram pair' );
        return;
    }

    this.json = json;

    this.diagram = {
        form: {
            // geometries: {},
            // objects: {}
            // parentObjects: new THREE.Object3D(),

            objects: {
                vertices: new THREE.Object3D(),
                edges: new THREE.Object3D(),
                exEdges: new THREE.Object3D(),
                exForceArrows: new THREE.Object3D()
            },

            maps: {
                edgeId2Object: {}
            }
        },
        force: {
            // geometries: {},
            objects: {
                faces: new THREE.Object3D(),
                edges: new THREE.Object3D()
            },

            maps: {
                faceId2Object: {},
                edgeId2Object: {}
            }
        },

        materials: {
            lineBasic: new THREE.LineBasicMaterial( { 
                color: 0xffffff, 
                opacity: 1, 
                transparent: false
                // linewidth: 3     // ANGLE limitation
            } ),

            lineExternal: new THREE.LineBasicMaterial( { 
                color: 0xff0000, 
                opacity: 1, 
                transparent: false
                // linewidth: 3
            } ),

            vertex: new THREE.PointsMaterial({
                color: 0xffffff,
                size: 0.5
            }),

            vertexIcosahedron: new THREE.MeshBasicMaterial( { 
                color: 0xffffff, 
                // shading: THREE.FlatShading,
                transparent: false,
            }),

            forceFace: new THREE.MeshBasicMaterial( { 
                color: 0xffaa00, 
                shading: THREE.FlatShading,
                opacity: 0.05,
                transparent: true,
                side: THREE.DoubleSide,

                // blending: THREE.CustomBlending,

                depthWrite: false
            })
            // forceFace: new THREE.MeshPhongMaterial( { 
            //     color: 0xffaa00, 
            //     shading: THREE.FlatShading,
            //     opacity: 0.9,
            //     transparent: true,
            //     side: THREE.DoubleSide
            // })
        }
    };

    this.buildFormDiagram();
    this.buildForceDiagram();

};

PolyhedralDiagram.prototype.constructor = PolyhedralDiagram;


PolyhedralDiagram.prototype.buildFormDiagram = function() {
    var json = this.json;


    // for (var o in this.diagram.form.obejcts) {
    //     this.diagram.form.parentObjects.add( this.diagram.form.obejcts[o] );
    // }


    var geometry = new THREE.Geometry();
    var exEdges = new THREE.Geometry();
    var exForces = this.diagram.form.objects.exForceArrows;

    var vec3 = {};
    var v;

    
    for (v in json.form.vertices) {
        vec3[v] = new THREE.Vector3 ( 
            json.form.vertices[v][0],
            json.form.vertices[v][1],
            json.form.vertices[v][2]
        );

        // geometry.vertices.push(vec3[v]);

    }


    var lines = {};

    var tmpVec3 = new THREE.Vector3();
    var arrowLen;
    var edge, vertex, arrow;
    var edgesId = [];
    var exEdgesId = [];
    var verticesId = [];
    var exVerticesId = [];

    for (edge in json.form.edges) {
        vertex = json.form.edges[edge].vertex;

        // console.log(edge, vertex);

        // geometry.vertices.push( vec3[vertex[0]].clone(), vec3[vertex[1]].clone() );

        // if (json.form.edges[edge].external) {
        //     geometry.colors.push( new THREE.Color(0xff0000), new THREE.Color(0xff0000)  );
        // } else if (json.form.edges[edge].ex_force) {
        //     geometry.colors.push( new THREE.Color(0xffff00), new THREE.Color(0x00ff00)  );
        // } else {
        //     geometry.colors.push( new THREE.Color(0xffffff), new THREE.Color(0xffffff)  );
        // }


        if (json.form.edges[edge].external) {
            exEdges.vertices.push( vec3[vertex[0]].clone(), vec3[vertex[1]].clone() );
            exEdgesId.push( edge );

            exVerticesId.push( vertex[0], vertex[1] );
        } else if (json.form.edges[edge].ex_force) {
            tmpVec3.copy( vec3[vertex[1]] );
            tmpVec3.sub( vec3[vertex[0]] );
            arrowLen = tmpVec3.length();
            tmpVec3.multiplyScalar( 1 / arrowLen );
            arrow = new THREE.ArrowHelper( tmpVec3, vec3[vertex[0]], arrowLen );
            arrow.diagramId = edge;
            exForces.add( arrow );
        } else {
            geometry.vertices.push( vec3[vertex[0]].clone(), vec3[vertex[1]].clone() );
            edgesId.push( edge );

            verticesId.push( vertex[0], vertex[1] );
        }

        
        
    }

    // geometry.center();
    // exEdges.center();

    geometry.computeBoundingBox();
    var offset = geometry.boundingBox.getCenter().negate();
    geometry.translate( offset.x, offset.y, offset.z );

    exEdges.translate( offset.x, offset.y, offset.z );

    exForces.translateX( offset.x );
    exForces.translateY( offset.y );
    exForces.translateZ( offset.z );


    // // build mesh
    // this.diagram.form.meshEdges = new THREE.LineSegments( 
    //     geometry, 
    //     this.diagram.materials.lineBasic
    // );

    // this.diagram.form.meshExEdges = new THREE.LineSegments(
    //     exEdges,
    //     this.diagram.materials.lineExternal
    // );


    // build separate meshes
    var edgesParent = this.diagram.form.objects.edges;
    var exEdgesParent = this.diagram.form.objects.exEdges;
    var verticesParent = this.diagram.form.objects.vertices;

    var i, j;
    var curMesh;
    var curEdgeGeometry;
    var curMaterial = this.diagram.materials.lineBasic;
    var len = geometry.vertices.length;

    
    var vertexAdded = {};

    // edges
    for ( i = 0, j = 0; i < len; i += 2, j ++ ) {
        curEdgeGeometry = new THREE.Geometry();
        curEdgeGeometry.vertices.push( geometry.vertices[i].clone(), geometry.vertices[i+1].clone() );
        curMesh = new THREE.LineSegments( curEdgeGeometry, curMaterial.clone() );
        curMesh.diagramId = edgesId[j];
        curMesh.diagramForceFaceId = this.json.form.edges[curMesh.diagramId].force_face;
        edgesParent.add( curMesh );
    }

    curMaterial = this.diagram.materials.lineExternal;
    len = exEdges.vertices.length;
    // exEdges
    for ( i = 0, j = 0; i < len; i += 2, j ++ ) {
        curEdgeGeometry = new THREE.Geometry();
        curEdgeGeometry.vertices.push( exEdges.vertices[i].clone(), exEdges.vertices[i+1].clone() );
        curMesh = new THREE.LineSegments( curEdgeGeometry, curMaterial.clone() );
        curMesh.diagramId = exEdgesId[j];
        curMesh.diagramForceFaceId = this.json.form.edges[curMesh.diagramId].force_face;
        exEdgesParent.add( curMesh );
    }



    // vertices 
    // single point geometry won't work for picking

    
    var vertexIcosahedronGeometry = new THREE.IcosahedronGeometry(0.2, 0);

    var verticesArray = [];


    // curMaterial = this.diagram.materials.vertex;
    curMaterial = this.diagram.materials.vertexIcosahedron;
    len = geometry.vertices.length;
    var curVertexGeometry;
    var curVertexMesh;
    for ( i = 0 ; i < len; i ++ ) {
        if (!vertexAdded[verticesId[i]]) {
            vertexAdded[verticesId[i]] = true;

            // curVertexGeometry = new THREE.BufferGeometry()
            // curVertexGeometry.addAttribute(
            //     'position', 
            //     new THREE.BufferAttribute(
            //         new Float32Array([ 
            //             geometry.vertices[ i ].x, geometry.vertices[ i ].y, geometry.vertices[ i ].z
            //         ]),
            //         3
            //     )
            // );

            // curVertexMesh = new THREE.Points( curVertexGeometry.clone(), curMaterial.clone() );
            
            // verticesParent.add( curVertexMesh );


            // -------------------------------
            curVertexGeometry = vertexIcosahedronGeometry.clone();
            // curVertexGeometry.position = new THREE.Vector3(geometry.vertices[ i ].x, geometry.vertices[ i ].y, geometry.vertices[ i ].z);
            curVertexGeometry.translate( geometry.vertices[ i ].x, geometry.vertices[ i ].y, geometry.vertices[ i ].z );
            curVertexMesh = new THREE.Mesh( curVertexGeometry.clone(), curMaterial.clone() );
            verticesParent.add( curVertexMesh );


            // --------------------------------------------
            // buffer
            // verticesArray.push( geometry.vertices[ i ].x, geometry.vertices[ i ].y, geometry.vertices[ i ].z );


        }
    }

    len = exEdges.vertices.length;
    for ( i = 0 ; i < len; i ++ ) {
        if (!vertexAdded[exVerticesId[i]]) {
            vertexAdded[exVerticesId[i]] = true;

            // curVertexGeometry = new THREE.BufferGeometry()
            // curVertexGeometry.addAttribute(
            //     'position', 
            //     new THREE.BufferAttribute(
            //         new Float32Array([ 
            //             exEdges.vertices[ i ].x, exEdges.vertices[ i ].y, exEdges.vertices[ i ].z
            //         ]),
            //         3
            //     )
            // );

            // curVertexMesh = new THREE.Points( curVertexGeometry.clone(), curMaterial.clone() );
            
            // verticesParent.add( curVertexMesh );

            // -------------------------------
            curVertexGeometry = vertexIcosahedronGeometry.clone();
            // curVertexGeometry.position = new THREE.Vector3(exEdges.vertices[ i ].x, exEdges.vertices[ i ].y, exEdges.vertices[ i ].z);
            curVertexGeometry.translate( exEdges.vertices[ i ].x, exEdges.vertices[ i ].y, exEdges.vertices[ i ].z );
            curVertexMesh = new THREE.Mesh( curVertexGeometry.clone(), curMaterial.clone() );
            verticesParent.add( curVertexMesh );


            // --------------------------------------------
            // buffer
            // verticesArray.push( exEdges.vertices[ i ].x, exEdges.vertices[ i ].y, exEdges.vertices[ i ].z );
        }
    }




    // points in one mesh

    // var verticesBufferGeometry = new THREE.BufferGeometry();
    // verticesBufferGeometry.addAttribute(
    //     'position', 
    //     new THREE.BufferAttribute(
    //         new Float32Array(verticesArray), 3
    //     )
    // );

    // var verticesMesh = new THREE.Points( verticesBufferGeometry, this.diagram.materials.vertex );

    // verticesParent.add(verticesMesh);
}


PolyhedralDiagram.prototype.buildForceDiagram = function() {
    var json = this.json;

    var vec3 = {};
    var v;

    var geometry = this.diagram.force.geometry = new THREE.Geometry();


    var vid2vid = {};

    var c = 0;
    for (v in json.force.vertices) {
        vec3[v] = new THREE.Vector3 ( 
            json.force.vertices[v][0],
            json.force.vertices[v][1],
            json.force.vertices[v][2]
        );

        geometry.vertices.push(vec3[v].clone());

        // if (!vid2vid[v]) {
            vid2vid[v] = c++;
        // }
        
    }

    geometry.computeBoundingBox();
    var offset = geometry.boundingBox.getCenter().negate();
    geometry.translate( offset.x, offset.y, offset.z );



    // edges
    var edgeGeometry = this.diagram.force.edges = new THREE.Geometry();
    var edge, vertex, arrow;
    for (edge in json.force.edges) {
        vertex = json.force.edges[edge];

        edgeGeometry.vertices.push( vec3[vertex[0]].clone(), vec3[vertex[1]].clone() );
    }

    edgeGeometry.translate( offset.x, offset.y, offset.z );


    // face
    var faces = {};

    var f;
    var face3;
    var face_v;
    
    var face_geometry;
    var face_mesh;

    for (f in json.force.faces_v) {
        face_v = json.force.faces_v[f];

        if (face_v.length === 3) {
            face3 = new THREE.Face3( vid2vid[face_v[0]], vid2vid[face_v[1]], vid2vid[face_v[2]] );
            geometry.faces.push( face3 );



            // separate mesh for each face
            face_geometry = new THREE.BufferGeometry();
            face_geometry.addAttribute(
                'position', 
                new THREE.BufferAttribute(
                    new Float32Array([ 
                        geometry.vertices[ vid2vid[ face_v[0]] ].x, geometry.vertices[ vid2vid[ face_v[0]] ].y, geometry.vertices[ vid2vid[ face_v[0]] ].z,
                        geometry.vertices[ vid2vid[ face_v[1]] ].x, geometry.vertices[ vid2vid[ face_v[1]] ].y, geometry.vertices[ vid2vid[ face_v[1]] ].z,
                        geometry.vertices[ vid2vid[ face_v[2]] ].x, geometry.vertices[ vid2vid[ face_v[2]] ].y, geometry.vertices[ vid2vid[ face_v[2]] ].z
                    ]),
                    3
                )
            );

            // face_mesh = new THREE.Mesh( face_geometry, this.diagram.materials.forceFace );
            // face_mesh.diagramId = f;
            // this.diagram.force.objects.faces.add( face_mesh );

        } else if (face_v.length === 4) {
            geometry.faces.push( new THREE.Face3( vid2vid[face_v[0]], vid2vid[face_v[1]], vid2vid[face_v[2]] ) );
            geometry.faces.push( new THREE.Face3( vid2vid[face_v[0]], vid2vid[face_v[2]], vid2vid[face_v[3]] ) );
            console.log(face_v);


             // separate mesh for each face
            face_geometry = new THREE.BufferGeometry();
            face_geometry.addAttribute(
                'position', 
                new THREE.BufferAttribute(
                    new Float32Array([ 
                        geometry.vertices[ vid2vid[ face_v[0]] ].x, geometry.vertices[ vid2vid[ face_v[0]] ].y, geometry.vertices[ vid2vid[ face_v[0]] ].z,
                        geometry.vertices[ vid2vid[ face_v[1]] ].x, geometry.vertices[ vid2vid[ face_v[1]] ].y, geometry.vertices[ vid2vid[ face_v[1]] ].z,
                        geometry.vertices[ vid2vid[ face_v[2]] ].x, geometry.vertices[ vid2vid[ face_v[2]] ].y, geometry.vertices[ vid2vid[ face_v[2]] ].z,
                        geometry.vertices[ vid2vid[ face_v[0]] ].x, geometry.vertices[ vid2vid[ face_v[0]] ].y, geometry.vertices[ vid2vid[ face_v[0]] ].z,
                        geometry.vertices[ vid2vid[ face_v[2]] ].x, geometry.vertices[ vid2vid[ face_v[2]] ].y, geometry.vertices[ vid2vid[ face_v[2]] ].z,
                        geometry.vertices[ vid2vid[ face_v[3]] ].x, geometry.vertices[ vid2vid[ face_v[3]] ].y, geometry.vertices[ vid2vid[ face_v[3]] ].z
                    ]),
                    3
                )
            );

            // // face_mesh = new THREE.Mesh( face_geometry, this.diagram.materials.forceFace );
            // face_mesh = new THREE.Mesh( face_geometry, this.diagram.materials.forceFace.clone() );
            // face_mesh.diagramId = f;
            // this.diagram.force.objects.faces.add( face_mesh );
        }

        face_mesh = new THREE.Mesh( face_geometry, this.diagram.materials.forceFace.clone() );
        face_mesh.diagramId = f;
        this.diagram.force.objects.faces.add( face_mesh );
        this.diagram.force.maps.faceId2Object[f] = face_mesh;

        
    }

    // normal should read from txt files... (order)
    geometry.computeFaceNormals();
    geometry.computeVertexNormals();




    // build mesh
    this.diagram.force.meshEdges = new THREE.LineSegments( 
        edgeGeometry, 
        this.diagram.materials.lineBasic
    );

    this.diagram.force.meshFaces = new THREE.Mesh(
        geometry,
        this.diagram.materials.forceFace
    );


}