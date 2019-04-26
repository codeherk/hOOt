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
const { Student, Course, Assignment, Announcement, ascii_art } = require('./canvas');
const { access_token } = require('./config');
//const ld = require('./levenshtein');

//#!/usr/bin/env node
const fs = require('fs');
const inquirer = require('inquirer');
const program = require('commander');
const moment = require('moment');

// base URL for HTTP requests to the Canvas LMS API
var url = `https://templeu.instructure.com/api/v1/`;
// URL parameters for a courses request.
// Filters HTTP request results to provide only actively enrolled courses.
var courseURL = 'courses?enrollment_state=active';
var announcementsURL = 'announcements?'
var studentURL = '&enrollment_type=student';
var TA_URL = '&enrollment_type=ta';
var scoreURL = '&include[]=total_scores';
 
const getToken = function(){
  try {
    var data = fs.readFileSync(".as")
    // extract token from file
    var str = data.toString().split('\n');
    if(str[0] == '[token]'){ 
      //console.log(str[1]);
      return str[1];
    }
    return 'nothing';
  } catch (err) {
    if(err.code === 'ENOENT'){
      console.log('.as file does not exist!');
    }else{
      console.log(err + '.as file does not exist!');
    }
    return 'nothing';
  }
}

 /**
  * For the addition of header options including access token to HTTP request
  */

const headerOptions = {
    headers: { 
        Authorization: 'Bearer ' + getToken()//access_token
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

    return axios.get(request, headerOptions)
      .then(response => {
        var data = response.data;
        var assignments = [];
        for (let i = 0; i < data.length; i++){
          assignments.push(new Assignment(data[i]));
        }
        callback(assignments);
      });
}
  
 

const isHeadersValid = function(){
  var a = headerOptions.headers.Authorization.split(' ');
  //console.log(a)
  if(a[1] != null){
    return true
  }
  return process.exit(22)
  // return false
}
/********************************************************************************************/
/******************************* END OF FUNCTION DECLARATIONS *******************************/
/********************************************************************************************/

var classes;
 
program
    .version(ascii_art+'\n0.1.0')
    .description(ascii_art);

program
    .command('init')
    .alias('i')
    .description('CLI Setup')
    .action(() => {
         fs.exists('.as', (exist) => {
            if(exist){
              var token = getToken();
              if(token != null) console.log("Access token already given!");
            }else inquirer
                .prompt([
                  {
                    type: 'input',
                    name: 'access_token',
                    message: 'Canvas Access Token',
                  },
                ])
                .then(answers => {
                  console.info(answers.access_token);
                  fs.writeFileSync('.as',`[token]\n${answers.access_token}`);
                });
         })
    });
    
program
    .command('courses')
    .alias('c')
    .description('List Courses')
    .action( () => {
        if(isHeadersValid()){
          getCourses(courses => {
              log('\nEnrolled Courses',cyan);
              courses.forEach(e => {
                  console.log('\u2022 '+e.name);
              });
          }).catch(err => {
            log(`Error ${err}`);
          })
        }else{
          console.log('Headers are invalid');
        }
    });
 
program
   .command('assignments')
   .alias('a')
   .description('List Assignments')
   .action(() => {
    if(isHeadersValid()){
      getCourses(courses => {
        inquirer
        .prompt([
          {
            type: 'list',
            name: 'course',
            message: 'For what course?',
            choices: mapCourses(courses,'name')
          }
        ])
        .then(answers => {
          //console.log(answers)
          var id = courses.filter(e => { return e.name == answers.course })[0].id;
          getAssignments(id,false, tasks => {
            log(`\nAssignments for ${cyan + answers.course + reset}`);
            log(`\u001b[2m${`─`.repeat(answers.course.length * 1.5)}\u001b[22m`);
            //tasks.sort((a, b) => moment.utc(a.due).diff(moment.utc(b.due)));
  
            tasks.forEach(e => {
              console.log(`\u2022 ${e.name} due ${cyan + (e.due ? e.due : 'No due date') + reset}`);
            });
          })
        })
      }).catch(err => {
        log(`Error ${err}`);
      })
    }else{
      console.log('Headers are invalid');
    }
   });
 
program
   .command('assignment-grades')
   .alias('ag')
   .description('List Assignments')
   .action(() => {
     getCourses(courses => {
       inquirer
       .prompt([
         {
           type: 'list',
           name: 'course',
           message: 'For what course?',
           choices: mapCourses(courses,'name')
         }
       ])
       .then(answers => {
         //console.log(answers)
         var id = courses.filter(e => { return e.name == answers.course })[0].id;
         getAssignments(id, true, tasks => {
           log(`\nAssignment grades for ${answers.course}`,cyan);
           var score;
           var max;
           var percent;
           tasks.forEach(e => {
             score = e.submission.score;
             max = e.points_possible;
             if (score != null) {
               percent = ((score / max) * 100);
               //for readability. found up for scores with decimal points
               if (percent % 1 != 0) {
                 percent = ((score / max) * 100).toFixed(2);
               }
               score += '%';
             }else{
               score = 'Not yet graded';
             }
             
             console.log(`\u2022 ${e.name} ${cyan + score + reset}`);
           });
         })
       })
     })
   });
   const download = require('download');

   program
   .command('submissions-download')
   .alias('sd')
   .description('submissions-download')
   .action(() => {
    if(isHeadersValid()){
      getTACourses(courses => {
        inquirer
        .prompt([
          {
            type: 'list',
            name: 'course',
            message: 'For what course?',
            choices: mapCourses(courses,'name')
          }
        ])
        .then(answers => {
          //console.log(answers)
          var id = courses.filter(e => { return e.name == answers.course })[0].id;
          console.log('course id: ' + id);
          getAssignments(id,false, tasks => {
            inquirer
            .prompt([
              {
                type: 'list',
                name: 'task',
                message: 'Which assignment?',
                choices: tasks.map(task => task.name)
              }
            ])
            .then(answers => {
              console.log(answers.task);
              var task = tasks.filter(e => { return e.name == answers.task })[0];
              console.log('assignment download url: ' + task.download);
            //   axios.get(
            //     task.download,
            //     {responseType: 'arraybuffer'}
            //  ).then(res => {
            //    console.log(res.headers)
            //  });
              // fs.writeFile(`${task.name.replace(' ','_') + '_submissions'}`, task.download, {encoding: 'null'}, (err) => {
              //   if(err){
              //     console.log('There was an issue downloading the submissions' + err.toString());
              //   }
              // })
              download(task.download, './').then(() => {
                console.log('done!');
            });
              //console.log
            })
            
            
          })
        })
      }).catch(err => {
        log(`Error ${err}`);
      })
    }else{
      console.log('Headers are invalid');
    }
   });
 
   program.parse(process.argv);