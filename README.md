#Project Template

##Introduction

Basic project with header, body, footer, navigation, and some basic angular routing setup.

----------------------
## Cloning the Project
### SSH Connection
`ssh -i ~/.ssh/System76Connection.pem ubuntu@intellectual-tech.com`

### Login as Git User and Make Bare Repo
```
su git
cd ~/repo
git init --bare newProjectNameHere.git
```

### Make a Copy of this Project Template
```
mkdir ~/tempGitCreation
cd ~/tempGitCreation
git clone --mirror git@intellectual-tech.com:repo/project-template.git
```

### Push the Project Template into the New Project Repository
```
cd project-template.git
git push --mirror git@intellectual-tech.com:repo/newProjectNameHere.git
cd /var/www/
git clone git@intellectual-tech.com:repo/newProjectNameHere.git
cd newProjectNameHere
npm install
bower install
grunt phpwatch
```
----------------------
##Post Cloning Updates
Update the following sections that have company related information

* HTML Page Title
* Header/Logo
* Footer
* Contact Page


##Update Navigation and Create Partials to Reflect Page Structure
Update the mainApp.js file to have the appropriate routes and partials for navigation.  For each page create a partial with a header to test the navigation.