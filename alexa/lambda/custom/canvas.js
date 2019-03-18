//const h2p = require('html2plaintext'); // npm i html2plaintext

function Course(obj) {
    this.id = obj.id;
    // format course name
    var name = obj.name;
    if (name.includes('-')) {
        name = name.split('-')[1];
    }
    name = name.replace("&","and"); // Alexa cannot speak &
    name = name.trim();
    this.name = name;
}

function Assignment(obj) {
    this.id = obj.id;
    this.name = obj.name;
    //this.description = h2p(obj.description).replace(/\r?\n|\r/g, " ");
    this.due = new Date(obj.due_at);
}

module.exports = {
    Course,
    Assignment
}