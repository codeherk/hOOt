function Course(id,name) {
    this.id = id;
    this.name = name;
}

function Assignment(id,name,description) {
    this.id = id;
    this.name = name;
    this.description = description;
}

module.exports = {
    Course,
    Assignment
}