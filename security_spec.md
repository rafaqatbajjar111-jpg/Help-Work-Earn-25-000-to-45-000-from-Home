# Security Specification for Help Work

## Data Invariants
1. An application must have a unique `appId`.
2. Applications can be created by anyone (for registration) but read only by the owner or admin.
3. Status can only be changed by an admin.
4. Settings can only be modified by an admin.

## The Dirty Dozen Payloads
1. Create application with someone else's UID (if we used UID, but here it's public registration).
2. Update application status from 'pending' to 'approved' by a non-admin.
3. Update UPI ID in settings by a non-admin.
4. Delete applications by a non-admin.
5. Create application with a 1MB string in `name`.
6. Create application with negative `amount`.
7. Update `createdAt` timestamp.
8. Read all applications by a guest.
9. Inject non-whitelisted field in application doc.
10. Spoof admin email.
11. Update application `utr` after it's approved.
12. Create application without required `mobile` field.

## The Test Runner
(I'll focus on the rules first as per the Eight Pillars).
