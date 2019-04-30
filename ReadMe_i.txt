Canvas for hooT is a viice user interface that utilizes Alexa Voice Sercvice as the frame work.
It uses Amazon Web Services as its backend, you may use your own backend if one is available to you.
This particular framework uses javascript.

How to remake project.

1. Create an Amazon Voice Service and Amazon Web Services account.
2. Grab an activaton .clv from Amazon web service with your own unique password and access key.
3. Download git and Visual Studo Code.
4. Download nodejs and install it.
5. Nodejs should be available on Visual Studio Code
6. Link git with VIsual Studio Code to access the git bash from within the Visual Studio Code IDE.
7. Open the Alexa folder from Visual Studio Code.
8. In the git bash through Visual Studio Code, type in "npm i ask-cli"
9. Next set up the ask cli account.
10. Type in ask init.
11. A menu will pop up prompting you to either make a new account or pick a default one.
12. Select create new profile.
13. A browser will open allowing you to log into your Amazon Voice Serice Account.
14. Once you sign in, back on the Visual Studio Code terminal you will show up as logged in.
15. You will then be promted to link your voice service account with a backend.
16. Generate credentials using Amazon Web Serivce whcih will return a .clv file.
17. When prompted copy and paste your password and Access key from the .clv file.
18. With your Amazon Web Services Account set up with your AVS account you need to get a skill ID.
19. Go onto the AVS website and create a skill.
20. After creating a skill grab the skill ID.
21. Then grab the skill ID and insert it into the Skill ID field of the config file under the .ask directory.
22. Once all that is set up type in "ask deploy -p <your profile name>
23. if all goes well your skill will be deployed and available on you AVS console.
24. To test locaclly through Visual Studio Code type in "Ask --locale en-US"
25. You will now be able to test your skill.
26. Type in the "open hooT" if the invocation name was unchanged, if not type in the changred invocation name instead.

How to Implment CLI command

1. Open the CLI folder. 
2. Type in "npm i"
3. Type in "node command.js"
4. Test by typing in "hoot -h"