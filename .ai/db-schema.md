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

- **Learning table**:
  - `user_cards_learnings` — per-user, per-card learning state (score, errors_by_type, last_visited, favorite_date)

## Notes
- Primary keys: UUIDs
- Foreign keys enforce relational integrity
- Timestamps default to `now()`
- Membership tables unify student/editor roles
- `user_cards_learnings` has a `UNIQUE (user_id, card_id)` constraint — upsert via `onConflict`


## Helper Functions

#### get_authorized_card_ids(p_user_id uuid, p_card_ids uuid[])
Returns the subset of `p_card_ids` the given user is allowed to access (course/program membership or admin role).
Used by Edge Functions that run under service role — where `auth.uid()` is unavailable — to enforce card-level access control.

## Media Functions

#### list_image_usage(p_media_id uuid)
Returns all database references to a media file (card_answers, cards.details, etc.)
Used for FE safety dialog and delete validation.

#### delete_media_safe(p_media_id uuid, override boolean)
Delete media row safely by admin:
- Clears references in `card_answers`
- Optional: clears references in `cards.details`
