import DataBase from 'better-sqlite3'
const db = new DataBase('ncode_solutions.db', { verbose: console.log })

db.prepare('CREATE TABLE IF NOT EXISTS problem_solutions(id INTEGER PRIMARY KEY, lesson_no INTEGER, solution TEXT )').run()
db.prepare('CREATE TABLE IF NOT EXISTS cached_requests(id INTEGER PRIMARY KEY, prompt TEXT, response TEXT)').run()

// db.prepare('INSERT INTO problem_solutions (lesson_no, solution) VALUES(?, ?)').run(1, '4534')
// db.prepare('UPDATE problem_solutions SET solution=? WHERE lesson_no=?').run('4354', 1)
console.log(db.prepare('SELECT * FROM problem_solutions where lesson_no=?').get(1))

