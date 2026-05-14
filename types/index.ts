import type { Database } from "@/types/supabase";

export type CommissionReport = Database["public"]["Tables"]["commission_reports"]["Row"];
export type Appeal = Database["public"]["Tables"]["report_appeals"]["Row"];
export type EvidenceSubmission = Database["public"]["Tables"]["report_evidence_submissions"]["Row"];
export type SubmissionEvent = Database["public"]["Tables"]["submission_events"]["Row"];
export type AdminActionLog = Database["public"]["Tables"]["admin_action_logs"]["Row"];
