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

const Alexa = require('ask-sdk-core');
const axios = require('axios');
const { Course, Assignment } = require('./canvas');
//Helper Function for calling the Cognito /oauth2/userInfo to get user info using the accesstoken
const https = require('https');
//const { access_token } = require('./config'); // create config.js in your code

//var access_token = '';
var alexa_access_token = '';

var classes = [];

// base URL for HTTP requests to the Canvas LMS API
var url = `https://templeu.instructure.com/api/v1/`;

// URL parameters for a courses request.
// Filters HTTP request results to provide only actively enrolled courses.
var courseURL = 'courses?enrollment_state=active&enrollment_type=student&include[]=total_scores';

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
  return axios.get(url + courseURL, headerOptions)
    .then(response => {
      //log(response) //debug
      var courses = [];
      for (let i = 0; i < response.data.length; i++) {
        courses.push(new Course(response.data[i]));
      }
      //log(courses) //debug
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

  list += 'and ' + titles[i] + '.'; // and <last course name>. 
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

// https is a default part of Node.JS.  Read the developer doc:  https://nodejs.org/api/https.html
function buildHttpGetOptions(accessToken) {
  return {
      //Replace the host with your cognito user pool domain 
      method: 'GET',
      baseURL: 'https://alexa-hoot.auth.us-east-1.amazoncognito.com',
      url: '/oauth2/userInfo',
      port: 443,
      headers: {
          'authorization': 'Bearer ' + accessToken
      }
  };
}

function httpGet(options, callback) {
  return axios(options).then(res => {
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
    } else {

      return new Promise(resolve => {
        const speechText = 'Welcome to hOOt for Canvas, how may I help you?';
        // user is signed in, get access token from amazon
        alexa_access_token = handlerInput.requestEnvelope.context.System.user.accessToken;
        
        // try to get info about user. 
        try {
          var tokenOptions = buildHttpGetOptions(alexa_access_token);
          console.log(`aat: ${alexa_access_token}`); // access token granted from amazon cognito

          // make a call to get user attributes
          httpGet(tokenOptions, response => {
            console.log(response.data);
            console.log(response.data.zoneinfo);
            
            const sessionAttributes = handlerInput.attributesManager.getSessionAttributes(); // get session attributes
            sessionAttributes.access_token = response.data.zoneinfo; // store access token in session
            setHeaderOptions(response.data.zoneinfo);
            handlerInput.attributesManager.setSessionAttributes(sessionAttributes); // save session attributes
            
            resolve(handlerInput.responseBuilder
              .speak(speechText)
              .reprompt(speechText)
              .withSimpleCard('hOOt for Canvas', speechText)
              .getResponse());

          }).catch(error => {
            console.log(`ERROR: ${error}`);
            resolve(speakError(handlerInput,"I had trouble getting access to canvas.",error));
          });
          
        }catch(error) {
          console.log(`Error message: ${error.message}`);
          resolve(speakError(handlerInput,"I had trouble getting access to canvas. Try again later.",error));
        }
      });
      }
    },
};

/**
 * @todo determine if this handler is needed. If not, remove during refactor.
 */
const HelloWorldIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
      handlerInput.requestEnvelope.request.intent.name === 'HelloWorldIntent';
  },
  handle(handlerInput) {
    const speechText = 'Hello World!';

    return handlerInput.responseBuilder
      .speak(speechText)
      .withSimpleCard('Hello World', speechText)
      .getResponse();
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
    return new Promise(resolve => {
      getCourses(courses => {
        var question = ' Anything else I can help you with?';
        var speechText = 'You are currently enrolled in: ' + coursesToString(courses);
        resolve(handlerInput.responseBuilder
          .speak(speechText + question)
          .withStandardCard("Enrolled Courses", speechText, smallImgUrl, largeImgUrl)
          .withShouldEndSession(false)
          .getResponse()          
        );
      }).catch(error => {
        resolve(speakError(handlerInput,'I am having a little trouble getting your current courses. Try again later.', error));
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
    return new Promise(resolve => {
      getCourses(courses => {
        courses = courses.filter((course) => !ignoreCourses.includes(course.name)); 
        var question = ' Anything else I can help you with?';
        var speechText = 'Your current grades are as follows: ' + courseGradesToString(courses);
        resolve(handlerInput.responseBuilder
          .speak(speechText + question)
          .withStandardCard("Enrolled Courses", speechText, smallImgUrl, largeImgUrl)
          .withShouldEndSession(false)
          .getResponse()
        );
      }).catch(error => {
        resolve(speakError(handlerInput,'I am having a little trouble getting your current courses. Try again later.', error));
      });
    });
  }
};

/**
 * Handler for skills getAssignments Intent.
 * Invokes canHandle() to ensure request is an IntentRequest,
 * matching the declared Assignment Intent.
 * Invokes handle() to receive 
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
    return new Promise(resolve => {
      getCourses(courses => {
        // classes = courses;
        classes = courses.filter((course) => !ignoreCourses.includes(course.name)); 
        resolve(handlerInput.responseBuilder
          .addDelegateDirective(intent)
          .getResponse()
        );
      });
    }).catch(error => {
      resolve(handlerInput.responseBuilder
        .speak('I am having a little trouble getting your current courses. Try again later.')
        .getResponse()
      );
    });
    // const intent = handlerInput.requestEnvelope.request.intent;
    //    return handlerInput.responseBuilder
    //           .addDelegateDirective(intent)
    //           .getResponse();
  },
};

const GetAssignmentIntentHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;

    return request.type === 'IntentRequest' &&
      request.intent.name === 'AssignmentIntent' &&
      request.dialogState === 'IN_PROGRESS';
  },
  handle(handlerInput) {
    const currentIntent = handlerInput.requestEnvelope.request.intent;       
    var position = currentIntent.slots.position.value;

    var index = position - 1;
    return new Promise(resolve => {
      var courseIDs = mapCourses(classes,'id');
      classes = mapCourses(classes,'name');
      getUpcomingAssignments(courseIDs[index], tasks => {
        var list = formatAssignments(tasks);
        var output = (list === undefined || list.length == 0) ? 'there are no upcoming assignments' : list[0];
        output = `For ${classes[index]}, ${output}`;
        // var output;
        // if(tasks.length == 0){
        //   output = 'March 25th, 2019, 11:59pm';
        // }else{
        //   output = tasks[0].name;
        // }
        resolve(handlerInput.responseBuilder
            .speak(output)
            .withShouldEndSession(false) // without this, we would have to ask alexa to open hoot everytime
            .getResponse()
        )
      }).catch(error => {
        resolve(handlerInput.responseBuilder
          .speak(`I had trouble getting your assignments. Try again later.`)
          .getResponse()
        );
      });
        
        // var speechText = 'You are currently enrolled in: ' + coursesToString(courses);
        // resolve(handlerInput.responseBuilder
        //   .speak(speechText)
        //   .withStandardCard("Enrolled Courses", speechText, smallImgUrl, largeImgUrl)
        //   .getResponse()
        // );
      // }).catch(error => {
      //   resolve(handlerInput.responseBuilder
      //     .speak('Could not get courses.')
      //     .getResponse()
      //   );
      // });
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
    const speechText = 'You can say hello to me!';

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .withSimpleCard('Hello World', speechText)
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
    HelloWorldIntentHandler,
    CourseScoresIntentHandler,
    CoursesIntentHandler,
    AssignmentIntentHandler,
    GetAssignmentIntentHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    SessionEndedRequestHandler
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();


// {
//   "name": "AssignmentsIntent",
//   "slots": [
//     {
//       "name": "className",
//       "type": ""
//     }
//   ],
//   "samples": [
//     "What assignment do i have for {className}"
//   ]
// }