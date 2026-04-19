export type PedigreeSnapshotNode = {
  id: string | null; // null when ancestor slot is empty
  regNo: string | null;
  name: string | null;
  sex: 'male' | 'female' | null;
};

export type CertificateSnapshot = {
  tenant: { slug: string; nameTh: string; nameEn: string | null };
  issuedAtIso: string;
  cattle: {
    regNo: string;
    earTag: string;
    name: string | null;
    breed: string | null;
    sex: 'male' | 'female';
    dob: string | null;
    color: string | null;
  };
  owner: { memberNo: string; fullName: string } | null;
  pedigree: {
    // 3 generations: 2 + 4 + 8 = 14 ancestor slots, keyed by position string
    // like 'S', 'D', 'SS', 'SD', 'DS', 'DD', 'SSS', ...
    [position: string]: PedigreeSnapshotNode;
  };
};

export type CertificateRow = {
  id: string;
  certNo: string;
  issuedAt: string;
  verifyHash: string;
  snapshot: CertificateSnapshot;
};
