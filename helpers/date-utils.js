const moment = require('moment-timezone');

function getPreviousDay(daysBefore = 1) {

    const todayDate = moment().tz('America/Bogota');
    const previousDate = todayDate.subtract(daysBefore, "days")
    const fullPreviousDate = previousDate.format('YYYY-MM-DD')

    return fullPreviousDate;
}

module.exports = {
    getPreviousDay
}