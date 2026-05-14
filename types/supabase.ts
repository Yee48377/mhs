export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      commission_reports: {
        Row: {
          created_at: string;
          days_missing: number;
          description: string;
          evidence_url: string;
          id: string;
          is_public: boolean;
          is_resolved: boolean;
          last_contact: string;
          platform: string;
          report_count: number;
          status: string;
          submitter_contact: string | null;
          target_id: string;
        };
        Insert: {
          created_at?: string;
          days_missing: number;
          description: string;
          evidence_url: string;
          id?: string;
          is_public?: boolean;
          is_resolved?: boolean;
          last_contact: string;
          platform: string;
          report_count?: number;
          status?: string;
          submitter_contact?: string | null;
          target_id: string;
        };
        Update: {
          created_at?: string;
          days_missing?: number;
          description?: string;
          evidence_url?: string;
          id?: string;
          is_public?: boolean;
          is_resolved?: boolean;
          last_contact?: string;
          platform?: string;
          report_count?: number;
          status?: string;
          submitter_contact?: string | null;
          target_id?: string;
        };
        Relationships: [];
      };
      report_appeals: {
        Row: {
          contact: string;
          created_at: string;
          id: string;
          report_id: string;
          statement: string;
          status: string;
        };
        Insert: {
          contact: string;
          created_at?: string;
          id?: string;
          report_id: string;
          statement: string;
          status?: string;
        };
        Update: {
          contact?: string;
          created_at?: string;
          id?: string;
          report_id?: string;
          statement?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "report_appeals_report_id_fkey";
            columns: ["report_id"];
            isOneToOne: false;
            referencedRelation: "commission_reports";
            referencedColumns: ["id"];
          }
        ];
      };
      report_evidence_submissions: {
        Row: {
          contact: string | null;
          created_at: string;
          description: string;
          evidence_url: string;
          id: string;
          report_id: string;
          review_status: string;
        };
        Insert: {
          contact?: string | null;
          created_at?: string;
          description: string;
          evidence_url: string;
          id?: string;
          report_id: string;
          review_status?: string;
        };
        Update: {
          contact?: string | null;
          created_at?: string;
          description?: string;
          evidence_url?: string;
          id?: string;
          report_id?: string;
          review_status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "report_evidence_submissions_report_id_fkey";
            columns: ["report_id"];
            isOneToOne: false;
            referencedRelation: "commission_reports";
            referencedColumns: ["id"];
          }
        ];
      };
      admin_action_logs: {
        Row: {
          action: string;
          actor_label: string;
          created_at: string;
          details: Json | null;
          id: string;
          ip_address: string | null;
          report_id: string | null;
          target_id: string;
          target_type: string;
          user_agent: string | null;
        };
        Insert: {
          action: string;
          actor_label?: string;
          created_at?: string;
          details?: Json | null;
          id?: string;
          ip_address?: string | null;
          report_id?: string | null;
          target_id: string;
          target_type: string;
          user_agent?: string | null;
        };
        Update: {
          action?: string;
          actor_label?: string;
          created_at?: string;
          details?: Json | null;
          id?: string;
          ip_address?: string | null;
          report_id?: string | null;
          target_id?: string;
          target_type?: string;
          user_agent?: string | null;
        };
        Relationships: [];
      };
      submission_events: {
        Row: {
          created_at: string;
          error_message: string | null;
          event_type: string;
          flags: Json | null;
          id: string;
          ip_address: string | null;
          platform: string | null;
          record_id: string | null;
          status: string;
          target_id: string | null;
          user_agent: string | null;
        };
        Insert: {
          created_at?: string;
          error_message?: string | null;
          event_type: string;
          flags?: Json | null;
          id?: string;
          ip_address?: string | null;
          platform?: string | null;
          record_id?: string | null;
          status: string;
          target_id?: string | null;
          user_agent?: string | null;
        };
        Update: {
          created_at?: string;
          error_message?: string | null;
          event_type?: string;
          flags?: Json | null;
          id?: string;
          ip_address?: string | null;
          platform?: string | null;
          record_id?: string | null;
          status?: string;
          target_id?: string | null;
          user_agent?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
