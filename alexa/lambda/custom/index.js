/* eslint-disable  func-names */
/* eslint-disable  no-console */

/**
 * This file is part of the hooT VUI system.
 * It contains the intent functions and their related handlers
 * for the Amazon Lambda function associated with the project.
 * It also contains various other helper functions and variables.
 * @version 1.0
 * @author Byron Jenkins 
 * @author Erik Rosales
 * @author Kyle Lee
 * @author Terrell Nowlin
 * @author Brendan Connelly
 */

// IMPORT MODULES
const Alexa = require('ask-sdk-core');
const axios = require('axios');
const moment = require('moment');
const { Student, Course, Assignment, Announcement} = require('./canvas');
const ld = require('./levenshtein');
//const { access_token } = require('./config'); // create config.js in your code

var alexa_access_token = '';

// base URL for HTTP requests to the Canvas LMS API
var url = `https://templeu.instructure.com/api/v1/`;

// URL parameters for a courses request.
// Filters HTTP request results to provide only actively enrolled courses.
// var courseURL = 'courses?enrollment_state=active&enrollment_type=student&include[]=total_scores';
var courseURL = 'courses?enrollment_state=active';
var studentURL = '&enrollment_type=student';
var TA_URL = '&enrollment_type=ta';
var scoreURL = '&include[]=total_scores';
var announcementURL = 'announcements?';

const NO_COURSE_MATCH_FOUND = " is not in your list of courses.";

/**
 * For the addition of header options including access token to HTTP request
 */
var headerOptions = null;

var ignoreCourses = ['CIS Student Community Fall 2018', 'TU Alliance for Minority Participation (AMP) Program', 'Computer Science, Math, and Physics (CMP) Students'];
var smallImgUrl = 'https://assets.pcmag.com/media/images/423653-instructure-canvas-lms-logo.jpg?width=333&height=245';
var largeImgUrl = 'https://am02bpbsu4-flywheel.netdna-ssl.com/wp-content/uploads/2013/01/canvas_stack.jpg';

/********************************************************************************************/
/*********************************** FUNCTION DECLARATIONS **********************************/
/********************************************************************************************/


//set canvas headers
const setHeaderOptions = function(token){
  headerOptions = {
    headers: {
      Authorization: 'Bearer ' + token
    }
  }
}

/**
 * Makes an HTTP GET request to Canvas LMS API.
 * Creates Course objects by parsing received JSON response.
 * Passes array of Course objects to callback function.
 * @param {function} callback 
 */
const getCourses = function (callback) {
  return axios.get(url + courseURL + studentURL + scoreURL, headerOptions)
    .then(response => {
      //log(response) //debug
      var courses = [];
      for (let i = 0; i < response.data.length; i++) {
        courses.push(new Course(response.data[i]));
      }
      courses = courses.filter((course) => !ignoreCourses.includes(course.name));
      //log(courses) //debug
      callback(courses);
    });
}

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
const mapCourses = function (courses, by) {
  //courses = courses.filter((course) => !ignoreCourses.includes(course.name)); 
  if (by == 'id') {
    return courses.map(course => course.id);
  } else if (by == 'name') {
    return courses.map(course => course.name);
  }
  return list;
}

/**
 * Loops through array of course IDs, adding courses to the request URL.
 * Makes an HTTP GET Request to Canvas LMS API.
 * Receives a response from API with all anouncements from courses specified in the CourseIDS param.
 * Creates an array of Announcement objects based on API's response.
 * Calls callback function, passiing in Announcement array as param.
 * @param {String []} courseIDS 
 * @param {Date} startDate 
 * @param {function} callback 
 */
const getAnnouncements = function (courseIDs, startDate, callback) {
  // if start date is null, set default days to 7
  startDate = startDate ? startDate : moment().subtract(7,'d').format('YYYY-MM-DD'); 
  var result = url + announcementURL + `context_codes[]=course_${courseIDs[0]}`;
  for (let i = 1; i < courseIDs.length; i++) {
    result += `&context_codes[]=course_${courseIDs[i]}`;
  }
  result += `&start_date=${startDate}`;
  //log(`startDate: ${startDate}`);
  //log(`request: ${result}`);
  return axios.get(result, headerOptions)
  .then(response => {
    var announcements = [];
    for (let i = 0; i < response.data.length; i++){
      announcements.push(new Announcement(response.data[i]));
    }
    callback(announcements);
  });
}

/**
 * Groups Announcements by the course. 
 * Returns the announcement array sorted.
 * @param {Announcement []} announcements 
 */
const groupAnnouncements = function(announcements){
  var notice = announcements.length ? [] : announcements;
  //console.log(notice);
  var temp, code;
  while(announcements.length != 0){
    // get first announcement context code
    code = announcements[0].context_code;
    temp = announcements.filter((notice) => notice.context_code.includes(code));
    announcements = announcements.filter((notice) => !temp.includes(notice));
    notice.push(temp);
  }
  //console.log(notice);
  //var notice = notice.reduce((acc, val) => acc.concat(val), []);// [1, 2, 3, 4]
  return notice;
}

/**
 * Get list of course names from 'courses' param.
 * Format course list into easily vocalized String.
 * @param {Course []} courses 
 * @returns {String} list of formatted, vocalizable course names.
 */
const coursesToString = function (courses) {
  var titles = mapCourses(courses, "name");
  var list = ''; // set list as empty string
  var i;
  // loop thru courses, and format it to string that will be spoken
  for (i = 0; i < titles.length - 1; i++) {
    list += titles[i] + ', ';
  }

  if(i == 0){
    list += titles[i] + '.';
  }else{
    list += 'and ' + titles[i] + '.'; // and <last course name>. 
  }
  return list;
}

/**
 * Get list of annoucements from 'courses' param.
 * Format announcement list into easily vocalized String.
 * @param {announcements []} announcements 
 * @returns {String} list of formatted, vocalizable announcements.
 */

const announcementsToString = function (group) {
  var list = ''; // set list as empty string
  //log(announcements); // debug
  group.forEach(c => {
    list += `For ${c[0].course_name}: `
    for(let i = 0; i < c.length;i++){
      list += `Title: ${c[i].title}. Author: ${c[i].author}. Date posted: ${moment(c[i].posted_at).format('LL')}. `
      list += `<p>Message: ${c[i].message}.</p> `
    }
  });
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
        percent = ((submissionScore / pointsPossible) * 100);
        //for readability. found up for scores with decimal points
        if (percent % 1 != 0) {
          percent = ((submissionScore / pointsPossible) * 100).toFixed(2);
        }
        //scoresString += `Your score for ${assignmentName}, is ${percent} percent. `;
        scoresString += `${assignmentName}, ${percent} percent. `;
      }
    }
  }
  return 'your submission scores are as follows: ' + scoresString;
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
};

/**
 * Updated getAssignments function.
 * Makes an HTTP GET request to Canvas LMS API.
 * If includeSubmissions param. == true, response includes submissions field.
 * If bucket param. == upcoming, only assignments with upcoming field set to true will be returned
 * Otherwise, all Assignments corresponding to courseID param. will be returned.
 * Creates an array of Assignment objects based on API's response.
 * Passes array of Assignment objects to callback function.
 * @param {String} courseID 
 * @param {boolean} includeSubmissions 
 * @param {String} bucket 
 * @param {function} callback 
 */
const getAssignments = function(courseID, includeSubmissions, bucket = 'upcoming', callback) {
  var requestURL = url + 'courses/' + courseID + '/assignments';

  if (includeSubmissions) {
    requestURL += '?include[]=submission'
  }

  if (bucket === 'upcoming') {
    requestURL += '&bucket=upcoming'
  }

  return axios.get(requestURL, headerOptions)
    .then(response => {
      var data = response.data;
      var assignments = [];
      for (let i = 0; i < data.length; i++) {
        assignments.push(new Assignment(data[i]));
      }
      callback(assignments);
    });
};

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
 * Makes an HTTP GET request to Canvas LMS API.
 * Receives response from API containing list of all students enrolled in a course with the given Course ID.
 * Calls callback function, passing in response as param. 
 * @param {String} courseID 
 * @param {function} callback 
*/
const getUsers = function (courseID, callback) {
  var result = url + 'courses/' + courseID + '/users' + '?enrollment_type[]=student&per_page=20';
  return get(result).then(data => {
    var students = [];
    // create student objects
    for (let i = 0; i < data.length; i++) {
      students.push(new Student(data[i]));
    }
    callback(students);
  });
}

function get(url, data = []) {
  return axios.get(url,headerOptions)
    .then(response => {
      data = data.concat(response.data);
      // get next data from next link if possible
      var linklist = response.headers['link'].split(",");
      var nextLink = linklist.filter((link) => link.split(";")[1].includes("next"));
      
      if (nextLink && nextLink.length) {
        nextLink = nextLink[0].split(";")[0];
        nextLink = nextLink.substring(1, nextLink.length - 1);
        return get(nextLink, data)
      }
      return data
    });
}

function formatStudents(students, by = 'full'){
  var string = '';
  let i = 0;
  if(by == 'first'){
    students = students.map(student => student.name.split(' ')[0]);
  }else{
    students = students.map(student => student.name);
  }
  for (; i < students.length - 1; i++) {
    string += `${students[i]}, `;
  }
  string += `and ${students[i]}.`;
  return string;
}

/**
 * Makes an HTTP GET request to Canvas LMS API.
 * Receives response from API containing name of professor for a course with the given Course ID.
 * Calls callback function, passing in response as param. 
 * @param {String} courseID 
 * @param {function} callback 
*/
const getProfessor = function (courseID, callback) {
  var result = url + 'courses/' + courseID + '/users' + '?enrollment_type[]=teacher';
  return get(result).then(data => {
    var professor = data[0].name;
    //console.log(teacher);
    callback(professor);
  });
}

function listStudents(handlerInput, requestedCourse, courses){
  //console.log(`Inside list students. courses: ${courses}`);
  //compare requestedCourse with course array
  var bestMatch = ld.MatchMaker(requestedCourse, courses); // return course id
  
  return new Promise(resolve => {
    if (bestMatch.object == null){
      // tell user 
      var output = `${requestedCourse}, ${NO_COURSE_MATCH_FOUND}`;
      resolve(handlerInput.responseBuilder
        .speak(output)
        .withSimpleCard("Error", output)
        .withShouldEndSession(false) // without this, we would have to ask alexa to open hoot everytime
        .getResponse())
      }else{
        var courseID = bestMatch.object.id;
        console.log(`bestMatch object ${bestMatch}`);
      getUsers(courseID, students => {
        var list = formatStudents(students);
        var output = `The students currently enrolled in ${bestMatch.object.name} are: ${list}`;
        console.log(`list of students: ${list}`);
        resolve(handlerInput.responseBuilder
          .speak(output)
          .withSimpleCard(bestMatch.object.name, list)
          .withShouldEndSession(false) // without this, we would have to ask alexa to open hoot everytime
          .getResponse())
      }).catch(error => {
         resolve(speakError(handlerInput,`I had trouble getting the list of students. Try again later.`, error));
      });
    }
  });
}

function getTotalStudents(handlerInput, requestedCourse, courses){
  var bestMatch = ld.MatchMaker(requestedCourse, courses); // return course id
  return new Promise(resolve => {
    if (bestMatch.object == null){
      // tell user 
      var output = `${requestedCourse}, ${NO_COURSE_MATCH_FOUND}`;
      resolve(handlerInput.responseBuilder
        .speak(output)
        .withSimpleCard("Error", output)
        .withShouldEndSession(false) // without this, we would have to ask alexa to open hoot everytime
        .getResponse())
    }else{
      var courseID = bestMatch.object.id;
      console.log(`bestMatch object ${bestMatch}`);
      getUsers(courseID, students => {
        //var list = formatStudents(students);
        var output = `There are a total of ${students.length} students in your ${bestMatch.object.name} class.`;
        resolve(handlerInput.responseBuilder
          .speak(output)
          .withSimpleCard(bestMatch.object.name, output)
          .withShouldEndSession(false) // without this, we would have to ask alexa to open hoot everytime
          .getResponse())
      }).catch(error => {
         resolve(speakError(handlerInput,`I had trouble getting the total number of students. Try again later.`, error));
      });
    }
  });
}

function getProfessorName(handlerInput, requestedCourse, courses){
  var bestMatch = ld.MatchMaker(requestedCourse, courses); // return course id
  console.log(bestMatch);
  
  return new Promise(resolve => {
    if (bestMatch.object == null){
      // tell user 
      var output = `${requestedCourse}, ${NO_COURSE_MATCH_FOUND}`;
      resolve(handlerInput.responseBuilder
        .speak(output)
        .withSimpleCard("Error", output)
        .withShouldEndSession(false) // without this, we would have to ask alexa to open hoot everytime
        .getResponse())
    }else{
      console.log(`Best match for ${requestedCourse}: ${bestMatch.object.id} ,${bestMatch.object.name}`)
      var courseID = bestMatch.object.id;
      getProfessor(courseID, professor => {
        //var list = formatStudents(students);
        var output = `Your professor for ${bestMatch.object.name} is ${professor}. `;
        resolve(handlerInput.responseBuilder
          .speak(output)
          .withSimpleCard(bestMatch.object.name, output)
          .withShouldEndSession(false) // without this, we would have to ask alexa to open hoot everytime
          .getResponse())
      }).catch(error => {
         resolve(speakError(handlerInput,`I had trouble getting the total number of students. Try again later.`, error));
      });
    }
  });
}

function getUserInfo(accessToken, callback) {
  const request = {
    //Replace the host with your cognito user pool domain 
    method: 'GET',
    baseURL: 'https://alexa-hoot.auth.us-east-1.amazoncognito.com',
    url: '/oauth2/userInfo',
    port: 443,
    headers: {
        'authorization': 'Bearer ' + accessToken
    }
  };
  return axios(request).then(res => {
    callback(res);
  });
}

// upon an error, we should said there is an error and end session
function speakError(handlerInput, speechText , error){
  console.log(`${speechText}. ERROR: ${error}`);
  return handlerInput.responseBuilder
          .speak(speechText)
          .getResponse();
}


/********************************************************************************************/
/******************************* END OF FUNCTION DECLARATIONS *******************************/
/********************************************************************************************/

/**
 * Handler for skill's Launch Request Intent.
 * Invokes canHandle() to ensure request is a LaunchRequest.
 * Invokes handle() to vocalize greeting to user.
 */
const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
  },
  handle(handlerInput) {
    if (handlerInput.requestEnvelope.context.System.user.accessToken === undefined) {
      return handlerInput.responseBuilder
        .speak("to start using this skill, please use the companion app to authenticate")
        .reprompt("to start using this skill, please use the companion app to authenticate")
        .withLinkAccountCard()
        .getResponse();
    }else {

      return new Promise(resolve => {
        //console.log(`user id is: ${handlerInput.requestEnvelope.context.System.user.userId}`);
        let speechText = 'Welcome to hOOt for Canvas, You can say help for more information. How may I help you? ';
        let displayText = 'Welcome, You can say "Help" for more information. How may I help you? ';
        // user is signed in, get access token from amazon
        alexa_access_token = handlerInput.requestEnvelope.context.System.user.accessToken;
        //console.log(`aat: ${alexa_access_token}`); // access token granted from amazon cognito
        
        // try to get info about user. 
        try {
          // make a call to get user attributes
          getUserInfo(alexa_access_token, response => {
            //console.log(response.data);
            //console.log(response.data.zoneinfo);

            const sessionAttributes = handlerInput.attributesManager.getSessionAttributes(); // get session attributes
            sessionAttributes.access_token = response.data.zoneinfo; // store access token in session
            setHeaderOptions(response.data.zoneinfo);
            
            getCourses(courses => {
              sessionAttributes.courses = courses
              handlerInput.attributesManager.setSessionAttributes(sessionAttributes); // save session attributes
              
              var courseIDs = mapCourses(courses,'id');
              var startDate = moment().utcOffset("-04:00").subtract(5,'d').format('YYYY-MM-DD');
              // get new announcements
              getAnnouncements(courseIDs, startDate, announcements => {
                var total = announcements.length;
                var notice = null;

                // speech string formatting
                // (if total is 1) you have AN announcement. (if total > 1) you have {total} announcement(s)
                if(total == 1){
                  speechText += '<emphasis level="reduced">By the way</emphasis>, you have 1 announcement available. Say <break strength="medium"/> what are my announcements, to view them.';
                  displayText = 'You have an 1 announcement. Say "What are my announcements?" to view them.';
                }else if (total > 1){
                  speechText += `<emphasis level="reduced">By the way</emphasis>, you have ${total} announcements available. Say <break strength="medium"/> what are my announcements, to view them.`;
                  displayText = `You have ${total} announcements. Say "What are my announcements?" to view them.`;
                }
                // // if there are any announcements, inform user. 
                // if(notice != null){
                //   // only include SSML tags in speechText so Alexa display does show the tags
                //   speechText += `<emphasis level="moderate">By the way</emphasis>, ${notice}`
                // }

                resolve(handlerInput.responseBuilder
                  .speak(speechText)
                  .reprompt(speechText)
                  .withSimpleCard('hOOt for Canvas', displayText)
                  .getResponse());
              })

            }).catch(error => {
              resolve(speakError(handlerInput,"I had trouble getting your courses. Please try again later.",error));
            });

          }).catch(error => {
            resolve(speakError(handlerInput,"I had trouble getting access to canvas.",error));
          });
          
        }catch(error) {
          resolve(speakError(handlerInput,"I had trouble getting access to canvas. Try again later.",error));
        }
      });
    }
  },
};

/**
 * Handler for skill's getCourses Intent.
 * Invokes canHandle() to ensure request is an IntentRequest
 * matching the declared CoursesIntent Intent.
 * Invokes handle() to receive course list from getCourses() function
 * and vocalize the Canvas user's course list.
 */
const CoursesIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
      handlerInput.requestEnvelope.request.intent.name === 'CoursesIntent';
  },
  handle(handlerInput) {
    // retrieve courses from session attributes
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const courses = attributes.courses
    return new Promise(resolve => {
      var question = ' Anything else I can help you with?';
      var speechText = 'You are currently enrolled in: ' + coursesToString(courses);
      resolve(handlerInput.responseBuilder
        .speak(speechText + question)
        .withStandardCard("Enrolled Courses", speechText, smallImgUrl, largeImgUrl)
        .withShouldEndSession(false)
        .getResponse()          
      );
    });
  }
};
const TACoursesIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
      handlerInput.requestEnvelope.request.intent.name === 'TACoursesIntent';
  },
  handle(handlerInput) {
    return new Promise(resolve => {
      getTACourses(courses => {
        var question = ' Anything else I can help you with?';
        var taughtCourses =  coursesToString(courses);
        console.log(taughtCourses);
        var speechText = 'You are currently teaching: ';
        if(taughtCourses == 'undefined.'){
          speechText = 'You are not teaching any courses as of now.';
        }else{
          speechText += coursesToString(courses);
        }
        resolve(handlerInput.responseBuilder
          .speak(speechText + question)
          .withStandardCard("Teaching Courses", speechText, smallImgUrl, largeImgUrl)
          .withShouldEndSession(false)
          .getResponse()          
        );
      }).catch(error => {
        resolve(speakError(handlerInput,'I am having a little trouble getting your TA courses. Try again later.', error));
      });
    });
  }
};

/**
 * Handler for skill's getCourseScores Intent.
 * Invokes canHandle() to ensure request is an IntentRequest
 * matching the declared CourseScoresIntent Intent.
 * Invokes handle() to receive course list from getCourses() function,
 * extract course scores and names from course list,
 * and vocalize a string of the Canvas user's current course scores for each course.
 */
const CourseScoresIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
      handlerInput.requestEnvelope.request.intent.name === 'CourseScoresIntent';
  },
  handle(handlerInput) {
    // retrieve courses from session attributes
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const courses = attributes.courses

    return new Promise(resolve => {
      //courses = courses.filter((course) => !ignoreCourses.includes(course.name)); 
      var question = ' Anything else I can help you with?';
      var speechText = 'Your current grades are as follows: ' + courseGradesToString(courses);
      resolve(handlerInput.responseBuilder
        .speak(speechText + question)
        .withStandardCard("Enrolled Courses", speechText, smallImgUrl, largeImgUrl)
        .withShouldEndSession(false)
        .getResponse()
      );
    });
  }
};

/**
 * Receive initial user input.
 * Get list of user's classes based on access token in use.
 * Save courseList to object.
 */
const AssignmentIntentHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;

    return request.type === 'IntentRequest' &&
      request.intent.name === 'AssignmentIntent' &&
      request.dialogState === 'STARTED';
  },
  handle(handlerInput) {
    const intent = handlerInput.requestEnvelope.request.intent;
    var requestedCourse = intent.slots.course.value;
    
    // retrieve courses from session attributes
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const courses = attributes.courses

    return new Promise(resolve => {
      if (requestedCourse === undefined) {
        resolve(handlerInput.responseBuilder
          .addDelegateDirective(intent)
          .getResponse()
        );
      }else {
        var bestMatch = ld.MatchMaker(requestedCourse, courses); // return course id
        if (bestMatch.object == null){
          // tell user 
          var output = `${requestedCourse}, ${NO_COURSE_MATCH_FOUND}`;
          resolve(handlerInput.responseBuilder
            .speak(output)
            .withSimpleCard("Error", output)
            .withShouldEndSession(false) // without this, we would have to ask alexa to open hoot everytime
            .getResponse())
        }else{
          var courseID = bestMatch.object.id;
  
          getUpcomingAssignments(courseID, tasks => {
            var list = formatAssignments(tasks);
            var output = (list === undefined || list.length == 0) ? 'there are no upcoming assignments' : list[0];
            output = `For ${bestMatch.object.name}, ${output}`;
  
            resolve(handlerInput.responseBuilder
                .speak(output)
                .withSimpleCard(bestMatch.object.name, output)
                .withShouldEndSession(false) // without this, we would have to ask alexa to open hoot everytime
                .getResponse()
            )
          }).catch(error => {
            resolve(speakError(handlerInput,`I had trouble getting your assignments. Try again later.`, error));
          });
        }
      }
    });
  },
};

/**
 * Handler for skills GetAssignment Intent.
 * Invokes canHandle() to ensure request is an IntentRequest,
 * matching the declared Assignment Intent,
 * and that the status of the dialogState is 'IN_PROGRESS'.
 * Invokes handle() to fetch list of upcoming assignments for the best match to the user's
 * initially vocalized course, and vocalizes that list to the user.
 */
const AnnouncementIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
      handlerInput.requestEnvelope.request.intent.name === 'AnnouncementIntent';
  },
  handle(handlerInput) {
    return new Promise(resolve => {
      // retrieve courses from session attributes
      const attributes = handlerInput.attributesManager.getSessionAttributes();
      const courses = attributes.courses
      var courseIDs = mapCourses(courses,'id');
      var startDate = moment().utcOffset("-04:00").subtract(5,'d').format('YYYY-MM-DD');
      console.log(`startDate: ${startDate}`);
      getAnnouncements(courseIDs, startDate, announcements => {
        // assign course names to each announcement
        announcements.map((notice) => {
          notice.course_name = courses[courseIDs.indexOf(parseInt(notice.context_code.substring(7,)))].name;
        });

        console.log(`announcements: ${announcements}`);
        // group announcement by course
        var group = groupAnnouncements(announcements); // 2D array
        console.log(`group: ${group}`);
        var question = ' Anything else I can help you with?';
        var list = announcementsToString(group);
        console.log(`list: ${list}`);
        var speechText = (list != '') ? ('Here are your announcements: ' + list) : 'You have no announcements.';
        resolve(handlerInput.responseBuilder
          .speak(speechText + question)
          .withStandardCard("Announcements", speechText, smallImgUrl, largeImgUrl)
          .withShouldEndSession(false)
          .getResponse()          
        )
      }).catch(error => {
        resolve(speakError(handlerInput,'I am having a little trouble getting your current announcements. Try again later.', error));
      });
    });
  }
}


/**
 * Handler for skills GetAssignment Intent.
 * Invokes canHandle() to ensure request is an IntentRequest,
 * matching the declared Assignment Intent,
 * and that the status of the dialogState is 'IN_PROGRESS'.
 * Invokes handle() to fetch list of upcoming assignments for the best match to the user's
 * initially vocalized course, and vocalizes that list to the user.
 */
const GetAssignmentIntentHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;

    return request.type === 'IntentRequest' &&
      request.intent.name === 'AssignmentIntent' &&
      request.dialogState === 'IN_PROGRESS';
  },
  handle(handlerInput) {
    const currentIntent = handlerInput.requestEnvelope.request.intent;       
    var requestedCourse = currentIntent.slots.course.value;
    // retrieve courses from session attributes
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const courses = attributes.courses

    return new Promise(resolve => {
      //compare requestedCourse with course array
      var bestMatch = ld.MatchMaker(requestedCourse, courses); // return course id
      /**
       * bestMatch.object.{.name, .id, .position, .match, .distance}
       * bestMatch.status = {100 = good, 401 = null array}
       */
      if (bestMatch.object == null){
        // tell user 
        var output = `${requestedCourse}, ${NO_COURSE_MATCH_FOUND}`;
        resolve(handlerInput.responseBuilder
          .speak(output)
          .withSimpleCard("Error", output)
          .withShouldEndSession(false) // without this, we would have to ask alexa to open hoot everytime
          .getResponse())
      }else{
        var courseID = bestMatch.object.id;
  
        //var courseIDs = mapCourses(classes,'id');
        //classes = mapCourses(classes,'name');
        getUpcomingAssignments(courseID, tasks => {
          var list = formatAssignments(tasks);
          var output = (list === undefined || list.length == 0) ? 'there are no upcoming assignments' : list[0];
          output = `For ${bestMatch.object.name}, ${output}`;
          resolve(handlerInput.responseBuilder
              .speak(output)
              .withSimpleCard(bestMatch.object.name, output)
              .withShouldEndSession(false) // without this, we would have to ask alexa to open hoot everytime
              .getResponse()
          )
        }).catch(error => {
          resolve(speakError(handlerInput,`I had trouble getting your assignments. Try again later.`, error));
        });
      }
    });
  },
};

/**
 * Receive initial user input.
 * Get list of user's classes based on access token in use.
 * Save courseList to object.
 */
const SubmissionScoresIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
      handlerInput.requestEnvelope.request.intent.name === 'SubmissionScoresIntent' &&
      handlerInput.requestEnvelope.request.dialogState === 'STARTED';
  },
  handle(handlerInput) {
    const currentIntent = handlerInput.requestEnvelope.request.intent;
    var requestedCourse = currentIntent.slots.course.value;

    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const courses = attributes.courses

    
    return new Promise(resolve => {
      if(requestedCourse === undefined){
        resolve(handlerInput.responseBuilder
          .addDelegateDirective(currentIntent)
          .getResponse()
          );
      }else{
        // find the closest match to the user's utterance in classes
        var bestMatch = ld.FinalWord(requestedCourse, courses);
        if (bestMatch.object == null){
          // tell user 
          var output = `${requestedCourse}, ${NO_COURSE_MATCH_FOUND}`;
          resolve(handlerInput.responseBuilder
            .speak(output)
            .withSimpleCard("Error", output)
            .withShouldEndSession(false) // without this, we would have to ask alexa to open hoot everytime
            .getResponse())
        }else{
          //get ID of course returned as best match
          var courseID = bestMatch.object.id;
          
          //var classes = mapCourses(classes, 'name');
          getAssignments(courseID, true, '', tasks => {
            var response = submissionScoresToString(tasks);
            var output = `In ${bestMatch.object.name}, ${response}`;
      
            resolve(handlerInput.responseBuilder
              .speak(output)
              .withSimpleCard(bestMatch.object.name, output)
              .withShouldEndSession(false)
              .getResponse())
          }).catch(error => {
            resolve(speakError(handlerInput, 'I had trouble getting your submission scores. Try again later', error))
          });
        }
      }
    });
  },
};

/**
 * Handler for skills getSubmissionScores Intent.
 * Invokes canHandle() to ensure request is an IntentRequest,
 * matching the declared SubmissionScores Intent,
 * and that the status of the dialogState is 'IN_PROGRESS'.
 * Invokes handle() to fetch list of assignments for the best match to the user's
 * initially vocalized course, 
 * and use that assignment list to extract submission scores.
 */
const GetSubmissionScoresIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
      handlerInput.requestEnvelope.request.intent.name === 'SubmissionScoresIntent' &&
      handlerInput.requestEnvelope.request.dialogState === 'IN_PROGRESS';
  },
  handle(handlerInput) {
    const currentIntent = handlerInput.requestEnvelope.request.intent;
    var requestedCourse = currentIntent.slots.course.value;

    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const courses = attributes.courses

    return new Promise(resolve => {
      // find the closest match to the user's utterance in classes
      var bestMatch = ld.MatchMaker(requestedCourse, courses);
      if (bestMatch.object == null){
        // tell user 
        var output = `${requestedCourse}, ${NO_COURSE_MATCH_FOUND}`;
        resolve(handlerInput.responseBuilder
          .speak(output)
          .withSimpleCard("Error", output)
          .withShouldEndSession(false) // without this, we would have to ask alexa to open hoot everytime
          .getResponse())
      }else{
        //get ID of course returned as best match
        var courseID = bestMatch.object.id;
  
        getAssignments(courseID, true, '', tasks => {
          var response = submissionScoresToString(tasks);
          var output = `In ${bestMatch.object.name}, ${response}`;
  
          resolve(handlerInput.responseBuilder
            .speak(output)
            .withSimpleCard(bestMatch.object.name, output)
            .withShouldEndSession(false)
            .getResponse())
        }).catch(error => {
          resolve(speakError(handlerInput, 'I had trouble getting your submission scores. Try again later', error))
        });
      }
    });
  },
};

/**
 * Receive initial user input.
 * Get list of user's classes based on access token in use.
 * Save courseList as object in session attribute.
 */
const CourseStudentsIntentHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest' &&
      request.intent.name === 'CourseStudentsIntent' &&
      request.dialogState === 'STARTED';
  },
  handle(handlerInput) {
    const currentIntent = handlerInput.requestEnvelope.request.intent;
    var requestedCourse = currentIntent.slots.course.value;
    
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const courses = attributes.courses;
    console.log(`Requested Course: ${requestedCourse}`);

    return new Promise(resolve => {
      if(requestedCourse === undefined){
        resolve(handlerInput.responseBuilder
          .addDelegateDirective(currentIntent)
          .getResponse()
        );
      }else{
        resolve(
          listStudents(handlerInput,requestedCourse,courses)
        );
      }
    }); 
  },
};

/**
 * Handler for skills GetStudents Intent.
 * Invokes canHandle() to ensure request is an IntentRequest,
 * matching the declared CourseStudents Intent,
 * and that the status of the dialogState is 'IN_PROGRESS'.
 * Invokes handle() to fetch the user's courses.
 * Passes the course object into the listStudents function
 * which handles the rest.
 */
const GetStudentsIntentHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest' &&
      request.intent.name === 'CourseStudentsIntent' &&
      request.dialogState === 'IN_PROGRESS';
  },
  handle(handlerInput) {
    const currentIntent = handlerInput.requestEnvelope.request.intent;
    var requestedCourse = currentIntent.slots.course.value;

    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const courses = attributes.courses;

    console.log(`courses in attributes: ${attributes.courses}`);
    console.log(`Requested: ${requestedCourse}`);

    return new Promise(resolve => {
      resolve(
        listStudents(handlerInput,requestedCourse,courses)
      );
    }); 
  },
};

/**
 * Receive initial user input.
 * Get list of user's classes based on access token in use.
 * Save courseList as object in session attribute.
 */
const TotalStudentsIntentHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest' &&
      request.intent.name === 'TotalStudentsIntent' &&
      request.dialogState === 'STARTED';
  },
  handle(handlerInput) {
    const currentIntent = handlerInput.requestEnvelope.request.intent;
    var requestedCourse = currentIntent.slots.course.value;
    
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const courses = attributes.courses;
    console.log(`Requested Course: ${requestedCourse}`);

    return new Promise(resolve => {
      if(requestedCourse === undefined){
        resolve(handlerInput.responseBuilder
          .addDelegateDirective(currentIntent)
          .getResponse()
        );
      }else{
        resolve(
          getTotalStudents(handlerInput,requestedCourse,courses)
        );
      }
    }); 
  },
};

/**
 * Handler for skills TotalStudents Intent.
 * Invokes canHandle() to ensure request is an IntentRequest,
 * matching the declared TotalStudents Intent,
 * and that the status of the dialogState is 'IN_PROGRESS'.
 * Invokes handle() to fetch the user's courses.
 * Passes the course object into the getTotalStudents function
 * which handles the rest.
 */
const GetTotalStudentsIntentHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest' &&
      request.intent.name === 'TotalStudentsIntent' &&
      request.dialogState === 'IN_PROGRESS';
  },
  handle(handlerInput) {
    const currentIntent = handlerInput.requestEnvelope.request.intent;
    var requestedCourse = currentIntent.slots.course.value;

    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const courses = attributes.courses;

    console.log(`courses in attributes: ${attributes.courses}`);
    console.log(`Requested: ${requestedCourse}`);

    return new Promise(resolve => {
      resolve(
        getTotalStudents(handlerInput,requestedCourse,courses)
      );
    }); 
  },
};

/**
 * Receive initial user input.
 * Get list of user's classes based on access token in use.
 * Save courseList as object in session attribute.
 */
const ProfessorNameIntentHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest' &&
      request.intent.name === 'ProfessorNameIntent' &&
      request.dialogState === 'STARTED';
  },
  handle(handlerInput) {
    const currentIntent = handlerInput.requestEnvelope.request.intent;
    var requestedCourse = currentIntent.slots.course.value;
    
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const courses = attributes.courses;
    console.log(`Requested Course: ${requestedCourse}`);

    return new Promise(resolve => {
      if(requestedCourse === undefined){
        resolve(handlerInput.responseBuilder
          .addDelegateDirective(currentIntent)
          .getResponse()
        );
      }else{
        resolve(
          getProfessorName(handlerInput,requestedCourse,courses)
        );
      }
    }); 
  },
};

/**
 * Handler for skills ProfessorName Intent.
 * Invokes canHandle() to ensure request is an IntentRequest,
 * matching the declared ProfessorName Intent,
 * and that the status of the dialogState is 'IN_PROGRESS'.
 * Invokes handle() to fetch the user's professor.
 * Passes the course object into the getProfessorName function
 * which handles the rest.
 */
const GetProfessorNameIntentHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest' &&
      request.intent.name === 'ProfessorNameIntent' &&
      request.dialogState === 'IN_PROGRESS';
  },
  handle(handlerInput) {
    const currentIntent = handlerInput.requestEnvelope.request.intent;
    var requestedCourse = currentIntent.slots.course.value;

    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const courses = attributes.courses;

    console.log(`courses in attributes: ${attributes.courses}`);
    console.log(`Requested: ${requestedCourse}`);

    return new Promise(resolve => {
      resolve(
        getProfessorName(handlerInput,requestedCourse,courses)
      );
    }); 
  },
};

/**
 * Handler for skill's Help Intent.
 * Invokes canHandle() to ensure request is an IntentRequest
 * matching the declared HelpIntent.
 * Invokes handle() to to handle help request
 * and give user instructions on how to use the skill.
 */
const HelpIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
      handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {

    var examples = [
      "what are my announcements. ",
      "how many students are in my class. ", 
      "what assignments do I have. ", 
      "what are my current course scores. ",
      "what classes am I taking. ",
      "do i have any announcements. ",
      "what homework do I have. ",
      "what are my course scores. ",
      "what courses am I enrolled in. ",
      "how many people are in my class. "
    ];

    var chooseRandomSample = Math.floor(Math.random() * examples.length);
    var chooseOtherRandomSample = Math.floor(Math.random() * examples.length);

    const intentsText= "You can say things like. " + examples[chooseRandomSample] + "or, " 
    + examples[chooseOtherRandomSample] + " Please say a command. ";
    const speechText = 'Hoot can answer questions about your canvas account! ' + intentsText;

    chooseRandomSample = Math.floor(Math.random() * examples.length);
    chooseOtherRandomSample = Math.floor(Math.random() * examples.length);

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .withSimpleCard('hOOt for Canvas', speechText)
      .getResponse();
  },
};

/**
 * Handler for skill's Cancel and Stop Intents.
 * Invokes canHandle() to ensure request is an IntentRequest
 * matching the declared CancelIntent and StopIntent.
 * Invokes handle() to allow the user to stop an action, but remain in the skill
 * or completely exit the skill.
 */
const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
      (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent' ||
        handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    const speechText = 'Goodbye!';

    return handlerInput.responseBuilder
      .speak(speechText)
      .withSimpleCard('Hello World', speechText)
      .getResponse();
  },
};

/**
 * Handler for skill's SessionEndedRequest Intent.
 * Invokes canHandle() to ensure request is an IntentRequest
 * matching the declared SessionEndedRequestIntent.
 * Invokes handle() to handle errors, user exits, and utterances not matching
 * a defined intent.
 */
const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);

    return handlerInput.responseBuilder.getResponse();
  },
};

/**
 * Handler for system errors.
 * Envokes handler() to inform user that their utterance was misunderstood
 */
const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);

    return handlerInput.responseBuilder
      .speak('Sorry, I can\'t understand the command. Please say again.')
      .reprompt('Sorry, I can\'t understand the command. Please say again.')
      .getResponse();
  },
};

const skillBuilder = Alexa.SkillBuilders.custom();

exports.handler = skillBuilder
  .addRequestHandlers(
    LaunchRequestHandler,
    CourseScoresIntentHandler,
    CoursesIntentHandler,
    TACoursesIntentHandler,
    AssignmentIntentHandler,
    GetAssignmentIntentHandler,
    AnnouncementIntentHandler,
    SubmissionScoresIntentHandler,
    GetSubmissionScoresIntentHandler,
    CourseStudentsIntentHandler,
    GetStudentsIntentHandler,
    TotalStudentsIntentHandler,
    GetTotalStudentsIntentHandler,
    ProfessorNameIntentHandler,
    GetProfessorNameIntentHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    SessionEndedRequestHandler
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();