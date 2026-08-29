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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ai_predictions: {
        Row: {
          confidence: number | null
          created_at: string
          current_score: number | null
          id: string
          location_id: string
          predicted_score_30_days: number | null
          predicted_score_90_days: number | null
          prediction_date: string
          prediction_summary: string | null
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          current_score?: number | null
          id?: string
          location_id: string
          predicted_score_30_days?: number | null
          predicted_score_90_days?: number | null
          prediction_date?: string
          prediction_summary?: string | null
        }
        Update: {
          confidence?: number | null
          created_at?: string
          current_score?: number | null
          id?: string
          location_id?: string
          predicted_score_30_days?: number | null
          predicted_score_90_days?: number | null
          prediction_date?: string
          prediction_summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_predictions_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      alerts: {
        Row: {
          alert_type: string
          detected_at: string
          factor: string | null
          id: string
          location_id: string | null
          message: string
          recommendation: string | null
          severity: string
          status: string
        }
        Insert: {
          alert_type: string
          detected_at?: string
          factor?: string | null
          id?: string
          location_id?: string | null
          message: string
          recommendation?: string | null
          severity: string
          status?: string
        }
        Update: {
          alert_type?: string
          detected_at?: string
          factor?: string | null
          id?: string
          location_id?: string | null
          message?: string
          recommendation?: string | null
          severity?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerts_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      environmental_data: {
        Row: {
          air_quality: number
          biodiversity: number
          created_at: string
          date: string
          green_cover: number | null
          humidity: number | null
          id: string
          location_id: string
          rainfall: number | null
          temperature: number | null
          waste_level: number
          water_quality: number
        }
        Insert: {
          air_quality: number
          biodiversity: number
          created_at?: string
          date: string
          green_cover?: number | null
          humidity?: number | null
          id?: string
          location_id: string
          rainfall?: number | null
          temperature?: number | null
          waste_level: number
          water_quality: number
        }
        Update: {
          air_quality?: number
          biodiversity?: number
          created_at?: string
          date?: string
          green_cover?: number | null
          humidity?: number | null
          id?: string
          location_id?: string
          rainfall?: number | null
          temperature?: number | null
          waste_level?: number
          water_quality?: number
        }
        Relationships: [
          {
            foreignKeyName: "environmental_data_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      environmental_scores: {
        Row: {
          air_score: number | null
          biodiversity_score: number | null
          created_at: string
          date: string
          environmental_dna_score: number
          green_cover_score: number | null
          id: string
          location_id: string
          waste_score: number | null
          water_score: number | null
          weather_score: number | null
        }
        Insert: {
          air_score?: number | null
          biodiversity_score?: number | null
          created_at?: string
          date: string
          environmental_dna_score: number
          green_cover_score?: number | null
          id?: string
          location_id: string
          waste_score?: number | null
          water_score?: number | null
          weather_score?: number | null
        }
        Update: {
          air_score?: number | null
          biodiversity_score?: number | null
          created_at?: string
          date?: string
          environmental_dna_score?: number
          green_cover_score?: number | null
          id?: string
          location_id?: string
          waste_score?: number | null
          water_score?: number | null
          weather_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "environmental_scores_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      historical_data: {
        Row: {
          air_quality: number | null
          biodiversity: number | null
          created_at: string
          date: string
          environmental_score: number | null
          green_cover: number | null
          id: string
          location_id: string
          waste_level: number | null
          water_quality: number | null
        }
        Insert: {
          air_quality?: number | null
          biodiversity?: number | null
          created_at?: string
          date: string
          environmental_score?: number | null
          green_cover?: number | null
          id?: string
          location_id: string
          waste_level?: number | null
          water_quality?: number | null
        }
        Update: {
          air_quality?: number | null
          biodiversity?: number | null
          created_at?: string
          date?: string
          environmental_score?: number | null
          green_cover?: number | null
          id?: string
          location_id?: string
          waste_level?: number | null
          water_quality?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "historical_data_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          created_at: string
          id: string
          latitude: number
          location_name: string
          longitude: number
          region: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          latitude: number
          location_name: string
          longitude: number
          region?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          latitude?: number
          location_name?: string
          longitude?: number
          region?: string | null
        }
        Relationships: []
      }
      pollution_hotspots: {
        Row: {
          detected_at: string
          detected_factor: string | null
          environmental_score: number | null
          id: string
          latitude: number
          location_id: string | null
          longitude: number
          name: string
          pollution_level: string
          recommended_action: string | null
          risk_level: string
          status: string
        }
        Insert: {
          detected_at?: string
          detected_factor?: string | null
          environmental_score?: number | null
          id?: string
          latitude: number
          location_id?: string | null
          longitude: number
          name: string
          pollution_level: string
          recommended_action?: string | null
          risk_level: string
          status?: string
        }
        Update: {
          detected_at?: string
          detected_factor?: string | null
          environmental_score?: number | null
          id?: string
          latitude?: number
          location_id?: string | null
          longitude?: number
          name?: string
          pollution_level?: string
          recommended_action?: string | null
          risk_level?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "pollution_hotspots_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          name?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
        }
        Relationships: []
      }
      recovery_actions: {
        Row: {
          action_name: string
          action_type: string | null
          created_at: string
          current_score: number | null
          expected_improvement: number | null
          id: string
          location_id: string
          predicted_score: number | null
          recommendation: string | null
          status: string
        }
        Insert: {
          action_name: string
          action_type?: string | null
          created_at?: string
          current_score?: number | null
          expected_improvement?: number | null
          id?: string
          location_id: string
          predicted_score?: number | null
          recommendation?: string | null
          status?: string
        }
        Update: {
          action_name?: string
          action_type?: string | null
          created_at?: string
          current_score?: number | null
          expected_improvement?: number | null
          id?: string
          location_id?: string
          predicted_score?: number | null
          recommendation?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "recovery_actions_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
