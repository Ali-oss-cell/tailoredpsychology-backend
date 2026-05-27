import { intakeDraftDataToProfileMerge } from "./intake-profile-merge.util";

describe("intakeDraftDataToProfileMerge", () => {
  it("maps patient identity and telehealth emergency fields", () => {
    const patch = intakeDraftDataToProfileMerge({
      patientIdentity: {
        fullName: "Alex Patient",
        mobile: "0400 000 000",
        preferredContactMethod: "sms",
        dateOfBirth: "1992-01-02",
        indigenousStatus: "neither",
        state: "NSW",
        suburb: "Sydney",
      },
      telehealthSafety: {
        emergencyContactName: "Jamie",
        emergencyContactPhone: "0400 000 001",
        emergencyContactRelationship: "Partner",
      },
    });

    expect(patch).toEqual({
      displayName: "Alex Patient",
      patientContactProfile: {
        phoneMobile: "0400 000 000",
        preferredContactMethod: "sms",
        emergencyContactName: "Jamie",
        emergencyContactPhone: "0400 000 001",
        emergencyContactRelationship: "Partner",
      },
      patientDemographics: {
        dateOfBirth: "1992-01-02",
        indigenousStatus: "neither",
        state: "NSW",
        suburb: "Sydney",
      },
    });
  });

  it("returns null when no mappable fields", () => {
    expect(intakeDraftDataToProfileMerge({})).toBeNull();
  });
});
