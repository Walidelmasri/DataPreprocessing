const fs = require('fs');
class Exportable_Data_Processing {
    constructor() {
        this.raw_user_data = null;
        this.formatted_user_data = null;
        this.cleaned_user_data = null;
    }
    load_CSV(filename) {
        this.raw_user_data = fs.readFileSync(`${filename}.csv`, { encoding: 'utf8' });
    }
    format_data() {
        const lines = this.raw_user_data.trim().split('\n');
        const regexTitle = /Dr|Mr|Miss|Mrs|Ms/;
        const regexMonth = /January|February|March|April|May|June|July|August|September|October|November|December/;
        const regexAge = /one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|fourty|fifty|sixty|seventy|eighty|ninety/;
        const regexEmail = /\r/;
        this.formatted_user_data = lines.map(line => {
            let [name, dob, age, email] = line.split(',');
            let [tit] = '';
            let [restOfName] = '';
            let [day, month, year] = '';
            //logic for formatting title and names
            if (regexTitle.test(name)) {
                [tit, ...restOfName] = name.split(' ');
                // console.log([tit, ...restOfName]);
            }
            else {
                [tit] = ' ';
                [...restOfName] = name.split(' ');
            }
            //check for letters in dob and change to numbers
            if (regexMonth.test(dob)) {
                [day, month, year] = dob.split(' ');
                let monthDict = {
                    'January': '01', 'February': '02', 'March': '03', 'April': '04', 'May': '05', 'June': '06', 'July': '07', 'August': '08', 'September': '09', 'October': '10', 'November': '11', 'December': '12'
                }
                for (var key in monthDict) {
                    var value = monthDict[key];
                    if (month == key) {
                        dob = `${day}/${value}/${year}`;
                    }
                }
            }
            //check if date is missing two digits in the year and fix to 19 or 20
            else {
                if (dob != null && dob.length < 10) {
                    [day, month, year] = dob.split('/');
                    if (year > 5) {
                        dob = `${day}/${month}/19${year}`;
                    }
                    else {
                        dob = `${day}/${month}/20${year}`;
                    }
                }
            }
            //logic for cleaning age
            if (regexAge.test(age)) {
                const numberWords = {
                    "zero": 0, "one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10,
                    "eleven": 11, "twelve": 12, "thirteen": 13, "fourteen": 14, "fifteen": 15, "sixteen": 16, "seventeen": 17, "eighteen": 18, "nineteen": 19,
                    "twenty": 20, "thirty": 30, "forty": 40, "fifty": 50, "sixty": 60, "seventy": 70, "eighty": 80, "ninety": 90
                };
                const parts = age.split('-');
                let result = 0;
                parts.forEach(part => {
                    if (part in numberWords) {
                        result += numberWords[part];
                    }
                });
                age = result;
            }
            if (regexEmail.test(email)) {
                email = email.slice(0, -1);
            }
            //add every attribute to formatted data list
            const formattedData = {
                title: tit,
                first_name: restOfName[0],
                middle_name: restOfName.length > 2 ? restOfName.slice(1, -1).join(' ') : '',
                surname: restOfName[restOfName.length - 1],
                date_of_birth: dob,
                age: parseInt(age),
                email: email
            };

            return formattedData;
        });
    }
    edit_user_email(email, newEmail) {
        user.email = newEmail;
    }

    clean_data() {
        this.cleaned_user_data = this.formatted_user_data;
        const uniqueEntries = new Set();
        const emailCounts = {};
        const duplicateEmails = {};
        //filter out duplicates
        //remove people with liverpool.ac.uk from emails to match 148 unique records
        this.cleaned_user_data = this.formatted_user_data.filter(entry => {
            const key = JSON.stringify(entry);
            const isDuplicate = uniqueEntries.has(key) || entry.email.endsWith('@Liverpool.ac.uk');
            if (!isDuplicate) {
                //clean up title replacing dots and spaces with blanks
                entry.title = entry.title.replace('.', '');
                if (entry.title == ' ') {
                    entry.title = entry.title.replace(' ', '');
                }
                //if first name is not found copy it from the email, do the same for last name
                if (entry.first_name == '') {
                    entry.first_name = entry.email.split('.')[0];
                }
                if (entry.surname == '') {
                    entry.surname = entry.email.split('@')[0].split('.').pop();
                }
                //calculate the age according to the date of birth and replace it if incorrect
                const dobParts = entry.date_of_birth.split('/');
                const dob = new Date(`${dobParts[2]}-${dobParts[1]}-${dobParts[0]}`);
                const currentDate = new Date('2024-02-26');
                let age = currentDate.getFullYear() - dob.getFullYear();
                const birthMonth = dob.getMonth() + 1;
                const currentMonth = currentDate.getMonth() + 1;
                if (currentMonth < birthMonth || (currentMonth === birthMonth && currentDate.getDate() < dob.getDate())) {
                    age--;
                }
                if (entry.age != age) {
                    entry.age = age;
                }
                // console.log('Email before cleaning');
                // console.log(entry.email);
                let dummy = `${entry.first_name}.${entry.surname}@example.com`;
                if (entry.email != dummy) {
                    entry.email = dummy;
                }
                // console.log('********Email after fixing ********')
                // console.log(entry.email);
                uniqueEntries.add(key);
            }
            return !isDuplicate;
        });
        this.cleaned_user_data.forEach(user => {
            emailCounts[user.email] = 0;
        });
        this.cleaned_user_data.forEach(user => {
            emailCounts[user.email]++;
        });
        // console.log(emailCounts);
        for (var email in emailCounts) {
            var count = emailCounts[email];
            if (count > 1) {
                duplicateEmails[email] = count;
            }
        }
        let emailCounter = {};
        for (const email in duplicateEmails) {
            const ogMail = email;
            const usersWithOgMail = this.cleaned_user_data.filter(user => {
                if (user.email === ogMail) {
                    const count = emailCounter[ogMail] || 0;
                    emailCounter[ogMail] = count + 1;
                    user.email = `${ogMail.split('@')[0]}${count + 1}@${ogMail.split('@')[1]}`;
                    return true;
                }
                return false;
            });
        }
    }
    most_common_surname() {
        const surnames = {};
        this.cleaned_user_data.forEach(user => {
            const trial = user.surname;
            surnames[trial] = (surnames[trial] || 0) + 1;
        });
        let maxCount = 0;
        const mostCommonSurnames = [];
        for (const surname in surnames) {
            if (surnames[surname] > maxCount) {
                maxCount = surnames[surname];
                mostCommonSurnames.splice(0, mostCommonSurnames.length, surname);
            } else if (surnames[surname] === maxCount) {
                mostCommonSurnames.push(surname); 
            }
        }

        return mostCommonSurnames;
    }
    average_age() {
        const totalAge = this.cleaned_user_data.reduce((acc, user) => acc + user.age, 0);
        const averageAge = totalAge / this.cleaned_user_data.length;
        const roundedAverageAge = parseFloat(averageAge.toFixed(1));
        console.log(roundedAverageAge);
        return roundedAverageAge;
    }
    youngest_dr() {
        let youngestDr = null;
        let minAge = Infinity;

        this.cleaned_user_data.forEach(entry => {
            if (entry.title === 'Dr' && entry.age < minAge) {
                youngestDr = entry;
                minAge = entry.age;
            }
        });
        return youngestDr;
    }
    most_common_month() {
        const monthCounts = {};

        this.cleaned_user_data.forEach(user => {
            const [day, month, year] = user.date_of_birth.split('/');
            const monthInt = parseInt(month);
            monthCounts[monthInt] = (monthCounts[monthInt] || 0) + 1;
        });

        let mostCommonMonth = null;
        let maxCount = 0;

        for (const month in monthCounts) {
            if (monthCounts[month] > maxCount) {
                maxCount = monthCounts[month];
                mostCommonMonth = parseInt(month);
            }
        }
        return mostCommonMonth;
    }
    percentage_titles() {
        const titleCounts = {
            "Mr": 0,
            "Mrs": 0,
            "Miss": 0,
            "Ms": 0,
            "Dr": 0,
            "": 0
        };

        this.cleaned_user_data.forEach(user => {
            titleCounts[user.title]++;
        });

        const totalCount = this.cleaned_user_data.length;
        const percentages = [
            Math.round((titleCounts["Mr"] / totalCount) * 100),
            Math.round((titleCounts["Mrs"] / totalCount) * 100),
            Math.round((titleCounts["Miss"] / totalCount) * 100),
            Math.round((titleCounts["Ms"] / totalCount) * 100),
            Math.round((titleCounts["Dr"] / totalCount) * 100),
            Math.round((titleCounts[""] / totalCount) * 100)
        ];
        return percentages;
    }
}
module.exports = Exportable_Data_Processing.js;
data = new Exportable_Data_Processing;
data.load_CSV("Raw_User_Data");
data.format_data();
data.clean_data();
data.most_common_surname();
data.average_age();
data.youngest_dr();
data.most_common_month();
data.percentage_titles();
// data.percentage_altered();