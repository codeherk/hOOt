Canvas for hooT is a visual user interface that utilizes Alexa Voice Service as the frame work.
It uses Amazon Web Services as its backend, you may use your own backend if one is available to you.
This particular framework uses javascript.

All the features implemented:

1. CoursesIntent allows you to ask for the name of the courses you are enrolled in.
2. CourseScoresIntent allows you to ask for your current overall grades for your classes.
3. TACoursesIntent allows you to ask what classes you are teaching if you are a TA.
4. AssignmentIntent allows you to ask if you have any upcoming assignments for a course.
5. CourseStudentsIntent allows you to ask for a list of the students enrolled in your class.
6. AnnouncementIntent allows you to ask for any new announcements your professors may have posted.
7. SubmissionScoresIntent allows you to ask for grades in assignments for a particular class.
8. TotalStudentsIntent allows you to ask for the total number of students enrolled in your class.
9. ProfessorNameIntent allows you to ask for the name of your professor for a course.
10. If a user asks for help, a little summary of hooT is given along with two example phrases a user can say.
11. When hooT is opened, Alexa will let you know if you have any new announcements and read them to you if you would like. 

Any know bugs in this release:

1. Alexa may have trouble understanding the user's voice depending on who is speaking.
2. Alexa may take longer to respond to your request if the API call takes longer.

Detailed instructions to build:

-Before deploying the project you must first follow these steps:
    1. Create an Amazon Voice Service and Amazon Web Services account.
    2. Get an activaton .csv file from our project leader, he/she must create an account which allows you to use our lambda function.
    3. Download git and Visual Studo Code.
    4. Download Nodejs and install it.
    5. Nodejs should be available on Visual Studio Code.
    6. Link git with Visual Studio Code to access the git bash from within the Visual Studio Code IDE.
    7. cd into the Alexa folder in Visual Studio Code with the built in terminal.
    8. In the git bash through Visual Studio Code, type in "npm i ask-cli"
    9. Next set up the ask cli account.
    10. Type in ask init.
    11. A menu will pop up prompting you to either make a new account or pick a default one.
    12. Select create new profile.
    13. A browser will open allowing you to log into your Amazon Voice Service Account for authentication.
    14. Once you sign in, you should succesfully be authenticated in the terminal within Visual Studio Code.
    15. You will then be promted to link your voice service account with a backend.
    16. Paste the Access Key ID and Secret Access Key from the .csv file that our project leader gave you.
    18. Open the config file under alexa/.ask/config. You will now need to get our skill ID.
    19. To get our skill ID, you must be a developer for hoot. You can reach out to our project leader to give you access.
    21. Once you have the skill ID, paste it into the "skill_id" field inside the config file.
-You can now deploy the project, to do so:
    1. cd into alexa folder.
    2. Type in "ask deploy" and press enter.
        -If you get an Error that says "The local stored [skill] eTag does not match the one on the server side. 
         Then please type in "ask deploy --force" and press Enter.
    3. If succesfully deployed, you should get a message that says "Your skill is now deployed and enabled in the development stage.
       Try simulate your Alexa skill skill using "ask dialog" command".
    
Using the skill after succesfully deploying:
1. cd into the Alexa folder and type in "ask dialog -l en-US" and press Enter.
2. Your command line should now say "User >" and allow you to type. 
3. Type in "open hoot" and you should now be able to type in any commands from our features.
  -Alternatively, if you have an Alexa enabled device, you can say "open hoot" and hoot should open.

How to Implment CLI command

1. cd to CLI folder.
2. Type in "npm i"
3. Type in "node command.js" to see options
4. Test by typing in "node command.js init" to provide access token
5. "node command.js courses" for list of enrolled courses