# How to find cells

1. construct half-faces first, each face will have 2 half-faces
2. construct the topology of these half-faces (which half-face is adjacent to the other)

*	edge is represented by 2 vertices in ascending order

*	sort faces (faces are represented by two half-faces) around each edge by the clockwise or counter-clockwise angle

	* for each face, calculate the their center and calculate a vector perpendicular to the edge

	* use the perpendicular vector to calculate the angles between faces (top-view)

*	connect these half-faces around the edge

3. use BFS to traverse all the half-faces. Each closure forms a cell

# Documentation

This interactive module doesn't use npm and webpack. All the visualization codes are in the script tag in polytool.html, while the script in index.html is responsible for the panel on the left.

index.html contains a `<iframe>`, which links to the polytool.html. They're communicating with each other using `postMessage` and `window.onmessage`.

Some python utils are included in `Polyhedron3D/utils/`.

* `cell_finder.py`

A cell finding algorithm which is implemented in polytool.html using Javascript and rewritten in Python.

* `obj_converter.py`

Converting a `.obj` file, which is exported by Rhinoceros and contains duplicated vertices, to another `.obj` file, in which there's no duplicated vertices.

* `txt2obj_converter.py`

A Python script which converts `force_f_v.txt` and `force_v.txt` to a `.obj` file.