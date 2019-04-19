//   ██████╗ █████╗ ███╗   ██╗██╗   ██╗ █████╗ ███████╗     █████╗ ██████╗ ██╗
//  ██╔════╝██╔══██╗████╗  ██║██║   ██║██╔══██╗██╔════╝    ██╔══██╗██╔══██╗██║
//  ██║     ███████║██╔██╗ ██║██║   ██║███████║███████╗    ███████║██████╔╝██║
//  ██║     ██╔══██║██║╚██╗██║╚██╗ ██╔╝██╔══██║╚════██║    ██╔══██║██╔═══╝ ██║
//  ╚██████╗██║  ██║██║ ╚████║ ╚████╔╝ ██║  ██║███████║    ██║  ██║██║     ██║
//   ╚═════╝╚═╝  ╚═╝╚═╝  ╚═══╝  ╚═══╝  ╚═╝  ╚═╝╚══════╝    ╚═╝  ╚═╝╚═╝     ╚═╝

/**
 * This file is part of the hooT VUI system.
 * It is a command line program
 * for the gathering of JSON data from the Canvas LMS API.
 * Running the program on its own will result in the return of various JSON data
 * from the Canvas API.
 * Received data depends on the provided Canvas access token.
 * @version 1.0
 * @author Byron Jenkins 
 * @author Erik Rosales
 * @author Kyle Lee
 * @author Terrell Nowlin
 * @author Brendan Connelly
 */

 // install packages
const axios = require('axios');
const { Course, Assignment, Announcement, ascii_art } = require('./canvas');
const { access_token } = require('./config');
const ld = require('./levenshtein');

//var access_token = "ACCESS TOKEN GOES HERE" // NEVER, EVER PUSH YOUR ACCESS TOKEN UP TO GITHUB

// base URL for HTTP requests to the Canvas LMS API
var url = `https://templeu.instructure.com/api/v1/`;
// URL parameters for a courses request.
// Filters HTTP request results to provide only actively enrolled courses.
var courseURL = 'courses?enrollment_state=active';
var announcementsURL = 'announcements?'
var studentURL = '&enrollment_type=student';
var TA_URL = '&enrollment_type=ta';
var scoreURL = '&include[]=total_scores';

/**
 * For the addition of header options including access token to HTTP request
 */
const headerOptions = {
  headers: { 
    Authorization: 'Bearer ' + access_token
  }
};

var ignoreCourses = ['CIS Student Community Fall 2018', 'TU Alliance for Minority Participation (AMP) Program', 'Computer Science, Math, and Physics (CMP) Students'];

/********************************************************************************************/
/*********************************** FUNCTION DECLARATIONS **********************************/
/********************************************************************************************/
const cyan = "\x1b[36m";
const red = "\x1b[31m";
const white = "\x1b[37m";
const reset = "\x1b[0m";

/**
 * Wrapper function for the printing of data
 */
const log = function (){
  if(arguments.length == 1){
    console.log(arguments[0]);
  }else if(arguments.length == 2){
    console.log(arguments[1] + arguments[0] + reset);
  }
}

/**
 * Makes an HTTP GET request to Canvas LMS API.
 * Creates Course objects by parsing received JSON response.
 * Passes array of Course objects to callback function, filtering out various "garbage" courses.
 * @param {function} callback 
 */
const getCourses = function (callback) {
  return axios.get(url + courseURL + studentURL + scoreURL, headerOptions)
  .then(response => {
    //log(response) //debug
    var courses = [];
    for(let i = 0; i < response.data.length; i++){
      courses.push(new Course(response.data[i]));
    }
    courses = courses.filter((course) => !ignoreCourses.includes(course.name));
    //log(courses) //debug
    callback(courses);
  });
}

//%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
//%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
//Uncomment later
//%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
//%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
// const getTACourses = function (callback) {
//   return axios.get(url + courseURL + TA_URL, headerOptions)
//   .then(response => {
//     //log(response) //debug
//     var courses = [];
//     for(let i = 0; i < response.data.length; i++){
//       courses.push(new Course(response.data[i]));
//     }
//     //log(courses) //debug
//     courses = courses.filter((course) => !ignoreCourses.includes(course.name));
//     callback(courses);
//   });
// }

/**
 * Makes an HTTP GET request to Canvas LMS API.
 * Specifies that request should return courses in which user is a TA
 * Creates Course objects by parsing received JSON response.
 * Passes array of Course objecst to callback function, filtering out various "garbage" courses
 * @param {function} callback 
 */
const getTACourses = function (callback) {
  return axios.get(url + courseURL + TA_URL, headerOptions)
  .then(response => {
    //log(response) //debug
    var courses = [];
    for(let i = 0; i < response.data.length; i++){
      courses.push(new Course(response.data[i]));
    }
    //log(courses) //debug
    courses = courses.filter((course) => !ignoreCourses.includes(course.name));
    callback(courses);
  });
}

/**
 * Remove ignored courses from course list.
 * Return list of either course names or course ids depending on 'by' param.
 * @param {Course []} courses 
 * @param {String} by 
 */
const mapCourses = function (courses, by = null) {
  // courses = courses.filter((course) => !ignoreCourses.includes(course.name));
  if(by == 'id'){
    return courses.map(course => course.id);
  }else if(by == 'name'){
    return courses.map(course => course.name);
  }
  return courses
}

/**
 * Get list of course names from 'courses' param.
 * Format course list into easily spoken/displayed String.
 * @param {Course []} courses 
 * @returns {String} list of formatted course names.
 */
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
  if (i == 0) {
    list += titles[i] + '.';
  } else {
    list += 'and ' + titles[i] + '.'; // and <last course name>. 
  }
  return list;
}

/**
 * Makes an HTTP GET request to Canvas LMS API.
 * Receives a response from API with all of a user's assignments for a course with the given course ID.
 * Creates an array of Assignment objects based on API's response.
 * Passes in array of Assignment objects to callback function.
 * @param {String} courseID 
 * @param {function} callback 
 */
const getAssignments = function (courseID, includeSubmissions, callback) {
  var request = url + 'courses/' + courseID + '/assignments';

  if (includeSubmissions) {
    request += '?include[]=submission';    
  }

  //log(request)
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

/**
 * Loops through array of course IDs, adding courses to the request URL.
 * Makes an HTTP GET Request to Canvas LMS API.
 * Receives a response from API with all anouncements from courses specified in the CourseIDS param.
 * Creates an array of Announcement objects based on API's response.
 * Calls callback function, passiing in Announcement array as param.
 * @param {String []} courseIDS 
 * @param {function} callback 
 */
const getAnnouncements = function (courseIDS,callback) {
  var temp= announcementsURL;
  for (var i = 0; i < courseIDS.length; i++){
    if (i==(courseIDS.length-1)) {
      temp = temp + 'context_codes[]=course_' + courseIDS[i];
    } else {
      temp = temp + 'context_codes[]=course_' + courseIDS[i]+'&';
    }
  }
  return axios.get(url + temp, headerOptions)
  .then(response => {
    //log(response) //debug
    var announcements = [];
    for (let i = 0; i < response.data.length; i++){
      announcements.push(new Announcement(response.data[i]));
    }

    for(let i = 0; i < announcements.length; i++){
      var msg = announcements[i].message;
      var new_msg = "";
      var b = 1
      for (let j = 0; j < msg.length; j++) {
        if (msg[j] == '<') {
          b = 1;
          continue;
        }
        if (msg[j] == '>') {
          b = 0;
          continue;
        }
        if (b == 0) {
          new_msg = new_msg + msg[j];
        }
      }
      announcements[i].message = new_msg;
    }
    callback(announcements);
  });
}

/**
 * Makes an HTTP GET request to Canvas LMS API, specifying API returns upcoming assignments only.
 * Receives a response from API with all of a user's upcoming assignments for a course with the given course ID.
 * Creates an array of Assignment objects based on API's response.
 * Calls callback function, passing in upcoming Assignment array as param.
 * @param {String} courseID 
 * @param {function} callback 
 */
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

/**
 * Create array of Assignments.
 * Add assignments from task param. into new array adding due-date details.
 * @param {Assignment []} tasks 
 * @returns {Assignment []} list
 */
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

/**
 * Extract course names, scores, and letter grades from courses.
 * Print formatted list of course names, scores, and letter grades.
 * @param {Course []} courses 
 */
const courseGradesToString = function(courses) {
  var letterGrade = null, score = null, courseName = null;
  var speechText = '';
  for (var i in courses) {
    if (courses.hasOwnProperty(i)) {
      letterGrade = courses[i].enrollments.computed_current_grade;
      score = courses[i].enrollments.computed_current_score;
      courseName = courses[i].name;
      
      if (score == undefined || score == null) {
        speechText += `${courseName} has no current score`;
      } else if (letterGrade == undefined || letterGrade == null) {
        speechText += `${courseName}, ${score}`;
      } else {
        speechText += `${courseName}, ${score}, which is an ${letterGrade}`;
      }
      if(i == courses.length - 2){
        speechText += ', and ';
      }else{
        speechText += '. '
      }
    }
  }
  return speechText + "Please be mindful that these scores are unweighted.";
}

/**
 * Extract submission score, points possible, and assignment name.
 * Calculate percentage score for submitted assignments.
 * @param {Assignment []} assignments 
 * @returns {String} formatted string of percentage scores for submitted assignments.
 */
const submissionScoresToString = function(assignments) {
  var assignmentName = '', submissionScore = '', pointsPossible = '';
  var scoresString = '';

  for (var i in assignments) {
    if (assignments.hasOwnProperty(i)) {
      assignmentName = assignments[i].name;
      submissionScore = assignments[i].submission.score;
      pointsPossible = assignments[i].points_possible;
      var percent;
      if (submissionScore != null) {
        percent = (submissionScore / pointsPossible) * 100;
        scoresString += 'Your score for ' + assignmentName + ' is ' + percent + ' percent. ';
      }
    }
  }
  return 'Your scores are as follows: ' + scoresString;
}

/**
 * Makes an HTTP GET request to Canvas LMS API.
 * Receives response from API about exported courses and course content.
 * Calls callback function, passing in response data.
 * @param {String} courseID 
 * @param {function} callback 
 */
const getContentExports = function (courseID,callback) {
  var result = url + 'courses/' + courseID + '/content_exports';
  return axios.get(result, headerOptions)
    .then(res => {
      log(res.data);
      callback(res.data);
    });
  }

  /**
   * Makes an HTTP GET request to Canvas LMS API.
   * Receives response from API containing list of all students enrolled in a course with the given Course ID.
   * Calls callback function, passing in response as param. 
   * @param {String} courseID 
   * @param {function} callback 
   */
  const getUsers = function (courseID,callback) {
    var result = url + 'courses/' + courseID + '/users' + '?enrollment_type[]=student';

    return axios.get(result, headerOptions)
    .then(response => {
      //log(response) //debug
      log(response.headers)
      //callback(response);
    });
}

/********************************************************************************************/
/******************************* END OF FUNCTION DECLARATIONS *******************************/
/********************************************************************************************/

//log(ascii_art);

/*getCourses(courses => {

  var speechText = '\n\nYou are currently enrolled in: ' + coursesToString(courses);
  log(speechText);
  log("Your current grades are as follows: " + courseGradesToString(courses));

  var courseIDs = mapCourses(courses,'id');
  //log(courseIDs);
  
  getUpcomingAssignments(courseIDs[0], tasks => {
    log(formatAssignments(tasks))
  }).catch(error => {
    log("Could not get assignments. " + error, red);
  });
  //get annoucements
  getAnnouncements(courseIDs, announcements => {
    for( let i=0;i<announcements.length;i++){
      log((announcements[i].message));
    }
  }).catch(error => {
    log("Could not get announcements. " + error, red);
  });

}).catch(error => {
  log("Could not get courses. " + error, red);
});

getTACourses(courses => {
  //var courseIDs = formatCourses(courses,'id');
  var courseIDs = mapCourses(courses,'id');
  var speechText = 'You are currently teaching: ' + coursesToString(courses);
  log(speechText);
  
  // getContentExports(courseIDs[0], res => {
  //   log(res);
  // getUsers(courseIDs[0], res => {
  //   log(res);
  // })

  // get all assignments and tell total

  // getAssignments(courseIDs[0], tasks => {
  //   //log(tasks[0].name)
  //   //log(tasks[0].description);
  //   log(formatAssignments(tasks))
  // }).catch(error => {
  //   log("Could not get assignments. " + error, red);
  // });
}).catch(error => {
  log("Could not get courses. " + error, red);
});*/

// getCourses(courses => {
//   var courseIDs = mapCourses(courses,'id');
//   //receive grades for ALL submitted assignments in ALL registered courses.
//   for (var i = 0; i < courseIDs.length; i++) {
//     getAssignments(courseIDs[i], true, tasks => {
//       log(submissionScoresToString(tasks));
//       log('\n');
//     });
//   }
// });

//##############################################################################################
//Test begin
//##############################################################################################

test_phrase = ['The Good','good Life','Common Good',
                'Modern Algebra','Physics','Lab',
                'Physics Lab','Projects'];

const beginTest = () => {

  log('1');

  getCourses(courses => {

    log('2');
    var courseIDs = mapCourses(courses,'id');
    var courseNames = mapCourses(courses, 'name');
  
    var enrolled = [];
    log('3');
    for (let i = 0; i<courses.length; i++) {
      
      enrolled.push(new Course(courses[i]));
  
    }//end
    log('4');
    //log(enrolled);
    for (let i = 0; i<test_phrase.length; i++) {
  
      log('You are asking for: ' + '\"' + test_phrase[i] + '\"' + '\n');
      log('Results:');
      var temp = ld.FinalWord(test_phrase[i], enrolled);

      //log(temp.object.name + '\n');

      log('name: ' + temp.object.name 
          + '\nleven distance: ' + temp.object.distance
          + '\nmatch: ' + temp.object.match);
      log('\nEnd Result-------------------------------');
  
    }//end for
  
  });

}//end begin test

beginTest();

const nest_test = () => {

  getCourses(courses => {

    var courseIDs = mapCourses(courses,'id');
    var courseNames = mapCourses(courses, 'name');

    getUpcomingAssignments(courseIDs[0],tasks => {

      log(formatAssignments(tasks))
    }).catch(error => {
    log("Could not get assignments. " + error, red);

    });

  });

}//end nest test


//nest_test();