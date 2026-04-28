import type { EndpointProps } from "./docs.types";

export const humansGet = {
  method: "GET",
  path: "/api/humans",
  summary: "List all humans",
  description:
    "Returns all humans in the system. Available to any authenticated user.",
  responseExample: `{
  "data": [
    {
      "_id": "h9xmq3z1",
      "email": "ada@example.com",
      "name": "Ada Lovelace",
      "role": "Admin"
    }
  ],
  "metadata": { "nextStart": null }
}`,
} satisfies EndpointProps;

export const humansPost = {
  method: "POST",
  path: "/api/humans",
  summary: "Create a human",
  description:
    "Creates a new human record. Requires Admin or Super role.",
  requestBody: [
    {
      name: "email",
      type: "string",
      required: true,
      description: "The human's email address.",
    },
    {
      name: "name",
      type: "string",
      required: true,
      description: "The human's display name.",
    },
    {
      name: "role",
      type: '"Super" | "Admin" | "Human" | "MaybeHuman"',
      required: true,
      description: "The human's role in the system.",
    },
  ],
  responseExample: `HTTP 201 Created
{
  "_id": "h9xmq3z1",
  "email": "ada@example.com",
  "name": "Ada Lovelace",
  "role": "Human"
}`,
  notes: [
    'Only users with role "Admin" or "Super" may call this endpoint — others receive 403.',
  ],
} satisfies EndpointProps;

export const humansGetById = {
  method: "GET",
  path: "/api/humans/:id",
  summary: "Get a single human",
  pathParams: [
    {
      name: "id",
      type: "string",
      description: "The human's _id.",
    },
  ],
  responseExample: `{
  "_id": "h9xmq3z1",
  "email": "ada@example.com",
  "name": "Ada Lovelace",
  "role": "Admin"
}`,
  notes: ["Returns 404 if no human exists with the given id."],
} satisfies EndpointProps;

export const humansPut = {
  method: "PUT",
  path: "/api/humans/:id",
  summary: "Update a human",
  description:
    "Replaces a human's email, name, and role. All three fields are required. Requires Admin or Super role.",
  pathParams: [
    {
      name: "id",
      type: "string",
      description: "The human's _id.",
    },
  ],
  requestBody: [
    {
      name: "email",
      type: "string",
      required: true,
      description: "New email address.",
    },
    {
      name: "name",
      type: "string",
      required: true,
      description: "New display name.",
    },
    {
      name: "role",
      type: '"Super" | "Admin" | "Human" | "MaybeHuman"',
      required: true,
      description: "New role.",
    },
  ],
  responseExample: `HTTP 200 OK
{ ...updated Human }`,
  notes: [
    "Returns 404 if no human exists with the given id.",
    'Only users with role "Admin" or "Super" may call this endpoint — others receive 403.',
  ],
} satisfies EndpointProps;

export const humansDelete = {
  method: "DELETE",
  path: "/api/humans/:id",
  summary: "Delete a human",
  description:
    "Permanently removes a human record. Requires Admin or Super role.",
  pathParams: [
    {
      name: "id",
      type: "string",
      description: "The human's _id.",
    },
  ],
  responseExample: `HTTP 200 OK
{ "success": true }`,
  notes: [
    'Only users with role "Admin" or "Super" may call this endpoint — others receive 403.',
  ],
} satisfies EndpointProps;
