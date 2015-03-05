import sqlite3
from flask import g
import urllib


def connect_db():
    return sqlite3.connect("database.db")

def get_db():
    db = getattr(g, 'db', None)
    if db is None:
        db = g.db = connect_db()
    return db

def init_db(app):
    with app.app_context():
        db = get_db()
        with app.open_resource('database.schema', mode='r') as f:
            db.cursor().executescript(f.read())
            db.commit()


def sign_in(email, password):
    c = get_db()
    cur = c.execute("select password from accounts where accounts.email = ? ",[email])
    rv = cur.fetchone()
    c.commit()

    if rv == None: #User does not exist
        return False
    elif (password not in rv): #Invalid password
        return False
    else:

      #Update how many time a user has been online
      cur = c.execute("UPDATE accounts SET times_online = times_online + 1")
      cur.lastrowid
      print lastrowid  
      #Send new data to user
      return True

def new_user_online( email, token):
    c = get_db()
    c.execute("INSERT INTO users_online(email,token) VALUES (?,?)",[email,token])
    c.commit()
    return True


def add_account(mail,password, firstname, familyname, gender, city, country):
    c = get_db()
    cur = c.execute("select email from accounts where accounts.email = ? ",[mail])
    rv = cur.fetchone()
    c.commit()

    if rv != None : #invalid email
         return False


    c.execute("insert into accounts (email,password,firstname,familyname,gender,city,country) values (?,?,?,?,?,?,?)",[mail,password,firstname,familyname,gender,city,country])
    c.commit()

    cur.close()
    #close()

    return True

def log_out(token_):
    c = get_db()

    cur = c.execute("select email from users_online where token = ?",[token_,] )
    rv = cur.fetchone()
    c.commit()

    if rv == None:
        return {"success": False}

    #TODO: Should this be able to fail? Should we check for failure
    #TODO: Check if the user is currently online before we delete it
    c.execute("DELETE FROM users_online WHERE token = ? ",[token_])
    c.commit()

    return {"success": True}


def new_password(token_, old_password, new_password):
    c = get_db()
    #Get email
    email_ = get_email( token_ )

    if email_ == None:
        return False
    #Get old password and compare
    cur = c.execute("SELECT password FROM accounts WHERE accounts.email = ? ", [ email_[0] ] )

    rv = cur.fetchone()
    c.commit()
    if rv == None : #invalid email SHOULD NOT BE POSSIBLE
         return None
    elif old_password != rv[0]:
         return False
    else:
        cur = c.execute("UPDATE accounts SET password = ? where password = ? ",[new_password, old_password])
        rv = cur.fetchone()
        c.commit()
        return True


def get_user_data_by_token_(token_):
    #Get email
    email_ = get_email( token_ )
    if( email_ == None ):
        return {"success": False}

    return get_user_data_by_email_(email_[0], token_ )



def get_user_data_by_email_(email_, token_ ):
    c = get_db()

    cur = c.execute("select email from users_online where token = ?",[token_,] )
    rv = cur.fetchone()
    c.commit()

    if rv == None:
        return {"success": False}

    #Get userinfo
    cur = c.execute("select email, firstname, familyname, gender, city, country from accounts where email = ? ",[email_ ])
    rv = cur.fetchall() #TODO vi vill ha all data.
    c.commit()

    if( rv == []):
        return {"success": None}


    return {"success": True,"data": rv }


def get_message_by_token_( token_ ):
    c = get_db()

    #Get email
    email_ = get_email( token_ )
    if email_ == None:
        return {"success": False}
    else:
        return get_user_message_by_email_( token_, email_[0] )

def get_user_message_by_email_( token_, email_ ):
    c = get_db()
    #Is user online
    if get_email( token_ )  == None:
        return {"success": False}
    c = get_db()
    cur = c.execute("select email from accounts where email = ? ",[email_])
    rv = cur.fetchone()
    c.commit()
    if rv == None:
        return {"success": None}

    cur = c.execute("select message, sender from messages where receiver = ? ",[email_] )
    rv = cur.fetchall()
    c.commit()

    return {"success": True,"data": rv }

def add_message(token,reciever,message):

    c = get_db()
    #Is user online
    sender = get_email( token )
    if  sender == None:
        return {"success": False}

    #is this email registred
    c = get_db()
    cur = c.execute("select email from accounts where email = ? ",[reciever])
    rv = cur.fetchone()
    c.commit()

    if rv == None:
        return {"success": None}


    c.execute("insert into messages (sender,receiver,message) values (?,?,?)",[sender[0],reciever,message])
    c.commit()
    return {"success": True}




def close():
    get_db().close()


def get_email( token_ ):
    c = get_db()
    cur = c.execute("select email from users_online where token = ? ",[token_])
    rv = cur.fetchone()
    c.commit()
    return rv

def already_logged_in(email):
    c = get_db()
    cur = c.execute("select token from users_online where email = ?",[email])
    rv = cur.fetchone()
    c.commit()

    if rv != None:
        return {"success": True, "data" : rv[0]}

    else:
        return {"success": False, "data" : ""}



def change_token( newToken, email ):
    c = get_db()
    cur = c.execute("UPDATE users_online SET token = ? where email = ? ",[newToken, email])
    c.commit()

def remove_all_online():
    c = get_db()
    c.execute("DELETE FROM users_online" )
    c.commit()
    return True


def downloadFile( token, url ):
   
   c = get_db()
   #Is user online
   email = get_email( token )

   if( email == None ):
      return {"success": False}
 
   cur = c.execute("insert into user_media (email) values (?)",[email[0] ] )
   c.commit()
 
   print(cur.lastrowid)
   url = url.encode('ascii','ignore')
   print type(url)
   url = url[ 5 : len(url)  ]
   print url
   return {"success" : True }
   urllib.urlretrieve( url, "twidder/media/local-filename.png")
   return {"success" : True }


def get_live_data( token ):
   c = get_db()
   #Is user online
   email = get_email( token )

   if( email == None ):
      return {"success": False}

   c = get_db()
   cur = c.execute("select times_online, post_by_me, post_to_me from users_online where email = ?",[email])
   rv = cur.fetchall()
   c.commit()

   if rv == None:
      return {"success": False, "message": "Undefined error"}
   else:
      return {"success": True,  "message":  "Live data", "data", rv}
   
