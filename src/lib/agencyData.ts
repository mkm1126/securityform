// Agency data from the provided CSV file
export interface Agency {
  name: string;
  code: string;
}

export interface HealthLicensingBoard {
  name: string;
  code: string;
}

export interface SmartAgency {
  name: string;
  code: string;
}

export const agencies: Agency[] = [
  { name: "Administration", code: "G02" },
  { name: "Administrative Hearings", code: "G9K" },
  { name: "Agriculture", code: "B04" },
  { name: "Animal Health", code: "B14" },
  { name: "Attorney General", code: "G06" },
  { name: "Cannabis Management Office", code: "B10" },
  { name: "Cannabis Expungement Board", code: "P80" },
  { name: "Combative Sports Commission", code: "B7G" },
  { name: "Commerce", code: "B13" },
  { name: "Accountancy Brd", code: "B7P" },
  { name: "Brd of Architect", code: "B7E" },
  { name: "MNCIFA", code: "B26" },
  { name: "Corrections", code: "P78" },
  { name: "Education", code: "E37" },
  { name: "Employment", code: "B22" },
  { name: "Econ Dev", code: "B24" },
  { name: "Explore MN Tourism", code: "B20" },
  { name: "Gambling Control", code: "G09" },
  { name: "Governors Office", code: "G39" },
  { name: "Health", code: "H12" },
  { name: "Health Licensing Boards", code: "HLB" }, // Special entry for health licensing boards
  { name: "Higher Ed Facilities", code: "E9W" },
  { name: "Housing Finance Agency", code: "B34" },
  { name: "Direct Care and Treatment (DCT)", code: "H51" },
  { name: "Human Services", code: "H55" },
  { name: "HS Children, Youth & Family (DCYF)", code: "H58" },
  { name: "Investment Board", code: "G38" },
  { name: "Iron Range R&R", code: "B43" },
  { name: "Judicial", code: "J33" },
  { name: "Guardian Ad Litem", code: "J40" },
  { name: "Court of Appeals", code: "J50" },
  { name: "Supreme Court", code: "J58" },
  { name: "State Competency Attainment Board", code: "J65" },
  { name: "The Minnesota Competency Attainment Board (MNCAB)", code: "J40" },
  { name: "Judicial Standards Brd", code: "J70" },
  { name: "Labor & Industry", code: "B42" },
  { name: "Leg Coord Comm (LCC)", code: "L10" },
  { name: "Legislative Auditor", code: "L49" },
  { name: "Lottery", code: "G03" },
  { name: "Military Affairs", code: "P01" },
  { name: "Minnesota Management & Budget", code: "G10" },
  { name: "MN.IT", code: "G46" },
  { name: "Mn State Academies", code: "E44" },
  { name: "MinnState", code: "E26" },
  { name: "MN State Retirement System", code: "G62" },
  { name: "Natural Resources", code: "R29" },
  { name: "Office of Higher Education", code: "E60" },
  { name: "Perpich Ctr for Arts Education", code: "E25" },
  { name: "Pollution Control", code: "R32" },
  { name: "Public Defense", code: "J52" },
  { name: "Public Employees Retire Assoc", code: "G63" },
  { name: "Public Safety", code: "P07" },
  { name: "Public Utilities Commission", code: "B82" },
  { name: "Revenue", code: "G67" },
  { name: "Secy of State", code: "G53" },
  { name: "Senate", code: "L11" },
  { name: "SMART", code: "SMT" }, // Special entry for SMART agencies
  { name: "State Auditor", code: "G61" },
  { name: "Teacher's Retirement", code: "G69" },
  { name: "Transportation", code: "T79" },
  { name: "Veterans Affairs", code: "H75" },
  { name: "Water & Soil", code: "R9P" },
  { name: "Zoo", code: "E77" }
];

// Health Licensing Boards data from the provided CSV
export const healthLicensingBoards: HealthLicensingBoard[] = [
  { name: "Cosmetology Examiners", code: "B11" },
  { name: "Barber Examiners", code: "B15" },
  { name: "Medical Practice", code: "H7B" },
  { name: "Nursing", code: "H7C" },
  { name: "Pharmacy", code: "H7D" },
  { name: "Dentistry", code: "H7F" },
  { name: "Chiropractic Examiners", code: "H7H" },
  { name: "Optometry", code: "H7J" },
  { name: "Bd of Execs for LT Services & Supports", code: "H7K" },
  { name: "Social Work", code: "H7L" },
  { name: "Marriage & Family Therapy", code: "H7M" },
  { name: "Podiatric Medicine", code: "H7Q" },
  { name: "Veterinary Medicine", code: "H7R" },
  { name: "Dietetics & Nutrition Practice", code: "H7U" },
  { name: "Psychology", code: "H7V" },
  { name: "Physical Therapy", code: "H7W" },
  { name: "Behaviorial Health", code: "H7X" },
  { name: "Occupational Therapy Practice Board", code: "H7Y" },
  { name: "Emergency Medical Services Regulatory", code: "H7S" }
];

// SMART agencies data from the provided CSV
export const smartAgencies: SmartAgency[] = [
  { name: "Workers Comp Court of Appeals (WCCA)", code: "B41" },
  { name: "Amateur Sports Commission", code: "B9D" },
  { name: "Prof. Educ. Lic. & Stand. Bd.", code: "E39" },
  { name: "Arts Board", code: "E50" },
  { name: "Racing Commission (MRC)", code: "G05" },
  { name: "Human Rights (MDHR)", code: "G17" },
  { name: "Indian Affairs Council", code: "G19" },
  { name: "Mediation Services (SEMA4 only)", code: "G45" },
  { name: "Ombudsperson for Families", code: "G92" },
  { name: "Ombudsperson For Am Ind Fams", code: "G93" },
  { name: "Campaign Finance", code: "G9J" },
  { name: "Council for MNs of African Heritage", code: "G9L" },
  { name: "MN Council for Latino Affairs", code: "G9M" },
  { name: "Council on Asian-Pacific MNs", code: "G9N" },
  { name: "Capitol Area Architect (CAAPB)", code: "G9X" },
  { name: "MN Council on Disability", code: "G9Y" },
  { name: "Tax Court", code: "J68" },
  { name: "Ombuds for Corrections", code: "P08" },
  { name: "POST Board", code: "P7T" },
  { name: "Clemency Review Board", code: "P82" },
  { name: "Sentencing Guidelines", code: "P9E" },
  { name: "Foster Youth Ombudsperson", code: "H8A" },
  { name: "Ombud Mental Hlth & Dev Dis", code: "H9G" },
  { name: "Secure Choice Retirement", code: "G70" },
  { name: "LGBTQIA2S+ Minnesotans Council", code: "G9P" },
  { name: "Rare Disease Advisory Council", code: "G9V" }
];

// Function to find agency by name
export const findAgencyByName = (name: string): Agency | undefined => {
  return agencies.find(agency => agency.name === name);
};

// Function to find agency by code
export const findAgencyByCode = (code: string): Agency | undefined => {
  return agencies.find(agency => agency.code === code);
};

// Function to find health licensing board by name
export const findHealthLicensingBoardByName = (name: string): HealthLicensingBoard | undefined => {
  return healthLicensingBoards.find(board => board.name === name);
};

// Function to find health licensing board by code
export const findHealthLicensingBoardByCode = (code: string): HealthLicensingBoard | undefined => {
  return healthLicensingBoards.find(board => board.code === code);
};

// Function to find SMART agency by name
export const findSmartAgencyByName = (name: string): SmartAgency | undefined => {
  return smartAgencies.find(agency => agency.name === name);
};

// Function to find SMART agency by code
export const findSmartAgencyByCode = (code: string): SmartAgency | undefined => {
  return smartAgencies.find(agency => agency.code === code);
};