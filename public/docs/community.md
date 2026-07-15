# APIForge Community Guidelines

**Effective Date:** [Insert Effective Date]  
**Last Updated:** [Insert Last Updated Date]  
**Product:** APIForge  
**Owner:** [Insert Company Legal Name]  
**Website:** [Insert Website URL]  
**Contact:** [Insert Community or Support Email]

---

## 1. Purpose

APIForge exists to help developers, architects, product teams, and organizations design, document, govern, and maintain REST APIs using OpenAPI as the source artifact. The APIForge community exists to support that goal through respectful collaboration, practical technical discussion, shared learning, feedback, examples, templates, extensions, and responsible product improvement.

These Community Guidelines define the standards for participation in APIForge community spaces, including forums, GitHub repositories, issue trackers, discussions, documentation comments, chat channels, community calls, beta programs, template exchanges, integration discussions, and any other APIForge-managed or APIForge-sponsored community venue.

The goal is not to make every discussion formal or sterile. Good engineering communities need disagreement, critique, trade-off analysis, and direct technical feedback. However, those discussions must remain professional, constructive, and focused on improving the work.

---

## 2. Scope

These guidelines apply to participation in any official or semi-official APIForge community space, including but not limited to:

- APIForge community forums
- APIForge GitHub repositories
- APIForge issue trackers
- APIForge pull requests
- APIForge documentation feedback channels
- APIForge Discord, Slack, or similar community chat spaces
- APIForge beta programs
- APIForge user research programs
- APIForge public roadmap discussions
- APIForge template, example, or extension repositories
- APIForge webinars, livestreams, office hours, and community events
- APIForge marketplace or future extension-sharing spaces

These guidelines also apply when a participant represents APIForge community activity in a way that reasonably affects the APIForge community, other participants, or the APIForge product ecosystem.

---

## 3. Relationship to Other APIForge Policies

These Community Guidelines should be read together with the APIForge Terms of Service, Privacy Policy, Security Policy, Acceptable Use rules, and any additional program-specific terms that may apply.

If there is a conflict between these Community Guidelines and a legal agreement, the applicable legal agreement controls.

Community participation may be suspended, limited, or terminated if behavior violates these guidelines, the Terms of Service, applicable law, platform rules, or reasonable security expectations.

---

## 4. Core Community Principles

APIForge community participation is built around the following principles.

### 4.1 Be Respectful

Treat other participants as professionals. Assume people are here to learn, contribute, solve problems, and improve APIs. Disagreement is allowed. Personal attacks are not.

### 4.2 Be Constructive

Feedback should help improve the work. It is acceptable to say an API design is confusing, an OpenAPI pattern is brittle, or a proposed feature creates governance risk. It is not acceptable to insult the person who proposed it.

### 4.3 Be Specific

Good technical feedback is precise. When possible, explain what is wrong, why it matters, and what alternative you recommend.

Poor feedback:

```text
This is bad.
```

Better feedback:

```text
This operationId pattern may create collisions across nested resources. I recommend including the parent resource name when the child resource is not globally unique.
```

### 4.4 Be Honest About Uncertainty

API design involves trade-offs. If you are unsure, say so. If you are making an assumption, state it. If your recommendation depends on context, explain the context.

### 4.5 Protect Users and Systems

Do not share secrets, tokens, credentials, private API keys, production URLs, proprietary customer data, or sensitive implementation details in public community channels.

### 4.6 Improve the Ecosystem

APIForge is intended to improve API design, documentation, validation, governance, and maintainability. Contributions should support that direction.

---

## 5. Expected Behavior

Participants are expected to:

- Communicate professionally and respectfully.
- Keep discussions relevant to APIForge, OpenAPI, REST API design, API governance, integration workflows, developer experience, documentation, security, and related topics.
- Provide actionable technical feedback when reviewing ideas, issues, examples, or contributions.
- Use inclusive language and avoid hostile, demeaning, or exclusionary behavior.
- Respect different levels of experience.
- Avoid gatekeeping or dismissing questions as too basic.
- Clearly distinguish facts, opinions, assumptions, and preferences.
- Search existing issues or discussions before creating duplicates when practical.
- Use descriptive titles for issues, pull requests, and discussions.
- Provide enough context for others to reproduce or understand a problem.
- Credit others when referencing their ideas, examples, templates, or documentation.
- Respect APIForge maintainers' time and prioritization decisions.
- Report security issues privately through the approved security channel.
- Follow moderator guidance when asked to adjust behavior.

---

## 6. Unacceptable Behavior

The following behavior is not allowed in APIForge community spaces.

### 6.1 Harassment and Abuse

Harassment, intimidation, threats, stalking, bullying, sustained disruption, or abusive language are not permitted.

This includes behavior based on race, ethnicity, nationality, religion, age, sex, gender identity, sexual orientation, disability, veteran status, caste, socioeconomic background, or any other protected or personal characteristic.

### 6.2 Personal Attacks

Critique the work, not the person. Do not insult, ridicule, shame, or demean other participants.

Unacceptable examples include:

- Name-calling
- Mocking someone's skill level
- Attacking someone's employer, background, accent, writing style, or identity
- Accusing someone of bad faith without evidence
- Repeatedly targeting one participant after being asked to stop

### 6.3 Hate Speech and Discriminatory Content

Hate speech, slurs, extremist content, or dehumanizing language are not allowed.

### 6.4 Sexual Harassment and Explicit Content

Sexual harassment, unwanted sexual attention, sexually explicit content, or inappropriate sexualized comments are not allowed.

### 6.5 Doxxing and Privacy Violations

Do not publish or threaten to publish private information about another person or organization.

This includes:

- Personal addresses
- Personal phone numbers
- Private email addresses
- Private employment details
- Private account identifiers
- Non-public customer information
- Private messages without consent

### 6.6 Security Misconduct

Do not use community spaces to request, provide, or encourage unauthorized access, credential theft, exploit chaining, evasion, data exfiltration, or misuse of APIForge or third-party systems.

Security research must be handled responsibly and reported through the appropriate security process.

### 6.7 Sharing Secrets or Sensitive Data

Do not post live credentials, API tokens, OAuth client secrets, refresh tokens, private keys, production database connection strings, session cookies, customer records, or confidential business data.

If you accidentally share sensitive information, delete it immediately if possible and notify APIForge support or security.

### 6.8 Spam and Self-Promotion

Do not use APIForge community spaces primarily for advertising, lead generation, recruiting, unrelated product promotion, affiliate links, or repetitive promotional content.

Relevant tools, libraries, articles, or services may be shared when they directly answer a question or contribute to a technical discussion. Promotional intent should be disclosed.

### 6.9 Misinformation and Misrepresentation

Do not knowingly provide false information, impersonate another person or organization, misrepresent your affiliation with APIForge, or falsely claim endorsement by APIForge.

### 6.10 Disruptive Conduct

Do not repeatedly derail discussions, post duplicate issues after closure, ignore moderator guidance, flood channels, or reopen resolved disputes without new information.

### 6.11 Legal or Compliance Abuse

Do not use community channels to request help with illegal activity, regulatory evasion, fraud, copyright infringement, license circumvention, or misuse of third-party systems.

---

## 7. Technical Discussion Standards

APIForge community spaces are expected to support serious technical discussion. Strong opinions are acceptable when they are tied to reasoning.

Good technical discussion usually includes:

- The problem being solved
- The affected users or systems
- The OpenAPI or REST pattern involved
- The trade-offs
- The proposed alternative
- The operational consequence
- The compatibility concern, if any
- The migration impact, if any

Example of useful critique:

```text
I would avoid placing editor-only behavior in standard OpenAPI fields. Use x-apiforge instead. Otherwise clean exports may leak implementation-specific metadata into partner-facing specifications.
```

Example of poor critique:

```text
Nobody who understands APIs would do this.
```

APIForge encourages direct engineering judgment, but not contempt.

---

## 8. Issue Reporting Guidelines

When reporting a bug, include as much of the following as possible:

- APIForge version or environment
- Browser, operating system, or runtime version
- Whether the issue occurs in the web app, CLI, API, import process, export process, or integration
- Steps to reproduce
- Expected result
- Actual result
- Relevant OpenAPI version, such as 3.0.x or 3.1.x
- Minimal OpenAPI snippet that reproduces the issue
- Screenshots or logs, if safe to share
- Whether the issue affects clean export, full APIForge export, validation, rendering, generation, or collaboration

Do not include secrets, private customer data, production tokens, or proprietary API definitions unless you are using an approved private support channel.

---

## 9. Feature Request Guidelines

When proposing a feature, explain:

- The user problem
- The workflow affected
- Why current behavior is insufficient
- The proposed behavior
- Whether it affects OpenAPI output
- Whether it belongs in standard OpenAPI fields or `x-apiforge` metadata
- Whether it should appear in clean exports
- Any compatibility concerns with OpenAPI tooling
- Any security, privacy, or governance implications

Feature requests are stronger when they describe a real workflow rather than only a desired control or screen element.

Weak feature request:

```text
Add more buttons to the endpoint editor.
```

Stronger feature request:

```text
When editing a PATCH operation, APIForge should help distinguish partial update schemas from full replacement schemas. This would reduce confusion between PUT and PATCH and improve generated operation descriptions.
```

---

## 10. Pull Request and Contribution Guidelines

APIForge may accept community contributions in certain repositories or programs. Contribution rules may vary by repository.

Unless a repository-specific contribution guide says otherwise, contributors should:

- Keep pull requests focused.
- Explain the problem and solution clearly.
- Reference related issues when applicable.
- Include tests when changing behavior.
- Update documentation when changing user-facing behavior.
- Avoid unrelated formatting churn.
- Avoid committing generated files unless requested.
- Follow existing style, naming, and architectural conventions.
- Use clear commit messages.
- Respect maintainer feedback.

Maintainers may close pull requests that are stale, out of scope, duplicative, unsafe, incomplete, or inconsistent with product direction.

A closed pull request is not a personal rejection. It may simply mean the change does not fit the current architecture, roadmap, or maintenance capacity.

---

## 11. OpenAPI Examples and Shared Files

Participants may share OpenAPI examples, schema fragments, templates, and API design patterns for discussion.

Before sharing, remove or anonymize:

- Real customer names
- Internal hostnames
- Private base URLs
- Access tokens
- API keys
- OAuth credentials
- Internal operation names that expose confidential systems
- Proprietary schemas
- Regulated personal data
- Production examples containing real records

When sharing OpenAPI files, clearly state whether the example is:

- A minimal reproduction
- A simplified example
- A production-derived anonymized example
- A proposed design
- A public API definition
- A template
- A test case

---

## 12. APIForge Metadata and Vendor Extensions

APIForge may use OpenAPI Specification Extensions, including fields such as `x-apiforge`, to preserve editor state, workflow metadata, internal notes, layout settings, governance hints, and round-trip information.

When discussing or sharing APIForge-generated files, participants should distinguish between:

- Standard OpenAPI contract fields
- APIForge-specific extension metadata
- Internal notes or workflow state
- Clean export output
- Full APIForge round-trip export output

Do not assume that data stored in `x-apiforge` is intended for public disclosure. Some extension metadata may be editor-only, internal, or organization-specific.

---

## 13. Security Reporting

Do not publicly disclose suspected security vulnerabilities in APIForge, APIForge infrastructure, APIForge integrations, or APIForge-managed services before APIForge has had a reasonable opportunity to investigate and remediate.

Security issues should be reported to:

```text
[Insert Security Contact Email]
```

A good security report should include:

- A clear description of the issue
- Steps to reproduce
- Potential impact
- Affected component
- Proof-of-concept details, if safe to provide
- Whether any data was accessed
- Whether the issue is actively exploitable
- Your contact information for follow-up

Do not access, modify, delete, or exfiltrate data that does not belong to you. Do not perform testing that degrades service availability or affects other users.

---

## 14. Privacy Expectations

Respect the privacy of other participants.

Do not share private messages, support responses, screenshots, emails, or recordings without permission from the people involved, unless disclosure is legally required or necessary to report abuse or security concerns to APIForge.

Community discussions may be visible to other participants, moderators, maintainers, APIForge personnel, or the public depending on the platform. Do not post anything you are not authorized to share.

APIForge may retain community content and moderation records as described in its Privacy Policy and applicable platform rules.

---

## 15. Community Support Boundaries

APIForge community spaces may provide peer support, product guidance, examples, and general technical discussion. They are not a guaranteed support channel unless explicitly identified as such.

Community participants should not expect other users, maintainers, or APIForge employees to provide immediate responses, custom implementation work, emergency debugging, legal advice, compliance certification, security approval, or architecture sign-off.

For account-specific, billing, security, contractual, or private support issues, use the appropriate official APIForge support channel.

---

## 16. Moderation

APIForge may moderate community spaces to protect participants, maintain technical quality, reduce abuse, and enforce these guidelines.

Moderation actions may include:

- Asking a participant to revise language
- Moving a discussion to a better channel
- Editing or removing content
- Locking a thread
- Closing an issue or discussion
- Marking content as off-topic
- Temporarily muting a participant
- Suspending community access
- Removing a participant from a program or event
- Escalating severe issues to platform providers or legal authorities when appropriate

Moderation decisions are based on context, severity, pattern of behavior, risk to others, and impact on the community.

APIForge is not obligated to host every discussion, argument, complaint, feature demand, or dispute indefinitely.

---

## 17. Enforcement Process

APIForge may use the following general enforcement approach, depending on severity.

### 17.1 Informal Correction

For minor issues, a moderator may ask the participant to adjust tone, clarify a statement, move the discussion, or stop a behavior.

### 17.2 Warning

For more serious or repeated issues, APIForge may issue a warning explaining the behavior that violated the guidelines and what must change.

### 17.3 Temporary Restriction

APIForge may temporarily restrict participation when behavior disrupts the community, creates risk, or continues after a warning.

### 17.4 Permanent Removal

APIForge may permanently remove a participant for severe misconduct, repeated violations, harassment, threats, security abuse, illegal activity, or conduct that materially harms the community.

### 17.5 Immediate Action

APIForge may take immediate action without prior warning when necessary to protect people, systems, data, infrastructure, or community integrity.

---

## 18. Reporting Community Problems

Participants are encouraged to report guideline violations, harassment, abuse, security concerns, privacy concerns, spam, or disruptive behavior.

Reports may be sent to:

```text
[Insert Community Moderation Email]
```

A useful report should include:

- The community space involved
- A link to the relevant discussion, issue, message, or event if available
- A description of what happened
- Names or usernames involved, if known
- Screenshots or logs, if appropriate and safe to share
- Whether immediate action may be needed

APIForge will review reports in context. APIForge may not disclose the full outcome of a report due to privacy, security, or legal considerations.

---

## 19. Appeals

If a participant believes a moderation or enforcement decision was made in error, they may request review by contacting:

```text
[Insert Appeals or Community Contact Email]
```

Appeals should include:

- The decision being appealed
- Why the participant believes the decision was incorrect or disproportionate
- Any relevant context not previously considered
- A commitment to follow the guidelines going forward, where applicable

APIForge may deny appeals that are abusive, repetitive, made in bad faith, or unsupported by new information.

---

## 20. Maintainer Expectations

APIForge maintainers, moderators, employees, and designated community leaders are expected to follow these guidelines and model constructive behavior.

Maintainers should:

- Communicate decisions clearly when practical.
- Avoid unnecessary hostility or sarcasm.
- Distinguish product direction from personal preference.
- Explain rejected proposals when reasonable.
- Protect private information.
- Escalate security issues appropriately.
- Avoid using authority to win technical arguments unfairly.
- Apply guidelines consistently and proportionately.

Maintainers are also allowed to set boundaries, close unproductive discussions, decline work, and protect project scope.

---

## 21. Product Feedback and Criticism

APIForge welcomes criticism. Product criticism is important, especially for a tool intended to support serious API design and governance workflows.

Acceptable criticism includes:

- Identifying confusing workflows
- Challenging design decisions
- Reporting poor generated OpenAPI output
- Pointing out compatibility issues
- Questioning security or privacy implications
- Arguing that a feature adds complexity without enough value
- Recommending different governance defaults

Unacceptable criticism includes:

- Personal attacks
- Harassment
- Threats
- Abuse toward maintainers or users
- Repeatedly posting the same complaint after a decision has been made
- Misrepresenting facts after correction

A strong community can be critical without being hostile.

---

## 22. Public Roadmap and Beta Programs

APIForge may offer public roadmap discussions, previews, early access, or beta programs.

Participation in these programs may involve unfinished, experimental, unstable, or changing features.

Participants should not rely on beta features for production workflows unless APIForge explicitly states that the feature is production-ready.

Participants may be asked to provide feedback, report bugs, test workflows, or validate design assumptions.

APIForge may change, remove, delay, or decline roadmap items at its discretion.

---

## 23. Community Content License

Unless otherwise stated in a separate contribution agreement, repository license, or program-specific agreement, participants retain ownership of content they submit to APIForge community spaces.

By submitting content to APIForge community spaces, participants grant APIForge a non-exclusive, worldwide, royalty-free license to use, reproduce, display, modify, and distribute the content for purposes related to operating, improving, documenting, supporting, and promoting APIForge and its community.

This may include using submitted examples, feedback, issue reports, suggestions, or discussions to improve APIForge features, documentation, templates, validation rules, or educational materials.

Do not submit content that you do not have the right to share.

---

## 24. Contribution Ownership and Intellectual Property

If APIForge accepts code, documentation, templates, schemas, examples, or other contributions, additional contribution terms may apply.

Contributors are responsible for ensuring that their submissions do not violate employer policies, third-party licenses, confidentiality obligations, intellectual property rights, or contractual restrictions.

APIForge may require a Contributor License Agreement, Developer Certificate of Origin, repository-specific license acceptance, or other contribution process before accepting certain contributions.

---

## 25. Use of AI-Generated Content

Participants may use AI-assisted tools to help write examples, documentation, explanations, code, schemas, or OpenAPI fragments, unless a specific APIForge repository or program says otherwise.

Participants remain responsible for content they submit.

AI-generated content should be reviewed for:

- Technical correctness
- Security issues
- Licensing concerns
- Hallucinated standards or APIs
- Invalid OpenAPI syntax
- Incorrect schema behavior
- Exposure of confidential information
- Inaccurate claims about APIForge

Do not submit large volumes of unreviewed AI-generated content.

---

## 26. Language and Accessibility

APIForge community spaces primarily operate in English unless otherwise stated. Participants should make reasonable efforts to communicate clearly and avoid unnecessary ambiguity.

Participants should avoid mocking grammar, spelling, accents, translation issues, or language ability.

When possible, use accessible formatting:

- Descriptive links
- Clear headings
- Short paragraphs for complex issues
- Code fences for code and OpenAPI snippets
- Alt text or descriptions for important images
- Avoidance of unnecessary screenshots when text is more useful

---

## 27. Examples of Good Community Participation

Good participation includes:

```text
I reproduced this using OpenAPI 3.1.0. The issue appears when a schema uses oneOf with discriminator mapping and the export is converted to JSON.
```

```text
I disagree with storing this as a standard description field. This looks like editor workflow state and should probably live under x-apiforge so clean exports stay clean.
```

```text
This endpoint naming pattern may work for simple CRUD, but it gets ambiguous for nested resources. Could APIForge include the parent resource in the generated operationId when needed?
```

```text
I think this feature adds too much UI complexity for Phase 1. A simpler version might be to show the generated value, allow override, and defer advanced governance controls.
```

```text
I found a possible security issue. I will send details privately rather than posting them here.
```

---

## 28. Examples of Behavior That May Be Moderated

The following types of behavior may lead to moderation:

```text
This design is stupid and whoever made it should not be building API tools.
```

```text
Here is my production OAuth client secret. Can someone debug this?
```

```text
Use this exploit to bypass authentication on their API.
```

```text
I am reposting this issue every day until someone implements it.
```

```text
Everyone from that company is incompetent.
```

```text
I found a vulnerability and will publish the exploit tomorrow unless APIForge gives me a free enterprise account.
```

---

## 29. No Guarantee of Participation or Hosting

APIForge community access is a privilege, not an entitlement. APIForge may limit, suspend, or terminate access to community spaces where necessary to protect users, systems, maintainers, partners, or the quality of the community.

APIForge may remove content that is outdated, unsafe, duplicative, misleading, off-topic, legally problematic, or inconsistent with these guidelines.

---

## 30. Changes to These Guidelines

APIForge may update these Community Guidelines from time to time.

When changes are material, APIForge may provide notice through the website, product interface, repository, community platform, email, or other reasonable means.

Continued participation in APIForge community spaces after updates become effective means the participant agrees to follow the updated guidelines.

---

## 31. Contact

Questions about these Community Guidelines may be sent to:

```text
[Insert Community Contact Email]
```

Legal notices should be sent to:

```text
[Insert Legal Contact Email]
```

Security reports should be sent to:

```text
[Insert Security Contact Email]
```

---

## 32. Summary

APIForge is intended to support serious API design, OpenAPI authoring, governance, and collaboration. The community should reflect that purpose.

Be direct, but respectful.  
Be critical, but constructive.  
Be helpful, but honest.  
Protect private data.  
Report security issues responsibly.  
Improve the API ecosystem.

