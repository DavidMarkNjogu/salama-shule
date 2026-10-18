// Demo content written by the team. Loaded from this file (no authoring UI in v1).
export type Lesson = { id: string; title: string; body: string[] };
export type Question = {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};
export type Unit = {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
  quiz: { id: string; title: string; questions: Question[] };
};

export const SAMPLE_UNIT: Unit = {
  id: "safe-online-101",
  title: "Staying safe online",
  description:
    "Three short lessons and a practice quiz on passwords, scams and shared networks. Download once, study anywhere.",
  lessons: [
    {
      id: "passwords",
      title: "Strong passwords and passphrases",
      body: [
        "Length beats cleverness. A passphrase of four or more unrelated words, such as river-lamp-mango-train, is easier to remember and harder to guess than a short word with symbols swapped in.",
        "Never reuse a password. If one site leaks it, attackers try the same password on your email and mobile money accounts next.",
        "Turn on two-step verification wherever it is offered. Even if someone learns your password, they still need the code sent to your phone.",
      ],
    },
    {
      id: "scams",
      title: "Spotting phishing and SMS scams",
      body: [
        "Scammers create urgency: 'your account is blocked', 'you won a prize', 'send your PIN now'. Real banks and mobile money providers never ask for your PIN or full password.",
        "Check the sender and the link. Look-alike addresses such as safaricom-promo.example.xyz are not the real company. When unsure, go to the official app or call the official number yourself.",
        "If you clicked or replied by mistake, change the affected passwords from a safe device and tell your provider quickly.",
      ],
    },
    {
      id: "networks",
      title: "Shared Wi-Fi and shared devices",
      body: [
        "Public Wi-Fi can be watched by other people on the same network. Avoid banking or password changes there. Your own mobile data is safer.",
        "On a shared phone or computer, use private browsing, never tick 'remember me', and sign out when you finish.",
        "Install security updates promptly. Many updates fix holes attackers already know about.",
      ],
    },
  ],
  quiz: {
    id: "safe-online-101-quiz",
    title: "Practice quiz: staying safe online",
    questions: [
      {
        id: "q1",
        text: "Which password is the strongest?",
        options: ["kenya2026", "P@ssw0rd", "river-lamp-mango-train-47", "123456abc"],
        correctIndex: 2,
        explanation:
          "A long passphrase of unrelated words is hard to guess and easy to remember.",
      },
      {
        id: "q2",
        text: "An SMS says your mobile money account is blocked and asks you to send your PIN to unlock it. What do you do?",
        options: [
          "Send the PIN quickly to avoid losing access",
          "Ignore it and never share your PIN; contact the provider through its official channel",
          "Reply asking who they are",
          "Forward it to your friends as a warning with your PIN removed",
        ],
        correctIndex: 1,
        explanation: "Providers never ask for your PIN. Use only official channels.",
      },
      {
        id: "q3",
        text: "What does two-step verification add?",
        options: [
          "A second proof, such as a code sent to your phone",
          "A longer password automatically",
          "Faster login",
          "A backup of your photos",
        ],
        correctIndex: 0,
        explanation:
          "A stolen password alone is not enough when a second proof is required.",
      },
      {
        id: "q4",
        text: "You are at a cafe with free public Wi-Fi. What is the safest choice for checking your bank balance?",
        options: [
          "Use the cafe Wi-Fi; it is free",
          "Use your own mobile data",
          "Use the cafe computer and tick 'remember me'",
          "Ask a stranger to check for you",
        ],
        correctIndex: 1,
        explanation: "Public networks can be watched. Your mobile data is safer.",
      },
      {
        id: "q5",
        text: "A message links to safaricom-promo.example.xyz offering free data. What is the best action?",
        options: [
          "Open it quickly before the offer ends",
          "Enter your number to see if you qualify",
          "Do not open it; check offers in the official app",
          "Share it with your class group",
        ],
        correctIndex: 2,
        explanation:
          "Look-alike addresses are a common trick. Use the official app.",
      },
      {
        id: "q6",
        text: "When should you install a security update on your phone?",
        options: [
          "Never, it slows the phone",
          "Only after a year",
          "Soon after it is available",
          "Only if the phone breaks",
        ],
        correctIndex: 2,
        explanation: "Updates often fix security holes that are already being used.",
      },
    ],
  },
};
