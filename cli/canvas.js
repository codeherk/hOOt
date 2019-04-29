const ascii_art =
`\n\n ██████╗ █████╗ ███╗   ██╗██╗   ██╗ █████╗ ███████╗     ██████╗██╗     ██╗
██╔════╝██╔══██╗████╗  ██║██║   ██║██╔══██╗██╔════╝    ██╔════╝██║     ██║
██║     ███████║██╔██╗ ██║██║   ██║███████║███████╗    ██║     ██║     ██║
██║     ██╔══██║██║╚██╗██║╚██╗ ██╔╝██╔══██║╚════██║    ██║     ██║     ██║
╚██████╗██║  ██║██║ ╚████║ ╚████╔╝ ██║  ██║███████║    ╚██████╗███████╗██║
 ╚═════╝╚═╝  ╚═╝╚═╝  ╚═══╝  ╚═══╝  ╚═╝  ╚═╝╚══════╝     ╚═════╝╚══════╝╚═╝\n\n`;

const h2p = require('html2plaintext');
const moment = require('moment');

function Student(obj) {
    this.id = obj.id;
    this.name = obj.name;
}

/**
 * Represents a single course retrieved by a GET call to the Canvas API
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
    name = name.replace("&","and"); // Alexa cannot speak &
    name = name.trim();
    this.name = name;
    if(obj.enrollments != null) {
        this.enrollments = obj.enrollments[0];
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
    this.due = obj.due_at ? moment(obj.due_at).format('LLL') : null; // ternary operator moment().format('MMMM Do YYYY, h:mm:ss a');
    this.points_possible = obj.points_possible;
    this.submission = obj.submission;
    this.download = obj.submissions_download_url;
}

function Announcement(obj) {
    this.id = obj.id;
    this.posted_at = obj.posted_at ? moment(obj.posted_at).format('LLL') : null;
    this.author = obj.user_name;
    this.title = obj.title;
    this.message = obj.message ? obj.message.replace(/(<script(\s|\S)*?<\/script>)|(<style(\s|\S)*?<\/style>)|(<!--(\s|\S)*?-->)|(<\/?(\s|\S)*?>)/g, "").trim() : null;
    this.context_code = obj.context_code;

}

module.exports = {
    ascii_art,
    Student,
    Course,
    Assignment,
    Announcement
}