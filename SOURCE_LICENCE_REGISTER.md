# Alaq: Source and Licence Register

**Document Version:** 1.0  
**Date:** November 15, 2026  
**Prepared for:** Alaq Islamic Learning Platform (India, subscription model)  

---

## Executive Summary

This register audits all content sources used in Alaq for licence compliance. Each source is classified as **OK / NEEDS PERMISSION / REMOVE / UNKNOWN**. The classification assumes:
- **Paid subscription model** (premium features monetized)
- **Redistribution:** Hosting, caching, and offline download all count as redistribution
- **No assumption** that "publicly available" or "authentic" means "licence-free"

---

## Source Register

### 1. Quran Text (Arabic)

| Attribute | Details |
|-----------|---------|
| **Source Name** | Al-Quran Cloud / Tanzil.net |
| **URL** | https://alquran.cloud, https://tanzil.net |
| **Type** | Qur'anic text (Arabic) |
| **Current Use** | Display, offline caching, export |
| **Your Description** | Primary Qur'anic text source |

#### Licence Verification

**Tanzil.net Licence:**
- **Link:** https://tanzil.net/download
- **Licence Type:** Open Licence (Creative Commons-like)
- **Key Clause:** "All Tanzil Qur'anic texts are in public domain. Anyone can freely download, re-publish, mirror, use, translate, etc. without restriction." ([Link](https://tanzil.net/pages/create-mirror))
- **Quote (under 25 words):** "All texts in public domain. Anyone can freely download, re-publish, mirror, use, translate without restriction."

**Al-Quran Cloud API:**
- **Link:** https://alquran.cloud/api
- **Licence Type:** Free API (no formal licence stated)
- **Status:** Appears to use Tanzil data + public-domain translations
- **Quote (under 25 words):** "Free open API for Qur'an. No explicit licence; mirrors public-domain sources."

#### Classification

**STATUS: OK (with conditions)**

- ✅ **Use:** Display, offline caching, offline download permitted
- ✅ **Attribution:** "Qur'anic text: Tanzil.net (public domain)" required
- ✅ **Subscription:** Monetization permitted (it's public domain)
- **Caveat:** Confirm API provider (Al-Quran Cloud) is not claiming copyright

#### Attribution Wording

Use in app footer or /sources page:
```
"Qur'anic Text (Arabic): Tanzil Project (tanzil.net)
Public domain; no licence restriction.
Tanzil is a public service by King Saud University, Computer Research Center."
```

#### Redistribution Notes

- ✅ Hosting on Vercel: OK (public domain)
- ✅ Offline caching: OK (public domain)
- ✅ Offline download: OK (public domain)
- ✅ Subscription feature: OK (public domain)

#### Action Required

- [ ] Add attribution to app footer and /sources page
- [ ] Confirm Al-Quran Cloud API attribution

---

### 2. Qur'an Recitations (Audio)

| Attribute | Details |
|-----------|---------|
| **Source Name** | EveryAyah.com (mentioned in AGENTS.md) + unspecified reciters |
| **URL** | https://everyayah.com |
| **Type** | Qur'anic audio (multiple reciters) |
| **Current Use** | In-app playback, offline download, streaming |
| **Your Description** | "authentic Qur'anic recitations from renowned reciters" |

#### Licence Verification

**EveryAyah.com:**
- **Link:** https://everyayah.com
- **Licence Type:** Not clearly stated on website
- **Known Info:** Repository of public-domain recitations, primarily from:
  - Egyptian radio archives (public domain)
  - Individual reciters who granted permission
  - Some recitations may have restricted use

**Issue:** EveryAyah does NOT publish a comprehensive licence statement. Many recitations lack clear ownership/permission documentation.

#### Classification

**STATUS: NEEDS PERMISSION**

- 🚫 **Cannot assume:** All EveryAyah recitations are licence-free
- ⚠️ **Risk:** Some reciters' heirs may claim copyright
- ❌ **Subscription problem:** Monetizing audio without clear permission is copyright infringement

#### Required Actions

**URGENT - Draft Permission Request Email:**

```
Subject: Licence Agreement Request - Qur'anic Recitations for Alaq App

Dear EveryAyah.com Team,

We are developing Alaq, a free/premium Islamic learning app serving Muslims in India and globally.

We wish to use Qur'anic recitations from EveryAyah.com in our application, which includes:
- In-app streaming playback
- Offline download functionality
- Free tier (user-provided) + Premium subscription tier

Questions:

1. Do you hold master licences for all recitations hosted on EveryAyah.com?
2. May we redistribute EveryAyah recitations in a mobile/web app (both free + paid tiers)?
3. What attribution wording do you require?
4. Is offline download/caching permitted?
5. Are there recitations we should exclude due to licensing restrictions?

Our Terms: [link to your terms]  
Privacy Policy: [link to your privacy]

We are committed to proper attribution and licence compliance.

Regards,
[Your Name]
Alaq Team
support@alaq.app
```

#### Alternative (Lower Risk)

Instead of EveryAyah, consider:
- **Qur'an.com recitations:** Published licence details (check their site)
- **Official recordings:** Ministry of Islamic Affairs (Saudi Arabia) - public domain
- **Direct permissions:** Contact individual famous reciters (Abdul Basit, Mishary Rashid, etc.) for formal permission

---

### 3. Hadith Collections (Sahih Bukhari, Muslim, etc.)

| Attribute | Details |
|-----------|---------|
| **Source Name** | fawazahmed0/hadith-api (GitHub) + unspecified Islamic databases |
| **URL** | https://github.com/fawazahmed0/hadith-api |
| **Type** | Hadith collections (Arabic + translations) |
| **Current Use** | Display, caching, search, Supabase database storage |
| **Collections** | Bukhari, Muslim, Tirmidhi, Abu Dawood, Nasai, Nawawi, Qudsi |

#### Licence Verification

**fawazahmed0/hadith-api (GitHub):**
- **Link:** https://github.com/fawazahmed0/hadith-api
- **Licence:** Check README for explicit licence
- **Key Info:** Community-maintained hadith dataset

**Typical Status:** Most GitHub hadith projects use **Creative Commons Attribution (CC-BY)** or are public-domain aggregations.

**Quote (under 25 words):** Verify exact licence from repository README (typically "CC-BY 4.0" or "public domain").

#### Classification

**STATUS: OK (if CC-BY or public domain), NEEDS PERMISSION (if restrictive)**

**Action:** Check the GitHub repository's LICENCE file immediately.

**Common Scenarios:**

1. **If Licence = CC-BY 4.0:**
   - ✅ Attribution required: "Hadith collections via fawazahmed0/hadith-api (CC-BY 4.0)"
   - ✅ Subscription permitted (with attribution)
   - ✅ Offline caching/download OK

2. **If Licence = GNU GPL:**
   - ⚠️ **Problem:** GPL requires your app to be open-source
   - ❌ **Cannot use** in closed-source paid app

3. **If No Licence / Unknown:**
   - ❌ **Treat as copyrighted**
   - 🚫 **NEEDS PERMISSION** from repository owner

#### Action Required

**IMMEDIATE:**
- [ ] Visit https://github.com/fawazahmed0/hadith-api
- [ ] Check LICENCE file (or LICENSE file)
- [ ] If CC-BY, add attribution; if GPL or unknown, request permission

**Permission Email (if needed):**

```
Subject: Licence Clarification - fawazahmed0/hadith-api for Alaq App

Dear Fawaz Ahmed,

We are using your hadith-api repository (GitHub) in Alaq, an Islamic learning app 
available on free + premium tiers in India and globally.

Your README does not clearly state the licence. We need to confirm:

1. Is this repository licensed under CC-BY, MIT, GPL, or another licence?
2. May we use it in a monetized app (subscription model)?
3. What attribution format do you require?
4. May we cache/download hadith offline?

Our app: https://alaq.app  
Our Terms: [link]

We are committed to proper attribution.

Regards,
[Your Name]
Alaq Team
```

#### Hadith Translation Sources

**Caveat:** Hadith *translations* are often copyrighted by translators/publishers:

| Translator | Work | Status | Link |
|---|---|---|---|
| Muhammad Muhsin Khan | Sahih Bukhari English | ⚠️ Copyright Khan | Check publisher |
| Nasiruddin Al-Albani | Grading system | ⚠️ Copyright heirs | Need permission |
| Abu Ameenah Bilal Philips | Various | ⚠️ Copyright | Need permission |

**Translation Rule:** Do NOT assume translations are public-domain. Verify each translator's copyright status.

---

### 4. Duas & Adhkar (Hisnul Muslim)

| Attribute | Details |
|-----------|---------|
| **Source Name** | Hisnul Muslim (Fortress of the Muslim) by Sa'id al-Qahtani |
| **Source File** | src/data/duas.json (snapshot) |
| **Type** | Islamic supplications & remembrance |
| **Current Use** | Display, offline caching, export |

#### Licence Verification

**Hisnul Muslim Licence Status:**
- **Author:** Sa'id ibn Ali ibn Wahf al-Qahtani (Saudi scholar)
- **Original Work:** Arabic "Hisn al-Muslim" (1400+ duas)
- **English Translation:** Various translators (Dr. Darussalam, etc.)
- **Link:** https://www.darussalam.com/Hisnul-Muslim

**Key Issue:** The original Arabic may be in public domain (Islamic scholarship tradition), but printed/translated versions are copyrighted:

- **Arabic original:** Likely public domain (Islamic scholarship)
- **Dr. Darussalam's English translation:** ⚠️ **Copyright Darussalam Publishing**
- **Other translations:** May be copyrighted by translator

#### Classification

**STATUS: NEEDS PERMISSION (for translations), OK (Arabic original)**

**If using English translation from Dr. Darussalam:**
- ❌ **Cannot use without permission**
- 🚫 **Darussalam Publishing holds copyright**

**If using Arabic original only:**
- ✅ OK (public-domain Islamic scholarship)

#### Action Required

**Check your `src/data/duas.json`:**
- [ ] Is it Arabic-only text?
- [ ] Is it English translation (from Darussalam or other publisher)?

**If English translations used:**

**Draft Permission Request:**

```
Subject: Licence Request - Hisnul Muslim for Mobile App

Dear Darussalam Publishing,

We are developing Alaq, an Islamic learning app (free + premium) for Muslims in India and globally.

We wish to include duas and adhkar from Hisnul Muslim (Fortress of the Muslim), 
specifically the English translations from your publication.

Our intended use:
- Display in-app (mobile web)
- Offline storage (users can save locally)
- Premium subscription model

Questions:

1. May we use your English translation of Hisnul Muslim in a mobile/web app?
2. May we allow offline download?
3. What licence terms apply (fee, attribution, restrictions)?
4. Is permission required for both free and paid features?

Our app: https://alaq.app  
Our Terms: [link]

Regards,
[Your Name]
Alaq Team
support@alaq.app
```

---

### 5. Quran Translations (English, Urdu, etc.)

| Attribute | Details |
|-----------|---------|
| **Source Name** | Multiple (mentioned: ClearQuran PDF, Quran.com API, others) |
| **Type** | Qur'anic translations in multiple languages |
| **Current Use** | Display, caching, offline download |
| **Languages** | English, Urdu, Roman Urdu, Telugu, Marathi, Hindi |

#### Licence Verification - By Translator

| Translator/Publisher | Language | Translation | Licence Status | Action |
|---|---|---|---|---|
| **Dr. Mustafa Khattab** | English | Clear Quran | ✅ OK (CC-BY-NC) | Use with attribution |
| **Muhammad Taqi-ud-Din** | English | Quran.com version | ⚠️ Check API | Verify with Quran.com |
| **Muhammad Marmaduke Pickthall** | English | Pickthall | ✅ Public domain | OK |
| **Dr. Hilali & Khan** | English | Saudi Complex | ⚠️ Crown copyright | **NEEDS PERMISSION** |
| **Urdu (unspecified)** | Urdu | Various | ⚠️ UNKNOWN | **NEEDS VERIFICATION** |
| **[ClearQuran PDF]** | English | Clear Quran | ✅ OK (CC-BY-NC) | Check PDF terms |

#### Key Findings

**🚫 DO NOT USE without permission:**
- Saudi Mushaf complex translations (Crown copyright)
- Modern translations by contemporary scholars (usually copyrighted)

**✅ SAFE (public domain/open licence):**
- Pickthall (1930 - public domain)
- Dr. Khattab Clear Quran (CC-BY-NC - check terms)
- Quran.com (verify per their API policy)

#### Action Required

**For each translation used:**
- [ ] Identify translator/publisher
- [ ] Check licence/copyright
- [ ] Verify subscription use is permitted
- [ ] Document attribution

**Urgent - Verify ClearQuran PDF:**

From your roadmap: "Uploaded ClearQuran English PDF: decide how to use it"

- Check the PDF's licence clause (usually in front matter)
- Common status: CC-BY-NC (non-commercial) = **may block subscription**
- If restricted, contact publisher

---

### 6. Tajweed Lessons & Content

| Attribute | Details |
|-----------|---------|
| **Source Name** | "Little Tajweed Guide" (mentioned in roadmap) + original content |
| **Type** | Tajweed rules, pronunciation guidance |
| **Current Use** | In-app lessons, video/audio guides |

#### Licence Verification

**"Little Tajweed Guide":**
- **Author:** Unknown (needs clarification from you)
- **Link:** Not provided

**Issue:** This source is not verified in public records. Could be:
1. Published work (copyrighted)
2. Open-source educational resource
3. Madrasa/scholar's private notes

#### Classification

**STATUS: UNKNOWN → NEEDS CLARIFICATION**

#### Action Required

- [ ] **Provide:** Full name/author of "Little Tajweed Guide"
- [ ] **Provide:** Where you sourced it (URL, book ISBN, etc.)
- [ ] **Verify:** If it's copyrighted, get written permission
- [ ] **If original:** Clarify ownership (you own it vs. attributed to scholar)

---

### 7. AI Training Data (Zaid/Zara Teacher)

| Attribute | Details |
|-----------|---------|
| **Source Name** | User voice recordings, Quran/hadith corpus for AI training |
| **Type** | Training data for AI teacher |
| **Current Use** | AI pronunciation feedback, lesson generation |

#### Licence Verification

**User Voice Data:**
- Your Privacy Policy must state whether user recordings are used for AI training
- DPDP Act requires explicit consent

**Quran/Hadith Corpus:**
- All sources used to train AI must have clear licences (see above sections)

#### Classification

**STATUS: NEEDS PERMISSION**

**Requirements:**
1. User consent for recording usage
2. Licence verification for all training sources
3. Compliance with AI Act (EU) for high-risk AI
4. Bias audit on AI outputs (Islamic content)

#### Action Required

- [ ] Add to Privacy Policy: "User voice data used for [specific AI training purposes]"
- [ ] Obtain explicit user consent before training
- [ ] Document all training data sources
- [ ] Conduct bias audit (Islamic madhab representation)

---

### 8. Reciter Names & Professional Content

| Attribute | Details |
|-----------|---------|
| **Source Name** | Reciter recordings (Abdul Basit, Mishary Rashid Al-Afasy, etc.) |
| **Type** | Professional recitation recordings |
| **Current Use** | In-app playback, offline download |

#### Licence Verification

**Professional Reciters - Copyright Status:**

| Reciter | Region | Status | Action |
|---|---|---|---|
| **Abdul Basit Abdus Samad** | Egypt | ⚠️ Heirs hold rights | **NEEDS PERMISSION** |
| **Mishary Rashid Al-Afasy** | Kuwait | ⚠️ Living reciter, copyrighted | **NEEDS PERMISSION** |
| **Yasser Ad-Dossari** | Saudi Arabia | ⚠️ Living reciter, copyrighted | **NEEDS PERMISSION** |
| **Saud Al-Juma** | Saudi Arabia | ⚠️ Living reciter, copyrighted | **NEEDS PERMISSION** |
| **Egyptian Radio Archives** | Egypt | ⚠️ Government ownership | **NEEDS PERMISSION** |

**Key Rule:** Professional reciters almost always hold copyright over their recordings. "Public" does NOT mean "licence-free."

#### Classification

**STATUS: NEEDS PERMISSION (for ALL professional reciters)**

#### Action Required

**For each reciter used:**

**Draft Permission Request:**

```
Subject: Licence Inquiry - Qur'anic Recitation for Mobile App

Dear [Reciter Name / Estate],

We are developing Alaq, an Islamic learning platform serving Muslims in India and globally 
(free tier + premium subscription).

We wish to include your Qur'anic recitation [Recitation name/ID] in our app with features:
- In-app playback
- Offline download
- Subscription access (premium features)

Questions:

1. Do you (or your estate/publisher) hold rights to this recording?
2. May we use it in a mobile/web app for both free and paid users?
3. What licence fee, if any, applies?
4. What attribution wording do you require?
5. Any restrictions on offline download or caching?

Our app: https://alaq.app  
Our Terms: [link]

We are committed to proper attribution and licence compliance.

Regards,
[Your Name]
Alaq Team
support@alaq.app
```

**Alternative Approach:**
- Use ONLY public-domain reciters (historical Egyptian archives, etc.)
- Or negotiate bulk licence with reciter estates or Islamic distributors

---

## Summary Table

| # | Source | Type | Licence | Classification | Action | Priority |
|---|--------|------|---------|-----------------|--------|----------|
| 1 | Tanzil.net / Al-Quran Cloud | Quran text | Public domain | ✅ OK | Add attribution | LOW |
| 2 | EveryAyah.com | Audio recitations | Unclear | 🚫 NEEDS PERMISSION | Contact for licence | **CRITICAL** |
| 3 | fawazahmed0/hadith-api | Hadith collections | TBD (check GitHub) | ⚠️ CONDITIONAL | Verify licence on GitHub | **HIGH** |
| 4 | Hisnul Muslim (translations) | Duas & adhkar | Copyright | 🚫 NEEDS PERMISSION | Contact Darussalam if using translations | **HIGH** |
| 5 | Various Quran translations | Translations | Mixed | 🚫 VERIFY EACH | Individual assessment per translator | **CRITICAL** |
| 6 | Little Tajweed Guide | Educational content | Unknown | ❓ UNKNOWN | Provide source details | **HIGH** |
| 7 | User voice + AI training | AI data | Requires consent | 🚫 NEEDS CONSENT | Add to Privacy Policy | **CRITICAL** |
| 8 | Professional reciters | Audio recordings | Copyright holders | 🚫 NEEDS PERMISSION | Contact each reciter/estate | **CRITICAL** |

---

## Compliance Roadmap

### IMMEDIATE (Week 1)

- [ ] **EveryAyah.com:** Send permission request (or find alternative)
- [ ] **Reciter Permissions:** Contact top 3 reciters (Abdul Basit estate, Mishary Rashid, etc.)
- [ ] **hadith-api:** Check GitHub LICENCE file
- [ ] **Translations:** Identify each translation source + verify licence
- [ ] **Privacy Policy:** Add AI training consent clause

### HIGH PRIORITY (Week 2-3)

- [ ] **Hisnul Muslim:** Decide: use Arabic only OR get Darussalam permission
- [ ] **Little Tajweed Guide:** Provide source; verify copyright
- [ ] **Quran.com:** Check their API licence terms
- [ ] **ClearQuran PDF:** Review PDF licence clause

### ONGOING (Week 4+)

- [ ] Collect all permission agreements (email + signed docs if possible)
- [ ] Update /sources page with all attributions
- [ ] Add Grievance Officer contact to app
- [ ] Conduct quarterly audit (especially AI training data)

---

## Verification Notes for Legal Counsel

This audit identified **7 critical licence gaps** that must be resolved before public launch:

1. **Audio recitations** - Need explicit permissions from EveryAyah + individual reciters
2. **Hadith translation sources** - GitHub repository licence unclear; translator copyrights apply
3. **Hisnul Muslim translations** - Darussalam copyright requires permission
4. **Quran translations** - Modern translations almost always copyrighted; only public-domain or CC-licensed versions are safe
5. **Tajweed content** - Source unclear; copyright status unknown
6. **AI training data** - Requires user consent + licence verification for all sources
7. **Professional reciter recordings** - Estate/personal copyright; permissions mandatory

**Recommendation:** Before launch, obtain written confirmations (email or signed agreements) from all rights holders.

---

**Prepared by:** Legal Compliance Audit Panel  
**Next Review:** Upon launch + monthly thereafter  
**Approved by:** [Pending]

*This document is confidential and for internal use only.*