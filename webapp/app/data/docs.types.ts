export type ParamRow = {
  name: string;
  type: string;
  required?: boolean;
  description: string;
};

export type EndpointProps = {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  summary: string;
  description?: string;
  queryParams?: ParamRow[];
  pathParams?: { name: string; type: string; description: string }[];
  requestBody?: ParamRow[];
  contentType?: string;
  responseExample?: string;
  notes?: string[];
};
