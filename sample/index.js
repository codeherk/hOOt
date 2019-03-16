//   ██████╗ █████╗ ███╗   ██╗██╗   ██╗ █████╗ ███████╗     █████╗ ██████╗ ██╗
//  ██╔════╝██╔══██╗████╗  ██║██║   ██║██╔══██╗██╔════╝    ██╔══██╗██╔══██╗██║
//  ██║     ███████║██╔██╗ ██║██║   ██║███████║███████╗    ███████║██████╔╝██║
//  ██║     ██╔══██║██║╚██╗██║╚██╗ ██╔╝██╔══██║╚════██║    ██╔══██║██╔═══╝ ██║
//  ╚██████╗██║  ██║██║ ╚████║ ╚████╔╝ ██║  ██║███████║    ██║  ██║██║     ██║
//   ╚═════╝╚═╝  ╚═╝╚═╝  ╚═══╝  ╚═══╝  ╚═╝  ╚═╝╚══════╝    ╚═╝  ╚═╝╚═╝     ╚═╝
                                                                            
// install packages
const axios = require('axios');
const { Course, Assignment, ascii_art } = require('./canvas');

var access_token = "9957~ZSG3nWPwk5CsmpSjxHO8NXLaJqPV57Sviljh19SP0aXzZED2yTDmCrES3dX9wocW"; // byron
//var access_token  = "9957~rsVxuwVd7HAPmPrVmy6JvCSZO3sb0u92WTLo7ek7xQ2082ibpXc00X3FQbCbSHeY"; // erik
//var access_token = "ACCESS TOKEN GOES HERE" // NEVER, EVER PUSH YOUR ACCESS TOKEN UP TO GITHUB

var url = `https://templeu.instructure.com/api/v1/`;
var courseURL = 'courses?enrollment_state=active&enrollment_type=student';

const headerOptions = {
  headers: { 
    Authorization: 'Bearer ' + access_token
  }
};

var ignoreCourses = ['CIS Student Community Fall 2018', 'TU Alliance for Minority Participation (AMP) Program', 'Computer Science, Math, and Physics (CMP) Students'];

/*******************************************************************************/
/**************************** FUNCTION DECLARATIONS ****************************/
/*******************************************************************************/
const cyan = "\x1b[36m";
const red = "\x1b[31m";
const white = "\x1b[37m";
const reset = "\x1b[0m";

const log = function (){
  if(arguments.length == 1){
    console.log(arguments[0]);
  }else if(arguments.length == 2){
    console.log(arguments[1] + arguments[0] + reset);
  }

}

const formatCourses = function (courses, by) {
  var list;
  if(by == 'id'){
    list = []; // set list as empty array
    // loop thru courses and if course is valid, add to array
    for (var i = 0; i < courses.length; i++) {
      if(!ignoreCourses.includes(courses[i].name)){
        list.push(courses[i].id);
      }
    }
  }else if(by == 'name'){
    list = ''; // set list as empty string
    var name;
    var valid = [];

    // if courses are valid, add to array
    var i;
    for (i = 0; i < courses.length; i++) {
      name = courses[i].name; 
      //log(name) //debug 
      if (!ignoreCourses.includes(name)) {
        if (name.includes('-')) {
          name = name.split('-')[1];
        }
        name = name.replace("&","and"); // Alexa cannot speak &
        name = name.trim();
        valid.push(name)
      }
    }
    
    // loop thru courses, and format it to string that will be spoken
    for (i = 0; i < valid.length - 1; i++){
      name = valid[i];
      list += name + ', ';
    }

    list += 'and ' + valid[i] + '.'; // and <last course name>.
    
  }
  return list;
}


const getCourses = function (callback) {
  return axios.get(url + courseURL, headerOptions)
  .then(response => {
    //log(response) //debug
    var courses = [];
    for(var i = 0; i < response.data.length; i++){
      courses.push(new Course(response.data[i]));
    }
    //log(courses) //debug
    callback(courses);
  });
}

const getAssignments = function (courseID,callback) {
  var request = url + 'courses/' + courseID + '/assignments';
  //log(request)
  //https://templeu.instructure.com/api/v1/courses/99570000000054796/assignments?access_token=9957~ZSG3nWPwk5CsmpSjxHO8NXLaJqPV57Sviljh19SP0aXzZED2yTDmCrES3dX9wocW
  return axios.get(request, headerOptions)
    .then(response => {
      var data = response.data;
      var assignments = [];
      for (let i = 0; i < data.length; i++){
        assignments.push(new Assignment(data[i]));
      }
      //log(data[0]);
      //log(response); // debug
      //log(assignments);
      callback(assignments);
    });
}
/*******************************************************************************/
/************************* END OF FUNCTION DECLARATIONS ************************/
/*******************************************************************************/


log(ascii_art, cyan);
 
getCourses(courses => {
  //var courseIDs = formatCourses(courses,'id');
  var speechText = 'You are currently enrolled in: ' + formatCourses(courses,'name');
  log(speechText);

}).catch(error => {
  log("Could not get courses. " + error, red);
});
