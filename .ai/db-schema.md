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


## Media Functions

#### list_image_usage(p_media_id uuid)
Returns all database references to a media file (card_answers, cards.details, etc.)
Used for FE safety dialog and delete validation.

#### delete_media_safe(p_media_id uuid, override boolean)
Delete media row safely by admin:
- Clears references in `card_answers`
- Optional: clears references in `cards.details`
