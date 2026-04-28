import type { EndpointProps } from "./docs.types";

export const projectsGet = {
  method: "GET",
  path: "/api/projects",
  summary: "List all projects",
  description:
    "Returns all projects. Use the optional humanId query parameter to filter by a human's involvement.",
  queryParams: [
    {
      name: "humanId",
      type: "string",
      required: false,
      description:
        "Return only projects where this human appears in the humans array.",
    },
  ],
  responseExample: `// Without filters — paginated wrapper
{
  "data": [ ...Project ],
  "metadata": { "nextStart": null }
}

// With ?humanId=h9xmq3z1 — plain array
{ "data": [ ...Project ] }`,
} satisfies EndpointProps;

export const projectsPost = {
  method: "POST",
  path: "/api/projects",
  summary: "Create a project",
  description:
    "Creates a new project. The authenticated user is recorded as createdBy and updatedBy.",
  requestBody: [
    {
      name: "name",
      type: "string",
      required: true,
      description: "Project name.",
    },
    {
      name: "northStar",
      type: "string",
      required: true,
      description: "The project's guiding north star statement.",
    },
    {
      name: "type",
      type: '"Guide" | "Design+Build"',
      required: true,
      description: "Project engagement type.",
    },
    {
      name: "address",
      type: "string",
      required: true,
      description: "Physical address of the project site.",
    },
    {
      name: "phases",
      type: "Phase[]",
      required: true,
      description:
        "Array of phase objects, each with startDate, endDate (ISO 8601), and status strings.",
    },
    {
      name: "humans",
      type: "ProjectHuman[]",
      required: true,
      description:
        'Array of { humanId, role } objects. role must be "Client", "Guide", or "Friend".',
    },
    {
      name: "costRange",
      type: "[number, number]",
      required: true,
      description: "[minCost, maxCost] tuple in dollars.",
    },
    {
      name: "nopalPhase",
      type: '"seed" | "sprout" | "seedling" | "flower" | "renewing"',
      required: false,
      description: 'Nopal lifecycle phase. Defaults to "seed".',
    },
    {
      name: "ideaOverview",
      type: "string",
      required: false,
      description: "Free-text description of the project idea.",
    },
  ],
  responseExample: `HTTP 201 Created
{
  "_id": "p8rtz6w2",
  "name": "Sunny Home No. 1",
  "northStar": "A net-zero home that feels like a sanctuary.",
  "type": "Design+Build",
  "nopalPhase": "sprout",
  "costRange": [450000, 600000],
  "createdAt": "2025-04-01T10:00:00.000Z",
  "updatedAt": "2025-04-01T10:00:00.000Z",
  "createdBy": "h9xmq3z1",
  "updatedBy": "h9xmq3z1",
  ...
}`,
} satisfies EndpointProps;

export const projectsGetById = {
  method: "GET",
  path: "/api/projects/:id",
  summary: "Get a single project",
  pathParams: [
    {
      name: "id",
      type: "string",
      description: "The project's _id.",
    },
  ],
  responseExample: `{
  "_id": "p8rtz6w2",
  "name": "Sunny Home No. 1",
  "type": "Design+Build",
  "nopalPhase": "sprout",
  ...
}`,
  notes: ["Returns 404 if no project exists with the given id."],
} satisfies EndpointProps;

export const projectsPut = {
  method: "PUT",
  path: "/api/projects/:id",
  summary: "Update a project",
  description:
    "Partially updates a project. Only the fields you send are changed. updatedAt and updatedBy are set automatically from the authenticated user.",
  pathParams: [
    {
      name: "id",
      type: "string",
      description: "The project's _id.",
    },
  ],
  requestBody: [
    {
      name: "name",
      type: "string",
      required: false,
      description: "New project name.",
    },
    {
      name: "northStar",
      type: "string",
      required: false,
      description: "New north star statement.",
    },
    {
      name: "type",
      type: '"Guide" | "Design+Build"',
      required: false,
      description: "New engagement type.",
    },
    {
      name: "address",
      type: "string",
      required: false,
      description: "New site address.",
    },
    {
      name: "phases",
      type: "Phase[]",
      required: false,
      description: "Replacement phases array.",
    },
    {
      name: "humans",
      type: "ProjectHuman[]",
      required: false,
      description: "Replacement humans array.",
    },
    {
      name: "costRange",
      type: "[number, number]",
      required: false,
      description: "New [minCost, maxCost] tuple.",
    },
    {
      name: "nopalPhase",
      type: '"seed" | "sprout" | "seedling" | "flower" | "renewing"',
      required: false,
      description: "New nopal lifecycle phase.",
    },
    {
      name: "ideaOverview",
      type: "string",
      required: false,
      description: "New idea overview text.",
    },
  ],
  responseExample: `HTTP 200 OK
{ ...updated Project }`,
  notes: [
    "Returns 404 if no project exists with the given id.",
    "Only fields present in the request body are updated — omitting a field leaves it unchanged.",
    "updatedAt and updatedBy are always refreshed on a successful update.",
  ],
} satisfies EndpointProps;

export const projectsDelete = {
  method: "DELETE",
  path: "/api/projects/:id",
  summary: "Delete a project",
  description: "Permanently removes a project record.",
  pathParams: [
    {
      name: "id",
      type: "string",
      description: "The project's _id.",
    },
  ],
  responseExample: `HTTP 200 OK
{ "success": true }`,
  notes: ["Returns 404 if no project exists with the given id."],
} satisfies EndpointProps;
