import json

with open('package.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

data['dependencies']['@stomp/stompjs'] = '^7.0.0'
data['dependencies']['sockjs-client'] = '^1.6.1'

with open('package.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2)
