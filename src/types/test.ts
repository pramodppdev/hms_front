export interface TestType {
  id: string;
  department_id: string;
  name: string;
  has_subtypes: boolean;
  created_at: string;
  updated_at: string;
  subtypes?: TestSubtype[];
}

export interface TestSubtype {
  id: string;
  test_type_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTestTypeDTO {
  name: string;
  subtypes: string[];
}

export interface UpdateTestTypeDTO {
  name: string;
  subtypes: {
    id?: string;
    name: string;
  }[];
}