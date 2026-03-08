create with tree -I 'node_modules|build|dist|.git|.next|.DS_Store' --dirsfirst > .ai/filestructure.md

.
├── backend
│   ├── migrations
│   │   ├── 001_media_refactor.sql
│   │   └── 002_upgrade_enrollements_to_memberships.sql
│   ├── scripts
│   │   ├── delete_helper_functions.sql
│   │   ├── delete_policies.sql
│   │   ├── generate_content_policies.sql
│   │   ├── list_helper_functions.sql
│   │   └── list_policies.sql
│   ├── policies.sql
│   ├── schema.sql
│   └── views.sql
├── backend-legacy
│   ├── LogSheet.gs
│   ├── Testing.gs
│   ├── Tests.gs
│   ├── dashboard.gs
│   ├── dataConnect.gs
│   ├── dataConnectClasses.gs
│   ├── enums.gs
│   ├── importCards.gs
│   ├── index.html
│   ├── integrationTestWebapp.gs
│   ├── unitTestImportCards.gs
│   ├── unitTestUtils.gs
│   ├── unknownRequest.html
│   ├── utils.gs
│   └── webapp.gs
├── frontend
│   ├── public
│   │   ├── 404.html
│   │   ├── error.wav
│   │   ├── favicon.ico
│   │   ├── logo192.png
│   │   ├── logo512.png
│   │   ├── manifest.json
│   │   ├── robots.txt
│   │   ├── success-fanfare.mp3
│   │   ├── success.mp3
│   │   └── youdidit.gif
│   ├── src
│   │   ├── admin
│   │   │   ├── components
│   │   │   │   ├── AdminSidebar.tsx
│   │   │   │   ├── MediaPickerModal.tsx
│   │   │   │   ├── MediaThumbnail.tsx
│   │   │   │   ├── UnsavedChangesModal.tsx
│   │   │   │   └── WorkspaceBreadcrumb.tsx
│   │   │   ├── hooks
│   │   │   │   └── useAdminData.ts
│   │   │   ├── pages
│   │   │   │   ├── content
│   │   │   │   │   ├── answers
│   │   │   │   │   │   ├── ImgMCAnswerEditor.tsx
│   │   │   │   │   │   ├── ImgSCAnswerEditor.tsx
│   │   │   │   │   │   ├── MCAnswerEditor.tsx
│   │   │   │   │   │   └── SCAnswerEditor.tsx
│   │   │   │   │   ├── tabs
│   │   │   │   │   │   ├── AnswersTab.tsx
│   │   │   │   │   │   ├── BasicInfoTab.tsx
│   │   │   │   │   │   └── CardModesTab.tsx
│   │   │   │   │   ├── CardEditorNav.tsx
│   │   │   │   │   ├── CardEditorPanel.tsx
│   │   │   │   │   ├── CardListPanel.tsx
│   │   │   │   │   ├── CardListRow.tsx
│   │   │   │   │   ├── CardListToolbar.tsx
│   │   │   │   │   ├── ContentPage.tsx
│   │   │   │   │   └── LessonWorkspace.tsx
│   │   │   │   ├── media
│   │   │   │   │   └── MediaPage.tsx
│   │   │   │   └── users
│   │   │   │       └── UsersPage.tsx
│   │   │   ├── stores
│   │   │   │   └── lessonStore.ts
│   │   │   ├── types
│   │   │   │   └── admin.types.ts
│   │   │   ├── AdminApp.tsx
│   │   │   └── AdminLayout.tsx
│   │   ├── components
│   │   │   ├── AudioControl.tsx
│   │   │   ├── AvatarMenu.tsx
│   │   │   ├── Body.tsx
│   │   │   ├── CardList.tsx
│   │   │   ├── CourseSelector.tsx
│   │   │   ├── Hdr.tsx
│   │   │   ├── LearnSession.tsx
│   │   │   ├── LoginModal.tsx
│   │   │   ├── Question.tsx
│   │   │   └── QuestionAuto.tsx
│   │   ├── contexts
│   │   │   └── AuthContext.tsx
│   │   ├── hooks
│   │   │   ├── useFetchDocs.ts
│   │   │   ├── useFetchSessionData.ts
│   │   │   └── util.ts
│   │   ├── lib
│   │   │   └── supabase.js
│   │   ├── shared
│   │   │   ├── config.ts
│   │   │   └── types.d.ts
│   │   ├── App.css
│   │   ├── App.tsx
│   │   ├── index.css
│   │   ├── logo.svg
│   │   ├── main.tsx
│   │   ├── setupTests.ts
│   │   └── vite-env.d.ts
│   ├── index.html
│   ├── package-lock.json
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── CLAUDE.md
├── README.md
├── filestructure.md
├── package-lock.json
└── package.json

