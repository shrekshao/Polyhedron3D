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

    var exteriorGreen = 0x009600;


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
                exFaces: new THREE.Object3D(),
                edges: new THREE.Object3D()
            },

            maps: {
                faceId2Object: {},
                edgeId2Object: {},
                exFaceId2Object: {}
            }

            
        },

        colors: {
            exteriorGreen: exteriorGreen
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
                color: exteriorGreen
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
            } )

            // forceFace: new THREE.MeshPhongMaterial( { 
            //     color: 0xffaa00, 
            //     shading: THREE.FlatShading,
            //     opacity: 0.9,
            //     transparent: true,
            //     side: THREE.DoubleSide
            // })

        },

        normalizeUnit: 25,
        arrowUniformLength: 5
    };


    var strengthMax = this.json.strength_scaler.max;
    var strengthMin = this.json.strength_scaler.min;
    var gap = strengthMax - strengthMin;

    // this.strengthScaler = d3.scaleLinear().domain([strengthMin, strengthMax]);

    this.strengthRadiusScaler = d3.scaleLinear().domain([strengthMin, strengthMax])
                                .range([0.04, 0.2]);
    this.strengthColorScaler = d3.scaleLinear()
        .domain([strengthMin, strengthMin + 0.25 * gap, strengthMin + 0.5 * gap, strengthMin + 0.75 * gap, strengthMax])
        .range(['#aaffff', '#78c8e6', '#468cb0', '#14506e', '#001432']);

    this.buildFormDiagram();
    this.buildForceDiagram();

};


(function() {
    'use strict'

    PolyhedralDiagram.prototype.constructor = PolyhedralDiagram;


    PolyhedralDiagram.prototype.buildFormDiagram = function() {
        var json = this.json;

        var geometry = new THREE.Geometry();
        var exEdges = new THREE.Geometry();
        var exForces = this.diagram.form.objects.exForceArrows;

        var verticesOnlyGeometry = new THREE.Geometry();    // temparary used for vertices mapping

        var vec3 = {};
        var vid2vid = {};   //  < geometry idx(int), vid(string) > 
        var vid2vid_i = {}; // < vid(string), geometry idx(int) > 
        var v;

        var i, j;
        var len;

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

            vid2vid[c] = v;
            vid2vid_i[v] = c;
            c++;

            verticesOnlyGeometry.vertices.push(vec3[v]);

        }

        // normalize
        verticesOnlyGeometry.normalize();
        verticesOnlyGeometry.scale( this.diagram.normalizeUnit, this.diagram.normalizeUnit, this.diagram.normalizeUnit );
        // verticesOnlyGeometry.computeBoundingSphere();
        // var offset = verticesOnlyGeometry.boundingSphere.getCenter().negate();
        // var normalizeScale = verticesOnlyGeometry.boundingSphere.radius;


        var lines = {};

        var tmpVec3 = new THREE.Vector3();

        var arrowLen;
        var edge, vertex, arrow;
        var edgesId = [];
        var exEdgesId = [];
        var verticesId = [];
        // var exVerticesId = [];

        var newExternalVerticesPosition = {};

        var edgeInfo;
        var strengthRadius;
        var strength;

        for (edge in json.form.edges) {
            vertex = json.form.edges[edge].vertex;

            if (json.form.edges[edge].external) {
                // exEdges.vertices.push( 
                //     verticesOnlyGeometry.vertices[vid2vid_i[vertex[0]]].clone(), 
                //     verticesOnlyGeometry.vertices[vid2vid_i[vertex[1]]].clone() 
                // );

                exEdgesId.push( edge );

                // exVerticesId.push( vertex[0], vertex[1] );

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
                
                // strengthRadius = this.strengthRadiusScaler( strength );
                strengthRadius = 0.1;

                // vertex[0] is external
                // change its position
                tmpVec3.copy( verticesOnlyGeometry.vertices[vid2vid_i[vertex[0]]] );
                tmpVec3.sub( verticesOnlyGeometry.vertices[vid2vid_i[vertex[1]]] );
                // now tmpVec3 is pointing from 1 to 0 (ex)
                tmpVec3.normalize();
                tmpVec3.multiplyScalar( this.diagram.arrowUniformLength );
                tmpVec3.add( verticesOnlyGeometry.vertices[vid2vid_i[vertex[1]]] );
                newExternalVerticesPosition[ vertex[0] ] = tmpVec3.clone();


                arrow = createCylinderArrowMesh( 
                    // verticesOnlyGeometry.vertices[vid2vid_i[vertex[0]]],
                    tmpVec3, 
                    verticesOnlyGeometry.vertices[vid2vid_i[vertex[1]]], 
                    this.diagram.materials.arrowForce.clone(),
                    strengthRadius
                );
                
                // arrow.material.color = new THREE.Color( this.strengthColorScaler( strength ) );

                arrow.diagramId = edge;
                arrow.diagramForceFaceId = edgeInfo.force_face;

                // temp label
                // will be mapped to mesh object in build force
                this.diagram.force.maps.exFaceId2Object[edgeInfo.force_face] = true;
                
                exForces.add( arrow );
            } else {
                // geometry.vertices.push( vec3[vertex[0]].clone(), vec3[vertex[1]].clone() );
                geometry.vertices.push( 
                    verticesOnlyGeometry.vertices[vid2vid_i[vertex[0]]].clone(), 
                    verticesOnlyGeometry.vertices[vid2vid_i[vertex[1]]].clone() 
                );
                edgesId.push( edge );

                verticesId.push( vertex[0], vertex[1] );
            }

            
            
        }


        // build external edges after changing the external vertices position
        len = exEdgesId.length;
        for ( i = 0; i < len; i++ ) {
            edge = exEdgesId[i];
            vertex = json.form.edges[edge].vertex;

            exEdges.vertices.push( 
                newExternalVerticesPosition[ vertex[0] ].clone(), 
                newExternalVerticesPosition[ vertex[1] ].clone() 
            );
        }







        // build separate meshes
        var edgesParent = this.diagram.form.objects.edges;
        var exEdgesParent = this.diagram.form.objects.exEdges;
        var verticesParent = this.diagram.form.objects.vertices;

        var root = this.diagram.form.objects.root;
        root.add(edgesParent);
        root.add(exEdgesParent);
        root.add(verticesParent);
        root.add(exForces);     // arrow forces

        
        var curMesh;
        var curEdgeGeometry;
        var curMaterial = this.diagram.materials.lineBasic;
        len = geometry.vertices.length;

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

        geometry.normalize();
        geometry.scale( this.diagram.normalizeUnit, this.diagram.normalizeUnit, this.diagram.normalizeUnit );



        // edges
        var edgeGeometry = this.diagram.force.edges = new THREE.Geometry();
        var edge, vertex, arrow;
        for (edge in json.force.edges) {
            vertex = json.force.edges[edge];

            edgeGeometry.vertices.push( geometry.vertices[vid2vid[vertex[0]]].clone(), geometry.vertices[vid2vid[vertex[1]]].clone() );
        }



        // face
        var faces = {};

        var f;
        var face3;
        var face_v;

        var v1, v2, v3, v4;
        
        var face_geometry;
        var face_mesh;

        var direction;

        var strength;

        for (f in json.force.faces_v) {
            face_v = json.force.faces_v[f];

            if (face_v.length === 3) {

                // separate mesh for each face

                v1 = geometry.vertices[ vid2vid[ face_v[0] ] ];
                v2 = geometry.vertices[ vid2vid[ face_v[1] ] ];
                v3 = geometry.vertices[ vid2vid[ face_v[2] ] ];

                face_geometry = new THREE.BufferGeometry();
                face_geometry.addAttribute(
                    'position', 
                    new THREE.BufferAttribute(
                        new Float32Array([ 
                            v1.x, v1.y, v1.z,
                            v2.x, v2.y, v2.z,
                            v3.x, v3.y, v3.z
                        ]),
                        3
                    )
                );

                direction = new THREE.Vector3( 
                    (v1.x + v2.x + v3.x ) / 3,
                    (v1.y + v2.y + v3.y ) / 3,
                    (v1.z + v2.z + v3.z ) / 3
                );

                // face_mesh = new THREE.Mesh( face_geometry, this.diagram.materials.forceFace );
                // face_mesh.diagramId = f;
                // this.diagram.force.objects.faces.add( face_mesh );

            } else if (face_v.length === 4) {

                v1 = geometry.vertices[ vid2vid[ face_v[0] ] ];
                v2 = geometry.vertices[ vid2vid[ face_v[1] ] ];
                v3 = geometry.vertices[ vid2vid[ face_v[2] ] ];
                v4 = geometry.vertices[ vid2vid[ face_v[3] ] ];

                face_geometry = new THREE.BufferGeometry();
                face_geometry.addAttribute(
                    'position', 
                    new THREE.BufferAttribute(
                        new Float32Array([ 
                            v1.x, v1.y, v1.z,
                            v2.x, v2.y, v2.z,
                            v3.x, v3.y, v3.z,
                            v1.x, v1.y, v1.z,
                            v3.x, v3.y, v3.z,
                            v4.x, v4.y, v4.z
                        ]),
                        3
                    )
                );

                direction = new THREE.Vector3( 
                    (v1.x + v2.x + v3.x + v4.x ) / 4,
                    (v1.y + v2.y + v3.y + v4.y ) / 4,
                    (v1.z + v2.z + v3.z + v4.z ) / 4
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
            face_mesh.direction = direction;
            
            // face_mesh.translateOnAxis( face_mesh.direction, 1 );

            // face_mesh.translateOnAxis( face_mesh.direction, -1 );

            // face_mesh.geometry.translate( -face_mesh.direction.x, -face_mesh.direction.y, -face_mesh.direction.z );
            // face_mesh.geometry.scale(0.8, 0.8, 0.8);
            // face_mesh.geometry.translate( face_mesh.direction.x, face_mesh.direction.y, face_mesh.direction.z );

            // face_mesh.translateOnAxis( face_mesh.direction, 1 );

            if ( this.diagram.force.maps.exFaceId2Object[f] ) {
                // ex faces, correspond to ex forces (arrows)
                this.diagram.force.objects.exFaces.add( face_mesh );
                this.diagram.force.maps.exFaceId2Object[f] = face_mesh;
            } else {
                this.diagram.force.objects.faces.add( face_mesh );
                
            }

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


        // this.diagram.force.meshEdges.visible = false;

        var root = this.diagram.force.objects.root;
        root.add(this.diagram.force.meshEdges);
        root.add(this.diagram.force.objects.faces);
        root.add(this.diagram.force.objects.exFaces);

    }
})();




export { PolyhedralDiagram };