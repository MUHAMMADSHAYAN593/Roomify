const PROJECT_PREFIX = "Roomify_project_";
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
};

const jsonResponse = (data, status = 200) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...CORS_HEADERS,
    },
  });
};

const jsonError = (status, message, extra = {}) => {
  return jsonResponse(
    {
      error: message || "An error occurred",
      ...extra,
    },
    status
  );
};

const preflightResponse = () => {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
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
    const userPuter = user?.puter;

    if (!userPuter) {
      return jsonError(401, "Unauthorized: No user session found");
    }

    const body = await request.json();
    const project = body?.project;

    if (!project?.id || !project?.sourceImage) {
      return jsonError(400, "Bad Request: Missing project data");
    }

    const payload = {
      ...project,
      updatedAt: new Date().toISOString(),
    };

    const userId = await getUserId(userPuter);
    if (!userId) {
      return jsonError(401, "Unauthorized: Unable to fetch user information");
    }

    const key = `${PROJECT_PREFIX}${project.id}`;
    await userPuter.kv.set(key, payload);

    return jsonResponse({ saved: true, id: project.id, project: payload });
  } catch (error) {
    return jsonError(500, "Failed to save project", {
      message: error?.message || "An unexpected error occurred",
    });
  }
});

router.get("/api/projects/list", async ({ user }) => {
  try {
    const userPuter = user?.puter;

    if (!userPuter) {
      return jsonError(401, "Unauthorized: No user session found");
    }

    const userId = await getUserId(userPuter);
    if (!userId) {
      return jsonError(401, "Unauthorized: Unable to fetch user information");
    }

    const results = await userPuter.kv.list(`${PROJECT_PREFIX}*`, true);
    const projects = Array.isArray(results)
      ? results.map((entry) => entry.value)
      : [];

    return jsonResponse({ projects });
  } catch (error) {
    return jsonError(500, "Failed to list projects", {
      message: error?.message || "An unexpected error occurred",
    });
  }
});

router.get("/api/projects/get", async ({ request, user }) => {
  try {
    const userPuter = user?.puter;

    if (!userPuter) {
      return jsonError(401, "Unauthorized: No user session found");
    }

    const userId = await getUserId(userPuter);
    if (!userId) {
      return jsonError(401, "Unauthorized: Unable to fetch user information");
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return jsonError(400, "Bad Request: Missing project id");
    }

    const project = await userPuter.kv.get(`${PROJECT_PREFIX}${id}`);

    if (!project) {
      return jsonError(404, "Project not found", { id });
    }

    return jsonResponse({ project });
  } catch (error) {
    return jsonError(500, "Failed to get project", {
      message: error?.message || "An unexpected error occurred",
    });
  }
});

router.options("/api/projects/save", preflightResponse);
router.options("/api/projects/list", preflightResponse);
router.options("/api/projects/get", preflightResponse);
