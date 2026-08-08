import { connectDb } from './src/config/db.js';
import { User } from './src/models/User.js';
import { ClassSubject } from './src/models/ClassSubject.js';
import { Class } from './src/models/Class.js';
import { Subject } from './src/models/Subject.js';

await connectDb();
const teachers = await User.find({ role: 'teacher' }).select('name email nationalId passwordChanged employeeId').lean();
const students = await User.find({ role: 'student' }).select('name classId rollNumber').lean();
const classes = await Class.find().lean();
const subjects = await Subject.find().lean();
const assignments = await ClassSubject.find().populate('classId subjectId teacherId').lean();
console.log('TEACHERS:', teachers.map(t => ({ name: t.name, email: t.email, nationalId: t.nationalId, passwordChanged: t.passwordChanged })));
console.log('STUDENTS:', students.length, students.slice(0,3));
console.log('CLASSES:', classes.map(c => ({ id: c._id.toString(), name: c.name, grade: c.grade })));
console.log('SUBJECTS:', subjects.map(s => ({ id: s._id.toString(), name: s.name, code: s.code })));
console.log('ASSIGNMENTS:', assignments.map(a => ({ id: a._id.toString(), teacher: a.teacherId?.name, subject: a.subjectId?.name, class: a.classId?.name })));
process.exit(0);
