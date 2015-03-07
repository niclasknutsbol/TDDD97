var current_view = "welcomeview";
var min_passw_length = 5;
var token;

displayView = function(view) 
{
   document.getElementById("content").innerHTML = document.getElementById(view).innerHTML;
};


displayBrowserView = function(view) 
{
   document.getElementById("content_browser").innerHTML = document.getElementById(view).innerHTML;
};



signIn = function()
{
   current_view = "profileview";
   displayView(current_view);
   window.location.href = "#browse_panel";
   window.location.href = "#home_panel";

   init_profile_functions();
   setupProfile();
   document.getElementById("update_wall").click();
};

setupLiveData_posts = function( value_ )
{
   document.getElementById("live_data_box").innerHTML = value_; 
}

setupProfile = function()
{
   var temp_token = localStorage.getItem( "token" );

    var data = new FormData();
    data.append('token', temp_token);

    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open("POST", "/get_user_data_by_token",true);


    xmlhttp.onreadystatechange = function() //Call the function when the state changes.
    {
        if(xmlhttp.readyState == 4 && xmlhttp.status == 200)
        {
            var response = JSON.parse(xmlhttp.responseText);

            if( response.success === false )
            {

            }
            else
            {
                document.getElementById("profile_email").innerHTML   = response.data[0][0];
                document.getElementById("profile_name").innerHTML    = response.data[0][1];
                document.getElementById("profile_family").innerHTML  = response.data[0][2];
                document.getElementById("profile_gender").innerHTML  = response.data[0][3];
                document.getElementById("profile_country").innerHTML = response.data[0][4];
                document.getElementById("profile_city").innerHTML    = response.data[0][5];
            }
        }
    }
    xmlhttp.send(data);
};

SignOut = function()
{
   localStorage.removeItem( "token" );
   current_view = "welcomeview";
   displayView( current_view );
   window.location.href = "";
   init_welcome_functions();
}

init_welcome_functions = function()
{

//SIGN-IN
document.getElementById("sign-in").onsubmit = function( e )
{
    e.preventDefault();

    var email_ = document.getElementById("email1").value;
    var password_ = document.getElementById("password1").value;

    var data = new FormData();
    data.append('email', email_);
    data.append('password', password_);


    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open("POST", "/log_in",true);


    xmlhttp.onreadystatechange = function() //Call the function when the state changes.
    {
        if(xmlhttp.readyState == 4 && xmlhttp.status == 200)
        {
            var response = JSON.parse(xmlhttp.responseText);

            if( response.success === false )
            {
                email1.setCustomValidity( response.message );
            }
            else
            {
                var posts = parseInt( response.live[0][8]);
                localStorage.setItem( "token", response.data );
                localStorage.setItem( "email", email_ );
                localStorage.setItem( "number_of_posts", posts );

                email1.setCustomValidity("");
                signIn();
                var socket = new WebSocket("ws://127.0.0.1:5000/api");

                socket.onopen = function() {
         
                   socket.send( email_);

                };

                socket.onmessage = function (evt) 
                {
                   var from_server = JSON.parse( evt.data );
                   if( from_server.message  === "terminate" ) 
                   {
			             SignOut
			             //socket.close();
                      socket.send("terminate");
		             }
                   else if (  from_server.message === "update recieved post" )
                   {
                         var posts = localStorage.getItem( "number_of_posts" );
                         posts = parseInt( posts ); 
                         posts = posts + 1;  
                         localStorage.setItem("number_of_posts", posts);
                   }
                   else
                   {
                         alert("UNKNOWN MESSAGE FROM SERVER");
                   }
                 };

                socket.onclose = function() {
                   //socket.send("close");
		         };
            }
        }
    }
    xmlhttp.send(data);

   };
   

   //SIGN-UP
   document.getElementById("sign-up").onsubmit = function() 
   {

    var email      = document.getElementById("email2").value;
    var password   = document.getElementById("password2").value;
    var firstname  = document.getElementById("firstname").value;
    var familyname = document.getElementById("familyname").value;
    var gender     = document.getElementById("gend").value;
    var city       = document.getElementById("city").value;
    var country    = document.getElementById("country").value;


    var data = new FormData();
    data.append('email',      email);
    data.append('password',   password);
    data.append('firstname',  firstname);
    data.append('familyname', familyname);
    data.append('gender',     gender);
    data.append('city',       city);
    data.append('country',    country);

    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open("POST", "/sign_up",true);


    xmlhttp.onreadystatechange = function() //Call the function when the state changes.
    {
        if(xmlhttp.readyState == 4 && xmlhttp.status == 200)
        {
            var response = JSON.parse(xmlhttp.responseText);
            if( response.success === true )
            {
                document.getElementById('email2').setCustomValidity( response.message );
                document.getElementById("sign-up").reset();
            }
            else
            {
                localStorage.setItem( "token", response.data );
                document.getElementById('email2').setCustomValidity("");
            }
        }
    }
    xmlhttp.send(data);
    return false;
   }; // end of function

};//INIT_WELCOME_FUNCTIONS

init_profile_functions = function()
{
var ctx = document.getElementById("myChart").getContext("2d");
var myDoughnutChart = new Chart(ctx).Doughnut(data); //add chart och skit har!


   document.getElementById("upload").onclick = function() 
   {
      var file = fileInput.files[0];

      var reader = new FileReader( file );

      var text;
      reader.onload = function(e)
      {
         text = reader.result;
      }
      alert( text );

     var data = new FormData();
     data.append('file', text);
    
      var xmlhttp = new XMLHttpRequest();
      xmlhttp.open("POST", "/upload",true);
      //xmlhttp.setRequestHeader("Content-Type", file.type);
      xmlhttp.onreadystatechange = function()
      {
         if(xmlhttp.readyState == 4 && xmlhttp.status == 200)
            {
               var response = JSON.parse(xmlhttp.responseText);
               if( response.success == true )
               {
                  var blob = new Blob([ response.data ], {type: "image/png"});
                  alert( blob.size );
               }
               else
               {
                  alert("false");
               }
         }
    }
    //xmlHttpRequest.send(file);
    xmlhttp.send( data);
    return false;
   };


   document.getElementById("logout").onclick = function()
   {
       var temp_token = localStorage.getItem( "token" );

        var data = new FormData();
        data.append('token', temp_token);

        var xmlhttp = new XMLHttpRequest();
        xmlhttp.open("POST", "/sign_out",true);


        xmlhttp.onreadystatechange = function() //Call the function when the state changes.
        {
            if(xmlhttp.readyState == 4 && xmlhttp.status == 200)
            {

                var response = JSON.parse(xmlhttp.responseText);
             //   if( response.success !== false )
             //   {
                    SignOut();

               // }

            }
        }

        xmlhttp.send(data);

   };


   document.getElementById("change_psw").onsubmit = function()
   {
      var new_password = document.getElementById("password4").value;
      var ctr_new_password = document.getElementById("password5").value;
  
     if( new_password != ctr_new_password )
      {
         document.getElementById("password5").setCustomValidity("Your must write your new password twice!");
         return false;
      }
      else
      {
         document.getElementById("password5").setCustomValidity("");
      }

      var old_password = document.getElementById("password3").value;
      var temp_token = localStorage.getItem( "token" ); 


    var data = new FormData();
    data.append('token', temp_token);
    data.append('oldPassword', old_password);
    data.append('newPassword1', new_password);
    data.append('newPassword2', ctr_new_password);


    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open("POST", "/change_password",true);


    xmlhttp.onreadystatechange = function() //Call the function when the state changes.
    {
        if(xmlhttp.readyState == 4 && xmlhttp.status == 200)
        {

            var response = JSON.parse(xmlhttp.responseText);
            if( response.success === false )
            {
                document.getElementById("password3").setCustomValidity( response.message );
            }
            else
            {
                document.getElementById("password3").setCustomValidity( "" );
            }
        }
    }
    xmlhttp.send(data);


      return false;
   };


    document.getElementById("post_button").onclick = function()
    {
        var token   = localStorage.getItem( "token" );
       	var message = document.getElementById("message_post").value;
        var email   = localStorage.getItem( "email" );

        if( message === "" )
        {
            return false;
        }

        var data = new FormData();
          data.append('token', token);
          data.append('email', email);
          data.append('message', message);

          var xmlhttp = new XMLHttpRequest();
          xmlhttp.open("POST", "/post_message", true);


          xmlhttp.onreadystatechange = function () //Call the function when the state changes.
          {
              if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                  var response = JSON.parse(xmlhttp.responseText);

                  if (response.success === false) {

                  }
                  else {

                      }
                  }
              }
            xmlhttp.send(data);

            document.getElementById("message_post").value = "";
            document.getElementById("update_wall").click();
    };





  document.getElementById("update_wall").onclick = function()
  {

      var temp_token = localStorage.getItem("token");

      var data = new FormData();
      data.append('token', temp_token);

      var xmlhttp = new XMLHttpRequest();
      xmlhttp.open("POST", "/get_user_message_by_token", true);


      xmlhttp.onreadystatechange = function () //Call the function when the state changes.
      {
          if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
              var response = JSON.parse(xmlhttp.responseText);

              if (response.success === false) {
              }
              else {
                  var messages = ""
                  for (var i = response.data.length - 1; i >=  0; i--) {
                      messages += response.data[i][1] + "\n";
                      messages += response.data[i][0] + "\n" + "\n";
                  }
                  document.getElementById("message_read").value = messages;
              }
          }
      }
      xmlhttp.send(data);
  } // end of function

    document.getElementById("lookup_profile").onsubmit = function() {
        var email = document.getElementById("email4").value;
        var token = localStorage.getItem("token");

        var data = new FormData();
        data.append('token', token);
        data.append('email', email);

        var xmlhttp = new XMLHttpRequest();
        xmlhttp.open("POST", "/get_user_data_by_email", true);

        xmlhttp.onreadystatechange = function () //Call the function when the state changes.
        {
            if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                var response = JSON.parse(xmlhttp.responseText);

                if (response.success === true) {
                    localStorage.setItem("browse_email", email);
                    displayBrowserView("show_browse"); //Load all buttons and textareas when we check a valid profile
                    lookup_profile_functions();
                    //profileBrowse();
                    document.getElementById("update_wall_browse").click();

                    document.getElementById("profile_email_browse").innerHTML = response.data[0][0];
                    document.getElementById("profile_name_browse").innerHTML = response.data[0][1];
                    document.getElementById("profile_family_browse").innerHTML = response.data[0][2];
                    document.getElementById("profile_gender_browse").innerHTML = response.data[0][3];
                    document.getElementById("profile_country_browse").innerHTML = response.data[0][4];
                    document.getElementById("profile_city_browse").innerHTML = response.data[0][5];
                }
                else {
                    displayBrowserView("empty");
                    document.getElementById("email4").setCustomValidity("Invalid email");
                }
            }
        }
        xmlhttp.send(data);

        return false;
    }

   dropbox();
}; //PROFILE VIEW


//WHEN ONE REFESH
window.onload = function()
{
   if( localStorage.getItem( "token" ) === null || localStorage.getItem( "token" ) === undefined ) //NOT LOGIN IN
   {
      current_view = "welcomeview";
      displayView(current_view);
      init_welcome_functions();
      window.location.href = "#home_panel";  
   }
   else //LOG IN
   {
      current_view = "profileview";
      displayView(current_view);
 
      displayBrowserView("empty" ) //"Hide" all textareas in brows when we not check a valid profile
      //window.location.href = "#home_panel";
      init_profile_functions();
      document.getElementById("update_wall").click();
      setupProfile();

   }
};


validateSignUp = function()
{  
   var psw = document.getElementById("password2");
   var repeat_psw = document.getElementById("repeat_psw");

   psw.setCustomValidity("");
   repeat_psw.setCustomValidity("");

   if(psw.value.length < min_passw_length)
   {
      psw.setCustomValidity("Too short! It must be at least "+min_passw_length.toString()+" characters");
      return false;
   }
   else if(psw.value !== repeat_psw.value)
   {
      repeat_psw.setCustomValidity("Please enter the same password as above");
      return false;
   }
   else
   {
     return true;
   }
 };


validateSignIn = function( psw ) 
{
   if(psw.value.length < min_passw_length)
   {
      psw.setCustomValidity("Too short! It must be at least "+min_passw_length.toString()+" characters");
      return false;
   }
   else
   {
     psw.setCustomValidity("");
     return true;
   }
};

//THIS OBJECT IS CALLED WHEN WE CHECK A VALID PROFILE
lookup_profile_functions = function()
{
   document.getElementById("post_button_browse").onclick = function()
    {


        var token   = localStorage.getItem( "token" );
       	var message = document.getElementById("message_post_browse").value;
        var email   = localStorage.getItem( "email" );

        if( message === "" )
        {
            return false;
        }

        var data = new FormData();
          data.append('token', token);
          data.append('email', email);
          data.append('message', message);

          var xmlhttp = new XMLHttpRequest();
          xmlhttp.open("POST", "/post_message", true);

          xmlhttp.onreadystatechange = function () //Call the function when the state changes.
          {

              if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                  var response = JSON.parse(xmlhttp.responseText);
                  if (response.success === true) {
                    document.getElementById("message_post_browse").value = "";
                    document.getElementById("update_wall_browse").click();
                  }
              }
         }
        xmlhttp.send(data);
    }; //end of function



   document.getElementById("update_wall_browse").onclick = function()
    {

      var token = localStorage.getItem("token");
      var email = localStorage.getItem("browse_email");

      var data = new FormData();
      data.append('token', token);
      data.append('email', email);



      var xmlhttp = new XMLHttpRequest();
      xmlhttp.open("POST", "/get_user_message_by_email", true);


      xmlhttp.onreadystatechange = function () //Call the function when the state changes.
      {
          if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
              var response = JSON.parse(xmlhttp.responseText);

              if (response.success === true) {
                  var messages = ""
                  for (var i = response.data.length - 1; i >=  0; i--) {
                      messages += response.data[i][1] + "\n";
                      messages += response.data[i][0] + "\n" + "\n";
                  }
                  document.getElementById("message_read_browse").value = messages;
              }
          }
      }
      xmlhttp.send(data);
   }; // end function
};





function dropbox()
{
   function handleFiles( files )
   {
 

  for (var i = 0; i < files.length; i++) 
   {
      var file = files[i];
      var objectURL = window.URL.createObjectURL(file);

      alert(objectURL);

 
      var img = document.createElement("img");
      //img.classList.add("obj");
      img.file = file;

      document.getElementById("drop").appendChild(img);
      var temp = document.getElementById("drop").width
      
 var reader = new FileReader();
       reader.onload = (function(aImg) { return function(e){ aImg.height = 150; aImg.src = e.target.result;  aImg.width = 250}; } )  (img);
       reader.readAsDataURL(file);


      var xmlhttp = new XMLHttpRequest();
      xmlhttp.open("POST", "/download_file", true);

      var token = localStorage.getItem("token");

      var data = new FormData();
      data.append('token', token);
      data.append('URL', objectURL);


      xmlhttp.onreadystatechange = function () //Call the function when the state changes.
      {
          if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
              var response = JSON.parse(xmlhttp.responseText);
              alert("from server");
              if (response.success === true) 
                  {
                     
                  }
              }
          }
     
      xmlhttp.send(data);

   }
}



   var dropbox;
   dropbox = document.getElementById("drop");
   dropbox.addEventListener("dragenter", dragenter, false);
   dropbox.addEventListener("dragover", dragover, false);
   dropbox.addEventListener("drop", drop, false);

   function dragenter(e) 
   {
      e.stopPropagation();
      e.preventDefault();
   };

   function dragover(e) 
   {
      e.stopPropagation();
      e.preventDefault();
   };

   function drop(e) 
   {
      e.stopPropagation();
      e.preventDefault();

      var dt = e.dataTransfer;
      var files = dt.files;

      handleFiles(files);
      
   };
};
