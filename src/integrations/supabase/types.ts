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
      agenda: {
        Row: {
          created_at: string | null
          data_evento: string
          descricao: string | null
          id: string
          imagem_url: string | null
          tipo: string | null
          titulo: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          data_evento: string
          descricao?: string | null
          id?: string
          imagem_url?: string | null
          tipo?: string | null
          titulo: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          data_evento?: string
          descricao?: string | null
          id?: string
          imagem_url?: string | null
          tipo?: string | null
          titulo?: string
          user_id?: string | null
        }
        Relationships: []
      }
      alunos: {
        Row: {
          ano_entrada: number
          arquivado: boolean | null
          consentimento_imagem: boolean | null
          consentimento_lgpd: boolean | null
          cpf: string | null
          created_at: string | null
          data_nascimento: string
          foto_url: string | null
          id: string
          matricula: string | null
          nome: string
          nota_disciplinar: number | null
          turma_id: string | null
          turno: Database["public"]["Enums"]["turno_type"]
          updated_at: string | null
        }
        Insert: {
          ano_entrada: number
          arquivado?: boolean | null
          consentimento_imagem?: boolean | null
          consentimento_lgpd?: boolean | null
          cpf?: string | null
          created_at?: string | null
          data_nascimento: string
          foto_url?: string | null
          id?: string
          matricula?: string | null
          nome: string
          nota_disciplinar?: number | null
          turma_id?: string | null
          turno?: Database["public"]["Enums"]["turno_type"]
          updated_at?: string | null
        }
        Update: {
          ano_entrada?: number
          arquivado?: boolean | null
          consentimento_imagem?: boolean | null
          consentimento_lgpd?: boolean | null
          cpf?: string | null
          created_at?: string | null
          data_nascimento?: string
          foto_url?: string | null
          id?: string
          matricula?: string | null
          nome?: string
          nota_disciplinar?: number | null
          turma_id?: string | null
          turno?: Database["public"]["Enums"]["turno_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alunos_turma_id_fkey"
            columns: ["turma_id"]
            isOneToOne: false
            referencedRelation: "turmas"
            referencedColumns: ["id"]
          },
        ]
      }
      anotacoes: {
        Row: {
          aluno_id: string
          ano_letivo: number | null
          created_at: string | null
          descricao: string
          id: string
          lancado_por: string | null
          tipo: Database["public"]["Enums"]["anotacao_tipo"]
        }
        Insert: {
          aluno_id: string
          ano_letivo?: number | null
          created_at?: string | null
          descricao: string
          id?: string
          lancado_por?: string | null
          tipo: Database["public"]["Enums"]["anotacao_tipo"]
        }
        Update: {
          aluno_id?: string
          ano_letivo?: number | null
          created_at?: string | null
          descricao?: string
          id?: string
          lancado_por?: string | null
          tipo?: Database["public"]["Enums"]["anotacao_tipo"]
        }
        Relationships: [
          {
            foreignKeyName: "anotacoes_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
        ]
      }
      auditoria_lgpd: {
        Row: {
          acao: string
          created_at: string
          dados_antigos: Json | null
          dados_novos: Json | null
          id: string
          ip_address: string | null
          registro_id: string | null
          tabela_afetada: string | null
          user_id: string | null
        }
        Insert: {
          acao: string
          created_at?: string
          dados_antigos?: Json | null
          dados_novos?: Json | null
          id?: string
          ip_address?: string | null
          registro_id?: string | null
          tabela_afetada?: string | null
          user_id?: string | null
        }
        Update: {
          acao?: string
          created_at?: string
          dados_antigos?: Json | null
          dados_novos?: Json | null
          id?: string
          ip_address?: string | null
          registro_id?: string | null
          tabela_afetada?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      elogios: {
        Row: {
          aluno_id: string
          ano_letivo: number | null
          created_at: string | null
          descricao: string | null
          id: string
          lancado_por: string | null
          tipo: Database["public"]["Enums"]["elogio_tipo"]
        }
        Insert: {
          aluno_id: string
          ano_letivo?: number | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          lancado_por?: string | null
          tipo: Database["public"]["Enums"]["elogio_tipo"]
        }
        Update: {
          aluno_id?: string
          ano_letivo?: number | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          lancado_por?: string | null
          tipo?: Database["public"]["Enums"]["elogio_tipo"]
        }
        Relationships: [
          {
            foreignKeyName: "elogios_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
        ]
      }
      faltas: {
        Row: {
          aluno_id: string
          ano_letivo: number | null
          created_at: string
          data_fim: string
          data_inicio: string
          detalhes: string | null
          id: string
          lancado_por: string | null
          motivo: string
        }
        Insert: {
          aluno_id: string
          ano_letivo?: number | null
          created_at?: string
          data_fim: string
          data_inicio: string
          detalhes?: string | null
          id?: string
          lancado_por?: string | null
          motivo: string
        }
        Update: {
          aluno_id?: string
          ano_letivo?: number | null
          created_at?: string
          data_fim?: string
          data_inicio?: string
          detalhes?: string | null
          id?: string
          lancado_por?: string | null
          motivo?: string
        }
        Relationships: [
          {
            foreignKeyName: "faltas_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
        ]
      }
      informativos: {
        Row: {
          created_at: string
          created_by: string | null
          data_evento: string
          descricao: string | null
          id: string
          imagem_url: string | null
          titulo: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          data_evento: string
          descricao?: string | null
          id?: string
          imagem_url?: string | null
          titulo: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          data_evento?: string
          descricao?: string | null
          id?: string
          imagem_url?: string | null
          titulo?: string
        }
        Relationships: []
      }
      login_attempts_pais: {
        Row: {
          attempt_time: string
          id: string
          ip_address: string
          matricula: string | null
        }
        Insert: {
          attempt_time?: string
          id?: string
          ip_address: string
          matricula?: string | null
        }
        Update: {
          attempt_time?: string
          id?: string
          ip_address?: string
          matricula?: string | null
        }
        Relationships: []
      }
      manuais: {
        Row: {
          id: string
          nome: string
          uploaded_at: string
          uploaded_by: string | null
          url: string
        }
        Insert: {
          id?: string
          nome: string
          uploaded_at?: string
          uploaded_by?: string | null
          url: string
        }
        Update: {
          id?: string
          nome?: string
          uploaded_at?: string
          uploaded_by?: string | null
          url?: string
        }
        Relationships: []
      }
      pais_alunos: {
        Row: {
          aluno_id: string
          consentimento_visualizacao: boolean | null
          created_at: string
          data_nascimento_text: string | null
          id: string
          matricula: string | null
          nome_responsavel: string
          ultimo_acesso: string | null
        }
        Insert: {
          aluno_id: string
          consentimento_visualizacao?: boolean | null
          created_at?: string
          data_nascimento_text?: string | null
          id?: string
          matricula?: string | null
          nome_responsavel: string
          ultimo_acesso?: string | null
        }
        Update: {
          aluno_id?: string
          consentimento_visualizacao?: boolean | null
          created_at?: string
          data_nascimento_text?: string | null
          id?: string
          matricula?: string | null
          nome_responsavel?: string
          ultimo_acesso?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pais_alunos_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: true
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          id: string
          nome: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id: string
          nome: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      termos: {
        Row: {
          aluno_id: string
          created_at: string | null
          id: string
          motivo: string | null
          tipo: Database["public"]["Enums"]["termo_tipo"]
          valor_desconto: number
        }
        Insert: {
          aluno_id: string
          created_at?: string | null
          id?: string
          motivo?: string | null
          tipo: Database["public"]["Enums"]["termo_tipo"]
          valor_desconto: number
        }
        Update: {
          aluno_id?: string
          created_at?: string | null
          id?: string
          motivo?: string | null
          tipo?: Database["public"]["Enums"]["termo_tipo"]
          valor_desconto?: number
        }
        Relationships: [
          {
            foreignKeyName: "termos_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
        ]
      }
      turmas: {
        Row: {
          ano_letivo: number
          created_at: string | null
          id: string
          nome: string
        }
        Insert: {
          ano_letivo?: number
          created_at?: string | null
          id?: string
          nome: string
        }
        Update: {
          ano_letivo?: number
          created_at?: string | null
          id?: string
          nome?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_login_rate_limit: {
        Args: { p_ip: string; p_matricula: string }
        Returns: Json
      }
      clear_login_attempts: { Args: { p_ip: string }; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_authenticated: { Args: never; Returns: boolean }
      log_lgpd_audit: {
        Args: {
          p_acao: string
          p_dados_antigos?: Json
          p_dados_novos?: Json
          p_registro_id?: string
          p_tabela_afetada?: string
        }
        Returns: undefined
      }
      portal_pais_get_dashboard: {
        Args: { p_matricula: string; p_nascimento: string }
        Returns: Json
      }
      system_insert_audit: {
        Args: {
          p_acao: string
          p_dados_antigos?: Json
          p_dados_novos?: Json
          p_registro_id?: string
          p_tabela_afetada?: string
        }
        Returns: undefined
      }
    }
    Enums: {
      anotacao_tipo: "leve" | "media" | "grave" | "gravissima"
      app_role: "admin" | "monitor"
      elogio_tipo: "coletivo" | "individual" | "mencao_honrosa"
      termo_tipo: "leve" | "medio" | "grave" | "gravissimo"
      turno_type: "matutino" | "vespertino"
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
      anotacao_tipo: ["leve", "media", "grave", "gravissima"],
      app_role: ["admin", "monitor"],
      elogio_tipo: ["coletivo", "individual", "mencao_honrosa"],
      termo_tipo: ["leve", "medio", "grave", "gravissimo"],
      turno_type: ["matutino", "vespertino"],
    },
  },
} as const
