import math

vertices = []
edges = []
half_faces = []
cells = []
faces = []
eps = 0.01

class half_face:
	def __init__(self):
		self.id = None # index of itself
		self.indices = [] # the indices of the vertices
		self.adjacent = [] # adjacent half-faces

# each face contains 2 half-faces
class face:
	def __init__(self):
		self.hfa = None
		self.hfb = None

# each edge can be represented by 2 vertices
# each edge contains lots of faces
class edge:
	def __init__(self):
		self.va = None
		self.vb = None
		self.faces = []

# each cell is represented by some connected half-faces
class cell:
	def __init__(self):
		self.hfs = []

class Vector3:
	def __init__(self, x, y, z):
		self.x = x
		self.y = y
		self.z = z
	def __div__(self, scalar):
		return Vector3(self.x / scalar, self.y / scalar, self.z / scalar)
	def __add__(self, other):
		return Vector3(self.x + other.x, self.y + other.y, self.z + other.z)
	def __sub__(self, other):
		return Vector3(self.x - other.x, self.y - other.y, self.z - other.z)
	def	__mul__(self, scalar):
		return Vector3(self.x * scalar, self.y * scalar, self.z * scalar)
	def cross(self, other):
		return Vector3(self.y * other.z - self.z * other.y, self.z * other.x - self.x * other.z, self.x * other.y - self.y * other.x)
	def angleTo(self, other):
		if self.length() != 0 and other.length() != 0:
			# print(self.dot(other))
			# print((self.length() * other.length()))
			return math.acos(round(self.dot(other) / (self.length() * other.length()), 6))
		else:
			return 0
	def lengthSq(self):
		return self.dot(self)
	def length(self):
		return math.sqrt(self.lengthSq())
	def dot(self, other):
		return self.x * other.x + self.y * other.y + self.z * other.z

# each edge stores faces which have that edge
def addFaceToEdge(f, edges):
	length = len(f.hfa.indices)
	for i in range(0, length):
		newFace = face()
		a = f.hfa.indices[i]
		b = f.hfa.indices[(i + 1) % length]

		# make sure a is smaller than b so that the half-faces are interleaved
		# for example, face[1].hfa should never be connected to face[0].hfa or face[2].hfa
		# face[1].hfa should be connected to either face[0].hfb or face[2].hfb
		if a > b:
			a, b = b, a
			newFace.hfa = f.hfb
			newFace.hfb = f.hfa
		else:
			newFace.hfa = f.hfa
			newFace.hfb = f.hfb

		edge_length = len(edges)
		isFound = False
		# find if the edge already exists
		for j in range(0, edge_length):
			if a == edges[j].va and b == edges[j].vb:
				edges[j].faces.append(newFace)
				isFound = True
				break

		# if this is a new edge then create
		if not isFound:
			e = edge()
			e.va = a
			e.vb = b
			e.faces.append(newFace)
			edges.append(e)	

# get the center of the face
def get_center(indices):
	center = Vector3(0, 0, 0)
	length = len(indices)
	for i in range(0, length):
		index = indices[i]
		center = center + vertices[index]
	center = center / length
	return center

# calculate the vector perpendicular to the edge
def get_perpendicular_vector(v_a, v_b, face_indices):
	center = get_center(face_indices)
	e_vector = Vector3(0, 0, 0)
	e_vector = v_b - v_a
	v = center - v_a
	if e_vector.lengthSq() != 0:
		r = v - (e_vector * (v.dot(e_vector) / e_vector.lengthSq()))
	else:
		r = Vector3(0, 0, 0)
	return r

# calculate the angle between edge.face[0] and edge.face[index]
def get_angle(vertices, edge, index, ref_axis):
	vector_a = get_perpendicular_vector(vertices[edge.va], vertices[edge.vb], edge.faces[0].hfa.indices)
	vector_b = get_perpendicular_vector(vertices[edge.va], vertices[edge.vb], edge.faces[index].hfa.indices)
	axis = Vector3(0, 0, 0)
	axis = vector_a.cross(vector_b)
	angle = vector_a.angleTo(vector_b)

	if axis.length() > eps and axis.dot(ref_axis) < 0:
		angle = math.pi * 2 - angle

	return angle

# connect the half-faces around the edge
def connect_around(vertices, edge):
	total_face = len(edge.faces)
	ref_axis = vertices[edge.va] - vertices[edge.vb]
	# selection sort
	for i in range(0, total_face):
		min_angle = get_angle(vertices, edge, i, ref_axis)

		min_index = i
		for j in range(i + 1, total_face):
			angle = get_angle(vertices, edge, j, ref_axis)
			if angle < min_angle:
				min_angle = angle
				min_index = j
		if min_index != i:
			temp = edge.faces[i]
			edge.faces[i] = edge.faces[min_index]
			edge.faces[min_index] = temp

	for i in range(0, total_face):
		f0 = edge.faces[i]
		f1 = edge.faces[(i + 1) % total_face]
		f0.hfa.adjacent.append(f1.hfb)
		f1.hfb.adjacent.append(f0.hfa)

def connect_half_faces(vertices, edges):
	length = len(edges)
	for i in range(0, length):
		connect_around(vertices, edges[i])

def find_cells(cells, half_faces):
	# record if the half face is visited
	vstd = []
	length = len(half_faces)
	for i in range(0, length):
		vstd.append(False)
	for i in range(0, length):
		if vstd[i] == False:
			bfs(cells, half_faces, vstd, i)

def bfs(cells, half_faces, vstd, start_index):
	queue = []
	new_cell = cell()
	queue.append(start_index)
	vstd[start_index] = True
	while len(queue) != 0:
		front = queue.pop(0)
		vstd[start_index] = True
		new_cell.hfs.append(half_faces[front])
		length = len(half_faces[front].adjacent)
		for i in range(0, length):
			index = half_faces[front].adjacent[i].id
			if vstd[index] == False:
				vstd[index] = True
				queue.append(half_faces[index].id)
	cells.append(new_cell)

def loadModel(fileName):
	file = open(fileName)
	hf_index = 0
	for line in file:
		tokens = line.split(" ")
		length = len(tokens)
		if tokens[0] == "v":
			vertex = Vector3(float(tokens[1]), float(tokens[2]), float(tokens[3]))
			vertices.append(vertex)
		elif tokens[0] == "f":
			hf = half_face()
			for i in range(1, length):
				indices = tokens[i].split("/")
				# minus 1 makes the indices start from 0
				# because in .obj file, the indices start from 1
				hf.indices.append(int(indices[0]) - 1)
			
			half_faces.append(hf)
			symhf = half_face()
			# reverse the indices sequence
			symhf.indices = hf.indices[::-1]
			half_faces.append(symhf)

			f = face()
			f.hfa = hf
			f.hfb = symhf

			faces.append(f)
			addFaceToEdge(f, edges)
			hf.id = hf_index
			symhf.id = hf_index + 1
			hf_index += 2

if __name__ == "__main__":
	loadModel("../model/obj_test5_converted.obj")
	connect_half_faces(vertices, edges)
	find_cells(cells, half_faces)

	# for e in edges:
	# 	print "Edge: %d %d :%d" % (e.va, e.vb, len(e.faces))
	# for hf in half_faces:
	# 	print(len(hf.adjacent))

	c = 1
	for cell in cells:
		print "Cell %d:" % c
		c = c + 1
		for hf in cell.hfs:
			print(hf.indices)
