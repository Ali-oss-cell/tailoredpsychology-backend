/** Durable patient demographics (booking intake + reporting). */
export type PatientDemographics = {
  dateOfBirth: string;
  indigenousStatus: string;
  state: string;
  suburb: string;
};

export function emptyPatientDemographics(): PatientDemographics {
  return {
    dateOfBirth: "",
    indigenousStatus: "",
    state: "",
    suburb: "",
  };
}
