from twidder import app
from gevent.wsgi import WSGIServer
from geventwebsocket.handler import WebSocketHandler

if __name__ == '__main__':
    http_server = WSGIServer(('', 5000), app, handler_class=WebSocketHandler)
    app.debug = True
    http_server.serve_forever()



#from twidder import app
#app.run(debug=True)
