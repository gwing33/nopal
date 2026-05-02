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
      "role": "Admin",
      "pfp": "https://bucket.example.com/profile/h9xmq3z1/pfp-1234567890.jpg",
      "officeHours": {
        "monday":    { "enabled": true,  "start": "09:00", "end": "17:00" },
        "tuesday":   { "enabled": true,  "start": "09:00", "end": "17:00" },
        "wednesday": { "enabled": true,  "start": "09:00", "end": "17:00" },
        "thursday":  { "enabled": true,  "start": "09:00", "end": "17:00" },
        "friday":    { "enabled": true,  "start": "09:00", "end": "17:00" },
        "saturday":  { "enabled": false, "start": "09:00", "end": "17:00" },
        "sunday":    { "enabled": false, "start": "09:00", "end": "17:00" }
      },
      "scheduledEvents": [
        { "id": "lx5ab1", "name": "Vacation", "startDate": "2025-08-01", "endDate": "2025-08-07" }
      ]
    }
  ],
  "metadata": { "nextStart": null }
}`,
  notes: [
    "The pfp, officeHours, and scheduledEvents fields are optional and may be absent if not set.",
  ],
} satisfies EndpointProps;

export const humansPost = {
  method: "POST",
  path: "/api/humans",
  summary: "Create a human",
  description: "Creates a new human record. Requires Admin or Super role.",
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
  // pfp, officeHours, scheduledEvents absent until set via profile page
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
  "role": "Admin",
  "pfp": "https://bucket.example.com/profile/h9xmq3z1/pfp-1234567890.jpg",
  "officeHours": { ... },
  "scheduledEvents": [ ... ]
}`,
  notes: [
    "Returns 404 if no human exists with the given id.",
    "The pfp, officeHours, and scheduledEvents fields are optional and may be absent if not set.",
  ],
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
