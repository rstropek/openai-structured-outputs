import { z } from "zod/v4";

const EmployeeSchema = z.object({
  EmployeeID: z
    .string()
    .regex(/^TC-(IT|HR|FN|MK|SL|SP|OP)\d{3}-\d{2}$/, {
      message: "Format: TC-<DEPT><NNN>-<YY>, e.g. TC-IT123-24",
    })
    .describe("Unique employee identifier"),

  FirstName: z.string().describe("Employee's first name"),

  LastName: z.string().describe("Employee's last name"),

  Department: z
    .enum(["IT", "HR", "Finance", "Marketing", "Sales", "Support", "Operations"])
    .describe("Assigned department"),

  HireDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, {
      message: "Must be in YYYY-MM-DD format",
    })
    .describe("Employment start date"),

  MobileNumber: z
    .string()
    .describe("Employee's mobile phone number (Austrian format preferred)"),

  Email: z.string().describe("Employee's email address"),

  Street: z.string().describe("Street name of residence"),

  HouseNumber: z
    .string()
    .regex(/^\d{1,4}[A-Za-z]?$/, {
      message: "1–4 digits plus optional letter",
    })
    .describe("House number of residence"),

  PostalCode: z
    .string()
    .regex(/^\d{4}$/, {
      message: "4-digit postal code",
    })
    .describe("Postal code of residence"),

  City: z.string().min(2).max(80).describe("City of residence"),

  Country: z
    .literal("Austria")
    .describe("Country of residence (fixed to Austria)"),
});

export const EmployeesWrapperSchema = z
  .object({
    employees: z.array(EmployeeSchema).describe("List of employees"),
  })
  .describe("Wrapper object containing a list of employees");
