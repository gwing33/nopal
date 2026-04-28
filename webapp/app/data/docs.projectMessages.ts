import type { EndpointProps } from "./docs.types";

export const projectMessagesGet = {
  method: "GET",
  path: "/api/project-messages",
  summary: "List messages for a project",
  description:
    "Returns all messages for a given project, ordered by creation date ascending.",
  queryParams: [
    {
      name: "projectId",
      type: "string",
      required: true,
      description: "The project's _id. Required.",
    },
  ],
  responseExample: `{
  "data": [
    {
      "_id": "project_messages:abc123",
      "projectId": "p8rtz6w2",
      "humanId": "h9xmq3z1",
      "content": "Roof framing complete.",
      "isInternal": false,
      "createdAt": "2025-05-01T14:00:00.000Z",
      "updatedAt": "2025-05-01T14:00:00.000Z"
    }
  ]
}`,
} satisfies EndpointProps;

export const projectMessagesPost = {
  method: "POST",
  path: "/api/project-messages",
  summary: "Create a message",
  description: "Creates a new message on a project.",
  requestBody: [
    {
      name: "projectId",
      type: "string",
      required: true,
      description: "The project this message belongs to.",
    },
    {
      name: "humanId",
      type: "string",
      required: true,
      description: "The author's _id.",
    },
    {
      name: "content",
      type: "string",
      required: true,
      description: "Message body (markdown supported).",
    },
    {
      name: "isInternal",
      type: "boolean",
      required: true,
      description: "true = team-only note; false = client-visible message.",
    },
  ],
  responseExample: `HTTP 201 Created
{
  "_id": "project_messages:abc123",
  "projectId": "p8rtz6w2",
  "humanId": "h9xmq3z1",
  "content": "Roof framing complete.",
  "isInternal": false,
  "createdAt": "2025-05-01T14:00:00.000Z",
  "updatedAt": "2025-05-01T14:00:00.000Z"
}`,
} satisfies EndpointProps;

export const projectMessagesPut = {
  method: "PUT",
  path: "/api/project-messages/:id",
  summary: "Update a message",
  description: "Updates the content of an existing message.",
  pathParams: [
    {
      name: "id",
      type: "string",
      description: "The message's _id.",
    },
  ],
  requestBody: [
    {
      name: "content",
      type: "string",
      required: true,
      description: "Replacement message body.",
    },
  ],
  responseExample: `HTTP 200 OK
{ ...updated ProjectMessage }`,
  notes: ["Returns 404 if no message exists with the given id."],
} satisfies EndpointProps;

export const projectMessagesDelete = {
  method: "DELETE",
  path: "/api/project-messages/:id",
  summary: "Delete a message",
  description: "Permanently removes a message.",
  pathParams: [
    {
      name: "id",
      type: "string",
      description: "The message's _id.",
    },
  ],
  responseExample: `HTTP 200 OK
{ "success": true }`,
} satisfies EndpointProps;
