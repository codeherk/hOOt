const LD = require('./levenDistance');

//short hand for console log
var log = arg => console.log(arg);
//Log for debugging
var _p = arg => console.log(arg);


/*
 * Object used to mimic course array given by hooT
 * ############Used for testing only###############
 */
function hooTCourse(obj){
    this.id = Math.floor(Math.random()*10000);
    this.name = obj;
}//end hooTCourses

/*
 * Function to convert test arrays to arrays hooT may give
 * ##################Used for testing only################
 */
var courseInit = (course) => {

    var initCourse = [];

    for(var i = 0; i<course.length; i++){
        initCourse.push(new hooTCourse(course[i]));
    }//end

    return initCourse;

}//end courseInit



//log('\nAre you asking for, ' + toString( levenCheck(testWord,test) ) );

/*
 * Test procedure
 */

//array of potential enrollments
var test = ['Calculus 1','Calculus 2','Calculus 3','Mosaic I',
            'Projects in Computer Science','Microarchitecture',
            'Data Structures and Algorithm','Software Design',
            'Mathematical Concepts in Computing II','Data Structures'];

//list of words to test against
var testArr = ['calculus one','projects','capstone','projects in','data structure'];
//set test word
var testWord = testArr[4];

//log(toString(test) + '\n');

var testFunction = (testArr) => {

    for (var k = 0; k < testArr.length; k++) {

        var count = k + 1;
    
        log('Result: ' + count);
        log('Word being asked for is: ' + '[' + testArr[k] + ']');
        log('\nHere is the result: ');
        log('\n\tAre you asking for: ' + '\n\t' + toString( levenCheck(testArr[k],test) ) + '\n');
    
    }//end for

}//end test function

/*
 * End Test procedure
 */




//log(courseInit(test));
//log(preppedCourse(courseInit(test))[2].name);

/*
 * Test for parser
 *****************************************/

var test_phrase = 'computer'
_p('User input: ' + test_phrase + '\n');
//reduceArr(test_phrase, preppedCourse(courseInit(test)));

//_p(courseInit(test));

var tempWord = LD.FinalWord(test_phrase, courseInit(test));
_p('\nCourse name: ' + tempWord.object.name
    + '\nCourse position: ' + tempWord.object.position
    + '\nCourse id: ' + tempWord.object.id
    + '\nCourse match: ' + tempWord.object.match
    + '\nCourse distance: ' + tempWord.object.distance
    + '\nCourse status: ' + tempWord.status);
/*****************************************
 * Test for parser
 */


//log('poopypants is poopy'.includes('poopy'));
//log('poopypants is poopy'.includes('grllo'));

/*
 * Test for levenshtein
 *****************************************/

//var gg = levenCheck(testWord,test);
//testFunction(testArr);

/*****************************************
 * Test for parser
 */

//log(gg);

//log(toString(test));



/**
 * medium example filter array
 */