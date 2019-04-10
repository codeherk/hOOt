/**
 * Algorithm to check for course name that has the best match to user's requested phrase
 * Uses levenshtein algorithm to check difference between phrases
 * Checks for phrase being a sub string of other words to better increase match
 * 
 * 
 */
const levenshtein = require('js-levenshtein');

/*
 * Status codes indicating success and other status 
 */

var SUCCESS = 100;      //indicates cadidate was found successfully
var NO_MATCH = 401      //indicates no phrase is not contained in any course
var NULL_ARRAY = 402;   //indicates array was null
var NULL_PHRASE = 404;      //indicates something went wrong initially


/*
 * End status code
 */

//short hand for console log
var log = arg => console.log(arg);
//Log for debugging
var _p = arg => console.log(arg);

/*
 * This function takes in the user requested course and an array of courses to find a single bext match
 *      Input - request: Phrase uttered by user
 *              course: array of course objects from hooT  
 */
var FinalWord = (request, course) => {

    //check to see if proper parameters were sent
    if (request == null){

        //return a candidate with a NULL_PHRASE status code
        return new candidate(null, NULL_PHRASE);

    } else if (course.length == 0 ) {

        //return a candidate with a NULL_PHRASE status code
        return new candidate(null, NULL_ARRAY);

    }//end check for parameters

    var convertedCourses = preppedCourse(course);
    var reducedCandidates = reduceArr(request, convertedCourses);

    //Check for empty candidates array
    if (reducedCandidates.length == 0) {

        var failed = new candidate(null, NO_MATCH);

        return failed;

    } else {

        var likelyCandidates = levenCheck(request, reducedCandidates);

    }//end check for empty candidates array

    /*
     * Add a function to check likelyCandidates and find one single match
     */
    //selectCandidate(likelyCandidates);


    //_p(selectCandidate(likelyCandidates));

    return selectCandidate(likelyCandidates);

}//end final word

/*
 * Takes in array of likely candidates and returns a single candidate with highest match value and lowest distance value
 */
var selectCandidate = (possibleMatches) => {

    var nomination;                 //position of best match
    var min = Number.MAX_VALUE;     //default min value set as max

    //if there is only one candidate to choose from return that
    if (possibleMatches.length == 1) {

        return new candidate(possibleMatches[0], SUCCESS);

    } else {

        for(var i = 0; i<possibleMatches.length; i++) {

            if (possibleMatches[i].distance < min) {

                min = possibleMatches[i].distance;
                nomination = possibleMatches[i];

            }//end check for new min

        }//end loop through courses

    }//end check for single candidate

    return new candidate(nomination ,SUCCESS);

}//end

/*
 * Function to prep courses for containment and distance check
 *      Input - course: array of given courses
 *      Output - initailizedCourses: array of course objects with appropriate fields for comparisons 
 */
var preppedCourse = (course) => {

    var initailizedCourses = [];

    for(var i = 0; i<course.length; i++){

        initailizedCourses.push(new prelimList(course[i].name, course[i].id, i));

    }//end for

    return initailizedCourses;

}//end preppedCourse

/*
 * Function to reduce given array based on how many words match up before giving it to 
 * levenshtein algorithm for further anaylysis
 *      Input - userString: phrase given by user
 *            - coursesArr: array of courses user is enrolled in given by hooT
 * 
 *      Output - a reduced array of courses to be analyzed by levenshtein
 */
var reduceArr = (userString, courseArr) => {

    var splitUserString = userString.split(' ');
    
    //compare each name in the array with each word in user input
    for(var i = 0; i<courseArr.length; i++){

        var temp_course = courseArr[i].name;
        
        //compare each word with each phrase
        for(var j = 0; j<splitUserString.length; j++){

            var temp_word = splitUserString[j];
            if( temp_course.toLowerCase().includes(temp_word.toLowerCase()) ){
                courseArr[i].match++;
            }//end

        }//end compare to words

    }//end compare to list

    //reduce array to only best matches
    var matches = courseArr.filter (bestMatch => {
        return bestMatch.match != 0; 
    });

    return matches;

}//end reduceArr

/*
 * Takes in a word and an array and returns a subarray of words that match the given word.
 *          -Input: request - user given word
 *                  courseArr - list of words to compare user word against
 *          -Output: candidates - subarray of words that most closely match the user word
 */
var levenCheck = (request, courseArr) => {

    var min = Number.MAX_VALUE;     //initialize min value
    //var distanceArr = [];           //array of distances
    var candidates = [];            //subarray of words that most closely match given word

    //may not be needed
    // //if there is only one word in the array return the array itself
    // if ( courseArr.length == 1 ) {

    //     return courseArr;

    // }//end check for single enrollment

    //calculate distance and load up distnce array with results and set the minimum value 
    //or distance of word that most closely matches
    for (var i = 0; i < courseArr.length; i++) {

        //calculating distance
        var currentDist = levenshtein(request, courseArr[i].name);

        //load disgance of word onto array
        courseArr[i].distance = currentDist;

        //set min disatance of words
        if ( currentDist < min ) {
            min = currentDist;
        }//end if

    }//end for

    //check for lowest distance words
    for (var j = 0; j < courseArr.length; j++) {

        //set closest word match to array
        if (courseArr[j].distance == min){
            candidates.push(courseArr[j]);
        }//end

    }//end

    return candidates;

}//end levencheck








/*
 * Temporary object to hold informatation about given courses array
 */
function prelimList(name, id, position){
    this.name = name;
    this.position = position;
    this.id = id;
    this.words = name.split(' ');
    this.match_point = [];
    this.match = 0;
    this.distance = 0;
}//end preLimList

/*
 * Object used to mimic course array given by hooT
 * ############Used for testing only###############
 */
function hooTCourse(obj){
    this.id = Math.floor(Math.random()*10000);
    this.name = obj;
}//end hooTCourses

/*
 * Object to return
 * Holds name of course and position in original array
 */
function candidate(obj, status){

    this.object = obj;
    this.status = status;

}//end candidate





/*
 * Function to format array of closely matching words to string
 */
var toString = (list) => {

    var listOfWords = '';

    //if only one word then return
    if (list.length == 1) {
        return list[0];
    }//end

    for (var i = 0; i < list.length - 1; i++){

        listOfWords += list[i] + ', ';

    }//end for

    listOfWords += 'or ' + list[list.length-1];

    return listOfWords;

}//end

//things to export
module.exports = { FinalWord };