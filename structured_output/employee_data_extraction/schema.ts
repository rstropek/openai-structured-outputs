import { z } from "zod/v4";

export const EmployeeSchema = z.object({
  EmployeeID: z
    .string()
    .regex(/^TC-(IT|HR|FN|MK|SL|SP|OP)\d{3}-\d{2}$/, {
      message: "Format: TC-<DEPT><NNN>-<YY>, e.g. TC-IT123-24",
    })
    .meta({ description: "Unique employee identifier" }),

  FirstName: z
    .string()
    // letters incl. most Latin accents + space/apos/hyphen (no \p{L}, no /u)
    .regex(/^[A-Za-zÀ-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ' -]{1,49}$/, {
      message: "2–50 letters, may include spaces, apostrophes, or hyphens",
    })
    .meta({ description: "Employee's first name" }),

  LastName: z
    .string()
    .regex(/^[A-Za-zÀ-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ' -]{1,49}$/, {
      message: "2–50 letters, may include spaces, apostrophes, or hyphens",
    })
    .meta({ description: "Employee's last name" }),

  Department: z
    .enum(["IT", "HR", "Finance", "Marketing", "Sales", "Support", "Operations"])
    .meta({ description: "Assigned department" }),

  HireDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, {
      message: "Must be in YYYY-MM-DD format",
    })
    .meta({ description: "Employment start date" }),

  MobileNumber: z
    .string()
    .regex(/^\+43\s?660\s?\d{7}$/, {
      message: "Must be Austrian mobile format: +43 660 1234567",
    })
    .meta({ description: "Employee's mobile phone number" }),

  Email: z
    .email()
    .meta({ description: "Employee's email address" }),

  Street: z
    .string()
    // letters (incl. accents) + digits + space . , ' -
    .regex(/^[A-Za-zÀ-ÖØ-öø-ÿ0-9 .,'-]{2,100}$/, {
      message: "2–100 chars, letters/numbers allowed",
    })
    .meta({ description: "Street name of residence" }),

  HouseNumber: z
    .string()
    .regex(/^\d{1,4}[A-Za-z]?$/, {
      message: "1–4 digits plus optional letter",
    })
    .meta({ description: "House number of residence" }),

  PostalCode: z
    .string()
    .regex(/^\d{4}$/, {
      message: "4-digit postal code",
    })
    .meta({ description: "Postal code of residence" }),

  City: z
    .string()
    .regex(/^[A-Za-zÀ-ÖØ-öø-ÿ .'-]{2,80}$/, {
      message: "2–80 chars, letters and spaces allowed",
    })
    .meta({ description: "City of residence" }),

  Country: z
    .literal("Austria")
    .meta({ description: "Country of residence (fixed to Austria)" }),
});
