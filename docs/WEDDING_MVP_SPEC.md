# GetLaunch PH Wedding Invitation MVP

Status: approved working scope for the first paid release. Commercial and privacy policies must receive legal review before public launch.

## Product

GetLaunch PH sells one hosted wedding invitation website for a one-time price of **₱799**, inclusive of platform fees shown to the customer. Customers may create and preview a draft for free; payment is required to publish it.

The first release includes:

- One wedding invitation project per purchase.
- The Evergreen Vows design.
- Separate first, optional middle, and last names for both partners.
- Wedding date, venue, and a short story/message.
- Responsive preview for phones and computers.
- Autosaved editing across signed-in sessions.
- One public `launchph.ph` invitation URL.
- Publish, update, and unpublish controls.
- Private guest invitation links with party-size limits.
- Guest accept/decline responses and an owner RSVP dashboard.
- HTTPS, authenticated editing, ownership checks, and basic support.

## Explicitly outside the first paid release

- Guest photo uploads or galleries.
- Password-protected invitations.
- Enhanced Security Package.
- Custom domains.
- Maps, QR codes, email invitations, and analytics.
- Additional wedding templates.
- Job Application Bundle, portfolio, and automated business-site purchases.
- Automated template importing.

These features may remain visible only when clearly marked as preview or coming later. They must not be included in checkout promises.

## Customer journey

1. The visitor opens the landing page and sees the ₱799 wedding invitation offer.
2. The visitor creates or signs into an account.
3. The customer creates a free wedding draft using Evergreen Vows.
4. The editor saves the partner names, wedding date, venue, and story.
5. The customer previews the invitation on mobile and desktop.
6. When the customer chooses Publish, GetLaunch PH requests payment if the project has no entitlement.
7. GetLaunch PH creates a pending order using the server-side price.
8. The payment provider collects payment.
9. A verified webhook marks the order paid and grants one publishing entitlement.
10. The customer publishes an immutable revision to a unique GetLaunch PH URL.
11. Later edits create a new revision; the public URL changes only after Publish is selected again.
12. The customer creates private guest links and tracks accept, decline, and pending responses in the RSVP dashboard.
13. The customer can unpublish the invitation or contact support from the dashboard.

## Commercial and support rules

- Price: ₱799 PHP, one-time, for one published invitation project.
- Cancellation: there is no recurring subscription; the owner may unpublish at any time.
- Refund proposal: full refund before the first successful publish or within seven calendar days of purchase, whichever occurs first. Service failures are reviewed by support. This rule requires legal review before launch.
- Support channel: the authenticated support form and the published support email address.
- Initial support target: acknowledge customer requests within two business days.
- Hosting proposal: the public invitation remains available until 30 days after the wedding date unless the customer unpublishes it sooner.
- Project retention proposal: keep editable project data for 90 days after the wedding date, send a deletion warning, then delete or anonymize it according to the final privacy policy.
- Payment, invoice, fraud-prevention, and audit records may be retained longer when legally required.

## Acceptance criteria

- A new user can verify an email, sign in, and create a wedding draft.
- Refreshing or changing browsers does not lose saved content.
- Another user cannot read or change the project by guessing its ID.
- An unpaid project cannot be published.
- A verified ₱799 test payment grants exactly one entitlement.
- A failed, forged, mismatched, or replayed payment grants no additional entitlement.
- Publishing creates a real public URL containing the selected revision.
- Unpublishing removes public access.
- Mobile and desktop previews match the published invitation.
- Private guest links cannot be guessed from guest or project identifiers.
- Guests can accept or decline within their allowed party size, and the owner sees the response in the RSVP dashboard.
- The customer receives purchase and publication confirmations.
- Support can trace the user, order, payment event, entitlement, project, and published revision.

## Launch success definition

The MVP is ready for invited customers when a person with no developer assistance can register, create and recover a saved invitation, pay ₱799 in the provider's test environment, publish it, open it on another device, update it, and unpublish it—and support can diagnose every step from logs.

