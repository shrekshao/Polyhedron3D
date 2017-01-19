import json
from sets import Set

class DiagramJson:
    def __init__(self):
        self.json = {
            'form': {
                'vertices': {}, 
                'edges': {}
            },

            'force': {
                'vertices': {},
                'edges': {},
                'faces_e': {},
                'faces_v': {},
                'cells': {}
            }
        }

class Txt2JsonParser:
    def __init__(self):
        self.diagramJson = DiagramJson()

    def readFormVertex(self, filename):
        f = open(filename)
        v = self.diagramJson.json['form']['vertices']
        for line in f:
            vertex = line.strip().split('\t')
            # print vertex
            v[vertex[0]] = map(float, vertex[1:])

        # print self.diagramJson.json
        f.close()

    def readFormEdge(self, filename_edge_vertex, filename_edge_to_force_face, filename_edge_ex):
        f_edge_vertex = open(filename_edge_vertex)
        edges = self.diagramJson.json['form']['edges']
        for line in f_edge_vertex:
            edge = line.strip().split('\t')
            e = edges[edge[0]] = {}
            e['vertex'] = edge[1:]
            # e['external'] = False
            # print edge[0], e['vertex']

        # print edges
        f_edge_vertex.close()

        


        f_edge_to_force_face = open(filename_edge_to_force_face)
        for line in f_edge_to_force_face:
            edge = line.strip().split('\t')
            edges[edge[0]]['force_face'] = edge[1] if edge[1] != "Null" else None

        f_edge_to_force_face.close()

        
        vertex_ex_set = Set()

        f_edge_ex = open(filename_edge_ex)
        for line in f_edge_ex:
            edge = line.strip().split('\t')
            for e in edge:
                edges[e]['external'] = True

                vertex_ex_set.add(edges[e]['vertex'][0])
                vertex_ex_set.add(edges[e]['vertex'][1])

        f_edge_ex.close()



        # label external force edge
        for e in edges:
            is_ex_vertex_0 = edges[e]['vertex'][0] in vertex_ex_set
            is_ex_vertex_1 = edges[e]['vertex'][1] in vertex_ex_set
            if is_ex_vertex_0 != is_ex_vertex_1:
                # print edges[e]['vertex'][0], ':', is_ex_vertex_0, ' , ', edges[e]['vertex'][1], ':', is_ex_vertex_1
                # force vector: from v0 to v1
                edges[e]['ex_force'] = True





        # print edges
        # print self.diagramJson.json


    def readForceVertex(self, filename):
        f = open(filename)
        v = self.diagramJson.json['force']['vertices']
        for line in f:
            vertex = line.strip().split('\t')
            # print vertex
            v[vertex[0]] = map(float, vertex[1:])

        # print self.diagramJson.json
        f.close()

    def readForceEdge(self, filename_edge_vertex):
        f_edge_vertex = open(filename_edge_vertex)
        edges = self.diagramJson.json['force']['edges']
        for line in f_edge_vertex:
            edge = line.strip().split('\t')
            edges[edge[0]] = edge[1:]

        # print edges
        f_edge_vertex.close()
        # print self.diagramJson.json

    def readForceFace(self, filename_face_edge):
        f_face_edge = open(filename_face_edge)
        edges = self.diagramJson.json['force']['edges']
        faces_e = self.diagramJson.json['force']['faces_e']
        faces_v = self.diagramJson.json['force']['faces_v']
        for line in f_face_edge:
            face = line.strip().split('\t')
            faces_e[face[0]] = face[1:]

            cur_face_vertex = Set()
            for e in face[1:]:
                # extend vertex array
                # cur_face_vertex.extend(edges[e])
                for v in edges[e]:
                    cur_face_vertex.add(v)
            
            faces_v[face[0]] = list(cur_face_vertex)
            print faces_v[face[0]]

                

            

        f_face_edge.close()
        # print self.diagramJson.json





if __name__ == "__main__":
    parser = Txt2JsonParser()

    # parser.readFormVertex("form_diagram/form_vertex.txt")
    # parser.readFormEdge("form_diagram/form_edge_vertex.txt", \
    #                     "form_diagram/form_edge_to_force_face.txt", \
    #                     "form_diagram/form_edge_ex.txt")
    
    # parser.readForceVertex("force_diagram/force_vertex.txt")
    # parser.readForceEdge("force_diagram/force_edge_vertex.txt")
    # parser.readForceFace("force_diagram/force_face_edge.txt")

    # with open('test.json', 'w') as out:
    #     json.dump(parser.diagramJson.json, out)

    parser.readFormVertex("test_2/form_v.txt")
    parser.readFormEdge("test_2/form_e_v.txt", \
                        "test_2/form_e_to_force_f.txt", \
                        "test_2/form_e_ex.txt")
    
    parser.readForceVertex("test_2/force_v.txt")
    parser.readForceEdge("test_2/force_e_v.txt")
    parser.readForceFace("test_2/force_f_e.txt")

    with open('test2.json', 'w') as out:
        json.dump(parser.diagramJson.json, out)
    