var THREE = require('three');
// import { createCylinderMesh } from './CylinderEdgeHelper'

function createCylinderArrowMesh(pointX, pointY, material, radius, radiusCone, edgeLengthRatio) {
    if (radius === undefined) {
        radius = 1;
    }

    if (radiusCone === undefined) {
        radiusCone = 2 * radius;
    }

    edgeLengthRatio = edgeLengthRatio !== undefined ? edgeLengthRatio : 0.7 ;

    var direction = new THREE.Vector3().subVectors(pointY, pointX);
    var pointMid = new THREE.Vector3().addVectors(pointX, edgeLengthRatio * direction);

    var orientation = new THREE.Matrix4();
    orientation.lookAt(pointX, pointY, new THREE.Object3D().up);
    orientation.multiply(new THREE.Matrix4().set(1, 0, 0, 0,
        0, 0, 1, 0,
        0, -1, 0, 0,
        0, 0, 0, 1));

    var l = direction.length();

    var edgeGeometry = new THREE.CylinderGeometry(radius, radius, edgeLengthRatio * l, 8, 1);
    var coneGeometry = new THREE.CylinderGeometry(0, radiusCone, (1-edgeLengthRatio) * l, 8, 1);

    // var translateE = new THREE.Matrix4().makeTranslation( 0,  -(0.5 - 0.5 * edgeLengthRatio) * l, 0 );
    edgeGeometry.translate( 0,  -(0.5 - 0.5 * edgeLengthRatio) * l, 0 )

    var translate = new THREE.Matrix4().makeTranslation( 0,  (0.5 - 0.5 * (1 - edgeLengthRatio)) * l, 0 );
    // var translate = new THREE.Matrix4().makeTranslation( 0, 0, 0 );

    edgeGeometry.merge(coneGeometry, translate);

    var arrow = new THREE.Mesh(edgeGeometry, material);

    arrow.applyMatrix(orientation);
    // position based on midpoints - there may be a better solution than this
    arrow.position.x = (pointY.x + pointX.x) / 2;
    arrow.position.y = (pointY.y + pointX.y) / 2;
    arrow.position.z = (pointY.z + pointX.z) / 2;

    // var cylinder = createCylinderMesh(pointX, pointMid, material, radius);
    // var cone = createCylinderMesh(pointMid, pointY, material, radius, 0);


    
    return arrow;
}






// function createCylinderArrowMesh(pointX, pointY, material, radius, radiusCone, coneLengthRatio, radialSegments, heightSegments, openEnded, thetaStart, thetaLength) {
//     if (radius === undefined) {
//         radius = 1;
//     }

//     if (radiusCone === undefined) {
//         radiusCone = 2 * radius;
//     }

//     if (coneLengthRatio === undefined) {
//         coneLengthRatio = 0.3;
//     }

//     var direction = new THREE.Vector3().subVectors(pointY, pointX);
//     var orientation = new THREE.Matrix4();
//     orientation.lookAt(pointX, pointY, new THREE.Object3D().up);
//     orientation.multiply(new THREE.Matrix4().set(1, 0, 0, 0,
//         0, 0, 1, 0,
//         0, -1, 0, 0,
//         0, 0, 0, 1));

    
//     var geometry = new THREE.BufferGeometry();

//     // buffers
//     var indices = [];
//     var vertices = [];
//     var normals = [];
//     var uvs = [];

//     // global param
//     var scope = geometry;

// 	var radiusTop = radius;
// 	var radiusBottom = radius;
// 	var height = direction.length();

// 	radialSegments = Math.floor( radialSegments ) || 8;
// 	heightSegments = Math.floor( heightSegments ) || 1;

// 	openEnded = openEnded !== undefined ? openEnded : false;
// 	thetaStart = thetaStart !== undefined ? thetaStart : 0.0;
// 	thetaLength = thetaLength !== undefined ? thetaLength : 2.0 * Math.PI;

//     // helper variables

// 	var index = 0;
// 	var indexOffset = 0;
// 	var indexArray = [];
// 	var halfHeight = height / 2;
// 	var groupStart = 0;

//     generateTorso();

//     geometry.setIndex( indices );
//     geometry.addAttribute('position', new Float32Array( vertices, 3 ) );
//     // geometry.addAttribute('normal', new Float32Array( normals, 3 ) );
//     // geometry.addAttribute('uv', new Float32Array( uvs, 2 ) );

//     geometry.applyMatrix(orientation);

//     var edge = new THREE.Mesh(geometry, material);
//     // edge.applyMatrix(orientation);
//     // position based on midpoints - there may be a better solution than this
//     edge.position.x = (pointY.x + pointX.x) / 2;
//     edge.position.y = (pointY.y + pointX.y) / 2;
//     edge.position.z = (pointY.z + pointX.z) / 2;
//     return edge;




//     function generateTorso() {

// 		var x, y;
// 		var normal = new THREE.Vector3();
// 		var vertex = new THREE.Vector3();

// 		var groupCount = 0;

// 		// this will be used to calculate the normal
// 		var slope = ( radiusBottom - radiusTop ) / height;

// 		// generate vertices, normals and uvs

// 		for ( y = 0; y <= heightSegments; y ++ ) {

// 			var indexRow = [];

// 			var v = y / heightSegments;

// 			// calculate the radius of the current row

// 			var radius = v * ( radiusBottom - radiusTop ) + radiusTop;

// 			for ( x = 0; x <= radialSegments; x ++ ) {

// 				var u = x / radialSegments;

// 				var theta = u * thetaLength + thetaStart;

// 				var sinTheta = Math.sin( theta );
// 				var cosTheta = Math.cos( theta );

// 				// vertex

// 				vertex.x = radius * sinTheta;
// 				vertex.y = - v * height + halfHeight;
// 				vertex.z = radius * cosTheta;
// 				vertices.push( vertex.x, vertex.y, vertex.z );

// 				// normal

// 				normal.set( sinTheta, slope, cosTheta ).normalize();
// 				normals.push( normal.x, normal.y, normal.z );

// 				// uv

// 				uvs.push( u, 1 - v );

// 				// save index of vertex in respective row

// 				indexRow.push( index ++ );

// 			}

// 			// now save vertices of the row in our index array

// 			indexArray.push( indexRow );

// 		}

// 		// generate indices

// 		for ( x = 0; x < radialSegments; x ++ ) {

// 			for ( y = 0; y < heightSegments; y ++ ) {

// 				// we use the index array to access the correct indices

// 				var a = indexArray[ y ][ x ];
// 				var b = indexArray[ y + 1 ][ x ];
// 				var c = indexArray[ y + 1 ][ x + 1 ];
// 				var d = indexArray[ y ][ x + 1 ];

// 				// faces

// 				indices.push( a, b, d );
// 				indices.push( b, c, d );

// 				// update group counter

// 				groupCount += 6;

// 			}

// 		}

// 		// add a group to the geometry. this will ensure multi material support

// 		scope.addGroup( groupStart, groupCount, 0 );

// 		// calculate new start value for groups

// 		groupStart += groupCount;

// 	}
// }

export { createCylinderArrowMesh };