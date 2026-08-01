# APIForge Features

APIForge is a visual API design and governance platform for creating, reviewing, validating, and maintaining OpenAPI 3.1 documents without requiring teams to hand-author large YAML or JSON files.

It combines a structured design environment with live OpenAPI generation, reusable components, validation, version-control integration, mocking, collaboration, and governance controls.

---

## Visual OpenAPI Design

APIForge provides a guided interface for designing REST APIs while continuously compiling the design into a standards-compliant OpenAPI document.

### Endpoint Design

Create and manage API operations through a visual editor.

- Define resource paths and HTTP methods.
- Configure path, query, header, and cookie parameters.
- Define request bodies and supported media types.
- Configure response codes, headers, descriptions, and payload schemas.
- Add operation summaries, descriptions, tags, and operation identifiers.
- Define deprecated operations and other OpenAPI metadata.

### Live OpenAPI Compilation

APIForge continuously converts the visual design into OpenAPI 3.1.

- View generated YAML or JSON while editing.
- Detect invalid or incomplete definitions early.
- Keep visual changes and document output synchronized.
- Export a clean OpenAPI document without editor-only metadata when required.

### Import and Export

APIForge supports existing and newly created API descriptions.

- Import OpenAPI YAML and JSON documents.
- Preserve supported document structure during import.
- Export generated specifications as YAML or JSON.
- Select character encoding and line-ending preferences.
- Produce source-controlled artifacts for downstream tooling.

---

## Reusable API Components

Reusable definitions reduce duplication and improve consistency across an API.

### Schemas

Create reusable data models for requests and responses.

- Define objects, arrays, strings, numbers, integers, and Boolean values.
- Configure required and optional properties.
- Add examples, descriptions, formats, constraints, and nullable behavior.
- Reference schemas from multiple operations.
- Compose schemas using supported OpenAPI composition constructs.

### Parameters and Headers

Define common parameters and headers once and reuse them across operations.

- Standardize pagination, filtering, sorting, correlation, and version headers.
- Reduce inconsistencies across endpoints.
- Apply shared definitions where appropriate.

### Responses

Create reusable response definitions for common outcomes.

- Standard success responses.
- Validation errors.
- Authentication and authorization failures.
- Rate-limit responses.
- RFC 7807 problem details.

---

## Security Scheme Design

APIForge provides visual configuration for OpenAPI security schemes.

Supported patterns include:

- HTTP Basic authentication
- Bearer tokens
- JWT bearer tokens
- API keys in headers, query parameters, or cookies
- OAuth 2.0 flows
- OpenID Connect

Security schemes can be defined once and applied globally or to individual operations.

---

## Validation and Diagnostics

APIForge validates the design as it is created and reports actionable diagnostics.

### Structural Validation

- Required OpenAPI fields
- Invalid references
- Duplicate paths or operation identifiers
- Unsupported combinations
- Malformed schemas
- Invalid parameter placement
- Incomplete response definitions

### Governance Validation

Higher plans can apply additional engineering and organizational rules.

- Naming conventions
- Required descriptions
- Approved response formats
- Versioning requirements
- Security requirements
- Pagination standards
- Media-type rules
- Required headers
- Custom validation policies

Diagnostics are intended to identify both specification errors and architectural drift before an API reaches implementation or review.

---

## Project Management

APIForge organizes API documents as projects.

- Create new API projects.
- Import existing specifications.
- Reopen recent projects.
- Save project metadata and document state.
- Configure project titles, versions, servers, contact information, licensing, and external documentation.
- Maintain project-level preferences.

Cloud project capacity, history retention, and project limits depend on the selected plan.

---

## Version Control Integration

APIForge can connect API design work to source-control workflows.

Depending on the plan, integrations may include:

- GitHub
- GitLab
- Bitbucket

Version-control capabilities are designed to support:

- Importing specifications from repositories
- Saving generated OpenAPI documents
- Maintaining API definitions alongside implementation code
- Reviewing changes through normal pull-request workflows
- Reducing differences between design artifacts and deployed services

---

## IronGate Mock-Server Integration

APIForge integrates with IronGate to turn OpenAPI definitions into executable mock APIs.

This supports:

- Frontend development before backend completion
- Contract testing
- Demonstrations and stakeholder reviews
- Example response generation
- Early validation of API paths, parameters, and payload structures

Available capabilities and usage limits depend on the selected plan.

---

## AI Plugin

AI capabilities are provided through an optional plugin available with the Pro plan.

The AI plugin is intended to assist with tasks such as:

- Drafting operation descriptions
- Suggesting schemas and examples
- Reviewing API consistency
- Identifying missing responses or metadata
- Explaining validation findings
- Suggesting governance improvements
- Assisting with documentation and naming

AI-generated output remains subject to user review. APIForge does not treat generated content as authoritative without validation and approval.

---

## Team Collaboration

Business plans add workspace and team-management capabilities around the same core API design and governance functionality available to advanced individual users.

### Shared Workspaces

- Centralize API projects for a team or organization.
- Share ownership of specifications.
- Transfer projects between authorized users.
- Maintain shared integrations and settings.

### Roles and Permissions

Business workspaces can assign roles such as:

- Owner
- Administrator
- Editor
- Viewer

Roles control access to projects, settings, integrations, billing, and administrative functions.

### Central Administration

- Team-member management
- Central billing
- Workspace-level governance settings
- Shared version-control connections
- Team activity history
- Project transfer and ownership controls

---

## Enterprise Controls

Enterprise plans extend Business capabilities for organizations with advanced identity, security, compliance, deployment, and support requirements.

Available Enterprise capabilities may include:

- SAML or OpenID Connect single sign-on
- SCIM user provisioning
- Custom workspace roles
- Organization-wide policy management
- Custom governance rules
- Configurable audit-log retention
- Dedicated tenant or database options
- Private-cloud or on-premises deployment
- Data-residency options
- Custom backup and recovery requirements
- Contractual service-level agreements
- Dedicated support contacts
- Security and compliance documentation
- Custom integrations
- Volume licensing and invoicing

Enterprise capabilities are scoped through the sales and implementation process.

---

## User Preferences

APIForge supports user-level preferences for the design environment.

Examples include:

- Light, dark, or system theme
- Editor color preferences
- Syntax highlighting
- Line numbers
- YAML and JSON display preferences
- Character encoding
- Line endings
- Notification preferences
- Profile and avatar settings
- Cookie preferences

Preferences are stored separately from API project content where appropriate.

---

## API Versioning Support

APIForge supports API version metadata without requiring URI-based versioning.

Projects can define and document versioning approaches such as:

- `X-API-Version` request headers
- Representation versioning through `Accept`
- Supported-version discovery
- Default API versions
- Operation-specific version availability

The generated OpenAPI document can describe the chosen strategy consistently across endpoints.

---

## Standards-Based Output

APIForge is designed around interoperable standards rather than proprietary runtime formats.

Primary outputs include:

- OpenAPI 3.1 YAML
- OpenAPI 3.1 JSON
- Standard JSON Schema constructs supported by OpenAPI
- RFC 7807-compatible error definitions

APIForge-specific design metadata uses extension fields where needed and can be excluded from clean exports.

---

## Plan Availability

Feature availability, usage limits, storage limits, project history, integrations, collaboration controls, and support levels vary by plan.

The current pricing and plan comparison page is the authoritative source for plan-specific availability.
