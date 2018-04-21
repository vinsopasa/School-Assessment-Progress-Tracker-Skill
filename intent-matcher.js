var Promise = require('bluebird');
var ResponseBuilder = require('./models/ResponseBuilder');
var studentService = require('./services/student.service');
var intentMatcher = dataStore => {
    switch (dataStore.intent) {
        case 'default.launch':
            return defaultLaunch(dataStore);
        case 'default.sessionended':
            return defaultSessionEnded(dataStore);
        case 'AMAZON.StopIntent':
            return AmazonStopIntent(dataStore);
        case 'AMAZON.CancelIntent':
            return AmazonCancelIntent(dataStore);
        case 'AMAZON.HelpIntent':
            return AMAZONHelpIntent(dataStore);
        case 'AMAZON.YesIntent':
            return AMAZONYesIntent(dataStore);
        case 'AMAZON.NoIntent':
            return AMAZONNoIntent(dataStore);
        case 'TakeAttendance':
            return TakeAttendance(dataStore);
        case 'GiveAssessments':
            return GiveAssessments(dataStore);
        case 'GetCourseIntent':
            return GetCourseName(dataStore);
        case 'GetClassIntent':
            return GetClassName(dataStore);
        case 'GetSubjectIntent':
            return GetSubjectName(dataStore);
        case 'AssessmentAndRollIntent':
            return HandleAssessmentAndRoll(dataStore);
        case 'AttendanceResponseAbsent':
            return AttendanceResponseAbsent(dataStore);
        case 'AttendanceResponsePresent':
            return AttendanceResponsePresent(dataStore);
        default:
            return noIntentMatch(dataStore);
    }
};
var defaultLaunch = function (dataStore) {
    return new Promise((resolve, reject) => {
        var responseBuilder = new ResponseBuilder();
        dataStore.response = responseBuilder.addSpeech({
            speechType: 'PlainText',
            text: 'Welcome to Assessment Tracker. This skill helps you with taking attendance, giving assessments and reviewing reports etc. , To proceed say yes, or start, and to exit say stop, exit, or quit'
        }).addPrompt({
            promptType: 'PlainText',
            text: 'I am waiting for your response, Please say Yes to continue with the skill and say no to exit.'
        });
        dataStore.sessionData.context = 'INITIAL_QUERY';
        resolve(dataStore);
    });
};
var defaultSessionEnded = function (dataStore) {
    return new Promise((resolve, reject) => {
        var responseBuilder = new ResponseBuilder();
        dataStore.response = responseBuilder.addSpeech({
            speechType: 'PlainText',
            text: 'Thank you for using this skill.'
        });
        resolve(dataStore);
    });
};
var AmazonStopIntent = function (dataStore) {
    return new Promise((resolve, reject) => {
        var responseBuilder = new ResponseBuilder();
        dataStore.response = responseBuilder.addSpeech({
            speechType: 'PlainText',
            text: 'Thank you for using this skill.'
        });
        resolve(dataStore);
    });
};
var AmazonCancelIntent = function (dataStore) {
    return new Promise((resolve, reject) => {
        var responseBuilder = new ResponseBuilder();
        dataStore.response = responseBuilder.addSpeech({
            speechType: 'PlainText',
            text: 'Thank you.'
        });
        resolve(dataStore);
    });
};
var noIntentMatch = function (dataStore) {
    return new Promise((resolve, reject) => {
        var responseBuilder = new ResponseBuilder();
        dataStore.response = responseBuilder.addSpeech({
            speechType: 'PlainText',
            text: 'I don\'t understand please be more specific.'
        });
        resolve(dataStore);
    });
};
var AMAZONYesIntent = function (dataStore) {
    return new Promise((resolve, reject) => {
        var context = dataStore.sessionData.context;
        var responseBuilder = new ResponseBuilder();
        switch (context) {
            case 'INITIAL_QUERY':
                dataStore.response = responseBuilder.addSpeech({
                    speechType: 'PlainText',
                    text: 'I can help you in Taking attendance, Giving assessments or Reviewing reports. what would you like to do?'
                }).addPrompt({
                    promptType: 'PlainText',
                    text: 'I am waiting for your response. Tell me what would you like to do?'
                });
                dataStore.sessionData.context = 'MODULE_SELECTION';
                break;
            case 'GET_ASSESSMENT_CONFIRMATION':
                dataStore.response = responseBuilder.addSpeech({
                    speechType: 'PlainText',
                    text: `Starting the assessments for class ${dataStore.sessionData.assessmentInfo.className} for subject ${dataStore.sessionData.assessmentInfo.subjectName}. Please give me your roll number?`
                }).addPrompt({
                    promptType: 'PlainText',
                    text: 'Please give me your roll number?'
                });
                dataStore.sessionData.context = 'ROLL_NUMBER';
                break;
            default:
                dataStore.response = responseBuilder.addSpeech({
                    speechType: 'PlainText',
                    text: 'I don\'t remember asking you anything.'
                });
                break;
        }
        resolve(dataStore);
    });
};
var AMAZONNoIntent = function (dataStore) {
    return new Promise((resolve, reject) => {
        var context = dataStore.sessionData.context;
        var responseBuilder = new ResponseBuilder();
        switch (context) {
            case 'INITIAL_QUERY':
                dataStore.response = responseBuilder.addSpeech({
                    speechType: 'PlainText',
                    text: 'No problem, you can come back anytime. Just say Alexa open Assessment Tracker and I will be there for you.'
                });
                break;
            case 'TAKING_ASSESSMENT':
                dataStore.response = responseBuilder.addSpeech({
                    speechType: 'PlainText',
                    text: 'Going back to main menu. I can help you in Taking attendance, Giving assessments or Reviewing reports. what would you like to do?'
                }).addPrompt({
                    promptType: 'PlainText',
                    text: 'I am waiting for your response. Tell me what would you like to do?'
                });
                break;
            default:
                dataStore.response = responseBuilder.addSpeech({
                    speechType: 'PlainText',
                    text: 'I don\'t remember asking you anything.'
                });
        }
        delete dataStore.sessionData.context;
        resolve(dataStore);
    });
};
var AMAZONHelpIntent = function (dataStore) {
    return new Promise((resolve, reject) => {
        var responseBuilder = new ResponseBuilder();
        dataStore.response = responseBuilder.addSpeech({
            speechType: 'PlainText',
            text: 'I can help you in Taking attendance, Giving assessments or Reviewing reports. what would you like to do?'
        });
        resolve(dataStore);
    });
};
var TakeAttendance = function (dataStore) {
    // communication with service layer to fetch roll numbers
    return new Promise((resolve, reject) => {
        var context = dataStore.sessionData.context;
        var responseBuilder = new ResponseBuilder();
        switch (context) {
            case 'MODULE_SELECTION':
                studentService.getAllRollNumbers().then(result => {
                    dataStore.sessionData.attendance = result;
                    var responseBuilder = new ResponseBuilder();
                    dataStore.response = responseBuilder.addSpeech({
                        speechType: 'PlainText',
                        text: `ok children, I’m going to take attendance now. say ‘present’ when I call out your roll number. No proxies please.
                Roll Number ${ dataStore.sessionData.attendance[0].rollNumber}`
                    }).addPrompt({
                        promptType: 'PlainText',
                        text: `I am repeating once again ${dataStore.sessionData.attendance[0].rollNumber}.`
                    });
                    dataStore.sessionData.context = 'TAKING_ATTENDANCE';
                    dataStore.sessionData.attendanceCounter = 0;
                    resolve(dataStore);
                });
                break;
            default:
                dataStore.response = responseBuilder.addSpeech({
                    speechType: 'PlainText',
                    text: 'I am not taking attendence right now.'
                });
        }
    });
};
var GiveAssessments = function (dataStore) {
    return new Promise((resolve, reject) => {
        var responseBuilder = new ResponseBuilder();
        var context = dataStore.sessionData.context;
        switch (context) {
            case 'MODULE_SELECTION':
                dataStore.response = responseBuilder.addSpeech({
                    speechType: 'PlainText',
                    text: `Starting the assessment module. for which course you want assessments, CBSE, or, ICSE?`
                }).addPrompt({
                    promptType: 'PlainText',
                    text: `CBSE, or, ICSE ?`
                });
                dataStore.sessionData.context = 'GET_COURSE_NAME';
                break;
            default:
                dataStore.response = responseBuilder.addSpeech({
                    speechType: 'PlainText',
                    text: 'I am not taking assessments right now.'
                });
        }
        resolve(dataStore);
    });
};
var GetCourseName = function (dataStore) {
    return new Promise((resolve, reject) => {
        var context = dataStore.sessionData.context;
        var responseBuilder = new ResponseBuilder();
        switch (context) {
            case 'GET_COURSE_NAME':
                if (dataStore.slots.course.value !== undefined && dataStore.slots.course.value !== null && studentService.isValidCourse(dataStore.slots.course.value.toLowerCase())) {
                    dataStore.sessionData.assessmentInfo = {};
                    dataStore.sessionData.assessmentInfo.courseName = dataStore.slots.course.value.toLowerCase();
                    dataStore.response = responseBuilder.addSpeech({
                        speechType: 'PlainText',
                        text: `for which class you want assessment, fifth or sixth`
                    }).addPrompt({
                        promptType: 'PlainText',
                        text: `Tell me your choice, fifth or sixth`
                    });
                    dataStore.sessionData.context = 'GET_CLASS_NAME';
                }
                else {
                    dataStore.response = responseBuilder.addSpeech({
                        speechType: 'PlainText',
                        text: `invalid course. please tell me for which course you are looking assessments, CBSE, or, ICSE?`
                    }).addPrompt({
                        promptType: 'PlainText',
                        text: `CBSE, or, ICSE?`
                    });
                }
                break;
            default:
                dataStore.response = responseBuilder.addSpeech({
                    speechType: 'PlainText',
                    text: 'I am not taking assessments right now.'
                });
                break;
        }
        resolve(dataStore);
    });
};
var GetClassName = function (dataStore) {
    return new Promise((resolve, reject) => {
        var context = dataStore.sessionData.context;
        var responseBuilder = new ResponseBuilder();
        switch (context) {
            case 'GET_CLASS_NAME':
                if (dataStore.slots.class.value !== undefined && dataStore.slots.class.value !== null && studentService.isValidClass(dataStore.slots.class.value.toLowerCase())) {
                    dataStore.sessionData.assessmentInfo.className = dataStore.slots.class.value.toLowerCase();
                    dataStore.response = responseBuilder.addSpeech({
                        speechType: 'PlainText',
                        text: `For which subject you want assessment, English, Mathematics or Science`
                    }).addPrompt({
                        promptType: 'PlainText',
                        text: `English, Mathematics or Science`
                    });
                    dataStore.sessionData.context = 'GET_SUBJECT_NAME';
                }
                else {
                    dataStore.response = responseBuilder.addSpeech({
                        speechType: 'PlainText',
                        text: `Invalid class. for which class you want assessment, fifth or sixth`
                    }).addPrompt({
                        promptType: 'PlainText',
                        text: `Tell me your choice, fifth or sixth`
                    });
                }
                break;
            default:
                dataStore.response = responseBuilder.addSpeech({
                    speechType: 'PlainText',
                    text: 'I am not taking assessments right now.'
                });
                break;
        }
        resolve(dataStore);
    });
};
var GetSubjectName = function (dataStore) {
    return new Promise((resolve, reject) => {
        var context = dataStore.sessionData.context;
        var responseBuilder = new ResponseBuilder();
        switch (context) {
            case 'GET_SUBJECT_NAME':
                if (dataStore.slots.subject.value !== undefined && dataStore.slots.subject.value !== null && studentService.isValidSubject(dataStore.slots.subject.value.toLowerCase())) {
                    dataStore.sessionData.assessmentInfo.subjectName = dataStore.slots.subject.value.toLowerCase();
                    dataStore.response = responseBuilder.addSpeech({
                        speechType: 'PlainText',
                        text: `beginning assessment for ${dataStore.sessionData.assessmentInfo.courseName} class ${dataStore.sessionData.assessmentInfo.className} ${dataStore.sessionData.assessmentInfo.subjectName}. Say ‘yes’ to begin; say ‘no’ to go back`
                    }).addPrompt({
                        promptType: 'PlainText',
                        text: `beginning assessment for ${dataStore.sessionData.assessmentInfo.course} class ${dataStore.sessionData.assessmentInfo.className} ${dataStore.sessionData.assessmentInfo.subject}. Say ‘yes’ to begin; say ‘no’ to go back`
                    });
                    dataStore.sessionData.context = 'GET_ASSESSMENT_CONFIRMATION';
                }
                else {
                    dataStore.response = responseBuilder.addSpeech({
                        speechType: 'PlainText',
                        text: `Invalid response. For which subject you want assessment, English, Mathematics or Science`
                    }).addPrompt({
                        promptType: 'PlainText',
                        text: `English, Mathematics or Science`
                    });
                }
                break;
            default:
                dataStore.response = responseBuilder.addSpeech({
                    speechType: 'PlainText',
                    text: 'I am not taking assessments right now.'
                });
        }
        resolve(dataStore);
    });
};
var HandleAssessmentAndRoll = function (dataStore) {
    return new Promise((resolve, reject) => {
        var context = dataStore.sessionData.context;
        var responseBuilder = new ResponseBuilder();
        switch (context) {
            case 'ROLL_NUMBER':
                if (dataStore.slots.number.value) {
                    dataStore.sessionData.rollNumber = dataStore.slots.number.value;
                    studentService.getNameFromRollNumber(dataStore.sessionData.rollNumber).then(name => {
                        if (name !== null) {
                            dataStore.sessionData.name = name;
                            var courseName = dataStore.sessionData.assessmentInfo.courseName;
                            var className = dataStore.sessionData.assessmentInfo.className;
                            var subjectName = dataStore.sessionData.assessmentInfo.subjectName;
                            studentService.getAssessmentFromMockedData(courseName, className, subjectName).then(assessment => {
                                dataStore.sessionData.assessment = assessment;
                                dataStore.response = responseBuilder.addSpeech({
                                    speechType: 'PlainText',
                                    text: `All the best ${dataStore.sessionData.name}. Your assessment starts now. ${dataStore.sessionData.assessment[0].question}. Choose Your Options : 1. ${dataStore.sessionData.assessment[0].options[0]}, 2. ${dataStore.sessionData.assessment[0].options[1]}, 3. ${dataStore.sessionData.assessment[0].options[2]}, 4. ${dataStore.sessionData.assessment[0].options[3]}.`
                                }).addPrompt({
                                    promptType: 'PlainText',
                                    text: `I am repeating once again, ${dataStore.sessionData.assessment[0].question}. Choose Your Options : 1. ${dataStore.sessionData.assessment[0].options[0]}, 2. ${dataStore.sessionData.assessment[0].options[1]}, 3. ${dataStore.sessionData.assessment[0].options[2]}, 4. ${dataStore.sessionData.assessment[0].options[3]}`
                                });
                                dataStore.sessionData.context = 'STARTING_ASSESSMENT';
                                dataStore.sessionData.assessmentCounter = 0;
                                dataStore.sessionData.obtainedMarks = 0;
                                dataStore.sessionData.totalMarks = 0;
                                resolve(dataStore);
                            });
                        }
                        else {
                            dataStore.response = responseBuilder.addSpeech({
                                speechType: 'PlainText',
                                text: `Sorry, Roll number not found. Please tell me valid roll number`
                            }).addPrompt({
                                promptType: 'PlainText',
                                text: `Tell me roll number`
                            });
                            resolve(dataStore);
                        }
                    });
                }
                else {
                    dataStore.response = responseBuilder.addSpeech({
                        speechType: 'PlainText',
                        text: `Invalid input. Please tell me valid roll number`
                    }).addPrompt({
                        promptType: 'PlainText',
                        text: `Tell me valid roll number`
                    });
                    resolve(dataStore);
                }
                break;
            case 'STARTING_ASSESSMENT':
                var assessmentCounter = dataStore.sessionData.assessmentCounter;
                if (dataStore.slots.number.value && [1, 2, 3, 4].indexOf(parseInt(dataStore.slots.number.value, 10)) > -1) {
                    console.log("inside handler assessment");
                    HandleAssessmentResponseIntent(dataStore).then(result => {
                        resolve(result);
                    });
                }
                else {
                    dataStore.response = responseBuilder.addSpeech({
                        speechType: 'PlainText',
                        text: `Invalid option, please choose appropriate option, Options : 1. ${dataStore.sessionData.assessment[assessmentCounter - 1].options[0]}, 2. ${dataStore.sessionData.assessment[assessmentCounter - 1].options[1]}, 3. ${dataStore.sessionData.assessment[assessmentCounter - 1].options[2]}, 4. ${dataStore.sessionData.assessment[assessmentCounter - 1].options[3]}.`
                    }).addPrompt({
                        promptType: 'PlainText',
                        text: `I am repeating once again, Options : 1. ${dataStore.sessionData.assessment[assessmentCounter - 1].options[0]}, 2. ${dataStore.sessionData.assessment[assessmentCounter - 1].options[1]}, 3. ${dataStore.sessionData.assessment[assessmentCounter - 1].options[2]}, 4. ${dataStore.sessionData.assessment[assessmentCounter - 1].options[3]}.`
                    });
                }
                break;
            default:
                dataStore.response = responseBuilder.addSpeech({
                    speechType: 'PlainText',
                    text: 'I am not taking assessments right now.'
                });
                resolve(dataStore);
        }
    });
};
var HandleAssessmentResponseIntent = function (dataStore) {
    return new Promise((resolve, reject) => {
        var responseBuilder = new ResponseBuilder();
        var assessmentCounter;
        var option = dataStore.slots.number.value;
        if (dataStore.sessionData.assessment.length > (dataStore.sessionData.assessmentCounter + 1)) {
            console.log("assessment available");
            assessmentCounter = ++dataStore.sessionData.assessmentCounter;
            if (dataStore.sessionData.assessment[assessmentCounter - 1].answer == dataStore.sessionData.assessment[assessmentCounter - 1].options[option - 1]) {
                dataStore.sessionData.obtainedMarks = dataStore.sessionData.obtainedMarks + 10;
                dataStore.sessionData.totalMarks = dataStore.sessionData.totalMarks + 10;
            }
            else {
                dataStore.sessionData.totalMarks = dataStore.sessionData.totalMarks + 10;
            }
            dataStore.response = responseBuilder.addSpeech({
                speechType: 'PlainText',
                text: `Moving on to the next question, ${dataStore.sessionData.assessment[assessmentCounter].question}. Choose Your Options : 1. ${dataStore.sessionData.assessment[assessmentCounter].options[0]}, 2. ${dataStore.sessionData.assessment[assessmentCounter].options[1]}, 3. ${dataStore.sessionData.assessment[assessmentCounter].options[2]}, 4. ${dataStore.sessionData.assessment[assessmentCounter].options[3]}.`
            }).addPrompt({
                promptType: 'PlainText',
                text: `I am repeating once again, ${dataStore.sessionData.assessment[assessmentCounter].question}. Choose Your Options : 1. ${dataStore.sessionData.assessment[assessmentCounter].options[0]}, 2. ${dataStore.sessionData.assessment[assessmentCounter].options[1]}, 3. ${dataStore.sessionData.assessment[assessmentCounter].options[2]}, 4. ${dataStore.sessionData.assessment[assessmentCounter].options[3]}.`
            });
            dataStore.sessionData.context = "STARTING_ASSESSMENT";
        }
        else {
            assessmentCounter = ++dataStore.sessionData.assessmentCounter;
            if (dataStore.sessionData.assessment[assessmentCounter - 1].answer == dataStore.sessionData.assessment[assessmentCounter - 1].options[option - 1]) {
                dataStore.sessionData.obtainedMarks = dataStore.sessionData.obtainedMarks + 10;
                dataStore.sessionData.totalMarks = dataStore.sessionData.totalMarks + 10;
            }
            else {
                dataStore.sessionData.totalMarks = dataStore.sessionData.totalMarks + 10;
            }
            dataStore.response = responseBuilder.addSpeech({
                speechType: 'PlainText',
                text: `Well Done !! Assessment is completed successfully. you got ${dataStore.sessionData.obtainedMarks} marks out of ${dataStore.sessionData.totalMarks}. Thanks for taking the test.`
            });
            delete (dataStore.sessionData.context);
        }

        resolve(dataStore);
    });
};
var AttendanceResponseAbsent = function (dataStore) {
    return new Promise((resolve, reject) => {
        var context = dataStore.sessionData.context;
        var responseBuilder = new ResponseBuilder();
        switch (context) {
            case 'TAKING_ATTENDANCE':
                if (dataStore.sessionData.attendance.length > (dataStore.sessionData.attendanceCounter + 1)) {
                    dataStore.sessionData.attendance[dataStore.sessionData.attendanceCounter].status = "ABSENT";
                    dataStore.response = responseBuilder.addSpeech({
                        speechType: 'PlainText',
                        text: `Roll Number ${dataStore.sessionData.attendance[++dataStore.sessionData.attendanceCounter].rollNumber}`
                    }).addPrompt({
                        promptType: 'PlainText',
                        text: `I am repeating once again ${dataStore.sessionData.attendance[dataStore.sessionData.attendanceCounter].rollNumber}.`
                    });
                }
                else {
                    dataStore.sessionData.attendance[dataStore.sessionData.attendanceCounter].status = "ABSENT";
                    studentService.updateAttendance(dataStore.sessionData.attendance); // async call to update all attendances at once.
                    dataStore.response = responseBuilder.addSpeech({
                        speechType: 'PlainText',
                        text: `Well Done !! Attendance is completed successfully.`
                    });
                    delete (dataStore.sessionData.context);
                }
                break;
            default:
                dataStore.response = responseBuilder.addSpeech({
                    speechType: 'PlainText',
                    text: 'I am not taking attendance right now.'
                });
                delete (dataStore.sessionData.context);
        }
        resolve(dataStore);
    });
};
var AttendanceResponsePresent = function (dataStore) {
    return new Promise((resolve, reject) => {
        var context = dataStore.sessionData.context;
        var responseBuilder = new ResponseBuilder();
        switch (context) {
            case 'TAKING_ATTENDANCE':
                if (dataStore.sessionData.attendance.length > (dataStore.sessionData.attendanceCounter + 1)) {
                    dataStore.sessionData.attendance[dataStore.sessionData.attendanceCounter].status = "PRESENT";
                    dataStore.response = responseBuilder.addSpeech({
                        speechType: 'PlainText',
                        text: `Roll Number ${dataStore.sessionData.attendance[++dataStore.sessionData.attendanceCounter].rollNumber}`
                    }).addPrompt({
                        promptType: 'PlainText',
                        text: `I am repeating once again ${dataStore.sessionData.attendance[dataStore.sessionData.attendanceCounter].rollNumber}.`
                    });
                }
                else {
                    dataStore.sessionData.attendance[dataStore.sessionData.attendanceCounter].status = "PRESENT";
                    studentService.updateAttendance(dataStore.sessionData.attendance); // async call to update all attendances at once.
                    dataStore.response = responseBuilder.addSpeech({
                        speechType: 'PlainText',
                        text: `Well Done !! Attendance is completed successfully.`
                    });
                    delete (dataStore.sessionData.context);
                }
                break;
            default:
                dataStore.response = responseBuilder.addSpeech({
                    speechType: 'PlainText',
                    text: 'I am not taking attendance right now.'
                });
                delete (dataStore.sessionData.context);
        }
        resolve(dataStore);
    });
};
module.exports = intentMatcher;
