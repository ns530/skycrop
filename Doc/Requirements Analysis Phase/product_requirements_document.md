
# PRODUCT REQUIREMENTS DOCUMENT (PRD)

## SkyCrop: Satellite-Based Paddy Field Management & Monitoring System

---

## DOCUMENT CONTROL

| **Item** | **Details** |
|----------|-------------|
| **Document Title** | Product Requirements Document (PRD) |
| **Project Name** | SkyCrop - Intelligent Paddy Field Monitoring System |
| **Document Code** | SKYCROP-PRD-2025-001 |
| **Version** | 1.0 |
| **Date** | October 28, 2025 |
| **Prepared By** | Product Manager |
| **Reviewed By** | Business Analyst, UX Lead |
| **Approved By** | Project Sponsor |
| **Status** | Approved |
| **Confidentiality** | Internal - For Stakeholders Only |

---

## EXECUTIVE SUMMARY

### Product Vision

**SkyCrop** empowers Sri Lankan paddy farmers with satellite-powered intelligence to make data-driven decisions, increase yields, reduce costs, and build resilience against climate challenges—all through a simple mobile-first platform.

### Product Mission

To democratize precision agriculture technology for small-scale paddy farmers in Sri Lanka by providing affordable, accessible, and actionable insights derived from satellite imagery and artificial intelligence.

### Target Market

**Primary Market:**
- **Size:** 1.8 million paddy farmers in Sri Lanka
- **Serviceable Market:** 1.05 million farmers with smartphones (58%)
- **Target (Year 1):** 100 farmers (pilot phase)
- **Target (Year 3):** 5,000 farmers (0.28% market penetration)

**User Demographics:**
- Small to medium-scale paddy farmers (0.5-5 hectares)
- Age: 25-60 years (60% are 35-55)
- Smartphone ownership: 65% (growing 10%/year)
- Basic digital literacy
- Income: Rs. 300,000-800,000/year

### Key Success Metrics

| **Metric** | **Target** | **Timeline** |
|------------|------------|--------------|
| **User Adoption** | 100 farmers | Year 1 (Month 4) |
| **User Satisfaction** | ≥4.0/5.0 (NPS ≥40) | Month 6 |
| **AI Accuracy** | ≥85% (boundary detection, yield prediction) | Week 8 |
| **System Uptime** | ≥99% | Ongoing |
| **Yield Improvement** | +15-25% for users | Year 1 |
| **Cost Savings** | 20-30% water, 15-20% fertilizer | Year 1 |
| **Feature Adoption** | ≥70% use core features | Month 3 |

### Strategic Alignment

**UN Sustainable Development Goals (SDGs):**
- ✅ SDG 1: No Poverty (increase farmer income)
- ✅ SDG 2: Zero Hunger (increase food production)
- ✅ SDG 6: Clean Water (optimize irrigation)
- ✅ SDG 13: Climate Action (climate-smart agriculture)

**Sri Lanka Agricultural Policy 2023-2028:**
- ✅ Increase paddy productivity by 20%
- ✅ Promote sustainable farming practices
- ✅ Strengthen climate resilience
- ✅ Digitalize agricultural extension

---

## TABLE OF CONTENTS

1. [Product Overview](#1-product-overview)
2. [User Personas](#2-user-personas)
3. [User Journey Maps](#3-user-journey-maps)
4. [Feature Requirements](#4-feature-requirements)
5. [Functional Requirements](#5-functional-requirements)
6. [Non-Functional Requirements](#6-non-functional-requirements)
7. [User Interface Requirements](#7-user-interface-requirements)
8. [Integration Requirements](#8-integration-requirements)
9. [Success Metrics & KPIs](#9-success-metrics--kpis)
10. [Assumptions and Constraints](#10-assumptions-and-constraints)
11. [Release Strategy](#11-release-strategy)
12. [Appendices](#12-appendices)

---

## 1. PRODUCT OVERVIEW

### 1.1 Problem Statement

Sri Lankan paddy farmers face critical challenges that result in Rs. 40-60 billion annual economic loss:

**Problem 1: Limited Crop Visibility**
- Farmers cannot accurately monitor large-scale fields in real-time
- Health issues detected only when visible symptoms appear (often too late)
- **Impact:** 10-15% yield loss due to delayed intervention

**Problem 2: Inefficient Resource Management**
- Water and fertilizer applied uniformly without considering spatial variation
- No scientific measurement of actual plant needs
- **Impact:** 30-40% water wastage, Rs. 5,000-10,000 wasted on excess fertilizer per hectare

**Problem 3: Unpredictable Yields**
- No scientific methods to predict harvest quantities
- Farmers estimate based on experience/guesswork
- **Impact:** Poor market planning, Rs. 10,000-20,000 potential income loss per season

**Problem 4: Inadequate Disaster Assessment**
- Manual, subjective damage assessment after floods/droughts
- Delayed insurance claims (3-6 months typical)
- **Impact:** Rs. 2-5 billion annual uninsured losses, farmer debt

**Problem 5: Information Gap**
- Limited access to timely, localized agricultural information
- Extension officer ratio: 1:1000 farmers (insufficient coverage)
- **Impact:** Poor decision-making, slow adoption of best practices

### 1.2 Solution Overview

**SkyCrop** is a cloud-based, AI-powered agricultural intelligence platform that transforms satellite imagery into actionable farming insights through:

**Core Capabilities:**
1. **Automated Field Mapping** - AI detects field boundaries in <60 seconds
2. **Crop Health Monitoring** - Real-time NDVI, NDWI, TDVI indices with color-coded maps
3. **Precision Recommendations** - Water and fertilizer guidance based on plant health
4. **Yield Prediction** - ML-powered harvest forecasts (85%+ accuracy)
5. **Disaster Assessment** - Before/after comparison with financial loss estimation
6. **Weather Intelligence** - 7-day forecasts with field-specific alerts
7. **Knowledge Hub** - Agricultural news, best practices, market prices

**Technology Stack:**
- **Data Source:** Sentinel-2 satellite (10m resolution, 5-day revisit, FREE)
- **AI/ML:** U-Net (boundary detection), Random Forest (yield prediction)
- **Platforms:** Responsive web app + cross-platform mobile (Android/iOS)
- **Architecture:** Cloud-native, RESTful API, scalable infrastructure

### 1.3 Product Positioning

**Market Position:** Affordable, high-tech, accessible precision agriculture for small-scale farmers

**Competitive Differentiation:**

| **Aspect** | **SkyCrop** | **Competitors (Cropio, FarmBeats)** |
|------------|-------------|-------------------------------------|
| **Price** | Free tier + Rs. 1,500/season premium | $200-1,000/year |
| **Target** | Small-scale farmers (0.5-5 ha) | Large farms, agribusinesses |
| **Localization** | Sri Lanka-specific, Sinhala/Tamil (Phase 2) | International, English only |
| **Complexity** | Mobile-first, 3 taps to insights | Desktop-heavy, complex UI |
| **Infrastructure** | Satellite only (no hardware) | Requires IoT sensors, drones |
| **Support** | WhatsApp helpline, local language | Email support, English |

**Value Proposition:**
> "Satellite-powered farming intelligence in your pocket—increase yields by 15-25%, reduce costs by 20-30%, all for less than the cost of one bag of fertilizer."

### 1.4 Key Differentiators

1. **Cost Leadership:** 80% cheaper than competitors (free satellite data + efficient algorithms)
2. **Simplicity:** Designed for users with basic digital literacy (3 taps to insights)
3. **Mobile-First:** Works on low-end smartphones, optimized for 3G networks
4. **AI-Powered:** Automated insights, no manual interpretation needed
5. **Holistic:** Monitoring + prediction + disaster + weather in one platform
6. **Open Data:** Farmers own their data, no vendor lock-in
7. **Local Context:** Sri Lankan crops, climate, farming practices

---

## 2. USER PERSONAS

### 2.1 Primary Persona: Sunil - The Progressive Farmer

**Demographics:**
- **Age:** 42 years
- **Location:** Polonnaruwa district (major paddy region)
- **Farm Size:** 2 hectares (medium-scale)
- **Education:** Secondary school (Grade 10)
- **Family:** Married, 2 children (ages 12, 15)
- **Annual Income:** Rs. 600,000 (paddy farming + side business)

**Technology Profile:**
- **Smartphone:** Samsung Galaxy A12 (budget Android)
- **Internet:** 4G mobile data (Rs. 500/month prepaid)
- **Apps Used:** WhatsApp (daily), Facebook (weekly), mobile banking (monthly)
- **Digital Literacy:** Moderate (can install apps, use social media, but struggles with complex interfaces)

**Goals & Motivations:**
- Increase yield to afford children's education
- Reduce water bills (Rs. 50,000/year for irrigation)
- Make farming profitable enough to keep children interested
- Adopt modern farming methods to stay competitive
- Reduce uncertainty and stress from unpredictable harvests

**Pain Points:**
- "I don't know if my crop is healthy until it's too late"
- "I waste water because I don't know when the plants actually need it"
- "Every year I guess how much I'll harvest—sometimes I'm way off"
- "After the flood last year, it took 4 months to get insurance money"
- "Agricultural officers visit once a month—I need help more often"

**Behaviors:**
- Checks WhatsApp 5-10 times/day
- Visits field every morning (6 AM)
- Discusses farming with neighbors at tea shop (evenings)
- Watches farming videos on YouTube (when internet is good)
- Trusts advice from agricultural extension officers

**Needs from SkyCrop:**
- Simple, visual interface (not text-heavy)
- Clear recommendations ("Do this now" not "NDVI is 0.65")
- Works on slow internet (3G)
- Sinhala language support (Phase 2)
- WhatsApp support (familiar channel)

**Success Scenario:**
> "I open SkyCrop on my phone, see my field is yellow in one corner (water stress), and get a message: 'Irrigate Zone C in 2 days.' I follow the advice, save water, and my yield increases by 20%. I tell 5 neighbors about it."

**Quote:**
> "I don't need fancy technology—I need something that tells me what to do, when to do it, and helps me earn more."

---

### 2.2 Secondary Persona: Nimal - The Extension Officer

**Demographics:**
- **Age:** 35 years
- **Role:** Agricultural Extension Officer, Dept. of Agriculture
- **Coverage:** 800 farmers across 5 villages
- **Education:** BSc Agriculture (university degree)
- **Experience:** 8 years in extension services

**Technology Profile:**
- **Devices:** Laptop (office), smartphone (personal)
- **Internet:** Office WiFi + mobile data
- **Apps Used:** Email, WhatsApp, Google Maps, Excel
- **Digital Literacy:** High (comfortable with technology)

**Goals & Motivations:**
- Help more farmers with limited time (1:800 ratio)
- Provide data-driven advice (not just experience-based)
- Track farmer progress and outcomes
- Demonstrate impact to department (performance reviews)
- Adopt modern tools to improve efficiency

**Pain Points:**
- "I can only visit each farmer once a month—not enough"
- "Farmers call me with questions, but I can't always visit immediately"
- "I give generic advice because I don't have field-specific data"
- "Hard to track which farmers are following recommendations"
- "Department wants data on farmer outcomes—I have no system"

**Behaviors:**
- Visits 5-8 farmers per day (field visits)
- Conducts monthly training sessions (20-30 farmers)
- Responds to farmer calls/WhatsApp messages
- Reports to district office monthly
- Collaborates with other extension officers

**Needs from SkyCrop:**
- Dashboard to monitor all farmers in coverage area
- Ability to send targeted advice to specific farmers
- Data on farmer engagement and outcomes
- Integration with existing extension workflows
- Training materials to teach farmers

**Success Scenario:**
> "I use SkyCrop's admin dashboard to see which farmers have water stress issues. I send a WhatsApp message to 15 farmers: 'Check SkyCrop—your fields need irrigation.' They follow the advice, and I track the results. My monthly report shows 20% yield increase for SkyCrop users."

**Quote:**
> "SkyCrop is like having 10 more extension officers—it helps me reach farmers I can't visit and gives them advice when they need it."

---

### 2.3 Tertiary Persona: Kamala - The Female Farmer

**Demographics:**
- **Age:** 38 years
- **Location:** Anuradhapura district
- **Farm Size:** 0.8 hectares (small-scale)
- **Education:** Primary school (Grade 8)
- **Family:** Widowed, 3 children (ages 8, 11, 14)
- **Annual Income:** Rs. 350,000 (paddy farming only)

**Technology Profile:**
- **Smartphone:** Basic Android (Huawei Y5)
- **Internet:** 3G mobile data (Rs. 300/month prepaid)
- **Apps Used:** WhatsApp (daily), no other apps
- **Digital Literacy:** Low (can use WhatsApp, struggles with new apps)

**Goals & Motivations:**
- Support children's education (eldest wants to go to university)
- Increase income to reduce debt (Rs. 150,000 loan)
- Prove she can manage farm successfully (as a woman)
- Reduce physical labor (health issues)
- Access information without relying on male neighbors

**Pain Points:**
- "I can't afford to make mistakes—every rupee counts"
- "Male farmers don't take me seriously—I need proof my methods work"
- "I can't walk the entire field every day (back pain)"
- "I don't understand technical farming terms"
- "Extension officers rarely visit women farmers"

**Behaviors:**
- Checks WhatsApp in evening (after farm work)
- Relies on children to help with technology
- Attends women farmer group meetings (monthly)
- Cautious about trying new things (risk-averse)
- Seeks advice from other women farmers

**Needs from SkyCrop:**
- Extremely simple interface (visual, not text)
- Voice instructions (Phase 2 - accessibility)
- Works offline (caches data)
- Free tier (cannot afford subscription)
- Women-focused support group (WhatsApp)

**Success Scenario:**
> "My daughter helps me install SkyCrop. I see my field on the map (green = good, yellow = needs water). I follow the simple instructions and save Rs. 10,000 on water this season. I show other women farmers at our group meeting."

**Quote:**
> "I don't need to understand satellites—I just need to know: Is my crop healthy? What should I do?"

---

### 2.4 Admin Persona: Priya - The System Administrator

**Demographics:**
- **Age:** 28 years
- **Role:** SkyCrop Admin / Content Manager
- **Education:** BSc Computer Science
- **Experience:** 3 years in agri-tech

**Technology Profile:**
- **Devices:** Laptop, smartphone
- **Skills:** Web development, content management, data analysis
- **Digital Literacy:** Expert

**Goals & Motivations:**
- Manage platform content (news, events, weather)
- Monitor system health and user engagement
- Support farmers and extension officers
- Analyze data to improve product
- Ensure platform reliability

**Needs from SkyCrop:**
- Admin dashboard with analytics
- Content management system (CMS)
- User management tools
- System monitoring alerts
- Data export capabilities

---

## 3. USER JOURNEY MAPS

### 3.1 Farmer Onboarding Journey

**Persona:** Sunil (Progressive Farmer)  
**Goal:** Start using SkyCrop to monitor his 2-hectare paddy field  
**Duration:** 30 minutes (first-time setup)

#### Journey Stages

**Stage 1: Awareness (Before SkyCrop)**
- **Touchpoint:** Extension officer mentions SkyCrop at training session
- **Actions:** Sunil hears about satellite farming technology
- **Thoughts:** "Sounds interesting, but is it complicated?"
- **Emotions:** 😐 Curious but skeptical
- **Pain Points:** Unsure if it's worth the effort to learn

**Stage 2: Discovery (Day 1)**
- **Touchpoint:** WhatsApp message from extension officer with download link
- **Actions:** 
  - Clicks link → Google Play Store
  - Reads app description (2 minutes)
  - Checks reviews (if available)
  - Downloads app (12 MB, 3 minutes on 3G)
- **Thoughts:** "Only 12 MB—good. Let me try it."
- **Emotions:** 🙂 Hopeful, slightly anxious
- **Pain Points:** Slow download on 3G network

**Stage 3: Sign-Up (Day 1, 5 minutes)**
- **Touchpoint:** SkyCrop app welcome screen
- **Actions:**
  - Opens app → Welcome screen with 3-slide tutorial
  - Chooses "Sign up with Google" (easier than email/password)
  - Grants permissions (location, storage)
  - Profile created automatically
- **Thoughts:** "That was easy—no complicated forms!"
- **Emotions:** 😊 Relieved, encouraged
- **Pain Points:** None (smooth process)
- **Success Metric:** 90% complete signup within 5 minutes

**Stage 4: First Field Setup (Day 1, 10 minutes)**
- **Touchpoint:** Map interface
- **Actions:**
  - Sees satellite map of Sri Lanka
  - Zooms to Polonnaruwa district
  - Taps approximate center of his field
  - AI detects boundary (60 seconds processing)
  - Boundary displayed as green polygon
  - Area calculated: 2.1 hectares
  - Confirms boundary (or adjusts manually)
  - Names field: "Main Field"
- **Thoughts:** "Wow, it found my field automatically! The area is correct."
- **Emotions:** 😃 Impressed, excited
- **Pain Points:** 60-second wait (but acceptable with progress indicator)
- **Success Metric:** 80% successfully map field on first attempt

**Stage 5: First Insights (Day 1, 5 minutes)**
- **Touchpoint:** Field dashboard
- **Actions:**
  - Views field health map (color-coded: mostly green, some yellow)
  - Sees NDVI score: 0.72 (Good)
  - Reads recommendation: "Field is healthy. Irrigate in 3 days."
  - Checks weather forecast: No rain expected
  - Explores historical trend (last 30 days)
- **Thoughts:** "This is useful! I can see exactly where my field needs water."
- **Emotions:** 😄 Satisfied, confident
- **Pain Points:** Doesn't fully understand NDVI (but recommendation is clear)
- **Success Metric:** 70% view recommendations within first session

**Stage 6: First Action (Day 4)**
- **Touchpoint:** Push notification
- **Actions:**
  - Receives notification: "Main Field: Irrigate today (water stress detected)"
  - Opens app → Sees yellow zones in field map
  - Follows recommendation → Irrigates field
  - Marks action as "Done" in app
- **Thoughts:** "Let me see if this actually works."
- **Emotions:** 🤔 Cautiously optimistic
- **Pain Points:** None
- **Success Metric:** 60% take recommended action within 48 hours

**Stage 7: Validation (Week 2)**
- **Touchpoint:** Field health update
- **Actions:**
  - Opens app → Sees field is now mostly green
  - NDVI improved from 0.72 to 0.78
  - Compares to neighbor's field (visually—neighbor didn't irrigate)
  - Shares screenshot with extension officer on WhatsApp
- **Thoughts:** "It works! My crop looks better than my neighbor's."
- **Emotions:** 😍 Delighted, convinced
- **Pain Points:** None
- **Success Metric:** 80% retention after 2 weeks

**Stage 8: Advocacy (Week 3)**
- **Touchpoint:** Tea shop conversation
- **Actions:**
  - Shows SkyCrop to 3 neighbors
  - Explains how it helped him save water
  - Sends download link via WhatsApp
  - Offers to help them set up
- **Thoughts:** "I should tell everyone about this!"
- **Emotions:** 😊 Proud, helpful
- **Pain Points:** None
- **Success Metric:** 30% refer at least 1 other farmer

#### Journey Insights

**Key Success Factors:**
1. ✅ Simple signup (Google OAuth, <5 minutes)
2. ✅ Instant gratification (see field within 10 minutes)
3. ✅ Clear recommendations (no jargon)
4. ✅ Quick validation (results visible in 1-2 weeks)
5. ✅ Social proof (compare with neighbors)

**Friction Points to Address:**
1. 🟡 60-second AI processing (add progress indicator with tips)
2. 🟡 NDVI terminology (add tooltip: "0.7-0.8 = Healthy crop")
3. 🟡 First-time users may not understand map (add interactive tutorial)

**Opportunities:**
1. 💡 Gamification: "You saved 500 liters of water this week!"
2. 💡 Social features: "5 farmers in your village use SkyCrop"
3. 💡 Achievements: "First field mapped" badge

---

### 3.2 Field Monitoring Workflow

**Persona:** Sunil (Progressive Farmer)  
**Goal:** Check field health and get recommendations  
**Frequency:** 2-3 times per week  
**Duration:** 3-5 minutes per session

#### Workflow Steps

**Step 1: Open App**
- **Trigger:** Morning routine (after tea, before field visit) OR Push notification
- **Action:** Tap SkyCrop icon on phone
- **Screen:** Dashboard with field thumbnail and health status
- **Time:** 2 seconds

**Step 2: View Field Health**
- **Action:** Tap "Main Field" card
- **Screen:** Field map with color-coded health zones
  - Green: Healthy (NDVI 0.7-0.9)
  - Yellow: Moderate stress (NDVI 0.5-0.7)
  - Red: Severe stress (NDVI <0.5)
- **Information Displayed:**
  - Overall health score: "Good (78/100)"
  - Last updated: "2 days ago"
  - Trend: ↑ Improving / → Stable / ↓ Declining
- **Time:** 30 seconds

**Step 3: Read Recommendations**
- **Action:** Scroll down to "What to do" section
- **Screen:** Actionable recommendations with icons
  - 💧 Water: "Irrigate in 2 days (yellow zones need water)"
  - 🌱 Fertilizer: "No fertilizer needed this week"
  - ⚠️ Alert: "Check for pests in Zone B (NDVI dropped 15%)"
- **Time:** 1 minute

**Step 4: Check Weather**
- **Action:** Tap "Weather" tab
- **Screen:** 7-day forecast with icons
  - Today: ☀️ 32°C, No rain
  - Tomorrow: ⛅ 30°C, 20% rain
  - Day 3: 🌧️ 28°C, 80% rain (Heavy)
- **Alert:** "Heavy rain in 3 days—delay fertilizer application"
- **Time:** 30 seconds

**Step 5: View Yield Prediction (Optional)**
- **Action:** Tap "Yield Forecast" tab
- **Screen:** Predicted harvest
  - Estimated yield: 4,200 kg/hectare (±300 kg)
  - Total: 8,400 kg (2 hectares)
  - Expected revenue: Rs. 252,000 (at Rs. 30/kg)
  - Harvest date: ~45 days
- **Time:** 1 minute

**Step 6: Take Action**
- **Action:** Mark recommendation as "Done" or "Remind me later"
- **Screen:** Confirmation message: "Great! We'll check your field again in 5 days."
- **Time:** 10 seconds

**Step 7: Exit**
- **Action:** Close app or switch to WhatsApp
- **Total Time:** 3-5 minutes

#### Workflow Insights

**Frequency of Use:**
- **Week 1-2:** Daily (novelty, learning)
- **Week 3-4:** 3-4 times/week (establishing routine)
- **Month 2+:** 2-3 times/week (habitual check-in)

**Peak Usage Times:**
- Morning: 6-8 AM (before field visit)
- Evening: 6-8 PM (after field work)

**Drop-off Points:**
- 20% exit after viewing health map (satisfied with quick check)
- 10% exit if no new recommendations (nothing to do)

**Engagement Drivers:**
- Push notifications increase session frequency by 40%
- Weather alerts drive 60% of evening sessions
- Yield prediction viewed by 70% of users at least once/week

---

### 3.3 Disaster Assessment Workflow

**Persona:** Sunil (Progressive Farmer)  
**Goal:** Assess crop damage after flood and generate insurance report  
**Trigger:** Flood event (October 2025)  
**Duration:** 15 minutes

#### Workflow Steps

**Step 1: Disaster Event**
- **Context:** Heavy rain causes flooding in Polonnaruwa district
- **Impact:** Sunil's field partially submerged for 3 days
- **Emotion:** 😟 Worried about crop loss and insurance claim

**Step 2: Open Disaster Assessment**
- **Action:** Opens SkyCrop → Taps "Disaster Assessment" feature
- **Screen:** "Assess Flood Damage" wizard
- **Prompt:** "Select dates to compare (before and after flood)"
- **Time:** 30 seconds

**Step 3: Select Dates**
- **Action:** 
  - Before: October 10 (1 week before flood)
  - After: October 20 (3 days after flood waters recede)
- **Screen:** Calendar picker with satellite image availability indicators
- **Time:** 1 minute

**Step 4: AI Processing**
- **Action:** Taps "Analyze Damage"
- **Screen:** Progress indicator: "Comparing satellite images... 45 seconds"
- **Process:** 
  - AI compares NDVI before/after
  - Detects areas with significant NDVI drop (>30%)
  - Calculates damaged area
- **Time:** 60 seconds

**Step 5: View Damage Report**
- **Screen:** Damage assessment results
  - **Visual:** Side-by-side maps (before: green, after: red/yellow)
  - **Damaged Area:** 0.8 hectares (40% of field)
  - **Severity:** 
    - Severe damage: 0.3 ha (15%)
    - Moderate damage: 0.5 ha (25%)
  - **Estimated Yield Loss:** 1,200 kg (30% of expected harvest)
  - **Financial Loss:** Rs. 36,000 (at Rs. 30/kg)
- **Emotion:** 😔 Sad but relieved to have data
- **Time:** 2 minutes

**Step 6: Generate Insurance Report**
- **Action:** Taps "Generate Report" button
- **Screen:** PDF report generated with:
  - Field location (GPS coordinates)
  - Before/after satellite images
  - Damage percentage and area
  - Financial loss calculation
  - Date and time of assessment
  - SkyCrop certification stamp
- **Action:** Taps "Share" → WhatsApp → Sends to insurance agent
- **Time:** 2 minutes

**Step 7: Follow-Up**
- **Action:** Insurance agent receives report
- **Outcome:** Claim processed in 2 weeks (vs. 3-4 months typical)
- **Compensation:** Rs. 30,000 (based on SkyCrop report)
- **Emotion:** 😊 Grateful for quick resolution

#### Workflow Insights

**Value Delivered:**
- **Speed:** 15 minutes to generate report (vs. days of manual assessment)
- **Accuracy:** Objective, satellite-based evidence (vs. subjective visual inspection)
- **Credibility:** Scientific data accepted by insurance companies
- **Financial Impact:** Rs. 30,000 compensation received 10x faster

**Adoption Drivers:**
- Farmers who experience disaster become strongest advocates
- Insurance companies request SkyCrop reports (builds trust)
- Extension officers promote feature during disaster preparedness training

---

## 4. FEATURE REQUIREMENTS

### 4.1 Feature Prioritization Framework

**Priority Levels:**
- **P0 (Must-Have):** Core features for MVP, project fails without them
- **P1 (Should-Have):** Important but not critical, can launch without them
- **P2 (Nice-to-Have):** Future enhancements, deferred to Phase 2+

**Prioritization Criteria:**
1. **User Value:** How much does this solve user pain points? (1-5)
2. **Business Impact:** Revenue, adoption, differentiation (1-5)
3. **Technical Feasibility:** Can we build it in 16 weeks? (1-5)
4. **Dependencies:** Blocks other features? (Yes/No)

---

### 4.2 P0 Features (Must-Have for MVP)

#### F-001: User Authentication & Profile Management

**Description:** Secure user registration, login, and profile management

**User Stories:**
- As a farmer, I want to sign up with my Google account so I can start using SkyCrop quickly
- As a farmer, I want to reset my password so I can regain access if I forget it
- As a farmer, I want to update my profile (name, phone, location) so my information is current

**Acceptance Criteria:**
- ✅ User can sign up with Google OAuth in <1 minute
- ✅ User can sign up with email/password in <2 minutes
- ✅ Password reset link sent within 5 minutes
- ✅ Session persists for 30 days (remember me)
- ✅ User can update profile information
- ✅ User can delete account (GDPR compliance)

**Priority:** P0 (Must-Have)  
**Effort:** 12 hours  
**Dependencies:** None  
**Success Metric:** 90% signup completion rate

---

#### F-002: Interactive Satellite Map Interface

**Description:** Zoomable, pannable satellite map of Sri Lanka for field selection

**User Stories:**
- As a farmer, I want to see a satellite map of my area so I can locate my field
- As a farmer, I want to zoom and pan the map so I can find my exact field location
- As a farmer, I want to tap on the map to select my field location

**Acceptance Criteria:**
- ✅ Map loads within 5 seconds on 3G connection
- ✅ Map shows satellite imagery (Sentinel-2 or Google Maps)
- ✅ User can zoom in/out (pinch gesture on mobile)
- ✅ User can pan map (drag gesture)
- ✅ User can tap to select field center point
- ✅ Map shows user's current location (GPS)

**Priority:** P0 (Must-Have)  
**Effort:** 24 hours  
**Dependencies:** F-001 (Authentication)  
**Success Metric:** 95% successfully locate field on map

---

#### F-003: AI-Powered Field Boundary Detection

**Description:** Automatic detection of paddy field boundaries using U-Net deep learning model

**User Stories:**
- As a farmer, I want the system to automatically detect my field boundaries so I don't have to draw them manually
- As a farmer, I want to see the detected boundary on the map so I can verify it's correct
- As a farmer, I want to adjust the boundary if the AI makes a mistake

**Acceptance Criteria:**
- ✅ AI detects boundary within 60 seconds of field selection
- ✅ Boundary detection accuracy ≥85% (IoU metric on validation set)
- ✅ Boundary displayed as polygon overlay on map
- ✅ User can manually adjust boundary points (drag vertices)
- ✅ User can confirm or reject detected boundary
- ✅ Processing status shown (progress indicator)

**Priority:** P0 (Must-Have)  
**Effort:** 40 hours (model training + integration)  
**Dependencies:** F-002 (Map Interface)  
**Success Metric:** 85% IoU accuracy, 80% user acceptance rate

---

#### F-004: Field Area Calculation

**Description:** Automatic calculation of field area in hectares based on detected boundary

**User Stories:**
- As a farmer, I want to know the exact area of my field so I can calculate input requirements
- As a farmer, I want the area displayed in hectares (familiar unit)

**Acceptance Criteria:**
- ✅ Area calculated automatically after boundary detection
- ✅ Area displayed in hectares (2 decimal places)
- ✅ Area accuracy ±5% of actual (validated with ground truth)
- ✅ Area updates if user adjusts boundary

**Priority:** P0 (Must-Have)  
**Effort:** 8 hours  
**Dependencies:** F-003 (Boundary Detection)  
**Success Metric:** ±5% accuracy vs. ground truth

---

#### F-005: Vegetation Indices Calculation (NDVI, NDWI, TDVI)

**Description:** Calculate and display crop health indices from satellite imagery

**User Stories:**
- As a farmer, I want to see if my crop is healthy so I can take action if needed
- As a farmer, I want to see which parts of my field need attention

**Acceptance Criteria:**
- ✅ NDVI calculated from Sentinel-2 Red and NIR bands
- ✅ NDWI calculated from NIR and SWIR bands
- ✅ TDVI calculated using transformation formula
- ✅ Indices displayed as color-coded field map (green/yellow/red)
- ✅ Indices updated every 5-7 days (Sentinel-2 revisit)
- ✅ Correlation ≥90% with ground-truth measurements

**Priority:** P0 (Must-Have)  
**Effort:** 12 hours  
**Dependencies:** F-003 (Boundary Detection), Sentinel Hub API  
**Success Metric:** ≥90% correlation with ground truth

---

#### F-006: Crop Health Status Display

**Description:** Translate vegetation indices into simple health status (Excellent/Good/Fair/Poor)

**User Stories:**
- As a farmer, I want to know if my crop is healthy in simple terms (not technical numbers)
- As a farmer, I want to see an overall health score for my field

**Acceptance Criteria:**
- ✅ Health status calculated from NDVI:
  - Excellent: NDVI 0.8-1.0 (dark green)
  - Good: NDVI 0.7-0.8 (green)
  - Fair: NDVI 0.5-0.7 (yellow)
  - Poor: NDVI <0.5 (red)
- ✅ Overall health score (0-100) displayed prominently
- ✅ Health status shown on field card (dashboard)
- ✅ Color-coded visual indicator (emoji or icon)

**Priority:** P0 (Must-Have)  
**Effort:** 8 hours  
**Dependencies:** F-005 (Vegetation Indices)  
**Success Metric:** 90% user comprehension (UAT survey)

---

#### F-007: Water Recommendations

**Description:** Provide irrigation recommendations based on NDWI (water stress index)

**User Stories:**
- As a farmer, I want to know when to irrigate so I don't waste water
- As a farmer, I want to know which parts of my field need water most

**Acceptance Criteria:**
- ✅ Recommendation generated based on NDWI:
  - NDWI >0.3: "No irrigation needed"
  - NDWI 0.1-0.3: "Irrigate in 2-3 days"
  - NDWI <0.1: "Irrigate immediately (water stress)"
- ✅ Recommendation considers weather forecast (don't irrigate if rain expected)
- ✅ Spatial recommendation: "Irrigate Zone B (yellow area)"
- ✅ Estimated water savings displayed: "Save 500 liters by following this advice"

**Priority:** P0 (Must-Have)  
**Effort:** 12 hours  
**Dependencies:** F-005 (NDWI), F-010 (Weather)  
**Success Metric:** 20-30% water savings (farmer-reported)

---

#### F-008: Fertilizer Recommendations

**Description:** Provide fertilizer application recommendations based on NDVI (vegetation health)

**User Stories:**
- As a farmer, I want to know when and where to apply fertilizer so I don't waste money
- As a farmer, I want to know how much fertilizer to apply

**Acceptance Criteria:**
- ✅ Recommendation generated based on NDVI:
  - NDVI >0.75: "No fertilizer needed"
  - NDVI 0.6-0.75: "Apply 30 kg/ha urea to yellow zones"
  - NDVI <0.6: "Apply 50 kg/ha urea + check for pests"
- ✅ Spatial recommendation: "Apply fertilizer to Zone C (low NDVI)"
- ✅ Timing recommendation: "Apply 2 days before rain (better absorption)"
- ✅ Cost savings displayed: "Save Rs. 3,000 by targeted application"

**Priority:** P0 (Must-Have)  
**Effort:** 12 hours  
**Dependencies:** F-005 (NDVI), F-010 (Weather)  
**Success Metric:** 15-20% fertilizer cost savings (farmer-reported)

---

#### F-009: Yield Prediction

**Description:** Predict expected harvest quantity using Random Forest ML model

**User Stories:**
- As a farmer, I want to know how much I'll harvest so I can plan sales
- As a farmer, I want to know if my yield is on track or below expectations

**Acceptance Criteria:**
- ✅ Yield predicted in kg/hectare and total kg
- ✅ Prediction accuracy ≥85% (MAPE <15% vs. actual harvest)
- ✅ Confidence interval displayed (e.g., 4,000-4,500 kg/ha)
- ✅ Prediction updates every 10 days throughout season
- ✅ Alert if yield trending below expectations
- ✅ Expected revenue calculated (kg × market price)

**Priority:** P0 (Must-Have)  
**Effort:** 20 hours (model training + integration)  
**Dependencies:** F-005 (NDVI time series), Historical yield data  
**Success Metric:** ≥85% accuracy (MAPE <15%)

---

#### F-010: Weather Forecast Integration

**Description:** Display 7-day weather forecast for field location

**User Stories:**
- As a farmer, I want to see the weather forecast so I can plan farm operations
- As a farmer, I want to be alerted about extreme weather (heavy rain, drought)

**Acceptance Criteria:**
- ✅ 7-day forecast displayed (temperature, rainfall, humidity)
- ✅ Field-specific location (10km resolution)
- ✅ Weather icons (sun, cloud, rain)
- ✅ Alerts for extreme weather (>50mm rain, >35°C temperature)
- ✅ Integration with recommendations (e.g., "Delay fertilizer—rain in 2 days")

**Priority:** P0 (Must-Have)  
**Effort:** 8 hours  
**Dependencies:** OpenWeatherMap API  
**Success Metric:** 90% forecast accuracy (vs. actual weather)

---

#### F-011: Mobile Application (Android & iOS)

**Description:** Cross-platform mobile app with core feature parity to web app

**User Stories:**
- As a farmer, I want to use SkyCrop on my smartphone so I can check my field anytime
- As a farmer, I want push notifications so I'm alerted about important updates

**Acceptance Criteria:**
- ✅ React Native app for Android 8+ and iOS 13+
- ✅ Feature parity with web app (all P0 features)
- ✅ Push notifications (health alerts, weather warnings)
- ✅ Offline mode (cache last 30 days of data)
- ✅ App size <50 MB
- ✅ Crash rate <2%

**Priority:** P0 (Must-Have)  
**Effort:** 80 hours  
**Dependencies:** All web features complete  
**Success Metric:** 70% of users prefer mobile over web

---

#### F-012: User Dashboard

**Description:** Overview dashboard showing all fields and key metrics

**User Stories:**
- As a farmer, I want to see all my fields at a glance so I can prioritize actions
- As a farmer, I want to see my overall farm health and performance

**Acceptance Criteria:**
- ✅ List of all fields with thumbnails and health status
- ✅ Overall farm health score (average across fields)
- ✅ Pending actions/recommendations (to-do list)
- ✅ Recent activity (last 7 days)
- ✅ Quick access to add new field

**Priority:** P0 (Must-Have)  
**Effort:** 20 hours  
**Dependencies:** F-001 to F-010  
**Success Metric:** 90% of users view dashboard daily

---

### 4.3 P1 Features (Should-Have)

#### F-013: Disaster Damage Assessment

**Description:** Compare before/after satellite images to quantify crop damage from floods, droughts, etc.

**User Stories:**
- As a farmer, I want to assess crop damage after a disaster so I can file an insurance claim
- As a farmer, I want a report with evidence (satellite images) for my insurance company

**Acceptance Criteria:**
- ✅ User selects before/after dates
- ✅ AI compares NDVI before/after
- ✅ Damaged area calculated (hectares and %)
- ✅ Financial loss estimated (kg yield loss × market price)
- ✅ PDF report generated with satellite images
- ✅ Report shareable via WhatsApp/email

**Priority:** P1 (Should-Have)  
**Effort:** 12 hours  
**Dependencies:** F-005 (NDVI)  
**Success Metric:** 80% damage detection accuracy

---

#### F-014: Historical Health Trend Visualization

**Description:** Graph showing NDVI/NDWI trends over last 6 months

**User Stories:**
- As a farmer, I want to see how my crop health changed over time so I can learn patterns
- As a farmer, I want to compare this season to last season

**Acceptance Criteria:**
- ✅ Line graph showing NDVI over time (last 6 months)
- ✅ Annotations for key events (irrigation, fertilizer, rain)
- ✅ Comparison to previous season (if data available)
- ✅ Zoom and pan on graph

**Priority:** P1 (Should-Have)  
**Effort:** 12 hours  
**Dependencies:** F-005 (NDVI), 6 months of data  
**Success Metric:** 60% of users view trends at least once/month

---

#### F-015: Admin Dashboard & Content Management

**Description:** Admin panel for managing news, events, weather alerts, and user support

**User Stories:**
- As an admin, I want to publish agricultural news so farmers stay informed
- As an admin, I want to manage user accounts and view analytics

**Acceptance Criteria:**
- ✅ CMS for news/events (create, edit, delete, publish)
- ✅ User management (view, suspend, delete accounts)
- ✅ Analytics dashboard (user count, engagement, feature usage)
- ✅ System health monitoring (uptime, errors, API usage)
- ✅ Support ticket management

**Priority:** P1 (Should-Have)  
**Effort:** 12 hours  
**Dependencies:** F-001 (Authentication)  
**Success Metric:** Admin can publish news in <5 minutes

---

#### F-016: News & Knowledge Hub

**Description:** Agricultural news, best practices, market prices, government schemes

**User Stories:**
- As a farmer, I want to read agricultural news so I stay informed
- As a farmer, I want to learn best practices from experts

**Acceptance Criteria:**
- ✅ News feed with articles (title, image, summary, link)
- ✅ Categories: News, Best Practices, Market Prices, Government Schemes
- ✅ Search functionality
- ✅ Bookmark articles for later
- ✅ Share articles via WhatsApp

**Priority:** P1 (Should-Have)  
**Effort:** 8 hours  
**Dependencies:** F-015 (Admin CMS)  
**Success Metric:** 50% of users read at least 1 article/month

---

#### F-017: Manual Boundary Adjustment

**Description:** Allow users to manually adjust AI-detected field boundaries

**User Stories:**
- As a farmer, I want to adjust the boundary if the AI makes a mistake
- As a farmer, I want to add/remove vertices to match my field exactly

**Acceptance Criteria:**
- ✅ User can drag boundary vertices to new positions
- ✅ User can add new vertices (tap on boundary line)
- ✅ User can delete vertices (long-press)
- ✅ Area recalculated in real-time as boundary changes
- ✅ Undo/redo functionality

**Priority:** P1 (Should-Have)  
**Effort:** 16 hours  
**Dependencies:** F-003 (Boundary Detection)  
**Success Metric:** 20% of users adjust boundary at least once

---

#### F-018: Multi-Field Management

**Description:** Support for farmers with multiple fields (up to 5 fields in Phase 1)

**User Stories:**
- As a farmer, I want to add multiple fields so I can monitor all my land
- As a farmer, I want to compare health across my fields

**Acceptance Criteria:**
- ✅ User can add up to 5 fields (Phase 1 limit)
- ✅ Each field has unique name and location
- ✅ Dashboard shows all fields with health status
- ✅ User can switch between fields easily
- ✅ Aggregate statistics (total area, average health)

**Priority:** P1 (Should-Have)  
**Effort:** 8 hours  
**Dependencies:** F-003 (Boundary Detection)  
**Success Metric:** 40% of users add 2+ fields

---

### 4.4 P2 Features (Nice-to-Have - Phase 2+)

#### F-019: Sinhala & Tamil Language Support

**Description:** Localize app interface and content to Sinhala and Tamil languages

**Priority:** P2 (Phase 2)  
**Effort:** 40 hours  
**Rationale:** 45% of farmers have limited English proficiency, but requires significant translation effort

---

#### F-020: Offline Mode (Full Functionality)

**Description:** Full app functionality without internet connection (currently only cached data)

**Priority:** P2 (Phase 2)  
**Effort:** 60 hours  
**Rationale:** 22% of farmers have unreliable internet, but complex to implement (local AI processing)

---

#### F-021: SMS Alerts

**Description:** Send critical alerts via SMS for farmers without smartphones

**Priority:** P2 (Phase 2)  
**Effort:** 20 hours  
**Rationale:** Expands reach to 35% of farmers without smartphones, but adds operational cost

---

#### F-022: Pest & Disease Detection

**Description:** AI-powered pest/disease identification from photos

**Priority:** P2 (Phase 3)  
**Effort:** 80 hours  
**Rationale:** High user demand, but requires separate AI model and training data

---

#### F-023: Community Forum

**Description:** Farmer-to-farmer discussion forum for knowledge sharing

**Priority:** P2 (Phase 3)  
**Effort:** 40 hours  
**Rationale:** Builds community, but requires moderation and content management

---

#### F-024: Marketplace Integration

**Description:** Connect farmers with buyers for paddy sales

**Priority:** P2 (Phase 4)  
**Effort:** 120 hours  
**Rationale:** High business value, but out of scope for agricultural monitoring focus

---

## 5. FUNCTIONAL REQUIREMENTS

### 5.1 User Authentication & Management

**FR-001: User Registration**
- System shall allow users to register using Google OAuth
- System shall allow users to register using email and password
- System shall validate email format and password strength (min 8 characters, 1 uppercase, 1 number)
- System shall send email verification link within 5 minutes
- System shall create user profile automatically upon successful registration

**FR-002: User Login**
- System shall allow users to log in with Google OAuth
- System shall allow users to log in with email/password
- System shall implement session management (JWT tokens, 30-day expiry)
- System shall provide "Remember Me" option (persistent login)
- System shall lock account after 5 failed login attempts (security)

**FR-003: Password Management**
- System shall provide "Forgot Password" functionality
- System shall send password reset link to registered email within 5 minutes
- System shall expire reset links after 24 hours
- System shall enforce password strength requirements on reset

**FR-004: Profile Management**
- System shall allow users to update profile information (name, phone, location)
- System shall allow users to upload profile photo (optional)
- System shall allow users to change password
- System shall allow users to delete account (GDPR compliance)
- System shall export user data on request (GDPR compliance)

---

### 5.2 Field Mapping & Boundary Detection

**FR-005: Interactive Map Display**
- System shall display satellite map of Sri Lanka (Sentinel-2 or Google Maps)
- System shall support zoom levels from country-wide to field-level (10m resolution)
- System shall support pan (drag) and zoom (pinch) gestures on mobile
- System shall show user's current location (GPS) with accuracy indicator
- System shall load map tiles within 5 seconds on 3G connection

**FR-006: Field Selection**
- System shall allow users to tap map to select field center point
- System shall display crosshair or marker at selected location
- System shall show GPS coordinates of selected point
- System shall allow users to adjust selected point before confirming

**FR-007: AI Boundary Detection**
- System shall automatically detect field boundaries using U-Net model
- System shall process boundary detection within 60 seconds
- System shall display progress indicator during processing
- System shall achieve ≥85% IoU accuracy on validation dataset
- System shall display detected boundary as polygon overlay on map
- System shall allow users to confirm or reject detected boundary

**FR-008: Manual Boundary Adjustment**
- System shall allow users to drag boundary vertices to adjust position
- System shall allow users to add new vertices by tapping boundary line
- System shall allow users to delete vertices by long-press
- System shall provide undo/redo functionality (last 10 actions)
- System shall recalculate area in real-time as boundary changes

**FR-009: Field Area Calculation**
- System shall calculate field area in hectares (2 decimal places)
- System shall achieve ±5% accuracy vs. ground truth measurements
- System shall display area prominently on field card
- System shall update area automatically when boundary changes

**FR-010: Field Naming & Management**
- System shall allow users to name fields (max 50 characters)
- System shall support up to 5 fields per user (Phase 1 limit)
- System shall allow users to edit field name and boundary
- System shall allow users to delete fields (with confirmation)
- System shall save field data to user account (persistent storage)

---

### 5.3 Crop Health Monitoring

**FR-011: Vegetation Indices Calculation**
- System shall calculate NDVI from Sentinel-2 Red (B4) and NIR (B8) bands
- System shall calculate NDWI from NIR (B8) and SW
IR (B11) bands
- System shall calculate TDVI using transformation formula
- System shall update indices every 5-7 days (Sentinel-2 revisit frequency)
- System shall implement cloud masking (ignore images with >20% cloud cover)
- System shall achieve ≥90% correlation with ground-truth measurements

**FR-012: Health Status Classification**
- System shall classify crop health based on NDVI:
  - Excellent: NDVI 0.8-1.0 (dark green)
  - Good: NDVI 0.7-0.8 (green)
  - Fair: NDVI 0.5-0.7 (yellow)
  - Poor: NDVI <0.5 (red)
- System shall calculate overall health score (0-100 scale)
- System shall display health status on field card with color indicator
- System shall show health trend (improving/stable/declining)

**FR-013: Color-Coded Field Visualization**
- System shall display field as color-coded map based on NDVI
- System shall use intuitive color scheme (green=healthy, yellow=stress, red=critical)
- System shall support zoom to see spatial variation within field
- System shall overlay boundary on health map
- System shall allow toggle between NDVI/NDWI/TDVI views

**FR-014: Historical Trend Tracking**
- System shall store health data for last 6 months
- System shall display line graph of NDVI over time
- System shall annotate graph with key events (irrigation, fertilizer, weather)
- System shall allow comparison to previous season (if data available)
- System shall support zoom and pan on trend graph

---

### 5.4 Precision Agriculture Recommendations

**FR-015: Water Recommendations**
- System shall generate irrigation recommendations based on NDWI:
  - NDWI >0.3: "No irrigation needed"
  - NDWI 0.1-0.3: "Irrigate in 2-3 days"
  - NDWI <0.1: "Irrigate immediately (water stress detected)"
- System shall consider weather forecast (delay if rain expected within 48 hours)
- System shall provide spatial recommendations (e.g., "Irrigate Zone B")
- System shall estimate water savings from following recommendations
- System shall update recommendations every 5-7 days

**FR-016: Fertilizer Recommendations**
- System shall generate fertilizer recommendations based on NDVI:
  - NDVI >0.75: "No fertilizer needed"
  - NDVI 0.6-0.75: "Apply 30 kg/ha urea to low-vigor zones"
  - NDVI <0.6: "Apply 50 kg/ha urea + check for pests"
- System shall provide spatial recommendations (target specific zones)
- System shall recommend timing (e.g., "Apply 2 days before rain")
- System shall estimate cost savings from targeted application
- System shall integrate with weather forecast for optimal timing

**FR-017: Alert System**
- System shall generate alerts for critical conditions:
  - Severe water stress (NDWI <0.05)
  - Rapid NDVI decline (>15% drop in 7 days)
  - Extreme weather (>50mm rain, >35°C temperature)
- System shall send push notifications to mobile app
- System shall display alerts prominently on dashboard
- System shall allow users to dismiss or snooze alerts

---

### 5.5 Yield Prediction

**FR-018: Yield Forecasting**
- System shall predict yield using Random Forest regression model
- System shall use features: NDVI time series, weather data, field area, historical yields
- System shall achieve ≥85% accuracy (MAPE <15% vs. actual harvest)
- System shall display prediction in kg/hectare and total kg
- System shall show confidence interval (e.g., 4,000-4,500 kg/ha)
- System shall update prediction every 10 days throughout growing season

**FR-019: Revenue Estimation**
- System shall calculate expected revenue (predicted yield × market price)
- System shall use current market price (updated weekly)
- System shall allow users to input custom price (for contract sales)
- System shall display revenue in Sri Lankan Rupees

**FR-020: Yield Tracking**
- System shall allow users to input actual harvest quantity
- System shall compare actual vs. predicted yield
- System shall calculate prediction accuracy
- System shall use actual yields to improve future predictions (model retraining)

---

### 5.6 Disaster Assessment

**FR-021: Disaster Event Selection**
- System shall allow users to select disaster type (flood, drought, storm)
- System shall allow users to select before/after dates
- System shall display calendar with satellite image availability indicators
- System shall validate date selection (before must be earlier than after)

**FR-022: Damage Analysis**
- System shall compare NDVI before and after disaster
- System shall detect areas with significant NDVI drop (>30%)
- System shall calculate damaged area in hectares and percentage
- System shall classify damage severity:
  - Severe: NDVI drop >50%
  - Moderate: NDVI drop 30-50%
  - Minor: NDVI drop 15-30%
- System shall achieve ≥80% damage detection accuracy

**FR-023: Financial Loss Estimation**
- System shall estimate yield loss based on damaged area and severity
- System shall calculate financial loss (yield loss × market price)
- System shall display loss in Sri Lankan Rupees
- System shall provide breakdown by damage severity

**FR-024: Insurance Report Generation**
- System shall generate PDF report with:
  - Field location (GPS coordinates)
  - Before/after satellite images
  - Damage map (color-coded)
  - Damage statistics (area, percentage, severity)
  - Financial loss calculation
  - Date and time of assessment
  - SkyCrop certification stamp
- System shall allow users to share report via WhatsApp/email
- System shall store reports in user account (download anytime)

---

### 5.7 Weather Integration

**FR-025: Weather Forecast Display**
- System shall display 7-day weather forecast
- System shall show daily temperature (min/max), rainfall probability, humidity
- System shall use weather icons (sun, cloud, rain, storm)
- System shall update forecast every 6 hours
- System shall use field-specific location (10km resolution)

**FR-026: Weather Alerts**
- System shall generate alerts for extreme weather:
  - Heavy rain (>50mm in 24 hours)
  - High temperature (>35°C)
  - Strong winds (>40 km/h)
  - Drought conditions (no rain for 14+ days)
- System shall send push notifications for weather alerts
- System shall integrate weather alerts with recommendations

**FR-027: Historical Weather Data**
- System shall store weather data for last 6 months
- System shall display historical rainfall and temperature graphs
- System shall allow comparison to current season

---

### 5.8 News & Knowledge Hub

**FR-028: News Feed**
- System shall display agricultural news articles
- System shall show article title, image, summary, and publication date
- System shall support categories: News, Best Practices, Market Prices, Government Schemes
- System shall allow users to read full articles (in-app or external link)
- System shall update news feed daily

**FR-029: Content Search**
- System shall provide search functionality for news/articles
- System shall support keyword search
- System shall filter by category
- System shall sort by relevance or date

**FR-030: Bookmarking & Sharing**
- System shall allow users to bookmark articles for later reading
- System shall allow users to share articles via WhatsApp/email
- System shall track article views and shares (analytics)

---

### 5.9 Admin Dashboard

**FR-031: Content Management**
- System shall allow admins to create, edit, delete, and publish news articles
- System shall support rich text editor (formatting, images, links)
- System shall allow scheduling of article publication
- System shall support draft/published status

**FR-032: User Management**
- System shall allow admins to view all user accounts
- System shall display user statistics (signup date, last login, fields count)
- System shall allow admins to suspend or delete accounts (with reason)
- System shall allow admins to export user data (CSV)

**FR-033: Analytics Dashboard**
- System shall display key metrics:
  - Total users, active users (daily/weekly/monthly)
  - Total fields mapped
  - Feature usage statistics
  - User engagement metrics (session duration, frequency)
- System shall display charts and graphs for visual analysis
- System shall allow date range selection for analytics

**FR-034: System Monitoring**
- System shall display system health metrics:
  - API uptime percentage
  - API response times (p50, p95, p99)
  - Error rate
  - Satellite API usage (requests remaining)
- System shall send alerts to admins for critical issues
- System shall display recent errors and logs

---

## 6. NON-FUNCTIONAL REQUIREMENTS

### 6.1 Performance Requirements

**NFR-001: Response Time**
- Web app shall load initial page within 3 seconds on 3G connection
- API endpoints shall respond within 2 seconds (95th percentile)
- Map interactions (zoom, pan) shall be smooth (60 FPS)
- AI boundary detection shall complete within 60 seconds
- Vegetation indices calculation shall complete within 30 seconds

**NFR-002: Throughput**
- System shall support 1,000+ concurrent users
- System shall handle 10,000+ API requests per day
- System shall process 100+ boundary detection requests per day

**NFR-003: Scalability**
- System shall scale horizontally (add more servers as users grow)
- Database shall support 100,000+ fields without performance degradation
- System shall handle 10x user growth without major architecture changes

**NFR-004: Resource Usage**
- Mobile app shall use <50 MB storage
- Mobile app shall use <100 MB RAM
- Web app shall use <200 MB browser memory
- Backend shall use <2 GB RAM per instance (cost optimization)

---

### 6.2 Usability Requirements

**NFR-005: Ease of Use**
- New users shall complete onboarding (signup + first field setup) within 15 minutes
- Users shall achieve 80%+ task success rate on core workflows (UAT)
- Users shall rate ease of use ≥4.0/5.0 (usability survey)
- System shall require ≤3 taps to access key features

**NFR-006: Learnability**
- Users shall understand core features within 30 minutes of first use
- System shall provide interactive tutorials for first-time users
- System shall provide contextual help (tooltips, hints)
- System shall provide video tutorials (2-3 minutes each)

**NFR-007: Accessibility**
- Web app shall meet WCAG 2.1 Level AA standards (Phase 2)
- Mobile app shall support screen readers (Phase 2)
- System shall support low-bandwidth mode (image compression, reduced data)
- System shall work on low-end smartphones (Android 8+, 2GB RAM)

**NFR-008: Localization**
- System shall support English (Phase 1)
- System shall support Sinhala and Tamil (Phase 2)
- System shall support right-to-left text (Phase 2)
- System shall use locale-appropriate date/time formats

---

### 6.3 Reliability Requirements

**NFR-009: Availability**
- System shall maintain 99% uptime (measured monthly)
- Planned maintenance shall be scheduled during low-usage hours (2-4 AM)
- System shall notify users 24 hours before planned maintenance

**NFR-010: Fault Tolerance**
- System shall gracefully handle external API failures (Sentinel Hub, Weather)
- System shall display cached data if real-time data unavailable
- System shall retry failed API requests (exponential backoff, max 3 attempts)
- System shall log all errors for debugging

**NFR-011: Data Integrity**
- System shall validate all user inputs (client-side and server-side)
- System shall prevent data corruption through transactions (ACID compliance)
- System shall maintain data consistency across distributed systems
- System shall detect and prevent duplicate field entries

**NFR-012: Backup & Recovery**
- System shall perform daily automated backups (database, user data)
- System shall retain backups for 30 days
- System shall support point-in-time recovery (restore to any day in last 30 days)
- System shall test backup restoration monthly

---

### 6.4 Security Requirements

**NFR-013: Authentication & Authorization**
- System shall implement secure authentication (OAuth 2.0, JWT)
- System shall enforce password strength requirements (min 8 chars, 1 uppercase, 1 number)
- System shall implement role-based access control (Farmer, Admin)
- System shall lock accounts after 5 failed login attempts
- System shall expire sessions after 30 days of inactivity

**NFR-014: Data Encryption**
- System shall encrypt data in transit (TLS 1.3)
- System shall encrypt sensitive data at rest (AES-256)
- System shall hash passwords (bcrypt, 10+ rounds)
- System shall not store API keys or secrets in code (environment variables)

**NFR-015: Privacy & Compliance**
- System shall comply with GDPR (data protection, right to erasure)
- System shall comply with Sri Lanka Data Protection Act (expected 2026)
- System shall obtain user consent for data collection
- System shall allow users to export their data (JSON format)
- System shall allow users to delete their accounts and data

**NFR-016: Security Testing**
- System shall undergo security audit before launch (OWASP Top 10)
- System shall implement input validation to prevent SQL injection, XSS
- System shall implement rate limiting (prevent DDoS attacks)
- System shall log security events (failed logins, suspicious activity)

---

### 6.5 Maintainability Requirements

**NFR-017: Code Quality**
- Code shall maintain ≥80% test coverage (unit + integration tests)
- Code shall pass linting checks (ESLint for JS, Pylint for Python)
- Code shall follow style guides (Airbnb JavaScript, PEP 8 Python)
- Code shall have cyclomatic complexity <10 per function

**NFR-018: Documentation**
- System shall have comprehensive API documentation (Swagger/OpenAPI)
- System shall have architecture documentation (diagrams, design decisions)
- System shall have deployment guide (step-by-step instructions)
- System shall have user documentation (guides, FAQs, videos)
- Code shall have inline comments for complex logic

**NFR-019: Modularity**
- System shall use microservices or modular architecture
- System shall have clear separation of concerns (frontend, backend, AI)
- System shall use RESTful API design principles
- System shall support independent deployment of modules

**NFR-020: Monitoring & Logging**
- System shall log all API requests (timestamp, endpoint, user, response time)
- System shall log all errors with stack traces
- System shall implement application performance monitoring (APM)
- System shall send alerts for critical errors (email, Slack)

---

### 6.6 Compatibility Requirements

**NFR-021: Browser Compatibility**
- Web app shall support Chrome, Firefox, Safari (latest 2 versions)
- Web app shall support Edge (latest version)
- Web app shall be responsive (mobile, tablet, desktop)

**NFR-022: Mobile Compatibility**
- Mobile app shall support Android 8.0+ (API level 26+)
- Mobile app shall support iOS 13.0+
- Mobile app shall work on devices with 2GB+ RAM
- Mobile app shall work on screens 4.5" to 6.5"

**NFR-023: Network Compatibility**
- System shall work on 3G networks (minimum 1 Mbps)
- System shall optimize for 4G networks (typical use case)
- System shall support offline mode (cached data, 30 days)
- System shall handle intermittent connectivity gracefully

---

## 7. USER INTERFACE REQUIREMENTS

### 7.1 Design Principles

**DP-001: Simplicity First**
- UI shall prioritize clarity over complexity
- UI shall use visual communication (icons, colors, maps) over text
- UI shall require ≤3 taps to access core features
- UI shall avoid technical jargon (use farmer-friendly language)

**DP-002: Mobile-First Design**
- UI shall be optimized for mobile devices (70% of users)
- UI shall use large touch targets (min 44×44 pixels)
- UI shall support one-handed operation where possible
- UI shall minimize text input (use dropdowns, toggles, maps)

**DP-003: Progressive Disclosure**
- UI shall show basic features prominently
- UI shall hide advanced features under "More" or "Settings"
- UI shall use expandable sections for detailed information
- UI shall provide contextual help (tooltips, hints)

**DP-004: Consistency**
- UI shall use consistent color scheme throughout app
- UI shall use consistent iconography and terminology
- UI shall use consistent navigation patterns
- UI shall follow platform conventions (iOS Human Interface Guidelines, Material Design)

**DP-005: Accessibility**
- UI shall use high contrast colors (WCAG AA compliance)
- UI shall support text scaling (up to 200%)
- UI shall provide alternative text for images
- UI shall support keyboard navigation (web app)

---

### 7.2 Color Scheme

**Primary Colors:**
- **Green (#10B981):** Health, growth, success (healthy crops)
- **Yellow (#F59E0B):** Caution, attention needed (moderate stress)
- **Red (#EF4444):** Critical, urgent action (severe stress)
- **Blue (#3B82F6):** Water, information, trust (brand color)

**Secondary Colors:**
- **Gray (#6B7280):** Text, borders, inactive elements
- **White (#FFFFFF):** Background, cards
- **Dark Gray (#1F2937):** Headers, primary text

**Semantic Colors:**
- **Success:** Green (#10B981)
- **Warning:** Yellow (#F59E0B)
- **Error:** Red (#EF4444)
- **Info:** Blue (#3B82F6)

---

### 7.3 Typography

**Font Family:**
- **Primary:** Inter (sans-serif, modern, readable)
- **Fallback:** System fonts (Roboto on Android, San Francisco on iOS)

**Font Sizes:**
- **Heading 1:** 24px (page titles)
- **Heading 2:** 20px (section titles)
- **Heading 3:** 18px (card titles)
- **Body:** 16px (main text)
- **Small:** 14px (captions, labels)
- **Tiny:** 12px (footnotes, timestamps)

**Font Weights:**
- **Bold (700):** Headings, emphasis
- **Semibold (600):** Subheadings, buttons
- **Regular (400):** Body text
- **Light (300):** Captions (use sparingly)

---

### 7.4 Key Screens & Workflows

#### 7.4.1 Welcome & Onboarding

**Screen 1: Welcome Screen**
- **Elements:**
  - SkyCrop logo and tagline
  - 3-slide carousel (benefits, features, how it works)
  - "Sign Up" button (primary, green)
  - "Log In" link (secondary, text)
- **Interactions:**
  - Swipe to navigate carousel
  - Tap "Sign Up" → Sign Up Screen
  - Tap "Log In" → Log In Screen

**Screen 2: Sign Up Screen**
- **Elements:**
  - "Sign up with Google" button (white, Google logo)
  - Divider: "OR"
  - Email input field
  - Password input field (with show/hide toggle)
  - "Sign Up" button (primary, green)
  - "Already have an account? Log In" link
- **Interactions:**
  - Tap Google button → OAuth flow
  - Fill email/password → Tap "Sign Up" → Email verification sent
  - Tap "Log In" → Log In Screen

**Screen 3: Interactive Tutorial (First-Time Users)**
- **Elements:**
  - 5 interactive steps with animations:
    1. "Tap your field on the map"
    2. "AI detects your boundary"
    3. "See your crop health"
    4. "Get recommendations"
    5. "Track your yield"
  - "Skip" button (top-right)
  - "Next" / "Get Started" button
- **Interactions:**
  - Tap "Next" → Next step
  - Tap "Skip" → Dashboard
  - Complete tutorial → Dashboard

---

#### 7.4.2 Dashboard (Home Screen)

**Layout:**
- **Header:**
  - SkyCrop logo (left)
  - Notification bell icon (right, badge if unread)
  - Profile icon (right)
- **Main Content:**
  - Welcome message: "Hello, Sunil!"
  - Overall farm health score (large, prominent)
  - Field cards (scrollable list):
    - Field thumbnail (satellite image)
    - Field name
    - Health status (color-coded badge)
    - Last updated timestamp
    - Tap to view details
  - "Add New Field" button (floating action button, bottom-right)
- **Bottom Navigation:**
  - Home (active)
  - Weather
  - News
  - Profile

**Interactions:**
- Tap field card → Field Details Screen
- Tap "Add New Field" → Map Screen (field selection)
- Tap notification bell → Notifications Screen
- Tap profile icon → Profile Screen
- Tap bottom nav → Navigate to respective screen

---

#### 7.4.3 Field Details Screen

**Layout:**
- **Header:**
  - Back button (left)
  - Field name (center)
  - Edit icon (right)
- **Main Content:**
  - **Section 1: Health Map**
    - Color-coded field map (full width)
    - Zoom controls
    - Toggle: NDVI / NDWI / TDVI
  - **Section 2: Health Status**
    - Overall health score (large, color-coded)
    - Health status badge (Excellent/Good/Fair/Poor)
    - Trend indicator (↑ Improving / → Stable / ↓ Declining)
    - Last updated timestamp
  - **Section 3: Recommendations**
    - Card: Water recommendation (icon, text, action button)
    - Card: Fertilizer recommendation (icon, text, action button)
    - Card: Alerts (if any, red background)
  - **Section 4: Yield Forecast**
    - Predicted yield (kg/ha and total kg)
    - Confidence interval
    - Expected revenue
    - Days to harvest
  - **Section 5: Historical Trend**
    - Line graph (NDVI over time, last 6 months)
    - Zoom and pan controls
- **Bottom Navigation:** (same as Dashboard)

**Interactions:**
- Tap health map → Full-screen map view
- Tap recommendation → Expand for details
- Tap "Mark as Done" → Confirmation, update status
- Tap trend graph → Full-screen graph view
- Tap edit icon → Edit Field Screen

---

#### 7.4.4 Map Screen (Field Selection)

**Layout:**
- **Header:**
  - Back button (left)
  - "Select Your Field" title (center)
  - Help icon (right)
- **Main Content:**
  - Full-screen satellite map
  - Crosshair at center
  - GPS location button (bottom-left)
  - Zoom controls (bottom-right)
  - "Confirm Location" button (bottom, primary, green)
- **Instructions:** "Tap the center of your field"

**Interactions:**
- Pan map → Move crosshair
- Tap GPS button → Center map on user location
- Tap "Confirm Location" → AI boundary detection starts
- Tap help icon → Tutorial overlay

---

#### 7.4.5 Weather Screen

**Layout:**
- **Header:**
  - "Weather Forecast" title
  - Location (field name or GPS)
- **Main Content:**
  - **Section 1: Current Weather**
    - Large weather icon
    - Temperature (large)
    - Conditions (e.g., "Partly Cloudy")
    - Humidity, wind speed
  - **Section 2: 7-Day Forecast**
    - Horizontal scrollable cards:
      - Day name
      - Weather icon
      - High/low temperature
      - Rainfall probability
  - **Section 3: Weather Alerts**
    - Alert cards (if any, yellow/red background)
    - Alert type, description, timing
- **Bottom Navigation:** (same as Dashboard)

**Interactions:**
- Tap day card → Detailed hourly forecast
- Tap alert → Expand for details and recommendations

---

#### 7.4.6 News Screen

**Layout:**
- **Header:**
  - "News & Knowledge" title
  - Search icon (right)
- **Main Content:**
  - Category tabs: All / News / Best Practices / Market Prices / Government
  - News cards (scrollable list):
    - Thumbnail image
    - Title
    - Summary (2 lines)
    - Publication date
    - Bookmark icon
- **Bottom Navigation:** (same as Dashboard)

**Interactions:**
- Tap category tab → Filter news
- Tap news card → Full article view
- Tap bookmark icon → Save article
- Tap search icon → Search screen

---

### 7.5 Responsive Design Requirements

**Mobile (320px - 767px):**
- Single-column layout
- Full-width cards
- Bottom navigation (4-5 items)
- Hamburger menu for secondary navigation

**Tablet (768px - 1023px):**
- Two-column layout where appropriate
- Side navigation (drawer)
- Larger touch targets

**Desktop (1024px+):**
- Multi-column layout (dashboard with sidebar)
- Top navigation bar
- Hover states for interactive elements
- Keyboard shortcuts

---

## 8. INTEGRATION REQUIREMENTS

### 8.1 Sentinel Hub API (Satellite Imagery)

**Integration Type:** RESTful API  
**Purpose:** Retrieve Sentinel-2 satellite imagery for field monitoring

**Requirements:**
- **IR-001:** System shall integrate with Sentinel Hub API v3
- **IR-002:** System shall use academic account (free tier, 3,000 requests/month)
- **IR-003:** System shall request multispectral bands: B02 (Blue), B03 (Green), B04 (Red), B08 (NIR), B11 (SWIR)
- **IR-004:** System shall request 10m resolution imagery
- **IR-005:** System shall implement cloud masking (reject images with >20% cloud cover)
- **IR-006:** System shall cache satellite images for 30 days (reduce API calls)
- **IR-007:** System shall handle API rate limits gracefully (queue requests, retry with backoff)
- **IR-008:** System shall fall back to Google Earth Engine if Sentinel Hub unavailable

**API Endpoints:**
- `POST /api/v1/process` - Request satellite imagery
- `GET /api/v1/catalog/search` - Search available images

**Authentication:** OAuth 2.0 (client credentials)

**Data Format:** GeoTIFF or PNG (configurable)

---

### 8.2 OpenWeatherMap API (Weather Data)

**Integration Type:** RESTful API  
**Purpose:** Retrieve weather forecasts and historical data

**Requirements:**
- **IR-009:** System shall integrate with OpenWeatherMap API v2.5
- **IR-010:** System shall use free tier (60 calls/minute, 1,000,000 calls/month)
- **IR-011:** System shall request 7-day forecast (daily)
- **IR-012:** System shall request current weather conditions
- **IR-013:** System shall request historical weather data (last 6 months)
- **IR-014:** System shall cache weather data for 6 hours (reduce API calls)
- **IR-015:** System shall use field GPS coordinates for location-specific forecasts

**API Endpoints:**
- `GET /data/2.5/forecast/daily` - 7-day forecast
- `GET /data/2.5/weather` - Current weather
- `GET /data/2.5/onecall/timemachine` - Historical data

**Authentication:** API key (query parameter)

**Data Format:** JSON

---

### 8.3 Google OAuth (Authentication)

**Integration Type:** OAuth 2.0  
**Purpose:** User authentication via Google accounts

**Requirements:**
- **IR-016:** System shall integrate with Google OAuth 2.0
- **IR-017:** System shall request user profile information (name, email, photo)
- **IR-018:** System shall handle OAuth flow (authorization code grant)
- **IR-019:** System shall store OAuth tokens securely (encrypted)
- **IR-020:** System shall refresh tokens before expiry

**OAuth Scopes:**
- `openid` - User ID
- `profile` - Name, photo
- `email` - Email address

**Authentication Flow:**
1. User clicks "Sign in with Google"
2. Redirect to Google OAuth consent screen
3. User grants permissions
4. Google redirects back with authorization code
5. Exchange code for access token
6. Retrieve user profile
7. Create/update user account
8. Issue JWT session token

---

### 8.4 Firebase (Push Notifications)

**Integration Type:** Firebase Cloud Messaging (FCM)  
**Purpose:** Send push notifications to mobile app users

**Requirements:**
- **IR-021:** System shall integrate with Firebase Cloud Messaging
- **IR-022:** System shall use free tier (unlimited notifications)
- **IR-023:** System shall send notifications for:
  - Health alerts (water stress, NDVI drop)
  - Weather alerts (heavy rain, extreme temperature)
  - Recommendations (irrigation, fertilizer)
  - News updates (optional, user preference)
- **IR-024:** System shall support notification scheduling (send at optimal times)
- **IR-025:** System shall track notification delivery and open rates

**Notification Types:**
- **Data notifications:** Background processing (update cached data)
- **Display notifications:** User-visible alerts

**Data Format:** JSON payload

---

### 8.5 Payment Gateway (Phase 2 - Premium Features)

**Integration Type:** RESTful API  
**Purpose:** Process subscription payments for premium features

**Requirements:**
- **IR-026:** System shall integrate with Stripe or PayHere (Sri Lankan payment gateway)
- **IR-027:** System shall support credit/debit card payments
- **IR-028:** System shall support mobile money (eZ Cash, mCash)
- **IR-029:** System shall implement PCI-DSS compliant payment flow
- **IR-030:** System shall handle subscription management (create, update, cancel)
- **IR-031:** System shall send payment receipts via email

**Payment Flow:**
1. User selects premium plan
2. Redirect to payment gateway
3. User enters payment details
4. Payment processed
5. Webhook notification to SkyCrop
6. Activate premium features
7. Send confirmation email

---

### 8.6 Google Maps API (Alternative to Sentinel Hub for Base Maps)

**Integration Type:** JavaScript API  
**Purpose:** Display base maps for field selection

**Requirements:**
- **IR-032:** System shall integrate with Google Maps JavaScript API
- **IR-033:** System shall use satellite view for field selection
- **IR-034:** System shall support zoom levels 10-18
- **IR-035:** System shall display user location (GPS)
- **IR-036:** System shall handle API key restrictions (domain whitelist)

**API Usage:**
- Map display: Google Maps
- Satellite imagery analysis: Sentinel Hub (higher resolution, multispectral)

---

### 8.7 SMS Gateway (Phase 2 - SMS Alerts)

**Integration Type:** RESTful API  
**Purpose:** Send SMS alerts to farmers without smartphones

**Requirements:**
- **IR-037:** System shall integrate with Dialog Axiata or Mobitel SMS gateway
- **IR-038:** System shall send SMS for critical alerts only (cost optimization)
- **IR-039:** System shall support Sinhala and Tamil SMS (Unicode)
- **IR-040:** System shall track SMS delivery status

**SMS Types:**
- Weather alerts (heavy rain, drought)
- Critical health alerts (severe water stress)
- Harvest reminders

---

## 9. SUCCESS METRICS & KPIs

### 9.1 User Adoption Metrics

**KPI-001: User Acquisition**
- **Metric:** Total registered users
- **Target:** 100 users (Year 1, Month 4)
- **Measurement:** User registration count in database
- **Frequency:** Weekly

**KPI-002: User Activation**
- **Metric:** % of users who complete onboarding (signup + first field mapped)
- **Target:** ≥80%
- **Measurement:** (Users with ≥1 field) / (Total registered users)
- **Frequency:** Weekly

**KPI-003: User Retention**
- **Metric:** % of users active after 30 days
- **Target:** ≥70%
- **Measurement:** (Users with login in last 30 days) / (Users registered 30+ days ago)
- **Frequency:** Monthly

**KPI-004: User Referrals**
- **Metric:** % of users who refer at least 1 other farmer
- **Target:** ≥30%
- **Measurement:** Referral tracking (invite links, promo codes)
- **Frequency:** Monthly

---

### 9.2 Engagement Metrics

**KPI-005: Daily Active Users (DAU)**
- **Metric:** Number of users who open app daily
- **Target:** 20+ users (Year 1, Month 3)
- **Measurement:** Unique users with session in last 24 hours
- **Frequency:** Daily

**KPI-006: Session Frequency**
- **Metric:** Average sessions per user per week
- **Target:** ≥3 sessions/week
- **Measurement:** Total sessions / Total users / Weeks
- **Frequency:** Weekly

**KPI-007: Session Duration**
- **Metric:** Average time spent per session
- **Target:** 3-5 minutes (efficient, focused usage)
- **Measurement:** Session end time - Session start time
- **Frequency:** Weekly

**KPI-008: Feature Adoption**
- **Metric:** % of users who use each core feature
- **Target:** ≥70% use health monitoring, ≥60% use recommendations, ≥50% use yield prediction
- **Measurement:** (Users who used feature) / (Total active users)
- **Frequency:** Monthly

---

### 9.3 Business Impact Metrics

**KPI-009: Yield Improvement**
- **Metric:** Average yield increase for SkyCrop users vs. baseline
- **Target:** +15-25%
- **Measurement:** User-reported harvest data, survey
- **Frequency:** Per season (2x/year)

**KPI-010: Water Savings**
- **Metric:** % reduction in water usage
- **Target:** 20-30%
- **Measurement:** User-reported water bills, survey
- **Frequency:** Per season

**KPI-011: Fertilizer Savings**
- **Metric:** % reduction in fertilizer costs
- **Target:** 15-20%
- **Measurement:** User-reported fertilizer expenses, survey
- **Frequency:** Per season

**KPI-012: Economic Impact**
- **Metric:** Total economic benefit to farmers (Rs.)
- **Target:** Rs. 11.17M (100 farmers × Rs. 111,700/year)
- **Measurement:** (Yield increase + Cost savings) × Number of users
- **Frequency:** Annually

---

### 9.4 Technical Performance Metrics

**KPI-013: System Uptime**
- **Metric:** % of time system is available
- **Target:** ≥99%
- **Measurement:** Uptime monitoring tool (UptimeRobot)
- **Frequency:** Real-time, reported monthly

**KPI-014: API Response Time**
- **Metric:** 95th percentile API response time
- **Target:** <3 seconds
- **Measurement:** Application Performance Monitoring (APM) tool
- **Frequency:** Real-time, reported weekly

**KPI-015: Mobile App Crash Rate**
- **Metric:** % of sessions that end in crash
- **Target:** <2%
- **Measurement:** Firebase Crashlytics
- **Frequency:** Real-time, reported weekly

**KPI-016: AI Model Accuracy**
- **Metric:** Boundary detection IoU, Yield prediction MAPE
- **Target:** IoU ≥0.85, MAPE <15%
- **Measurement:** Validation dataset, actual harvest data
- **Frequency:** Monthly (model retraining)

---

### 9.5 User Satisfaction Metrics

**KPI-017: Net Promoter Score (NPS)**
- **Metric:** "How likely are you to recommend SkyCrop to other farmers?" (0-10 scale)
- **Target:** NPS ≥40 (Promoters - Detractors)
- **Measurement:** In-app survey (quarterly)
- **Frequency:** Quarterly

**KPI-018: User Satisfaction Score**
- **Metric:** "How satisfied are you with SkyCrop?" (1-5 scale)
- **Target:** ≥4.0/5.0
- **Measurement:** In-app survey (quarterly)
- **Frequency:** Quarterly

**KPI-019: Task Success Rate**
- **Metric:** % of users who successfully complete key tasks (UAT)
- **Target:** ≥80%
- **Measurement:** User testing sessions (observe task completion)
- **Frequency:** Pre-launch (Week 15), then quarterly

**KPI-020: Support Ticket Volume**
- **Metric:** Number of support tickets per 100 users
- **Target:** <10 tickets/100 users/month
- **Measurement:** Support ticket system
- **Frequency:** Monthly

---

### 9.6 Financial Metrics (Phase 2+)

**KPI-021: Conversion Rate (Free to Premium)**
- **Metric:** % of free users who upgrade to premium
- **Target:** ≥20%
- **Measurement:** (Premium subscribers) / (Total users)
- **Frequency:** Monthly

**KPI-022: Monthly Recurring Revenue (MRR)**
- **Metric:** Total subscription revenue per month
- **Target:** Rs. 79,000 (Year 2, Month 12)
- **Measurement:** Sum of all active subscriptions
- **Frequency:** Monthly

**KPI-023: Customer Lifetime Value (LTV)**
- **Metric:** Average revenue per user over 3 years
- **Target:** Rs. 9,000 (Rs. 3,000/year × 3 years)
- **Measurement:** (Total revenue) / (Total users) × Retention rate
- **Frequency:** Quarterly

**KPI-024: Customer Acquisition Cost (CAC)**
- **Metric:** Cost to acquire one user
- **Target:** <Rs. 500
- **Measurement:** (Marketing spend) / (New users acquired)
- **Frequency:** Monthly

**KPI-025: LTV:CAC Ratio**
- **Metric:** Lifetime value divided by acquisition cost
- **Target:** ≥3:1 (healthy SaaS business)
- **Measurement:** LTV / CAC
- **Frequency:** Quarterly

---

## 10. ASSUMPTIONS AND CONSTRAINTS

### 10.1 Assumptions

**Technical Assumptions:**
- **A-001:** Sentinel Hub academic account will be approved and remain free for Year 1
- **A-002:** Sentinel-2 satellite will continue providing free imagery with 5-day revisit
- **A-003:** OpenWeatherMap free tier will be sufficient for Year 1 (1M calls/month)
- **A-004:** Cloud hosting free tiers (AWS, Railway) will be sufficient for 100 users
- **A-005:** Pre-trained U-Net models will achieve ≥85% accuracy with fine-tuning
- **A-006:** Historical yield data will be available for model training (from Dept. of Agriculture)

**User Assumptions:**
- **A-007:** 65% of target farmers have smartphones (growing 10%/year)
- **A-008:** 78% of target farmers have internet access (3G or better)
- **A-009:** Farmers can identify approximate location of their fields on a map
- **A-010:** Farmers have basic digital literacy (can use WhatsApp, install apps)
- **A-011:** Farmers are willing to try new technology if it's free and easy to use
- **A-012:** Farmers trust university-backed technology more than commercial products

**Business Assumptions:**
- **A-013:** Dept. of Agriculture will sign partnership MoU by Month 2
- **A-014:** Extension officers will promote SkyCrop to farmers
- **A-015:** University will provide research grant (Rs. 200,000) for Year 1
- **A-016:** Startup competition prize (Rs. 100,000) will be awarded
- **A-017:** Insurance companies will accept SkyCrop disaster reports as evidence

**Environmental Assumptions:**
- **A-018:** Weather patterns will remain relatively stable (no extreme climate events)
- **A-019:** Paddy farming practices will remain consistent (no major policy changes)
- **A-020:** Satellite imagery quality will remain consistent (no sensor degradation)

---

### 10.2 Constraints

**Technical Constraints:**
- **C-001:** Satellite image resolution limited to 10m (Sentinel-2) or 30m (Landsat)
- **C-002:** Cloud cover may prevent image acquisition (>20% cloud = unusable)
- **C-003:** Satellite revisit time is 5 days (Sentinel-2) - cannot provide daily updates
- **C-004:** AI boundary detection requires 30-60 seconds processing time (user wait)
- **C-005:** Mobile app must work on low-end devices (2GB RAM, Android 8+)
- **C-006:** Internet connectivity in rural areas may be slow (3G) or intermittent

**Budget Constraints:**
- **C-007:** Total Year 1 budget limited to Rs. 365,000 (~$1,200 USD)
- **C-008:** Must use free-tier services wherever possible (Sentinel Hub, Weather API, hosting)
- **C-009:** Cannot afford paid marketing (rely on organic growth, partnerships)
- **C-010:** Cannot hire additional team members (solo developer or small team)

**Timeline Constraints:**
- **C-011:** Project must be completed within 16 weeks (university deadline)
- **C-012:** MVP must be launched by Week 16 (February 28, 2026)
- **C-013:** No slack in schedule (any delay impacts graduation)

**Resource Constraints:**
- **C-014:** Development team is 1-2 people (limited capacity)
- **C-015:** Team has moderate ML/GIS expertise (learning curve for advanced features)
- **C-016:** Limited access to ground-truth data for model validation
- **C-017:** Limited access to farmers for user testing (rely on extension officers)

**Regulatory Constraints:**
- **C-018:** Must comply with GDPR and Sri Lanka Data Protection Act (expected 2026)
- **C-019:** Must obtain university ethics approval for user research
- **C-020:** Cannot provide medical or legal advice (liability concerns)
- **C-021:** Must include disclaimers (yield predictions are estimates, not guarantees)

**Market Constraints:**
- **C-022:** Target market is price-sensitive (farmers have limited disposable income)
- **C-023:** Digital literacy varies widely (45% have no English proficiency)
- **C-024:** Trust in technology is low (28% skeptical of satellite farming)
- **C-025:** Competing with free government extension services

**Geographic Constraints:**
- **C-026:** Phase 1 limited to Sri Lanka (satellite coverage, language, partnerships)
- **C-027:** Phase 1 limited to paddy crops (no multi-crop support)
- **C-028:** Some remote areas may have poor satellite coverage (mountains, forests)

---

## 11. RELEASE STRATEGY

### 11.1 MVP Scope (16-Week Timeline)

**MVP Definition:** Minimum Viable Product with core features to validate value proposition

**Included in MVP (P0 Features):**
- ✅ User authentication (Google OAuth, email/password)
- ✅ Interactive satellite map interface
- ✅ AI-powered field boundary detection (≥85% accuracy)
- ✅ Field area calculation
- ✅ Vegetation indices (NDVI, NDWI, TDVI)
- ✅ Crop health status display
- ✅ Water and fertilizer recommendations
- ✅ Yield prediction (≥85% accuracy)
- ✅ Weather forecast (7-day)
- ✅ Mobile app (Android & iOS)
- ✅ User dashboard

**Excluded from MVP (P1/P2 Features):**
- ❌ Disaster assessment (defer to Month 5)
- ❌ Historical trend visualization (defer to Month 6)
- ❌ Admin dashboard (basic version only)
- ❌ News & knowledge hub (basic version only)
- ❌ Sinhala/Tamil language support (defer to Phase 2)
- ❌ Offline mode (only cached data in MVP)
- ❌ SMS alerts (defer to Phase 2)

**MVP Success Criteria:**
- 50+ farmers onboarded and trained
- 80%+ user retention after 1 month
- ≥4.0/5.0 user satisfaction
- 85%+ AI model accuracy
- 99%+ system uptime

---

### 11.2 Phase 1: Pilot Launch (Months 1-4)

**Timeline:** October 28, 2025 - February 28, 2026 (16 weeks)

**Objectives:**
- Develop and launch MVP
- Onboard 50-100 pilot farmers
- Validate product-market fit
- Collect user feedback for improvements

**Target Users:**
- 50-100 farmers in Polonnaruwa district (high paddy density)
- Tech-savvy early adopters (smartphone users, basic digital literacy)
- Recruited via extension officers and farmer organizations

**Go-to-Market Strategy:**
- Partner with Dept. of Agriculture for credibility
- Conduct 3 farmer field days (hands-on demonstrations)
- Recruit "champion farmers" as advocates
- WhatsApp groups for support and community building
- Free access for all pilot users (no subscription)

**Key Activities:**
- **Week 1-2:** Planning & requirements
- **Week 3-4:** System design
- **Week 5-8:** AI/ML development (critical path)
- **Week 9-11:** Frontend development
- **Week 12-13:** Mobile app development
- **Week 14-15:** Testing & bug fixing
- **Week 16:** Deployment & farmer onboarding

**Success Metrics:**
- 50+ farmers onboarded
- 80%+ retention after 1 month
- ≥4.0/5.0 satisfaction
- 10%+ yield improvement (early indicators)

**Risks:**
- AI model accuracy <85% (mitigation: pre-trained models, 2-week buffer)
- Low farmer adoption (mitigation: extension officer partnerships, free tier)
- Timeline delays (mitigation: MVP focus, agile sprints)

---

### 11.3 Phase 2: Expansion (Months 5-12)

**Timeline:** March 2026 - October 2026 (8 months)

**Objectives:**
- Scale to 500-1,000 farmers across 3 districts
- Introduce premium features (freemium model)
- Improve product based on pilot feedback
- Establish revenue model

**Target Users:**
- 500-1,000 farmers in Polonnaruwa, Anuradhapura, Ampara districts
- Mix of early adopters and early majority
- Recruited via word-of-mouth, digital marketing, extension officers

**New Features (P1):**
- ✅ Disaster assessment
- ✅ Historical trend visualization
- ✅ Full admin dashboard
- ✅ News & knowledge hub
- ✅ Multi-field management (up to 10 fields)
- ✅ Sinhala language support (Tamil in Phase 3)

**Freemium Model:**
- **Free Tier:** Basic health monitoring, weather, news (80% of users)
- **Premium Tier:** Yield prediction, disaster assessment, historical analytics (Rs. 1,500/season, 20% of users)

**Go-to-Market Strategy:**
- Digital marketing (Facebook, WhatsApp groups)
- Farmer testimonials and success stories
- Partnership with insurance companies (disaster assessment)
- Partnership with banks (yield prediction for loan applications)

**Success Metrics:**
- 500-1,000 farmers onboarded
- 20% free-to-premium conversion
- Rs. 450,000-900,000 revenue
- 15%+ yield improvement (validated)
- 20%+ water savings (validated)

---

### 11.4 Phase 3: National Scale (Year 2)

**Timeline:** November 2026 - October 2027 (12 months)

**Objectives:**
- Scale to 5,000 farmers nationally
- Achieve profitability
- Expand feature set
- Establish SkyCrop as leading agri-tech platform in Sri Lanka

**Target Users:**
- 5,000 farmers across all major paddy-growing districts
- Mainstream market (early and late majority)
- Recruited via all channels (digital, partnerships, word-of-mouth)

**New Features (P2):**
- ✅ Tamil language support
- ✅ Offline mode (full functionality)
- ✅ SMS alerts
- ✅ Community forum
- ✅ Advanced analytics
- ✅ API access for third parties

**Revenue Streams:**
- B2C subscriptions (Rs. 3,000-6,000/year per farmer)
- B2B partnerships (insurance, banks, input suppliers)
- Government contracts (district-level monitoring)
- Data licensing (anonymized, aggregate data)

**Go-to-Market Strategy:**
- TV/radio advertising (reach rural areas)
- Government endorsement (Dept. of Agriculture)
- Agri-input supplier partnerships (bundled offerings)
- Farmer cooperative partnerships

**Success Metrics:**
- 5,000 farmers onboarded
- Rs. 8-10M revenue
- Profitable (positive cash flow)
- 20%+ yield improvement (proven at scale)
- 4.5/5.0 user satisfaction

---

### 11.5 Phase 4: Regional Expansion (Year 3+)

**Timeline:** Year 3 onwards

**Objectives:**
- Expand to 50,000+ farmers in Sri Lanka
- Expand to other South Asian countries (India, Bangladesh, Pakistan)
- Expand to other crops (rice, wheat, sugarcane)
- Become leading precision agriculture platform in South Asia

**Target Markets:**
- Sri Lanka: 50,000+ paddy farmers (2.8% market penetration)
- India: 100M+ rice farmers (pilot in 2-3 states)
- Bangladesh: 15M+ rice farmers
- Pakistan: 10M+ rice farmers

**New Features:**
- ✅ Multi-crop support (rice, wheat, sugarcane, cotton)
- ✅ Pest & disease detection (AI-powered image recognition)
- ✅ IoT sensor integration (soil moisture, temperature)
- ✅ Drone imagery processing
- ✅ Marketplace (connect farmers with buyers)
- ✅ Financial services integration (loans, insurance, payments)

**Revenue Model:**
- Freemium SaaS (Rs. 3,000-10,000/year per farmer)
- Enterprise licenses (agribusinesses, governments)
- Transaction fees (marketplace, financial services)
- Data analytics services

**Go-to-Market Strategy:**
- Series A funding (Rs. 50-100M) for expansion
- Strategic partnerships (telecom, banks, agribusinesses)
- Government contracts (national agricultural monitoring)
- International expansion (localize for each country)

**Success Metrics:**
- 50,000+ farmers in Sri Lanka
- 100,000+ farmers regionally
- Rs. 70-100M revenue
- Profitable with 30%+ margins
- Market leader in South Asia

---

## 12. APPENDICES

### Appendix A: Glossary of Terms

| **Term** | **Definition** |
|----------|----------------|
| **NDVI** | Normalized Difference Vegetation Index - measures vegetation health (0-1 scale, higher = healthier) |
| **NDWI** | Normalized Difference Water Index - measures water content in plants (0-1 scale, higher = more water) |
| **TDVI** | Transformed Difference Vegetation Index - alternative vegetation health metric |
| **U-Net** | Convolutional neural network architecture for image segmentation (boundary detection) |
| **IoU** | Intersection over Union - metric for boundary detection accuracy (0-1 scale, higher = better) |
| **MAPE** | Mean Absolute Percentage Error - metric for prediction accuracy (lower = better) |
| **Sentinel-2** | European satellite providing free 10m resolution multispectral imagery, 5-day revisit |
| **NIR** | Near-Infrared band (Sentinel-2 Band 8) - used for vegetation analysis |
| **SWIR** | Short-Wave Infrared band (Sentinel-2 Band 11) - used for water content analysis |
| **MVP** | Minimum Viable Product - simplest version with core features only |
| **NPS** | Net Promoter Score - customer satisfaction metric (-100 to +100, higher = better) |
| **LTV** | Lifetime Value - total revenue expected from a customer over their lifetime |
| **CAC** | Customer Acquisition Cost - cost to acquire one new customer |
| **Freemium** | Business model with free basic tier and paid premium tier |

---

### Appendix B: References

**Planning & Initiation Phase Documents:**
1. Project Charter (SKYCROP-2025-001)
2. Business Case (SKYCROP-BC-2025-001)
3. Feasibility Study (SKYCROP-FS-2025-001)
4. Project Plan (SKYCROP-PP-2025-001)

**Technical References:**
1. Sentinel Hub API Documentation: https://docs.sentinel-hub.com/
2. OpenWeatherMap API Documentation: https://openweathermap.org/api
3. U-Net Paper: "U-Net: Convolutional Networks for Biomedical Image Segmentation" (Ronneberger et al., 2015)
4. DeepGlobe Agriculture Dataset: http://deepglobe.org/

**Industry Standards:**
1. ISO/IEC 25010: Software Quality Model
2. WCAG 2.1: Web Content Accessibility Guidelines
3. OWASP Top 10: Web Application Security Risks
4. Material Design Guidelines: https://material.io/design
5. iOS Human Interface Guidelines: https://developer.apple.com/design/

**Market Research:**
1. Sri Lanka Department of Census & Statistics (2024)
2. FAO: Digital Agriculture State of Play Report (2023)
3. World Bank: Sri Lanka Agriculture Sector Review (2024)
4. MarketsandMarkets: Precision Agriculture Market Forecast (2024)

---

### Appendix C: Stakeholder Sign-Off

**Product Requirements Document Approval:**

By signing below, the undersigned acknowledge that they have reviewed the Product Requirements Document and agree to the product vision, features, and success criteria outlined herein.

| **Name** | **Role** | **Signature** | **Date** |
|----------|----------|---------------|----------|
| [Your Name] | Product Manager | _________________ | __________ |
| [BA Name] | Business Analyst | _________________ | __________ |
| [UX Name] | UX Lead | _________________ | __________ |
| [Tech Lead] | Technical Lead | _________________ | __________ |
| [Supervisor Name] | Project Sponsor | _________________ | __________ |

**Approval Decision:** ☐ APPROVED - Proceed to Design Phase ☐ CONDITIONAL APPROVAL ☐ REJECTED

**Comments:**

---

---

---

## DOCUMENT HISTORY

| **Version** | **Date** | **Author** | **Changes** |
|-------------|----------|------------|-------------|
| 0.1 | Oct 28, 2025 | Product Manager | Initial draft (Executive Summary, Product Overview) |
| 0.5 | Oct 28, 2025 | Product Manager | Added User Personas, Journey Maps, Feature Requirements |
| 0.9 | Oct 28, 2025 | Product Manager | Added Functional/Non-Functional Requirements, UI/UX, Integrations |
| 1.0 | Oct 28, 2025 | Product Manager | Final version (Success Metrics, Assumptions, Release Strategy) |

---

**END OF PRODUCT REQUIREMENTS DOCUMENT**

---

**Next Steps:**
1. ✅ Obtain PRD approval from all stakeholders
2. ✅ Proceed to System Design Phase (architecture, database schema, API specs)
3. ✅ Create UI/UX mockups in Figma (based on UI requirements)
4. ✅ Begin technical implementation (Week 3)

**For Questions or Clarifications:**
Contact Product Manager: [Your Email] | [Your Phone]

**Document Location:** `Doc/Requirements Analysis Phase/product_requirements_document.md`

---

*This document is confidential and intended for project stakeholders only.*