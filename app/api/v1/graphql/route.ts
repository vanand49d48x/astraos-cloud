import { createYoga } from "graphql-yoga";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { typeDefs } from "@/lib/graphql/schema";
import { resolvers, type GQLContext } from "@/lib/graphql/resolvers";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

const schema = makeExecutableSchema({ typeDefs, resolvers });

const yoga = createYoga<{ req: Request }, GQLContext>({
  schema,
  graphqlEndpoint: "/api/v1/graphql",
  fetchAPI: { Response, Request, ReadableStream },

  context: async ({ req }): Promise<GQLContext> => {
    let teamId: string | null = null;
    let apiKeyId: string | null = null;
    let userId: string | null = null;

    const authHeader = req.headers.get("authorization") ?? "";
    const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;

    if (bearer) {
      const record = await prisma.apiKey.findFirst({
        where: { key: bearer, revokedAt: null },
        select: { id: true, teamId: true },
      });
      if (record) {
        teamId = record.teamId;
        apiKeyId = record.id;
        prisma.apiKey
          .update({ where: { id: record.id }, data: { lastUsedAt: new Date() } })
          .catch(() => {});
      }
    } else {
      const session = await auth();
      if (session?.user?.id) {
        userId = session.user.id;
        const member = await prisma.teamMember.findFirst({
          where: { userId: session.user.id },
          select: { teamId: true },
        });
        if (member) teamId = member.teamId;
      }
    }

    return { teamId, apiKeyId, userId };
  },

  // Enable GraphiQL in-browser IDE (dev + prod — useful for exploring)
  graphiql: {
    title: "ASTRA OS GraphQL Explorer",
    defaultQuery: `# ASTRA OS GraphQL API
# Authenticate: Authorization: Bearer astra_<your_key>

query SearchSentinel {
  search(
    bbox: [-122.52, 37.70, -122.35, 37.82]
    datetime: "2024-06-01/2024-12-31"
    cloudCoverLt: 20
    limit: 5
  ) {
    context { returned matched }
    warnings
    features {
      id
      datetime
      cloudCover
      providerName
      gsd
      thumbnailUrl
    }
  }
}

query AnalyzeScene {
  analyze(
    sceneId: "planetary-computer:S2A_MSIL2A_20241225T142711_R053_T20MRA_20241225T181448"
    indices: [ndvi, ndwi, nbr]
  ) {
    sceneId
    datetime
    cloudCover
    indices {
      ndvi { value interpretation }
      ndwi { value interpretation }
      nbr  { value interpretation }
    }
  }
}

query MyAccount {
  me {
    plan
    totalCalls
    callLimit
    quotaUsedPct
  }
}`,
  },
});

export async function GET(req: Request) {
  return yoga.fetch(req);
}

export async function POST(req: Request) {
  return yoga.fetch(req);
}
