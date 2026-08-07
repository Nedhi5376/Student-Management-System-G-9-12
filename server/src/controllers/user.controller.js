export async function getMe(req, res) {
  if (req.user.role === 'student' && req.user.classId) {
    await req.user.populate('classId');
  }
  return res.json({ user: req.user.toPublicJSON() });
}
