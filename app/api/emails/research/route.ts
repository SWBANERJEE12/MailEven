import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateRequestOrigin, invalidOriginResponse } from "@/lib/security";

export interface ResearchSource {
  title: string;
  link: string;
  snippet: string;
  domain: string;
  date?: string;
}

export interface ResearchResult {
  query: string;
  summary: string;
  knowledgeGraph?: {
    title: string;
    description: string;
    source?: { name: string; link: string };
  } | null;
  sources: ResearchSource[];
  relatedQueries: string[];
  isLive: boolean;
}

export async function POST(req: NextRequest) {
  if (!validateRequestOrigin(req)) {
    return invalidOriginResponse();
  }

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { emailId, query, subject, sender, bodyText } = await req.json();

    // Determine query: explicit user query OR synthesized from email context
    let targetQuery = (query || "").trim();

    if (!targetQuery) {
      if (emailId) {
        const email = await prisma.email.findUnique({
          where: { id: emailId },
          select: { subject: true, sender: true, senderName: true, summary: true },
        });
        if (email) {
          targetQuery = extractSearchQuery(email.subject, email.sender, email.senderName);
        }
      } else if (subject) {
        targetQuery = extractSearchQuery(subject, sender || "");
      } else {
        targetQuery = "executive communication updates";
      }
    }

    const apiKey = process.env.SERPAPI_API_KEY?.trim();

    if (apiKey) {
      try {
        const serpUrl = new URL("https://serpapi.com/search.json");
        serpUrl.searchParams.set("engine", "google");
        serpUrl.searchParams.set("q", targetQuery);
        serpUrl.searchParams.set("api_key", apiKey);
        serpUrl.searchParams.set("num", "5");

        const serpRes = await fetch(serpUrl.toString(), {
          headers: { "User-Agent": "MailEven-Intelligence/1.0" },
          next: { revalidate: 300 }, // Cache search queries for 5 minutes
        });

        if (serpRes.ok) {
          const serpData = await serpRes.json();

          const organicResults: any[] = serpData.organic_results || [];
          const sources: ResearchSource[] = organicResults.slice(0, 5).map((item) => {
            let domain = "";
            try {
              domain = new URL(item.link).hostname.replace(/^www\./, "");
            } catch {
              domain = item.displayed_link || "web";
            }
            return {
              title: item.title || "Untitled Source",
              link: item.link || "#",
              snippet: item.snippet || "",
              domain,
              date: item.date || undefined,
            };
          });

          // Extract knowledge graph if present
          let knowledgeGraph: ResearchResult["knowledgeGraph"] = null;
          if (serpData.knowledge_graph) {
            knowledgeGraph = {
              title: serpData.knowledge_graph.title || targetQuery,
              description: serpData.knowledge_graph.description || "",
              source: serpData.knowledge_graph.source
                ? {
                    name: serpData.knowledge_graph.source.name || "Wikipedia",
                    link: serpData.knowledge_graph.source.link || "",
                  }
                : undefined,
            };
          }

          // Extract related questions & searches
          const relatedQueries: string[] = [];
          if (Array.isArray(serpData.related_searches)) {
            serpData.related_searches.forEach((r: any) => {
              if (r.query && !relatedQueries.includes(r.query)) relatedQueries.push(r.query);
            });
          }
          if (Array.isArray(serpData.related_questions)) {
            serpData.related_questions.forEach((q: any) => {
              if (q.question && !relatedQueries.includes(q.question)) relatedQueries.push(q.question);
            });
          }

          // Synthesize concise intelligence summary
          const topSnippets = sources
            .map((s) => s.snippet)
            .filter(Boolean)
            .slice(0, 3)
            .join(" ");

          const summary = topSnippets
            ? topSnippets
            : `Search intelligence retrieved for "${targetQuery}". Review sources below for direct context.`;

          return NextResponse.json({
            query: targetQuery,
            summary,
            knowledgeGraph,
            sources,
            relatedQueries: relatedQueries.slice(0, 4),
            isLive: true,
          } as ResearchResult);
        } else {
          console.warn("SerpApi response error:", serpRes.status, await serpRes.text());
        }
      } catch (serpErr) {
        console.error("SerpApi network call failed:", serpErr);
      }
    }

    // Heuristic fallback engine when SERPAPI_API_KEY is not yet configured
    const fallbackData = generateFallbackResearch(targetQuery, subject, sender);
    return NextResponse.json(fallbackData);
  } catch (err: any) {
    console.error("Research API error:", err);
    return NextResponse.json({ error: err.message || "Failed to retrieve research" }, { status: 500 });
  }
}

/**
 * Extracts a high-signal search query from an email subject and sender metadata
 */
function extractSearchQuery(subject: string, senderEmail: string, senderName?: string | null): string {
  let cleanSubject = subject
    .replace(/^(re|fwd|fw|urgent|action required|notice):\s*/gi, "")
    .replace(/\[.*?\]/g, "")
    .replace(/[\(\)]/g, "")
    .trim();

  // If the sender is from a corporate domain, include company context
  let company = "";
  if (senderEmail && senderEmail.includes("@")) {
    const domain = senderEmail.split("@")[1]?.toLowerCase();
    const commonDomains = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com", "maileven.ai"];
    if (!commonDomains.includes(domain)) {
      company = domain.split(".")[0];
      company = company.charAt(0).toUpperCase() + company.slice(1);
    }
  }

  if (company && !cleanSubject.toLowerCase().includes(company.toLowerCase())) {
    return `${company} ${cleanSubject}`.slice(0, 80);
  }

  return cleanSubject.slice(0, 80) || "latest industry updates";
}

/**
 * Generates realistic contextual intelligence when testing offline or before setting SERPAPI_API_KEY
 */
function generateFallbackResearch(query: string, subject?: string, sender?: string): ResearchResult {
  const q = query.toLowerCase();

  const domain = sender && sender.includes("@") ? sender.split("@")[1] : "company.com";
  const orgName = domain.split(".")[0];
  const capOrg = orgName.charAt(0).toUpperCase() + orgName.slice(1);

  if (q.includes("flight") || q.includes("travel") || q.includes("booking") || q.includes("airline")) {
    return {
      query,
      summary:
        "Travel operational context: Flight status and airport ground services are operating under standard international schedule protocols. Travelers are advised to confirm boarding terminals and carry digital confirmation itineraries.",
      sources: [
        {
          title: "Flight Status Tracker & Live Travel Updates",
          link: "https://flightaware.com",
          domain: "flightaware.com",
          snippet: "Real-time airport arrival and departure tracking with live gate assignments and weather advisories.",
        },
        {
          title: "Aviation Passenger Rights & Luggage Guidelines",
          link: "https://transportation.gov",
          domain: "transportation.gov",
          snippet: "Federal guidelines regarding check-in timelines, carry-on allowances, and compensation policies.",
        },
      ],
      relatedQueries: [
        `${query} terminal status`,
        "Airport baggage policies",
        "Airline customer support phone",
      ],
      isLive: false,
    };
  }

  if (q.includes("invest") || q.includes("q3") || q.includes("q4") || q.includes("deck") || q.includes("financial")) {
    return {
      query,
      summary: `Market intelligence: Strategic review of capital allocations and financial performance indicators for ${capOrg}. Industry benchmarks suggest high market interest in executive operating efficiency and revenue expansion.`,
      sources: [
        {
          title: `${capOrg} Corporate Overview & Market Standing`,
          link: `https://crunchbase.com/organization/${orgName}`,
          domain: "crunchbase.com",
          snippet: `Executive leadership profiles, funding timeline, key partners, and latest strategic acquisitions for ${capOrg}.`,
        },
        {
          title: "SaaS & Venture Capital Financial Health Benchmarks",
          link: "https://pitchbook.com",
          domain: "pitchbook.com",
          snippet: "Quarterly industry report covering growth multiples, net retention, and operating burn ratios across private markets.",
        },
      ],
      relatedQueries: [
        `${capOrg} latest news and press releases`,
        `${capOrg} funding history and valuation`,
        "Q3 executive review best practices",
      ],
      isLive: false,
    };
  }

  return {
    query,
    summary: `Context intelligence for "${query}": Recent organizational updates indicate ongoing project alignment and strategic execution. Key stakeholders emphasize timely milestone signoffs and clear stakeholder communication.`,
    sources: [
      {
        title: `${query} — Industry Context & Overview`,
        link: `https://${domain}`,
        domain,
        snippet: `Public updates and official communication records regarding ongoing initiatives and services related to ${query}.`,
      },
      {
        title: "Executive Workflow Standards & Project Management Insights",
        link: "https://hbr.org",
        domain: "hbr.org",
        snippet: "Best practices for high-velocity project management, executive alignment, and follow-up protocol.",
      },
    ],
    relatedQueries: [
      `${query} executive overview`,
      `${query} key stakeholders and documentation`,
      `${capOrg} company directory and contacts`,
    ],
    isLive: false,
  };
}
