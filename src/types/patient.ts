export interface Patient {
  id: string;
  name: string;
  age: number;
  sex: 'Male' | 'Female' | 'Other';
  general_registration_number: string;
  department_id: string;
  registration_date: string;
  contact_info?: string;
  assigned_doctor?: string;
  tests?: PatientTest[];
}

export interface PatientTest {
  id: string;
  test_type_id: string;
  test_subtype_id?: string;
  status: 'Assigned' | 'In Progress' | 'Completed';
  comments?: string;
}

export interface CreatePatientDTO {
  name: string;
  age: number;
  sex: 'Male' | 'Female' | 'Other';
  general_registration_number: string;
  registration_date: string;
  contact_info?: string;
  assigned_doctor?: string;
  tests: {
    test_type_id: string;
    test_subtype_id?: string;
    comments?: string;
  }[];
}