# About APIForge

APIForge is a visual API design and governance platform for creating, reviewing, and maintaining OpenAPI 3.1 documents without requiring teams to work directly in YAML or JSON.

It is designed for software engineers, API architects, technical leads, platform teams, and organizations that need a more structured way to define REST APIs, enforce standards, and keep API contracts aligned with implementation and delivery workflows.

## What APIForge Does

APIForge turns API design into a guided visual workflow.

Instead of manually editing large specification files, users can define endpoints, operations, parameters, request bodies, responses, schemas, security requirements, and metadata through focused editors. APIForge compiles those decisions into a standards-compliant OpenAPI document that can be validated, reviewed, exported, and used across the software delivery lifecycle.

The platform is intended to support both individual API development and governed team environments.

## Why APIForge Exists

OpenAPI is a powerful standard, but maintaining large API specifications by hand can become difficult as systems grow.

Common problems include:

- inconsistent naming and structure
- duplicated schemas and responses
- invalid references
- incomplete error definitions
- versioning drift
- undocumented security requirements
- changes that are difficult to review
- specifications that no longer match implementation

APIForge addresses these problems by making structure, validation, and governance part of the design process rather than an after-the-fact review step.

## Visual API Design

APIForge provides a structured interface for designing REST APIs, including:

- API metadata and project settings
- paths and HTTP operations
- path, query, header, and cookie parameters
- request bodies and media types
- success and error responses
- reusable schemas and examples
- authentication and security schemes
- server definitions and external documentation
- API versioning metadata

The resulting specification remains portable and standards based. APIForge does not replace OpenAPI; it provides a more controlled way to create and manage it.

## Validation and Governance

APIForge validates API definitions while they are being designed.

Validation can include:

- OpenAPI structural validation
- required-field checks
- reference validation
- duplicate operation detection
- naming consistency
- response completeness
- security requirements
- versioning rules
- organization-specific governance policies

Higher service levels may include advanced governance, custom rules, automation, and organization-wide controls.

## Import and Export

Existing OpenAPI documents can be imported into APIForge for review and continued development.

Projects can be exported as OpenAPI 3.1 documents in YAML or JSON format. This allows generated specifications to be used with documentation tools, code generators, mock servers, test frameworks, API gateways, and other standards-compatible systems.

## Version Control Integration

APIForge is designed to work with source-control workflows.

Depending on the selected plan, integrations may include:

- GitHub
- GitLab
- Bitbucket

These integrations allow API definitions to participate in normal branching, review, release, and audit processes.

## IronGate Integration

APIForge is designed to integrate with IronGate, a companion mock-server and API simulation platform.

An API designed in APIForge can be used to generate mock endpoints for frontend development, integration testing, contract validation, and early stakeholder review before production services are complete.

## AI Plugin

AI capabilities are provided through an optional plugin available at the Pro level.

The AI plugin may assist with tasks such as:

- drafting endpoint descriptions
- suggesting schema fields
- generating examples
- reviewing naming consistency
- identifying missing responses
- explaining validation findings
- assisting with API documentation

AI remains an optional extension rather than a requirement for using APIForge.

## Personal Plans

APIForge personal plans are intended for individual developers and architects.

### Free

For learning APIForge and building smaller API projects.

### Plus

For individual developers working on production APIs who need larger project limits, version-control integration, project history, and expanded governance capabilities.

### Pro

For advanced API design, governance, automation, and optional AI-assisted workflows.

## Business Plans

APIForge business plans are intended for teams and organizations.

### Business

Includes shared workspaces, team project ownership, role-based access, centralized billing, workspace administration, and team activity tracking.

### Enterprise

Adds enterprise identity, security, compliance, deployment, support, and contractual capabilities. Enterprise options may include SSO, SCIM, dedicated infrastructure, private deployment, custom retention policies, data residency, and service-level agreements.

## Security and Data Ownership

APIForge is designed so that customers retain ownership of their API definitions and project data.

Security controls may include:

- OAuth-based authentication
- role-based authorization
- workspace isolation
- audit logging
- encrypted transport
- controlled integration access
- configurable retention
- enterprise identity integration

Specific controls depend on deployment model and service plan.

## Standards and Portability

APIForge is built around open standards and portable artifacts.

The primary output is an OpenAPI document that can be used independently of APIForge. Customers are not required to keep their API contracts in a proprietary format to use them elsewhere.

## Product Direction

APIForge is being developed as a broader API lifecycle platform that connects design, governance, mocking, testing, source control, and delivery workflows.

Planned and evolving capabilities include:

- expanded project collaboration
- additional version-control providers
- deeper governance automation
- policy-driven validation
- richer mock-server integration
- release and change tracking
- organization-wide API standards
- enterprise deployment options

## Our Goal

APIForge is intended to make API design easier to understand, easier to review, and harder to get wrong.

The goal is not merely to generate an OpenAPI file. The goal is to help teams create API contracts that are consistent, maintainable, reviewable, testable, and ready to support real software delivery.
