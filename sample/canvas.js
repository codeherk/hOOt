const ascii_art = 
`\n\n ██████╗ █████╗ ███╗   ██╗██╗   ██╗ █████╗ ███████╗     █████╗ ██████╗ ██╗
██╔════╝██╔══██╗████╗  ██║██║   ██║██╔══██╗██╔════╝    ██╔══██╗██╔══██╗██║
██║     ███████║██╔██╗ ██║██║   ██║███████║███████╗    ███████║██████╔╝██║
██║     ██╔══██║██║╚██╗██║╚██╗ ██╔╝██╔══██║╚════██║    ██╔══██║██╔═══╝ ██║
╚██████╗██║  ██║██║ ╚████║ ╚████╔╝ ██║  ██║███████║    ██║  ██║██║     ██║
 ╚═════╝╚═╝  ╚═╝╚═╝  ╚═══╝  ╚═══╝  ╚═╝  ╚═╝╚══════╝    ╚═╝  ╚═╝╚═╝     ╚═╝\n\n`;

const h2p = require('html2plaintext');

function Course(obj) {
    this.id = obj.id;
    this.name = obj.name;
}

function Assignment(obj) {
    this.id = obj.id;
    this.name = obj.name;
    this.description = obj.description ? h2p(obj.description).replace(/\r?\n|\r/g, " ") : null;
    this.due = obj.due_at ? new Date(obj.due_at) : null; // ternary operator 
    this.points_possible = obj.points_possible;
}

module.exports = {
    Course,
    Assignment,
    ascii_art
}