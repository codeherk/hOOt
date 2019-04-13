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
var _p = arg => {
    if (debug_print) {
        console.log(arg);
    }//end if
}//end _p

var _db = (arg, debug) => {
    if (debug) {
        console.log(arg);
    }//end if
}//end _db
//condition to print debug
var debug_print = true;
//InsidePrepareCourse
var ISCarray = true;




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

    var convertedCourses = prepareCourses(course);
    var reducedCandidates = findMatch(request, convertedCourses);

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
 * Function to reduce given array based on how many words match up before giving it to 
 * levenshtein algorithm for further anaylysis
 *      Input - userString: phrase given by user
 *            - coursesArr: array of courses user is enrolled in given by hooT
 * 
 *      Output - a reduced array of courses to be analyzed by levenshtein
 */
var findMatch = (user_input, courseArr) => {

    //var splitUserString = userString.split(' ');
    
    //compare each name in the array with each word in user input
    for(var i = 0; i<courseArr.length; i++){

        var temp_course = courseArr[i].name;
        
        //compare each word with each phrase
        for(var j = 0; j<user_input.words.length; j++){

            var temp_word = user_input.words[j];
            if( temp_course.toLowerCase().includes(temp_word.toLowerCase()) ){
                courseArr[i].match++;
            }//end

        }//end compare to words

    }//end compare to list

}//end findMatch

/*
 * This function finds out how many matches a user phrase has to a course name 
 * and which words of the course name is matched
 *      Input: userPhrase - object containing the original phrase 
 *                          and an array of each word in the phrase
 *             courseList - object containing match value and an array of each word in the course
 *                          also contains an array of indices for which position the matches occured
 *      Output: none
 */
var inputWordMatch = (userPhrase, courseList) => {
    
    //iterate through each course
    for (var i = 0; i < courseList.length; i++) {

        //iterate through each word in user phrase
        for (var j = 0; j < userPhrase.words.length; j++) {

            //iterate through each word in the current course
            for (var k = 0; k < courseList[i].words.length; k++) {

            }//end iterate through each word in course

        }//end iterate through user words

    }//end iterate through courses

}//end inputWordMatch

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
 * Function to prep courses for containment and distance check
 *      Input - course: array of given courses
 *      Output - initailizedCourses: array of course objects with appropriate fields for comparisons 
 */
var prepareCourses = (courses) => {

    _db(courses, ISCarray);
    var initailizedCourses = [];

    for(var i = 0; i<courses.length; i++){

        initailizedCourses.push(new CourseData(courses[i],courses[i].name) );

    }//end for

    return initailizedCourses;

}//end preppedCourse

var prepareUserInput = (userInput) => {

    return new user_input(userInput);

}//end prepareUserInput

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

/**
 * Object to hold user phrase and also each word of phrase
 */
function user_input(phrase) {
    this.input = phrase.toLowerCase();
    this.words = phrase.toLowerCase().split(' ');
    var is_one_word;
    if (this.words.length == 1) {
        this.is_one_word = true;
    } else {
        this.is_one_word = false;
    }//end
}//end 

/*
 * Object to hold all information about course and match data
 */
function CourseData(obj, phrase){
    this.name = obj.name.toLowerCase();
    this.id = obj.id;
    this.words = obj.name.split(' ');
    this.match_position = [];
    this.match = 0;
    this.match_input_position = [];
    this.match_to_input = 0;
    this.distance = 0;
}//end CourseData


function DataAggregate(user, courseArray) {
    this.user_input = prepareUserInput(user);
    this.courseDataArray = prepareCourses(courseArray);

    this.populateMatchData = () => {
        return this;
    };
    this.populateInputMatch = () => {
        return this;
    };
    this.populateDistanceData = () => {
        return this;
    };

}//end



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

/*
 * Object used to mimic course array given by hooT
 * ############Used for testing only###############
 */
function hooTCourse(obj){
    this.id = Math.floor(Math.random()*10000);
    this.name = obj;
}//end hooTCourse

var hootArrayPopulate = (arr) => {

    var hooTArray = [];

    for (var i = 0; i<arr.length; i++) {
        hooTArray.push(new hooTCourse(arr[i]));
    }//end

    return hooTArray;

}//end





//########################test##########################################

var testphrase = 'hello poop world';
var testArr = ['this is a test','This is Also a poop',
                'Piss off','I like Big','Gold Experience',
                'Pussy Control','Finger Prince'];

var testArray = hootArrayPopulate(testArr);

_p(testArray);

var test = new DataAggregate(testphrase, testArray);


_p(test);

for (var i = 0; i<test.courseDataArray.length; i++) {

    for (var j = 0; j < test.courseDataArray[i].words.length; j++) {
        _p(test.courseDataArray[i].words[j]);
    }//end for j

}//for i

//########################test##########################################


//things to export
module.exports = { FinalWord };