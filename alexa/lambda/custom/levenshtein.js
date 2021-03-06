/**
 * Algorithm to check for course name that has the best match to user's requested phrase
 * Uses levenshtein algorithm to check difference between phrases
 * Checks for phrase being a sub string of other words to better increase match
 * requires js-levenshtein
 *      npm i --save js-levenshtein
 * 
 */
const levenshtein = require('js-levenshtein');

/* *************************************************************************************
 * **************Status codes indicating success and other status*********************** 
 * *************************************************************************************/

var SUCCESS = 100;      //indicates cadidate was found successfully
var NO_MATCH = 401      //indicates no phrase is not contained in any course
var NULL_ARRAY = 402;   //indicates array was null
var NULL_PHRASE = 404;      //indicates something went wrong initially


/* *************************************************************************************
 * ************************************End status code**********************************
 * *************************************************************************************/

/* *************************************************************************************
 * *********Objects to hold user_input, course_info, match_data, and best _match********
 * Contains the following objects:
 *              -user_input
 *              -CourseData
 *              -DataAggregate
 *              -candidate
 * *************************************************************************************/

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
    this.words = obj.name.toLowerCase().split(' ');
    this.match_position = [];
    this.match = 0;
    this.match_input_position = [];
    this.match_to_input = 0;
    this.primeIndex = [];
    this.namePrime = '';
    this.distance = 0;
}//end CourseData

/*
 * Object to hold informtaion regarding match 
 */
function DataAggregate(user, courseArray) {
    this.user_input = prepareUserInput(user);
    this.courseDataArray = prepareCourses(courseArray);
    this.most_match = 0;
    this.penalty = 0;
    this.no_match = false;
    this.result;

    this.populateMatchData = () => {
        matchToCourse(this.user_input, this.courseDataArray);
        return this;
    };
    this.populateInputMatch = () => {
        matchToPhrase(this.user_input, this.courseDataArray);
        return this;
    };

    this.trimNonMatch = () => {

        for (var i = 0; i<this.courseDataArray.length; i++) {
            //reference to course in the iteration
            var check = this.courseDataArray[i];
            //if there is no match
            if ( check.match == 0 && check.match_to_input == 0 ) {
                //take out that element and shift pointer back to account for array shift
                this.courseDataArray.splice(i--,1);
            }//end check for no match
        }//end for

        //if no courses were no matches
        if (this.courseDataArray.length == 0) {
            this.no_match = true;
        }//end check for no matches

        return this;
    };

    this.primeName = () => {

        //only do if matches exists
        if (!this.no_match) {
            this.penalty = constructPrimePhrase(this.courseDataArray);
        }//end check for match
        
        return this;
    };

    this.findMostMatch = () => {
        var max = Number.MIN_VALUE; 
        for (var i = 0; i<this.courseDataArray.length; i++) {
            var check = this.courseDataArray[i];
            //check to see longest matches.
            if (check.primeIndex.length > max ) {
                max = check.primeIndex.length;
                this.most_match = check.primeIndex.length;
            }//end check for max matches
        }//end for
        return this;
    }; 

    this.populateDistanceData = () => {
        calculateDistance(this.user_input, this.courseDataArray, this.most_match, this.penalty);
        return this;
    };

    this.setResult = () => {
        var min = Number.MAX_VALUE;
        
        for (var i = 0; i < this.courseDataArray.length; i++) {

            //if distance is lower than current min then set as new min and keep reference to index of min course
            if (this.courseDataArray[i].distance < min) {
                this.result = this.courseDataArray[i];
                min = this.courseDataArray[i].distance;
            }//end set new min

        }//end check for smallest distance 

        return this;
    };

}//end data aggregate

/*
 * Object to return
 * Holds name of course and position in original array
 */
function candidate(obj, status){

    this.object = obj;
    this.status = status;

}//end candidate

/* *************************************************************************************
 * *********Objects to hold user_input, course_info, match_data, and best _match********
 * *************************************************************************************/


/* *************************************************************************************
 * *****************************log and debug log functions*****************************
 * *************************************************************************************/

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
var debug_print = false;
//InsidePrepareCourse
var ISCarray = false;
var matchToCourseBoo = false;
var matchToPhraseBoo = false;

/* *************************************************************************************
 * *************************End log and debug log functions*****************************
 * *************************************************************************************/

/**
 * This function takes in an array of courses and a user input and finds the
 * best match to the user input
 *  
 */

var MatchMaker = (request, course) => {

    var LoveMachine = new DataAggregate(request, course);

    LoveMachine.populateMatchData()
        .populateInputMatch()
        .trimNonMatch()
        .primeName()
        .findMostMatch()
        .populateDistanceData()
        .setResult();


    var match = (LoveMachine.courseDataArray.length == 0)? new candidate(null, NO_MATCH) : new candidate(LoveMachine.result, SUCCESS);

    return match;

}//end MatchMaker

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

    var requestPrime = prepareUserInput(request);

    var convertedCourses = prepareCourses(course);
    findMatch(requestPrime, convertedCourses);
    var reducedCandidates = convertedCourses.filter (bestMatch => {
        return bestMatch.match != 0;
    });

    //Check for empty candidates array
    if (reducedCandidates.length == 0) {

        var failed = new candidate(null, NO_MATCH);

        return failed;

    } else {

        var likelyCandidates = levenCheck(requestPrime, reducedCandidates);

    }//end check for empty candidates array

    /*
     * Add a function to check likelyCandidates and find one single match
     */
    //selectCandidate(likelyCandidates);


    //_p(selectCandidate(likelyCandidates));

    return selectCandidate(likelyCandidates);

}//end final word

/* *************************************************************************************
 * ********************Functions to prepare input for comparison************************
 * *************************************************************************************/

/** 
 * Used by FinalWord to make user_input object to be used for comparison
 */
var prepareUserInput = (userInput) => {

    return new user_input(userInput);

}//end prepareUserInput

/**
 * This function constructs the new name for a course based on how many
 * of the words in the course matched up to the request by the user
 * For example: 
 *          if the course name is 'Hello My name is Java Script'
 *          and the user phrase was 'Hello Java Script'
 * It would return 'Hello Java script'
 * 
 *      Input: words - An array of words that make up a course name
 *             indices - An array of references to the words that matched the words in a user request
 *                            
 *      Output: newPhrase - The new course name based on the amount of matches
 */
var constructPhrase = (words, indices) => {

    var newPhrase = '';

    if (indices.length == 1) {
        return newPhrase = words[indices[0]];
    }//end

    for (var i = 0; i<indices.length-1; i++) {

        newPhrase += `${words[indices[i]]} `;
    
    }//end

    return newPhrase += words[indices[indices.length-1]];

}//end construct phrase

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

/* *************************************************************************************
 * *****************End Functions to prepare input for comparison***********************
 * *************************************************************************************/

/* *************************************************************************************
 * **********************Functions used by FinalWord Exclusively************************
 * Contains following Functions:
 *                  -findMatch
 *                  -levenCheck
 *                  -selectCandidate
 * *************************************************************************************/

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
        var currentDist = levenshtein(request.input, courseArr[i].name);

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
 * Takes in array of likely candidates and returns a single candidate with highest 
 * match value and lowest distance value
 *          -Input: PossibleMatches - list of courses that are a possible match
 *          -Output: candidate object - course with the best match
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

/* *************************************************************************************
 * ******************End Functions used by FinalWord Exclusively************************
 * *************************************************************************************/

/* *************************************************************************************
 * ****************** Functions used by [] ********************************
 * Contains followinf functions:
 *                      -matchToCourse
 *                      -matchToPhrase
 *                      -constructPrimePhrase
 * *************************************************************************************/

/*
 * This function finds out how many matches a user phrase has to a course name 
 * and which words of the course name is matched
 *      Input: userPhrase - object containing the original phrase 
 *                          and an array of each word in the phrase
 *             courseList - object containing match value and an array of each word in the course
 *                          also contains an array of indices for which position the matches occured
 *      Output: none
 */
var matchToCourse = (userPhrase, courseList) => {
    
    //iterate through each course
    for (var i = 0; i < courseList.length; i++) {

        //iterate through each word in user phrase
        for (var j = 0; j < userPhrase.words.length; j++) {

            //iterate through each word in the current course
            for (var k = 0; k < courseList[i].words.length; k++) {

                _db(`${courseList[i].words[k]} ====== ${userPhrase.words[j]} ===== ${courseList[i].words[k].includes(userPhrase.words[j])}`, matchToCourseBoo)
                //check to see if word in course matches word in phrase
                //if they are increase match value by one and log the indice of the match
                if ( courseList[i].words[k].includes(userPhrase.words[j]) ) {
                    courseList[i].match_position.push(k);
                    courseList[i].match++;
                }//end

            }//end iterate through each word in course

        }//end iterate through user words

    }//end iterate through courses

}//end inputWordMatch

/*
 * This function finds out how many matches a course name has to a user phrase
 * and which words of the user phrase is matched
 *      Input: userPhrase - object containing the original phrase 
 *                          and an array of each word in the phrase
 *             courseList - object containing match value and an array of each word in the course
 *                          also contains an array of indices for which position the matches occured
 *      Output: none
 */
var matchToPhrase = (userPhrase, courseList) => {

    //iterate through user phrase
    for (var i = 0; i < userPhrase.words.length; i++) {

        //iterate through courses
        for (var j = 0; j < courseList.length; j++) {

            //iterate through each word in course
            for (var k = 0; k < courseList[j].words.length; k++) {

                _db(`${userPhrase.words[i]} ::::: ${courseList[j].words[k]} ::: ${userPhrase.words[i].includes(courseList[j].words[k])}`, matchToPhraseBoo);
                //check to see if a phrase matches to word
                if ( userPhrase.words[i].includes(courseList[j].words[k]) ) {

                    courseList[j].match_input_position.push(k);
                    courseList[j].match_to_input++;

                }//end check for phrase match

            }//end iterate through word in course

        }//end iterate through courses

    }//end iterating through user words

}//end match to phrase

/**
 * This function combines the array of indices with matches obtained from the match functions 
 * and combines them with no duplicates and and in order from smallest to largest to construct 
 * the phrase to be used to compared with the user phrase using the levenshtein algorithm
 * 
 */
var constructPrimePhrase = (courseList) => {

    var penalty = 0;
    var numOfWords = 0;

    for(var i = 0; i < courseList.length; i++) {
        
        courseList[i].primeIndex = setUnion(courseList[i].match_position, courseList[i].match_input_position);
        courseList[i].namePrime = constructPhrase(courseList[i].words, courseList[i].primeIndex);

        var offSet = courseList[i].primeIndex.length;
        var initialPenalty = courseList[i].namePrime.length;

        penalty += (offSet == 1) ? initialPenalty : initialPenalty - offSet;//courseList[i].namePrime.length - (courseList[i].primeIndex.length - 1);
        numOfWords += offSet;

    }//end

    return penalty/numOfWords;

}//end constructPrimePhrase

var calculateDistance = (userPhrase, courseList, maxMatch, penalty) => {

    //iterate through list of courses
    for (var i = 0; i < courseList.length; i++ ) {
     
        var levenValue = levenshtein(userPhrase.input, courseList[i].namePrime);
        courseList[i].distance += levenValue;
        //check to see if there are correct number of matches if not add penalty score
        if (courseList[i].primeIndex.length < maxMatch) {

            //add to distance score the penalty value times number of unmatched words
            courseList[i].distance += (maxMatch - courseList[i].primeIndex.length)*penalty;

        }// end penalty check

    }//end

}//end calculateDistance

/* *************************************************************************************
 * ******************End Functions used by [] and FinalWord*****************************
 * *************************************************************************************/

/* *************************************************************************************
 * ******************************Utility Functions**************************************
 * *************************************************************************************/

/**
 * This function takes in two arrays on integers and combines them
 * such that there are no duplicates and the new array is ordered from least to greatest
 *      Input: setA, setB - the arrays to be concatenated.
 *      Output: setC - the concatenated array with no duplicates and sorted
 */
var setUnion = (setA, setB) => {

    var setC = setA.concat(setB);

    //first pointer to check reference to object being checked for dupe
    for (var i = 0; i < setC.length; i++) {
        //second pointer to iterate through array to check for dupe
        for (var j = i+1; j < setC.length; j++) {
            //check for duoe
            if ( setC[i] === setC[j] ) {
                //remove duplicate and shift j back to account for array shifting down after remove
                setC.splice(j--,1);
            }//check for duplicates
        }//end second pointer
    }//end first pointer 

    return setC.sort((a,b)=> a-b);

}//end setUnion

/* *************************************************************************************
 * ***************************End Utility Functions**************************************
 * *************************************************************************************/

//things to export
module.exports = { FinalWord,
                   MatchMaker };