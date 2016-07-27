const gulp = require('gulp')
const ejs  = require('gulp-ejs')
const loadData = require('./load-data')

const compileConf = () => {
  const locals = {env: process.env, data: loadData()}

  return gulp.src('/nginx/**/*.conf', {base: '/nginx'})
    .pipe(ejs(locals))
    .on('error', (err) => console.error(err))
    .pipe(gulp.dest('/etc/nginx/'))
}

module.exports = compileConf
