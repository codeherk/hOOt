const h2p = require('html2plaintext');
const moment = require('moment');

function Course(obj) {
    this.id = obj.id;
    // format course name
    var name = obj.name;

    if (name.includes('Spring')) {
        name = name.split('Spring')[0];
        name = name.split('-')[0];
    }

    name = name.split('sec')[0];
    if (name.includes('-')) {
        name = name.split('-')[1];
    }
    name = name.replace("&","and"); // Alexa cannot speak &
    name = name.trim();
    this.name = name;
}

function Assignment(obj){
    this.id = obj.id;
    this.name = obj.name;
    this.description = obj.description ? h2p(obj.description).replace(/\r?\n|\r/g, " ") : null;
    this.due = obj.due_at ? moment(obj.due_at).utcOffset("-04:00").format('LLL') : null; // ternary operator moment().format('MMMM Do YYYY, h:mm:ss a');
    this.points_possible = obj.points_possible;
}

module.exports = {
    Course,
    Assignment
}