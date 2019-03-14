//  ██████╗ █████╗ ███╗   ██╗██╗   ██╗ █████╗ ███████╗     █████╗ ██████╗ ██╗
//  ██╔════╝██╔══██╗████╗  ██║██║   ██║██╔══██╗██╔════╝    ██╔══██╗██╔══██╗██║
//  ██║     ███████║██╔██╗ ██║██║   ██║███████║███████╗    ███████║██████╔╝██║
//  ██║     ██╔══██║██║╚██╗██║╚██╗ ██╔╝██╔══██║╚════██║    ██╔══██║██╔═══╝ ██║
//  ╚██████╗██║  ██║██║ ╚████║ ╚████╔╝ ██║  ██║███████║    ██║  ██║██║     ██║
//   ╚═════╝╚═╝  ╚═╝╚═╝  ╚═══╝  ╚═══╝  ╚═╝  ╚═╝╚══════╝    ╚═╝  ╚═╝╚═╝     ╚═╝
                                                                            
// install packages
const axios = require('axios');
const h2p = require('html2plaintext');
const { Course, Assignment }  = require('./canvas');

var url = `https://templeu.instructure.com/api/v1/`;
var courseURL = 'courses?enrollment_state=active&enrollment_type=student';
//https://templeu.instructure.com/api/v1/courses/99570000000054796/assignments?access_token=9957~ZSG3nWPwk5CsmpSjxHO8NXLaJqPV57Sviljh19SP0aXzZED2yTDmCrES3dX9wocW
// header with included access_token
const headerOptions = {
  headers: { 
    Authorization: 'Bearer ' + access_token
  }
};

//var url = `https://canvas.instructure.com/login/oauth2/auth?client_id=XXX&response_type=code&state=YYY&redirect_uri=https://example.com/oauth_complete`

var ignoreCourses = ['CIS Student Community Fall 2018', 'TU Alliance for Minority Participation (AMP) Program', 'Computer Science, Math, and Physics (CMP) Students'];

function log(msg){
  console.log(msg);
}

// let getCourseIds = new Promise((resolve, reject) => {
//   setTimeout(() => {
//     //get course ids
//     getCourses(courses => {
//       formatCourses
//     });
//   },1000)
// });


function formatCourses(courses, by) {
  var list;
  if(by == 'id'){
    list = [];
    log('\n')
    for (var i = 0; i < courses.length; i++) {
      if(!ignoreCourses.includes(courses[i].name)){
        list.push(courses[i].id);
        //log(`${courses[i].name}  ${courses[i].id}`)
        //log(courses[i])
      }
      //log(courses[i].id)
    }
  }else if(by == 'name'){
    list = '';
    var name;
    for (var i = 0; i < courses.length; i++) {
      name = courses[i].name;
      if (!ignoreCourses.includes(name)) {
        if (name.includes('-')) {
          name = name.split('-')[1];
        }
        if(i == courses.length - 2) {
            list += 'and ' + name + '.';
        }else{
          list += name.trim();
          list += ', '
        }
      }
    }
  }
  return list;
}


function getCourses(callback) {
  return axios.get(url + courseURL, headerOptions)
  .then(response => {
    // var courses = [];
    // for(var i = 0; i < response.data.length; i++){
    //   courses.push(new Course(response.data[i].id,response.data[i].name));
    // }
    //log(courses)
    callback(response.data);
  });
}

function getAssignments(courseIDs,callback) {
  //log(courseIDs)
  var final = url + 'courses/' + courseIDs[0] + '/assignments';
  log(final)
  //https://templeu.instructure.com/api/v1/courses/99570000000054796/assignments?access_token=9957~ZSG3nWPwk5CsmpSjxHO8NXLaJqPV57Sviljh19SP0aXzZED2yTDmCrES3dX9wocW
  return axios.get(final, headerOptions)
    .then(response => {
      var data = response.data;
      //log(data);
      callback(data);
    });
}


// function getAssignments(callback) {

//   // YOU MUST UNDERSTAND HOW ASYNC/AWAIT works...
//   // link here https://javascript.info/async-await

//   // let promise = new Promise((resolve, reject) => {
//   //   setTimeout(() => resolve("done!"), 1000)
//   // });

//   // let result = await promise;

//   // in order to get assignments, we must first get the course ids.


//   let courseIds = await getCourseIds

//   axios.get(url)
//     .then(response => {

//       var assign, = [];
//       var data = response.data;
//       var name;
//       for (var i = 0; i < data.length; i++) {

//         a.push(data[i]);

//         name = data[i].name; // nam

//         if (name.includes('-')) {
//           name = name.split('-')[1];
//         }
//         if (!name.includes(',') && !ignoreCourses.includes(name)) {
//           courses.push(name.trim());
//         }
//       }
//       callback(courses);
//     });
// }
log("\n\n\n\HELLO WORLD");

getCourses(courses => {
  //var list = formatCourses(courses);
  var speechText = 'You are currently enrolled in: ' + formatCourses(courses,'name');
  log(speechText);
  // for(var i = 0; i < courses.length; i++){
  //   console.log(courses[i].name);
  // }
}).catch(error => {
  log("c notes" + error)
});


getCourses(courses => {
  //var list = formatCourses(courses);
  var courseIDs = formatCourses(courses,'id');
  getAssignments(courseIDs, tasks => {
    log(tasks[1])
    //log(h2p(tasks[1].description));
  }).catch(error => {
    log('error ' + error);
  })
}).catch(error => {
  log("c notes" + error)
});
// const getCourses = () => {
//   return axios.get(url + courseURL)
// }
// getCourses().then(res => {
//   log(res.data);
// }).catch(err => {
//   log(err);
// })
// getAssignments(courses => {
//   //var list = formatCourses(courses);
//   var speechText = 'You are currently enrolled in: ' + formatCourses(courses);
//   log(speechText);
// });
//var id = '99570000000051311';
//var call = "https://canvas.instructure.com/api/v1/courses/99570000000051311/assignments";
