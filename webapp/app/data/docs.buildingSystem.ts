import type { EndpointProps } from "./docs.types";

export const bsCategoriesGet = {
  method: "GET",
  path: "/api/building-system/categories",
  summary: "List all categories",
  description:
    "Returns the full list of building system categories. Available to any authenticated user.",
  responseExample: `{
  "data": [
    {
      "_id": "bs_categories:abc123",
      "name": "Enclosure",
      "slug": "enclosure",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}`,
} satisfies EndpointProps;

export const bsCategoriesPost = {
  method: "POST",
  path: "/api/building-system/categories",
  summary: "Create a category",
  description:
    "Creates a new building system category. Requires Admin or Super role.",
  requestBody: [
    {
      name: "name",
      type: "string",
      required: true,
      description: "Human-readable category name.",
    },
    {
      name: "slug",
      type: "string",
      required: true,
      description: 'URL-safe identifier, e.g. "enclosure".',
    },
  ],
  responseExample: `HTTP 201 Created
{
  "_id": "bs_categories:abc123",
  "name": "Enclosure",
  "slug": "enclosure",
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z"
}`,
} satisfies EndpointProps;

export const bsCategoriesGetById = {
  method: "GET",
  path: "/api/building-system/categories/:id",
  summary: "Get a single category",
  pathParams: [
    {
      name: "id",
      type: "string",
      description: "The category's _id.",
    },
  ],
  responseExample: `{
  "_id": "bs_categories:abc123",
  "name": "Enclosure",
  "slug": "enclosure",
  ...
}`,
  notes: ["Returns 404 if no category exists with the given id."],
} satisfies EndpointProps;

export const bsCategoriesPut = {
  method: "PUT",
  path: "/api/building-system/categories/:id",
  summary: "Update a category",
  description:
    "Partially updates a category. Only the fields you include are changed. Requires Admin or Super role.",
  pathParams: [
    {
      name: "id",
      type: "string",
      description: "The category's _id.",
    },
  ],
  requestBody: [
    {
      name: "name",
      type: "string",
      required: false,
      description: "New category name.",
    },
    {
      name: "slug",
      type: "string",
      required: false,
      description: "New URL-safe slug.",
    },
  ],
  responseExample: `HTTP 200 OK
{ ...updated BsCategory }`,
  notes: ["Returns 404 if no category exists with the given id."],
} satisfies EndpointProps;

export const bsCategoriesDelete = {
  method: "DELETE",
  path: "/api/building-system/categories/:id",
  summary: "Delete a category",
  description:
    "Permanently removes a category. Requires Admin or Super role.",
  pathParams: [
    {
      name: "id",
      type: "string",
      description: "The category's _id.",
    },
  ],
  responseExample: `HTTP 200 OK
{ "success": true }`,
  notes: ["Returns 404 if no category exists with the given id."],
} satisfies EndpointProps;

export const bsSystemsGet = {
  method: "GET",
  path: "/api/building-system/systems",
  summary: "List or look up building systems",
  description:
    "Without query params returns all systems. Pass categoryId to filter by category. Pass slug to fetch a single system by its slug (takes precedence over categoryId).",
  queryParams: [
    {
      name: "categoryId",
      type: "string",
      required: false,
      description: "Return only systems belonging to this category _id.",
    },
    {
      name: "slug",
      type: "string",
      required: false,
      description:
        "Return a single system matching this slug. Takes precedence over categoryId.",
    },
  ],
  responseExample: `// Without filters
{ "data": [ ...BuildingSystem ] }

// With ?categoryId=bs_categories:abc123
{ "data": [ ...BuildingSystem ] }

// With ?slug=triple-pane-window — returns a single object (not wrapped)
{
  "_id": "building_systems:xyz789",
  "name": "Triple-Pane Window",
  "slug": "triple-pane-window",
  ...
}`,
} satisfies EndpointProps;

export const bsSystemsPost = {
  method: "POST",
  path: "/api/building-system/systems",
  summary: "Create a building system",
  description:
    "Creates a new building system. Requires Admin or Super role.",
  requestBody: [
    {
      name: "name",
      type: "string",
      required: true,
      description: "Human-readable system name.",
    },
    {
      name: "slug",
      type: "string",
      required: true,
      description: "URL-safe identifier.",
    },
    {
      name: "blocks",
      type: 'Array<{ type: "markdown"; md: string }>',
      required: true,
      description:
        "Content blocks. Currently only markdown blocks are supported.",
    },
    {
      name: "categoryId",
      type: "string",
      required: true,
      description: "The parent category's _id.",
    },
  ],
  responseExample: `HTTP 201 Created
{
  "_id": "building_systems:xyz789",
  "name": "Triple-Pane Window",
  "slug": "triple-pane-window",
  "blocks": [{ "type": "markdown", "md": "## Overview\\n..." }],
  "categoryId": "bs_categories:abc123",
  "createdAt": "2025-03-01T09:00:00.000Z",
  "updatedAt": "2025-03-01T09:00:00.000Z"
}`,
} satisfies EndpointProps;

export const bsSystemsGetById = {
  method: "GET",
  path: "/api/building-system/systems/:id",
  summary: "Get a single building system",
  pathParams: [
    {
      name: "id",
      type: "string",
      description: "The building system's _id.",
    },
  ],
  responseExample: `{
  "_id": "building_systems:xyz789",
  "name": "Triple-Pane Window",
  "slug": "triple-pane-window",
  "blocks": [...],
  "categoryId": "bs_categories:abc123",
  ...
}`,
  notes: ["Returns 404 if no system exists with the given id."],
} satisfies EndpointProps;

export const bsSystemsPut = {
  method: "PUT",
  path: "/api/building-system/systems/:id",
  summary: "Update a building system",
  description:
    "Partially updates a building system. Only the fields you include are changed. Requires Admin or Super role.",
  pathParams: [
    {
      name: "id",
      type: "string",
      description: "The building system's _id.",
    },
  ],
  requestBody: [
    {
      name: "name",
      type: "string",
      required: false,
      description: "New system name.",
    },
    {
      name: "slug",
      type: "string",
      required: false,
      description: "New URL-safe slug.",
    },
    {
      name: "blocks",
      type: 'Array<{ type: "markdown"; md: string }>',
      required: false,
      description: "Replacement blocks array.",
    },
    {
      name: "categoryId",
      type: "string",
      required: false,
      description: "New parent category _id.",
    },
  ],
  responseExample: `HTTP 200 OK
{ ...updated BuildingSystem }`,
  notes: [
    "Returns 404 if no system exists with the given id.",
    "Only fields present in the request body are updated — omitting a field leaves it unchanged.",
  ],
} satisfies EndpointProps;

export const bsSystemsDelete = {
  method: "DELETE",
  path: "/api/building-system/systems/:id",
  summary: "Delete a building system",
  description:
    "Permanently removes a building system. Requires Admin or Super role.",
  pathParams: [
    {
      name: "id",
      type: "string",
      description: "The building system's _id.",
    },
  ],
  responseExample: `HTTP 200 OK
{ "success": true }`,
  notes: ["Returns 404 if no system exists with the given id."],
} satisfies EndpointProps;
