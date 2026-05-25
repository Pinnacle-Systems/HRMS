import { describe, expect, it } from "vitest";
import {
  basicInfoFields,
  emergencyColumns,
  addressColumns,
  qualificationColumns,
  employeeColumns,
  eligibilityFields,
  VerificationColumns,
  trainingDetailsColumns,
  employmentColumns,
  bankColumns,
  pfColumns,
  panColumns,
  pranColumns,
  aadhaarColumns,
  passportVisaColumns,
  esiColumns,
  insuranceColumns,
  familyColumns,
  nominationTypes,
  nominationConfigs,
  attachmentColumns,
  stickyHeaderLeftSx,
  stickyHeaderRightSx,
  stickyLeftSx,
  stickyRightSx,
  commonSx,
} from "../../../src/pages/employees/const";

type FieldDef = { key: string; label: string; type?: string };

function expectValidFieldArray(fields: FieldDef[], name: string) {
  expect(fields, `${name} should be a non-empty array`).toBeInstanceOf(Array);
  expect(fields.length, `${name} should have at least one field`).toBeGreaterThan(0);
  fields.forEach((field, i) => {
    expect(field, `${name}[${i}] should have a key`).toHaveProperty("key");
    expect(field, `${name}[${i}] should have a label`).toHaveProperty("label");
    expect(typeof field.key, `${name}[${i}].key should be a string`).toBe("string");
    expect(typeof field.label, `${name}[${i}].label should be a string`).toBe("string");
  });
}

describe("basicInfoFields", () => {
  it("is a valid field definition array", () => {
    expectValidFieldArray(basicInfoFields, "basicInfoFields");
  });

  it("includes core personal info fields", () => {
    const keys = basicInfoFields.map((f) => f.key);
    expect(keys).toContain("firstName");
    expect(keys).toContain("lastName");
    expect(keys).toContain("dateOfBirth");
    expect(keys).toContain("mobileNumber");
    expect(keys).toContain("emailAddress");
  });

  it("marks date fields with type 'date'", () => {
    const dobField = basicInfoFields.find((f) => f.key === "dateOfBirth");
    expect(dobField?.type).toBe("date");
  });

  it("marks select fields with type 'select'", () => {
    const genderField = basicInfoFields.find((f) => f.key === "gender");
    expect(genderField?.type).toBe("select");
  });
});

describe("emergencyColumns", () => {
  it("is a valid field definition array", () => {
    expectValidFieldArray(emergencyColumns, "emergencyColumns");
  });

  it("includes name and relationship columns", () => {
    const keys = emergencyColumns.map((f) => f.key);
    expect(keys).toContain("name");
    expect(keys).toContain("relationship");
  });
});

describe("addressColumns", () => {
  it("is a valid field definition array", () => {
    expectValidFieldArray(addressColumns, "addressColumns");
  });

  it("includes all standard address sub-fields", () => {
    const keys = addressColumns.map((f) => f.key);
    expect(keys).toContain("street");
    expect(keys).toContain("city");
    expect(keys).toContain("state");
    expect(keys).toContain("country");
    expect(keys).toContain("pincode");
  });

  it("uses master-select type for location fields", () => {
    const masterSelectFields = addressColumns.filter((f) => f.type === "master-select");
    expect(masterSelectFields.length).toBeGreaterThan(0);
  });
});

describe("qualificationColumns", () => {
  it("is a valid field definition array", () => {
    expectValidFieldArray(qualificationColumns, "qualificationColumns");
  });

  it("includes institution and year of passing", () => {
    const keys = qualificationColumns.map((f) => f.key);
    expect(keys).toContain("institution");
    expect(keys).toContain("yearOfPassing");
  });
});

describe("employeeColumns", () => {
  it("is a valid field definition array", () => {
    expectValidFieldArray(employeeColumns, "employeeColumns");
  });

  it("includes joining date and department", () => {
    const keys = employeeColumns.map((f) => f.key);
    expect(keys).toContain("joiningDate");
    expect(keys).toContain("department");
  });
});

describe("eligibilityFields", () => {
  it("is a valid field definition array with boolean types", () => {
    expectValidFieldArray(eligibilityFields, "eligibilityFields");
    eligibilityFields.forEach((field) => {
      expect(field.type).toBe("boolean");
    });
  });

  it("covers PF and ESI eligibility flags", () => {
    const keys = eligibilityFields.map((f) => f.key);
    expect(keys).toContain("pfEligible");
    expect(keys).toContain("esiEligible");
  });
});

describe("VerificationColumns", () => {
  it("is a valid field definition array", () => {
    expectValidFieldArray(VerificationColumns, "VerificationColumns");
  });
});

describe("trainingDetailsColumns", () => {
  it("is a valid field definition array", () => {
    expectValidFieldArray(trainingDetailsColumns, "trainingDetailsColumns");
  });

  it("includes training name", () => {
    const keys = trainingDetailsColumns.map((f) => f.key);
    expect(keys).toContain("trainingName");
  });
});

describe("employmentColumns", () => {
  it("is a valid field definition array", () => {
    expectValidFieldArray(employmentColumns, "employmentColumns");
  });

  it("includes company name and designation", () => {
    const keys = employmentColumns.map((f) => f.key);
    expect(keys).toContain("companyName");
    expect(keys).toContain("designation");
  });
});

describe("bankColumns", () => {
  it("is a valid field definition array", () => {
    expectValidFieldArray(bankColumns, "bankColumns");
  });
});

describe("pfColumns", () => {
  it("is a valid field definition array", () => {
    expectValidFieldArray(pfColumns, "pfColumns");
  });

  it("includes PF number and UAN", () => {
    const keys = pfColumns.map((f) => f.key);
    expect(keys).toContain("pfNumber");
    expect(keys).toContain("uan");
  });
});

describe("identity document column arrays", () => {
  it("panColumns is a valid field array", () => {
    expectValidFieldArray(panColumns, "panColumns");
  });

  it("pranColumns is a valid field array", () => {
    expectValidFieldArray(pranColumns, "pranColumns");
  });

  it("aadhaarColumns is a valid field array", () => {
    expectValidFieldArray(aadhaarColumns, "aadhaarColumns");
  });

  it("passportVisaColumns is a valid field array", () => {
    expectValidFieldArray(passportVisaColumns, "passportVisaColumns");
  });

  it("esiColumns is a valid field array", () => {
    expectValidFieldArray(esiColumns, "esiColumns");
  });

  it("insuranceColumns is a valid field array", () => {
    expectValidFieldArray(insuranceColumns, "insuranceColumns");
  });
});

describe("familyColumns", () => {
  it("is a valid field definition array", () => {
    expectValidFieldArray(familyColumns, "familyColumns");
  });

  it("includes name and relationship", () => {
    const keys = familyColumns.map((f) => f.key);
    expect(keys).toContain("name");
    expect(keys).toContain("relationship");
  });
});

describe("nominationTypes", () => {
  it("contains the four expected nomination types", () => {
    expect(nominationTypes).toEqual(["EPF", "EPS", "EPI", "GRATUITY"]);
  });

  it("has exactly four entries", () => {
    expect(nominationTypes).toHaveLength(4);
  });
});

describe("nominationConfigs", () => {
  it("has a config entry for each nomination type", () => {
    nominationTypes.forEach((type) => {
      expect(nominationConfigs, `nominationConfigs should contain key ${type}`).toHaveProperty(type);
    });
  });

  it("each config has a title and columns array", () => {
    nominationTypes.forEach((type) => {
      const config = nominationConfigs[type as keyof typeof nominationConfigs];
      expect(config).toHaveProperty("title");
      expect(config).toHaveProperty("columns");
      expect(config.columns).toBeInstanceOf(Array);
    });
  });
});

describe("attachmentColumns", () => {
  it("is a valid field definition array", () => {
    expectValidFieldArray(attachmentColumns, "attachmentColumns");
  });
});

describe("sticky styling constants", () => {
  it("stickyHeaderLeftSx is an object with position sticky", () => {
    expect(stickyHeaderLeftSx).toBeTypeOf("object");
    expect(stickyHeaderLeftSx).toHaveProperty("position", "sticky");
  });

  it("stickyHeaderRightSx is an object with position sticky", () => {
    expect(stickyHeaderRightSx).toBeTypeOf("object");
    expect(stickyHeaderRightSx).toHaveProperty("position", "sticky");
  });

  it("stickyLeftSx is a non-null object", () => {
    expect(stickyLeftSx).toBeTypeOf("object");
    expect(stickyLeftSx).not.toBeNull();
  });

  it("stickyRightSx is a non-null object", () => {
    expect(stickyRightSx).toBeTypeOf("object");
    expect(stickyRightSx).not.toBeNull();
  });

  it("commonSx is a non-null object", () => {
    expect(commonSx).toBeTypeOf("object");
    expect(commonSx).not.toBeNull();
  });
});
