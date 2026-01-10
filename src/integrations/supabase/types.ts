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
      body_weight_entries: {
        Row: {
          created_at: string
          id: string
          measured_at: string
          notes: string | null
          source: string
          source_row_id: string
          updated_at: string
          user_id: string
          weight_kg: number
          weight_lb: number
        }
        Insert: {
          created_at?: string
          id?: string
          measured_at?: string
          notes?: string | null
          source?: string
          source_row_id: string
          updated_at?: string
          user_id: string
          weight_kg: number
          weight_lb: number
        }
        Update: {
          created_at?: string
          id?: string
          measured_at?: string
          notes?: string | null
          source?: string
          source_row_id?: string
          updated_at?: string
          user_id?: string
          weight_kg?: number
          weight_lb?: number
        }
        Relationships: []
      }
      entries: {
        Row: {
          amount_grams: number
          calories: number
          carbs: number
          created_at: string
          date: string
          fat: number
          food_id: string | null
          food_name: string
          id: string
          is_recipe: boolean
          meal: Database["public"]["Enums"]["meal_type"]
          note: string | null
          parent_entry_id: string | null
          protein: number
          user_id: string
        }
        Insert: {
          amount_grams: number
          calories: number
          carbs: number
          created_at?: string
          date: string
          fat: number
          food_id?: string | null
          food_name: string
          id?: string
          is_recipe?: boolean
          meal: Database["public"]["Enums"]["meal_type"]
          note?: string | null
          parent_entry_id?: string | null
          protein: number
          user_id: string
        }
        Update: {
          amount_grams?: number
          calories?: number
          carbs?: number
          created_at?: string
          date?: string
          fat?: number
          food_id?: string | null
          food_name?: string
          id?: string
          is_recipe?: boolean
          meal?: Database["public"]["Enums"]["meal_type"]
          note?: string | null
          parent_entry_id?: string | null
          protein?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entries_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entries_parent_entry_id_fkey"
            columns: ["parent_entry_id"]
            isOneToOne: false
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
        ]
      }
      foods: {
        Row: {
          barcode: string | null
          brand: string | null
          calories_per_100g: number | null
          calories_per_serving: number | null
          carbs_per_100g: number | null
          carbs_per_serving: number | null
          created_at: string
          fat_per_100g: number | null
          fat_per_serving: number | null
          id: string
          is_favorite: boolean
          last_used_at: string | null
          name: string
          nutrition_basis: Database["public"]["Enums"]["nutrition_basis"]
          protein_per_100g: number | null
          protein_per_serving: number | null
          serving_grams: number | null
          source: Database["public"]["Enums"]["food_source"]
          updated_at: string
          use_count: number
          user_id: string
        }
        Insert: {
          barcode?: string | null
          brand?: string | null
          calories_per_100g?: number | null
          calories_per_serving?: number | null
          carbs_per_100g?: number | null
          carbs_per_serving?: number | null
          created_at?: string
          fat_per_100g?: number | null
          fat_per_serving?: number | null
          id?: string
          is_favorite?: boolean
          last_used_at?: string | null
          name: string
          nutrition_basis?: Database["public"]["Enums"]["nutrition_basis"]
          protein_per_100g?: number | null
          protein_per_serving?: number | null
          serving_grams?: number | null
          source?: Database["public"]["Enums"]["food_source"]
          updated_at?: string
          use_count?: number
          user_id: string
        }
        Update: {
          barcode?: string | null
          brand?: string | null
          calories_per_100g?: number | null
          calories_per_serving?: number | null
          carbs_per_100g?: number | null
          carbs_per_serving?: number | null
          created_at?: string
          fat_per_100g?: number | null
          fat_per_serving?: number | null
          id?: string
          is_favorite?: boolean
          last_used_at?: string | null
          name?: string
          nutrition_basis?: Database["public"]["Enums"]["nutrition_basis"]
          protein_per_100g?: number | null
          protein_per_serving?: number | null
          serving_grams?: number | null
          source?: Database["public"]["Enums"]["food_source"]
          updated_at?: string
          use_count?: number
          user_id?: string
        }
        Relationships: []
      }
      meal_templates: {
        Row: {
          created_at: string
          entries: Json
          id: string
          last_used_at: string | null
          meal_type: Database["public"]["Enums"]["meal_type"]
          name: string
          updated_at: string
          use_count: number
          user_id: string
        }
        Insert: {
          created_at?: string
          entries?: Json
          id?: string
          last_used_at?: string | null
          meal_type: Database["public"]["Enums"]["meal_type"]
          name: string
          updated_at?: string
          use_count?: number
          user_id: string
        }
        Update: {
          created_at?: string
          entries?: Json
          id?: string
          last_used_at?: string | null
          meal_type?: Database["public"]["Enums"]["meal_type"]
          name?: string
          updated_at?: string
          use_count?: number
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string
          daily_calories: number
          daily_carbs: number
          daily_fat: number
          daily_protein: number
          id: string
          meal_name_breakfast: string | null
          meal_name_dinner: string | null
          meal_name_lunch: string | null
          meal_name_snacks: string | null
          preferred_unit: Database["public"]["Enums"]["weight_unit"]
          rest_calories: number | null
          rest_carbs: number | null
          rest_fat: number | null
          rest_protein: number | null
          tolerance_calories: number | null
          tolerance_macros: number | null
          training_calories: number | null
          training_carbs: number | null
          training_fat: number | null
          training_protein: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          daily_calories?: number
          daily_carbs?: number
          daily_fat?: number
          daily_protein?: number
          id?: string
          meal_name_breakfast?: string | null
          meal_name_dinner?: string | null
          meal_name_lunch?: string | null
          meal_name_snacks?: string | null
          preferred_unit?: Database["public"]["Enums"]["weight_unit"]
          rest_calories?: number | null
          rest_carbs?: number | null
          rest_fat?: number | null
          rest_protein?: number | null
          tolerance_calories?: number | null
          tolerance_macros?: number | null
          training_calories?: number | null
          training_carbs?: number | null
          training_fat?: number | null
          training_protein?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          daily_calories?: number
          daily_carbs?: number
          daily_fat?: number
          daily_protein?: number
          id?: string
          meal_name_breakfast?: string | null
          meal_name_dinner?: string | null
          meal_name_lunch?: string | null
          meal_name_snacks?: string | null
          preferred_unit?: Database["public"]["Enums"]["weight_unit"]
          rest_calories?: number | null
          rest_carbs?: number | null
          rest_fat?: number | null
          rest_protein?: number | null
          tolerance_calories?: number | null
          tolerance_macros?: number | null
          training_calories?: number | null
          training_carbs?: number | null
          training_fat?: number | null
          training_protein?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      food_source: "user" | "open_food_facts"
      meal_type: "breakfast" | "lunch" | "dinner" | "snacks"
      nutrition_basis: "per_100g" | "per_serving"
      weight_unit: "g" | "oz"
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
      food_source: ["user", "open_food_facts"],
      meal_type: ["breakfast", "lunch", "dinner", "snacks"],
      nutrition_basis: ["per_100g", "per_serving"],
      weight_unit: ["g", "oz"],
    },
  },
} as const
