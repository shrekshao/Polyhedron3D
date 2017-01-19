var PolyhedralDiagram = function (json) {
    if (json === null) {
        console.log( ' no json object to init the polydral digram pair' );
        return;
    }

    this.json = json;

    var geometry = this.geometry = new THREE.Geometry();
    var exEdges = this.exEdges = new THREE.Geometry();
    // var exForces = this.exForces = new THREE.Geometry();

    var exForces = this.exForces = new THREE.Object3D();

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

};

PolyhedralDiagram.prototype.constructor = PolyhedralDiagram;
