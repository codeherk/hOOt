const h2p = require('html2plaintext');
const moment = require('moment');

function Student(obj) {
    this.id = obj.id;
    this.name = obj.name;
}

/**
 * Represents a single course retrieved by a GET call to the Canvas API
 * Function replaces ampersand chars. with 'and', as Alexa cannot vocalize ampersand chars.
 * @constructor
 * @param {Course} obj 
 */
function Course(obj) {
    this.id = obj.id;
    // format course name
    var name = obj.name;
    var year = moment().year()
    if (name.includes(year)) {
        name = name.split(year)[0];
        name = name.split('-')[0];
    }

    name = name.split('sec')[0];
    
    if (name.includes('-')) {
        name = name.split('-')[1];
    }

    name = name.replace("&","and");
    name = name.trim();
    
    this.name = name;

    if(obj.enrollments != null) {
        this.enrollments = obj.enrollments[0];
        //console.log(this.enrollments);
    }
}

/**
 * Represents a single assignment retrieved by a GET call to the Canvas API
 * @constructor
 * @param {Assignment} obj 
 */
function Assignment(obj) {
    this.id = obj.id;
    this.name = obj.name;
    this.description = obj.description ? h2p(obj.description).replace(/\r?\n|\r/g, " ") : null;
    this.due = obj.due_at ? moment(obj.due_at).utcOffset("-04:00").format('LLL') : null; // ternary operator moment().format('MMMM Do YYYY, h:mm:ss a');
    this.points_possible = obj.points_possible;
    this.submission = obj.submission;
}

function Announcement(obj) {
    this.id = obj.id;
    this.posted_at = obj.posted_at ? moment(obj.posted_at).utcOffset("-04:00").format('LLL') : null;
    this.author = obj.user_name;
    this.title = obj.title;
    this.message = obj.message ? h2p(obj.message).replace(/\s+/g,' ') : null;
    this.context_code = obj.context_code;
}

module.exports = {
    Student,
    Course,
    Assignment,
    Announcement
}