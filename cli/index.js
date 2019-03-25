//   ██████╗ █████╗ ███╗   ██╗██╗   ██╗ █████╗ ███████╗     ██████╗██╗     ██╗
//  ██╔════╝██╔══██╗████╗  ██║██║   ██║██╔══██╗██╔════╝    ██╔════╝██║     ██║
//  ██║     ███████║██╔██╗ ██║██║   ██║███████║███████╗    ██║     ██║     ██║
//  ██║     ██╔══██║██║╚██╗██║╚██╗ ██╔╝██╔══██║╚════██║    ██║     ██║     ██║
//  ╚██████╗██║  ██║██║ ╚████║ ╚████╔╝ ██║  ██║███████║    ╚██████╗███████╗██║
//   ╚═════╝╚═╝  ╚═╝╚═╝  ╚═══╝  ╚═══╝  ╚═╝  ╚═╝╚══════╝     ╚═════╝╚══════╝╚═╝
 
                                                                            
// install packages
const axios = require('axios');
const { Course, Assignment, ascii_art } = require('./canvas');
const { access_token } = require('./config');

var url = `https://templeu.instructure.com/api/v1/`;
var courseURL = 'courses?enrollment_state=active&enrollment_type=student';
var TA_URL = 'courses?enrollment_state=active&enrollment_type=ta';

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

const getTACourses = function (callback) {
  return axios.get(url + TA_URL, headerOptions)
  .then(response => {
    //log(response.data) //debug
    var courses = [];
    for(let i = 0; i < response.data.length; i++){
      courses.push(new Course(response.data[i]));
    }
    //log(courses) //debug
    callback(courses);
  });
}

const getCourses = function (callback) {
  return axios.get(url + courseURL, headerOptions)
  .then(response => {
    //log(response) //debug
    var courses = [];
    for(let i = 0; i < response.data.length; i++){
      courses.push(new Course(response.data[i]));
    }
    //log(courses) //debug
    callback(courses);
  });
}

const mapCourses = function (courses, by) {
  courses = courses.filter((course) => !ignoreCourses.includes(course.name)); // only get courses we want
  if(by == 'id'){
    return courses.map(course => course.id);
  }else if(by == 'name'){
    return courses.map(course => course.name);
  }
  return list;
}

const coursesToString = function(courses){
  var titles = mapCourses(courses,"name");

  if(titles.length == 1){
    return [titles[0]];
  }

  var list = ''; // set list as empty string
  var i; 
  // loop thru courses, and format it to string that will be spoken
  for (i = 0; i < titles.length - 1; i++){
    list += titles[i] + ', ';
  }

  list += 'and ' + titles[i] + '.'; // and <last course name>. 
  return list;
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

const getUpcomingAssignments = function(courseID,callback){
  var request = url + 'courses/' + courseID + '/assignments?bucket=upcoming';
  return axios.get(request, headerOptions)
    .then(response => {
      var data = response.data;
      var assignments = [];
      //log(response.status);
      for (let i = 0; i < data.length; i++){
        assignments.push(new Assignment(data[i]));
      }
      //log(data[0]);
      //log(response); // debug
      //log(assignments);
      callback(assignments);
    });
}
const formatAssignments = function (tasks){
  var list = [];
  var detail;
  for (let i = 0; i < tasks.length; i++){
    detail = `You have ${tasks[i].name} `;
    if(tasks[i].due){
      detail += `that is due ${tasks[i].due}.`
    }else{
      detail += 'without a due date. Contact your professor for more info'
    }
    list.push(detail);
  }
  return list;
}

const getContentExports = function (courseID,callback) {
  var result = url + 'courses/' + courseID + '/content_exports';
  return axios.get(result, headerOptions)
    .then(res => {
      log(res.data);
      callback(res.data);
    });
  }

  const getUsers = function (courseID,callback) {
    var result = url + 'courses/' + courseID + '/users' + '?enrollment_type[]=student';

    return axios.get(result, headerOptions)
    .then(response => {
      //log(response) //debug
      log(response.headers)
      //callback(response);
    });
  }

/*******************************************************************************/
/************************* END OF FUNCTION DECLARATIONS ************************/
/*******************************************************************************/


log(ascii_art, cyan);
 
getCourses(courses => {
  log(courses)
  var speechText = '\n\nYou are currently enrolled in: ' + coursesToString(courses);
  log(speechText);

  var courseIDs = mapCourses(courses,'id');
  //log(courseIDs);

  getUpcomingAssignments(courseIDs[0], tasks => {
    //log(tasks[0].name)
    //log(tasks[0].description);
    log(formatAssignments(tasks))
  }).catch(error => {
    log("Could not get assignments. " + error, red);
  });
}).catch(error => {
  log("Could not get courses. " + error, red);
});

// getTACourses(courses => {
//   //var courseIDs = formatCourses(courses,'id');
//   var courseIDs = mapCourses(courses,'id');
//   var speechText = 'You are currently teaching: ' + coursesToString(courses);
//   log(speechText);
  
//   // getContentExports(courseIDs[0], res => {
//   //   log(res);
//   getUsers(courseIDs[0], res => {
//     //log(res);
//   })

//   // get all assignments and tell total

//   // getAssignments(courseIDs[0], tasks => {
//   //   //log(tasks[0].name)
//   //   //log(tasks[0].description);
//   //   log(formatAssignments(tasks))
//   // }).catch(error => {
//   //   log("Could not get assignments. " + error, red);
//   // });
// }).catch(error => {
//   log("Could not get courses. " + error, red);
// });