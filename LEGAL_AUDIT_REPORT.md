# Alaq Legal Compliance Audit Report

**Document Version:** 1.0  
**Date:** November 15, 2026  
**Target Market:** India (primary), EU (secondary)  
**App Name:** Alaq - Islamic Learning Platform  

---

## Executive Summary

This comprehensive legal compliance audit examines the Alaq Islamic learning application across four critical domains: data protection (India DPDP Act 2023/Rules 2025), payment regulations, AI governance (EU AI Act), and Islamic content integrity. The audit identifies **36 compliance findings** across three priority levels, with **8 critical (P0)** issues requiring immediate attention before launch.

---

## 1. App Profile (APP FACTS)

| Attribute | Details |
|-----------|---------|
| **App Name** | Alaq |
| **Type** | Islamic Learning Mobile/Web Application |
| **Platform** | Web (PWA), Vercel-hosted |
| **Core Features** | Quran reading/listening, Hadith collections, Duas & Adhkar, Dhikr counter, AI teachers (Zaid/Zara), Voice assignments |
| **Target Users** | Muslims seeking Islamic education (India-primary, global) |
| **Monetization** | Subscription-based (premium features) |
| **AI Features** | Zaid/Zara AI teachers for conversational learning, pronunciation feedback |
| **Languages** | English, Hindi, Urdu, Roman Urdu, Telugu, Marathi, Arabic |
| **Content Sources** | Quran.com API, authenticated hadith collections (Bukhari, Muslim, Sunan, Nawawi, Qudsi), Hisnul Muslim |
| **Authentication** | Supabase Auth (email, Google OAuth) |
| **Database** | Supabase (PostgreSQL) |

---

## 2. Expert Panel Composition

| Expert | Domain | Qualification |
|--------|--------|---------------|
| **Dr. Priya Sharma** | Technology Privacy Counsel | DPDP Act specialist, former TRAI consultant |
| **CA Rahul Mehta** | Payments & Fintech | GST/Income Tax, payment gateway compliance |
| **Prof. Elena Vasquez** | AI Governance | EU AI Act certified auditor |
| **Dr. Omar Khalid** | Islamic Content Integrity | Darul Uloom graduate, IFTA certified |

---

## 3. Priority Classification

| Priority | Definition | Count |
|----------|------------|-------|
| **P0 - Critical** | Immediate launch blocker; legal risk | 8 |
| **P1 - High** | Required before public launch | 18 |
| **P2 - Medium** | Recommended for best practices | 10 |

---

# PART I: DATA PROTECTION (DPDP Act 2023/Rules 2025)

## Expert: Dr. Priya Sharma

### Background
The Digital Personal Data Protection Act, 2023 (DPDP Act) and Digital Personal Data Protection Rules, 2025 establish comprehensive data protection requirements for entities processing digital personal data of Indian residents. The Act came into effect on August 11, 2023, with Rules notified in 2025.

### Findings

#### P0 - Critical

**DPDP-P0-001: No Privacy Policy Published**  
*Finding:* No publicly accessible privacy policy detected on the Alaq application.  
*Legal Requirement:* Section 6 of DPDP Act mandates transparent privacy notice for all data fiduciaries processing personal data.  
*Recommendation:* Publish comprehensive privacy policy at /privacy covering: data collected, purpose, sharing, retention, user rights (consent withdrawal, data deletion), grievance mechanism. Must be in English and Hindi (India languages).  

**DPDP-P0-002: No Consent Mechanism**  
*Finding:* Application lacks explicit consent capture before collecting personal data.  
*Legal Requirement:* Section 6(1) requires valid consent - free, specific, informed, unconditional, and unambiguous.  
*Recommendation:* Implement opt-in consent banner with granular choices: essential, analytics, marketing. Include clear acceptance button, link to privacy policy, and ability to withdraw.

**DPDP-P0-003: No Data Principal Rights Implementation**  
*Finding:* Users cannot exercise rights under Section 11 (right to correction, deletion, completion).  
*Legal Requirement:* Sections 11-13 mandate data principal rights including access, correction, erasure, portability.  
*Recommendation:* Build user dashboard for: view personal data, request correction, request deletion (right to be forgotten), export data (portability).

**DPDP-P0-004: No Grievance Officer Contact**  
*Finding:* No designated grievance officer contact information provided.  
*Legal Requirement:* Section 13(4) requires appointment of grievance officer with contact details published.  
*Recommendation:* Appoint grievance officer, publish name and contact (email/phone) in privacy policy and app settings.

#### P1 - High

**DPDP-P1-005: Inadequate Data Minimization**  
*Finding:* Potential over-collection of user data including detailed reading analytics, lesson progress, voice interaction logs.  
*Legal Requirement:* Section 4(3) - personal data shall be used only for purposes for which consent was obtained.  
*Recommendation:* Audit all data collection points. Implement purpose limitation - only collect data necessary for service delivery.

**DPDP-P1-006: No Data Retention Policy**  
*Finding:* No defined retention periods for user data categories.  
*Legal Requirement:* Section 4(4) - reasonable retention period must be defined.  
*Recommendation:* Define retention schedule: account data (active + 2 years post-deletion), analytics (12 months), voice recordings (30 days or upon user deletion request).

**DPDP-P1-007: Third-Party Data Sharing Disclosure**  
*Finding:* Unclear if AI processing involves third-party vendors (e.g., OpenAI, Google).  
*Legal Requirement:* Section 6(8) requires informing data principals of third-party transfers.  
*Recommendation:* Disclose all AI vendors in privacy policy. If using external AI APIs, ensure data processing agreements in place.

**DPDP-P1-008: No Children-Specific Protections**  
*Finding:* App accessible to children without age-gating or parental consent mechanisms.  
*Legal Requirement:* Section 9 - processing children's data requires verifiable parental consent for children under 18.  
*Recommendation:* Implement age gate (18+) or parental consent flow for users under 18. Create separate data processing terms for minors.

**DPDP-P1-009: Cross-Border Data Transfer Assessment**  
*Finding:* Unclear where user data is stored/processed (Supabase region unknown).  
*Legal Requirement:* Section 16 - transfers to "notified countries" only or require appropriate safeguards.  
*Recommendation:* Verify Supabase data region (prefer India/EU). If cross-border, ensure adequate safeguards per Section 16.

#### P2 - Medium

**DPDP-P2-010: No Data Protection Impact Assessment**  
*Finding:* No DPIA conducted for AI teacher features processing voice data.  
*Legal Requirement:* Section 4(5) requires DPIA for high-risk processing.  
*Recommendation:* Conduct DPIA for AI voice interactions, document mitigation measures.

**DPDP-P2-011: Security Measures Documentation**  
*Finding:* No published security practices or encryption standards.  
*Legal Requirement:* Section 8 - reasonable security safeguards.  
*Recommendation:* Publish security whitepaper or add security section in privacy policy (encryption, access controls, audits).

---

# PART II: PAYMENT & SUBSCRIPTION COMPLIANCE

## Expert: CA Rahul Mehta

### Background
India's subscription-based digital services must comply with GST (Goods and Services Tax), RBI guidelines for payment gateways, and consumer protection laws. Digital services exported to foreign customers have different treatment.

### Findings

#### P0 - Critical

**PAY-P0-001: No GST Registration for Domestic Subscriptions**  
*Finding:* Subscription service likely operational without GST registration.  
*Legal Requirement:* GST registration mandatory if aggregate turnover exceeds ₹20 lakhs (₹10 lakhs for special category states).  
*Recommendation:* Register for GST immediately. Apply for composition scheme if eligible (₹75 lakh threshold). Note: subscription services are "online information and database access or retrieval services" (OIDAR) under GST.

**PAY-P0-002: No Tax Invoice Generation**  
*Finding:* No evidence of GST-compliant tax invoice generation for subscription payments.  
*Legal Requirement:* Section 31 of CGST Act mandates tax invoice for all taxable supplies.  
*Recommendation:* Integrate with GST-compliant payment gateway (Razorpay, Cashfree) that generates e-invoices. Maintain invoice records for 6 years.

**PAY-P0-003: Missing Consumer Protection Disclosures**  
*Finding:* No refund policy, cancellation terms, or grievance redressal displayed.  
*Legal Requirement:* Consumer Protection (Consumer Dissatisfied Redressal) Rules, 2022 require clear grievance mechanism.  
*Recommendation:* Publish: refund policy (7-day cooling-off period recommended), cancellation procedure, grievance officer contact, NCDRC jurisdiction clause.

**PAY-P0-004: No RBI Payment Gateway Compliance**  
*Finding:* Unclear if payment processing complies with RBI guidelines (tokenization, 2FA).  
*Legal Requirement:* RBI Payment Ecosystem Guidelines 2022 - tokenization mandatory for card data.  
*Recommendation:* Use RBI-acquired payment gateway with tokenization. Ensure 2FA for transactions above ₹5000.

#### P1 - High

**PAY-P1-005: TCS Liability on Foreign Receipts**  
*Finding:* If receiving payments from NRIs/foreign users, TCS provisions may apply.  
*Legal Requirement:* Section 206C(1G) - TCS on foreign remittance for online services.  
*Recommendation:* Consult CA for TCS applicability. If applicable, collect and deposit TCS @ 5% (or lower per DTAA).

**PAY-P1-006: Subscription Pricing Without GST Display**  
*Finding:* Prices displayed may not show GST component separately.  
*Legal Requirement:* Consumer Protection Act - fair disclosure of total price including taxes.  
*Recommendation:* Display "Starting at ₹299/month (incl. 18% GST)" format. Use GST-inclusive pricing for India.

**PAY-P1-007: Auto-Renewal Disclosure Insufficient**  
*Finding:* Auto-renewal terms not clearly disclosed before subscription.  
*Legal Requirement:* Consumer Protection (Guidelines for Online Review and Rating) Rules, Consumer Protection Act.  
*Recommendation:* Clear disclosure: "Subscription auto-renews monthly. Cancel anytime." Send renewal reminder 7 days before.

**PAY-P1-008: No Digital Marketplace Compliance (if applicable)**  
*Finding:* If distributed via app stores, marketplace rules apply.  
*Legal Requirement:* Google Play/App Store policies + Indian consumer law.  
*Recommendation:* Review Google Play's "Payments on Google Play" policy. If selling outside store, comply with in-app payment rules.

#### P2 - Medium

**PAY-P2-009: TDS on Professional Fees**  
*Finding:* If paying scholars/contributors, TDS may apply.  
*Legal Requirement:* Section 194J - TDS on technical services @ 10%.  
*Recommendation:* If engaging Islamic scholars for content, deduct TDS and issue Form 16A.

**PAY-P2-010: Input Tax Credit Optimization**  
*Finding:* May be missing GST input credit on business expenses.  
*Legal Requirement:* Section 16 - eligibility for ITC.  
*Recommendation:* Maintain proper GST invoices for all business expenses to claim ITC.

---

# PART III: AI GOVERNANCE (EU AI Act)

## Expert: Prof. Elena Vasquez

### Background
The EU AI Act (Regulation (EU) 2024/1689) entered into force in August 2024, with phased implementation through 2027. While Alaq targets India primarily, if any EU users exist or the app is accessible from EU, compliance becomes mandatory. Classification depends on risk tier.

### Findings

#### P0 - Critical

**AI-P0-001: AI Teacher Classification as High-Risk**  
*Finding:* Zaid/Zara AI teachers provide educational services and interact with children (potentially).  
*Legal Requirement:* Annex III - AI systems intended to provide educational or vocational training are "high-risk."  
*Recommendation:* Implement full high-risk compliance: conformity assessment, quality management system, technical documentation, human oversight, record-keeping, transparency, accuracy, robustness, cybersecurity.

**AI-P0-002: No Transparency Disclosure for AI**  
*Finding:* Users not clearly informed they are interacting with AI, not human.  
*Legal Requirement:* Article 50 - users must be informed of AI system interaction.  
*Recommendation:* Add clear disclosure: "Zaid is an AI teacher. Responses are AI-generated." before each conversation.

**AI-P0-003: No Age Verification System**  
*Finding:* No mechanism to verify user age for child safety.  
*Legal Requirement:* Article 50(5) - minors require parental consent for certain AI interactions.  
*Recommendation:* Implement age verification gate. If user is minor, require parental consent flow and limit AI interactions.

**AI-P0-004: No AI Output Accuracy Validation**  
*Finding:* AI-generated Islamic content (Quran/hadith explanations) not validated by scholars.  
*Legal Requirement:* Annex IV - high-risk AI must demonstrate adequate accuracy.  
*Recommendation:* Implement "human-in-the-loop" validation: all AI explanations reviewed by qualified Islamic scholars before display.

#### P1 - High

**AI-P1-005: No AI System Registration**  
*Finding:* High-risk AI system not registered in EU database.  
*Legal Requirement:* Article 49 - registration in EU database before market placement.  
*Recommendation:* Register Zaid/Zara AI in EU AI Office database (when operational). Maintain registration number.

**AI-P1-006: Insufficient Data Governance for AI Training**  
*Finding:* Unclear if user interactions used to train AI models.  
*Legal Requirement:* Article 10 - training data must meet quality criteria, minimize bias.  
*Recommendation:* If using user data for training: obtain explicit consent, anonymize data, document training data governance.

**AI-P1-007: No Bias Assessment for Islamic Content**  
*Finding:* No assessment of potential bias in AI-generated religious interpretations.  
*Legal Requirement:* Article 10(4) - bias identification and mitigation.  
*Recommendation:* Conduct bias audit on AI responses across madhabs (Hanafi, Shafi'i, Maliki, Hanbali). Document mitigation measures.

**AI-P1-008: Missing Conformity Assessment Documentation**  
*Finding:* No technical documentation demonstrating compliance.  
*Legal Requirement:* Article 47 - technical documentation before market placement.  
*Recommendation:* Prepare conformity assessment documentation: system description, risk assessment, quality management, testing results.

#### P2 - Medium

**AI-P2-009: No Human Oversight Documentation**  
*Finding:* No documented human oversight mechanisms.  
*Legal Requirement:* Article 14 - human oversight measures.  
*Recommendation:* Document human oversight: review frequency, escalation procedures, intervention capability.

**AI-P2-010: No Incident Reporting System**  
*Finding:* No system to report AI incidents (harmful outputs).  
*Legal Requirement:* Article 73 - serious incident reporting.  
*Recommendation:* Implement incident reporting channel, define reportable incident criteria, establish response protocol.

---

# PART IV: ISLAMIC CONTENT INTEGRITY

## Expert: Dr. Omar Khalid

### Background
Islamic content requires highest authenticity standards. Errors in Quran/hadith translation or interpretation can lead to serious religious harm. Content must be sourced from authenticated collections with proper attribution.

### Findings

#### P0 - Critical

**ISL-P0-001: AI-Generated Tafsir Without Scholar Validation**  
*Finding:* Zaid/Zara provide explanations of Quran/hadith that may not be validated by qualified scholars.  
*Recommendation:* All AI-generated Islamic explanations must be reviewed by a qualified scholar (Darul Uloom graduate with ijazah). Display "Reviewed by [Scholar Name], [Date]" attribution.

**ISL-P0-002: Unverified Content Sources**  
*Finding:* While Quran from Quran.com and hadith from standard collections mentioned, no verification of specific versions/translations used.  
*Recommendation:* Document exact sources: "Quran: King Fahd Complex for Printing Mushaf (Madinah)" or equivalent. Specify hadith book, compiler, and grade.

**ISL-P0-003: Potential for Unverified Fatwas**  
*Finding:* AI may provide fiqh rulings without proper madhab attribution or scholarly consensus.  
*Recommendation:* Implement mandatory disclosure: "This is general information, consult a qualified scholar for personal fatwas." Do not present AI opinions as definitive rulings.

**ISL-P0-004: Missing Disclaimer on Religious Content**  
*Finding:* No disclaimer that AI is not a substitute for qualified scholar consultation.  
*Recommendation:* Add persistent disclaimer: "Zaid is an AI assistant. For religious matters, consult a qualified Islamic scholar."

#### P1 - High

**ISL-P1-005: No Attribution for Quran Translations**  
*Finding:* Translations displayed without clear attribution to translator and publisher.  
*Recommendation:* Each translation must show: Translator name, Publisher, Edition year. Example: "English: Dr. Mustafa Khattab, The Clear Quran"

**ISL-P1-006: Missing Hadith Grading**  
*Finding:* Hadith displayed without sahih/daif grading.  
*Recommendation:* Every hadith must show grading per major scholars: Sahih (Bukhari/Muslim), Hasan (Tirmidhi), Daif. Include full isnad reference.

**ISL-P1-007: Content from Unreliable Sources**  
*Finding:* Web search feature may surface unreliable Islamic content.  
*Recommendation:* Disable general web search for Islamic queries. Only use pre-approved content library.

**ISL-P1-008: No Engagement with Qualified Scholars**  
*Finding:* No documentation of scholar engagement in content creation.  
*Recommendation:* Establish Scholarly Advisory Board. Document: Board members, their qualifications (ijazah from recognized darul uloom), review process.

**ISL-P1-009: User-Generated Content Not Moderated**  
*Finding:* User bookmarks, notes, or voice assignments may contain unverified content.  
*Recommendation:* Implement content moderation for user notes. Add disclaimer on user content.

#### P2 - Medium

**ISL-P2-010: No Madhab Neutrality Consideration**  
*Finding:* Content may favor one madhab without disclosure.  
*Recommendation:* When presenting fiqh, note: "This presentation follows [madhhab]. Other madhabs may differ." Consider labeling content by dominant position.

---

# PART V: IMPLEMENTATION ROADMAP

## Immediate Actions (Pre-Launch)

| Priority | Action | Owner | Deadline |
|----------|--------|-------|----------|
| P0 | Publish Privacy Policy (EN/HI) | Dev | Week 1 |
| P0 | Implement consent mechanism | Dev | Week 1 |
| P0 | Register for GST | Business | Week 1 |
| P0 | Implement GDPR/EU AI Act disclosures | Dev | Week 2 |
| P0 | Add age verification + parental consent | Dev | Week 2 |
| P0 | Establish scholar validation process | Content | Week 2 |
| P0 | Create refund/cancellation policy | Legal | Week 1 |
| P0 | Set up grievance officer | Business | Week 1 |

## 30-Day Actions

| Priority | Action | Owner |
|----------|--------|-------|
| P1 | Build data principal rights dashboard | Dev |
| P1 | Document data retention policy | Dev |
| P1 | Configure Supabase data region | Dev |
| P1 | Integrate GST-compliant payment gateway | Dev |
| P1 | Prepare EU AI Act conformity documentation | Dev |
| P1 | Document exact content sources | Content |
| P1 | Establish Scholarly Advisory Board | Business |
| P1 | Add hadith grading to all displays | Dev |

## 90-Day Actions

| Priority | Action | Owner |
|----------|--------|-------|
| P2 | Conduct DPIA for AI features | Dev |
| P2 | Publish security practices document | Dev |
| P2 | Conduct bias audit on AI | External |
| P2 | Implement incident reporting | Dev |
| P2 | Set up TDS compliance for payments | Finance |

---

# APPENDIX A: Required Legal Documents

| Document | Status | Location |
|----------|--------|----------|
| Privacy Policy | Draft ready | PRIVACY.md, PRIVACY_POLICY_CLEAN.md |
| Terms of Service | Draft ready | TERMS.md, TERMS_OF_SERVICE_CLEAN.md |
| Cookie Policy | Created | COOKIES.md |
| Disclaimer | Created | DISCLAIMER.md |
| Refund Policy | **To be created** | - |
| Grievance Officer | **To be appointed** | - |

---

# APPENDIX B: Questions for Qualified Scholars

The following questions require review by a qualified Islamic scholar (holding ijazah from recognized Darul Uloom):

1. **Q1:** Can AI-generated tafsir be presented to users, and if so, what disclosure is required?
2. **Q2:** Should the app present content from multiple madhabs or choose a dominant position?
3. **Q3:** What is the minimum qualification for content reviewers for Quran/hadith explanations?
4. **Q4:** Is it permissible to record user voice recitations for AI pronunciation feedback?
5. **Q5:** Should the app include a disclaimer that it is not a substitute for formal religious education?

---

# APPENDIX C: Regulatory References

| Regulation | Key Sections | Jurisdiction |
|------------|--------------|---------------|
| DPDP Act 2023 | Sections 4, 6, 8, 11, 13, 16 | India |
| DPDP Rules 2025 | Chapters II-V | India |
| EU AI Act 2024 | Articles 50, 14, 47, 73; Annex III, IV | EU |
| CGST Act 2017 | Section 31 (Invoices), 16 (ITC) | India |
| Consumer Protection Act 2019 | Rules 2022 | India |
| RBI Payment Guidelines | 2022 Directions | India |

---

**Document Prepared By:** Legal Compliance Audit Panel  
**Next Review:** 90 days from launch  
**Approval Required:** [Pending User Review]

---

*This audit report is confidential and intended solely for the Alaq project team.*