var THREE = require('three');
// import { createCylinderMesh } from './CylinderEdgeHelper'

function createCylinderArrowMesh(pointX, pointY, material, radius, radiusCone, edgeLengthRatio) {
    
    var direction = new THREE.Vector3().subVectors(pointY, pointX);
    var l = direction.length();

    if (radius === undefined) {
        radius = l * 0.01;
    }

    // fixedConeLength = fixedConeLength !== undefined ? fixedConeLength : 4;

    if (radiusCone === undefined) {
        radiusCone = 2 * radius;
    }

    // edgeLengthRatio = edgeLengthRatio !== undefined ? edgeLengthRatio : 0.7 ;

    var pointMid = new THREE.Vector3().addVectors(pointX, edgeLengthRatio * direction);

    var orientation = new THREE.Matrix4();
    orientation.lookAt(pointX, pointY, new THREE.Object3D().up);
    orientation.multiply(new THREE.Matrix4().set(1, 0, 0, 0,
        0, 0, 1, 0,
        0, -1, 0, 0,
        0, 0, 0, 1));

    var edgeGeometry;
    var coneGeometry;
    if (edgeLengthRatio !== undefined) {
        edgeGeometry = new THREE.CylinderGeometry(radius, radius, edgeLengthRatio * l, 8, 1);
        coneGeometry = new THREE.CylinderGeometry(0, radiusCone, (1-edgeLengthRatio) * l, 8, 1);
        edgeGeometry.translate( 0,  -(0.5 - 0.5 * edgeLengthRatio) * l, 0 );
        var translate = new THREE.Matrix4().makeTranslation( 0,  (0.5 - 0.5 * (1 - edgeLengthRatio)) * l, 0 );
        edgeGeometry.merge(coneGeometry, translate);
    } else {
        // fixed length cone
        var fixedConeLength = 1;
        edgeGeometry = new THREE.CylinderGeometry(radius, radius, l - fixedConeLength, 8, 1);
        coneGeometry = new THREE.CylinderGeometry(0, radiusCone, fixedConeLength, 8, 1);
        edgeGeometry.translate( 0, - 0.5 * fixedConeLength, 0 );
        var translate = new THREE.Matrix4().makeTranslation( 0, 0.5 * (l - fixedConeLength), 0 );
        edgeGeometry.merge(coneGeometry, translate);
    }

    

    var arrow = new THREE.Mesh(edgeGeometry, material);

    arrow.applyMatrix(orientation);
    
    arrow.position.x = (pointY.x + pointX.x) / 2;
    arrow.position.y = (pointY.y + pointX.y) / 2;
    arrow.position.z = (pointY.z + pointX.z) / 2;


    
    return arrow;
}


export { createCylinderArrowMesh };