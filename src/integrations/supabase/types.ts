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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      condominios: {
        Row: {
          admin_id: string | null
          created_at: string
          endereco: string
          id: string
          nome: string
          total_vagas: number
          updated_at: string
        }
        Insert: {
          admin_id?: string | null
          created_at?: string
          endereco: string
          id?: string
          nome: string
          total_vagas?: number
          updated_at?: string
        }
        Update: {
          admin_id?: string | null
          created_at?: string
          endereco?: string
          id?: string
          nome?: string
          total_vagas?: number
          updated_at?: string
        }
        Relationships: []
      }
      disponibilidades_vaga: {
        Row: {
          created_at: string
          criado_por: string | null
          fim: string
          id: string
          inicio: string
          recorrente: boolean
          vaga_id: string
        }
        Insert: {
          created_at?: string
          criado_por?: string | null
          fim: string
          id?: string
          inicio: string
          recorrente?: boolean
          vaga_id: string
        }
        Update: {
          created_at?: string
          criado_por?: string | null
          fim?: string
          id?: string
          inicio?: string
          recorrente?: boolean
          vaga_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "disponibilidades_vaga_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disponibilidades_vaga_vaga_id_fkey"
            columns: ["vaga_id"]
            isOneToOne: false
            referencedRelation: "minhas_vagas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disponibilidades_vaga_vaga_id_fkey"
            columns: ["vaga_id"]
            isOneToOne: false
            referencedRelation: "vagas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disponibilidades_vaga_vaga_id_fkey"
            columns: ["vaga_id"]
            isOneToOne: false
            referencedRelation: "vagas_disponiveis"
            referencedColumns: ["vaga_id"]
          },
        ]
      }
      logs_auditoria: {
        Row: {
          acao: string
          data_hora: string
          detalhes: Json | null
          entidade: string | null
          entidade_id: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          acao: string
          data_hora?: string
          detalhes?: Json | null
          entidade?: string | null
          entidade_id?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          acao?: string
          data_hora?: string
          detalhes?: Json | null
          entidade?: string | null
          entidade_id?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "logs_auditoria_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      reservas: {
        Row: {
          codigo_acesso: string | null
          created_at: string
          disponibilidade_id: string | null
          fim: string
          id: string
          inicio: string
          status: string
          updated_at: string
          user_id: string
          vaga_id: string
        }
        Insert: {
          codigo_acesso?: string | null
          created_at?: string
          disponibilidade_id?: string | null
          fim: string
          id?: string
          inicio: string
          status?: string
          updated_at?: string
          user_id: string
          vaga_id: string
        }
        Update: {
          codigo_acesso?: string | null
          created_at?: string
          disponibilidade_id?: string | null
          fim?: string
          id?: string
          inicio?: string
          status?: string
          updated_at?: string
          user_id?: string
          vaga_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservas_disponibilidade_id_fkey"
            columns: ["disponibilidade_id"]
            isOneToOne: false
            referencedRelation: "disponibilidades_vaga"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservas_disponibilidade_id_fkey"
            columns: ["disponibilidade_id"]
            isOneToOne: false
            referencedRelation: "minhas_vagas"
            referencedColumns: ["disponibilidade_id"]
          },
          {
            foreignKeyName: "reservas_disponibilidade_id_fkey"
            columns: ["disponibilidade_id"]
            isOneToOne: false
            referencedRelation: "vagas_disponiveis"
            referencedColumns: ["disponibilidade_id"]
          },
          {
            foreignKeyName: "reservas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservas_vaga_id_fkey"
            columns: ["vaga_id"]
            isOneToOne: false
            referencedRelation: "minhas_vagas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservas_vaga_id_fkey"
            columns: ["vaga_id"]
            isOneToOne: false
            referencedRelation: "vagas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservas_vaga_id_fkey"
            columns: ["vaga_id"]
            isOneToOne: false
            referencedRelation: "vagas_disponiveis"
            referencedColumns: ["vaga_id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      usuarios: {
        Row: {
          auth_user_id: string
          condominio_id: string | null
          cpf: string | null
          created_at: string
          email: string
          id: string
          nome: string
          placa: string | null
          role: Database["public"]["Enums"]["app_role"]
          telefone: string | null
          unidade: string | null
          updated_at: string
        }
        Insert: {
          auth_user_id: string
          condominio_id?: string | null
          cpf?: string | null
          created_at?: string
          email: string
          id?: string
          nome: string
          placa?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          telefone?: string | null
          unidade?: string | null
          updated_at?: string
        }
        Update: {
          auth_user_id?: string
          condominio_id?: string | null
          cpf?: string | null
          created_at?: string
          email?: string
          id?: string
          nome?: string
          placa?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          telefone?: string | null
          unidade?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_condominio_id_fkey"
            columns: ["condominio_id"]
            isOneToOne: false
            referencedRelation: "condominios"
            referencedColumns: ["id"]
          },
        ]
      }
      vagas: {
        Row: {
          ativo: boolean
          bloco: string | null
          condominio_id: string
          created_at: string
          id: string
          identificacao: string
          owner_id: string | null
          unidade: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          bloco?: string | null
          condominio_id: string
          created_at?: string
          id?: string
          identificacao: string
          owner_id?: string | null
          unidade?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          bloco?: string | null
          condominio_id?: string
          created_at?: string
          id?: string
          identificacao?: string
          owner_id?: string | null
          unidade?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vagas_condominio_id_fkey"
            columns: ["condominio_id"]
            isOneToOne: false
            referencedRelation: "condominios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vagas_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      minhas_vagas: {
        Row: {
          ativo: boolean | null
          bloco: string | null
          condominio_id: string | null
          created_at: string | null
          disponibilidade_id: string | null
          disponivel_fim: string | null
          disponivel_inicio: string | null
          id: string | null
          identificacao: string | null
          owner_id: string | null
          unidade: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vagas_condominio_id_fkey"
            columns: ["condominio_id"]
            isOneToOne: false
            referencedRelation: "condominios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vagas_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      vagas_disponiveis: {
        Row: {
          bloco: string | null
          condominio_id: string | null
          disponibilidade_id: string | null
          fim: string | null
          identificacao: string | null
          inicio: string | null
          proprietario_nome: string | null
          unidade: string | null
          vaga_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vagas_condominio_id_fkey"
            columns: ["condominio_id"]
            isOneToOne: false
            referencedRelation: "condominios"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      get_user_condominio_id: { Args: never; Returns: string }
      get_usuario_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "owner" | "user"
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
      app_role: ["admin", "owner", "user"],
    },
  },
} as const
