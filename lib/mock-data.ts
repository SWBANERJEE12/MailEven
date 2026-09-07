export interface DemoAccountConfig {
  id: string;
  email: string;
  name: string;
  initials: string;
  color: string;
  isPrimary: boolean;
}

export const DEMO_ACCOUNTS: DemoAccountConfig[] = [
  {
    id: "demo_acc_work",
    email: "alex.chen@workplace.com",
    name: "Alex Chen (Work)",
    initials: "AC",
    color: "#4F6B6E", // Steel Teal
    isPrimary: true,
  },
  {
    id: "demo_acc_personal",
    email: "alex.personal@gmail.com",
    name: "Alex Chen (Personal)",
    initials: "AP",
    color: "#918578", // Star Dust
    isPrimary: false,
  },
];

export interface MockEmailData {
  id: string;
  accountId: string;
  accountEmail: string;
  sender: string;
  senderName: string;
  recipient: string;
  subject: string;
  snippet: string;
  bodyText: string;
  bodyHtml?: string;
  receivedAt: string;
  summary: string;
  isActionable: boolean;
  actionType: "event" | "task" | "none";
  eventProposal: {
    title: string;
    startTime: string;
    endTime: string;
    location?: string;
    description?: string;
  } | null;
  taskProposal: {
    title: string;
    dueDate?: string;
    notes?: string;
    priority?: "low" | "medium" | "high";
  } | null;
  tags: string[];
  category?: string;
  priority?: "critical" | "high" | "medium" | "low" | "ignore";
  personalizationReason?: string;
  personalizationConfidence?: number;
  briefingStatus: "pending" | "interested" | "dismissed" | "actioned";
}

export const INITIAL_MOCK_EMAILS: MockEmailData[] = [
  {
    id: "mock_email_1",
    accountId: "demo_acc_work",
    accountEmail: "alex.chen@workplace.com",
    sender: "elena.rostova@acmeventures.com",
    senderName: "Elena Rostova",
    recipient: "alex.chen@workplace.com",
    subject: "Q3 Strategy & Product Roadmap Alignment",
    snippet: "Hi team, let's lock in our Q3 planning session for tomorrow at 2:00 PM EST via Google Meet...",
    bodyText: `Hi Alex,

Hope your week is off to a great start.

We need to finalize the Q3 product roadmap and resource allocation before the executive offsite next week. I propose we meet tomorrow (Tuesday) from 2:00 PM to 3:00 PM EST to walk through the deliverables.

Agenda:
1. MailEven AI summarization benchmarks & latency
2. Calendar/Task integration conversion metrics
3. Q3 hiring roadmap and budget approval

Google Meet link: https://meet.google.com/xyz-maileven-sync
Please let me know if this slot works or if you prefer an earlier morning time.

Best regards,
Elena Rostova
Partner, Acme Ventures`,
    receivedAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(), // 25 mins ago
    summary: "Elena requested a 1-hour Q3 Product Roadmap alignment meeting tomorrow at 2:00 PM EST via Google Meet to finalize hiring and AI benchmarks before the offsite.",
    isActionable: true,
    actionType: "event",
    eventProposal: {
      title: "Q3 Strategy & Product Roadmap Alignment",
      startTime: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
      endTime: new Date(Date.now() + 1000 * 60 * 60 * 25).toISOString(),
      location: "Google Meet (https://meet.google.com/xyz-maileven-sync)",
      description: "Q3 planning session with Elena Rostova (Acme Ventures) covering AI latency, conversion metrics, and hiring roadmap.",
    },
    taskProposal: null,
    tags: ["Work", "Urgent"],
    briefingStatus: "pending",
  },
  {
    id: "mock_email_3",
    accountId: "demo_acc_personal",
    accountEmail: "alex.personal@gmail.com",
    sender: "ticket-confirmations@delta.com",
    senderName: "Delta Air Lines",
    recipient: "alex.personal@gmail.com",
    subject: "Your Flight Confirmation: SFO to JFK (Conf: #H7X9W2)",
    snippet: "Here is your electronic receipt and itinerary for Flight DL 1482 departing San Francisco at 8:30 AM...",
    bodyText: `Delta Air Lines Booking Confirmation

Confirmation Code: H7X9W2
Passenger: Alex Chen

Flight: DL 1482 - Nonstop Boeing 767-400
Departs: San Francisco International (SFO) - Terminal 2
Date: Friday, September 11, 2026 at 08:30 AM PST
Arrives: New York Kennedy (JFK) - Terminal 4
Date: Friday, September 11, 2026 at 05:15 PM EST

Seat: 14A (Comfort+)
Carry-on: 1 personal item + 1 carry-on bag included.
Please arrive at SFO Terminal 2 at least 90 minutes prior to departure.

Manage your reservation online or through the Fly Delta mobile app.`,
    receivedAt: new Date(Date.now() - 1000 * 60 * 55).toISOString(), // 55 mins ago
    summary: "Confirmed flight booking DL 1482 departing SFO Terminal 2 on Friday at 8:30 AM PST, arriving JFK at 5:15 PM EST (Confirmation: #H7X9W2).",
    isActionable: true,
    actionType: "event",
    eventProposal: {
      title: "Flight: SFO -> JFK (Delta DL 1482)",
      startTime: new Date(Date.now() + 1000 * 60 * 60 * 96).toISOString(),
      endTime: new Date(Date.now() + 1000 * 60 * 60 * 102).toISOString(),
      location: "SFO Airport Terminal 2",
      description: "Delta flight DL 1482 to New York JFK. Confirmation Code: H7X9W2. Seat 14A.",
    },
    taskProposal: null,
    tags: ["Travel"],
    briefingStatus: "pending",
  },
  {
    id: "mock_email_2",
    accountId: "demo_acc_work",
    accountEmail: "alex.chen@workplace.com",
    sender: "security-alerts@cloudscale.io",
    senderName: "CloudScale Security Ops",
    recipient: "alex.chen@workplace.com",
    subject: "URGENT: Annual SOC-2 Security Audit Attestation due Thursday",
    snippet: "Action required: Complete your department's vendor risk sign-off and access control review by Thursday 5:00 PM...",
    bodyText: `PRIORITY NOTICE: ANNUAL COMPLIANCE AUDIT

Alex,

The external auditors for our SOC-2 Type II attestation have requested sign-off on your department's cryptographic key rotation policies and third-party API permission scopes.

Action Items:
1. Log into audit portal: https://security.cloudscale.io/audits/2026-soc2
2. Review the Google OAuth scopes requested for MailEven (Gmail readonly, Calendar, Tasks)
3. Provide your cryptographic sign-off before Thursday, September 10 at 5:00 PM EST.

Failure to complete this by the cutoff will flag a control deficiency on our public compliance report.

Security Compliance Office
CloudScale Inc.`,
    receivedAt: new Date(Date.now() - 1000 * 60 * 110).toISOString(),
    summary: "Mandatory SOC-2 Type II audit review requires completing API scope verification and cryptographic sign-off before Thursday 5:00 PM EST.",
    isActionable: true,
    actionType: "task",
    eventProposal: null,
    taskProposal: {
      title: "Complete SOC-2 Security Audit & API Scope Sign-off",
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 72).toISOString(),
      notes: "Log into https://security.cloudscale.io/audits/2026-soc2 and review Google OAuth scopes for MailEven before Thursday deadline.",
      priority: "high",
    },
    tags: ["Work", "Urgent"],
    briefingStatus: "pending",
  },
  {
    id: "mock_email_7",
    accountId: "demo_acc_personal",
    accountEmail: "alex.personal@gmail.com",
    sender: "sarah.chen91@gmail.com",
    senderName: "Sarah Chen",
    recipient: "alex.personal@gmail.com",
    subject: "Sunday Family Dinner & Dad's 60th Birthday Surprise!",
    snippet: "Hey! We are organizing Dad's surprise dinner this Sunday at 6:30 PM at Osteria del Sol...",
    bodyText: `Hey Alex!

Don't forget — Dad's 60th birthday surprise dinner is this Sunday!
We booked the private garden patio at Osteria del Sol (1420 Columbus Ave).

Time: Sunday at 6:30 PM (arrive by 6:15 PM so we are all seated before Mom brings him in!).
Can you bring the photo album we put together? Also let me know if you want to split the cake cost.

Can't wait to see you!
Sarah`,
    receivedAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    summary: "Family gathering for Dad's 60th birthday surprise dinner this Sunday at 6:30 PM at Osteria del Sol (arrive by 6:15 PM). Bring the photo album.",
    isActionable: true,
    actionType: "event",
    eventProposal: {
      title: "Dad's 60th Birthday Surprise Dinner",
      startTime: new Date(Date.now() + 1000 * 60 * 60 * 140).toISOString(),
      endTime: new Date(Date.now() + 1000 * 60 * 60 * 143).toISOString(),
      location: "Osteria del Sol (1420 Columbus Ave)",
      description: "Surprise dinner party for Dad. Arrive by 6:15 PM before Dad arrives. Bring photo album.",
    },
    taskProposal: null,
    tags: ["Personal"],
    briefingStatus: "pending",
  },
  {
    id: "mock_email_4",
    accountId: "demo_acc_work",
    accountEmail: "alex.chen@workplace.com",
    sender: "billing@aws.amazon.com",
    senderName: "Amazon Web Services",
    recipient: "alex.chen@workplace.com",
    subject: "Amazon Web Services Invoice #91823901 Available",
    snippet: "Your AWS monthly invoice of $142.80 for account ending in 4920 is now ready for review...",
    bodyText: `Dear AWS Customer,

Your monthly invoice for the billing period August 1 - August 31, 2026 is now available.

Account ID: 4920-8192-3301
Total Amount Due: $142.80 USD
Payment Due Date: September 15, 2026
Payment Method: Automatic credit card charge (Mastercard ending in 9102)

Breakdown by service:
- Amazon Bedrock & AI Compute: $84.20
- AWS Lambda & Edge Routing: $28.50
- Amazon S3 & Data Transfer: $30.10

View PDF invoice in AWS Billing Console: https://console.aws.amazon.com/billing`,
    receivedAt: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
    summary: "AWS monthly bill for August is $142.80 USD, scheduled for automatic charge on Sept 15 via Mastercard ending in 9102.",
    isActionable: true,
    actionType: "task",
    eventProposal: null,
    taskProposal: {
      title: "Review AWS Invoice ($142.80) & Verify GPU Compute Charges",
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 120).toISOString(),
      notes: "Total bill $142.80 due Sept 15. Check Amazon Bedrock & compute usage in AWS console.",
      priority: "medium",
    },
    tags: ["Finance"],
    briefingStatus: "pending",
  },
  {
    id: "mock_email_8",
    accountId: "demo_acc_personal",
    accountEmail: "alex.personal@gmail.com",
    sender: "care@baydentalhealth.com",
    senderName: "Bay Dental Health",
    recipient: "alex.personal@gmail.com",
    subject: "Appointment Reminder: Semi-annual Dental Cleaning on Wednesday",
    snippet: "Dr. Reyes is looking forward to seeing you this Wednesday, September 9 at 10:00 AM...",
    bodyText: `Bay Dental Health

Hi Alex,

This is a confirmation reminder for your upcoming semi-annual prophylaxis and examination with Dr. Reyes.

Date: Wednesday, September 9, 2026
Time: 10:00 AM - 10:45 AM PST
Location: 450 Sutter St #1200, San Francisco, CA 94108

Please notify us 24 hours in advance if you need to reschedule.
Parking validation available in the Sutter-Stockton garage.`,
    receivedAt: new Date(Date.now() - 1000 * 60 * 420).toISOString(),
    summary: "Dental examination and cleaning with Dr. Reyes confirmed for Wednesday at 10:00 AM PST at 450 Sutter St.",
    isActionable: true,
    actionType: "event",
    eventProposal: {
      title: "Dental Examination & Cleaning (Dr. Reyes)",
      startTime: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(),
      endTime: new Date(Date.now() + 1000 * 60 * 60 * 49).toISOString(),
      location: "450 Sutter St #1200, San Francisco, CA",
      description: "Semi-annual prophylaxis and examination with Dr. Reyes.",
    },
    taskProposal: null,
    tags: ["Personal"],
    briefingStatus: "pending",
  },
  {
    id: "mock_email_5",
    accountId: "demo_acc_personal",
    accountEmail: "alex.personal@gmail.com",
    sender: "digest@tldr.tech",
    senderName: "TLDR Tech",
    recipient: "alex.personal@gmail.com",
    subject: "TLDR Tech: The Rise of Real-Time Agentic Workflows",
    snippet: "Big tech unveils unified multimodal reasoning APIs, browser use capabilities expand, and open-source models hit new benchmarks...",
    bodyText: `TLDR Tech — Daily Roundup for Engineers & Founders

1. HEADLINES
Autonomous coding agents are moving from text chat to full-blown environment controllers with native tool execution and reactive wakeups. New benchmarks reveal a 3x drop in latency for structured schema generation.

2. DEVELOPER TOOLS
- Fast Next.js server actions vs edge handlers: when to use each in production.
- Prisma 5.22 optimization techniques for high-concurrency SQLite applications.

3. SPONSOR
Simplify your cloud deployments with Zero-Config infrastructure.

To manage subscription preferences or unsubscribe, click here.`,
    receivedAt: new Date(Date.now() - 1000 * 60 * 550).toISOString(),
    summary: "Daily tech newsletter featuring advancements in autonomous agentic workflows, API latency benchmarks, and Next.js server performance tips.",
    isActionable: false,
    actionType: "none",
    eventProposal: null,
    taskProposal: null,
    tags: ["Newsletters"],
    briefingStatus: "dismissed",
  },
  {
    id: "mock_email_6",
    accountId: "demo_acc_personal",
    accountEmail: "alex.personal@gmail.com",
    sender: "deals@gearpatrol.com",
    senderName: "Gear Patrol Store",
    recipient: "alex.personal@gmail.com",
    subject: "Flash Sale: Up to 40% off Minimalist Desk Setups & Monitors",
    snippet: "Exclusive member access: 40% discount on ergonomic standing desks, mechanical keyboards, and 4K displays...",
    bodyText: `Gear Patrol Members Exclusive:

Upgrade your workspace with our curated productivity collection.
- ErgoLift Pro Desk: $499 (was $799)
- Studio Mechanical Keyboard: $120
- Ambient Matte Desk Mat: $35

Use checkout code: ELEVATE26
Sale ends midnight tonight. Free shipping on all orders over $75.`,
    receivedAt: new Date(Date.now() - 1000 * 60 * 720).toISOString(),
    summary: "Promotional flash sale offering up to 40% off desks and desk accessories using code ELEVATE26 through midnight tonight.",
    isActionable: false,
    actionType: "none",
    eventProposal: null,
    taskProposal: null,
    tags: ["Promotions"],
    briefingStatus: "dismissed",
  },
  {
    id: "mock_email_code2create",
    accountId: "demo_acc_personal",
    accountEmail: "alex.personal@gmail.com",
    sender: "hackathon@vit.edu",
    senderName: "Code2Create Organizing Committee",
    recipient: "alex.personal@gmail.com",
    subject: "URGENT: Code2Create Hackathon Submission Deadline due Friday 11:59 PM",
    snippet: "Reminder to all teams: Final project repo link, demo video, and architecture documentation must be submitted before Friday...",
    bodyText: `Dear Participant,

This is an urgent reminder regarding your team's Code2Create 2026 hackathon submission.

Submission Deadline: Friday, September 11, 2026 at 11:59 PM IST.
Portal: https://code2create.vit.edu/submit/team-maileven

Required Deliverables:
1. GitHub public repository link with clean README.
2. 3-minute unlisted YouTube video walkthrough.
3. System architecture diagram and Groq model usage breakdown.

Late submissions will not be eligible for judge evaluations.

Best of luck,
Code2Create Technical Committee`,
    receivedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 mins ago
    summary: "Mandatory Code2Create project submission deadline on Friday at 11:59 PM IST requiring GitHub repo link, video demo, and architecture breakdown.",
    isActionable: true,
    actionType: "task",
    eventProposal: null,
    taskProposal: {
      title: "Submit Code2Create Hackathon Project & Video Demo",
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(),
      notes: "Upload public GitHub repo link and 3-min video walkthrough to https://code2create.vit.edu/submit/team-maileven before Friday 11:59 PM.",
      priority: "high",
    },
    tags: ["College", "Urgent"],
    category: "College",
    priority: "high",
    personalizationReason: "High priority because you consistently prioritize College deadlines and prefer creating tasks for them.",
    personalizationConfidence: 0.94,
    briefingStatus: "pending",
  },
  {
    id: "mock_email_amazon",
    accountId: "demo_acc_personal",
    accountEmail: "alex.personal@gmail.com",
    sender: "ship-confirm@amazon.com",
    senderName: "Amazon.com Shipping",
    recipient: "alex.personal@gmail.com",
    subject: "Amazon.com: Your package has shipped! (Order #114-8912891-28192)",
    snippet: "Your package containing Anker USB-C Hub has shipped and is estimated to arrive tomorrow by 8:00 PM...",
    bodyText: `Hi Alex,

Great news! Your package has shipped and will arrive tomorrow, Wednesday, September 9 by 8:00 PM.

Item:
Anker 7-in-1 USB-C Hub Multi-Port Adapter
Carrier: Amazon Logistics (Tracking: TBA9182390192)

Track your package: https://www.amazon.com/progress-tracker/package/114-8912891

Thank you for shopping with Amazon!`,
    receivedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    summary: "Amazon package with Anker USB-C Hub has shipped via Amazon Logistics, scheduled for delivery tomorrow by 8:00 PM.",
    isActionable: false,
    actionType: "none",
    eventProposal: null,
    taskProposal: null,
    tags: ["Shopping"],
    category: "Shopping",
    priority: "low",
    personalizationReason: "Low priority because you previously marked shopping emails as low priority.",
    personalizationConfidence: 0.89,
    briefingStatus: "dismissed",
  },
];
