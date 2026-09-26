import { offlineDataResponse } from './offlineData';
export const MOCK_RESPONSES: Record<string, string> = {
  laptops: `root = Stack([title, tbl, notes])
title = TextContent("Laptop Comparison 2026", "large-heavy")
tbl = Table([Col("Model", models), Col("Processor", cpus), Col("RAM", rams), Col("Storage", storages), Col("Battery", batteries), Col("Price", prices)])
models = ["MacBook Pro 16", "Dell XPS 15", "Lenovo ThinkPad X1"]
cpus = ["Apple M3 Max (16-core)", "Intel Core Ultra 9 185H", "Intel Core Ultra 7 165U"]
rams = ["36 GB Unified", "32 GB DDR5", "32 GB LPDDR5X"]
storages = ["1 TB SSD", "1 TB PCIe NVMe", "1 TB PCIe Gen 4"]
batteries = ["Up to 22 hrs", "Up to 12 hrs", "Up to 15 hrs"]
prices = ["$3,499", "$2,399", "$2,199"]
notes = Callout("info", "Recommendation", "The MacBook Pro leads in battery life & raw GPU performance, while the XPS 15 provides standard PC upgradability.")`,

  travel: `root = Stack([header, tripOverview, itineraryTabs])
header = TextContent("7-Day Tokyo Exploration Itinerary", "large-heavy")
tripOverview = Callout("success", "Trip Summary", "7 days exploring Shibuya, Shinjuku, Asakusa, Akihabara, Mount Fuji day trip, and cultural temples.")
itineraryTabs = Tabs([day1Tab, day2Tab, day3Tab, day4Tab, day5Tab, day6Tab, day7Tab])
day1Tab = TabItem("d1", "Day 1: Arrival", [day1Content])
day1Content = TextContent("Arrive at Narita/Haneda Airport & pick up Suica card. Check into hotel in Shinjuku and enjoy evening stroll.")
day2Tab = TabItem("d2", "Day 2: Shibuya", [day2Content])
day2Content = TextContent("Visit Meiji Jingu Shrine and Yoyogi Park. Walk through Takeshita Street in Harajuku and Shibuya Sky.")
day3Tab = TabItem("d3", "Day 3: Asakusa", [day3Content])
day3Content = TextContent("Senso-ji Temple & Nakamise shopping street, followed by Sumida River boat cruise to Hama-rikyu Gardens.")
day4Tab = TabItem("d4", "Day 4: Akihabara", [day4Content])
day4Content = TextContent("Explore Electric Town, retro gaming stores, Kanda Myojin Shrine, and Ueno Park museums.")
day5Tab = TabItem("d5", "Day 5: Mt Fuji", [day5Content])
day5Content = TextContent("Day tour to Lake Kawaguchiko, Chureito Pagoda panoramic viewpoint, and local noodle lunch.")
day6Tab = TabItem("d6", "Day 6: Ginza", [day6Content])
day6Content = TextContent("Tsukiji Outer Market fresh breakfast, TeamLab Planets immersive digital art, and Ginza shopping.")
day7Tab = TabItem("d7", "Day 7: Departure", [day7Content])
day7Content = TextContent("Tokyo Station shopping arcade for souvenirs and Narita Express / Monorail to airport.")`,

  recursion: `root = Stack([title, explanation, demoHeader, demoCard, factorialTable])
title = TextContent("Understanding Recursion", "large-heavy")
explanation = Callout("info", "Core Concept", "Recursion occurs when a function solves a problem by calling smaller instances of itself until it reaches a base condition.")
demoHeader = InlineHeader("Recursive Call Stack: Factorial (5!)", "Step-by-step resolution")
demoCard = SnippetCardBlock([step1, step2, step3])
step1 = SnippetCardItem("base", step1lhs, step1rhs)
step1lhs = IconText(step1icon, "neutral", "m", "Base Case: n == 1", "Returns 1 immediately", false, "horizontal")
step1icon = Icon("check-circle", "general")
step1rhs = BoldText("number", "1", "Terminates", "metric")
step2 = SnippetCardItem("unwind", step2lhs, step2rhs)
step2lhs = IconText(step2icon, "neutral", "m", "Recursive Step", "5 * 4 * 3 * 2 * 1", false, "horizontal")
step2icon = Icon("refresh-cw", "arrows")
step2rhs = BoldText("number", "120", "5! Result", "metric")
step3 = SnippetCardItem("depth", step3lhs, step3rhs)
step3lhs = IconText(step3icon, "neutral", "m", "Stack Depth", "Call frame allocations", false, "horizontal")
step3icon = Icon("layers", "layout")
step3rhs = BoldText("number", "5 Frames", "O(N) Space", "metric")
factorialTable = Table([Col("Call", calls), Col("Condition", conds), Col("Action", acts), Col("Return Value", rets)])
calls = ["factorial(5)", "factorial(4)", "factorial(3)", "factorial(2)", "factorial(1)"]
conds = ["n > 1", "n > 1", "n > 1", "n > 1", "n == 1 (Base)"]
acts = ["5 * factorial(4)", "4 * factorial(3)", "3 * factorial(2)", "2 * factorial(1)", "return 1"]
rets = ["120", "24", "6", "2", "1"]`,

  dashboard: `root = Stack([dashTitle, kpiBlock, chartHeader, burnChart, taskHeader, taskTable])
dashTitle = TextContent("Sprint 14 Performance Dashboard", "large-heavy")
kpiBlock = SnippetCardBlock([kpi1, kpi2, kpi3])
kpi1 = SnippetCardItem("velocity", kpi1lhs, kpi1rhs)
kpi1lhs = IconText(kpi1icon, "neutral", "m", "Completed Story Points", "Target: 45 pts", false, "horizontal")
kpi1icon = Icon("target", "general")
kpi1rhs = BoldText("number", "42", "+93%", "metric")
kpi2 = SnippetCardItem("bugs", kpi2lhs, kpi2rhs)
kpi2lhs = IconText(kpi2icon, "neutral", "m", "Resolved Issues", "0 critical blockers", false, "horizontal")
kpi2icon = Icon("check-circle-2", "general")
kpi2rhs = BoldText("number", "18", "-3 vs last sprint", "metric")
kpi3 = SnippetCardItem("cycle", kpi3lhs, kpi3rhs)
kpi3lhs = IconText(kpi3icon, "neutral", "m", "Avg Cycle Time", "From PR to Prod", false, "horizontal")
kpi3icon = Icon("clock", "time")
kpi3rhs = BoldText("number", "1.8 days", "-0.4 days", "metric")
chartHeader = InlineHeader("Sprint Velocity History", "Story points delivered over the last 4 sprints")
burnChart = BarChart(sprintLabels, [completedPts, committedPts], "grouped")
sprintLabels = ["Sprint 11", "Sprint 12", "Sprint 13", "Sprint 14"]
completedPts = Series("Completed", [36, 40, 38, 42])
committedPts = Series("Committed", [40, 42, 45, 45])
taskHeader = InlineHeader("Current Sprint Backlog", "Real-time task tracking")
taskTable = Table([Col("Task ID", taskIds), Col("Description", taskDescs), Col("Assignee", assignees), Col("Status", statuses)])
taskIds = ["ENG-201", "ENG-204", "ENG-209", "ENG-212"]
taskDescs = ["Migrate to OpenUI streaming renderer", "Implement provider gateway interface", "Add dark mode design tokens", "Bundle size optimization"]
assignees = ["Danil K.", "Alex M.", "Sarah T.", "Danil K."]
statuses = ["Done", "Done", "In Review", "In Progress"]`,

  workout: `root = Stack([planTitle, calloutIntro, workoutTabs])
planTitle = TextContent("4-Day Hypertrophy & Strength Split", "large-heavy")
calloutIntro = Callout("info", "Weekly Schedule", "Upper / Lower split with 3 recovery days. Rest 90-120s between heavy compounds and 60s on accessories.")
workoutTabs = Tabs([tabUpperA, tabLowerA, tabUpperB, tabLowerB])
tabUpperA = TabItem("u1", "Day 1: Upper A", [upperATable])
upperATable = Table([Col("Exercise", u1Ex), Col("Sets", u1Sets), Col("Reps", u1Reps), Col("RPE", u1Rpe)])
u1Ex = ["Barbell Bench Press", "Barbell Bent-Over Row", "Overhead DB Press", "Lat Pulldowns", "Incline DB Curls", "Tricep Rope Pushdowns"]
u1Sets = [4, 4, 3, 3, 3, 3]
u1Reps = ["6-8", "8-10", "8-10", "10-12", "12-15", "12-15"]
u1Rpe = ["8", "8", "8.5", "8.5", "9", "9"]
tabLowerA = TabItem("l1", "Day 2: Lower A", [lowerATable])
lowerATable = Table([Col("Exercise", l1Ex), Col("Sets", l1Sets), Col("Reps", l1Reps), Col("RPE", l1Rpe)])
l1Ex = ["Barbell Back Squats", "Romanian Deadlifts (RDL)", "Leg Press", "Standing Calf Raises", "Hanging Leg Raises"]
l1Sets = [4, 3, 3, 4, 3]
l1Reps = ["6-8", "8-10", "10-12", "12-15", "15-20"]
l1Rpe = ["8.5", "8", "8.5", "9", "8.5"]
tabUpperB = TabItem("u2", "Day 4: Upper B", [upperBTable])
upperBTable = Table([Col("Exercise", u2Ex), Col("Sets", u2Sets), Col("Reps", u2Reps), Col("RPE", u2Rpe)])
u2Ex = ["Incline DB Press", "Neutral Grip Pull-ups", "Cable Lateral Raises", "Seated Cable Rows", "Skull Crushers", "Hammer Curls"]
u2Sets = [4, 4, 4, 3, 3, 3]
u2Reps = ["8-10", "6-8", "12-15", "10-12", "10-12", "12-15"]
u2Rpe = ["8.5", "8.5", "9", "8", "9", "9"]
tabLowerB = TabItem("l2", "Day 5: Lower B", [lowerBTable])
lowerBTable = Table([Col("Exercise", l2Ex), Col("Sets", l2Sets), Col("Reps", l2Reps), Col("RPE", l2Rpe)])
l2Ex = ["Conventional Deadlift", "Bulgarian Split Squats", "Lying Hamstring Curls", "Leg Extensions", "Seated Calf Raises"]
l2Sets = [3, 3, 3, 3, 4]
l2Reps = ["5", "8-10 / leg", "10-12", "12-15", "15"]
l2Rpe = ["8.5", "9", "8.5", "9", "9"]`,
};

export function getMockResponseForPrompt(prompt: string): string {
  const data = offlineDataResponse(prompt);
  if (data) return data;
  const examples: Record<string, string> = {
    'compare three laptops in a table.': 'laptops',
    'create a 7-day travel itinerary.': 'travel',
    'explain recursion with an interactive example.': 'recursion',
    'create a simple project dashboard.': 'dashboard',
    'make a workout plan.': 'workout',
  };
  const example = examples[prompt.trim().toLowerCase()];
  if (example) return MOCK_RESPONSES[example].replace('Stack([', 'Stack([demoNotice, ') + '\ndemoNotice = Callout("info", "Offline example", "This is a fixed sample with illustrative content, not a personalized answer. Connect OpenAI for custom responses.")';
  return 'root = Stack([title, notice, request])\ntitle = TextContent("Ready for your prompt", "large-heavy")\nnotice = Callout("info", "Offline demo", "Custom answers need a running backend with OPENAI_API_KEY configured. You can still paste CSV and ask for a table without a connection. Your request is shown below; no answer has been generated.")\nrequest = TextContent(' + JSON.stringify(prompt) + ')';
}
