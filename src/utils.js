const fs = require('fs')
const path = require('path')
const morgan = require('morgan')

function formatDate (date) {
  var monthNames = [
    'January', 'February', 'March',
    'April', 'May', 'June', 'July',
    'August', 'September', 'October',
    'November', 'December'
  ]

  var day = date.getDate()
  var monthIndex = date.getMonth()
  var year = date.getFullYear()

  return day + '' + monthNames[monthIndex] + '' + year
}

module.exports = {
  setLogger: (app) => {
    let dir = './logs'
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir)
    }
    const accessLogStream = fs.createWriteStream(path.join(__dirname, `../logs/${formatDate(new Date())}.log`), {flags: 'a'})
    app.use(morgan('combined', {stream: accessLogStream}))
  }
}
