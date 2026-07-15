// Auto-generated from uploads/api_policy.json — API governance policy (response codes, headers, method characteristics)
export const API_POLICY = {
  "$schema": "../schemas/api_policy.schema.json",
  "_header": {
    "file": "api_policy.json",
    "version": "1.1.0",
    "status": "production-ready",
    "description": "The canonical control plane for the API Governance and Execution Framework. Dictates execution pipeline, routing, and response behavior."
  },
  "execution": {
    "defaultPipeline": [
      "request-intake",
      "operation-resolution",
      "security-scheme-resolution",
      "authentication",
      "authorization",
      "request-header-validation",
      "request-parameter-validation",
      "request-body-schema-validation",
      "field-level-validation",
      "object-cross-field-validation",
      "business-resolver-validation",
      "operation-execution",
      "response-mapping",
      "response-header-enforcement",
      "error-application-code-mapping",
      "response-finalization"
    ],
    "overrides": {}
  },
  "authentication": {
    "secured": {
      "mandatory": [
        "401",
        "403"
      ],
      "prohibited": []
    },
    "public": {
      "mandatory": [],
      "prohibited": [
        "401",
        "403"
      ]
    }
  },
  "methods": {
    "GET": {
      "title": "GET",
      "category": "read",
      "characteristics": {
        "safe": true,
        "idempotent": true,
        "cacheable": true,
        "requestBody": false,
        "responseBody": true
      },
      "routingRules": {
        "requiresPayloadValidation": false,
        "supportsAsync": false
      },
      "responses": {
        "mandatory": [
          "200",
          "304",
          "404",
          "406",
          "408",
          "429",
          "500",
          "502",
          "503",
          "504"
        ],
        "typical": [
          "200",
          "304",
          "404",
          "406"
        ],
        "infrastructure": [
          "408",
          "429",
          "500",
          "502",
          "503",
          "504"
        ],
        "exclusive_success": [
          "200",
          "203",
          "206",
          "304"
        ]
      },
      "decisionLogic": "Retrieve a representation without side effects."
    },
    "POST": {
      "title": "POST",
      "category": "write",
      "characteristics": {
        "safe": false,
        "idempotent": false,
        "cacheable": false,
        "requestBody": true,
        "responseBody": true
      },
      "routingRules": {
        "requiresPayloadValidation": true,
        "supportsAsync": false
      },
      "responses": {
        "mandatory": [
          "201",
          "200",
          "202",
          "303",
          "409",
          "422",
          "400",
          "413",
          "415",
          "429",
          "500",
          "503"
        ],
        "typical": [
          "201",
          "200",
          "202",
          "303",
          "409",
          "422",
          "400",
          "413",
          "415"
        ],
        "infrastructure": [
          "429",
          "500",
          "503"
        ],
        "exclusive_success": [
          "200",
          "201",
          "202",
          "204"
        ]
      },
      "decisionLogic": "Create or submit a resource. Validate payload before processing."
    },
    "PUT": {
      "title": "PUT",
      "category": "write",
      "characteristics": {
        "safe": false,
        "idempotent": true,
        "cacheable": false,
        "requestBody": true,
        "responseBody": true
      },
      "routingRules": {
        "requiresPayloadValidation": true,
        "supportsAsync": false
      },
      "responses": {
        "mandatory": [
          "200",
          "204",
          "409",
          "422",
          "400",
          "412",
          "413",
          "415",
          "428",
          "429",
          "500",
          "503"
        ],
        "typical": [
          "200",
          "204",
          "409",
          "422",
          "400",
          "412",
          "413",
          "415",
          "428"
        ],
        "infrastructure": [
          "429",
          "500",
          "503"
        ],
        "exclusive_success": [
          "200",
          "202",
          "204"
        ]
      },
      "decisionLogic": "Replace a resource representation idempotently."
    },
    "PATCH": {
      "title": "PATCH",
      "category": "write",
      "characteristics": {
        "safe": false,
        "idempotent": false,
        "cacheable": false,
        "requestBody": true,
        "responseBody": true
      },
      "routingRules": {
        "requiresPayloadValidation": true,
        "supportsAsync": false
      },
      "responses": {
        "mandatory": [
          "200",
          "204",
          "409",
          "422",
          "400",
          "412",
          "415",
          "428",
          "429",
          "500",
          "503"
        ],
        "typical": [
          "200",
          "204",
          "409",
          "422",
          "400",
          "412",
          "415",
          "428"
        ],
        "infrastructure": [
          "429",
          "500",
          "503"
        ],
        "exclusive_success": [
          "200",
          "202",
          "204"
        ]
      },
      "decisionLogic": "Partially modify a resource."
    },
    "DELETE": {
      "title": "DELETE",
      "category": "write",
      "characteristics": {
        "safe": false,
        "idempotent": true,
        "cacheable": false,
        "requestBody": false,
        "responseBody": false
      },
      "routingRules": {
        "requiresPayloadValidation": false,
        "supportsAsync": false
      },
      "responses": {
        "mandatory": [
          "204",
          "200",
          "202",
          "404",
          "409",
          "429",
          "500",
          "503"
        ],
        "typical": [
          "204",
          "200",
          "202",
          "404",
          "409"
        ],
        "infrastructure": [
          "429",
          "500",
          "503"
        ],
        "exclusive_success": [
          "200",
          "202",
          "204"
        ]
      },
      "decisionLogic": "Delete a resource idempotently."
    },
    "HEAD": {
      "title": "HEAD",
      "category": "read",
      "characteristics": {
        "safe": true,
        "idempotent": true,
        "cacheable": true,
        "requestBody": false,
        "responseBody": false
      },
      "routingRules": {
        "requiresPayloadValidation": false,
        "supportsAsync": false
      },
      "responses": {
        "mandatory": [
          "200",
          "304",
          "404",
          "406",
          "408",
          "429",
          "500",
          "502",
          "503",
          "504"
        ],
        "typical": [
          "200",
          "304",
          "404",
          "406"
        ],
        "infrastructure": [
          "408",
          "429",
          "500",
          "502",
          "503",
          "504"
        ],
        "exclusive_success": [
          "200",
          "304"
        ]
      },
      "decisionLogic": "Retrieve response metadata only."
    },
    "OPTIONS": {
      "title": "OPTIONS",
      "category": "meta",
      "characteristics": {
        "safe": true,
        "idempotent": true,
        "cacheable": false,
        "requestBody": false,
        "responseBody": true
      },
      "routingRules": {
        "requiresPayloadValidation": false,
        "supportsAsync": false
      },
      "responses": {
        "mandatory": [
          "200",
          "204",
          "429",
          "500",
          "503"
        ],
        "typical": [
          "200",
          "204"
        ],
        "infrastructure": [
          "429",
          "500",
          "503"
        ],
        "exclusive_success": [
          "200",
          "204"
        ]
      },
      "decisionLogic": "Return supported communication options."
    },
    "TRACE": {
      "title": "TRACE",
      "category": "meta",
      "characteristics": {
        "safe": true,
        "idempotent": true,
        "cacheable": false,
        "requestBody": false,
        "responseBody": true
      },
      "routingRules": {
        "requiresPayloadValidation": false,
        "supportsAsync": false
      },
      "responses": {
        "mandatory": [
          "200",
          "429",
          "500",
          "503"
        ],
        "typical": [
          "200"
        ],
        "infrastructure": [
          "429",
          "500",
          "503"
        ],
        "exclusive_success": [
          "200"
        ]
      },
      "decisionLogic": "Diagnostic loop-back when explicitly enabled."
    }
  },
  "mutualExclusiveSets": [
    [
      "200",
      "201",
      "202",
      "204",
      "205",
      "206"
    ]
  ],
  "mandatoryHeaders": {
    "201": {
      "Location": {
        "$ref": "../components/response/headers/Location.yaml"
      }
    },
    "204": {
      "Content-Length": {
        "$ref": "../components/response/headers/Content-Length.yaml"
      }
    },
    "206": {
      "Content-Range": {
        "$ref": "../components/response/headers/Content-Range.yaml"
      }
    },
    "304": {
      "ETag": {
        "$ref": "../components/response/headers/ETag.yaml"
      },
      "Cache-Control": {
        "$ref": "../components/response/headers/Cache-Control.yaml"
      }
    },
    "401": {
      "WWW-Authenticate": {
        "$ref": "../components/response/headers/WWW-Authenticate.yaml"
      }
    },
    "403": {
      "X-Reason": {
        "$ref": "../components/response/headers/X-Reason.yaml"
      }
    },
    "429": {
      "Retry-After": {
        "$ref": "../components/response/headers/Retry-After.yaml"
      }
    },
    "503": {
      "Retry-After": {
        "$ref": "../components/response/headers/Retry-After.yaml"
      }
    }
  },
  "traits": {
    "resource-representation": [
      "200",
      "201",
      "202",
      "203",
      "206",
      "304"
    ],
    "error-representation": [
      "400",
      "401",
      "403",
      "404",
      "406",
      "408",
      "409",
      "412",
      "413",
      "415",
      "422",
      "428",
      "429",
      "500",
      "502",
      "503",
      "504"
    ]
  },
  "transferrableHeaders": [
    "Cache-Control",
    "ETag",
    "Vary",
    "X-Total-Count",
    "Content-Type",
    "Content-Length",
    "Location"
  ],
  "requestHeaderPolicy": {
    "registry": "../components/request/headers/header_registry.json",
    "common": [
      "Accept",
      "Accept-Encoding",
      "Accept-Language",
      "Content-Type",
      "User-Agent"
    ],
    "conditional": {
      "cacheValidation": [
        "If-Match",
        "If-Modified-Since",
        "If-None-Match"
      ],
      "versioning": [
        "X-API-Version"
      ],
      "browserNavigation": [
        "Referer",
        "Upgrade-Insecure-Requests"
      ]
    }
  },
  "security": {
    "registry": "../components/security/schemas/security_registry.json",
    "description": "Security schemes define authentication mechanisms; this policy defines response obligations."
  }
};
