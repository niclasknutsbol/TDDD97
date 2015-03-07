from flask import Flask
import random
import json
from database_helper import *
from flask import request
from geventwebsocket.handler import WebSocketHandler
import sys


import os
from flask import Flask, request, redirect, url_for
from werkzeug import secure_filename


app = Flask(__name__)
app.debug = True

#GLOBAL FUNCTIONS
UPLOAD_FOLDER = '/twidder/media'
ALLOWED_EXTENSIONS = set(['txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif'])
clients = {}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER



@app.route('/')
def index(): 
    #init_db(app) #WE DO NOT RESET THE DATABASE IN INDEX
    return app.send_static_file( "client.html" )

@app.route('/<file>')
def index_2(file):
    #init_db(app) #WE DO NOT RESET THE DATABASE IN INDEX
    return app.send_static_file( file )

@app.route('/log_in', methods=[ 'GET', 'POST'] )
def log_in():

    print "Client is logging in..."

    if 'email'    not in request.form or\
       'password' not in request.form:

        return json.dumps({"success": False, "message": "Wrong form man!"})


    email    = request.form['email']
    password = request.form['password']

    letters = "abcdefghiklmnopqrstuvwwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890"
    newToken = ""
    for i in range(36):
        newToken += letters[random.randint(0,len(letters)-1)]

    print "with token " + newToken
    #Is user already logged in?
    response = already_logged_in( email )
    if  response["success"] == True:
        change_token( newToken, email )
        token  = response["data"]
        print "Token is now "+token
        print "Clients: "
        print clients
        socket = clients.get(email)
        if( socket != None):
            print "Socket is not None"
            print type(socket)
            socket.send( json.dumps( {"message" :"terminate"}))
            print "this is after send in log_in()"
            clients.pop( email, None )

    response =  sign_in( email, password)

    if response["success"] != True:
        return json.dumps({"success" : False,"message": "Password or email is invalid","data":""})
   
    new_user_online( email, newToken)
    return json.dumps({"success":True,"message":"You have succesfully loged in","data":newToken, "live" : response["live"]})

@app.route('/api')
def api():
    if request.environ.get('wsgi.websocket'):
        ws = request.environ.get('wsgi.websocket')

        #First receive is always a token
        email = ws.receive()
        clients[ email ] = ws

        while True: #May add more functionality later...
           temp = ws.receive()
           if( temp == "terminate" ):
              break;
   return ""

@app.route('/sign_up', methods = ['POST'])
def sign_up():

    if 'email'      not in request.form or\
       'password'   not in request.form or\
       'firstname'  not in request.form or\
       'familyname' not in request.form or\
       'gender'     not in request.form or\
       'city'       not in request.form or\
       'country'    not in request.form:

        return json.dumps({"success": False, "message": "Wrong form man!"})


    email        = request.form['email']
    password     = request.form['password']
    firstname    = request.form['firstname']
    familyname   = request.form['familyname']
    gender       = request.form['gender']
    city         = request.form['city']
    country      = request.form['country']

    success = add_account(email, password, firstname, familyname, gender, city, country)
    if success:
        return json.dumps({"success": True,"message":"Successfully created user"})
    else:
        return json.dumps({"success": False,"message":"Email is already registred"})


@app.route('/sign_out', methods = ['POST'] ) #TODO fix controll
def sign_out():

    if 'token' not in request.form:
        return json.dumps({"success": False, "message": "Wrong form man!"})

    print "we are in log out"

    token = request.form['token']

    response = log_out(token)
    if( response["success"] == False):
        return json.dumps({"success": False, "message": "User is not logged in."})
    else:
        clients[token].send("terminate")
        print "Socket is now closed"
        return json.dumps({"success": True, "message": "Successfully signed out."})



@app.route('/change_password', methods= ['POST'])
def change_password():

    if 'token'        not in request.form or\
       'oldPassword'  not in request.form or\
       'newPassword1'  not in request.form or\
       'newPassword2' not in request.form:

        return json.dumps({"success": False, "message": "Wrong form man!"})


    token         = request.form['token']
    oldPassword   = request.form['oldPassword']
    newPassword1  = request.form['newPassword1']
    newPassword2  = request.form['newPassword2']

    print newPassword1
    print newPassword2

    if newPassword1 != newPassword2 :
        return json.dumps({"success": False, "message": "You need to write the new password twice...."})



    success = new_password(token, oldPassword, newPassword1)
    if success == None:
        return json.dumps({"success": False, "message": "You are not logged in."})
    elif success == False:
        return json.dumps({"success": False, "message": "Wrong password."})
    else:
        return json.dumps({"success": True, "message": "Password changed."})



@app.route('/get_user_data_by_token', methods = ['POST'])
def get_user_data_by_token():

    if 'token' not in request.form:
        return json.dumps({"success": False, "message": "Wrong form man!"})

    token    = request.form['token']

    result = get_user_data_by_token_(token)
    if( result["success"] == False):
        return json.dumps({"success": False, "message": "You are not logged in."})
    else:
        data = result["data"]
        return json.dumps({"success": True, "message": "User data retrieved.", "data": data })


@app.route('/get_user_data_by_email', methods = ['POST'] )
def get_user_data_by_email():

    if 'email'      not in request.form or\
       'token'   not in request.form:
        return json.dumps({"success": False, "message": "Wrong form man!"})

    email   = request.form['email']
    token   = request.form['token']

    result = get_user_data_by_email_(email, token )

    if result["success"] == False:
        return json.dumps({"success": False, "message": "You are not logged in."})
    elif result["success"] == None:
        return json.dumps({"success": False, "message": "No such user."})
    else:
        data = result["data"]
        return json.dumps({"success": True, "message": "User data retrieved", "data": data })



@app.route('/get_user_message_by_token', methods = ['POST'])
def get_user_message_by_token():

    if 'token' not in request.form :
        return json.dumps({"success": False, "message": "Wrong form man!"})

    token = request.form['token']

    result = get_message_by_token_( token )
    if( result["success"] == False):
        return json.dumps({"success":False, "message" : "You are not signed in." } )
    else:
        return json.dumps({"success":True, "message" : "User messages retrieved.", "data" : result["data"] } )


@app.route('/get_user_message_by_email', methods = ['POST'] )
def get_user_message_by_email():

    if 'email' not in request.form or\
       'token' not in request.form:
        return json.dumps({"success": False, "message": "Wrong form man!"})




    email   = request.form['email']
    token   = request.form['token']

    result = get_user_message_by_email_(token, email )

    if result["success"] == False:
        return json.dumps({"success": False, "message": "You are not logged in."})
    elif result["success"] == None:
        return json.dumps({"success": False, "message": "No such user."})
    else:
        data = result["data"]
        return json.dumps({"success": True, "message": "User data retrieved", "data": data })





@app.route('/post_message', methods = ['POST'])
def post_message():

    if 'token' not in request.form or\
       'email' not in request.form or\
       'message' not in request.form:
        return json.dumps({"success": False, "message": "Wrong form man!"})


    token   = request.form['token']
    email   = request.form['email']
    message = request.form['message']


    result = add_message( token, email, message)

    if result["success"] == False:
       return json.dumps({"success": False, "message": "You are not logged in."})
    elif result["success"] == None:
       return json.dumps({"success": False, "message": "No such user."})
    else:
       socket = clients.get(email)
       if( socket != None): #check if receiver is online

           socket.send( json.dumps({"message" : "update recieved post", "data" : result["data"] } ) )
           #socket.send( "update recieved post")
           print "socket sending to post to receiver"
           return json.dumps({"success": True, "message": "Posted" })

#if __name__ == '__main__':
#    app.run()


@app.route('/remove_user')
def remove_user():
    remove_all_online()
    clients = {}
    print clients
    return "from server"


@app.route('/upload', methods=['POST', 'GET'])
def upload():
   if request.method != 'POST':
      return json.dumps({"success": False, "message": "Post is wrong"})

   print "1"
   print request.form.keys()
   if 'file' not in request.form:
      return json.dumps({"success": False, "message": "file is wrong"})

   print "2"
   upLoadedFile = request.form['file']
   print "we have the file"
   #check if file is a valid filetype

   #check if file is a secure name

   #save actually file

   #return url for file (FILE IS A BINARY STRING, HOW CAN THIS WORK)

 
   #TODO
   #uploadFile is a binary string that we need to save and map to a user
   #We should save the actuall file in the filesystem and the name of the file, the type and the email in the database with in database
   #return the url to the user and show the picture

   #next function...
      #then we should build a function that return all the users name and the url
   



   return json.dumps({"success": True, "message": "End of file!", "data" : upLoadedFile})

def live( token ):

  #number of time i been online
  #number of posts by me
  #number of post to me
   
   result = get_live_data( token )

   if result["success"] == False:
      return json.dumps({"success": False, "message": "You are not logged in.", "data" : ""})
   elif result["success"] == None:
      return json.dumps({"success": False, "message": "No such user.", "data" : ""})
   else:
      return json.dumps({"success": True, "message": "Posted", "data" : result.data })






 
