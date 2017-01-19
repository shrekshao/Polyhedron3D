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
        },
        force: {
            // geometries: {},
            objects: {
                faces: new THREE.Object3D(),
                edges: new THREE.Object3D()
            }
        },

        materials: {
            lineBasic: new THREE.LineBasicMaterial( { 
                color: 0xffffff, 
                opacity: 1, 
                transparent: false,
                linewidth: 3
            } ),

            lineExternal: new THREE.LineBasicMaterial( { 
                color: 0xff0000, 
                opacity: 1, 
                transparent: false,
                linewidth: 3
            } ),

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

    var geometry = this.diagram.form.edges = new THREE.Geometry();
    var exEdges = this.diagram.form.exEdges = new THREE.Geometry();
    // var exForces = this.exForces = new THREE.Geometry();

    var exForces = this.diagram.form.exForceArrows = new THREE.Object3D();

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
        } else if (json.form.edges[edge].ex_force) {
            tmpVec3.copy( vec3[vertex[1]] );
            tmpVec3.sub( vec3[vertex[0]] );
            arrowLen = tmpVec3.length();
            tmpVec3.multiplyScalar( 1 / arrowLen );
            exForces.add( new THREE.ArrowHelper( tmpVec3, vec3[vertex[0]], arrowLen ) );
        } else {
            geometry.vertices.push( vec3[vertex[0]].clone(), vec3[vertex[1]].clone() );
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


    // build mesh
    this.diagram.form.meshEdges = new THREE.LineSegments( 
        geometry, 
        this.diagram.materials.lineBasic
    );

    this.diagram.form.meshExEdges = new THREE.LineSegments(
        exEdges,
        this.diagram.materials.lineExternal
    );

    
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
                        geometry.vertices[ vid2vid[face_v[0]] ].x, geometry.vertices[ vid2vid[face_v[0]] ].y, geometry.vertices[ vid2vid[face_v[0]] ].z,
                        geometry.vertices[ vid2vid[face_v[1]] ].x, geometry.vertices[ vid2vid[face_v[1]] ].y, geometry.vertices[ vid2vid[face_v[1]] ].z,
                        geometry.vertices[ vid2vid[face_v[2]] ].x, geometry.vertices[ vid2vid[face_v[2]] ].y, geometry.vertices[ vid2vid[face_v[2]] ].z
                    ]),
                    3
                )
            );
            this.diagram.force.objects.faces.add( new THREE.Mesh( face_geometry, this.diagram.materials.forceFace ) );

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
                        geometry.vertices[ vid2vid[face_v[0]] ].x, geometry.vertices[ vid2vid[face_v[0]] ].y, geometry.vertices[ vid2vid[face_v[0]] ].z,
                        geometry.vertices[ vid2vid[face_v[1]] ].x, geometry.vertices[ vid2vid[face_v[1]] ].y, geometry.vertices[ vid2vid[face_v[1]] ].z,
                        geometry.vertices[ vid2vid[face_v[2]] ].x, geometry.vertices[ vid2vid[face_v[2]] ].y, geometry.vertices[ vid2vid[face_v[2]] ].z,
                        geometry.vertices[ vid2vid[face_v[0]] ].x, geometry.vertices[ vid2vid[face_v[0]] ].y, geometry.vertices[ vid2vid[face_v[0]] ].z,
                        geometry.vertices[ vid2vid[face_v[2]] ].x, geometry.vertices[ vid2vid[face_v[2]] ].y, geometry.vertices[ vid2vid[face_v[2]] ].z,
                        geometry.vertices[ vid2vid[face_v[3]] ].x, geometry.vertices[ vid2vid[face_v[3]] ].y, geometry.vertices[ vid2vid[face_v[3]] ].z
                    ]),
                    3
                )
            );
            this.diagram.force.objects.faces.add( new THREE.Mesh( face_geometry, this.diagram.materials.forceFace ) );
        }



        
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