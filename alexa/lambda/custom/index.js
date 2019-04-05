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
const {
  Course
} = require('./canvas');
const ld = required('.levenDistance');
//var access_token = "ACCESS TOKEN GOES HERE" // NEVER, EVER PUSH YOUR ACCESS TOKEN UP TO GITHUB

// base URL for HTTP requests to the Canvas LMS API
var url = `https://templeu.instructure.com/api/v1/`;
// URL parameters for a courses request.
// Filters HTTP request results to provide only actively enrolled courses.
var courseURL = 'courses?enrollment_state=active&enrollment_type=student';

/**
 * For the addition of header options including access token to HTTP request
 */
const headerOptions = {
  headers: {
    Authorization: 'Bearer ' + access_token
  }
};

var ignoreCourses = ['CIS Student Community Fall 2018', 'TU Alliance for Minority Participation (AMP) Program', 'Computer Science, Math, and Physics (CMP) Students'];
var smallImgUrl = 'https://assets.pcmag.com/media/images/423653-instructure-canvas-lms-logo.jpg?width=333&height=245';
var largeImgUrl = 'https://am02bpbsu4-flywheel.netdna-ssl.com/wp-content/uploads/2013/01/canvas_stack.jpg';

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
    const speechText = 'Welcome to hOOt for Canvas, how may I help you?';

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .withSimpleCard('hOOt for Canvas', speechText)
      .getResponse();
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
      });
    });
  }
};

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
  courses = courses.filter((course) => !ignoreCourses.includes(course.name)); 
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
 * @returns {String} list of formatted course names.
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
    console.log("HELLO");
    const intent = handlerInput.requestEnvelope.request.intent;
    return new Promise(resolve => {
      getCourses(courses => {
        classes = courses;
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

    var match = ld.FinalWord(position, classes);

    switch(match.status) {

      case match.status == 100:
        course_ID = match.object.id;

        return new Promise(resolve => {
      
          var courseIDs = mapCourses(classes,'id');
          classes = mapCourses(classes,'name');
          getUpcomingAssignments(course_ID, tasks => {
            var list = formatAssignments(tasks);
            var output = (list === undefined || list.length == 0) ? 'there are no upcoming assignments' : list[0];
            output = `For ${classes[match.object.position]}, ${output}`;
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

        
      case match.status == 401:

        var output = 'I can\'t find the class you\'re asking for, does it go by another name';

        return handlerInput.responseBuilder
          .speak(speechText)
          .withShouldEndSession(false) 
          .getResponse();

        
      case match.status == 402:

        var output = 'I\'m having trouble getting to your courses. Try again later.';

        return handlerInput.responseBuilder
          .speak(speechText)
          .withShouldEndSession(false) 
          .getResponse();
        
      case match.status == 404:

        var output = 'I could\'t catch what you said. Could you try asking again?';

        return handlerInput.responseBuilder
          .speak(speechText)
          .withShouldEndSession(false) 
          .getResponse();

    }//end switch

    //var index = position - 1;
    
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