export interface InterviewConfig {
  type: string; // e.g., "Job", "Scholarship"
  roleOrScholarshipName: string; // e.g., "Frontend Engineer" or "Chevening"
  companyOrOrg: string; // e.g., "Google" or "UK Government"
  experienceLevel?: string; // e.g., "Junior", "Senior"
  focusArea?: string; // e.g., "Behavioral", "Technical", "Leadership"
}

export interface MessageLog {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}
