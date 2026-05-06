# Australian telehealth intake — field map (Clink)

This document maps common Australian mental-health telehealth intake expectations to the existing **booking / intake draft** model (`BookingRequestDraft` in the patient booking wizard and persisted intake JSON). It is guidance for product and compliance review, not legal advice.

## Identity and contact

| Typical intake expectation | Clink field(s) |
| --- | --- |
| Full legal name | `patientIdentity.fullName` |
| Date of birth | `patientIdentity.dateOfBirth` |
| Mobile / email | `patientIdentity.mobile`, `patientIdentity.email` |
| Address (suburb + state minimum) | `patientIdentity.suburb`, `patientIdentity.state` |
| Preferred contact method | `patientIdentity.preferredContactMethod` |
| Aboriginal and Torres Strait Islander status (optional self-report) | `patientIdentity.indigenousStatus` |

## Medicare and referral pathway

| Expectation | Clink field(s) |
| --- | --- |
| Mental Health Treatment Plan (MHTP) status | `medicarePath.hasMhtp` |
| GP / referrer details | `medicarePath.gpName`, `medicarePath.gpClinic` |
| Referral letter / document | `referralFile` + upload APIs; `medicarePath.hasReferral`, `medicarePath.referralType` |
| Session usage context | `medicarePath.sessionsUsedEstimate` |

## Clinical presentation (triage)

| Expectation | Clink field(s) |
| --- | --- |
| Presenting concerns | `careContext.presentingConcerns` |
| Duration / history | `careContext.symptomDuration` |
| Prior care | `careContext.priorCare` |
| Medications | `careContext.currentMedications` |
| Urgent risk flag | `careContext.riskFlag` |

## Telehealth safety

| Expectation | Clink field(s) |
| --- | --- |
| Where the patient is for the session | `telehealthSafety.currentSessionLocation` |
| Emergency contact | `telehealthSafety.emergencyContactName`, `emergencyContactPhone`, `emergencyContactRelationship` |

## Consent

| Expectation | Clink field(s) |
| --- | --- |
| Privacy / policy | `consents.privacyAccepted` |
| Telehealth-specific consent | `consents.telehealthAccepted` |
| Treatment consent | `consents.treatmentAccepted` |

## Scheduling preferences

| Expectation | Clink field(s) |
| --- | --- |
| Modality | `preferences.modality` |
| Clinician gender preference | `preferences.preferredClinicianGender` |
| Language | `preferences.preferredLanguage` |

## Gaps to consider later

- **CALD** identifiers and richer cultural metadata are often collected in Australian health services; extend the draft if your clinic network requires them for reporting.
- **NDIS / private / DVA** funding path is not modeled in the draft above; extend `medicarePath` or add a `funding` block if needed.
- **Pharmacy or regular GP practice address** may be required by some payers; currently partially covered via `gpClinic`.

When adding fields, keep the **intake draft** as the single source of truth for pre-appointment data and align validation in the booking wizard with any new backend constraints.
