rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // ── Helpers ──────────────────────────────────────────────────────────
    function isAuthenticated() {
      return request.auth != null;
    }
    function isOwner(uid) {
      return request.auth.uid == uid;
    }
    function isAdmin() {
      return isAuthenticated() &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    function validProfileFields() {
      let allowed = ['displayName', 'username', 'email', 'createdAt', 'updatedAt',
                     'role', 'status', 'deletedAt'];
      return request.resource.data.keys().hasOnly(allowed);
    }
    function validNovelFields() {
      let allowed = ['name', 'url', 'extracted', 'printed', 'createdAt', 'updatedAt'];
      return request.resource.data.keys().hasOnly(allowed);
    }
    function validReportFields() {
      let allowed = ['uid', 'userEmail', 'userName', 'taskName', 'taskDesc',
                     'startTime', 'endTime', 'durationMs', 'activityLog',
                     'notes', 'submittedAt'];
      return request.resource.data.keys().hasOnly(allowed);
    }
    function validAdminAnnotationFields() {
      // Fields only an admin may write/update on a report
      let allowed = ['adminStatus', 'adminStatusAt', 'adminStatusBy', 'adminComments'];
      return request.resource.data.diff(resource.data).affectedKeys().hasOnly(allowed);
    }

    // ── Default deny ─────────────────────────────────────────────────────
    match /{document=**} {
      allow read, write: if false;
    }

    // ── User profiles ─────────────────────────────────────────────────────
    match /users/{uid} {
      allow read:   if isAuthenticated() && (isOwner(uid) || isAdmin());
      allow list:   if isAdmin();
      allow create: if isAuthenticated() && isOwner(uid) && validProfileFields();
      allow update: if isAuthenticated() && (isOwner(uid) || isAdmin()) && validProfileFields();
      allow delete: if false;

      match /novels/{novelId} {
        allow read:   if isAuthenticated() && isOwner(uid);
        allow create: if isAuthenticated() && isOwner(uid) && validNovelFields();
        allow update: if isAuthenticated() && isOwner(uid) && validNovelFields();
        allow delete: if isAuthenticated() && isOwner(uid);
      }
    }

    // ── Reports ──────────────────────────────────────────────────────────
    // /reports/{reportId}
    match /reports/{reportId} {
      // Any authenticated user can create a report (must own the uid field)
      allow create: if isAuthenticated()
                    && request.resource.data.uid == request.auth.uid
                    && validReportFields();

      // Owner can read their own reports
      allow read:   if isAuthenticated() && resource.data.uid == request.auth.uid;

      // Admin can read and list ALL reports
      allow read:   if isAdmin();
      allow list:   if isAdmin();

      // Admin can update only the annotation fields (status, comments) — report body is immutable
      allow update: if isAdmin() && validAdminAnnotationFields();

      // Owner can delete their own report; admin can delete any
      allow delete: if isAuthenticated() &&
                    (resource.data.uid == request.auth.uid || isAdmin());

      // Non-admin updates are forbidden (reports are immutable once submitted)
      // (admin update rule above covers the admin case)
    }
  }
}
