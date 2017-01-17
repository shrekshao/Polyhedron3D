var PolyhedralDiagram = function (json) {
    if (json === null) {
        console.log( ' no json object to init the polydral digram pair' );
        return;
    }

    this.json = json;

    var geometry = this.geometry = new THREE.Geometry();

    var vec3 = {};
    var v;

    // var center = new THREE.Vector3();
    var numVertices = 0;
    
    for (v in json.form.vertices) {
        vec3[v] = new THREE.Vector3 ( 
            json.form.vertices[v][0],
            json.form.vertices[v][1],
            json.form.vertices[v][2]
        );

        // geometry.vertices.push(vec3[v]);
        // center.add(vec3[v]);
        // numVertices++;
    }

    // console.log(vec3);
    // center.multiplyScalar( 1 / numVertices );
    // console.log(center);



    var lines = {};

    var edge, vertex;
    for (edge in json.form.edges) {
        vertex = json.form.edges[edge].vertex;

        geometry.vertices.push( vec3[vertex[0]].clone(), vec3[vertex[1]].clone() );

        if (json.form.edges[edge].external) {
            geometry.colors.push( new THREE.Color(0xff0000), new THREE.Color(0xff0000)  );
        } else {
            geometry.colors.push( new THREE.Color(0xffffff), new THREE.Color(0xffffff)  );
        }
        
    }

    // geometry.translate(-center.x, -center.y, -center.z);
    geometry.normalize();

    // geometry.vertices.push( new THREE.Vector3(-1, -1, -1), new THREE.Vector3(-1, -1, 1) ); 
    // geometry.vertices.push( new THREE.Vector3(-1, -1, 1), new THREE.Vector3(-1, 1, 1) ); 
    // geometry.vertices.push( new THREE.Vector3(-1, 1, 1), new THREE.Vector3(1, 1, 1) ); 
    // geometry.vertices.push( new THREE.Vector3(-1, -1, -1), new THREE.Vector3(1, -1, -1) ); 
    // geometry.vertices.push( new THREE.Vector3(1, -1, -1), new THREE.Vector3(1, -1, 1) ); 
};

PolyhedralDiagram.prototype.constructor = PolyhedralDiagram;
