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
    this.description = h2p(obj.description).replace(/\r?\n|\r/g, " ");
    this.due = new Date(obj.due_at);
}

module.exports = {
    Course,
    Assignment,
    ascii_art
}