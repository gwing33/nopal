import type { EndpointProps } from "./docs.types";

export const collectionsGet = {
  method: "GET",
  path: "/api/calendar/collections",
  summary: "List all collections",
  description:
    "Returns the full set of calendar collections. Use query parameters to narrow by type or linked record.",
  queryParams: [
    {
      name: "type",
      type: '"human" | "project" | "named"',
      required: false,
      description:
        "Filter by collection type. Must be used alone or together with refId.",
    },
    {
      name: "refId",
      type: "string",
      required: false,
      description:
        "Filter by the associated human or project ID. Only meaningful when type is also provided.",
    },
  ],
  responseExample: `// Without filters — returns paginated collection wrapper
{
  "data": [ ...CalendarCollection ],
  "metadata": { "nextStart": null }
}

// With ?type=project&refId=abc123 — returns plain array
{ "data": [ ...CalendarCollection ] }`,
} satisfies EndpointProps;

export const collectionsPost = {
  method: "POST",
  path: "/api/calendar/collections",
  summary: "Create a collection",
  description:
    'Creates a new calendar collection. For a human or project calendar, set type accordingly and supply the matching refId. For a standalone group (e.g. "Birthdays") use type "named".',
  requestBody: [
    {
      name: "name",
      type: "string",
      required: true,
      description: "Human-readable name for the collection.",
    },
    {
      name: "type",
      type: '"human" | "project" | "named"',
      required: true,
      description: "How this collection is associated.",
    },
    {
      name: "refId",
      type: "string",
      required: false,
      description:
        'The humanId or projectId. Required when type is "human" or "project".',
    },
  ],
  responseExample: `HTTP 201 Created
{
  "_id": "l3kv2yq8fxm0",
  "name": "Birthdays",
  "type": "named",
  "refId": undefined,
  "createdAt": "2025-01-15T18:00:00.000Z",
  "updatedAt": "2025-01-15T18:00:00.000Z",
  "createdBy": "h9xmq3z1"
}`,
} satisfies EndpointProps;

export const collectionsGetById = {
  method: "GET",
  path: "/api/calendar/collections/:id",
  summary: "Get a single collection",
  pathParams: [
    {
      name: "id",
      type: "string",
      description: "The collection's _id.",
    },
  ],
  responseExample: `{
  "_id": "l3kv2yq8fxm0",
  "name": "Sunny Home Project",
  "type": "project",
  "refId": "p8rtz6w2",
  ...
}`,
  notes: ["Returns 404 if no collection exists with the given id."],
} satisfies EndpointProps;

export const collectionsPut = {
  method: "PUT",
  path: "/api/calendar/collections/:id",
  summary: "Update a collection",
  description:
    "Partially updates a collection. Only the fields you include are changed.",
  pathParams: [
    {
      name: "id",
      type: "string",
      description: "The collection's _id.",
    },
  ],
  requestBody: [
    {
      name: "name",
      type: "string",
      required: false,
      description: "New display name.",
    },
    {
      name: "type",
      type: '"human" | "project" | "named"',
      required: false,
      description: "New association type.",
    },
    {
      name: "refId",
      type: "string",
      required: false,
      description: "New linked record ID.",
    },
  ],
  responseExample: `HTTP 200 OK
{ ...updated CalendarCollection }`,
  notes: [
    "Returns 404 if no collection exists with the given id.",
    "updatedAt is automatically set to the current time.",
  ],
} satisfies EndpointProps;

export const collectionsDelete = {
  method: "DELETE",
  path: "/api/calendar/collections/:id",
  summary: "Delete a collection",
  description:
    "Permanently removes a collection record. Does not cascade-delete the calendars inside it — remove those first if desired.",
  pathParams: [
    {
      name: "id",
      type: "string",
      description: "The collection's _id.",
    },
  ],
  responseExample: `HTTP 200 OK
{ "success": true }`,
} satisfies EndpointProps;

export const collectionsCalendarsGet = {
  method: "GET",
  path: "/api/calendar/collections/:collectionId/calendars",
  summary: "List calendars in a collection",
  description:
    "Returns all calendars that belong to the given collection, ordered by name ascending.",
  pathParams: [
    {
      name: "collectionId",
      type: "string",
      description: "The parent collection's _id.",
    },
  ],
  responseExample: `{
  "data": [
    {
      "_id": "c4bnx9p2",
      "collectionId": "l3kv2yq8fxm0",
      "name": "Site Visits",
      "type": "internal",
      "timezone": "America/Phoenix",
      "isActive": true,
      ...
    }
  ]
}`,
} satisfies EndpointProps;

export const collectionsCalendarsPost = {
  method: "POST",
  path: "/api/calendar/collections/:collectionId/calendars",
  summary: "Add a calendar to a collection",
  pathParams: [
    {
      name: "collectionId",
      type: "string",
      description: "The parent collection's _id.",
    },
  ],
  requestBody: [
    {
      name: "name",
      type: "string",
      required: true,
      description: "Display name.",
    },
    {
      name: "type",
      type: '"internal" | "google"',
      required: true,
      description: 'Use "google" when linking to an external Google Calendar.',
    },
    {
      name: "description",
      type: "string",
      required: false,
      description: "Optional description.",
    },
    {
      name: "color",
      type: "string",
      required: false,
      description: 'Hex color string, e.g. "#5da06d".',
    },
    {
      name: "googleCalendarId",
      type: "string",
      required: false,
      description:
        'The Google Calendar ID (e.g. "user@gmail.com"). Required when type is "google".',
    },
    {
      name: "timezone",
      type: "string",
      required: false,
      description: 'IANA timezone string. Defaults to "UTC".',
    },
    {
      name: "isActive",
      type: "boolean",
      required: false,
      description: "Defaults to true.",
    },
  ],
  responseExample: `HTTP 201 Created
{
  "_id": "c4bnx9p2",
  "collectionId": "l3kv2yq8fxm0",
  "name": "Site Visits",
  "type": "internal",
  "color": "#5da06d",
  "timezone": "America/Phoenix",
  "isActive": true,
  "createdAt": "2025-01-15T18:05:00.000Z",
  "updatedAt": "2025-01-15T18:05:00.000Z",
  "createdBy": "h9xmq3z1"
}`,
} satisfies EndpointProps;

export const calendarsGetById = {
  method: "GET",
  path: "/api/calendar/calendars/:id",
  summary: "Get a single calendar",
  pathParams: [
    {
      name: "id",
      type: "string",
      description: "The calendar's _id.",
    },
  ],
  responseExample: `{
  "_id": "c4bnx9p2",
  "collectionId": "l3kv2yq8fxm0",
  "name": "Site Visits",
  "type": "internal",
  "timezone": "America/Phoenix",
  "isActive": true,
  ...
}`,
  notes: ["Returns 404 if no calendar exists with the given id."],
} satisfies EndpointProps;

export const calendarsPut = {
  method: "PUT",
  path: "/api/calendar/calendars/:id",
  summary: "Update a calendar",
  description:
    "Partially updates a calendar. collectionId cannot be changed after creation — move the calendar by deleting and re-creating it.",
  pathParams: [
    {
      name: "id",
      type: "string",
      description: "The calendar's _id.",
    },
  ],
  requestBody: [
    {
      name: "name",
      type: "string",
      required: false,
      description: "New display name.",
    },
    {
      name: "description",
      type: "string",
      required: false,
      description: "New description.",
    },
    {
      name: "type",
      type: '"internal" | "google"',
      required: false,
      description: "New calendar type.",
    },
    {
      name: "color",
      type: "string",
      required: false,
      description: "New hex color.",
    },
    {
      name: "googleCalendarId",
      type: "string",
      required: false,
      description: "New Google Calendar ID.",
    },
    {
      name: "timezone",
      type: "string",
      required: false,
      description: "New IANA timezone.",
    },
    {
      name: "isActive",
      type: "boolean",
      required: false,
      description: "Toggle active state.",
    },
  ],
  responseExample: `HTTP 200 OK
{ ...updated Calendar }`,
  notes: [
    "Returns 404 if no calendar exists with the given id.",
    "Only fields present in the request body are updated — omitting a field leaves it unchanged.",
    "updatedAt is automatically set to the current time.",
  ],
} satisfies EndpointProps;

export const calendarsDelete = {
  method: "DELETE",
  path: "/api/calendar/calendars/:id",
  summary: "Delete a calendar",
  description: "Permanently removes a calendar.",
  pathParams: [
    {
      name: "id",
      type: "string",
      description: "The calendar's _id.",
    },
  ],
  responseExample: `HTTP 200 OK
{ "success": true }`,
} satisfies EndpointProps;
