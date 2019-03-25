/* eslint-disable  func-names */
/* eslint-disable  no-console */

const Alexa = require('ask-sdk-core');
const axios = require('axios');
const { Course, Assignment } = require('./canvas');
const { access_token } = require('./config'); // create config.js in your code
var classes = [];

var url = `https://templeu.instructure.com/api/v1/`;
var courseURL = 'courses?enrollment_state=active&enrollment_type=student';

const headerOptions = {
  headers: {
    Authorization: 'Bearer ' + access_token
  }
};

var ignoreCourses = ['CIS Student Community Fall 2018', 'TU Alliance for Minority Participation (AMP) Program', 'Computer Science, Math, and Physics (CMP) Students'];
var smallImgUrl = 'https://assets.pcmag.com/media/images/423653-instructure-canvas-lms-logo.jpg?width=333&height=245';
var largeImgUrl = 'https://am02bpbsu4-flywheel.netdna-ssl.com/wp-content/uploads/2013/01/canvas_stack.jpg';

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

const mapCourses = function (courses, by) {
  courses = courses.filter((course) => !ignoreCourses.includes(course.name)); // only get courses we want
  if (by == 'id') {
    return courses.map(course => course.id);
  } else if (by == 'name') {
    return courses.map(course => course.name);
  }
  return list;
}

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

const getUpcomingAssignments = function(courseID,callback){
  var request = url + 'courses/' + courseID + '/assignments?bucket=upcoming';
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

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);

    return handlerInput.responseBuilder.getResponse();
  },
};

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