export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          changed_at: string
          changed_by: string | null
          changed_by_email: string | null
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          record_id: string
          table_name: string
          user_agent: string | null
        }
        Insert: {
          action: string
          changed_at?: string
          changed_by?: string | null
          changed_by_email?: string | null
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id: string
          table_name: string
          user_agent?: string | null
        }
        Update: {
          action?: string
          changed_at?: string
          changed_by?: string | null
          changed_by_email?: string | null
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string
          table_name?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      auvo_hours_cache: {
        Row: {
          auvo_user_id: number
          employee_id: string
          id: string
          month_key: string
          synced_at: string
          tasks_detail: Json | null
          total_hours: number
        }
        Insert: {
          auvo_user_id: number
          employee_id: string
          id?: string
          month_key: string
          synced_at?: string
          tasks_detail?: Json | null
          total_hours?: number
        }
        Update: {
          auvo_user_id?: number
          employee_id?: string
          id?: string
          month_key?: string
          synced_at?: string
          tasks_detail?: Json | null
          total_hours?: number
        }
        Relationships: [
          {
            foreignKeyName: "auvo_hours_cache_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      auvo_sync_log: {
        Row: {
          employees_count: number
          errors: Json | null
          finished_at: string | null
          id: string
          month_key: string
          started_at: string
          status: string
          tasks_count: number
        }
        Insert: {
          employees_count?: number
          errors?: Json | null
          finished_at?: string | null
          id?: string
          month_key: string
          started_at?: string
          status?: string
          tasks_count?: number
        }
        Update: {
          employees_count?: number
          errors?: Json | null
          finished_at?: string | null
          id?: string
          month_key?: string
          started_at?: string
          status?: string
          tasks_count?: number
        }
        Relationships: []
      }
      auvo_task_cache: {
        Row: {
          auvo_task_id: number
          cached_at: string
          data: Json
          id: string
          os_number: string
        }
        Insert: {
          auvo_task_id: number
          cached_at?: string
          data?: Json
          id?: string
          os_number?: string
        }
        Update: {
          auvo_task_id?: number
          cached_at?: string
          data?: Json
          id?: string
          os_number?: string
        }
        Relationships: []
      }
      auvo_user_mapping: {
        Row: {
          auvo_user_id: number
          auvo_user_name: string
          created_at: string
          employee_id: string
          id: string
        }
        Insert: {
          auvo_user_id: number
          auvo_user_name?: string
          created_at?: string
          employee_id: string
          id?: string
        }
        Update: {
          auvo_user_id?: number
          auvo_user_name?: string
          created_at?: string
          employee_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "auvo_user_mapping_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      config: {
        Row: {
          bonus_cap: number
          created_at: string
          difficulty_weights: Json
          duration_weights: Json
          horas_esperadas: number
          id: string
          layer_weights: Json
          max_pts: number
          updated_at: string
        }
        Insert: {
          bonus_cap?: number
          created_at?: string
          difficulty_weights?: Json
          duration_weights?: Json
          horas_esperadas?: number
          id?: string
          layer_weights?: Json
          max_pts?: number
          updated_at?: string
        }
        Update: {
          bonus_cap?: number
          created_at?: string
          difficulty_weights?: Json
          duration_weights?: Json
          horas_esperadas?: number
          id?: string
          layer_weights?: Json
          max_pts?: number
          updated_at?: string
        }
        Relationships: []
      }
      employees: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name: string
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      gestor_emails: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      horas_trabalhadas: {
        Row: {
          employee_id: string
          horas: number
          id: string
          month_key: string
        }
        Insert: {
          employee_id: string
          horas?: number
          id?: string
          month_key: string
        }
        Update: {
          employee_id?: string
          horas?: number
          id?: string
          month_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "horas_trabalhadas_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      os_records: {
        Row: {
          ce: number
          ce_final: number
          ce_q: number
          cliente: string
          created_at: string
          crit: Json
          date: string
          dificuldade_id: string
          duracao_id: string
          duracao_mult: number
          employee_id: string
          employee_name: string
          employee_role: string
          id: string
          month_key: string
          obs: string
          os_id: string
          score: number
          setor: string
          tipo: string
          updated_at: string
          valor_os: number
        }
        Insert: {
          ce?: number
          ce_final?: number
          ce_q?: number
          cliente: string
          created_at?: string
          crit?: Json
          date: string
          dificuldade_id: string
          duracao_id: string
          duracao_mult?: number
          employee_id: string
          employee_name: string
          employee_role: string
          id?: string
          month_key: string
          obs?: string
          os_id: string
          score?: number
          setor?: string
          tipo?: string
          updated_at?: string
          valor_os?: number
        }
        Update: {
          ce?: number
          ce_final?: number
          ce_q?: number
          cliente?: string
          created_at?: string
          crit?: Json
          date?: string
          dificuldade_id?: string
          duracao_id?: string
          duracao_mult?: number
          employee_id?: string
          employee_name?: string
          employee_role?: string
          id?: string
          month_key?: string
          obs?: string
          os_id?: string
          score?: number
          setor?: string
          tipo?: string
          updated_at?: string
          valor_os?: number
        }
        Relationships: [
          {
            foreignKeyName: "os_records_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email: string
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_employee_id: { Args: never; Returns: string }
      get_employee_id_by_email: { Args: { _email: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "gestor" | "colaborador"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["gestor", "colaborador"],
    },
  },
} as const
