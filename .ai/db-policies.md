# RLS & Access Rules

## Roles
- admin: full access
- editor: write access in courses/programs assigned
- student: read-only access in enrolled courses/programs

## Helper Functions
- `is_admin()`
- `is_program_member(program_id)`
- `is_program_editor(program_id)`
- `is_course_member(course_id)`
- `is_course_editor(course_id)`

## Access Table
| Resource          | Read Access                       | Write Access                       |
|------------------|----------------------------------|-----------------------------------|
| Programs          | member OR admin                  | editor OR admin                   |
| Courses           | member OR admin                  | editor OR admin                   |
| Lessons           | course/program member OR admin   | course/program editor OR admin    |
| Cards             | course/program member OR admin   | course/program editor OR admin    |
| Card Answers      | course/program member OR admin   | course/program editor OR admin    |
| Card Modes        | course/program member OR admin   | course/program editor OR admin    |

### Media Table RLS
- DELETE: only `is_admin()` can delete media rows
- SELECT / INSERT / UPDATE: inherited from existing media policies


## Best Practices
- Idempotent policies
- Use helper functions
- Membership tables replace separate editor/student tables
- Apply policies in migrations; seeds separate


