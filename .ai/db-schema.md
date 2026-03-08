# Database Schema Summary

- Profiles
- Programs
- Courses
- Lessons
- Cards
- Card Answers
- Card Modes
- Media 
- Tags / Program Tags / Course Tags / Lesson Tags / Media Tags
- **Membership tables**:
  - program_memberships (role: student/editor, added_by, added_at)
  - course_memberships (role: student/editor, added_by, added_at)

## Notes
- Primary keys: UUIDs
- Foreign keys enforce relational integrity
- Timestamps default to `now()`
- Membership tables unify student/editor roles