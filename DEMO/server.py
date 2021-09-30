from flask import Flask, request, jsonify
from flask_restful import Resource, Api
from flask_cors import CORS
from parserFile import getFilters
from parserFile import rewriteExecute
import json
import os
import numpy as np
# import requests


app = Flask(__name__)
CORS(app)
api = Api(app)

def traverse_tree(dictionary, id=None):
    for key, value in dictionary.items():
        if isinstance(value, np.int64):
            print(key)
        elif isinstance(value, list):
            for x in value:
                if isinstance(x, np.int64):
                    print(key)
                if type(value) == dict:
                    traverse_tree(x, id)
        elif type(value) != dict:
            pass
        else:
             traverse_tree(value, id)
    return


class HelloWorld(Resource):
    def get(self):
        return {'hello': 'world'}


# I richiede a S la lista dei dataset disponibili e S la restituisce
class SelectDataset(Resource):
    def get(self):
        #cicla tutti i dati nella cartella metadata
        directory = os.fsencode('metadata')
        metadata = []
        for file in os.listdir(directory):
            print(file)
            filename = os.fsdecode(file)
            print(filename)
            with open('metadata/'+ filename, encoding='utf8') as file:
                metadata += [json.load(file)]
        return metadata


# I richiede a S la lista degli script
class SelectScript(Resource):
    def get(self, script):
        with open('script/'+ script) as file:
            print(file)
            return {'script': file.read()}


class GetFilters(Resource):
    def get(self, script):
        return {'filters': getFilters(script)}


class RewriteQuery(Resource):
    def post(self):
        rewQueries = request.json
        pp = rewriteExecute(rewQueries)
        for i in pp:
            traverse_tree(i)
        return {'filters': pp}

class GetScript(Resource):
    def post(self):
        new_script = request.json['script']
        with open('script/current_script', 'w') as file:
            print(file.write(new_script))
        return {'script': 'current_script'}


api.add_resource(SelectDataset, '/get_metadata')
api.add_resource(SelectScript, '/get_script/<string:script>')
api.add_resource(GetFilters, '/get_filters/<string:script>')
api.add_resource(RewriteQuery, '/rewrite_query')
api.add_resource(GetScript, '/script')


if __name__ == '__main__':
    app.run(debug=True)
