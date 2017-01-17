import json

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
                'faces': {},
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

    def readFormEdge(self, filename_edge_vertex, filename_edge_to_force_face):
        f_edge_vertex = open(filename_edge_vertex)
        e = self.diagramJson.json['form']['edges']
        for line in f_edge_vertex:
            edge = line.strip().split('\t')
            e[edge[0]] = edge[1:]

        print e
        f_edge_vertex.close()


        # f_edge_to_force = open(filename_edge_to_force_face)





if __name__ == "__main__":
    parser = Txt2JsonParser()

    parser.readFormVertex("form_diagram/form_vertex.txt")
    parser.readFormEdge("form_diagram/form_edge_vertex.txt", "form_diagram/form_edge_to_force_face.txt")