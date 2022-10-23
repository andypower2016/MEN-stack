import os
import requests
import json


class requestGenerator:
    def __init__(self, url, jsonContent):
        response = requests.post(url=url, json=jsonContent, verify=False)
        if response:
            print (f'server response : {response.json()}')
        return

requestGenerator("http://localhost:8000/test_post_from_python", 
                  {"content":"1234","encode":{"a":"1","b":"2"}})

requestGenerator("http://localhost:8000/clicked", 
                  {"db_url":"mongodb://localhost:27017/"})