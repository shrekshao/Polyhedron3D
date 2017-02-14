var THREE = require('three');
var d3 = require('d3-scale');
import { createCylinderMesh } from './utils/CylinderEdgeHelper'
import { createCylinderArrowMesh } from './utils/CylinderArrowHelper'

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
            

            objects: {
                root: new THREE.Object3D(),

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
                root: new THREE.Object3D(),

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
                // color: 0xffffff, 
                color: 0x000000,
                opacity: 1, 
                transparent: false
                // linewidth: 3     // ANGLE limitation
            } ),

            lineForce: new THREE.LineBasicMaterial( {
                color: 0xcccccc,
                transparent: false
            } ),

            lineExternal: new THREE.LineDashedMaterial( { 
                color: 0xcccccc, 
                dashSize: 0.3,
                gapSize: 0.1,
                linewidth: 1        // ANGLE limitation
            } ),

            cylinderBasic: new THREE.MeshBasicMaterial( {
                color: 0x000000
            } ),

            cylinderExternal: new THREE.MeshBasicMaterial( {
                color: 0x888888
            } ),

            arrowForce: new THREE.MeshBasicMaterial( {
                color: 0x009600
            } ),

            // arrow: new THREE.LineBasicMaterial( { 
            //     color: 0x000000
            // } ),
            arrow: 0x009600,

            vertex: new THREE.PointsMaterial({
                color: 0x000000,
                size: 0.5
            }),

            vertexIcosahedron: new THREE.MeshBasicMaterial( { 
                color: 0x000000, 
                // shading: THREE.FlatShading,
                transparent: false,
            }),

            vertexContour: new THREE.ShaderMaterial( {

                uniforms: {
                    color: { 
                        value: new THREE.Color( 0xcccccc )
                    },
                    outlineColor: {
                        value: new THREE.Color( 0x000000 )
                    }
                },
                // attributes: {
                //     vertexOpacity: { value: [] }
                // },
                vertexShader: require( './glsl/contourNode.vert.glsl' ),
                fragmentShader: require( './glsl/contourNode.frag.glsl' )

            } ),

            forceFace: new THREE.MeshBasicMaterial( { 
                color: 0x156289, 
                shading: THREE.FlatShading,
                // opacity: 0.05,
                opacity: 0.1,
                transparent: true,
                side: THREE.DoubleSide,

                // blending: THREE.AdditiveBlending,

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


    var strengthMax = this.json.strength_scaler.max;
    var strengthMin = this.json.strength_scaler.min;
    var gap = strengthMax - strengthMin;

    // this.strengthScaler = d3.scaleLinear().domain([strengthMin, strengthMax]);

    this.strengthRadiusScaler = d3.scaleLinear().domain([strengthMin, strengthMax])
                                .range([0.01, 0.2]);
    this.strengthColorScaler = d3.scaleLinear()
        .domain([strengthMin, strengthMin + 0.25 * gap, strengthMin + 0.5 * gap, strengthMin + 0.75 * gap, strengthMax])
        .range(['#aaffff', '#78c8e6', '#468cb0', '#14506e', '#001432']);

    this.buildFormDiagram();
    this.buildForceDiagram();

};

PolyhedralDiagram.prototype.constructor = PolyhedralDiagram;


PolyhedralDiagram.prototype.buildFormDiagram = function() {
    var json = this.json;

    var geometry = new THREE.Geometry();
    var exEdges = new THREE.Geometry();
    var exForces = this.diagram.form.objects.exForceArrows;

    var verticesOnlyGeometry = new THREE.Geometry();    // temparary used for vertices mapping

    var vec3 = {};
    var vid2vid = {};
    var v;

    var c = 0;
    for (v in json.form.vertices) {
        vec3[v] = new THREE.Vector3 ( 
            // json.form.vertices[v][0],
            // json.form.vertices[v][1],
            // json.form.vertices[v][2]

            // Rhinos coordinate system
            json.form.vertices[v][0],
            json.form.vertices[v][2],
            - json.form.vertices[v][1]
        );

        vid2vid[c++] = v;

        verticesOnlyGeometry.vertices.push(vec3[v]);

    }


    var lines = {};

    var tmpVec3 = new THREE.Vector3();
    var arrowLen;
    var edge, vertex, arrow;
    var edgesId = [];
    var exEdgesId = [];
    var verticesId = [];
    var exVerticesId = [];

    var edgeInfo;
    var strengthRadius;
    var strength;

    for (edge in json.form.edges) {
        vertex = json.form.edges[edge].vertex;

        if (json.form.edges[edge].external) {
            exEdges.vertices.push( vec3[vertex[0]].clone(), vec3[vertex[1]].clone() );
            exEdgesId.push( edge );

            exVerticesId.push( vertex[0], vertex[1] );
        } else if (json.form.edges[edge].ex_force) {
            // tmpVec3.copy( vec3[vertex[1]] );
            // tmpVec3.sub( vec3[vertex[0]] );
            // arrowLen = tmpVec3.length();
            // tmpVec3.multiplyScalar( 1 / arrowLen );
            // arrow = new THREE.ArrowHelper( tmpVec3, vec3[vertex[0]], arrowLen, this.diagram.materials.arrow );
            // arrow.diagramId = edge;
            // exForces.add( arrow );

            edgeInfo = this.json.form.edges[edge];
            strength = this.json.force_face_2_strength[edgeInfo.force_face];
            
            strengthRadius = this.strengthRadiusScaler( strength );
            // strengthRadius = 0.25;

            // arrow = createCylinderMesh( 
            //     vec3[vertex[0]],
            //     vec3[vertex[1]],
            //     this.diagram.materials.arrowForce.clone(),
            //     0,
            //     strengthRadius
            // );

            arrow = createCylinderArrowMesh( 
                vec3[vertex[0]],
                vec3[vertex[1]],
                this.diagram.materials.arrowForce.clone(),
                0.1
            );
            
            // arrow.material.color = new THREE.Color( this.strengthColorScaler( strength ) );

            arrow.diagramId = edge;
            arrow.diagramForceFaceId = edgeInfo.force_face;
            
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

    verticesOnlyGeometry.translate( offset.x, offset.y, offset.z );


    // build separate meshes
    var edgesParent = this.diagram.form.objects.edges;
    var exEdgesParent = this.diagram.form.objects.exEdges;
    var verticesParent = this.diagram.form.objects.vertices;

    var root = this.diagram.form.objects.root;
    root.add(edgesParent);
    root.add(exEdgesParent);
    root.add(verticesParent);
    root.add(exForces);     // arrow forces

    var i, j;
    var curMesh;
    var curEdgeGeometry;
    var curMaterial = this.diagram.materials.lineBasic;
    var len = geometry.vertices.length;

    var strength;

    
    var vertexAdded = {};

    // edges
    for ( i = 0, j = 0; i < len; i += 2, j ++ ) {
        // curEdgeGeometry = new THREE.Geometry();
        // curEdgeGeometry.vertices.push( geometry.vertices[i].clone(), geometry.vertices[i+1].clone() );
        // curMesh = new THREE.LineSegments( curEdgeGeometry, curMaterial.clone() );
        // curMesh.diagramId = edgesId[j];
        // curMesh.diagramForceFaceId = this.json.form.edges[curMesh.diagramId].force_face;
        // curMesh.diagramType = 'form_edge';
        //edgesParent.add( curMesh );


        edgeInfo = this.json.form.edges[edgesId[j]];
        strength = this.json.force_face_2_strength[edgeInfo.force_face];

        strengthRadius = this.strengthRadiusScaler( strength );

        // cylinder edge
        curMesh = createCylinderMesh( 
                geometry.vertices[i], 
                geometry.vertices[i+1], 
                this.diagram.materials.cylinderBasic.clone(),
                strengthRadius
        );
        curMesh.diagramId = edgesId[j];
        curMesh.diagramForceFaceId = edgeInfo.force_face;
        curMesh.diagramType = 'form_edge';
        edgesParent.add( curMesh );

        curMesh.material.color = new THREE.Color( this.strengthColorScaler( strength ) );
        this.diagram.force.objects.faces
    }

    curMaterial = this.diagram.materials.lineExternal;
    len = exEdges.vertices.length;
    // exEdges
    for ( i = 0, j = 0; i < len; i += 2, j ++ ) {
        curEdgeGeometry = new THREE.Geometry();
        curEdgeGeometry.vertices.push( exEdges.vertices[i].clone(), exEdges.vertices[i+1].clone() );
        curEdgeGeometry.computeLineDistances(); // for dashed line material
        curMesh = new THREE.LineSegments( curEdgeGeometry, curMaterial.clone() );
        curMesh.diagramId = exEdgesId[j];
        curMesh.diagramForceFaceId = this.json.form.edges[curMesh.diagramId].force_face;
        curMesh.diagramType = 'form_ex_edge';
        exEdgesParent.add( curMesh );
    }



    // vertices 
    // single point geometry won't work for picking

    
    // var vertexShapeGeometry = new THREE.IcosahedronGeometry(0.2, 0);
    var vertexShapeGeometry = new THREE.SphereBufferGeometry(0.25, 8, 6);
    // var vertexShapeGeometry = new THREE.BoxGeometry( 0.2, 0.2, 0.2 );

    var verticesArray = [];


    // curMaterial = this.diagram.materials.vertex;
    // curMaterial = this.diagram.materials.vertexIcosahedron;
    curMaterial = this.diagram.materials.vertexContour;
    // len = geometry.vertices.length;
    len = verticesOnlyGeometry.vertices.length;
    var curVertexGeometry;
    var curVertexMesh;

    // vertex 2 force face array
    var v2fa = this.json.form.vertices_2_force_faces;
    var vex = this.json.form.vertices_external;

    for ( i = 0 ; i < len; i ++ ) {

        if ( vex[vid2vid [i] ] === 1 ) {
            // external vertex, don't draw
            continue;
        }

        curVertexGeometry = vertexShapeGeometry.clone();
        curVertexGeometry.translate( verticesOnlyGeometry.vertices[ i ].x, verticesOnlyGeometry.vertices[ i ].y, verticesOnlyGeometry.vertices[ i ].z );
        curVertexMesh = new THREE.Mesh( curVertexGeometry.clone(), curMaterial.clone() );
        curVertexMesh.diagramId = vid2vid[i];
        curVertexMesh.digramForceFaceIdArray = v2fa[ curVertexMesh.diagramId ];
        curVertexMesh.diagramType = 'form_vertex';
        verticesParent.add( curVertexMesh );
    }
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
            // json.force.vertices[v][0],
            // json.force.vertices[v][1],
            // json.force.vertices[v][2]

            // Rhinos coordinate system
            json.force.vertices[v][0],
            json.force.vertices[v][2],
            - json.force.vertices[v][1]
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

    var strength;

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

        strength = this.json.force_face_2_strength[ f ];
        face_mesh.color = new THREE.Color( this.strengthColorScaler(strength) );
        face_mesh.material.color = face_mesh.color.clone();

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
        this.diagram.materials.lineForce
    );


    var root = this.diagram.force.objects.root;
    root.add(this.diagram.force.meshEdges);
    root.add(this.diagram.force.objects.faces);


}


export { PolyhedralDiagram };