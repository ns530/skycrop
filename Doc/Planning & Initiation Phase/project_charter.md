# PROJECT CHARTER
## SkyCrop: Satellite-Based Paddy Field Management & Monitoring System

---

## 1. PROJECT IDENTIFICATION

| **Item** | **Details** |
|----------|-------------|
| **Project Name** | SkyCrop - Intelligent Paddy Field Monitoring System |
| **Project Code** | SKYCROP-2025-001 |
| **Project Sponsor** | Department of Agriculture / University Research Department |
| **Project Manager** | [Your Name] |
| **Document Version** | 1.0 |
| **Date of Authorization** | October 28, 2025 |
| **Project Duration** | 16 Weeks (4 Months) |
| **Expected Completion** | February 28, 2026 |

---

## 2. EXECUTIVE SUMMARY

SkyCrop is an innovative satellite-based agricultural monitoring system designed to revolutionize paddy farming in Sri Lanka through advanced remote sensing technology and artificial intelligence. The system empowers farmers with real-time insights into crop health, yield predictions, and disaster impact assessments, enabling data-driven decision-making and improved agricultural productivity.

By leveraging Earth observation satellites (Sentinel-2, Landsat), machine learning algorithms, and intuitive user interfaces, SkyCrop addresses critical challenges faced by Sri Lankan paddy farmers including unpredictable yields, inefficient resource management, and vulnerability to natural disasters.

---

## 3. PROJECT PURPOSE & JUSTIFICATION

### 3.1 Business Problem Statement

Sri Lankan paddy farmers currently face significant challenges:

- **Limited Visibility**: Inability to accurately monitor large-scale paddy fields and assess crop health in real-time
- **Unpredictable Yields**: Lack of scientific methods to predict harvest quantities, leading to market planning difficulties
- **Resource Inefficiency**: Over or under-application of water and fertilizers due to lack of precise plant health data
- **Disaster Vulnerability**: No systematic approach to quantify crop damage after floods, droughts, or other natural disasters
- **Information Gap**: Farmers lack access to actionable, localized agricultural insights and decision-support tools

### 3.2 Project Purpose

To develop an accessible, AI-powered platform that provides paddy farmers with:
1. Automated field boundary detection and area calculation
2. Real-time crop health monitoring through vegetation indices (NDVI, NDWI, TDVI)
3. Scientifically-backed yield predictions
4. Precise water and fertilizer recommendations
5. Disaster impact assessment and loss quantification
6. Weather forecasts and agricultural news/events

### 3.3 Business Value & Benefits

**For Farmers:**
- Increase crop yields by 15-25% through optimized resource management
- Reduce water consumption by 20-30% through targeted irrigation
- Reduce fertilizer costs by 15-20% through precision application
- Access insurance claims data with quantified disaster damage
- Make informed decisions based on scientific data

**For Agricultural Sector:**
- Enhanced food security through improved paddy production
- Better market planning with aggregate yield predictions
- Data-driven policy making for agricultural development
- Environmental sustainability through reduced chemical usage

**For Project Stakeholders:**
- Academic contribution to precision agriculture research
- Technology showcase for remote sensing applications
- Foundation for scalable agricultural technology solutions

---

## 4. PROJECT OBJECTIVES (SMART Goals)

### Primary Objectives

| **#** | **Objective** | **Success Criteria** | **Timeline** |
|-------|---------------|---------------------|--------------|
| 1 | **Develop satellite-based monitoring system** | Successful integration with Sentinel-2/Landsat APIs; real-time image retrieval functionality | Week 4 |
| 2 | **Improve yield prediction accuracy** | Achieve ≥85% accuracy in yield predictions compared to actual harvest data | Week 8 |
| 3 | **Monitor and assess paddy plant health** | Calculate NDVI, NDWI, TDVI with ≥90% accuracy; provide actionable recommendations | Week 6 |
| 4 | **Assess natural disaster impact** | Automated damage detection with ≥80% accuracy; quantify losses in hectares and monetary terms | Week 10 |
| 5 | **Create scalable model** | System architecture supports 1000+ concurrent users; cloud-based deployment | Week 14 |
| 6 | **Provide decision-support tools** | User-friendly web and mobile interfaces; recommendation engine with ≥4.0/5.0 user satisfaction | Week 16 |

### Secondary Objectives

- Develop AI-powered automatic field boundary detection (≥85% accuracy)
- Integrate weather forecasting for 7-day predictions
- Create admin dashboard for content management (news, events, weather)
- Implement multi-platform accessibility (Web, Mobile Android/iOS)
- Establish data security and user privacy protocols

---

## 5. PROJECT SCOPE

### 5.1 In-Scope

**Core Functionality:**
- ✅ User authentication (Google OAuth, Email/Password, Password Reset)
- ✅ Interactive satellite map interface for field selection
- ✅ AI-powered automatic paddy field boundary detection
- ✅ Automated area calculation (hectares)
- ✅ Vegetation indices calculation (NDVI, NDWI, TDVI)
- ✅ Plant health assessment with color-coded visualizations
- ✅ Water and fertilizer recommendations based on health metrics
- ✅ Yield prediction using machine learning models
- ✅ Disaster damage assessment (before/after comparison)
- ✅ Financial loss estimation for damaged fields
- ✅ Weather forecast integration (7-day forecast)
- ✅ News & events content management system
- ✅ Mobile application (React Native/Flutter)
- ✅ Admin dashboard for system management

**Platform Coverage:**
- ✅ Responsive website (Desktop, Tablet)
- ✅ Mobile application (Android, iOS)
- ✅ Admin portal

**Geographic Coverage:**
- ✅ Sri Lanka (all paddy growing regions)
- ✅ Satellite coverage: Sentinel-2 (5-day revisit), Landsat-8 (16-day revisit)

### 5.2 Out-of-Scope

**Not Included in Phase 1:**
- ❌ IoT sensor integration (soil moisture, temperature sensors)
- ❌ Drone imagery processing
- ❌ Automated irrigation system control
- ❌ Marketplace for buying/selling paddy
- ❌ Financial loan/insurance integration
- ❌ Pest and disease detection (future phase)
- ❌ Multi-crop support (currently paddy only)
- ❌ Offline mobile app functionality
- ❌ SMS/WhatsApp notification system
- ❌ Multi-language support (English only in Phase 1)

### 5.3 Constraints

**Technical Constraints:**
- Satellite image resolution: 10m-30m (Sentinel-2/Landsat)
- Cloud cover may affect image availability (>20% cloud = unusable)
- API rate limits: Sentinel Hub (3000 requests/month on free tier)
- Image processing time: 30-60 seconds per field

**Business Constraints:**
- Budget: Academic project (limited/no funding)
- Timeline: 16 weeks (fixed university deadline)
- Resources: Solo developer/small team
- Must use free-tier services and open-source tools

**Regulatory Constraints:**
- GDPR/data privacy compliance for user data
- Ethical use of satellite imagery
- Agricultural data privacy considerations

### 5.4 Assumptions

- Farmers have smartphone or computer access
- Internet connectivity available in target areas
- Farmers can identify approximate location of their fields on map
- Satellite imagery available for Sri Lanka with 5-16 day refresh rate
- Historical yield data available for model training
- Weather API services remain free/accessible during project

---

## 6. HIGH-LEVEL REQUIREMENTS

### 6.1 Functional Requirements

| **ID** | **Requirement** | **Priority** | **Category** |
|--------|-----------------|--------------|--------------|
| FR-01 | User registration with Google OAuth and email/password | High | Authentication |
| FR-02 | Secure login with session management and password reset | High | Authentication |
| FR-03 | Interactive satellite map view of Sri Lanka | High | Mapping |
| FR-04 | Click-to-select field location on map | High | Mapping |
| FR-05 | AI-powered automatic field boundary detection | High | AI/ML |
| FR-06 | Manual boundary adjustment by dragging polygon points | Medium | Mapping |
| FR-07 | Automatic field area calculation in hectares | High | GIS Processing |
| FR-08 | NDVI calculation from satellite imagery | High | Analytics |
| FR-09 | NDWI calculation from satellite imagery | High | Analytics |
| FR-10 | TDVI calculation from satellite imagery | High | Analytics |
| FR-11 | Plant health status display (Excellent/Good/Fair/Poor) | High | Analytics |
| FR-12 | Water requirement recommendations | High | Decision Support |
| FR-13 | Fertilizer application recommendations | High | Decision Support |
| FR-14 | Yield prediction based on field data | High | AI/ML |
| FR-15 | Historical health trend visualization (graphs) | Medium | Visualization |
| FR-16 | Disaster damage detection and quantification | High | AI/ML |
| FR-17 | Financial loss estimation for disasters | Medium | Analytics |
| FR-18 | 7-day weather forecast display | Medium | Weather |
| FR-19 | Admin dashboard for news/events management | Medium | Admin |
| FR-20 | Mobile app with core functionality parity | High | Mobile |

### 6.2 Non-Functional Requirements

| **ID** | **Requirement** | **Target Metric** | **Category** |
|--------|-----------------|-------------------|--------------|
| NFR-01 | System response time for map interactions | < 2 seconds | Performance |
| NFR-02 | AI boundary detection processing time | < 60 seconds | Performance |
| NFR-03 | Vegetation indices calculation time | < 30 seconds | Performance |
| NFR-04 | System uptime availability | 99.5% | Reliability |
| NFR-05 | Concurrent user support | 1000+ users | Scalability |
| NFR-06 | Mobile app compatibility | Android 8+, iOS 13+ | Compatibility |
| NFR-07 | Browser compatibility | Chrome, Firefox, Safari (latest 2 versions) | Compatibility |
| NFR-08 | Data encryption in transit | TLS 1.3 | Security |
| NFR-09 | Password encryption | bcrypt (10+ rounds) | Security |
| NFR-10 | User data backup frequency | Daily | Reliability |
| NFR-11 | Mobile app size | < 50 MB | Performance |
| NFR-12 | Responsive design breakpoints | Mobile, Tablet, Desktop | Usability |

### 6.3 Technical Requirements

**Backend:**
- RESTful API architecture
- Node.js (v18+) or Python FastAPI
- PostgreSQL for structured data (spatial support)
- MongoDB for flexible document storage
- JWT-based authentication
- Cloud deployment (AWS/Google Cloud/Heroku)

**Frontend:**
- React.js (v18+) for web application
- React Native or Flutter for mobile app
- Tailwind CSS for styling
- Leaflet.js or Google Maps API for mapping
- Recharts for data visualization

**AI/ML:**
- Python 3.9+
- TensorFlow/PyTorch for deep learning
- Scikit-learn for traditional ML
- OpenCV for image processing
- U-Net architecture for boundary detection
- Random Forest for yield prediction

**External Services:**
- Sentinel Hub API or Google Earth Engine
- OpenWeatherMap API
- Firebase Authentication (optional)
- AWS S3 for image storage

---

## 7. MILESTONES & DELIVERABLES

### Phase-wise Deliverables

| **Phase** | **Milestone** | **Deliverables** | **Duration** | **End Date** |
|-----------|---------------|------------------|--------------|-------------|
| **Phase 1** | Project Initiation | • Project Charter<br>• Business Case<br>• Feasibility Study<br>• Project Plan<br>• Requirements Document | Week 1-2 | Week 2 |
| **Phase 2** | System Design | • System Architecture Document<br>• Database Schema<br>• API Specifications<br>• UI/UX Mockups<br>• Technology Stack Selection | Week 3-4 | Week 4 |
| **Phase 3** | Infrastructure Setup | • Backend API Framework<br>• Database Setup<br>• Satellite API Integration<br>• Authentication System<br>• Development Environment | Week 3-5 | Week 5 |
| **Phase 4** | AI Model Development | • Boundary Detection Model (U-Net)<br>• Trained on Agricultural Dataset<br>• Vegetation Indices Calculator<br>• Yield Prediction Model<br>• Disaster Detection Model | Week 5-8 | Week 8 |
| **Phase 5** | Frontend Development | • Responsive Website<br>• Interactive Map Interface<br>• User Dashboard<br>• Health Visualization<br>• Admin Panel | Week 9-11 | Week 11 |
| **Phase 6** | Mobile App Development | • React Native/Flutter App<br>• Authentication Flow<br>• Map View<br>• Dashboard Screens<br>• Push Notifications Setup | Week 12-13 | Week 13 |
| **Phase 7** | Integration & Testing | • API Integration<br>• Unit Testing (80% coverage)<br>• Integration Testing<br>• User Acceptance Testing<br>• Performance Testing | Week 14-15 | Week 15 |
| **Phase 8** | Deployment & Documentation | • Production Deployment<br>• User Documentation<br>• API Documentation<br>• Technical Documentation<br>• Video Demo | Week 16 | Week 16 |

### Key Milestones

```
Week 2:  ✓ Project Charter Approved
Week 4:  ✓ Satellite API Successfully Integrated
Week 6:  ✓ AI Boundary Detection Model Trained
Week 8:  ✓ Vegetation Indices Calculator Functional
Week 10: ✓ Web Dashboard Completed
Week 12: ✓ Mobile App Beta Released
Week 14: ✓ System Integration Complete
Week 16: ✓ Final Deployment & Project Handover
```

---

## 8. STAKEHOLDER ANALYSIS

### 8.1 Key Stakeholders

| **Stakeholder** | **Role** | **Interest** | **Influence** | **Engagement Strategy** |
|-----------------|----------|--------------|---------------|------------------------|
| **Paddy Farmers** | End Users | High - Direct beneficiaries of the system | Medium | Weekly updates, user testing sessions, feedback collection |
| **Project Sponsor** | Funding/Authority | High - Project success impacts reputation | High | Bi-weekly status reports, milestone reviews |
| **University Supervisor** | Academic Advisor | High - Academic quality and innovation | High | Weekly meetings, technical reviews, documentation review |
| **Development Team** | Implementers | High - Career development, learning | High | Daily standups, sprint planning, retrospectives |
| **Department of Agriculture** | Domain Expert | Medium - Potential future adoption | Medium | Monthly consultations, domain validation |
| **Technology Partners** | API Providers | Low - Service utilization | Low | Technical support tickets, API documentation |
| **Local Farming Communities** | Beta Testers | High - Early access and influence | Medium | Field testing sessions, community workshops |

### 8.2 Stakeholder Communication Plan

| **Stakeholder Group** | **Communication Method** | **Frequency** | **Content** |
|----------------------|--------------------------|---------------|-------------|
| Project Sponsor | Status Report (Email/Document) | Bi-weekly | Progress, risks, budget, next steps |
| University Supervisor | Face-to-face Meeting | Weekly | Technical challenges, design decisions, academic rigor |
| End Users (Farmers) | WhatsApp/Email Updates | Monthly | Feature previews, testing invitations, benefits |
| Development Team | Slack/Discord + Meetings | Daily | Tasks, blockers, technical discussions |
| Agricultural Experts | Video Call Consultations | As needed | Domain validation, algorithm review |

---

## 9. PROJECT RISKS

### Risk Register

| **Risk ID** | **Risk Description** | **Probability** | **Impact** | **Risk Level** | **Mitigation Strategy** | **Owner** |
|-------------|---------------------|-----------------|------------|----------------|------------------------|-----------|
| R-01 | Satellite API rate limits exceeded | Medium | High | **HIGH** | Use caching; implement request queue; upgrade to paid tier if needed | PM |
| R-02 | Cloud cover prevents image acquisition | High | Medium | **HIGH** | Use multi-date composites; implement cloud masking algorithms | Tech Lead |
| R-03 | AI model accuracy below 80% threshold | Medium | High | **HIGH** | Allocate extra time for model tuning; use pre-trained models; expand training dataset | ML Engineer |
| R-04 | Timeline delays due to technical complexity | Medium | Medium | **MEDIUM** | Implement MVP first; use agile sprints; have backup features list | PM |
| R-05 | Limited training data for ML models | Medium | High | **HIGH** | Use data augmentation; leverage public datasets; simulate synthetic data | ML Engineer |
| R-06 | Internet connectivity issues in rural areas | High | Medium | **HIGH** | Optimize for low bandwidth; implement progressive loading; provide offline data viewing | Frontend Dev |
| R-07 | User adoption challenges (low tech literacy) | Medium | High | **HIGH** | Design intuitive UI; provide video tutorials; conduct farmer training sessions | UX Designer |
| R-08 | Database scalability issues | Low | High | **MEDIUM** | Use cloud-based auto-scaling; optimize queries; implement caching | Backend Dev |
| R-09 | Budget constraints for cloud services | Medium | Medium | **MEDIUM** | Use free tiers; optimize resource usage; seek academic credits | PM |
| R-10 | Security vulnerabilities in authentication | Low | Critical | **HIGH** | Use established libraries; conduct security audit; implement 2FA | Security Lead |

### Risk Response Strategies

**High Priority Risks:**
1. **Satellite API Limitations**: Negotiate academic access; implement intelligent caching
2. **ML Model Accuracy**: Start model training early; allocate 2-week buffer for optimization
3. **User Adoption**: Partner with agricultural extension officers for farmer training

---

## 10. BUDGET & RESOURCE ALLOCATION

### 10.1 Resource Requirements

| **Resource Category** | **Description** | **Estimated Cost** | **Notes** |
|----------------------|-----------------|-------------------|-----------|
| **Human Resources** | Developer time (16 weeks) | $0 (Academic) | Student project |
| **Cloud Hosting** | AWS/Heroku/Railway | $50-100/month | Free tier + minimal paid |
| **Satellite API** | Sentinel Hub API | $0-200 (Academic) | Free tier available |
| **Domain & SSL** | skycrop.com | $15/year | Optional for production |
| **Weather API** | OpenWeatherMap | $0 | Free tier (60 calls/min) |
| **Database Hosting** | PostgreSQL + MongoDB | $0-50/month | Free tier available |
| **Storage (S3)** | Image/file storage | $10-30/month | Pay-as-you-go |
| **Mobile App Deployment** | Google Play + App Store | $25 + $99 | One-time fees |
| **Development Tools** | IDEs, design tools | $0 | Free/student licenses |
| **Testing Devices** | Mobile phones for testing | $0 | Use personal devices |
| **Miscellaneous** | Buffer for unexpected costs | $100 | Contingency |

**Total Estimated Budget:** $400-$600 (Minimal for academic project)

### 10.2 Time Allocation (16 Weeks)

| **Activity** | **Hours/Week** | **Total Hours** | **Percentage** |
|-------------|----------------|-----------------|----------------|
| Planning & Requirements | 15 | 30 | 5% |
| System Design | 20 | 40 | 6% |
| Backend Development | 25 | 100 | 16% |
| AI/ML Development | 30 | 120 | 19% |
| Frontend Development | 25 | 100 | 16% |
| Mobile App Development | 20 | 80 | 13% |
| Testing & QA | 20 | 80 | 13% |
| Documentation | 15 | 60 | 10% |
| Deployment & DevOps | 10 | 20 | 3% |

**Total Development Hours:** 630 hours (~40 hours/week)

---

## 11. SUCCESS CRITERIA

### 11.1 Technical Success Metrics

| **Metric** | **Target** | **Measurement Method** |
|------------|------------|----------------------|
| AI Boundary Detection Accuracy | ≥85% | Intersection over Union (IoU) on test dataset |
| Vegetation Indices Accuracy | ≥90% | Comparison with ground-truth measurements |
| Yield Prediction Accuracy | ≥85% | Mean Absolute Percentage Error (MAPE) |
| Disaster Detection Accuracy | ≥80% | Confusion matrix on labeled disaster data |
| System Response Time | <3 seconds | Load testing with Apache JMeter |
| Mobile App Crash Rate | <2% | Firebase Crashlytics |
| API Uptime | ≥99% | Uptime monitoring (UptimeRobot) |

### 11.2 Business Success Metrics

| **Metric** | **Target** | **Timeline** |
|------------|------------|--------------|
| User Registrations | 50+ farmers | Within 1 month of launch |
| Daily Active Users | 20+ | By end of Month 2 |
| Field Monitoring Sessions | 100+ fields mapped | By end of Month 3 |
| User Satisfaction Score | ≥4.0/5.0 | User surveys after 1 month |
| Feature Adoption Rate | ≥70% use core features | Analytics after 2 months |

### 11.3 Academic Success Criteria

- ✅ Project demonstrates innovation in precision agriculture
- ✅ Application of advanced AI/ML techniques
- ✅ Comprehensive technical documentation
- ✅ Working prototype with all core features
- ✅ Research paper or technical report submission
- ✅ Successful final presentation and demonstration
- ✅ Code repository with proper documentation

---

## 12. PROJECT GOVERNANCE

### 12.1 Project Organization Structure

```
┌─────────────────────────────────┐
│     Project Sponsor/Supervisor   │
│    (University Department)       │
└─────────────────────────────────┘
                 │
┌─────────────────────────────────┐
│       Project Manager            │
│       [Your Name]                │
└─────────────────────────────────┘
                 │
    ┌────────────┼────────────┐
    │            │            │
┌───────┐   ┌────────┐   ┌────────┐
│Backend│   │AI/ML   │   │Frontend│
│ Dev   │   │Engineer│   │  Dev   │
└───────┘   └────────┘   └────────┘
```

### 12.2 Decision-Making Authority

| **Decision Type** | **Authority** | **Approval Process** |
|------------------|---------------|---------------------|
| Project Scope Changes | Project Sponsor + PM | Formal change request |
| Technical Architecture | PM + Tech Team | Team consensus |
| Technology Stack Selection | PM + Tech Team | Research & voting |
| Budget Allocation | Project Sponsor | Budget request review |
| Timeline Extensions | Project Sponsor + PM | Impact assessment |
| Feature Prioritization | PM | MoSCoW method |

### 12.3 Change Management Process

1. **Change Request Submission** → Document proposed change
2. **Impact Analysis** → Assess scope, timeline, cost, resources
3. **Review & Approval** → Stakeholder review meeting
4. **Implementation** → Execute approved changes
5. **Communication** → Notify all stakeholders
6. **Documentation** → Update project documents

---

## 13. PROJECT ASSUMPTIONS & DEPENDENCIES

### 13.1 Assumptions

1. University/sponsor provides necessary approvals and support
2. Satellite imagery APIs remain accessible throughout project
3. Free-tier cloud services are sufficient for MVP
4. Farmers have basic smartphone/computer literacy
5. Internet connectivity available in target farming areas (3G minimum)
6. Weather API data is accurate and reliable
7. Historical yield data available for model training
8. Team members remain committed throughout 16 weeks
9. No major technical blockers that require specialized expertise
10. Agricultural domain experts available for consultation

### 13.2 Dependencies

**External Dependencies:**
- Sentinel Hub or Google Earth Engine API availability
- OpenWeatherMap API uptime and accuracy
- Google OAuth service availability
- Cloud hosting provider (AWS/Heroku) reliability
- Mobile app store approval processes

**Internal Dependencies:**
- AI model training depends on dataset availability (Week 3-4)
- Frontend development depends on API completion (Week 9)
- Mobile app depends on web dashboard completion (Week 11)
- Testing depends on all features integrated (Week 14)
- Deployment depends on testing completion (Week 15)

---

## 14. COMPLIANCE & ETHICAL CONSIDERATIONS

### 14.1 Data Privacy & Security

- **GDPR Compliance**: User consent for data collection; right to data deletion
- **User Data Protection**: Encrypted storage of personal information
- **Satellite Image Usage**: Compliance with Copernicus/USGS terms of service
- **Agricultural Data Privacy**: Farmers' field data kept confidential
- **Authentication Security**: Industry-standard OAuth 2.0 and JWT

### 14.2 Ethical Considerations

- **Transparency**: Clear communication about system limitations and accuracy
- **Accessibility**: Free access for small-scale farmers
- **No Discrimination**: Equal service regardless of farm size or location
- **Environmental Responsibility**: Promote sustainable farming practices
- **Data Ownership**: Farmers retain ownership of their field data

---

## 15. COMMUNICATION PLAN

### 15.1 Internal Communication

| **What** | **Who** | **When** | **How** |
|----------|---------|----------|---------|
| Daily Progress | Team Members | Daily | Slack/Discord standups |
| Technical Issues | Team + PM | As needed | GitHub Issues |
| Weekly Status | PM → Supervisor | Weekly | Email + Meeting |
| Sprint Planning | Team | Bi-weekly | Video call |

### 15.2 External Communication

| **Stakeholder** | **Message** | **Frequency** | **Channel** |
|----------------|-------------|---------------|-------------|
| Farmers | Feature updates, benefits | Monthly | WhatsApp/Email |
| Sponsor | Progress reports | Bi-weekly | Formal report |
| Agricultural Dept | Consultation requests | As needed | Email/Call |

---

## 16. PROJECT APPROVAL

### 16.1 Sign-Off

This Project Charter formally authorizes the **SkyCrop: Satellite-Based Paddy Field Management & Monitoring System** project. The signatories below acknowledge their understanding and acceptance of the project scope, objectives, and commitments outlined in this document.

| **Name** | **Role** | **Signature** | **Date** |
|----------|----------|---------------|----------|
| [Supervisor Name] | Project Sponsor / Academic Supervisor | _________________ | __________ |
| [Your Name] | Project Manager / Lead Developer | _________________ | __________ |
| [Team Member] | Technical Lead / Developer | _________________ | __________ |

### 16.2 Approval Conditions

The project is approved to proceed with the following conditions:
1. ✅ Monthly progress reviews with supervisor
2. ✅ Adherence to university ethical guidelines
3. ✅ Documentation of all technical decisions
4. ✅ Demonstration of working prototype at milestones
5. ✅ Final project report and presentation by Week 16

---

## 17. APPENDICES

### Appendix A: Acronyms & Definitions

- **NDVI**: Normalized Difference Vegetation Index
- **NDWI**: Normalized Difference Water Index
- **TDVI**: Transformed Difference Vegetation Index
- **NIR**: Near-Infrared
- **SWIR**: Short-Wave Infrared
- **GIS**: Geographic Information System
- **API**: Application Programming Interface
- **MVP**: Minimum Viable Product
- **ML**: Machine Learning
- **AI**: Artificial Intelligence
- **CNN**: Convolutional Neural Network
- **IoU**: Intersection over Union

### Appendix B: Related Documents

- Business Case Document (To be created in Phase 1)
- Feasibility Study (To be created in Phase 1)
- Detailed Project Plan (To be created in Phase 1)
- System Requirements Specification (To be created in Phase 2)
- System Architecture Document (To be created in Phase 2)

### Appendix C: References

1. Sentinel Hub API Documentation: https://docs.sentinel-hub.com/
2. Google Earth Engine Documentation: https://developers.google.com/earth-engine
3. Agricultural Remote Sensing Handbook
4. U-Net: Convolutional Networks for Biomedical Image Segmentation
5. PMBOK Guide (Project Management Body of Knowledge)

---

## Document Control

| **Version** | **Date** | **Author** | **Changes** |
|-------------|----------|------------|-------------|
| 1.0 | October 28, 2025 | [Your Name] | Initial Project Charter |

---

**END OF PROJECT CHARTER**

---

**Next Steps:**
1. Obtain formal approval and signatures
2. Proceed to create Business Case document
3. Conduct Feasibility Study
4. Develop detailed Project Plan
5. Begin Phase 2: System Design

**For Questions or Clarifications:**
Contact Project Manager: [Your Email]

---

*This document is confidential and intended for project stakeholders only.*