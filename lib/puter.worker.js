const PROJECT_PREFIX = "Roomify_project_";
const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

const normalizeOrigin = (origin) =>
  typeof origin === "string" ? origin.trim().replace(/\/+$/, "") : "";

const readConfiguredOrigins = () => {
  const configuredValues = [
    globalThis.PUTER_ALLOWED_ORIGINS,
    globalThis.ALLOWED_ORIGINS,
    typeof process !== "undefined" ? process.env?.PUTER_ALLOWED_ORIGINS : undefined,
  ];

  return configuredValues
    .filter((value) => typeof value === "string" && value.trim())
    .flatMap((value) => value.split(","))
    .map(normalizeOrigin)
    .filter(Boolean);
};

const ALLOWED_ORIGINS = Array.from(
  new Set([...DEFAULT_ALLOWED_ORIGINS, ...readConfiguredOrigins()]),
);

const getRequestOrigin = (request) =>
  normalizeOrigin(request?.headers?.get("Origin"));

const isOriginAllowed = (request) => {
  const origin = getRequestOrigin(request);
  return !origin || ALLOWED_ORIGINS.includes(origin);
};

const getCorsHeaders = (request) => {
  const origin = getRequestOrigin(request);
  const headers = {
    "Access-Control-Allow-Headers": "Content-Type, puter-auth",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    Vary: "Origin",
  };

  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }

  return headers;
};

const jsonResponse = (request, data, status = 200) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...getCorsHeaders(request),
    },
  });
};

const jsonError = (request, status, message, extra = {}) => {
  return jsonResponse(
    request,
    {
      error: message || "An error occurred",
      ...extra,
    },
    status
  );
};

const forbiddenOriginResponse = (request) =>
  jsonError(request, 403, "Forbidden origin");

const preflightResponse = (request) => {
  if (!isOriginAllowed(request)) {
    return new Response(null, {
      status: 403,
      headers: {
        Vary: "Origin",
      },
    });
  }

  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(request),
  });
};

const getUserId = async (userPuter) => {
  try {
    const currentUser =
      typeof userPuter.getUser === "function"
        ? await userPuter.getUser()
        : await userPuter.auth.getUser();
    return currentUser?.uuid || null;
  } catch (error) {
    console.log("Error fetching userId:", error);
    return null;
  }
};

router.post("/api/projects/save", async ({ request, user }) => {
  try {
    if (!isOriginAllowed(request)) {
      return forbiddenOriginResponse(request);
    }

    const userPuter = user?.puter;

    if (!userPuter) {
      return jsonError(request, 401, "Unauthorized: No user session found");
    }

    const body = await request.json();
    const project = body?.project;

    if (!project?.id || !project?.sourceImage) {
      return jsonError(request, 400, "Bad Request: Missing project data");
    }

    const userId = await getUserId(userPuter);
    if (!userId) {
      return jsonError(
        request,
        401,
        "Unauthorized: Unable to fetch user information",
      );
    }

    const payload = {
      ...project,
      ownerId: userId,
      updatedAt: new Date().toISOString(),
    };

    const key = `${PROJECT_PREFIX}${project.id}`;
    await userPuter.kv.set(key, payload);

    return jsonResponse(request, { saved: true, id: project.id, project: payload });
  } catch (error) {
    return jsonError(request, 500, "Failed to save project", {
      message: error?.message || "An unexpected error occurred",
    });
  }
});

router.get("/api/projects/list", async ({ request, user }) => {
  try {
    if (!isOriginAllowed(request)) {
      return forbiddenOriginResponse(request);
    }

    const userPuter = user?.puter;

    if (!userPuter) {
      return jsonError(request, 401, "Unauthorized: No user session found");
    }

    const userId = await getUserId(userPuter);
    if (!userId) {
      return jsonError(
        request,
        401,
        "Unauthorized: Unable to fetch user information",
      );
    }

    const results = await userPuter.kv.list(`${PROJECT_PREFIX}*`, true);
    const projects = Array.isArray(results)
      ? results.map((entry) => entry.value)
      : [];

    return jsonResponse(request, { projects });
  } catch (error) {
    return jsonError(request, 500, "Failed to list projects", {
      message: error?.message || "An unexpected error occurred",
    });
  }
});

router.get("/api/projects/get", async ({ request, user }) => {
  try {
    if (!isOriginAllowed(request)) {
      return forbiddenOriginResponse(request);
    }

    const userPuter = user?.puter;

    if (!userPuter) {
      return jsonError(request, 401, "Unauthorized: No user session found");
    }

    const userId = await getUserId(userPuter);
    if (!userId) {
      return jsonError(
        request,
        401,
        "Unauthorized: Unable to fetch user information",
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return jsonError(request, 400, "Bad Request: Missing project id");
    }

    const project = await userPuter.kv.get(`${PROJECT_PREFIX}${id}`);

    if (!project) {
      return jsonError(request, 404, "Project not found", { id });
    }

    return jsonResponse(request, { project });
  } catch (error) {
    return jsonError(request, 500, "Failed to get project", {
      message: error?.message || "An unexpected error occurred",
    });
  }
});

router.options("/api/projects/save", ({ request }) => preflightResponse(request));
router.options("/api/projects/list", ({ request }) => preflightResponse(request));
router.options("/api/projects/get", ({ request }) => preflightResponse(request));
