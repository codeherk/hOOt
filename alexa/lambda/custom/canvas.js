//const h2p = require('html2plaintext'); // npm i html2plaintext

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
    if (name.includes('-')) {
        name = name.split('-')[1];
    }
    name = name.replace("&","and");
    name = name.trim();
    this.name = name;
}

/**
 * Represents a single assignment retrieved by a GET call to the Canvas API
 * @constructor
 * @param {Asignment} obj 
 */
function Assignment(obj) {
    this.id = obj.id;
    this.name = obj.name;
    //this.description = h2p(obj.description).replace(/\r?\n|\r/g, " ");
    this.due = new Date(obj.due_at);
}

/**
 * Export module with newly created Course and Assignment objects
 */
module.exports = {
    Course,
    Assignment
}