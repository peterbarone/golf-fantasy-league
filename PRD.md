🏗️ Golf Fantasy League - Task Breakdown
🧱 Project Setup
 Initialize Next.js project with TypeScript and Tailwind CSS

 Set up PostgreSQL connection (e.g. via Prisma or pg)

 Configure environment variables for database and server

🔐 Authentication (NextAuth.js)
 Install and configure NextAuth.js with Credentials Provider

 Create login UI with email + password

 Hash passwords with bcrypt when seeding users

 Restrict access based on user role (admin vs owner)

 Seed 7 owner accounts and 1 admin

🗃️ Database Schema (PostgreSQL)
 Create users table (admin/owner with password hash)

 Create teams table (1 per user)

 Create golfers table (all PGA golfers)

 Create team_roster table (12 golfers per team)

 Create tournaments table (30 events with flags)

 Create tournament_lineups table (up to 6 golfers per tournament)

 Create golfer_results table (admin input results)

 Create team_points table (per tournament)

 Create tournament_skins table (bonus payouts tracking)

🧑‍💼 Admin Functionality
 Admin dashboard to:

 View all teams and owners

 Manually assign 12 golfers to each team

 Create and edit tournaments (name, date, flags)

 Input golfer results (place, cut, match play info)

 Trigger point calculation for each tournament

 Auto-calculate and store points per team

 Calculate skins winner and manage carry-over logic

🧑‍💻 Owner Functionality
 Dashboard showing:

 Team name and roster

 Upcoming tournament info

 Form to select up to 6 active golfers for the week

 Submit lineup (locked before first tee-off)

 Historical performance per golfer/team

 Current season standings and payouts

📈 Standings & Scoring
 Weekly standings page with:

 Total season points

 Tournament-by-tournament breakdown

 Weekly winners section for $1 and $2 skins

 End-of-season ranking with payouts

 Tie-breaker handling (optional logic)

🧪 Testing
 Write seed script for dummy golfers, users, and 1–2 tournaments

 Validate point logic for regular, Major, WGC, and Match Play

 Test deadline enforcement (Tues 7PM for drops, Thurs AM for lineups)

🧰 Utilities & Deployment
 Set up protected API routes

 Create reusable date/time check functions (lineup lock)

 Deploy to VPS or Vercel (if public)

 Set up database backup or export feature

