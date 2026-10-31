// Generated from the VARI Supabase schema (supabase gen types). Regenerate after migrations.

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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          actor: string | null
          actor_email: string | null
          at: string
          entity: string
          entity_id: string | null
          id: number
          summary: string | null
        }
        Insert: {
          action: string
          actor?: string | null
          actor_email?: string | null
          at?: string
          entity: string
          entity_id?: string | null
          id?: never
          summary?: string | null
        }
        Update: {
          action?: string
          actor?: string | null
          actor_email?: string | null
          at?: string
          entity?: string
          entity_id?: string | null
          id?: never
          summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_fkey"
            columns: ["actor"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_authors: {
        Row: {
          avatar: string | null
          bio: Json
          created_at: string
          id: string
          links: Json
          name: string
          role: Json
          slug: string
          updated_at: string
        }
        Insert: {
          avatar?: string | null
          bio?: Json
          created_at?: string
          id?: string
          links?: Json
          name: string
          role?: Json
          slug: string
          updated_at?: string
        }
        Update: {
          avatar?: string | null
          bio?: Json
          created_at?: string
          id?: string
          links?: Json
          name?: string
          role?: Json
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      blog_categories: {
        Row: {
          created_at: string
          description: Json
          id: string
          name: Json
          slug: string
          sort: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: Json
          id?: string
          name?: Json
          slug: string
          sort?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: Json
          id?: string
          name?: Json
          slug?: string
          sort?: number
          updated_at?: string
        }
        Relationships: []
      }
      blog_post_tags: {
        Row: {
          post_id: string
          tag_id: string
        }
        Insert: {
          post_id: string
          tag_id: string
        }
        Update: {
          post_id?: string
          tag_id?: string
        }
        Relationships: []
      }
      blog_post_translations: {
        Row: {
          content: Json | null
          excerpt: string
          focus_keyword: string
          html: string
          locale: Database["public"]["Enums"]["site_locale"]
          post_id: string
          ready: boolean
          seo_description: string
          seo_title: string
          slug: string
          source_hash: string | null
          takeaways: Json
          title: string
          updated_at: string
          word_count: number
        }
        Insert: {
          content?: Json | null
          excerpt?: string
          focus_keyword?: string
          html?: string
          locale: Database["public"]["Enums"]["site_locale"]
          post_id: string
          ready?: boolean
          seo_description?: string
          seo_title?: string
          slug: string
          source_hash?: string | null
          takeaways?: Json
          title?: string
          updated_at?: string
          word_count?: number
        }
        Update: {
          content?: Json | null
          excerpt?: string
          focus_keyword?: string
          html?: string
          locale?: Database["public"]["Enums"]["site_locale"]
          post_id?: string
          ready?: boolean
          seo_description?: string
          seo_title?: string
          slug?: string
          source_hash?: string | null
          takeaways?: Json
          title?: string
          updated_at?: string
          word_count?: number
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author_id: string | null
          category_id: string | null
          cover: string | null
          cover_alt: Json
          created_at: string
          faq: Json
          featured: boolean
          id: string
          publish_at: string | null
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          author_id?: string | null
          category_id?: string | null
          cover?: string | null
          cover_alt?: Json
          created_at?: string
          faq?: Json
          featured?: boolean
          id?: string
          publish_at?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          author_id?: string | null
          category_id?: string | null
          cover?: string | null
          cover_alt?: Json
          created_at?: string
          faq?: Json
          featured?: boolean
          id?: string
          publish_at?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      blog_tags: {
        Row: {
          created_at: string
          id: string
          name: Json
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name?: Json
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: Json
          slug?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: Json
          id: string
          name: Json
          slug: string
          sort: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          description?: Json
          id?: string
          name: Json
          slug: string
          sort?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          description?: Json
          id?: string
          name?: Json
          slug?: string
          sort?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_submissions: {
        Row: {
          created_at: string
          email: string
          first_name: string | null
          handled_by: string | null
          id: string
          intent: Database["public"]["Enums"]["enquiry_intent"]
          ip_hash: string | null
          last_name: string | null
          locale: Database["public"]["Enums"]["site_locale"]
          message: string | null
          notes: string | null
          notified_at: string | null
          source_path: string | null
          status: Database["public"]["Enums"]["enquiry_status"]
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          email: string
          first_name?: string | null
          handled_by?: string | null
          id?: string
          intent?: Database["public"]["Enums"]["enquiry_intent"]
          ip_hash?: string | null
          last_name?: string | null
          locale?: Database["public"]["Enums"]["site_locale"]
          message?: string | null
          notes?: string | null
          notified_at?: string | null
          source_path?: string | null
          status?: Database["public"]["Enums"]["enquiry_status"]
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string | null
          handled_by?: string | null
          id?: string
          intent?: Database["public"]["Enums"]["enquiry_intent"]
          ip_hash?: string | null
          last_name?: string | null
          locale?: Database["public"]["Enums"]["site_locale"]
          message?: string | null
          notes?: string | null
          notified_at?: string | null
          source_path?: string | null
          status?: Database["public"]["Enums"]["enquiry_status"]
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_submissions_handled_by_fkey"
            columns: ["handled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      content_blocks: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "content_blocks_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations_private: {
        Row: {
          data: Json
          id: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          data?: Json
          id?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          data?: Json
          id?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      media: {
        Row: {
          alt: Json
          created_at: string
          created_by: string | null
          file_name: string | null
          height: number | null
          id: string
          path: string
          source: string
          width: number | null
        }
        Insert: {
          alt?: Json
          created_at?: string
          created_by?: string | null
          file_name?: string | null
          height?: number | null
          id?: string
          path: string
          source: string
          width?: number | null
        }
        Update: {
          alt?: Json
          created_at?: string
          created_by?: string | null
          file_name?: string | null
          height?: number | null
          id?: string
          path?: string
          source?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "media_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          confirm_token: string
          confirmed_at: string | null
          created_at: string
          email: string
          id: string
          ip_hash: string | null
          last_requested_at: string
          locale: Database["public"]["Enums"]["site_locale"]
          status: Database["public"]["Enums"]["subscriber_status"]
          unsubscribe_token: string
          unsubscribed_at: string | null
          updated_at: string
        }
        Insert: {
          confirm_token?: string
          confirmed_at?: string | null
          created_at?: string
          email: string
          id?: string
          ip_hash?: string | null
          last_requested_at?: string
          locale?: Database["public"]["Enums"]["site_locale"]
          status?: Database["public"]["Enums"]["subscriber_status"]
          unsubscribe_token?: string
          unsubscribed_at?: string | null
          updated_at?: string
        }
        Update: {
          confirm_token?: string
          confirmed_at?: string | null
          created_at?: string
          email?: string
          id?: string
          ip_hash?: string | null
          last_requested_at?: string
          locale?: Database["public"]["Enums"]["site_locale"]
          status?: Database["public"]["Enums"]["subscriber_status"]
          unsubscribe_token?: string
          unsubscribed_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      page_revisions: {
        Row: {
          blocks: Json
          created_at: string
          created_by: string | null
          id: number
          page_id: string
          seo: Json
          title: Json
        }
        Insert: {
          blocks?: Json
          created_at?: string
          created_by?: string | null
          id?: never
          page_id: string
          seo?: Json
          title?: Json
        }
        Update: {
          blocks?: Json
          created_at?: string
          created_by?: string | null
          id?: never
          page_id?: string
          seo?: Json
          title?: Json
        }
        Relationships: []
      }
      pages: {
        Row: {
          blocks: Json
          created_at: string
          draft: Json | null
          id: string
          kind: string
          published: boolean
          published_at: string | null
          seo: Json
          slug: string
          sort: number
          title: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          blocks?: Json
          created_at?: string
          draft?: Json | null
          id?: string
          kind?: string
          published?: boolean
          published_at?: string | null
          seo?: Json
          slug: string
          sort?: number
          title?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          blocks?: Json
          created_at?: string
          draft?: Json | null
          id?: string
          kind?: string
          published?: boolean
          published_at?: string | null
          seo?: Json
          slug?: string
          sort?: number
          title?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          last_seen_at: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          last_seen_at?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          last_seen_at?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: []
      }
      project_media: {
        Row: {
          media_id: string
          project_id: string
          sort: number
        }
        Insert: {
          media_id: string
          project_id: string
          sort?: number
        }
        Update: {
          media_id?: string
          project_id?: string
          sort?: number
        }
        Relationships: [
          {
            foreignKeyName: "project_media_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_media_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          category_id: string
          client: string | null
          created_at: string
          description: Json
          featured: boolean
          id: string
          label: Json
          location: Json
          published: boolean
          seo: Json
          slug: string
          sort: number
          title: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          category_id: string
          client?: string | null
          created_at?: string
          description?: Json
          featured?: boolean
          id?: string
          label?: Json
          location?: Json
          published?: boolean
          seo?: Json
          slug: string
          sort?: number
          title: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          category_id?: string
          client?: string | null
          created_at?: string
          description?: Json
          featured?: boolean
          id?: string
          label?: Json
          location?: Json
          published?: boolean
          seo?: Json
          slug?: string
          sort?: number
          title?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          body: Json
          id: string
          key: string
          note: Json
          sort: number
          title: Json
          updated_at: string
          updated_by: string | null
          visible: boolean
        }
        Insert: {
          body?: Json
          id?: string
          key: string
          note?: Json
          sort?: number
          title: Json
          updated_at?: string
          updated_by?: string | null
          visible?: boolean
        }
        Update: {
          body?: Json
          id?: string
          key?: string
          note?: Json
          sort?: number
          title?: Json
          updated_at?: string
          updated_by?: string | null
          visible?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "services_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          data: Json
          id: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          data?: Json
          id?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          data?: Json
          id?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "site_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      confirm_newsletter: {
        Args: { p_token: string }
        Returns: {
          locale: string
          status: string
        }[]
      }
      has_role: {
        Args: { min_role: Database["public"]["Enums"]["app_role"] }
        Returns: boolean
      }
      mark_contact_notified: { Args: { p_id: string }; Returns: undefined }
      my_role: { Args: never; Returns: Database["public"]["Enums"]["app_role"] }
      submit_contact: {
        Args: {
          p_email: string
          p_first_name?: string
          p_intent?: string
          p_ip_hash?: string
          p_last_name?: string
          p_locale?: string
          p_message?: string
          p_source_path?: string
          p_user_agent?: string
        }
        Returns: string
      }
      subscribe_newsletter: {
        Args: { p_email: string; p_ip_hash?: string; p_locale?: string }
        Returns: {
          confirm_token: string
          created: boolean
          status: string
          unsubscribe_token: string
        }[]
      }
      unsubscribe_newsletter: {
        Args: { p_token: string }
        Returns: {
          locale: string
          status: string
        }[]
      }
    }
    Enums: {
      app_role: "viewer" | "editor" | "admin" | "owner"
      enquiry_intent: "design" | "visualize" | "general"
      enquiry_status: "new" | "read" | "replied" | "archived" | "spam"
      site_locale: "en" | "de" | "es"
      subscriber_status: "pending" | "confirmed" | "unsubscribed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"]
export type TablesInsert<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Insert"]
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Update"]
export type Enums<T extends keyof Database["public"]["Enums"]> = Database["public"]["Enums"][T]
